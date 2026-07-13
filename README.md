# Tantra 2 MPRG Sequencer

An advanced algorithmic preset generator and interactive visual sequencer engineered for the **Tantra 2 VST**. 

<img width="1126" height="928" alt="1783951632854(1)" src="https://github.com/user-attachments/assets/742b0df0-7e18-4cf3-b2eb-f61136eda9ee" />

This application enables sound designers and music producers to craft complex, mathematically precise gated and decay sequences, customize them with high-fidelity macro modulations, and export them directly as native `.mprg` files compatible with Tantra 2.

---

## 🎨 Visual Philosophy & Theme
The application is wrapped in a high-contrast, immersive, and eye-friendly **Midnight Cosmic Slate** theme. Designed to sit comfortably alongside professional Digital Audio Workstations (DAWs), the interface offers:
- Generous, clean spatial padding and responsive structural components.
- Bright amber and cyan indicators paired with crisp sans-serif and mono typography (featuring Space Grotesk and JetBrains Mono vibes).
- High-fidelity vector elements including a responsive, interactive SVG Sequencer Grid with smooth tactile hover states.

---

## 🚀 Key Features

### 1. Interactive SVG Sequencer Grid
- **Multi-Mode Drawing**: Draw and visualize 32-step gate volumes or exponential decay envelope curvatures directly on a clean canvas.
- **Velocity Visualization**: Visual vertical columns dynamically representing step values from `0.0` (off) to `1.0` (peak volume/duration).

### 2. Algorithmic Preset Generators
A wide-ranging array of industry-standard algorithmic templates can be instantly queued:
- **Psy Duck**: Emulates classic four-on-the-floor ducking pumps to preserve kick transients.
- **Classic, Tribal, & Offbeat Gallops**: Legendarily driving psytrance sub-grooves (.BBB.BBB, B.BBB.B., and sparse offbeat).
- **Pluck & Wide Decays**: Exponential curves mapped neatly across 1/4, 1/8, or 1/16 grids.
- **Sine Wave Cycles**: Pure trigonometric waves calculated precisely for smooth, periodic tremolo.
- **Psy Polyrhythm (3/4)**: Intricate three-against-four division cycles creating long-bar metric phase-shifting.
- **Straight 1/16, Dotted Groove, Hi-Tech Ratchet**, and **Björklund Euclidean Gates**.

### 3. Paramount Explicit Refactoring: "Generate / Randomize"
- To maintain precise user control, choosing presets, adjustments, or speed configurations does **not** instantly override the active manual grid.
- All selected parameters (Preset Style, Evolution, Chaos, Groove Style, Jitter) are queued up and computed **only when you click the prominent "GENERATE / RANDOMIZE" button**, providing an intentional and tactile workspace workflow.

### 4. Consolidated SEQUENCE Modifiers
Conveniently accessible via the collapsible **Modifiers** toggle button, the **SEQUENCE Modifiers** pane can be hidden or shown at will (hidden by default). This provides a spacious workspace for dragging and drawing sequences on mobile devices. The panel aggregates:
- **Evolution**: A macro-envelope ramp that evolves offbeat velocities smoothly across the 32 steps.
- **Chaos**: High-resolution non-destructive micro-velocity jitter applied selectively to offbeats.
- **Groove Style Selector**: Switch structural baselines between *Driving*, *Tribal Accent*, and *Linear*.
- **Jitter (Humanizer)**: Controlled micro-timing or random amplitude variations to prevent ear fatigue.
- **Quick Shift Tools**: Shift steps left or right, invert the volume peaks, or reverse the entire sequence timeline.

### 5. Responsive Mobile Workspace & Advanced Drawing Gestures
- **Collapsible Sidebar**: Hide the modifier controls to focus completely on the 32-step sequence canvas.
- **Continuous Slide Gesture (Ripple Drawing)**: Click/touch and slide horizontally to draw or paint continuous steps in a single fluid gesture.
- **Staircase Interpolation**: Step modifications now snap with brick/staircase alignment, preventing diagonal paths during fast gestures.
- **Dynamic Tension Dimming**: The **Tension** knob is visually dimmed and locked during "Gated" mode, and comes alive with custom glow colors when editing decay or envelope modes.
- **Dense Adaptive Layouts**: Custom headers and control groupings that seamlessly adapt to any viewport size, hiding text labels for secondary items on mobile while preserving full functionality.

### 6. Native Exporter
- Downloads fully serialized and compliant binary `.mprg` files.
- Integrates seamlessly into the Tantra 2 VST's presets folder.

---

## 🛠️ Code Architecture
The code is split modularly for maintainability and scalability:
- **`/src/types.ts`**: Core domain representations for step configurations, timing coordinates, preset definitions, and sequencer parameters.
- **`/src/components/PresetSelector.tsx`**: Renders the algorithmic list of presets along with their informative dynamic utility descriptions.
- **`/src/components/SequencerGrid.tsx`**: High-performance interactive SVG grid handling clicking, dragging, and redrawing of custom shapes.
- **`/src/components/Knob.tsx`**: Tactile audio-hardware-styled knobs handling fine value modifications.
- **`/src/utils/generators.ts`**: Pure mathematical algorithm generators (Euclidean math, trigonometric calculations, Hadra gallops, and exponential decay envelopes).
- **`/src/utils/exporter.ts`**: Binary file serialization mapping step arrays to native Tantra 2 formats.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v10+)

### Running Locally
1. Clone or copy the project workspace.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Run the high-performance local Vite development server:
   ```bash
   npm run dev
   ```
4. Build the application for production deployment:
   ```bash
   npm run build
   ```
