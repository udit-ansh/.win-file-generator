import React, { useState, useRef } from "react";
import { Upload, FileText, Database, Code, Check, AlertCircle, RefreshCw } from "lucide-react";
import { PRESETS, Preset } from "../presets";
import { QEParsedData } from "../types";

interface FileUploaderProps {
  onDataParsed: (data: QEParsedData) => void;
  currentSystemName: string;
}

export function FileUploader({ onDataParsed, currentSystemName }: FileUploaderProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "upload" | "paste">("presets");
  const [scfText, setScfText] = useState("");
  const [nscfText, setNscfText] = useState("");
  
  const [scfFileName, setScfFileName] = useState<string | null>(null);
  const [nscfFileName, setNscfFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const scfInputRef = useRef<HTMLInputElement>(null);
  const nscfInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (preset: Preset) => {
    onDataParsed(JSON.parse(JSON.stringify(preset.data)));
    setWarning(null);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "scf" | "nscf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "scf") {
      setScfFileName(file.name);
    } else {
      setNscfFileName(file.name);
    }

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

  const handleParse = async () => {
    if (!scfText && !nscfText) {
      setError("Please provide at least one Quantum ESPRESSO file (SCF or NSCF).");
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch("/api/parse-qe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scfContent: scfText,
          nscfContent: nscfText
        })
      });

      if (!response.ok) {
        throw new Error("HTTP connection error during file parsing.");
      }

      const parsedData = await response.json();
      
      if (parsedData.warning) {
        setWarning(parsedData.warning);
      }

      onDataParsed(parsedData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while parsing QE files.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Title Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            1. Select Material System & QE Files
          </h2>
          <p className="text-xs text-slate-500">
            Upload input/output scripts or pick an existing physical preset.
          </p>
        </div>
        {currentSystemName && (
          <div className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
            Active: {currentSystemName}
          </div>
        )}
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/20">
        <button
          onClick={() => setActiveTab("presets")}
          className={`flex-1 py-3 px-4 font-sans text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-all ${
            activeTab === "presets"
              ? "border-slate-950 text-slate-900 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Physics Presets</span>
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 py-3 px-4 font-sans text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-all ${
            activeTab === "upload"
              ? "border-slate-950 text-slate-900 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files (.in / .out)</span>
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={`flex-1 py-3 px-4 font-sans text-sm font-medium border-b-2 flex items-center justify-center gap-2 transition-all ${
            activeTab === "paste"
              ? "border-slate-950 text-slate-900 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30"
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Paste Text Code</span>
        </button>
      </div>

      <div className="p-6">
        {/* Presets Tab */}
        {activeTab === "presets" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Instantly seed the core parameters (crystal vector, atomic species, k-point density) with ready-made DFT structures to test Wannier90 inputs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-4 border border-slate-200 hover:border-slate-800 rounded-xl text-left bg-white transition-all group relative duration-200 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 font-mono group-hover:text-slate-950">
                      {preset.chemicalFormula}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-bold border border-slate-100">
                      Preset
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-3">
                    {preset.description}
                  </p>
                  {currentSystemName === preset.data.crystalSymbol && (
                    <div className="absolute bottom-2 right-2 p-1 bg-emerald-500 rounded-full text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Drag-and-drop or select your Quantum ESPRESSO Self-Consistent Field (scf) and Non-Self-Consistent Field (nscf) simulation scripts:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SCF Box */}
              <div
                onClick={() => scfInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50/50"
              >
                <input
                  type="file"
                  ref={scfInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "scf")}
                  accept=".in,.out,.txt,.scf,*"
                />
                <FileText className={`w-8 h-8 mb-2 ${scfFileName ? "text-emerald-500" : "text-slate-400"}`} />
                <h4 className="text-xs font-bold text-slate-700">
                  {scfFileName ? scfFileName : "SCF File (Input or Output)"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Extracts crystalline lattice parameters, atom positions and atomic types.
                </p>
                {scfFileName && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 border border-emerald-100 font-mono">
                    Loaded ✓
                  </span>
                )}
              </div>

              {/* NSCF Box */}
              <div
                onClick={() => nscfInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50/50"
              >
                <input
                  type="file"
                  ref={nscfInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "nscf")}
                  accept=".in,.out,.txt,.nscf,*"
                />
                <FileText className={`w-8 h-8 mb-2 ${nscfFileName ? "text-emerald-500" : "text-slate-400"}`} />
                <h4 className="text-xs font-bold text-slate-700">
                  {nscfFileName ? nscfFileName : "NSCF File (Input or Output)"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Extracts raw energy levels, bands, grid dimension and the Fermi energy level.
                </p>
                {nscfFileName && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 border border-emerald-100 font-mono">
                    Loaded ✓
                  </span>
                )}
              </div>
            </div>

            {/* Launch Parser Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleParse}
                disabled={loading || (!scfText && !nscfText)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{loading ? "Decrypting Simulation..." : "Parse QE Files (with AI / Fallback)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Paste Text Tab */}
        {activeTab === "paste" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Paste the text of your Quantum ESPRESSO files directly (or standard system definition paragraphs):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  SCF File Content (Cell Vectors & Atoms)
                </label>
                <textarea
                  value={scfText}
                  onChange={(e) => setScfText(e.target.value)}
                  placeholder="Paste &SYSTEM, CELL_PARAMETERS or ATOMIC_POSITIONS from output here..."
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  NSCF File Content (Bands, Fermi, K-Points mp_grid)
                </label>
                <textarea
                  value={nscfText}
                  onChange={(e) => setNscfText(e.target.value)}
                  placeholder="Paste K_POINTS, Kohn-Sham states or Monkhorst-Pack grid here..."
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleParse}
                disabled={loading || (!scfText && !nscfText)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{loading ? "Processing..." : "Parse QE Code (with AI / Fallback)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Indicators */}
        {error && (
          <div className="mt-4 p-4.5 bg-rose-50 border border-rose-100/80 rounded-xl flex gap-3 text-rose-800 leading-relaxed text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold mb-0.5">Quantum ESPRESSO Parsing Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Warning Indicators */}
        {warning && (
          <div className="mt-4 p-4.5 bg-amber-50 border border-amber-100/80 rounded-xl flex gap-3 text-amber-800 leading-relaxed text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold mb-0.5">AI Engine Fallback Active</p>
              <p>{warning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
