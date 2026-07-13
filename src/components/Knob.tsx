import React, { useRef, useState, useEffect } from 'react';

interface KnobProps {
  id?: string;
  label: string;
  value: number; // 0.0 to 1.0 or custom range
  min?: number;
  max?: number;
  defaultValue?: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
  className?: string;
  color?: string; // Tailwind glow accent
  disabled?: boolean;
}

export const Knob: React.FC<KnobProps> = ({
  id,
  label,
  value,
  min = 0,
  max = 100,
  defaultValue = 50,
  onChange,
  formatValue = (v) => v.toFixed(1),
  className = '',
  color = 'orange',
  disabled = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartValueRef = useRef(0);

  const range = max - min;
  const normalizedValue = (value - min) / range; // 0 to 1

  // Map 0..1 value to rotation degrees (-135 to +135 deg)
  const minAngle = -135;
  const maxAngle = 135;
  const currentAngle = minAngle + normalizedValue * (maxAngle - minAngle);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartValueRef.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    // Only drag with one finger
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartYRef.current = e.touches[0].clientY;
    dragStartValueRef.current = value;
  };

  const handleDoubleClick = () => {
    if (disabled) return;
    onChange(defaultValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartYRef.current - e.clientY; // drag up = positive delta
      // 150px height change = full sweep
      const deltaValue = (deltaY / 150) * range;
      const newValue = Math.max(min, Math.min(max, dragStartValueRef.current + deltaValue));
      onChange(newValue);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaY = dragStartYRef.current - e.touches[0].clientY;
      const deltaValue = (deltaY / 150) * range;
      const newValue = Math.max(min, Math.min(max, dragStartValueRef.current + deltaValue));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, value, min, max, range, onChange]);

  // Color mappings
  const glowColors: Record<string, { ring: string; dot: string; shadow: string; glow: string }> = {
    orange: {
      ring: '#ff9800',
      dot: '#ffb74d',
      shadow: 'rgba(255, 152, 0, 0.4)',
      glow: 'shadow-[0_0_12px_rgba(255,152,0,0.4)]',
    },
    amber: {
      ring: '#ffc107',
      dot: '#ffe082',
      shadow: 'rgba(255, 193, 7, 0.4)',
      glow: 'shadow-[0_0_12px_rgba(255,193,7,0.4)]',
    },
    blue: {
      ring: '#00d2ff',
      dot: '#80e8ff',
      shadow: 'rgba(0, 210, 255, 0.4)',
      glow: 'shadow-[0_0_12px_rgba(0,210,255,0.4)]',
    },
    cyan: {
      ring: '#00f5d4',
      dot: '#80faea',
      shadow: 'rgba(0, 245, 212, 0.4)',
      glow: 'shadow-[0_0_12px_rgba(0,245,212,0.4)]',
    },
  };

  const colors = glowColors[color] || glowColors.orange;

  // Render SVG arc
  const radius = 22;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  // Arc starts at -135deg (which is 135deg from top, i.e., 225deg absolute)
  // Total arc length is 270 degrees
  const activeArcLength = normalizedValue * 270;
  const strokeDashoffset = circumference - (activeArcLength / 360) * circumference;
  const strokeDasharray = circumference;

  return (
    <div className={`flex flex-col items-center select-none ${disabled ? 'opacity-40' : ''} ${className}`} id={id}>
      {/* Knob Label */}
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 leading-none">
        {label}
      </span>

      {/* Outer Dial Container */}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        className={`relative w-14 h-14 rounded-full bg-[#0a0f18] border border-[#1b2a41] flex items-center justify-center transition-shadow duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-ns-resize'} ${isDragging ? 'shadow-[0_0_15px_rgba(255,255,255,0.05)] border-gray-600' : ''}`}
      >
        {/* Status indicator ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          {/* Background inactive ring (from -135deg to +135deg, which is 270 degrees total) */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="#121d2d"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={(90 / 360) * circumference} // 270 degree arc remaining
            transform="rotate(135, 28, 28)"
          />
          {/* Active colored ring */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={disabled ? '#1e293b' : colors.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(135, 28, 28)"
            className="transition-all duration-75"
            style={{
              filter: disabled ? 'none' : `drop-shadow(0 0 3px ${colors.shadow})`,
            }}
          />
        </svg>

        {/* Central rotating cap */}
        <div
          className="relative w-9 h-9 rounded-full bg-gradient-to-b from-[#182334] to-[#0d141f] border border-[#1f2e46] flex items-center justify-center shadow-inner"
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transition: isDragging ? 'none' : 'transform 150ms ease-out',
          }}
        >
          {/* Direction indicator tick dot */}
          <div
            className="absolute top-1 w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: disabled ? '#475569' : colors.dot,
              boxShadow: disabled ? 'none' : `0 0 6px ${colors.ring}`,
            }}
          />
        </div>
      </div>

      {/* Knob Value Readout */}
      <span className="text-[11px] font-mono font-medium text-gray-300 mt-1.5 select-all leading-none bg-[#0a1017] border border-[#152335]/50 px-1.5 py-0.5 rounded text-center min-w-11">
        {formatValue(value)}
      </span>
    </div>
  );
};
