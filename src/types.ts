export interface StepItem {
  timing: number; // Float32: [0.0, 1.0]
  value: number;  // Float32: [0.0, 1.0]
}

export type SequencerMode = 'gated' | 'decay';

export interface PresetPattern {
  name: string;
  description: string;
  category: 'psytrance' | 'trance' | 'hadra' | 'geometric' | 'custom';
  steps: StepItem[];
}
