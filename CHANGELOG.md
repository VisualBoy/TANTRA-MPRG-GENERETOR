# Changelog

All notable changes to the **Tantra 2 MPRG Sequencer** project are documented here.

---

## [1.3.0] - 2026-07-13
### Added
- **Toggleable Sequence Modifiers Pane**: Implemented a collapsible and responsive side panel for the Sequence Modifiers, hidden by default. Added a specialized "Modifiers" toggle button with adaptive styling.
- **Dynamic Tension Disabling**: The tension knob is now automatically locked and visually dimmed (reduced opacity, disabled cursor, and muted colors) during "Gated" mode, and dynamically lights up only when configuring decay envelopes.
- **Continuous Sliding Drawing Gesture**: Rebuilt the Sequencer Grid interaction model to support ripple/slide drawing. Users can press down and slide horizontally to paint multiple steps in a single fluid swipe.
- **Staircase Path Interpolation**: Improved vector step boundaries in the grid, ensuring drawing paths align perfectly with step borders without unwanted diagonal connections.

### Refactored & Optimized
- **Compact Timing Select UI**: Integrated the Timing speed selection dropdown into the main horizontal step-configuration bar to serve as both Timing label and action.
- **Mobile Header Optimization**: Collapsed "Guide" and "Byte View" buttons into adaptive icon-only buttons on small viewports, ensuring a pristine mobile VST workspace.

---

## [1.2.0] - 2026-07-13
### Added
- Created a new modular `PresetSelector.tsx` component in `/src/components/` to handle the grid of preset buttons and display contextual, description-rich panels explaining how each algorithmic generator behaves.
- Created `CHANGELOG.md` and `README.md` to establish complete operational and design documentation for team collaboration and local deployment.

### Refactored & Optimized
- **Explicit Randomizer Workflow**: Overhauled the generation engine. Selecting algorithmic presets, modifiers (Evolution, Chaos, Groove Style), or custom step lengths now queues parameters in the visual dashboard. The actual sequence is generated or mutated **only** upon clicking the primary **GENERATE / RANDOMIZE** button.
- **Unified Sidebar layout**: Moved the "SEQUENCE MANIPULATION TOOLS" from the bottom of the layout into the left-hand steps control column, renaming the panel to **SEQUENCE Modifiers** for improved ergonomic screen real-estate usage and a authentic hardware rackmount VST visual aesthetic.
- Removed duplicated mutation buttons to keep the focus cleanly on the central "GENERATE / RANDOMIZE" action.

---

## [1.1.0] - 2026-06-27
### Added
- Integrated macro dynamics controls: **Macro Evolution**, **Controlled Chaos**, and **Groove Style** filters to organically mutate the gating pattern over the 32-step grid timeline.
- Hooked up automatic step updates mapped to real-time slider value adjustments.
- Built a custom **Tension** knob allowing sound designers to dynamically bend pluck-decay and sine-cycle curves exponentially.

---

## [1.0.0] - 2026-06-15
### Added
- Core interactive SVG Sequencer Grid with support for 32 distinct 16th-note steps.
- Click-and-drag drawing actions supporting precise velocity overrides.
- Initial set of algorithmic patterns including Hadra classical gallops, exponential pluck decays, sine waves, and polyrhythm calculations.
- Native binary exporter generating perfectly formatted `.mprg` files compatible with the Tantra 2 VST preset loader.
- Fully responsive dark-themed visual user interface utilizing custom CSS and Lucide React icons.
