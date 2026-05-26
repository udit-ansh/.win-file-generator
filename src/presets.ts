import { QEParsedData, Projection } from "./types";

export interface Preset {
  name: string;
  chemicalFormula: string;
  description: string;
  data: QEParsedData;
}

export const PRESETS: Preset[] = [
  {
    name: "Silicon (Semiconductor sp3)",
    chemicalFormula: "Si",
    description: "Standard face-centered cubic Silicon. Perfect for demonstrating sp3 hybrid projection, producing 8 Wannier functions for the 4 valence bands.",
    data: {
      crystalSymbol: "Si",
      cell: {
        v1: [0.0, 2.7153, 2.7153],
        v2: [2.7153, 0.0, 2.7153],
        v3: [2.7153, 2.7153, 0.0],
        unit: "angstrom"
      },
      atoms: [
        { id: "si1", symbol: "Si", x: 0.0, y: 0.0, z: 0.0 },
        { id: "si2", symbol: "Si", x: 0.25, y: 0.25, z: 0.25 }
      ],
      coordinatesUnit: "crystal",
      nbnd: 16,
      numElectrons: 8,
      fermiEnergy: 6.24,
      mp_grid: [4, 4, 4],
      suggestedNumWann: 4,
      suggestedProjections: [
        { id: "proj-si", site: "Si", orbitals: ["sp3"] }
      ]
    }
  },
  {
    name: "Copper FCC (Transition Metal d-block)",
    chemicalFormula: "Cu",
    description: "FCC Copper showing strong d-bands disentanglement. Uses disentanglement windows to isolate the dense 5 d-like bands plus 1 s-like band.",
    data: {
      crystalSymbol: "Cu",
      cell: {
        v1: [-1.805, 0.0, 1.805],
        v2: [0.0, 1.805, 1.805],
        v3: [-1.805, 1.805, 0.0],
        unit: "angstrom"
      },
      atoms: [
        { id: "cu1", symbol: "Cu", x: 0.0, y: 0.0, z: 0.0 }
      ],
      coordinatesUnit: "crystal",
      nbnd: 24,
      numElectrons: 11,
      fermiEnergy: 12.8,
      mp_grid: [6, 6, 6],
      suggestedNumWann: 7,
      suggestedProjections: [
        { id: "proj-cu-d", site: "Cu", orbitals: ["d", "s"] }
      ]
    }
  },
  {
    name: "Graphene (2D honeycomb lattice)",
    chemicalFormula: "C2",
    description: "2D monolayer graphene focusing on key pz bonding and anti-bonding orbitals near the Dirac point. Features a flat 2D k-point grid.",
    data: {
      crystalSymbol: "C2",
      cell: {
        v1: [2.461, 0.0, 0.0],
        v2: [-1.2305, 2.1313, 0.0],
        v3: [0.0, 0.0, 12.0],
        unit: "angstrom"
      },
      atoms: [
        { id: "c1", symbol: "C", x: 0.33333, y: 0.66667, z: 0.0 },
        { id: "c2", symbol: "C", x: 0.66667, y: 0.33333, z: 0.0 }
      ],
      coordinatesUnit: "crystal",
      nbnd: 12,
      numElectrons: 8,
      fermiEnergy: -1.45,
      mp_grid: [8, 8, 1],
      suggestedNumWann: 4,
      suggestedProjections: [
        { id: "proj-c-pz", site: "C", orbitals: ["pz"] }
      ]
    }
  }
];
