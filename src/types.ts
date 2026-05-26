export interface Atom {
  id: string;
  symbol: string;
  x: number;
  y: number;
  z: number;
}

export type CoordinateType = 'crystal' | 'angstrom' | 'bohr';

export interface CellVectors {
  v1: [number, number, number];
  v2: [number, number, number];
  v3: [number, number, number];
  unit: 'angstrom' | 'bohr' | 'alat';
}

export interface Projection {
  id: string;
  site: string; // e.g., "Si", "Fe", "f=0,0,0", "1"
  orbitals: string[]; // e.g., ["s", "p", "d", "sp3", "eg", "t2g"]
}

export interface WannierConfig {
  num_bands: number;
  num_wann: number;
  mp_grid: [number, number, number];
  exclude_bands: string; // list of range e.g., "1-4, 5"
  
  // Energy limits & disentanglement
  disentangle: boolean;
  dis_win_min: number | '';
  dis_win_max: number | '';
  dis_froz_min: number | '';
  dis_froz_max: number | '';
  dis_num_iter: number;
  dis_mix_ratio: number;
  
  // Projections
  use_projections: boolean;
  projections: Projection[];
  
  // Execution Control
  guiding_centres: boolean;
  num_iter: number;
  conv_tol: number; // e.g. 1e-10
  conv_window: number;
  
  // Plotting
  plot_bands: boolean;
  plot_bands_num_kpts: number;
  wannier_plot: boolean;
  wannier_plot_supercell: number;
  
  // Others
  write_mmn: boolean;
  write_amn: boolean;
  write_unk: boolean;
}

export interface QEParsedData {
  crystalSymbol?: string;
  cell?: CellVectors;
  atoms?: Atom[];
  coordinatesUnit?: CoordinateType;
  nbnd?: number;
  numElectrons?: number;
  fermiEnergy?: number;
  kpointsCount?: number;
  mp_grid?: [number, number, number];
  kpointsList?: [number, number, number, number][]; // optional list of x, y, z, w
  suggestedNumWann?: number;
  suggestedProjections?: Projection[];
}
