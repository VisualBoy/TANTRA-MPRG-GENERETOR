import React from "react";
import { Sparkles } from "lucide-react";

interface PresetSelectorProps {
  selectedPresetStyle: string | null;
  onSelectPreset: (type: string) => void;
  onUnselectPreset: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetStyle,
  onSelectPreset,
  onUnselectPreset,
}) => {
  const PRESETS = [
    { id: "psy_duck", label: "Psy Duck" },
    { id: "gallop_classic", label: "Classic Gallop" },
    { id: "gallop_tribal", label: "Tribal Gallop" },
    { id: "gallop_offbeat", label: "Offbeat Gallop" },
    { id: "decay_fast", label: "Pluck Decay" },
    { id: "decay_wide", label: "Wide Decay" },
    { id: "sine_wave", label: "Sine Wave" },
    { id: "polyrhythm", label: "Polyrhythm 3/4" },
    { id: "metric_gate", label: "Straight 1/16" },
    { id: "psy_groove", label: "Dotted Groove" },
    { id: "ratchet_stutter", label: "Hi-Tech Ratchet" },
    { id: "euclidean_gate", label: "Euclidean Gate" },
  ];

  return (
    <div className="bg-[#0a101a] border border-[#1a2d46] rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            ALGORITHMIC PRESET GENERATORS
          </h2>
        </div>
        {selectedPresetStyle && (
          <button
            onClick={onUnselectPreset}
            className="text-[10px] text-amber-500 hover:text-amber-400 font-mono font-bold uppercase underline decoration-dotted underline-offset-4 cursor-pointer"
          >
            Unselect Preset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {PRESETS.map((style) => {
          const isActive = selectedPresetStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelectPreset(style.id)}
              className={`py-2 px-3 rounded-md text-center text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                isActive
                  ? "bg-[#121f35] border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "bg-[#05080e] border-[#152338] hover:border-amber-500/30 text-gray-400 hover:text-gray-200"
              }`}
            >
              {style.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Preset Style Description Panel */}
      <div className="bg-[#05080f] border border-[#142337] rounded-lg p-3.5 flex flex-col justify-between min-h-24">
        {selectedPresetStyle === "psy_duck" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Psytrance Ducking Gate
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Kick-duck sidechain emulating 4/4 mutes with full 16th pumps.
              Focuses on offbeat accentuation for driving bassline drive.
            </p>
          </>
        )}
        {selectedPresetStyle === "gallop_classic" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Hadra Classic Gallop
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Pure driving 8-step classic gallop rhythm loop:{" "}
              <code className="text-amber-500">.BBB.BBB</code>. Delivers the
              legendary hypnotic Full-On trance drive.
            </p>
          </>
        )}
        {selectedPresetStyle === "gallop_tribal" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Hadra Tribal Gallop
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Syncopated accent triggers with humanized offbeats:{" "}
              <code className="text-amber-500">B.BBB.B.</code>. Great for
              organic tribal psytrance grooves.
            </p>
          </>
        )}
        {selectedPresetStyle === "gallop_offbeat" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Hadra Offbeat Gallop
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Sparse offbeat syncopated sequence:{" "}
              <code className="text-amber-500">..B...BB</code>. Builds space and
              tension while preserving solid low-end transients.
            </p>
          </>
        )}
        {selectedPresetStyle === "decay_fast" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Trance Pluck Exponential
              </span>
              <span className="text-[9px] font-mono text-orange-400 px-1.5 py-0.5 bg-[#1f1008] rounded-full uppercase border border-orange-950/40 font-bold">
                Decay Mode [A]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Curved decay envelope triggers falling exponentially on 1/4 or 1/8
              grids. Standard synth pluck envelope for fast acid runs.
            </p>
          </>
        )}
        {selectedPresetStyle === "decay_wide" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Exponential Decay Wide
              </span>
              <span className="text-[9px] font-mono text-orange-400 px-1.5 py-0.5 bg-[#1f1008] rounded-full uppercase border border-orange-950/40 font-bold">
                Decay Mode [B]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Long, sweeping exponential decay curves mapped to wide 1/8 or 1/16
              grids. Ideal for sweeping filter modulations and build-ups.
            </p>
          </>
        )}
        {selectedPresetStyle === "sine_wave" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Sinusoidal Sine Cycle
              </span>
              <span className="text-[9px] font-mono text-orange-400 px-1.5 py-0.5 bg-[#1f1008] rounded-full uppercase border border-orange-950/40 font-bold">
                Decay Mode [A]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Pure geometric trigonometric waves calculated precisely over
              coordinates. Perfect for smooth periodic LFO tremolo modulations.
            </p>
          </>
        )}
        {selectedPresetStyle === "polyrhythm" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Psy Polyrhythm 3/4
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Three-against-four pulse phase shift triggers. Creates complex
              evolving patterns over long bar measures.
            </p>
          </>
        )}
        {selectedPresetStyle === "metric_gate" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Straight 1/16 Metric Gate
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Absolute square gates synchronized strictly to 1/16 metric
              divisions. Great for solid, reliable rhythmic structure.
            </p>
          </>
        )}
        {selectedPresetStyle === "psy_groove" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Dotted 8th Groove Gate
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Rhythmic dotted 8th note spacing for deep, progressive trance
              grooves.
            </p>
          </>
        )}
        {selectedPresetStyle === "ratchet_stutter" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Hi-Tech Ratchet Stutter
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Machine-gun style bursts interspersed with 16th note anchors.
              Perfect for Hi-Tech glitching.
            </p>
          </>
        )}
        {selectedPresetStyle === "euclidean_gate" && (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Euclidean E(11, 32)
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-1.5 py-0.5 bg-[#09182b] rounded-full uppercase border border-cyan-900/40 font-bold">
                Gated Mode [G]
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Mathematically distributed pulses. Creates organically complex,
              interlocking rhythms.
            </p>
          </>
        )}
        {!selectedPresetStyle && (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest font-bold opacity-50">
            [ No Algorithmic Preset Selected ]
          </div>
        )}
      </div>
    </div>
  );
};
