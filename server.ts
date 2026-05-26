import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limit for large output file uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Local lightweight regex-based parse fallback for reliability
function parseQELocally(scfText: string, nscfText: string) {
  const result: any = {
    crystalSymbol: "M",
    cell: null,
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
  }

  // 2. Parse cell parameters / units
  // CELL_PARAMETERS (unit) or cell vectors in output
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
    // Look for crystal axes from output format e.g. "a(1) = ( 1.0  0.0  0.0 )"
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
    const parsedAtoms: any[] = [];
    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const symbol = parts[0];
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
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
      atomsFound = true;
    }
  }

  // If output-based, parse from atomic positions lines
  if (!atomsFound) {
    const outPosMatches = combined.matchAll(/site\s+n\.\s+atom\s+local\s+car\.\s+pos\.\s*\((?:alat|bohr|angstrom)\)\s*\n([\s\S]*?)(?=\n\s*\n|\n\s*number|\n\s*K_POINTS|\n\s*$)/gi);
    for (const match of outPosMatches) {
      const lines = match[1].split("\n");
      const parsedAtoms: any[] = [];
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          // output format: n atom   local  car. pos.
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

  // Set default suggested numbers
  result.suggestedNumWann = result.atoms.length > 0 ? result.atoms.length * 4 : 4;
  result.suggestedProjections = Array.from(new Set(result.atoms.map((a: any) => a.symbol))).map((sym: any) => ({
    id: Math.random().toString(36).substr(2, 9),
    site: sym,
    orbitals: ["sp3"]
  }));

  if (!result.cell) {
    // default cubic test system
    result.cell = {
      v1: [5.43, 0.0, 0.0],
      v2: [0.0, 5.43, 0.0],
      v3: [0.0, 0.0, 5.43],
      unit: "angstrom"
    };
  }

  return result;
}

// REST route to parse Quantum ESPRESSO files
app.post("/api/parse-qe", async (req, res) => {
  const { scfContent, nscfContent } = req.body;

  if (!scfContent && !nscfContent) {
    return res.status(400).json({ error: "Missing file content to parse." });
  }

  console.log("Parsing QE files. SCF length:", scfContent?.length || 0, "NSCF length:", nscfContent?.length || 0);

  // Try parsing with Gemini first if the key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getGeminiClient();
      const prompt = `
Please carefully parse the following material system's Quantum ESPRESSO input and/or output file contents.
Extract the crystallographic structures, lattice dimensions, atomic coordinates, number of elements, bands, electrons, and parameters.
Then map them into a JSON object matching the requested schema.

SCF file content fragment/full:
${scfContent ? scfContent.substring(0, 50000) : "N/A"}

NSCF file content fragment/full:
${nscfContent ? nscfContent.substring(0, 50000) : "N/A"}

Note for projections: suggest sensible projections for Wannier90 inputs. E.g., for standard semiconductors (like Si, GaAs), sp3 or s, p is ideal. For transition metals (like Fe, Cu), d or sp3d2 are ideal. Set a reasonable suggested number of Wannier functions (suggestedNumWann) based on electrons/bands. For example, search for number of electrons (or bands around the Fermi level). If it has 8 valence electrons, we typically want 4 Wannier functions.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert materials scientist and computing parser. Extract crystalline lattice constants, atomic types and positions, and electron band details, and strictly return a JSON object containing the values according to the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crystalSymbol: {
                type: Type.STRING,
                description: "Primary Chemical Formula or Crystal name (e.g. Si, Fe, BaTiO3)"
              },
              cell: {
                type: Type.OBJECT,
                description: "Unit cell parameters forming the 3 vector matrices of lattice vectors.",
                properties: {
                  v1: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "x, y, z of 1st lattice vector" },
                  v2: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "x, y, z of 2nd lattice vector" },
                  v3: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "x, y, z of 3rd lattice vector" },
                  unit: { type: Type.STRING, description: "unit of lattice parameters, must be 'angstrom', 'bohr', or 'alat'" }
                },
                required: ["v1", "v2", "v3", "unit"]
              },
              atoms: {
                type: Type.ARRAY,
                description: "The list of atoms in the system with their coordinate positions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING, description: "Atomic element symbol like Si, Fe, O" },
                    x: { type: Type.NUMBER, description: "Normalized or cartesian positional coordinate X" },
                    y: { type: Type.NUMBER, description: "Normalized or cartesian positional coordinate Y" },
                    z: { type: Type.NUMBER, description: "Normalized or cartesian positional coordinate Z" }
                  },
                  required: ["symbol", "x", "y", "z"]
                }
              },
              coordinatesUnit: {
                type: Type.STRING,
                description: "Unit type of atomic coordinates, must be 'crystal', 'angstrom', or 'bohr'"
              },
              nbnd: {
                type: Type.INTEGER,
                description: "Extract the number of bands (nbnd). Defaults to 20 if unclear."
              },
              numElectrons: {
                type: Type.NUMBER,
                description: "The exact number of valence electrons."
              },
              fermiEnergy: {
                type: Type.NUMBER,
                description: "The calculated Fermi Energy in eV (if present)."
              },
              mp_grid: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Monkhorst-Pack K-points automatic grid, like [8, 8, 8] or [4, 4, 4]"
              },
              suggestedNumWann: {
                type: Type.INTEGER,
                description: "Wannier90 suggested value of num_wann. For instance, half the valence electrons (number of bonding states) or count of orbitals."
              },
              suggestedProjections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    site: { type: Type.STRING, description: "Element symbol (e.g. Si) or coordinate or indices" },
                    orbitals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of orbitals, e.g. ['sp3'] or ['s','p']" }
                  },
                  required: ["site", "orbitals"]
                }
              }
            }
          }
        }
      });

      const parsedJson = JSON.parse(response.text.trim());
      
      // Inject IDs into the parsed atoms and projection results
      if (parsedJson.atoms) {
        parsedJson.atoms = parsedJson.atoms.map((a: any) => ({
          ...a,
          id: Math.random().toString(36).substr(2, 9),
        }));
      }
      if (parsedJson.suggestedProjections) {
        parsedJson.suggestedProjections = parsedJson.suggestedProjections.map((p: any) => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
        }));
      } else {
        parsedJson.suggestedProjections = [];
      }

      console.log("Gemini parsed successfully! Found", parsedJson.atoms?.length || 0, "atoms.");
      return res.json(parsedJson);

    } catch (err: any) {
      console.warn("Gemini parsing failed. Falling back to local pattern parser. Error:", err.message);
      // Fallback
      const localResult = parseQELocally(scfContent || "", nscfContent || "");
      return res.json({
        ...localResult,
        warning: "Calculated via fallback local parser: " + err.message
      });
    }
  } else {
    console.log("No GEMINI_API_KEY detected. Running local regex parser fallback.");
    const localResult = parseQELocally(scfContent || "", nscfContent || "");
    return res.json(localResult);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Wannier90 Driver API] Server running on http://localhost:${PORT}`);
  });
}

startServer();
