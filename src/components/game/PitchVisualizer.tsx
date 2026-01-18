import React, { useRef, useEffect, useState } from 'react';
import type { PitchData } from '../../hooks/usePitchDetector';

interface PitchVisualizerProps {
  pitch: PitchData | null;
  isListening: boolean;
  targetMidi?: number | null; // Optional target pitch to draw
  className?: string;
}

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({ 
  pitch, 
  isListening,
  targetMidi,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Store history: array of { time, midi, cents }
  const historyRef = useRef<Array<{ time: number; midi: number; cents: number }>>([]);

  // Config
  const NOTE_HEIGHT = 15; // Reduced to show more notes (about 33 semitones visible)
  const SPEED = 2; // Pixels per frame
  
  // Dynamic range centering - Fixed at E4 for better range coverage (C3 to G5+)
  const [centerMidi, setCenterMidi] = useState(64); // E4

  useEffect(() => {
    // Only move view when there's a specific target (SingMode)
    // In FreeMode, keep the view fixed at C4 for visual stability
    if (targetMidi) {
        setCenterMidi(targetMidi);
    }
    // Removed: auto-following user pitch which caused jittery movement
  }, [targetMidi]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset layout
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#16161a'; // Dark background
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines (Semitones)
    const centerY = h / 2;
    // Increased buffer significantly to +48 to ensure grid fills everything
    const visibleSemitones = Math.ceil(h / NOTE_HEIGHT) + 48;
    const startMidi = Math.floor(centerMidi - visibleSemitones / 2);
    const endMidi = Math.ceil(centerMidi + visibleSemitones / 2);

    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "bold 12px Inter";
    
    for (let m = startMidi; m <= endMidi; m++) {
      const y = centerY - (m - centerMidi) * NOTE_HEIGHT;
      
      // Handle negative MIDI values safely for note name lookup
      const noteIndex = ((m % 12) + 12) % 12;
      const noteName = noteNames[noteIndex];
      const isBlackKey = noteName.includes("#");
      const isC = noteName === "C";
      const isTarget = targetMidi && m === targetMidi;

      // Draw Target Zone Background
      if (isTarget) {
          ctx.fillStyle = "rgba(44, 182, 125, 0.2)"; // Greenish tint
          ctx.fillRect(0, y - NOTE_HEIGHT/2, w, NOTE_HEIGHT);
      }

      // Line style - Brighter lines as requested
      if (isTarget) {
        ctx.strokeStyle = "#2CB67D"; // Target Green
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line for target
      } else if (isC) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Brighter C
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      } else if (!isBlackKey) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Brighter white keys
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"; // Brighter black keys
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Label
      if (!isBlackKey || visibleSemitones < 20 || isTarget) { 
        ctx.fillStyle = isTarget ? "#2CB67D" : (isC ? "#fff" : "rgba(255, 255, 255, 0.5)");
        const octave = Math.floor(m / 12) - 1;
        ctx.fillText(`${noteName}${octave}`, w - 10, y);
      }
    }
    
    // Reset Dash
    ctx.setLineDash([]);

    // Update History
    const now = Date.now();
    if (isListening && pitch) {
      historyRef.current.push({
        time: now,
        midi: pitch.midi + pitch.cents / 100, // Precise pitch
        cents: pitch.cents
      });
    } else if (isListening) {
        // Gap in singing
        historyRef.current.push({ time: now, midi: -1, cents: 0 }); 
    }

    const maxAge = (w / SPEED) * 16; 
    const cutoff = now - Math.max(10000, maxAge);
    if (historyRef.current.length > 0 && historyRef.current[0].time < cutoff) {
        historyRef.current = historyRef.current.filter(p => p.time > cutoff);
    }

    // Draw Pitch Line
    const cursorX = w * 0.8; 
    
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "rgba(127, 90, 240, 0)"); 
    gradient.addColorStop(0.5, "rgba(127, 90, 240, 1)");
    gradient.addColorStop(1, "#2CB67D"); 
    ctx.strokeStyle = gradient;

    let started = false;

    for (let i = historyRef.current.length - 1; i >= 0; i--) {
        const point = historyRef.current[i];
        if (point.midi < 0) {
            ctx.stroke();
            started = false;
            continue;
        }

        const dt = now - point.time;
        const x = cursorX - (dt * (SPEED / 10)); 
        
        if (x < -10) break;

        const y = centerY - (point.midi - centerMidi) * NOTE_HEIGHT;

        if (!started) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            started = true;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw Cursor Indicator (Current Pitch)
    if (pitch && isListening) {
        const y = centerY - ((pitch.midi + pitch.cents/100) - centerMidi) * NOTE_HEIGHT;
        
        // Determine if hitting target
        const isHitting = targetMidi && Math.abs((pitch.midi + pitch.cents/100) - targetMidi) < 0.5;

        // Glow effect
        ctx.shadowBlur = isHitting ? 20 : 15;
        ctx.shadowColor = isHitting ? "#2CB67D" : "#7F5AF0";
        
        ctx.beginPath();
        ctx.arc(cursorX, y, isHitting ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isHitting ? "#2CB67D" : "#7F5AF0";
        ctx.fill();
        
        ctx.shadowBlur = 0; 
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [centerMidi, pitch, isListening, targetMidi]); 

  return (
    <div 
      className={className || ''} 
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
