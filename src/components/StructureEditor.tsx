import React from "react";
import { Plus, Trash2, HelpCircle, Activity, Globe } from "lucide-react";
import { CellVectors, Atom, CoordinateType } from "../types";

interface StructureEditorProps {
  cell: CellVectors;
  atoms: Atom[];
  coordinatesUnit: CoordinateType;
  onChangeCell: (cell: CellVectors) => void;
  onChangeAtoms: (atoms: Atom[]) => void;
  onChangeCoordinatesUnit: (unit: CoordinateType) => void;
}

export function StructureEditor({
  cell,
  atoms,
  coordinatesUnit,
  onChangeCell,
  onChangeAtoms,
  onChangeCoordinatesUnit
}: StructureEditorProps) {

  // Update a cell vector element
  const handleCellVectorChange = (vector: "v1" | "v2" | "v3", index: number, val: string) => {
    const parsed = parseFloat(val);
    const updated = { ...cell };
    updated[vector][index] = isNaN(parsed) ? 0 : parsed;
    onChangeCell(updated);
  };

  const handleCellUnitChange = (val: "angstrom" | "bohr" | "alat") => {
    onChangeCell({
      ...cell,
      unit: val
    });
  };

  // Update specific atom values
  const handleAtomChange = (id: string, key: "symbol" | "x" | "y" | "z", val: string) => {
    const updatedAtoms = atoms.map((atom) => {
      if (atom.id === id) {
        if (key === "symbol") {
          return { ...atom, symbol: val };
        } else {
          const parsed = parseFloat(val);
          return { ...atom, [key]: isNaN(parsed) ? 0 : parsed };
        }
      }
      return atom;
    });
    onChangeAtoms(updatedAtoms);
  };

  const handleDeleteAtom = (id: string) => {
    const filtered = atoms.filter((a) => a.id !== id);
    onChangeAtoms(filtered);
  };

  const handleAddAtom = () => {
    const newAtom: Atom = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: "Si",
      x: 0.0,
      y: 0.0,
      z: 0.0
    };
    onChangeAtoms([...atoms, newAtom]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Cell Vectors Column */}
      <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Unit Cell Latice Matrices
              </h3>
            </div>
            
            <select
              value={cell.unit}
              onChange={(e) => handleCellUnitChange(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono text-slate-600 font-semibold"
            >
              <option value="angstrom">Angstrom (Å)</option>
              <option value="bohr">Bohr (a₀)</option>
              <option value="alat">Alat units</option>
            </select>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Defines the unit cell spanning vector matrices (<code>begin unit_cell_cart</code>) for the system:
          </p>

          <div className="space-y-4 font-mono text-xs">
            {/* Vector 1 */}
            <div>
              <span className="block font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Vector 1 (v1)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {cell.v1.map((val, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold select-none">
                      {["X", "Y", "Z"][idx]}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handleCellVectorChange("v1", idx, e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg py-1.5 pl-7 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono font-medium text-slate-800 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Vector 2 */}
            <div>
              <span className="block font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Vector 2 (v2)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {cell.v2.map((val, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold select-none">
                      {["X", "Y", "Z"][idx]}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handleCellVectorChange("v2", idx, e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg py-1.5 pl-7 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono font-medium text-slate-800 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Vector 3 */}
            <div>
              <span className="block font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Vector 3 (v3)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {cell.v3.map((val, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold select-none">
                      {["X", "Y", "Z"][idx]}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handleCellVectorChange("v3", idx, e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg py-1.5 pl-7 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono font-medium text-slate-800 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex gap-2 text-[11px] text-slate-400 leading-relaxed font-sans">
          <HelpCircle className="w-5 h-5 shrink-0 text-slate-300" />
          <span>Wannier90 writes crystal lattice blocks in Cartesian form. Real cell dimensions are extracted from this 3x3 matrix in 10^-10m (Angstrom) scale.</span>
        </div>
      </div>

      {/* Atomic Positions Column */}
      <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800">
                Atomic Basis Coordinates
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Positions Format:</span>
              <select
                value={coordinatesUnit}
                onChange={(e) => onChangeCoordinatesUnit(e.target.value as CoordinateType)}
                className="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono text-slate-600 font-semibold"
              >
                <option value="crystal">Fractional / Crystal</option>
                <option value="angstrom">Angstrom (Å)</option>
                <option value="bohr">Bohr (a₀)</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Coordinate array (molecular atomic coordinates configuration map representing <code>atoms_frac</code> or <code>atoms_cart</code> block) for each atom:
          </p>

          <div className="max-h-[295px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3 select-none w-20">Element</th>
                  <th className="py-2.5 px-3 select-none text-center">X Coordinate</th>
                  <th className="py-2.5 px-3 select-none text-center">Y Coordinate</th>
                  <th className="py-2.5 px-3 select-none text-center">Z Coordinate</th>
                  <th className="py-2.5 px-3 select-none w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {atoms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No atoms loaded. Tap "Add Atom" to create a species site.
                    </td>
                  </tr>
                ) : (
                  atoms.map((atom) => (
                    <tr key={atom.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={atom.symbol}
                          onChange={(e) => handleAtomChange(atom.id, "symbol", e.target.value)}
                          className="w-14 font-bold text-center bg-slate-50 border border-slate-200 rounded py-1 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-999 uppercase"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          value={atom.x}
                          onChange={(e) => handleAtomChange(atom.id, "x", e.target.value)}
                          className="w-full text-right bg-slate-50 hover:bg-slate-100 focus:bg-white transition-colors border border-slate-200 rounded py-1 px-1.5"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          value={atom.y}
                          onChange={(e) => handleAtomChange(atom.id, "y", e.target.value)}
                          className="w-full text-right bg-slate-50 hover:bg-slate-100 focus:bg-white transition-colors border border-slate-200 rounded py-1 px-1.5"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="any"
                          value={atom.z}
                          onChange={(e) => handleAtomChange(atom.id, "z", e.target.value)}
                          className="w-full text-right bg-slate-50 hover:bg-slate-100 focus:bg-white transition-colors border border-slate-200 rounded py-1 px-1.5"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteAtom(atom.id)}
                          className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-xs text-slate-500 font-semibold">
            Sites count: <strong className="text-slate-800 font-mono">{atoms.length}</strong> atoms
          </span>
          <button
            onClick={handleAddAtom}
            className="px-3.5 py-1.5 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-950 bg-white font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Basis Site</span>
          </button>
        </div>
      </div>
    </div>
  );
}
