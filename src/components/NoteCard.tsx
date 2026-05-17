import { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Note } from '../types';

const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[#*`~_>]/g, "") // basic markdown symbols
    .replace(/\[[x ]\]/g, "") // checklists
    .replace(/[-*]\s/g, "") // bullets
    .replace(/^\d+\.\s/gm, "") // numbered lists
    .replace(/\n+/g, " ") // newlines to spaces
    .trim();
};

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ note, onClick, onDelete }: NoteCardProps) => {
  const plainText = useMemo(() => stripMarkdown(note.content), [note.content]);
  const dateFormatted = useMemo(() => {
    const d = new Date(note.createdAt);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, [note.createdAt]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ x: -500, transition: { duration: 0.2 } }}
      layout
      className="relative w-full group overflow-hidden select-none"
    >
      {/* Delete Zone */}
      <div 
        className="absolute inset-y-0 right-0 w-[80px] bg-[#C0392B] flex items-center justify-center rounded-r-[16px] z-0"
        onClick={() => onDelete(note.id)}
      >
        <span className="text-white font-bold text-[11px] tracking-[1px] font-sans">DELETE</span>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        dragTransition={{ power: 0.2, timeConstant: 200 }}
        className="relative z-10 w-full cursor-pointer touch-pan-y"
      >
        <div 
          onClick={onClick}
          className="w-full bg-[#141414] rounded-[16px] border-l-[3px] border-[#C9A84C] p-[20px] transition-colors"
        >
          {/* Row 1: Date */}
          <div className="text-[#C9A84C] font-sans font-medium text-[11px] tracking-[1.5px] uppercase mb-[10px]">
            {dateFormatted}
          </div>

          {/* Row 2: Title */}
          <h3 className="font-serif font-bold text-[20px] text-[#F0EBE1] leading-[1.3] mb-[10px] line-clamp-2">
            {note.title || "Untitled"}
          </h3>

          {/* Row 3: Preview */}
          <p className={cn(
            "font-sans font-normal text-[14px] leading-[1.6] line-clamp-2",
            plainText ? "text-[#6B6560]" : "text-[#3A3A3A] italic"
          )}>
            {plainText || "Empty note"}
          </p>

          {/* Row 4: Type Tag */}
          {(note.layout === 'kanban' || note.layout === 'checklist') && (
             <div className="mt-[12px] flex">
               <div className="bg-[#1C1C1C] rounded-[20px] px-[10px] py-[4px] font-sans font-medium text-[11px] text-[#C9A84C] capitalize">
                 {note.layout}
               </div>
             </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
