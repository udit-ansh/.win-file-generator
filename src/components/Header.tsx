import { Atom, Compass, Layers, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
              <Atom className="w-8 h-8 animate-pulse text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                Wannier90 Input Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-mono">
                Quantum ESPRESSO SCF/NSCF to .win File Driver
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 font-mono">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>{"DFT ➔ MLWFs"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>QE v7.0+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Wannier90 v3.x Compatible</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
