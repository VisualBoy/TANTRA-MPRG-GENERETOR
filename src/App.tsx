import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Square,
  Download,
  Activity,
  Sparkles,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Music,
  Sliders,
  HelpCircle,
  Binary,
} from "lucide-react";

import { StepItem, SequencerMode, PresetPattern } from "./types";
import { PresetSelector } from "./components/PresetSelector";
import { Knob } from "./components/Knob";
import { SequencerGrid } from "./components/SequencerGrid";
import { exportToMPRG } from "./utils/exporter";
import {
  generatePsytranceDucking,
  generateHadraGallop,
  generateExponentialDecay,
  generateSinusoidalCurve,
  generatePolyrhythm34,
  mutatePattern,
  applyRhythmicSubdivisions,
  applySequenceModifiers,
  clamp,
  calculateTimings,
  generateMetricGate,
  generatePsyGrooveGate,
  generateRatchetStutterGate,
  generateEuclideanGate,
} from "./utils/generators";

export default function App() {
  // Sequencer state
  const [steps, setSteps] = useState<StepItem[]>(() => {
    // Default to a classic Psytrance ducking gate pattern
    return generatePsytranceDucking(1.0);
  });

  const [selectedPresetStyle, setSelectedPresetStyle] = useState<string | null>(
    "psy_duck",
  );
  const [mode, setMode] = useState<SequencerMode>("gated");
  const [activeEnvelopeTab, setActiveEnvelopeTab] = useState<"G" | "A" | "B">(
    "G",
  );
  const [snapSetting, setSnapSetting] = useState<string>("1/32");
  const [stepLengthUnit, setStepLengthUnit] = useState<number>(1);
  const [modifiedParams, setModifiedParams] = useState<{
    speed?: boolean;
    tension?: boolean;
    mode?: boolean;
    stepLength?: boolean;
    modifiers?: boolean;
  }>({});

  // Real preset parameters exported/calculated
  const [tension, setTension] = useState<number>(4.4); // acts as tension in decay mode
  const [shuffle, setShuffle] = useState<number>(33.9);
  const [speed, setSpeed] = useState<string>("1/16");

  // Sequence Modifiers
  const [evolution, setEvolution] = useState<number>(0.0);
  const [chaos, setChaos] = useState<number>(0.0);
  const [grooveStyle, setGrooveStyle] = useState<
    "driving" | "tribal_accent" | "linear"
  >("driving");

  // Jitter Humanize config
  const [humanizeJitter, setHumanizeJitter] = useState<number>(0.08);

  // File download state
  const [fileName, setFileName] = useState<string>("Psytrance_Sequence");

  // Interactive byte-inspector modal or view
  const [showByteInspector, setShowByteInspector] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Ensure we keep context when mode changes
  const handleModeChange = (
    newMode: SequencerMode,
    tab: "G" | "A" | "B",
    isUserInitiated: boolean = false,
  ) => {
    setMode(newMode);
    setActiveEnvelopeTab(tab);

    // Set typical initial tensions for env A and env B
    if (tab === "A") {
      setTension(4.4);
    } else if (tab === "B") {
      setTension(2.5);
    }

    if (isUserInitiated) {
      setModifiedParams((prev) => ({ ...prev, mode: true }));
    }
  };

  // Handle sequence modifications (shuffle is visual/auditory only, raw steps timing remains strictly linear)
  const handleShuffleChange = (newShuffle: number) => {
    setShuffle(newShuffle);
  };

  // Quick Action: Shift Left
  const shiftLeft = () => {
    setSteps((prev) => {
      const first = prev[0];
      const shifted = [...prev.slice(1), first];
      return shifted.map((step, idx) => {
        return { ...step, timing: idx / 32.0 };
      });
    });
  };

  // Quick Action: Shift Right
  const shiftRight = () => {
    setSteps((prev) => {
      const last = prev[prev.length - 1];
      const shifted = [last, ...prev.slice(0, prev.length - 1)];
      return shifted.map((step, idx) => {
        return { ...step, timing: idx / 32.0 };
      });
    });
  };

  // Quick Action: Invert
  const invertPattern = () => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        value: clamp(1.0 - step.value),
      })),
    );
  };

  // Quick Action: Reverse
  const reversePattern = () => {
    setSteps((prev) => {
      const reversedValues = [...prev].reverse();
      return reversedValues.map((step, idx) => {
        return { ...step, timing: idx / 32.0 };
      });
    });
  };

  // Quick Action: Clear Grid
  const clearGrid = () => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        value: 0.0,
      })),
    );
  };

  // Quick Action: Randomize All according to the selected algorithmic style
  const randomizeAll = () => {
    let newSteps: StepItem[] = [];

    if (!selectedPresetStyle) {
      // Custom Randomizer based on active Steps Panel parameters
      if (mode === "gated") {
        const timings = calculateTimings();
        const rVal = () => Number((0.65 + Math.random() * 0.35).toFixed(4));
        for (let i = 0; i < 32; i++) {
          const value = Math.random() > 0.4 ? rVal() : 0.0;
          newSteps.push({
            timing: timings[i],
            value: clamp(value),
          });
        }
      } else {
        const intervals = [4, 8, 16];
        const randomInterval =
          intervals[Math.floor(Math.random() * intervals.length)];
        newSteps = generateExponentialDecay(randomInterval, tension);
      }
    } else {
      newSteps = generateBaseStepsForPreset(selectedPresetStyle, tension);
      applyPresetMode(selectedPresetStyle);
    }

    if (stepLengthUnit > 1) {
      newSteps = applyRhythmicSubdivisions(newSteps, stepLengthUnit);
    }

    if (humanizeJitter > 0) {
      newSteps = mutatePattern(newSteps, humanizeJitter);
    }

    setSteps(newSteps);
    setModifiedParams({});
  };

  // Helper to generate the base 32-step sequence for a given preset style
  const generateBaseStepsForPreset = (
    type: string,
    tensionVal: number,
  ): StepItem[] => {
    const modifiers = { evolution, chaos, grooveStyle };
    let baseSteps: StepItem[] = [];
    switch (type) {
      case "psy_duck":
        baseSteps = generatePsytranceDucking(1.0, undefined, modifiers);
        // generatePsytranceDucking internally applies SequenceModifiers
        return baseSteps;
      case "gallop_classic":
        baseSteps = generateHadraGallop("classic", 1.0);
        break;
      case "gallop_tribal":
        baseSteps = generateHadraGallop("tribal", 1.0);
        break;
      case "gallop_offbeat":
        baseSteps = generateHadraGallop("offbeat", 1.0);
        break;
      case "decay_fast":
        baseSteps = generateExponentialDecay(4, tensionVal);
        break;
      case "decay_wide":
        baseSteps = generateExponentialDecay(8, tensionVal);
        break;
      case "polyrhythm":
        baseSteps = generatePolyrhythm34(1.0);
        break;
      case "sine_wave":
        baseSteps = generateSinusoidalCurve(2.0);
        break;
      case "metric_gate":
        baseSteps = generateMetricGate("1/16", 0.5);
        break;
      case "psy_groove":
        baseSteps = generatePsyGrooveGate("dotted-eight");
        break;
      case "ratchet_stutter":
        baseSteps = generateRatchetStutterGate(2, 1.0);
        break;
      case "euclidean_gate":
        baseSteps = generateEuclideanGate(11);
        break;
      default:
        baseSteps = generatePsytranceDucking(1.0, undefined, modifiers);
        return baseSteps;
    }
    return applySequenceModifiers(baseSteps, modifiers);
  };

  // Helper to apply the mode change associated with a preset style
  const applyPresetMode = (type: string) => {
    switch (type) {
      case "decay_fast":
        handleModeChange("decay", "A");
        break;
      case "decay_wide":
        handleModeChange("decay", "B");
        break;
      case "sine_wave":
        handleModeChange("decay", "A");
        break;
      default:
        handleModeChange("gated", "G");
        break;
    }
  };

  const loadAlgorithmicPattern = (type: string) => {
    if (selectedPresetStyle === type) {
      // Toggle off / deselect
      setSelectedPresetStyle(null);
      setModifiedParams({});
      setStepLengthUnit(1);
      return;
    }

    setSelectedPresetStyle(type);
    setModifiedParams({}); // clear manual modifications on new preset load

    // Get preset defaults for tension if not modified by user
    if (type === "decay_fast") {
      setTension(4.5);
    } else if (type === "decay_wide") {
      setTension(2.5);
    } else if (type === "sine_wave") {
      setTension(3.0);
    }

    applyPresetMode(type);
  };

  // Handle Export File
  const handleExport = () => {
    exportToMPRG(steps, shuffle, fileName);
  };

  // Binary structural readout mock calculations to show live on Inspector UI
  const getByteAt = (
    offset: number,
  ): { hex: string; desc: string; val: string } => {
    if (offset < 4) {
      const magics = ["C3", "67", "ED", "34"];
      return {
        hex: magics[offset],
        desc: `Magic Header [${offset}]`,
        val: "VST Step Token",
      };
    }
    if (offset < 8) {
      return {
        hex: "00",
        desc: `Header Padding [${offset - 4}]`,
        val: "Null Boundary",
      };
    }
    if (offset < 12) {
      const stepBytes = ["20", "00", "00", "00"]; // 32 in Int32 LE
      return {
        hex: stepBytes[offset - 8],
        desc: `Length Limit [${offset - 8}]`,
        val: "32 Steps fixed",
      };
    }

    // Step pairs mapping
    const payloadOffset = offset - 12;
    const stepIdx = Math.floor(payloadOffset / 8);
    const inStepOffset = payloadOffset % 8;
    const step = steps[stepIdx];

    if (!step) {
      return { hex: "00", desc: "Out of Bounds", val: "0" };
    }

    if (inStepOffset < 4) {
      // Float32 Timing (X) representing post-shuffle step coordinates [1.0, 32.0]
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      const rawTiming = stepIdx / 32.0;
      const shuffleFactor = shuffle / 100.0;
      let visualTiming = rawTiming;
      if (stepIdx % 2 === 1) {
        visualTiming += (shuffleFactor * 0.5) / 32.0;
      }
      const exportTiming = Math.max(
        1.0,
        Math.min(32.0, visualTiming * 32.0 + 1.0),
      );

      view.setFloat32(0, exportTiming, true);
      const bytes = new Uint8Array(buffer);
      const byteVal = bytes[inStepOffset];
      return {
        hex: byteVal.toString(16).toUpperCase().padStart(2, "0"),
        desc: `Step ${stepIdx} Timing X [${inStepOffset}]`,
        val: exportTiming.toFixed(3),
      };
    } else {
      // Float32 Value (Y)
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, step.value, true);
      const bytes = new Uint8Array(buffer);
      const byteVal = bytes[inStepOffset - 4];
      return {
        hex: byteVal.toString(16).toUpperCase().padStart(2, "0"),
        desc: `Step ${stepIdx} Velocity Y [${inStepOffset - 4}]`,
        val: step.value.toFixed(3),
      };
    }
  };

  // Render a mini preview of the inspector bytes
  const renderByteGrid = () => {
    const gridElements = [];
    const maxVisibleBytes = 80; // Only render first 80 bytes for preview to prevent massive lag
    for (let i = 0; i < maxVisibleBytes; i++) {
      const { hex, desc, val } = getByteAt(i);
      let colorClass = "bg-[#0f1826] text-gray-400 border-[#1c2e47]";
      if (i < 4)
        colorClass = "bg-cyan-950 text-cyan-400 border-cyan-800 font-bold";
      else if (i >= 4 && i < 8)
        colorClass = "bg-[#12151c] text-gray-600 border-[#242936]";
      else if (i >= 8 && i < 12)
        colorClass =
          "bg-purple-950 text-purple-400 border-purple-800 font-bold";
      else {
        // Alternating steps
        const stepIdx = Math.floor((i - 12) / 8);
        const isYVal = (i - 12) % 8 >= 4;
        if (stepIdx % 2 === 0) {
          colorClass = isYVal
            ? "bg-amber-950/40 text-amber-400 border-amber-900/50"
            : "bg-slate-900/60 text-slate-400 border-slate-800/50";
        } else {
          colorClass = isYVal
            ? "bg-orange-950/40 text-orange-400 border-orange-900/50"
            : "bg-zinc-900/60 text-zinc-400 border-zinc-800/50";
        }
      }

      gridElements.push(
        <div
          key={`byte-${i}`}
          className={`group relative flex flex-col items-center justify-center h-10 w-full font-mono text-xs border rounded transition-all hover:scale-105 hover:z-10 cursor-help ${colorClass}`}
        >
          <span>{hex}</span>
          <span className="text-[7px] opacity-40 leading-none">
            0x{i.toString(16).toUpperCase().padStart(2, "0")}
          </span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-[#070b13] border border-[#213754] text-gray-200 text-[10px] rounded p-2 z-50 shadow-xl whitespace-nowrap">
            <p className="font-bold text-[#ff9800]">{desc}</p>
            <p className="font-mono mt-0.5">
              Offset:{" "}
              <span className="text-gray-400">
                {i} (0x{i.toString(16).toUpperCase()})
              </span>
            </p>
            <p className="font-mono">
              Decoded: <span className="text-white font-bold">{val}</span>
            </p>
          </div>
        </div>,
      );
    }
    return gridElements;
  };

  return (
    <div className="min-h-screen bg-[#080d16] text-white flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Visual cyber-grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(11,18,31,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(11,18,31,0.5)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0 opacity-45" />

      {/* TANTRA 2 HEADER VIEW */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-5 pb-2 flex flex-col sm:flex-row items-center justify-between border-b border-[#111e30]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,152,0,0.5)] border border-amber-400">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-widest uppercase text-white leading-none">
              TANTRA 2{" "}
              <span className="text-amber-500 font-medium">MPRG MODULATOR</span>
            </h1>
            <p className="text-[10px] font-mono text-gray-400 tracking-wider uppercase mt-1">
              Algorithmic Preset Generator & Sequencer
            </p>
          </div>
        </div>

        {/* Action Header Nav */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#0f1724] border border-[#20324c] hover:bg-[#1a2638] text-gray-300 text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Guide
          </button>
          <button
            onClick={() => setShowByteInspector(!showByteInspector)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all ${showByteInspector ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-400" : "bg-[#0f1724] hover:bg-[#1a2638] text-gray-300 border-[#20324c]"}`}
          >
            <Binary className="w-3.5 h-3.5" />
            Byte View
          </button>
        </div>
      </header>

      {/* CORE MODULATOR PANEL DESIGN */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-5 justify-center">
        {/* VST MODULE WRAPPER */}
        <div className="w-full bg-[#0a101a] border border-[#1a2d46] rounded-xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

          {/* VST TOP BAR CONFIGS */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#142337]/60">
            {/* Display / Active Tab Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 bg-[#23354c]/50 text-white rounded uppercase tracking-wider border border-[#23354c]">
                STEPS PANEL
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <span>SPEED:</span>
                <span className="text-white font-bold">{speed}</span>
              </div>
            </div>

            {/* Quick Navigation Slider Indicators */}
            <div className="flex items-center gap-2 bg-[#060a11] border border-[#16273d] p-1 rounded-md">
              <button
                onClick={() => handleModeChange("gated", "G", true)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${activeEnvelopeTab === "G" ? "bg-amber-500 text-black font-extrabold shadow-[0_0_10px_rgba(255,152,0,0.3)]" : "text-gray-400 hover:text-white"}`}
              >
                GATE [G]
              </button>
              <button
                onClick={() => handleModeChange("decay", "A", true)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${activeEnvelopeTab === "A" ? "bg-[#213a57] text-white border border-[#3b5e85]" : "text-gray-400 hover:text-white"}`}
              >
                ENV [A]
              </button>
              <button
                onClick={() => handleModeChange("decay", "B", true)}
                className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all ${activeEnvelopeTab === "B" ? "bg-[#213a57] text-white border border-[#3b5e85]" : "text-gray-400 hover:text-white"}`}
              >
                ENV [B]
              </button>
            </div>
          </div>

          {/* MAIN VST PANEL CHASSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT CONTROL COLUMN (12-col layout: 3 cols) */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col justify-around lg:justify-start items-center lg:items-stretch bg-[#070b12] border border-[#132135]/60 rounded-lg p-3 lg:py-4 gap-4 overflow-y-auto max-h-[500px]">
              {/* SPEED CONTROLLER */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  TIMING
                </span>

                {/* Speed selector dropdown */}
                <div className="relative">
                  <select
                    value={speed}
                    onChange={(e) => {
                      setSpeed(e.target.value);
                      setModifiedParams((prev) => ({ ...prev, speed: true }));
                    }}
                    className="appearance-none bg-[#04070d] border border-[#1f2f48] text-gray-300 text-[10px] font-mono font-bold px-3 py-1 rounded focus:outline-none focus:border-amber-500 cursor-pointer text-center w-24"
                  >
                    <option value="1/8">1/8</option>
                    <option value="1/16">1/16</option>
                    <option value="1/32">1/32</option>
                  </select>
                </div>
              </div>

              {/* TENSION / DECAY BENDING KNOB */}
              <div className="flex flex-col items-center">
                {mode !== "gated" ? (
                  <Knob
                    label="Tension"
                    value={tension}
                    min={1.0}
                    max={10.0}
                    defaultValue={4.4}
                    onChange={(val) => {
                      setTension(val);
                      setModifiedParams((prev) => ({ ...prev, tension: true }));
                    }}
                    formatValue={(v) => v.toFixed(2)}
                    color="amber"
                  />
                ) : (
                  <div className="text-center p-3 border border-[#1b2b41]/40 rounded bg-[#0b101b]/50 w-full hidden lg:block">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Shape Mode
                    </span>
                    <span className="text-[9px] font-mono text-amber-500/80 uppercase font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      Gated Block
                    </span>
                  </div>
                )}
              </div>

              {/* SEQUENCE MODIFIERS */}
              <div className="hidden lg:flex flex-col gap-3 mt-2 pt-4 border-t border-[#1b2b41]/40">
                <div className="flex items-center gap-2 mb-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-white">
                    SEQUENCE Modifiers
                  </h2>
                </div>

                {/* MACRO DYNAMICS */}
                <div className="bg-[#070b12] border border-[#1b2b41] p-2 rounded flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                      EVOLUTION
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 bg-black px-1 rounded">
                      {evolution.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={evolution}
                    onChange={(e) => {
                      setEvolution(parseFloat(e.target.value));
                      setModifiedParams((prev) => ({ ...prev, modifiers: true }));
                    }}
                    className="w-full h-1 bg-[#121c2d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                      CHAOS
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 bg-black px-1 rounded">
                      {chaos.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={chaos}
                    onChange={(e) => {
                      setChaos(parseFloat(e.target.value));
                      setModifiedParams((prev) => ({ ...prev, modifiers: true }));
                    }}
                    className="w-full h-1 bg-[#121c2d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />

                  <div className="flex flex-col mt-1 gap-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      GROOVE STYLE
                    </span>
                    <select
                      value={grooveStyle}
                      onChange={(e) => {
                        setGrooveStyle(e.target.value as any);
                        setModifiedParams((prev) => ({
                          ...prev,
                          modifiers: true,
                        }));
                      }}
                      className="appearance-none bg-black border border-[#213752] text-gray-300 text-[9px] font-bold px-1.5 py-1 rounded focus:outline-none focus:border-amber-500 cursor-pointer w-full"
                    >
                      <option value="driving">Driving</option>
                      <option value="tribal_accent">Tribal Accent</option>
                      <option value="linear">Linear</option>
                    </select>
                  </div>
                </div>

                {/* HUMANIZER MUTATOR */}
                <div className="bg-[#070b12] border border-[#1b2b41] p-2 rounded">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                      JITTER
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-500 bg-black px-1 rounded">
                      ±{humanizeJitter.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.01"
                    value={humanizeJitter}
                    onChange={(e) =>
                      setHumanizeJitter(parseFloat(e.target.value))
                    }
                    className="w-full h-1 bg-[#121c2d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* QUICK ARRAYS TOOLS */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={shiftLeft}
                    className="flex items-center justify-center gap-1 py-1 rounded bg-[#101724] border border-[#20324c] hover:bg-[#1a2638] text-gray-300 text-[8px] font-bold uppercase tracking-wider transition-all"
                  >
                    <ArrowLeft className="w-2.5 h-2.5 text-cyan-400" />
                    Shift L
                  </button>
                  <button
                    onClick={shiftRight}
                    className="flex items-center justify-center gap-1 py-1 rounded bg-[#101724] border border-[#20324c] hover:bg-[#1a2638] text-gray-300 text-[8px] font-bold uppercase tracking-wider transition-all"
                  >
                    Shift R
                    <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
                  </button>
                  <button
                    onClick={invertPattern}
                    className="flex items-center justify-center gap-1 py-1 rounded bg-[#101724] border border-[#20324c] hover:bg-[#1a2638] text-gray-300 text-[8px] font-bold uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    Invert
                  </button>
                  <button
                    onClick={reversePattern}
                    className="flex items-center justify-center gap-1 py-1 rounded bg-[#101724] border border-[#20324c] hover:bg-[#1a2638] text-gray-300 text-[8px] font-bold uppercase tracking-wider transition-all"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-purple-400" />
                    Reverse
                  </button>
                </div>

                {/* LOWER ACTIONS */}
                <div className="mt-1">
                  <button
                    onClick={clearGrid}
                    className="w-full py-1.5 rounded bg-[#160e18] hover:bg-red-950/20 border border-red-900/35 text-red-400 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Clear Grid
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER SEQUENCER GRID COLUMN (12-col layout: 9 cols) */}
            <div className="lg:col-span-9 flex flex-col justify-between gap-3">
              {/* Interactive SVG Canvas */}
              <div className="flex-1 min-h-[260px] relative">
                <SequencerGrid
                  steps={steps}
                  mode={mode}
                  tension={tension}
                  smooth={0}
                  shuffle={shuffle}
                  onChange={setSteps}
                  playheadIndex={null}
                  snapSetting={snapSetting}
                />
              </div>

              {/* TIMING LENGTHS & SNAP MODE CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#05080e]/90 border border-[#142337]/80 rounded-lg p-3 shadow-inner">
                {/* 1. Tantra Step Length (Subdivision Mapping) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                      Step Length (Rhythmic Space)
                    </span>
                    <span className="text-[9px] text-[#ff9800] font-bold font-mono uppercase bg-[#ff9800]/10 px-1.5 py-0.5 rounded">
                      Tantra Seq
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "1/32", length: 1 },
                      { label: "1/16", length: 2 },
                      { label: "1/8", length: 4 },
                      { label: "1/4", length: 8 },
                      { label: "1 bar", length: 32 },
                    ].map((opt) => {
                      const isSelected = stepLengthUnit === opt.length;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => {
                            setStepLengthUnit(opt.length);
                            setModifiedParams((prev) => ({
                              ...prev,
                              stepLength: true,
                            }));
                          }}
                          className={`py-1 text-[10px] font-mono font-bold uppercase rounded border transition-all duration-200 ${
                            isSelected
                              ? "bg-[#ff9800]/20 text-[#ffaa00] border-[#ff9800] shadow-[0_0_8px_rgba(255,152,0,0.15)]"
                              : "bg-[#0a0f18] text-gray-400 border-[#15233c] hover:text-gray-200 hover:border-gray-500"
                          }`}
                          title={`Set sequence step duration spacing to ${opt.label}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Drag & Drop Horizontal Snapping */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                      Drag Horizontal Snap
                    </span>
                    <span className="text-[9px] text-blue-400 font-bold font-mono uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">
                      Grid Lock
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "1/32", value: "1/32" },
                      { label: "1/16", value: "1/16" },
                      { label: "1/8", value: "1/8" },
                      { label: "1/4", value: "1/4" },
                      { label: "Free", value: "free" },
                    ].map((opt) => {
                      const isSelected = snapSetting === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSnapSetting(opt.value)}
                          className={`py-1 text-[10px] font-mono font-bold uppercase rounded border transition-all duration-200 ${
                            isSelected
                              ? "bg-[#1e3450]/60 text-blue-400 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                              : "bg-[#0a0f18] text-gray-400 border-[#15233c] hover:text-gray-200 hover:border-gray-500"
                          }`}
                          title={`Snap horizontal dragging to ${opt.label}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DRAW INSTRUCTION HEADER */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  MOUSE DRAW ACTIVE: CLICK & DRAG TO DRAW AMPLITUDE
                </span>
                <span>32 STEPS TOTAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* MASTER RANDOMIZATION CENTERPIECE */}
        <div className="flex flex-col items-center justify-center mb-6 mt-2 relative z-10">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-[#1a2d46]/30"></div>
          </div>
          <div className="relative flex justify-center w-full">
            <button
              onClick={randomizeAll}
              className="group relative px-12 py-3.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] hover:scale-[1.03] transition-all duration-300 border border-amber-300/40 cursor-pointer flex items-center gap-3.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>GENERATE / RANDOMIZE</span>
              <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
            </button>
          </div>
        </div>

        {/* ALGORITHMIC PRESETS */}
        <div className="w-full relative z-10">
          <PresetSelector
            selectedPresetStyle={selectedPresetStyle}
            onSelectPreset={loadAlgorithmicPattern}
            onUnselectPreset={() => {
              setSelectedPresetStyle(null);
              setModifiedParams({});
              setStepLengthUnit(1);
            }}
          />
        </div>

        {/* NATIVE EXPORTER AND DOWNLOAD BOX */}
        <div className="bg-[#0c1424] border border-amber-500/30 rounded-xl p-5 shadow-xl relative z-10 overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-44 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Download className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black tracking-wider uppercase text-white">
                  EXPORT NATIVE PRESET FILE
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Compiles the current 32-step grid, including exact little-endian
                timing transformations and velocity float32 arrays, down to a
                single **268-byte `.mprg` payload** compatible natively with the
                Tantra 2 step modulator preset format.
              </p>
            </div>

            {/* Export Fields Form */}
            <div className="flex flex-wrap items-center gap-3 bg-[#070b12] p-3 rounded-lg border border-[#1d2d42]">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">
                  PRESET FILENAME
                </label>
                <div className="flex items-center bg-black border border-[#213752] rounded overflow-hidden">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) =>
                      setFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))
                    }
                    className="bg-transparent text-white font-mono text-xs px-3 py-1.5 w-48 focus:outline-none"
                    placeholder="Psytrance_Sequence"
                  />
                  <span className="text-gray-500 text-xs font-mono bg-[#101724] px-2.5 py-1.5 border-l border-[#213752]">
                    .mprg
                  </span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="self-end flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_22px_rgba(245,158,11,0.5)] transition-all"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Export Preset
              </button>
            </div>
          </div>
        </div>

        {/* LIVE STRUCTURAL BINARY INSPECTOR CHASSIS */}
        <AnimatePresence>
          {showByteInspector && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-[#060a12] border border-[#1d2f47] rounded-xl p-5 shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#142337]/60">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    LIVE .MPRG PAYLOAD STRUCTURAL INSPECTOR
                  </h3>
                </div>
                <button
                  onClick={() => setShowByteInspector(false)}
                  className="text-xs text-gray-500 hover:text-white uppercase font-mono"
                >
                  [Close]
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Structural Reference Table */}
                <div className="lg:col-span-5 text-xs text-gray-300">
                  <h4 className="font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Binary Format Map (268 Bytes LE)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#1c2e47] text-[#ff9800]">
                          <th className="py-1.5 pr-2">Offset (Bytes)</th>
                          <th className="py-1.5 pr-2">Format</th>
                          <th className="py-1.5">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#142337]/40">
                          <td className="py-1 text-cyan-400 font-bold">
                            0x00 - 0x03
                          </td>
                          <td className="py-1">Hex Bytes</td>
                          <td className="py-1 text-gray-400">
                            Magic Signature (c3 67 ed 34)
                          </td>
                        </tr>
                        <tr className="border-b border-[#142337]/40">
                          <td className="py-1 text-gray-500">0x04 - 0x07</td>
                          <td className="py-1">Padding</td>
                          <td className="py-1 text-gray-500">
                            Null boundaries explicitly zeroed
                          </td>
                        </tr>
                        <tr className="border-b border-[#142337]/40">
                          <td className="py-1 text-purple-400 font-bold">
                            0x08 - 0x0B
                          </td>
                          <td className="py-1">Int32 LE</td>
                          <td className="py-1 text-gray-400">
                            Step Limit Constraint (Fixed to 32)
                          </td>
                        </tr>
                        <tr className="border-b border-[#1c2e47]">
                          <td className="py-1 text-amber-400">0x0C - 0x13</td>
                          <td className="py-1">2×Float32</td>
                          <td className="py-1 text-gray-400">
                            Step 0: [Timing (X), Amplitude (Y)]
                          </td>
                        </tr>
                        <tr className="border-b border-[#1c2e47]">
                          <td className="py-1 text-orange-400">0x14 - 0x1B</td>
                          <td className="py-1">2×Float32</td>
                          <td className="py-1 text-gray-400">
                            Step 1: [Timing (X), Amplitude (Y)]
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">...</td>
                          <td className="py-1 text-gray-500">...</td>
                          <td className="py-1 text-gray-500">
                            Steps 2 to 31 mapping 8 bytes each
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 rounded bg-[#090f19] border border-[#1b2b41] text-[10px] leading-relaxed text-gray-400">
                    <span className="font-bold text-amber-500 block mb-1">
                      PRODUCER NOTE:
                    </span>
                    The sequence is constructed using little-endian 32-bit
                    floating point coordinate arrays (IEEE-754). Hover over any
                    hex node on the right to dissect its exact decoded variable
                    and structural offset!
                  </div>
                </div>

                {/* Hex Byte Dissection View */}
                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                      Hex Dump Dissection (First 80 of 268 Bytes)
                    </h4>
                    <span className="text-[10px] font-mono text-[#ff9800]">
                      Total: 268 Bytes
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-3 rounded-lg bg-[#04070c] border border-[#111c2a]">
                    {renderByteGrid()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 mt-8 border-t border-[#111e30]/80 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-gray-500">
        <p>Tantra 2 MPRG Algorithmic Preset Panel • 2026</p>
        <p className="mt-1 sm:mt-0">
          Native 268-Byte Serializer • IEEE-754 Little Endian
        </p>
      </footer>

      {/* HELP & GUIDE MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a101b] border border-[#213753] rounded-xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <h3 className="text-base font-black tracking-widest text-white uppercase border-b border-[#1b2b41] pb-3 mb-4">
                TANTRA 2 SEQUENCER GUIDE
              </h3>

              <div className="text-xs text-gray-300 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                <div>
                  <h4 className="font-bold text-amber-500 uppercase tracking-wider mb-1">
                    1. Sequencing Modes
                  </h4>
                  <p className="leading-relaxed">
                    Toggle between **GATED** (square/gated block timing) and
                    **ENV A / B** (exponential decay) to replicate hardware
                    filter envelopes. Use the interactive drawing canvas to
                    quickly craft velocity arrays.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-500 uppercase tracking-wider mb-1">
                    2. Algorithmic Generators
                  </h4>
                  <p className="leading-relaxed">
                    Generate standard Psytrance ducking lines, Hadra classic
                    gallops, polyrhythmic loops, or sinusoidal waves using our
                    mathematical engines. These shapes are calibrated exactly
                    for multi-band filter/distortion modulations.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-500 uppercase tracking-wider mb-1">
                    3. Parameter Modulation
                  </h4>
                  <p className="leading-relaxed">
                    Tantra 2 is a modulator multi-effect (Filter, Distortion,
                    Delay, Flanger, Tremolo, LoFi, Glitch). Use this step
                    sequencer to map dynamic, flowing modulation lines directly
                    to any parameter within the VST host.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-500 uppercase tracking-wider mb-1">
                    4. Downloading MPRG Files
                  </h4>
                  <p className="leading-relaxed">
                    Type a preset name and hit **EXPORT PRESET**. It will
                    instantly serialize the 268-byte Little-Endian binary
                    payload. Drag the `.mprg` file into Tantra 2's modulator
                    presets folder to load it natively!
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1b2b41] flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 bg-[#101724] border border-[#20324c] hover:bg-[#1a2638] text-white rounded font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
