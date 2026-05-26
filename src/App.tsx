import React, { useState, useRef } from "react";
import { Header } from "./components/Header";
import { 
  FileText, 
  Upload, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  Cpu,
  Layers,
  Flame,
  Activity,
  Github,
  BookOpen,
  Terminal,
  ExternalLink,
  ChevronDown,
  Info
} from "lucide-react";
import { PRESETS } from "./presets";
import { Atom, CellVectors, WannierConfig, CoordinateType, QEParsedData } from "./types";
import { parseQuantumEspresso } from "./utils/parser";

const defaultCell: CellVectors = {
  v1: [0.0, 2.7153, 2.7153],
  v2: [2.7153, 0.0, 2.7153],
  v3: [2.7153, 2.7153, 0.0],
  unit: "angstrom"
};

const defaultAtoms: Atom[] = [
  { id: "si1", symbol: "Si", x: 0.0, y: 0.0, z: 0.0 },
  { id: "si2", symbol: "Si", x: 0.25, y: 0.25, z: 0.25 }
];

const defaultConfig: WannierConfig = {
  num_bands: 16,
  num_wann: 8,
  mp_grid: [4, 4, 4],
  exclude_bands: "",
  
  disentangle: true,
  dis_win_min: -4.0,
  dis_win_max: 16.0,
  dis_froz_min: -4.0,
  dis_froz_max: 6.5,
  dis_num_iter: 100,
  dis_mix_ratio: 0.5,
  
  use_projections: true,
  projections: [
    { id: "p-si", site: "Si", orbitals: ["sp3"] }
  ],
  
  guiding_centres: true,
  num_iter: 100,
  conv_tol: 1e-10,
  conv_window: 3,
  
  plot_bands: true,
  plot_bands_num_kpts: 100,
  wannier_plot: false,
  wannier_plot_supercell: 1,
  
  write_mmn: true,
  write_amn: true,
  write_unk: false
};

export default function App() {
  // Input fields state
  const [scfText, setScfText] = useState("");
  const [nscfText, setNscfText] = useState("");
  const [scfFileName, setScfFileName] = useState<string | null>(null);
  const [nscfFileName, setNscfFileName] = useState<string | null>(null);

  // Parsed physics state
  const [systemName, setSystemName] = useState("Si");
  const [cell, setCell] = useState<CellVectors>(defaultCell);
  const [atoms, setAtoms] = useState<Atom[]>(defaultAtoms);
  const [coordinatesUnit, setCoordinatesUnit] = useState<CoordinateType>("crystal");
  const [config, setConfig] = useState<WannierConfig>(defaultConfig);

  // Component UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState<string | null>(null);
  const [showGithubGuide, setShowGithubGuide] = useState(false);

  const scfRef = useRef<HTMLInputElement>(null);
  const nscfRef = useRef<HTMLInputElement>(null);

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "scf" | "nscf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "scf") {
      setScfFileName(file.name);
    } else {
      setNscfFileName(file.name);
    }

    setIsDemoActive(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (type === "scf") {
        setScfText(text);
      } else {
        setNscfText(text);
      }
    };
    reader.onerror = () => {
      setError(`Failed to read the file '${file.name}'`);
    };
    reader.readAsText(file);
  };

  // Pre-seed Demo
  const handleLoadDemo = (formula: string) => {
    const preset = PRESETS.find(p => p.chemicalFormula === formula);
    if (!preset) return;

    setIsDemoActive(preset.name);
    setScfFileName(`demo_${formula.toLowerCase()}_scf.in`);
    setNscfFileName(`demo_${formula.toLowerCase()}_nscf.in`);
    
    // Simulate raw content
    setScfText(`&SYSTEM
  ibrav = 2, celldm(1) = 10.26,
  nat = ${preset.data.atoms?.length || 2}, ntyp = 1,
  ecutwfc = 30.0,
/
ATOMIC_POSITIONS {crystal}
${preset.data.atoms?.map(a => `${a.symbol} ${a.x} ${a.y} ${a.z}`).join("\n")}`);

    setNscfText(`&SYSTEM
  ibrav = 2, celldm(1) = 10.26,
  nbnd = ${preset.data.nbnd || 16},
/
K_POINTS automatic
${preset.data.mp_grid?.join(" ")} 0 0 0`);

    handleDataParsed(JSON.parse(JSON.stringify(preset.data)));
    setError(null);
  };

  // Core parser dispatcher
  const handleDataParsed = (data: QEParsedData) => {
    if (data.crystalSymbol) {
      setSystemName(data.crystalSymbol);
    }
    if (data.cell) {
      setCell(data.cell);
    }
    if (data.atoms) {
      setAtoms(data.atoms);
    }
    if (data.coordinatesUnit) {
      setCoordinatesUnit(data.coordinatesUnit);
    }

    const updatedConfig = { ...config };
    if (data.nbnd !== undefined) {
      updatedConfig.num_bands = data.nbnd;
    }
    if (data.suggestedNumWann !== undefined) {
      updatedConfig.num_wann = data.suggestedNumWann;
    }
    if (data.mp_grid) {
      updatedConfig.mp_grid = data.mp_grid;
    }
    if (data.suggestedProjections) {
      updatedConfig.projections = data.suggestedProjections;
    } else {
      const uniqueSymbols = Array.from(new Set((data.atoms || atoms).map((a) => a.symbol)));
      updatedConfig.projections = uniqueSymbols.map((sym) => ({
        id: Math.random().toString(36).substr(2, 9),
        site: sym,
        orbitals: sym === "Cu" ? ["d", "s"] : ["sp3"]
      }));
    }

    if (data.fermiEnergy !== undefined) {
      const ef = data.fermiEnergy;
      updatedConfig.dis_win_min = Number((ef - 10.0).toFixed(2));
      updatedConfig.dis_win_max = Number((ef + 8.0).toFixed(2));
      updatedConfig.dis_froz_min = Number((ef - 10.0).toFixed(2));
      updatedConfig.dis_froz_max = Number((ef + 1.5).toFixed(2));
    }

    setConfig(updatedConfig);
  };

  const handleParseAndGenerate = () => {
    if (!scfText && !nscfText) {
      setError("Please select/upload at least one Quantum ESPRESSO output/input file to generate.");
      return;
    }

    setLoading(true);
    setError(null);

    // Completely client-side execution makes this 100% compatible with static GitHub Pages hosting
    setTimeout(() => {
      try {
        const parsedData = parseQuantumEspresso(scfText, nscfText);
        handleDataParsed(parsedData);
      } catch (err: any) {
        setError(err.message || "Parse processing anomaly.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  // Simple automated .win file creation generator
  const generateWinContent = (): string => {
    let output = `## ==========================================================\n`;
    output += `## Wannier90 .win input file generated dynamically\n`;
    output += `## System: ${systemName || "Parsed Material"}\n`;
    output += `## Extracted from: ${scfFileName || "Uploaded SCF"} & ${nscfFileName || "Uploaded NSCF"}\n`;
    output += `## Generated At: ${new Date().toISOString().substring(0, 10)}\n`;
    output += `## ==========================================================\n\n`;

    output += `## --- Core Dimension Parameters ---\n`;
    output += `num_bands        = ${config.num_bands}\n`;
    output += `num_wann         = ${config.num_wann}\n`;
    if (config.exclude_bands) {
      output += `exclude_bands    = ${config.exclude_bands}\n`;
    }
    output += `\n`;

    if (config.disentangle) {
      output += `## --- Disentanglement Energy Windows (eV) ---\n`;
      output += `dis_num_iter     = ${config.dis_num_iter}\n`;
      output += `dis_mix_ratio    = ${config.dis_mix_ratio}\n`;
      output += `dis_win_min      = ${config.dis_win_min}\n`;
      output += `dis_win_max      = ${config.dis_win_max}\n`;
      output += `dis_froz_min     = ${config.dis_froz_min}\n`;
      output += `dis_froz_max     = ${config.dis_froz_max}\n`;
      output += `\n`;
    }

    output += `## --- Maximally Localized Solver Properties ---\n`;
    output += `num_iter         = ${config.num_iter}\n`;
    output += `conv_tol         = ${config.conv_tol}\n`;
    output += `guiding_centres  = true\n\n`;

    output += `## --- Unit Cell Vectors (Cartesian, Angstrom) ---\n`;
    output += `begin unit_cell_cart\n`;
    output += `  ${cell.v1[0].toFixed(8).padStart(12)}  ${cell.v1[1].toFixed(8).padStart(12)}  ${cell.v1[2].toFixed(8).padStart(12)}\n`;
    output += `  ${cell.v2[0].toFixed(8).padStart(12)}  ${cell.v2[1].toFixed(8).padStart(12)}  ${cell.v2[2].toFixed(8).padStart(12)}\n`;
    output += `  ${cell.v3[0].toFixed(8).padStart(12)}  ${cell.v3[1].toFixed(8).padStart(12)}  ${cell.v3[2].toFixed(8).padStart(12)}\n`;
    output += `end unit_cell_cart\n\n`;

    output += `## --- Atomic Species & Positions ---\n`;
    if (coordinatesUnit === "crystal") {
      output += `begin atoms_frac\n`;
    } else {
      output += `begin atoms_cart\n`;
    }
    atoms.forEach((atom) => {
      output += `  ${atom.symbol.padEnd(4)}  ${atom.x.toFixed(8).padStart(12)}  ${atom.y.toFixed(8).padStart(12)}  ${atom.z.toFixed(8).padStart(12)}\n`;
    });
    if (coordinatesUnit === "crystal") {
      output += `end atoms_frac\n\n`;
    } else {
      output += `end atoms_cart\n\n`;
    }

    if (config.projections && config.projections.length > 0) {
      output += `## --- Orbital Projections Specification ---\n`;
      output += `begin projections\n`;
      config.projections.forEach((proj) => {
        output += `  ${proj.site}:${proj.orbitals.join(",")}\n`;
      });
      output += `end projections\n\n`;
    }

    // Monkhorst Pack Grid Coordinate generation
    const nx = config.mp_grid[0];
    const ny = config.mp_grid[1];
    const nz = config.mp_grid[2];
    output += `## --- Monkhorst-Pack K-mesh (${nx}x${ny}x${nz}) ---\n`;
    output += `mp_grid = ${nx} ${ny} ${nz}\n\n`;
    output += `begin kpoints\n`;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        for (let z = 0; z < nz; z++) {
          output += `  ${(x/nx).toFixed(8).padStart(12)} ${(y/ny).toFixed(8).padStart(12)} ${(z/nz).toFixed(8).padStart(12)}\n`;
        }
      }
    }
    output += `end kpoints\n`;

    return output;
  };

  const generatedWin = generateWinContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedWin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedWin], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${systemName || "wannier90"}.win`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-text">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Simple System Intro & Demos picker */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Transform DFT Outputs to Wannier90 Driver Files
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Provide Quantum ESPRESSO Self-Consistent Field (SCF) and Non-Self-Consistent Field (NSCF) inputs/outputs. The system will extract the Hamiltonian parameters, lattice matrix dimensions, coordinates, and electron states to construct the maximally localized Wannier functions input file block.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mr-1">
              Quick Test Demos:
            </span>
            {["Si", "Cu", "C2"].map((element) => (
              <button
                key={element}
                onClick={() => handleLoadDemo(element)}
                className={`py-1.5 px-3 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                  isDemoActive?.includes(element) || (element === "Si" && systemName === "Si" && !scfFileName)
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                {element === "Si" ? "Silicon sp3" : element === "Cu" ? "Copper d-block" : "Graphene 2D"}
              </button>
            ))}
          </div>
        </div>

        {/* GitHub Deployment & Hosting Guide */}
        <div className="bg-slate-900/95 border border-slate-800 text-slate-200 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-800 rounded-xl text-white shadow-inner">
                <Github className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  Host and Hold on GitHub Pages (Free)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  This generator runs 100% in the browser (pure static React SPA). Push to GitHub and deploy statically to GitHub Pages for an instant, permanent scientific tool.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGithubGuide(!showGithubGuide)}
              className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-750 text-white font-mono text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition scale-95 hover:scale-100 cursor-pointer"
            >
              <span>{showGithubGuide ? "Hide Setup Guide" : "Show Setup Guide"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showGithubGuide ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showGithubGuide && (
            <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] font-mono leading-relaxed text-slate-300">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>1. Local Setup Instructions</span>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-slate-400 border border-white/5 space-y-1.5">
                  <p className="text-slate-500"># Clone your GitHub project repository</p>
                  <p className="text-emerald-400">git clone &lt;your-repo-url&gt;</p>
                  <p className="text-emerald-400">cd &lt;project-folder&gt;</p>
                  <p className="text-emerald-400">npm install</p>
                  <p className="text-slate-500 mt-2"># Run the development server locally</p>
                  <p className="text-emerald-400">npm run dev</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>2. Deploy to GitHub Pages in 1 Command</span>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-slate-400 border border-white/5 space-y-1.5">
                  <p className="text-slate-500"># Install the gh-pages tool deployment helper</p>
                  <p className="text-emerald-400">npm install --save-dev gh-pages</p>
                  <p className="text-slate-500 mt-2"># Add these scripts to package.json:</p>
                  <p className="text-slate-300">"predeploy": "npm run build",</p>
                  <p className="text-slate-300">"deploy": "gh-pages -d dist"</p>
                  <p className="text-slate-500 mt-2"># Execute deploy to push your static SPA online!</p>
                  <p className="text-emerald-400 font-bold">npm run deploy</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Master Double-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT: File Uploaders */}
          <div className="space-y-6">
            
            {/* SCF FILE UPLOADER */}
            <div className="bg-white border border-slate-250/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold">1</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    SCF File (Input or Output)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Cell Vectors & Basis Atoms</span>
              </div>

              <div className="p-5 space-y-4">
                <div 
                  onClick={() => scfRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-slate-800 bg-slate-50/40 hover:bg-slate-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    ref={scfRef}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "scf")}
                    accept="*"
                  />
                  <Upload className={`w-6 h-6 mb-2 ${scfFileName ? "text-emerald-500" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold text-slate-700">
                    {scfFileName ? scfFileName : "Select SCF file to upload"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Accepts PWscf input files or computation log files.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Paste raw SCF content manually
                  </label>
                  <textarea
                    value={scfText}
                    onChange={(e) => {
                      setScfText(e.target.value);
                      setIsDemoActive(null);
                    }}
                    placeholder="E.g. cell vectors, ATOMIC_POSITIONS, CELL_PARAMETERS..."
                    className="w-full h-36 bg-slate-50 border border-slate-204 border-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* NSCF FILE UPLOADER */}
            <div className="bg-white border border-slate-250/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-bold">2</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    NSCF File (Input or Output)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Bands & K-Points Grid</span>
              </div>

              <div className="p-5 space-y-4">
                <div 
                  onClick={() => nscfRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-slate-800 bg-slate-50/40 hover:bg-slate-50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    ref={nscfRef}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "nscf")}
                    accept="*"
                  />
                  <Upload className={`w-6 h-6 mb-2 ${nscfFileName ? "text-emerald-500" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold text-slate-700">
                    {nscfFileName ? nscfFileName : "Select NSCF file to upload"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Accepts non-self-consistent field inputs or log files.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Paste raw NSCF content manually
                  </label>
                  <textarea
                    value={nscfText}
                    onChange={(e) => {
                      setNscfText(e.target.value);
                      setIsDemoActive(null);
                    }}
                    placeholder="E.g. nbnd, Monkhorst-Pack grid size, Fermi Energy levels..."
                    className="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Parse & Generate Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleParseAndGenerate}
                disabled={loading || (!scfText && !nscfText)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Code2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{loading ? "PARSING DFT DATA..." : "PARSE INPUTS & GENERATE .WIN"}</span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-800 leading-relaxed text-xs">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold">Parsing Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: Output Wannier90 file */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-emerald-300 flex flex-col h-[755px] justify-between">
            
            {/* Display Header */}
            <div>
              <div className="border-b border-white/10 bg-black/30 px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Wannier90 Input Driver File (Preview)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Auto-compiled formatted block text
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Download .win File"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>

              {/* Extracted Physic stats banner */}
              <div className="bg-slate-950/50 border-b border-white/5 py-2 px-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono text-slate-400">
                <div>Formula: <strong className="text-white">{systemName}</strong></div>
                <div>Atoms count: <strong className="text-white">{atoms.length}</strong></div>
                <div>Bands (num_bands): <strong className="text-white">{config.num_bands}</strong></div>
                <div>Target (num_wann): <strong className="text-white">{config.num_wann}</strong></div>
                <div>Mesh (mp_grid): <strong className="text-white">{config.mp_grid.join("×")}</strong></div>
              </div>
            </div>

            {/* Code Body Textarea */}
            <div className="flex-1 p-5 overflow-hidden">
              <textarea
                value={generatedWin}
                readOnly
                className="w-full h-full bg-transparent border-0 focus:outline-none focus:ring-0 leading-relaxed font-mono text-[11px] resize-none overflow-y-auto text-emerald-300 selection:bg-white/10 focus:ring-transparent"
                style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
              />
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-950/60 p-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">
                Line count: {(generatedWin.match(/\n/g) || []).length + 1} rows
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 hover:bg-white/10 text-white border border-white/10 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy Output"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .win</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      <footer className="border-t border-slate-100 bg-white/60 py-6 mt-12 text-center text-xs text-slate-400 font-mono">
        <p>Wannier90 Driver Generator &copy; 2526 - Built with Quantum ESPRESSO Post-processing specifications</p>
      </footer>
    </div>
  );
}
