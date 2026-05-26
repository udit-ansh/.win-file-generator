import React from "react";
import { BookOpen, Compass, ChevronRight, BarChart2, Zap } from "lucide-react";

export function InfoGuide() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-12">
      {/* Container Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-900" />
          <span>Wannier90 Driver Construction & Physics Guide</span>
        </h2>
        <p className="text-xs text-slate-550">
          A short tutorial on density functional theory post-processing, disentanglement, and crystal coordinates.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theory and Coordinates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-1.5 border-b border-slate-150">
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>Bloch States to Wannier Functions</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              In crystalline materials simulations (like Quantum ESPRESSO PWscf), solutions of the Schrödinger equation are represented as delocalized <strong>Bloch eigenstates</strong> extending over the entire crystal lattice.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Maximally Localized Wannier Functions (MLWFs)</strong> represent a real-space local orbital basis (chemically intuitive like s, p, d orbitals or covalent bonds) constructed by performing a unitary transformation on these Bloch states.
            </p>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 mt-4 text-[11px] font-sans text-slate-600">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                Key Parameters Definitions:
              </h4>
              <ul className="space-y-1.5 pl-4.5 list-disc leading-relaxed text-[11.5px] text-slate-500">
                <li>
                  <strong className="text-slate-800 font-mono">num_bands:</strong> Total number of electronic bands extracted from the nscf calculation.
                </li>
                <li>
                  <strong className="text-slate-800 font-mono">num_wann:</strong> Number of target Wannier functions. Must match the total number of projections (e.g., 4 projections for an sp3 orbital hybrid, or 5 for d orbitals).
                </li>
                <li>
                  <strong className="text-slate-800 font-mono">mp_grid:</strong> The dimension grid coordinates mesh size. Wannier90 uses this to define real-space translational loops.
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Energy Windows Chart Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-1.5 border-b border-slate-150">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <span>Disentanglement & Energy Windows Schema</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              When target bands are entangled in a manifold (e.g. conduction bands or copper d-states mixed with s-states), you must perform <strong>disentanglement</strong>. This is controlled by energy windows relative to the Fermi energy (<code className="font-mono text-xs bg-slate-100 px-1 text-slate-700">E_F</code>):
            </p>

            {/* SVG Visual graph diagram */}
            <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-white relative font-mono text-[10px]">
              <span className="absolute top-2 left-2.5 text-[9px] uppercase font-bold text-slate-500">
                Energy Level Constraints (eV)
              </span>

              {/* Schematic graph rendering */}
              <svg className="w-full h-44 mt-3" viewBox="0 0 400 160">
                {/* Axes */}
                <line x1="40" y1="10" x2="40" y2="140" stroke="#475569" strokeWidth="2" />
                <line x1="40" y1="140" x2="380" y2="140" stroke="#475569" strokeWidth="1.5" />
                <text x="15" y="15" fill="#94a3b8" fontSize="9">Energy (eV)</text>
                <text x="310" y="150" fill="#94a3b8" fontSize="9">Density of States (DOS)</text>

                {/* Fermi Level */}
                <line x1="40" y1="75" x2="360" y2="75" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="315" y="71" fill="#ec4899" fontSize="9" fontWeight="bold">E_Fermi (0.0 eV)</text>

                {/* Outer Window (dis_win_min to dis_win_max) */}
                <rect x="42" y="25" width="230" height="100" fill="#3b82f6" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
                <text x="50" y="36" fill="#3b82f6" fontSize="9" fontWeight="bold">Outer Window (dis_win)</text>
                <line x1="35" y1="25" x2="40" y2="25" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="8" y="28" fill="#3b82f6" fontSize="9">dis_win_max</text>
                
                <line x1="35" y1="125" x2="40" y2="125" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="8" y="128" fill="#3b82f6" fontSize="9">dis_win_min</text>

                {/* Inner Frozen Window (dis_froz_min to dis_froz_max) */}
                <rect x="42" y="55" width="160" height="45" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeWidth="1.5" />
                <text x="50" y="66" fill="#10b981" fontSize="9" fontWeight="bold">Frozen Window (dis_froz)</text>
                
                <line x1="35" y1="55" x2="40" y2="55" stroke="#10b981" strokeWidth="1.5" />
                <text x="8" y="58" fill="#10b981" fontSize="9">dis_froz_max</text>

                <line x1="35" y1="100" x2="40" y2="100" stroke="#10b981" strokeWidth="1.5" />
                <text x="8" y="103" fill="#10b981" fontSize="9">dis_froz_min</text>

                {/* DOS curves or band line schematics */}
                <path d="M 40,115 C 100,105 150,115 150,120 S 200,98 250,110 S 300,60 300,74 S 320,12 360,15" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
              </svg>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic mt-1">
              *Note: The inner (frozen) window ensures that the physical bands are preserved <strong>exactly</strong> as calculated by DFT inside that energy range. The outer window identifies all eigenstates that participate in the localization optimizer.
            </p>
          </div>
        </div>

        {/* Footnote callout info */}
        <div className="flex border-t border-slate-100 pt-5 mt-6 gap-3 py-1 items-start text-xs text-slate-500 leading-relaxed">
          <Zap className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <p>
            <strong>Pro Tip:</strong> When setting up coordinates in Wannier90, <code className="bg-slate-50 text-slate-800 px-1 font-mono">begin atoms_frac</code> is usually much more stable than Cartesian representation since it naturally scales when you optimize or modify lattice dimensions without changing the absolute real-space positions manually!
          </p>
        </div>
      </div>
    </div>
  );
}
