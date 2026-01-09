import React from 'react';
import { motion } from 'framer-motion';
import { NOTE_NAMES } from '../../utils/musicTheory';

interface PianoKeyboardProps {
  startMidi?: number;
  endMidi?: number;
  activeNotes?: number[];
  correctNotes?: number[];
  wrongNotes?: number[];
  onNoteClick?: (midi: number) => void;
  disabled?: boolean;
}

const isBlackKey = (midi: number) => {
  const note = midi % 12;
  return [1, 3, 6, 8, 10].includes(note); // C#, D#, F#, G#, A#
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startMidi = 48, // C3
  endMidi = 72,  // C5
  activeNotes = [],
  correctNotes = [],
  wrongNotes = [],
  onNoteClick,
  disabled = false
}) => {
  const keys = [];
  
  // We iterate through WHITE keys only for the main structure
  // And attach black keys to them
  for (let m = startMidi; m <= endMidi; m++) {
    if (!isBlackKey(m)) {
      keys.push(m);
    }
  }

  const getKeyColor = (midi: number, isBlack: boolean) => {
    if (correctNotes.includes(midi)) return 'bg-secondary text-white'; // Green
    if (wrongNotes.includes(midi)) return 'bg-accent text-black'; // Orange
    if (activeNotes.includes(midi)) return 'bg-primary text-white'; // Purple
    return isBlack ? 'bg-dark text-white' : 'bg-white text-dark';
  };

  const MotionButton = motion.button as any;

  return (
    <div className="flex justify-center select-none overflow-x-auto p-4 pb-8 w-full max-w-full">
      <div className="flex relative bg-white p-1 rounded-xl border-3 border-dark shadow-neo min-w-max mx-auto">
        {keys.map((midi) => {
          const noteName = NOTE_NAMES[midi % 12];
          const hasBlackNext = isBlackKey(midi + 1) && (midi + 1 <= endMidi);
          const isWhiteKeyCorrect = correctNotes.includes(midi);
          const isWhiteKeyWrong = wrongNotes.includes(midi);
          const isWhiteKeyActive = activeNotes.includes(midi);
          
          return (
            <div key={midi} className="relative group flex-shrink-0">
              {/* White Key */}
              <MotionButton
                whileTap={!disabled ? { y: 2 } : {}}
                disabled={disabled}
                onClick={() => onNoteClick?.(midi)}
                className={`
                  w-10 sm:w-12 md:w-14 h-32 sm:h-40 md:h-48 
                  border-r border-dark last:border-r-0
                  rounded-b-lg flex items-end justify-center pb-4
                  transition-colors duration-200 z-0
                  ${getKeyColor(midi, false)}
                  ${!disabled && !isWhiteKeyCorrect && !isWhiteKeyWrong && !isWhiteKeyActive ? 'hover:bg-slate-100' : ''}
                  ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                `}
              >
                <span className="font-bold text-xs sm:text-sm opacity-50">{noteName}{Math.floor(midi/12)-1}</span>
              </MotionButton>

              {/* Black Key */}
              {hasBlackNext && (
                <MotionButton
                  whileTap={!disabled ? { y: 2 } : {}}
                  disabled={disabled}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onNoteClick?.(midi + 1);
                  }}
                  className={`
                    absolute top-0 -right-3 sm:-right-4 md:-right-5
                    w-6 sm:w-8 md:w-10 h-20 sm:h-24 md:h-32
                    border-2 border-dark rounded-b-lg
                    z-10 shadow-md
                    ${getKeyColor(midi + 1, true)}
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${!disabled && !correctNotes.includes(midi+1) && !wrongNotes.includes(midi+1) && !activeNotes.includes(midi+1) ? 'hover:bg-slate-800' : ''}
                  `}
                >
                </MotionButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

