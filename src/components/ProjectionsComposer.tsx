import React, { useState } from "react";
import { Plus, Trash2, Tag, Compass, Sparkles, HelpCircle } from "lucide-react";
import { Projection, Atom } from "../types";

interface ProjectionsComposerProps {
  projections: Projection[];
  atoms: Atom[];
  onChangeProjections: (projections: Projection[]) => void;
}

const COMMON_ORBITALS = [
  "s", "p", "d", "f", 
  "sp3", "sp2", "sp", 
  "px", "py", "pz", 
  "t2g", "eg"
];

export function ProjectionsComposer({
  projections,
  atoms,
  onChangeProjections
}: ProjectionsComposerProps) {
  
  const [customSite, setCustomSite] = useState("");
  const [customOrb, setCustomOrb] = useState("");

  // Get unique atomic symbols in the current structure
  const uniqueElements = Array.from(new Set(atoms.map((a) => a.symbol)));

  const handleAddProjection = (site: string) => {
    if (!site) return;
    const newProj: Projection = {
      id: Math.random().toString(36).substr(2, 9),
      site: site,
      orbitals: site === "Cu" ? ["d", "s"] : ["sp3"]
    };
    onChangeProjections([...projections, newProj]);
  };

  const handleDeleteProjection = (id: string) => {
    onChangeProjections(projections.filter((p) => p.id !== id));
  };

  const handleToggleOrbital = (projId: string, orbital: string) => {
    const updated = projections.map((p) => {
      if (p.id === projId) {
        let nextOrbitals;
        if (p.orbitals.includes(orbital)) {
          nextOrbitals = p.orbitals.filter((o) => o !== orbital);
        } else {
          nextOrbitals = [...p.orbitals, orbital];
        }
        return { ...p, orbitals: nextOrbitals };
      }
      return p;
    });
    onChangeProjections(updated);
  };

  const handleAddCustomOrbital = (projId: string, customText: string) => {
    if (!customText.trim()) return;
    const updated = projections.map((p) => {
      if (p.id === projId) {
        if (!p.orbitals.includes(customText)) {
          return { ...p, orbitals: [...p.orbitals, customText.trim()] };
        }
      }
      return p;
    });
    onChangeProjections(updated);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
      {/* Block Header */}
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            3. Orbital projections composer
          </h2>
          <p className="text-xs text-slate-500">
            Assign atomic orbital characters (e.g. <code>Si:sp3</code>) used to construct localized Wannier functions.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {uniqueElements.map((elem) => (
            <button
              key={elem}
              onClick={() => handleAddProjection(elem)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-950 hover:text-white border border-slate-200 hover:border-slate-950 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{elem} Projection</span>
            </button>
          ))}
          <button
            onClick={() => handleAddProjection("f=0,0,0")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-950 hover:text-white border border-slate-200 hover:border-slate-950 font-mono text-[11px] font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            title="Add fractional coordinate point projection center"
          >
            <Plus className="w-3 h-3" />
            <span>f=x,y,z Center</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Editor list */}
          <div className="lg:col-span-8 space-y-4">
            {projections.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <Compass className="w-8 h-8 text-slate-300 mb-2 animate-spin-slow" />
                <h4 className="text-xs font-semibold text-slate-600 mb-1">
                  No Projections Configured
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed mb-4">
                  Wannier90 driver needs orbital character mapping descriptors. Click elements above to start projection composing.
                </p>
                <div className="flex gap-2">
                  {uniqueElements.length > 0 ? (
                    uniqueElements.map((elem) => (
                      <button
                        key={elem}
                        onClick={() => handleAddProjection(elem)}
                        className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-950 font-mono text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Add {elem}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => handleAddProjection("Si")}
                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-950 font-mono text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Add default Si Proj
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {projections.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 border border-slate-250 bg-slate-50/30 hover:bg-white rounded-xl items-start transition-all"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 mb-3 border-b border-slate-100 font-mono">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400">Site Filter:</span>
                        <input
                          type="text"
                          value={proj.site}
                          onChange={(e) => {
                            const val = e.target.value;
                            onChangeProjections(projections.map((p) => p.id === proj.id ? { ...p, site: val } : p));
                          }}
                          className="font-bold text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 shrink-0 uppercase"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteProjection(proj.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 p-1 px-2.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                        Select Orbitals Types
                      </span>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_ORBITALS.map((orb) => {
                          const active = proj.orbitals.includes(orb);
                          return (
                            <button
                              key={orb}
                              onClick={() => handleToggleOrbital(proj.id, orb)}
                              className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-all cursor-pointer ${
                                active
                                  ? "bg-slate-900 border-slate-900 text-white font-bold"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-800"
                              }`}
                            >
                              {orb}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom orbital addition */}
                      <div className="flex gap-2 max-w-xs pt-1">
                        <input
                          type="text"
                          id={`custom-orb-in-${proj.id}`}
                          placeholder="Custom orb (e.g. sp3d2, pz)"
                          className="bg-white border border-slate-200 rounded-lg text-xs p-1.5 px-3 w-full font-mono focus:outline-none focus:ring-1 focus:ring-slate-950"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const el = e.currentTarget;
                              handleAddCustomOrbital(proj.id, el.value);
                              el.value = "";
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById(`custom-orb-in-${proj.id}`) as HTMLInputElement;
                            if (el) {
                              handleAddCustomOrbital(proj.id, el.value);
                              el.value = "";
                            }
                          }}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Left formatting preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="border border-slate-200 bg-slate-900 rounded-xl p-4 text-white font-mono text-xs flex flex-col h-full min-h-[180px] shadow-sm">
              <div className="pb-2 border-b border-white/10 mb-2 flex items-center justify-between text-slate-400 text-[10px]">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  WIN FILE PROJECTIONS OUTPUT:
                </span>
                <span>Plain block format</span>
              </div>
              <div className="flex-1 overflow-auto leading-relaxed select-none text-emerald-300">
                <span className="text-slate-500 font-normal">begin projections</span>
                {projections.length === 0 ? (
                  <div className="text-slate-500 italic my-2"># No projections added yet.</div>
                ) : (
                  projections.map((p) => (
                    <div key={p.id} className="pl-4">
                      <span className="font-bold text-white uppercase">{p.site}</span>:
                      <span>{p.orbitals.join(",")}</span>
                    </div>
                  ))
                )}
                <span className="text-slate-500 font-normal">end projections</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
