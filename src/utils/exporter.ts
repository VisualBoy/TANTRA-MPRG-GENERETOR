import { StepItem } from '../types';

/**
 * Exports sequence block into exactly 268-byte Tantra 2 .mprg binary file.
 */
export const exportToMPRG = (steps: StepItem[], shuffle: number, fileName: string = "Psytrance_Sequence.mprg"): void => {
  if (steps.length !== 32) {
    throw new Error("Sequence block validation failure: Array length must be 32.");
  }
  
  const buffer = new ArrayBuffer(268);
  const view = new DataView(buffer);
  
  // 1. Write Fixed Format Header Magic Signature (c3 67 ed 34)
  view.setUint8(0, 0xC3);
  view.setUint8(1, 0x67);
  view.setUint8(2, 0xED);
  view.setUint8(3, 0x34);
  
  // 4 Bytes Padding explicitly initialized to 0
  view.setUint32(4, 0x00000000, true);
  
  // Set Fixed Step Count Parameter (32)
  view.setInt32(8, 32, true);
  
  // 2. Map Payload Array Coordinates (Timing [X] and Amplitude [Y] float32 pairs)
  let byteOffset = 12;
  steps.forEach((step, i) => {
    // Tantra 2 expectations: The node positions range from 1.0 to 32.0 (one-indexed step positions)
    // Apply visual swing timing calculation (same as visual grid and audioEngine.ts)
    const rawTiming = i / 32.0;
    const shuffleFactor = shuffle / 100.0;
    let visualTiming = rawTiming;
    if (i % 2 === 1) {
      visualTiming += (shuffleFactor * 0.5) / 32.0;
    }
    const exportTiming = Math.max(1.0, Math.min(32.0, visualTiming * 32.0 + 1.0));
    const clampedValue = Math.max(0.0, Math.min(1.0, step.value));
    
    view.setFloat32(byteOffset, exportTiming, true);
    view.setFloat32(byteOffset + 4, clampedValue, true);
    byteOffset += 8;
  });
  
  // 3. Initiate Stream Serialization & Trigger Browser Native Download
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".mprg") ? fileName : `${fileName}.mprg`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
