import { Atom, CellVectors, QEParsedData, Projection } from "../types";

export function parseQuantumEspresso(scfText: string, nscfText: string): QEParsedData {
  const result: QEParsedData = {
    crystalSymbol: "M",
    cell: undefined,
    atoms: [],
    coordinatesUnit: "crystal",
    nbnd: 20,
    numElectrons: 8,
    fermiEnergy: 0.0,
    mp_grid: [4, 4, 4]
  };

  const combined = (scfText + "\n" + nscfText);

  // 1. Try mapping system title / symbol
  const sysMatch = combined.match(/system[\s\S]*?=\s*['"]?(\w+)['"]?/i);
  if (sysMatch) {
    result.crystalSymbol = sysMatch[1];
  } else {
    // deduce from atoms present
    const firstAtomMatch = combined.match(/ATOMIC_POSITIONS[\s\S]*?\n\s*([A-Za-z]+)/i);
    if (firstAtomMatch) {
      result.crystalSymbol = firstAtomMatch[1];
    }
  }

  // 2. Parse cell parameters / units
  const cellMatch = combined.match(/CELL_PARAMETERS\s*\(?(\w*)\)?\s*\n\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*\n\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*\n\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)/i);
  if (cellMatch) {
    const unit = (cellMatch[1].toLowerCase() || "angstrom") as any;
    result.cell = {
      v1: [parseFloat(cellMatch[2]), parseFloat(cellMatch[3]), parseFloat(cellMatch[4])],
      v2: [parseFloat(cellMatch[5]), parseFloat(cellMatch[6]), parseFloat(cellMatch[7])],
      v3: [parseFloat(cellMatch[8]), parseFloat(cellMatch[9]), parseFloat(cellMatch[10])],
      unit: unit.includes("ang") ? "angstrom" : unit.includes("bohr") ? "bohr" : "angstrom"
    };
  } else {
    const ax1 = combined.match(/a\(1\)\s*=\s*\(\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*\)/i);
    const ax2 = combined.match(/a\(2\)\s*=\s*\(\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*\)/i);
    const ax3 = combined.match(/a\(3\)\s*=\s*\(\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s*\)/i);
    if (ax1 && ax2 && ax3) {
      result.cell = {
        v1: [parseFloat(ax1[1]), parseFloat(ax1[2]), parseFloat(ax1[3])],
        v2: [parseFloat(ax2[1]), parseFloat(ax2[2]), parseFloat(ax2[3])],
        v3: [parseFloat(ax3[1]), parseFloat(ax3[2]), parseFloat(ax3[3])],
        unit: "angstrom"
      };
    }
  }

  // 3. Parse atoms / atomic positions
  const posRegex = /ATOMIC_POSITIONS\s*\(?([\w\d_]*)\)?\s*\n([\s\S]*?)(?=(?:\n\s*[A-Z_]+)|\n\s*$|\n\s*K_POINTS|\n\s*CELL_PARAMETERS)/gi;
  let posBlockMatch;
  let atomsFound = false;

  while ((posBlockMatch = posRegex.exec(combined)) !== null) {
    const unit = (posBlockMatch[1] || "").toLowerCase();
    result.coordinatesUnit = unit.includes("cryst") ? "crystal" : unit.includes("ang") ? "angstrom" : unit.includes("bohr") ? "bohr" : "crystal";
    
    const lines = posBlockMatch[2].split("\n");
    const parsedAtoms: Atom[] = [];
    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const symbol = parts[0];
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && symbol.match(/^[a-zA-Z]/)) {
          parsedAtoms.push({
            id: Math.random().toString(36).substr(2, 9),
            symbol,
            x,
            y,
            z
          });
        }
      }
    });

    if (parsedAtoms.length > 0) {
      result.atoms = parsedAtoms;
      atomsFound = true;
    }
  }

  if (!atomsFound) {
    const outPosMatches = combined.match(/site\s+n\.\s+atom\s+local\s+car\.\s+pos\.\s*\((?:alat|bohr|angstrom)\)\s*\n([\s\S]*?)(?=\n\s*\n|\n\s*number|\n\s*K_POINTS|\n\s*$)/i);
    if (outPosMatches) {
      const lines = outPosMatches[1].split("\n");
      const parsedAtoms: Atom[] = [];
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const symbol = parts[1];
          const x = parseFloat(parts[6]);
          const y = parseFloat(parts[7]);
          const z = parseFloat(parts[8]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            parsedAtoms.push({
              id: Math.random().toString(36).substr(2, 9),
              symbol,
              x,
              y,
              z
            });
          }
        }
      });
      if (parsedAtoms.length > 0) {
        result.atoms = parsedAtoms;
        result.coordinatesUnit = "crystal";
      }
    }
  }

  // 4. Parse bands & electrons
  const nbndMatch = combined.match(/(?:number of Kohn-Sham states|nbnd)\s*=\s*(\d+)/i);
  if (nbndMatch) {
    result.nbnd = parseInt(nbndMatch[1]);
  }
  const elecMatch = combined.match(/(?:number of electrons|nelec)\s*=\s*([\d\.]+)/i);
  if (elecMatch) {
    result.numElectrons = Math.round(parseFloat(elecMatch[1]));
  }
  const fermiMatch = combined.match(/(?:the Fermi energy is|Fermi energy|fermi level)\s*(-?[\d\.]+)\s*ev/i);
  if (fermiMatch) {
    result.fermiEnergy = parseFloat(fermiMatch[1]);
  }

  // 5. Parse K-points grid size
  const kgridMatch = combined.match(/K_POINTS\s*\{?(?:automatic|auto)\}?\s*\n\s*(\d+)\s+(\d+)\s+(\d+)/i);
  if (kgridMatch) {
    result.mp_grid = [parseInt(kgridMatch[1]), parseInt(kgridMatch[2]), parseInt(kgridMatch[3])];
  } else {
    const gridMatch2 = combined.match(/Monkhorst-Pack grid:\s*(\d+)\s+(\d+)\s+(\d+)/i);
    if (gridMatch2) {
      result.mp_grid = [parseInt(gridMatch2[1]), parseInt(gridMatch2[2]), parseInt(gridMatch2[3])];
    }
  }

  // Fallbacks & suggestions
  if (result.atoms && result.atoms.length > 0) {
    result.suggestedNumWann = result.atoms.length * 4;
    result.suggestedProjections = Array.from(new Set(result.atoms.map((a: any) => a.symbol))).map((sym: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      site: sym,
      orbitals: ["sp3"]
    }));
  }

  if (!result.cell) {
    result.cell = {
      v1: [5.43, 0.0, 0.0],
      v2: [0.0, 5.43, 0.0],
      v3: [0.0, 0.0, 5.43],
      unit: "angstrom"
    };
  }

  return result;
}
