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
    if (correctNotes.includes(midi)) return 'bg-secondary text-white';
    if (wrongNotes.includes(midi)) return 'bg-accent text-black';
    if (activeNotes.includes(midi)) return 'bg-primary text-white';
    return isBlack ? 'bg-dark text-white' : 'bg-white text-dark';
  };

  const MotionButton = motion.button as any;

  return (
    <div className="flex justify-start sm:justify-center select-none overflow-x-auto hide-scrollbar p-2 sm:p-4 pb-4 sm:pb-8 w-full max-w-full">
      <div className="flex relative bg-white p-1 rounded-lg sm:rounded-xl border-3 border-dark shadow-neo min-w-max">
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
                  w-8 sm:w-10 md:w-14 h-24 sm:h-32 md:h-48 
                  border-r border-dark last:border-r-0
                  rounded-b-md sm:rounded-b-lg flex items-end justify-center pb-2 sm:pb-4
                  transition-colors duration-200 z-0
                  ${getKeyColor(midi, false)}
                  ${!disabled && !isWhiteKeyCorrect && !isWhiteKeyWrong && !isWhiteKeyActive ? 'hover:bg-slate-100' : ''}
                  ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                `}
              >
                <span className="font-bold text-[10px] sm:text-xs md:text-sm opacity-50 select-none pointer-events-none">
                  {noteName}{Math.floor(midi/12)-1}
                </span>
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
                    absolute top-0 -right-2.5 sm:-right-3 md:-right-5
                    w-5 sm:w-6 md:w-10 h-16 sm:h-20 md:h-32
                    border-2 border-dark rounded-b-md sm:rounded-b-lg
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
