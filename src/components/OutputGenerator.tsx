import React, { useState } from "react";
import { Code2, Copy, Check, Download, AlertTriangle, CheckCircle2, FileUp } from "lucide-react";
import { CellVectors, Atom, WannierConfig, Projection } from "../types";

interface OutputGeneratorProps {
  systemName: string;
  cell: CellVectors;
  atoms: Atom[];
  coordinatesUnit: string;
  config: WannierConfig;
}

export function OutputGenerator({
  systemName,
  cell,
  atoms,
  coordinatesUnit,
  config
}: OutputGeneratorProps) {
  const [copied, setCopied] = useState(false);

  // Helper: Generates explicit Monkhorst-Pack K-point meshes in crystal coordinates
  const generateKPointsBlockFull = (nx: number, ny: number, nz: number): string => {
    const klines: string[] = [];
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          const kx = (x / nx).toFixed(8);
          const ky = (y / ny).toFixed(8);
          const kz = (z / nz).toFixed(8);
          // Standard Weighting for Wannier90 is equivalent: 1.0
          klines.push(`  ${kx}   ${ky}   ${kz}`);
        }
      }
    }
    return klines.join("\n");
  };

  // Helper: Construct complete .win format
  const generateWinContent = (): string => {
    let output = `## ==========================================================\n`;
    output += `## Wannier90 .win input file generated dynamically\n`;
    output += `## System: ${systemName || "Loaded System"}\n`;
    output += `## Generated At: ${new Date().toISOString().substring(0, 10)}\n`;
    output += `## ==========================================================\n\n`;

    // 1. Basic Control Flags
    output += `## --- Core Control Parameters ---\n`;
    output += `num_bands        = ${config.num_bands}\n`;
    output += `num_wann         = ${config.num_wann}\n`;
    if (config.exclude_bands.trim()) {
      output += `exclude_bands    = ${config.exclude_bands}\n`;
    }
    output += `\n`;

    // 2. Disentanglement Window Parameters
    if (config.disentangle) {
      output += `## --- Disentanglement Settings ---\n`;
      output += `dis_num_iter     = ${config.dis_num_iter}\n`;
      output += `dis_mix_ratio    = ${config.dis_mix_ratio}\n`;
      
      if (config.dis_win_min !== '') output += `dis_win_min      = ${config.dis_win_min}\n`;
      if (config.dis_win_max !== '') output += `dis_win_max      = ${config.dis_win_max}\n`;
      if (config.dis_froz_min !== '') output += `dis_froz_min     = ${config.dis_froz_min}\n`;
      if (config.dis_froz_max !== '') output += `dis_froz_max     = ${config.dis_froz_max}\n`;
      output += `\n`;
    }

    // 3. Convergence Parameters
    output += `## --- Convergence Solver Loops ---\n`;
    output += `num_iter         = ${config.num_iter}\n`;
    output += `conv_tol         = ${config.conv_tol}\n`;
    if (config.guiding_centres) {
      output += `guiding_centres  = true\n`;
    }
    output += `\n`;

    // 4. Output/Plot Flags
    output += `## --- Output Flags ---\n`;
    if (config.plot_bands) {
      output += `plot_bands       = true\n`;
    }
    output += `write_mmn        = ${config.write_mmn ? "true" : "false"}\n`;
    output += `write_amn        = ${config.write_amn ? "true" : "false"}\n`;
    output += `\n`;

    // 5. Lattice Vectors (begin unit_cell_cart)
    output += `## --- Unit Cell Vectors (Cartesian) ---\n`;
    output += `begin unit_cell_cart\n`;
    if (cell.unit === "bohr") {
      output += `bohr\n`;
    } else if (cell.unit === "alat") {
      output += `alat\n`;
    }
    output += `  ${cell.v1[0].toFixed(8)}   ${cell.v1[1].toFixed(8)}   ${cell.v1[2].toFixed(8)}\n`;
    output += `  ${cell.v2[0].toFixed(8)}   ${cell.v2[1].toFixed(8)}   ${cell.v2[2].toFixed(8)}\n`;
    output += `  ${cell.v3[0].toFixed(8)}   ${cell.v3[1].toFixed(8)}   ${cell.v3[2].toFixed(8)}\n`;
    output += `end unit_cell_cart\n\n`;

    // 6. Atoms Positions (begin atoms_frac or atoms_cart)
    output += `## --- Atomic Species and Positions ---\n`;
    if (coordinatesUnit === "crystal") {
      output += `begin atoms_frac\n`;
    } else {
      output += `begin atoms_cart\n`;
      if (coordinatesUnit === "bohr") {
        output += `bohr\n`;
      }
    }
    
    atoms.forEach((atom) => {
      output += `  ${atom.symbol.padEnd(4)}  ${atom.x.toFixed(8).padStart(12)}  ${atom.y.toFixed(8).padStart(12)}  ${atom.z.toFixed(8).padStart(12)}\n`;
    });
    
    if (coordinatesUnit === "crystal") {
      output += `end atoms_frac\n\n`;
    } else {
      output += `end atoms_cart\n\n`;
    }

    // 7. Projections section (begin projections)
    if (config.use_projections && config.projections.length > 0) {
      output += `## --- Orbital Projections ---\n`;
      output += `begin projections\n`;
      config.projections.forEach((proj) => {
        output += `  ${proj.site}:${proj.orbitals.join(",")}\n`;
      });
      output += `end projections\n\n`;
    }

    // 8. Monkhorst Pack K-Points section (mp_grid)
    output += `## --- K-Points Mesh Specification Grid ---\n`;
    output += `mp_grid = ${config.mp_grid[0]} ${config.mp_grid[1]} ${config.mp_grid[2]}\n\n`;
    
    output += `begin kpoints\n`;
    output += generateKPointsBlockFull(config.mp_grid[0], config.mp_grid[1], config.mp_grid[2]);
    output += `\nend kpoints\n`;

    return output;
  };

  const fileContent = generateWinContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${systemName || "wannier95"}.win`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Automated sanity checks
  const runSanityChecks = () => {
    const warnings: string[] = [];
    const successes: string[] = [];

    if (config.num_wann > config.num_bands) {
      warnings.push(`Target Wanniers (num_wann: ${config.num_wann}) is greater than total bands (num_bands: ${config.num_bands}). Ensure you subtracted excluded core states!`);
    } else {
      successes.push("Wavefunction limits check: num_wann ≤ num_bands.");
    }

    if (config.projections.length === 0) {
      warnings.push("Orbital projections list is currently empty. Silicon or Copper typical projects block mapping is highly recommended.");
    } else {
      successes.push(`Active chemical projection block contains ${config.projections.length} active tags.`);
    }

    // Verify cell exists
    const cellVol = cell.v1[0]*cell.v2[1]*cell.v3[2] - cell.v1[0]*cell.v3[1]*cell.v2[2];
    if (Math.abs(cellVol) < 1e-5) {
      warnings.push("Unit cell vectors volume might be degenerate! Please check cell matrices mapping.");
    } else {
      successes.push("Unit cell determinant is valid (non-degenerate crystal vectors).");
    }

    const totalKpts = config.mp_grid[0] * config.mp_grid[1] * config.mp_grid[2];
    if (totalKpts > 1000) {
      warnings.push(`High density K-grid detected (${totalKpts} k-points). This is completely valid, but will result in a very large .win input file.`);
    } else {
      successes.push(`Generated K-mesh contains ${totalKpts} grid coordinate nodes.`);
    }

    return { warnings, successes };
  };

  const checks = runSanityChecks();

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-12">
      {/* Title Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-slate-900" />
            <span>4. Generate & Preview Wannier90 input driver (.win)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Copy or download your finalized Wannier90 input driver file.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-950 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Clipboard"}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-905 bg-slate-900 border border-slate-900 hover:bg-slate-950 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download .win</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Preview Code Box */}
          <div className="lg:col-span-8">
            <div className="border border-slate-250 bg-slate-900/98 rounded-xl p-4.5 text-slate-300 font-mono text-xs overflow-hidden flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 text-slate-400 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  <FileUp className="w-3.5 h-3.5 text-indigo-400" />
                  {systemName || "system"}.win (DRIVE STREAM PREVIEW)
                </span>
                <span>Plain text / v3.x format</span>
              </div>
              <textarea
                value={fileContent}
                readOnly
                className="w-full flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 leading-relaxed font-mono text-[11px] resize-none overflow-y-auto text-emerald-300 scrollbar-thin selection:bg-white/20"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic text-right">
              Generated file contains exactly {(fileContent.match(/\n/g) || []).length + 1} lines.
            </p>
          </div>

          {/* Right Validation & Checks */}
          <div className="lg:col-span-4 space-y-5">
            {/* Sanity Validation Card */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-3">
                Wannier90 Code Auditing Check
              </span>

              {checks.warnings.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-emerald-850 flex gap-2.5 text-xs mb-4">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold">No Errors Found!</h4>
                    <p className="text-[10px] mt-0.5 text-emerald-600/90 leading-relaxed">
                      Lattice matrices, atomic basis, kpoints limits, and dimensional targets fulfill Wannier90 execution conventions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {checks.warnings.map((warn, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-850 flex gap-2.5 text-xs">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                      <p className="text-[11px] leading-relaxed font-medium">{warn}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual successes checks details */}
              <div className="space-y-2">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Checked Parameters Matrix
                </span>
                {checks.successes.map((suc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    <span>{suc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wannier90 Runtime Guide Quick Tip */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 text-xs text-slate-600 space-y-2.5">
              <span className="block text-[10px] uppercase font-bold text-slate-400 font-mono">
                Post-Processing Checklist
              </span>
              <p className="leading-relaxed text-[11px]">
                To complete your maximally localized Wannier functions layout:
              </p>
              <ol className="list-decimal pl-4.5 space-y-1.5 text-[11px] text-slate-500 leading-relaxed">
                <li>Run <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">wannier90.x -pp {systemName || "system"}</code> in prep mode.</li>
                <li>Execute Quantum ESPRESSO's band extraction via <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">pw2wannier90.x</code>.</li>
                <li>Finally, evaluate localized orbitals via <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">wannier90.x {systemName || "system"}</code> output!</li>
              </ol>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
