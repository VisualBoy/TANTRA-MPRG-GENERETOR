import React, { useRef, useState, useEffect } from 'react';
import { StepItem, SequencerMode } from '../types';

interface SequencerGridProps {
  steps: StepItem[];
  mode: SequencerMode;
  tension: number; // 1.0 to 10.0 for decay mode
  smooth: number;
  shuffle: number;
  onChange: (steps: StepItem[]) => void;
  playheadIndex: number | null; // index of active playing step (0-31), or null
  snapSetting?: string; // '1/32' | '1/16' | '1/8' | '1/4' | 'free'
}

export const SequencerGrid: React.FC<SequencerGridProps> = ({
  steps,
  mode,
  tension,
  smooth,
  shuffle,
  onChange,
  playheadIndex,
  snapSetting = '1/32',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const activeDragIndexRef = useRef<number | null>(null);
  const lastUpdatedStepRef = useRef<number | null>(null);

  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);

  // Keep track of dimensions for absolute calculations
  const [dimensions, setDimensions] = useState({ width: 800, height: 260 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(300, width),
          height: Math.max(150, height),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const totalSteps = 32;
  const horizPadding = 12;

  // Coordinate helper mapping 0.0-1.0 timing to visual padded canvas pixels
  const getX = (t: number) => {
    return horizPadding + t * (dimensions.width - horizPadding * 2);
  };

  const padding = 12;
  const graphHeight = dimensions.height - padding * 2;

  // Generate on-the-fly visual swing timing calculations
  const getVisualTiming = (i: number) => {
    if (i < 0) return 0.0;
    if (i >= totalSteps) return 1.0;
    const rawTiming = steps[i]?.timing ?? (i / 32.0);
    const shuffleFactor = shuffle / 100.0;
    let visualTiming = rawTiming;
    if (i % 2 === 1) {
      visualTiming += (shuffleFactor * 0.5) / 32.0;
    }
    return Math.max(0.0, Math.min(1.0, visualTiming));
  };

  const getSvgCoordinatesByTiming = (stepTiming: number, val: number) => {
    const x = getX(stepTiming);
    const y = padding + (1.0 - val) * graphHeight;
    return { x, y };
  };

  // Find node closest to mouse client coordinates
  const findClosestNodeIndex = (clientX: number, clientY: number) => {
    if (!containerRef.current) return -1;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < totalSteps; i++) {
      const tLeft = getVisualTiming(i);
      const { x, y } = getSvgCoordinatesByTiming(tLeft, steps[i].value);
      const dx = relativeX - x;
      const dy = relativeY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // Larger threshold (24px) for easy grabbing
    if (minDistance < 24) {
      return closestIndex;
    }
    return -1;
  };

  // Handle setting a step's value based on mouse coordinates (strictly linear baseline mapping)
  const handleStepValueFromEvent = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Calculate step index purely using visual width slices with padding taken into account
    const activeWidth = rect.width - horizPadding * 2;
    const relativeXAdjusted = relativeX - horizPadding;
    const stepIndex = Math.max(0, Math.min(totalSteps - 1, Math.floor((relativeXAdjusted / activeWidth) * totalSteps)));
    
    // Calculate vertical amplitude [0.0, 1.0] (top is 1.0, bottom is 0.0)
    const clampY = Math.max(0, Math.min(graphHeight, relativeY - padding));
    const value = 1.0 - clampY / graphHeight;
    const clampedValue = Math.max(0.0, Math.min(1.0, Number(value.toFixed(4))));

    // Trigger update if it's a different step or value
    if (lastUpdatedStepRef.current !== stepIndex || steps[stepIndex].value !== clampedValue) {
      const newSteps = [...steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        value: clampedValue,
      };
      onChange(newSteps);
      lastUpdatedStepRef.current = stepIndex;
    }
  };

  // Drag node horizontally and vertically
  const handleNodeDrag = (clientX: number, clientY: number) => {
    const idx = activeDragIndexRef.current;
    if (idx === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Calculate timing (X)
    const activeWidth = rect.width - horizPadding * 2;
    const relativeXAdjusted = relativeX - horizPadding;
    let rawTiming = relativeXAdjusted / activeWidth;
    rawTiming = Math.max(0.0, Math.min(1.0, rawTiming));

    // Snapping logic
    let snappedTiming = rawTiming;
    if (snapSetting === '1/32') {
      snappedTiming = Math.round(rawTiming * 32) / 32;
    } else if (snapSetting === '1/16') {
      snappedTiming = Math.round(rawTiming * 16) / 16;
    } else if (snapSetting === '1/8') {
      snappedTiming = Math.round(rawTiming * 8) / 8;
    } else if (snapSetting === '1/4') {
      snappedTiming = Math.round(rawTiming * 4) / 4;
    }

    // Ripple / Cascade Horizontal Drag logic (Tantra Native Feature)
    const prevTiming = steps[idx].timing;
    let tempTimings = steps.map(s => s.timing);
    tempTimings[idx] = snappedTiming;

    if (snappedTiming > prevTiming) {
      // Dragging right: cascade rightward
      for (let i = idx + 1; i < totalSteps; i++) {
        if (tempTimings[i] < tempTimings[i - 1]) {
          tempTimings[i] = tempTimings[i - 1];
        }
      }
      // Respect global boundary layout (cap final node at 1.0)
      if (tempTimings[totalSteps - 1] > 1.0) {
        tempTimings[totalSteps - 1] = 1.0;
        for (let i = totalSteps - 2; i >= idx; i--) {
          if (tempTimings[i] > tempTimings[i + 1]) {
            tempTimings[i] = tempTimings[i + 1];
          }
        }
      }
    } else if (snappedTiming < prevTiming) {
      // Dragging left: cascade leftward
      for (let i = idx - 1; i >= 0; i--) {
        if (tempTimings[i] > tempTimings[i + 1]) {
          tempTimings[i] = tempTimings[i + 1];
        }
      }
      // Respect global boundary layout (cap start node at 0.0)
      if (tempTimings[0] < 0.0) {
        tempTimings[0] = 0.0;
        for (let i = 1; i <= idx; i++) {
          if (tempTimings[i] < tempTimings[i - 1]) {
            tempTimings[i] = tempTimings[i - 1];
          }
        }
      }
    }

    // Calculate value (Y)
    const clampY = Math.max(0, Math.min(graphHeight, relativeY - padding));
    const value = 1.0 - clampY / graphHeight;
    const finalValue = Math.max(0.0, Math.min(1.0, Number(value.toFixed(4))));

    // Update state
    const newSteps = steps.map((step, i) => {
      if (i === idx) {
        return {
          timing: Number(tempTimings[i].toFixed(4)),
          value: finalValue,
        };
      }
      return {
        ...step,
        timing: Number(tempTimings[i].toFixed(4)),
      };
    });
    onChange(newSteps);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const closestIdx = findClosestNodeIndex(e.clientX, e.clientY);
    if (closestIdx !== -1) {
      activeDragIndexRef.current = closestIdx;
      setDraggedNodeIndex(closestIdx);
    } else {
      activeDragIndexRef.current = null;
      setDraggedNodeIndex(null);
      isDrawingRef.current = true;
      lastUpdatedStepRef.current = null;
      handleStepValueFromEvent(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const closestIdx = findClosestNodeIndex(touch.clientX, touch.clientY);
    if (closestIdx !== -1) {
      activeDragIndexRef.current = closestIdx;
      setDraggedNodeIndex(closestIdx);
    } else {
      activeDragIndexRef.current = null;
      setDraggedNodeIndex(null);
      isDrawingRef.current = true;
      lastUpdatedStepRef.current = null;
      handleStepValueFromEvent(touch.clientX, touch.clientY);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (activeDragIndexRef.current !== null) {
        handleNodeDrag(e.clientX, e.clientY);
      } else if (isDrawingRef.current) {
        handleStepValueFromEvent(e.clientX, e.clientY);
      } else {
        // Track hover node index when not dragging or drawing
        const hoverIdx = findClosestNodeIndex(e.clientX, e.clientY);
        setHoveredNodeIndex(hoverIdx !== -1 ? hoverIdx : null);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (activeDragIndexRef.current !== null) {
        handleNodeDrag(touch.clientX, touch.clientY);
      } else if (isDrawingRef.current) {
        handleStepValueFromEvent(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      isDrawingRef.current = false;
      activeDragIndexRef.current = null;
      setDraggedNodeIndex(null);
      lastUpdatedStepRef.current = null;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [steps, dimensions, snapSetting]);

  // Build grid lines
  const gridLines = [];
  // Vertical subdivision lines for each step
  for (let i = 1; i < totalSteps; i++) {
    const tLeft = getVisualTiming(i);
    const x = getX(tLeft);
    const isQuarter = i % 8 === 0;
    const isBeat = i % 4 === 0;
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={dimensions.height}
        stroke={isQuarter ? '#21304a' : isBeat ? '#152135' : '#0d1624'}
        strokeWidth={isQuarter ? '1.5' : '1'}
        strokeDasharray={isBeat ? '' : '3 3'}
      />
    );
  }

  // Horizontal velocity tier lines (0.0, 0.25, 0.5, 0.75, 1.0)
  const subdivisions = [0.0, 0.25, 0.5, 0.75, 1.0];
  const horizontalGridLines = subdivisions.map((sub, idx) => {
    const y = padding + (1.0 - sub) * graphHeight;
    return (
      <g key={`h-grid-${idx}`}>
        <line
          x1={getX(0)}
          y1={y}
          x2={getX(1.0)}
          y2={y}
          stroke="#101929"
          strokeWidth="1"
          strokeDasharray={sub === 0.0 || sub === 1.0 ? '' : '4 4'}
        />
        {/* Subtle label */}
        {sub > 0 && sub < 1 && (
          <text
            x={6}
            y={y - 4}
            fill="#1f3049"
            className="text-[9px] font-mono select-none"
          >
            {sub.toFixed(2)}
          </text>
        )}
      </g>
    );
  });

  // Calculate rendering paths based on active mode
  let strokePath = '';
  let fillPath = '';

  if (mode === 'gated') {
    // GATED/SQUARE MODE PATH
    // Path moves from left to right, creating square blocks
    const points: string[] = [];
    
    // Start bottom-left
    points.push(`M ${getX(0)},${dimensions.height - padding}`);

    for (let i = 0; i < totalSteps; i++) {
      const tLeft = getVisualTiming(i);
      const tRight = i === 31 ? 1.0 : getVisualTiming(i + 1);
      
      const xLeft = getX(tLeft);
      const xRight = getX(tRight);
      const y = padding + (1.0 - steps[i].value) * graphHeight;
      
      if (i === 0 && xLeft > getX(0)) {
        // Ensure the baseline or initial gate block extends flat/orthogonally from true grid start
        points.push(`L ${xLeft},${dimensions.height - padding}`);
      }
      
      // Horizontal segment across the step width at its value height
      points.push(`L ${xLeft},${y}`);
      points.push(`L ${xRight},${y}`);
    }

    // Connect back to bottom-right for the fill
    const fillClosed = [...points, `L ${getX(1.0)},${dimensions.height - padding}`, 'Z'].join(' ');
    strokePath = points.join(' ');
    fillPath = fillClosed;

  } else {
    // CONTINUOUS DECAY ENVELOPE MODE PATH
    // Exponential curve decaying down from trigger values
    const strokePoints: string[] = [];
    const fillPoints: string[] = [];

    const baseVal = 0.0;
    const { y: baseY } = getSvgCoordinatesByTiming(0, baseVal);

    const firstLeft = getVisualTiming(0);
    const firstX = getX(firstLeft);
    const firstY = padding + (1.0 - steps[0].value) * graphHeight;

    // Anchor Node 01 correctly so it tracks flatly at start or shifts vertical trigger phase
    strokePoints.push(`M ${getX(0)},${firstX > getX(0) ? baseY : firstY}`);
    fillPoints.push(`M ${getX(0)},${baseY}`);

    for (let i = 0; i < totalSteps; i++) {
      const triggerVal = steps[i].value;
      const tLeft = getVisualTiming(i);
      const tRight = i === 31 ? 1.0 : getVisualTiming(i + 1);
      
      const xLeft = getX(tLeft);
      const xRight = getX(tRight);

      if (i === 0 && xLeft > getX(0)) {
        strokePoints.push(`L ${xLeft},${baseY}`);
        fillPoints.push(`L ${xLeft},${baseY}`);
      }

      // Draw a vertical step transition to the next trigger value
      const yLeft = padding + (1.0 - triggerVal) * graphHeight;
      strokePoints.push(`L ${xLeft},${yLeft}`);
      fillPoints.push(`L ${xLeft},${yLeft}`);

      if (triggerVal === 0) {
        // Flat zero step
        strokePoints.push(`L ${xRight},${baseY}`);
        fillPoints.push(`L ${xRight},${baseY}`);
      } else {
        // Exp decay curve across the column width
        // Subdivide step width into 10 interpolation points for maximum precision
        const subdivisions = 10;
        for (let j = 1; j <= subdivisions; j++) {
          const ratio = j / subdivisions; // 0.0 to 1.0
          const xSub = xLeft + ratio * (xRight - xLeft);
          
          // Exponential tension mapping: decay towards 0
          const decayedVal = triggerVal * Math.exp(-tension * ratio);
          const ySub = padding + (1.0 - decayedVal) * graphHeight;

          strokePoints.push(`L ${xSub},${ySub}`);
          fillPoints.push(`L ${xSub},${ySub}`);
        }
      }
    }

    // Close fill path
    fillPoints.push(`L ${getX(1.0)},${baseY}`);
    fillPoints.push('Z');

    strokePath = strokePoints.join(' ');
    fillPath = fillPoints.join(' ');
  }

  // Generate step timeline labels (e.g., "01 . . 03 . . 05 . . . 31")
  const renderTimelineLabels = () => {
    const labels = [];
    for (let i = 0; i < totalSteps; i++) {
      const stepNum = i + 1;
      const isOdd = stepNum % 2 !== 0;
      const tLeft = getVisualTiming(i);
      const x = getX(tLeft);

      if (isOdd) {
        labels.push(
          <text
            key={`lbl-${i}`}
            x={x}
            y="18"
            textAnchor="middle"
            fill="#384f6e"
            className="text-[10px] font-mono font-medium tracking-tighter"
          >
            {stepNum < 10 ? `0${stepNum}` : stepNum}
          </text>
        );
      } else {
        labels.push(
          <circle
            key={`lbl-${i}`}
            cx={x}
            cy="14"
            r="1.5"
            fill="#1b2a41"
          />
        );
      }
    }
    return labels;
  };

  return (
    <div className="flex flex-col w-full bg-[#070b12] border border-[#142337] rounded-lg overflow-hidden shadow-2xl relative">
      {/* Sequencer SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative w-full h-64 cursor-crosshair select-none overflow-hidden bg-gradient-to-b from-[#080e1a] to-[#040811]"
        style={{ touchAction: 'none' }}
      >
        <svg className="absolute inset-0 w-full h-full">
          {/* Defs for glow gradients */}
          <defs>
            {/* Glowing amber underfill gradient */}
            <linearGradient id="envelope-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7b00" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#ff7b00" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ff7b00" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing active block stroke shadow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines}
          {horizontalGridLines}

          {/* Highlight translucent amber fills */}
          {fillPath && (
            <path
              d={fillPath}
              fill="url(#envelope-fill)"
              className="pointer-events-none"
            />
          )}

          {/* Core envelope white/amber border stroke */}
          {strokePath && (
            <path
              d={strokePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="pointer-events-none drop-shadow-[0_0_4px_rgba(255,123,0,0.8)]"
            />
          )}

          {/* Dot markers at step trigger heights for perfect visual feedback */}
          {steps.map((step, idx) => {
            const tLeft = getVisualTiming(idx);
            const x = getX(tLeft);
            const y = padding + (1.0 - step.value) * graphHeight;
            const isActive = playheadIndex === idx;
            const isHovered = hoveredNodeIndex === idx;
            const isDragged = draggedNodeIndex === idx;
            const hasValue = step.value > 0;

            return (
              <g key={`marker-${idx}`} className="pointer-events-none">
                {/* Outer pulsing glow indicator if active playhead */}
                {isActive && hasValue && (
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="#ffaa00"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}
                {/* Hover/drag glowing aura */}
                {(isHovered || isDragged) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isDragged ? 10 : 8}
                    fill="#ffaa00"
                    opacity="0.25"
                    style={{
                      filter: 'blur(1px)',
                    }}
                  />
                )}
                {/* Outer shadow ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={hasValue ? 5 : (isHovered || isDragged) ? 5 : 3.5}
                  fill={hasValue ? "#060c15" : "#040811"}
                  stroke={hasValue ? "#ff9800" : (isHovered || isDragged) ? "#ff9800" : "#1b2d46"}
                  strokeWidth={hasValue ? 2 : (isHovered || isDragged) ? 1.8 : 1.2}
                  style={{
                    filter: hasValue || isHovered || isDragged ? 'drop-shadow(0 0 3px rgba(255,152,0,0.8))' : 'none',
                    transition: 'r 0.15s ease, stroke 0.15s ease, fill 0.15s ease',
                  }}
                />
                {/* Core white dot for active nodes */}
                {hasValue && (
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#ffffff"
                  />
                )}
              </g>
            );
          })}

          {/* Running playback sweep line */}
          {playheadIndex !== null && (() => {
            const tLeft = getVisualTiming(playheadIndex);
            const tRight = playheadIndex === 31 ? 1.0 : getVisualTiming(playheadIndex + 1);
            const xLeft = getX(tLeft);
            const xWidth = getX(tRight) - xLeft;

            return (
              <g className="pointer-events-none">
                {/* Vertical glowing bar */}
                <rect
                  x={xLeft}
                  y={0}
                  width={xWidth}
                  height={dimensions.height}
                  fill="#ffaa00"
                  opacity="0.08"
                />
                <line
                  x1={xLeft}
                  y1={0}
                  x2={xLeft}
                  y2={dimensions.height}
                  stroke="#ffaa00"
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(255,170,0,0.9))',
                  }}
                />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Timeline Labels Footer */}
      <div className="w-full h-7 bg-[#05080e] border-t border-[#101c2e] flex items-center relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderTimelineLabels()}
        </svg>
      </div>
    </div>
  );
};
