import { StepItem } from '../types';

/**
 * Defensive clamping to guarantee float parameters are strictly within [0.0, 1.0]
 */
export const clamp = (val: number): number => {
  return Math.max(0.0, Math.min(1.0, val));
};

/**
 * Calculates static linear timings [0.0, 1.0] for the 32 steps.
 */
export const calculateTimings = (): number[] => {
  const timings: number[] = [];
  for (let i = 0; i < 32; i++) {
    timings.push(i / 32.0);
  }
  return timings;
};

export interface SequenceModifiers {
  evolution?: number;  // 0.0 (static) to 1.0 (heavy macro-envelope ramp across the entire 32 steps)
  chaos?: number;      // 0.0 to 1.0 (micro-velocity jitter targeting offbeats exclusively)
  grooveStyle?: 'driving' | 'tribal_accent' | 'linear';
}

/**
 * Applies Macro Evolution, Chaos, and Groove Style modifiers to an existing sequence.
 */
export const applySequenceModifiers = (steps: StepItem[], modifiers: SequenceModifiers): StepItem[] => {
  const { evolution = 0.0, chaos = 0.0, grooveStyle = 'driving' } = modifiers;
  
  return steps.map((step, i) => {
    let value = step.value;
    const isSecondBar = i >= 16;

    // Apply modifiers only to active nodes to preserve silence/gaps
    if (value > 0.0) {
      // 1. Dynamic Accentuation: Bar-to-Bar Variation
      if (isSecondBar && grooveStyle === 'driving') {
        value *= 1.08;
      }

      // 2. Macro Evolution (Linear growth/envelope morph across the 32 steps)
      if (evolution > 0) {
        const progressionFactor = i / 31.0;
        value = value * ((1.0 - evolution * 0.25) + (progressionFactor * evolution * 0.35));
      }

      // 3. Controlled Chaos (Non-destructive micro-variations)
      if (chaos > 0) {
        const microJitter = (Math.random() * 2 - 1) * chaos * 0.12;
        value += microJitter;
      }
    }

    return {
      ...step,
      value: clamp(value)
    };
  });
};

/**
 * A. Advanced Psytrance Ducking Gate
 * Guarantees a clean downbeat pocket for the kick transient while dynamically 
 * evolving offbeat velocity curves across the 32-step grid.
 */
export const generatePsytranceDucking = (
  velocity: number, 
  _shuffle?: number,
  modifiers: SequenceModifiers = {}
): StepItem[] => {
  const { grooveStyle = 'driving' } = modifiers;
  const timings = calculateTimings();
  const rawSteps: StepItem[] = [];

  for (let i = 0; i < 32; i++) {
    let value = 0.0;
    const stepInBeat = i % 8;

    // RULE 1: Absolute protection of the downbeat kick window
    if (stepInBeat === 0) {
      value = 0.0;
    } else {
      // Establish structural baseline based on the chosen sub-groove style
      if (stepInBeat >= 1 && stepInBeat <= 5) {
        value = velocity * (grooveStyle === 'tribal_accent' ? 0.5 : 0.7);
      } else {
        value = velocity;
      }
    }

    rawSteps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  
  return applySequenceModifiers(rawSteps, modifiers);
};

/**
 * B. Hadra/Full-On Gallop Engine
 * Loops an 8-step rhythmic pattern over the 32 steps.
 */
export const generateHadraGallop = (
  patternType: 'classic' | 'tribal' | 'offbeat',
  velocity: number,
  _shuffle?: number
): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];

  const patterns = {
    classic: [0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0], // .BBB.BBB
    tribal:  [1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0], // B.BBB.B.
    offbeat: [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0], // ..B...BB
  };

  const selectedPattern = patterns[patternType] || patterns.classic;

  for (let i = 0; i < 32; i++) {
    const maskValue = selectedPattern[i % 8];
    let value = maskValue * velocity;

    // Add subtle accent to offbeat 16ths (index 2, 6 mod 8)
    if (maskValue > 0.0 && i % 4 === 2) {
      value = velocity * 0.85;
    }

    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * C. Continuous Exponential Decay (Trance Envelopes)
 * Simulates downward saw ramp transitions drop exponentially.
 */
export const generateExponentialDecay = (
  triggerInterval: number, // e.g. 4 or 8
  tension: number, // e.g. 2.0 to 8.0
  _shuffle?: number
): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];

  for (let i = 0; i < 32; i++) {
    const stepsSinceTrigger = i % triggerInterval;
    const phase = stepsSinceTrigger / triggerInterval;
    const value = Math.exp(-tension * phase);

    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * D. Mathematical Sinusoidal Curves
 * Sinusoidal sweeps over the sequence grid.
 */
export const generateSinusoidalCurve = (
  frequency: number, // 1 to 8
  _shuffle?: number
): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];

  for (let i = 0; i < 32; i++) {
    const x = i / 31; // As defined in the formula: x = i / 31
    const value = (Math.sin(2 * Math.PI * x * frequency) + 1.0) / 2.0;

    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * E. Psy Polyrhythm 3/4
 * Shifts phase of 3-step triggers within 4/4 meter.
 */
export const generatePolyrhythm34 = (velocity: number, _shuffle?: number): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];

  for (let i = 0; i < 32; i++) {
    let value = 0.1;
    if (i % 3 === 0) {
      value = 1.0;
    } else if (i % 3 === 1) {
      value = 0.5;
    } else {
      value = 0.1;
    }
    steps.push({
      timing: timings[i],
      value: clamp(value * velocity),
    });
  }
  return steps;
};

/**
 * Sets the sequence to have specific rhythmic step durations.
 * The first K steps are spaced evenly at intervals of (stepLength / 32.0),
 * and the remaining (32 - K) steps are stacked at the end of the sequence (timing = 1.0).
 */
export const applyRhythmicSubdivisions = (steps: StepItem[], stepLengthIn32nds: number): StepItem[] => {
  const activeCount = Math.floor(32 / stepLengthIn32nds);
  const newSteps: StepItem[] = [];

  for (let i = 0; i < 32; i++) {
    if (i < activeCount) {
      const timing = (i * stepLengthIn32nds) / 32.0;
      // Keep existing value if possible, else 0.5
      const existingVal = steps[i]?.value ?? 0.5;
      newSteps.push({
        timing: Number(timing.toFixed(4)),
        value: existingVal
      });
    } else {
      // Stack unused nodes at the end with value 0
      newSteps.push({
        timing: 1.0,
        value: 0.0
      });
    }
  }
  return newSteps;
};

/**
 * Humanizer Jitter Mutator targeting exclusively non-zero nodes.
 */
export const mutatePattern = (steps: StepItem[], jitter: number = 0.08): StepItem[] => {
  return steps.map(s => {
    if (s.value > 0) {
      const offset = Math.random() * jitter * 2 - jitter;
      return {
        ...s,
        value: clamp(s.value + offset),
      };
    }
    return s;
  });
};

/**
 * F. Metric Straight Gate Generator
 * Generates absolute square gates synchronized strictly to DAW metric divisions.
 */
export const generateMetricGate = (
  division: '1/4' | '1/8' | '1/16' | '1/32',
  dutyCycle: number = 0.5
): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];
  
  let stepsPerPulse = 1;
  if (division === '1/4') stepsPerPulse = 4;
  if (division === '1/8') stepsPerPulse = 2;
  if (division === '1/16') stepsPerPulse = 1;
  
  for (let i = 0; i < 32; i++) {
    let value = 0.0;
    if (division === '1/32') {
      value = i % 2 === 0 ? 1.0 : 0.0;
    } else {
      const positionInPulse = i % stepsPerPulse;
      const threshold = stepsPerPulse * dutyCycle;
      value = positionInPulse < threshold ? 1.0 : 0.0;
    }
    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * G. Syncopated Dotted/Groove Gate
 * Implements driving Psytrance patterns using dotted 1/8 and 1/16 delays.
 */
export const generatePsyGrooveGate = (style: 'dotted-eight' | 'offbeat-pump'): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];
  
  for (let i = 0; i < 32; i++) {
    const beatPosition = i % 4;
    let value = 0.0;
    
    if (style === 'dotted-eight') {
      value = (beatPosition === 0 || beatPosition === 3) ? 1.0 : 0.0;
    } else if (style === 'offbeat-pump') {
      if (i % 4 === 0) value = 0.0;
      else if (i % 4 === 2) value = 1.0;
      else value = 0.6;
    }
    
    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * H. Ratchet & Stutter Gate Generator (1/32 & Hi-Tech Bursts)
 * Inserts hyper-speed 1/32 bursts/ratchets into specific sectors of a 1/16 grid.
 */
export const generateRatchetStutterGate = (
  burstsPerBar: number = 2,
  accentVelocity: number = 1.0
): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];
  
  for (let i = 0; i < 32; i++) {
    let value = 0.0;
    if ((i >= 12 && i <= 15) || (i >= 28 && i <= 31)) {
      value = i % 2 === 0 ? accentVelocity : 0.1;
    } else {
      value = i % 2 === 1 ? 0.85 : 0.0;
    }
    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};

/**
 * I. Advanced Björklund Euclidean Gate
 * Computes non-linear rhythmic spacing distributed across structural timing slots.
 */
export const generateEuclideanGate = (pulses: number, stepsCount: number = 32): StepItem[] => {
  const timings = calculateTimings();
  const steps: StepItem[] = [];
  
  for (let i = 0; i < stepsCount; i++) {
    const isActive = (i * pulses) % stepsCount < pulses;
    let value = 0.0;
    
    if (isActive) {
      value = i % 4 === 0 ? 1.0 : 0.75;
    } else {
      value = 0.0;
    }
    
    steps.push({
      timing: timings[i],
      value: clamp(value),
    });
  }
  return steps;
};
