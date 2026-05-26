import { Settings2, Layers, Shuffle, Sliders, Eye } from "lucide-react";
import { WannierConfig } from "../types";

interface WannierParamsProps {
  config: WannierConfig;
  onChangeConfig: (config: WannierConfig) => void;
}

export function WannierParams({ config, onChangeConfig }: WannierParamsProps) {

  const handleFieldChange = (key: keyof WannierConfig, val: any) => {
    onChangeConfig({
      ...config,
      [key]: val
    });
  };

  const handleMPGridChange = (index: number, val: string) => {
    const parsed = parseInt(val);
    const updatedGrid = [...config.mp_grid] as [number, number, number];
    updatedGrid[index] = isNaN(parsed) ? 1 : parsed;
    handleFieldChange("mp_grid", updatedGrid);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
      {/* Container Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-800">
          2. Run Control & Solvers Configurations
        </h2>
        <p className="text-xs text-slate-500">
          Tune k-point meshes, target band matrices count, energy levels constraints, and solver iterations.
          <br />
          <span className="text-[10px] text-amber-600 font-mono italic">
            Check bounds: Ensure target Wannier functions ("num_wann") matches the orbitals defined in section 3.
          </span>
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Core Dimensional Bounds */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
              <Layers className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Bands & Hilbert Space dimensions
              </h3>
            </div>

            {/* Total Bands (num_bands) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1" title="num_bands in win file">
                Total Bands (num_bands)
              </label>
              <input
                type="number"
                value={config.num_bands}
                onChange={(e) => handleFieldChange("num_bands", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl p-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total Kohn-Sham states calculated inside QE nscf.
              </span>
            </div>

            {/* Target Wanniers (num_wann) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1" title="num_wann in win file">
                Wannier Orbitals Target (num_wann)
              </label>
              <input
                type="number"
                value={config.num_wann}
                onChange={(e) => handleFieldChange("num_wann", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl p-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Number of maximally localized Wannier functions to construct. Must be ≤ num_bands.
              </span>
            </div>

            {/* Exclude Bands */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1" title="exclude_bands in win">
                Exclude Bands Lists
              </label>
              <input
                type="text"
                value={config.exclude_bands}
                onChange={(e) => handleFieldChange("exclude_bands", e.target.value)}
                placeholder="e.g. 1-4 or 1,2,5-8"
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl p-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Skip inert core bands (e.g., extremely low bound oxygen 1s/2s core states).
              </span>
            </div>

            {/* Monkhorst-Pack Grid (mp_grid) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Monkhorst-Pack K-mesh dimensions (mp_grid)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {config.mp_grid.map((density, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-2.5 top-2 text-[9px] text-slate-400 font-bold select-none font-mono">
                      {["Kx", "Ky", "Kz"][idx]}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={density}
                      onChange={(e) => handleMPGridChange(idx, e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2 text-right focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono text-xs transition-colors"
                    />
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block leading-relaxed">
                Total grid points: <span className="font-bold text-slate-700 font-mono">{config.mp_grid[0] * config.mp_grid[1] * config.mp_grid[2]}</span>. Explicit k-point listing will generate inside the output file!
              </span>
            </div>
          </div>

          {/* Column 2: Window Limits & Disentanglement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-slate-900" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Energy Disentanglement Windows
                </h3>
              </div>
              
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.disentangle}
                  onChange={(e) => handleFieldChange("disentangle", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 hover:bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2 text-[10px] font-bold text-slate-500 font-mono uppercase">
                  {config.disentangle ? "ON" : "OFF"}
                </span>
              </div>
            </div>

            {!config.disentangle ? (
              <div className="bg-slate-50 border border-dashed border-slate-100 rounded-xl p-5 text-center flex flex-col items-center justify-center h-52">
                <Shuffle className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="text-xs font-semibold text-slate-500 mb-1">
                  Disentanglement Disabled
                </h4>
                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Recommended only for fully isolated valence energy manifolds (like pure insulator occupied valence bands with large band gap).
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 font-sans">
                {/* Max Iter for Disentangle */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      dis_num_iter
                    </label>
                    <input
                      type="number"
                      value={config.dis_num_iter}
                      onChange={(e) => handleFieldChange("dis_num_iter", parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 px-2 text-xs font-mono focus:ring-1 focus:ring-slate-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      dis_mix_ratio
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={config.dis_mix_ratio}
                      onChange={(e) => handleFieldChange("dis_mix_ratio", parseFloat(e.target.value) || 0.5)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 px-2 text-xs font-mono focus:ring-1 focus:ring-slate-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200/60 my-2 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block mb-2">
                    Window Bounds (in eV relative to E_Fermi)
                  </span>
                  
                  {/* Outer Window */}
                  <div className="space-y-2 mb-2 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50">
                    <span className="block text-[10px] font-bold text-slate-500">Outer Window (Consider states here)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400">dis_win_min</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Min eV"
                          value={config.dis_win_min}
                          onChange={(e) => handleFieldChange("dis_win_min", e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400">dis_win_max</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Max eV"
                          value={config.dis_win_max}
                          onChange={(e) => handleFieldChange("dis_win_max", e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inner Window */}
                  <div className="space-y-2 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50">
                    <span className="block text-[10px] font-bold text-slate-500">Inner Window (Exact conservation/Frozen)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-400">dis_froz_min</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Min eV"
                          value={config.dis_froz_min}
                          onChange={(e) => handleFieldChange("dis_froz_min", e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400">dis_froz_max</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Max eV"
                          value={config.dis_froz_max}
                          onChange={(e) => handleFieldChange("dis_froz_max", e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Maximial Localization Convergence Parameters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
              <Sliders className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Solver Iteration & Convergences
              </h3>
            </div>

            {/* Total Iterations */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1" title="num_iter">
                Max Wannier Iterations (num_iter)
              </label>
              <input
                type="number"
                value={config.num_iter}
                onChange={(e) => handleFieldChange("num_iter", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl p-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
              />
            </div>

            {/* Convergence Tolerance */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Convergence Tolerance (conv_tol)
              </label>
              <input
                type="number"
                step="1e-12"
                value={config.conv_tol}
                onChange={(e) => handleFieldChange("conv_tol", parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl p-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
              />
            </div>

            {/* Toggle Guiding Centers */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">guiding_centres</span>
                <p className="text-[10px] text-slate-400">Initialize calculations around atomic coordinates centers</p>
              </div>
              <input
                type="checkbox"
                checked={config.guiding_centres}
                onChange={(e) => handleFieldChange("guiding_centres", e.target.checked)}
                className="w-4.5 h-4.5 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
              />
            </div>

            {/* Visualization Toggles */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                Plotting & Output Controls
              </span>
              
              <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                <span className="text-slate-600 font-medium">Bands Dispersion Plot (plot_bands)</span>
                <input
                  type="checkbox"
                  checked={config.plot_bands}
                  onChange={(e) => handleFieldChange("plot_bands", e.target.checked)}
                  className="w-4 h-4 text-emerald-500 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
                <span className="text-slate-600 font-medium">Matrix Elements Output (write_mmn/amn)</span>
                <div className="flex gap-2">
                  <input
                    type="checkbox"
                    title="write_mmn"
                    checked={config.write_mmn}
                    onChange={(e) => handleFieldChange("write_mmn", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <input
                    type="checkbox"
                    title="write_amn"
                    checked={config.write_amn}
                    onChange={(e) => handleFieldChange("write_amn", e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              </label>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
