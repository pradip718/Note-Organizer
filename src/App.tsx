import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Plus, Search, Tags, Sparkles, Trash2, Clock, ChevronLeft, LogOut, 
  User as UserIcon, Bold, Italic, Underline, List, ListOrdered, 
  CheckSquare, Code, Quote, Link as LinkIcon, Undo, Redo, 
  Layout, Type, X, AlertCircle, GripVertical, CheckCircle2,
  Trash, ChevronRight, Menu, Square
} from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateNoteMetadata, summarizeNote, isAiEnabled } from './services/aiService';
import { useAuth } from './contexts/AuthContext';
import { loginWithGoogle, logout } from './lib/firebase';
import { KanbanCard, KanbanColumn, Note } from './types';

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

const NoteCard = ({ note, onClick, onDelete }: any) => {
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


const AppHeader = ({ userName }: { userName: string | null }) => {
  const initial = userName ? userName.charAt(0).toUpperCase() : "P";
  
  return (
    <header className="pt-[48px] px-[20px] flex flex-col relative w-full mb-[32px]">
      {/* Line 1 */}
      <span className="font-sans font-medium text-[11px] text-[#C9A84C] tracking-[2px] uppercase mb-[6px]">
        THE PREMIUM
      </span>

      {/* Line 2 */}
      <h1 className="font-serif font-bold text-[32px] text-[#F0EBE1] flex items-baseline mb-[8px]">
        Pradip <span className="italic font-normal text-[#C9A84C] ml-[1px]">Notes</span>
      </h1>

      {/* Line 3: Thin Line */}
      <div className="w-full h-[1px] bg-[#C9A84C] opacity-40 mb-[32px]" />

      {/* Avatar */}
      <div 
        onClick={logout}
        className="absolute top-[48px] right-[20px] w-[40px] h-[40px] bg-[#1C1C1C] border border-[#C9A84C]/40 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2A2A2A] transition-colors"
      >
        <span className="font-sans font-semibold text-[16px] text-[#C9A84C]">{initial}</span>
      </div>
    </header>
  );
};


const ToolbarButton = ({ icon: Icon, onClick, active, disabled, label }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={cn(
      "p-2.5 rounded-xl transition-all flex items-center justify-center min-w-[44px] h-[44px]",
      active 
        ? "bg-[#c9a84c] text-[#0a0a0a] shadow-[0_0_15px_rgba(201,168,76,0.3)]" 
        : "hover:bg-white/10 text-[#6b6560] hover:text-[#f0ebe1]",
      "disabled:opacity-10 disabled:cursor-not-allowed active:scale-90"
    )}
  >
    <Icon size={20} />
  </button>
);


// --- Kanban Section ---

const KanbanBoard = ({ note, onUpdate }: { note: Note, onUpdate: (updates: Partial<Note>) => void }) => {
  const data = note.kanbanData || {
    columns: {
      todo: { id: 'todo', title: 'To Do', cardIds: [] },
      inProgress: { id: 'inProgress', title: 'In Progress', cardIds: [] },
      done: { id: 'done', title: 'Done', cardIds: [] }
    },
    cards: {}
  };

  const addCard = (columnId: 'todo' | 'inProgress' | 'done') => {
    const id = `card-${Date.now()}`;
    const newCard: KanbanCard = { id, content: 'New Card' };
    const newData = {
      ...data,
      cards: { ...data.cards, [id]: newCard },
      columns: {
        ...data.columns,
        [columnId]: {
          ...data.columns[columnId],
          cardIds: [...data.columns[columnId].cardIds, id]
        }
      }
    };
    onUpdate({ kanbanData: newData });
  };

  const deleteCard = (cardId: string, columnId: string) => {
    const { [cardId]: _, ...remainingCards } = data.cards;
    const newData = {
      ...data,
      cards: remainingCards,
      columns: {
        ...data.columns,
        [columnId]: {
          ...data.columns[columnId as keyof typeof data.columns],
          cardIds: data.columns[columnId as keyof typeof data.columns].cardIds.filter(id => id !== cardId)
        }
      }
    };
    onUpdate({ kanbanData: newData });
  };

  const moveCard = (cardId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId === toColumnId) return;
    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [fromColumnId]: {
          ...data.columns[fromColumnId as keyof typeof data.columns],
          cardIds: data.columns[fromColumnId as keyof typeof data.columns].cardIds.filter(id => id !== cardId)
        },
        [toColumnId]: {
          ...data.columns[toColumnId as keyof typeof data.columns],
          cardIds: [...data.columns[toColumnId as keyof typeof data.columns].cardIds, cardId]
        }
      }
    };
    onUpdate({ kanbanData: newData });
  };

  const updateCardContent = (cardId: string, content: string) => {
    const newData = {
      ...data,
      cards: {
        ...data.cards,
        [cardId]: { ...data.cards[cardId], content }
      }
    };
    onUpdate({ kanbanData: newData });
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-8 no-scrollbar snap-x md:snap-none">
      {(['todo', 'inProgress', 'done'] as const).map(colId => (
        <div 
          key={colId} 
          className="flex-shrink-0 w-[280px] md:w-1/3 flex flex-col h-full bg-[#0d0d0d] rounded-[32px] border border-white/5 snap-center overflow-hidden"
        >
          <div className={cn(
            "h-1 w-full",
            colId === 'todo' ? "bg-red-500/50" : colId === 'inProgress' ? "bg-[#c9a84c]" : "bg-emerald-500/50"
          )} />
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#111111]">
            <h3 className="font-serif font-bold text-[17px] text-[#f0ebe1]">{data.columns[colId].title}</h3>
            <span className="text-[11px] font-mono text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full font-bold">{data.columns[colId].cardIds.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {data.columns[colId].cardIds.map(cardId => {
              const card = data.cards[cardId];
              return (
                <motion.div
                  layoutId={cardId}
                  key={cardId}
                  className="bg-[#161616] p-5 rounded-2xl border border-white/5 group relative shadow-xl"
                >
                  <textarea
                    value={card.content}
                    onChange={(e) => updateCardContent(cardId, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[14px] text-[#f0ebe1] resize-none h-20 font-light leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                     <div className="flex gap-2">
                        {colId !== 'todo' && (
                          <button onClick={() => moveCard(cardId, colId, colId === 'done' ? 'inProgress' : 'todo')} className="p-2 text-[#6b6560] hover:text-[#c9a84c] bg-white/5 rounded-xl transition-all">
                            <ChevronLeft size={14} />
                          </button>
                        )}
                        {colId !== 'done' && (
                          <button onClick={() => moveCard(cardId, colId, colId === 'todo' ? 'inProgress' : 'done')} className="p-2 text-[#6b6560] hover:text-[#c9a84c] bg-white/5 rounded-xl transition-all">
                            <ChevronRight size={14} />
                          </button>
                        )}
                     </div>
                     <button onClick={() => deleteCard(cardId, colId)} className="opacity-0 group-hover:opacity-100 p-2 text-[#c0392b]/50 hover:text-[#c0392b] transition-all bg-[#c0392b]/5 rounded-xl">
                       <Trash size={14} />
                     </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <button 
            onClick={() => addCard(colId)}
            className="mx-4 mb-6 mt-2 p-4 rounded-2xl border border-dashed border-white/10 text-[#6b6560] text-[11px] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all flex items-center justify-center gap-2 bg-white/[0.02] font-bold uppercase tracking-widest"
          >
            <Plus size={16} /> INSCRIBE CARD
          </button>
        </div>
      ))}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { notes, addNote, updateNote, deleteNote, isLoading: notesLoading } = useNotes();
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Undo support
  const [deletedNote, setDeletedNote] = useState<any | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<any>(null);

  const handleDeleteNote = (id: string) => {
    const noteToKill = notes.find(n => n.id === id);
    if (!noteToKill) return;
    
    setDeletedNote(noteToKill);
    setShowUndo(true);
    
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      setDeletedNote(null);
    }, 4000);

    deleteNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const handleUndo = async () => {
    if (deletedNote) {
      const { id, ...rest } = deletedNote;
      await addNote(rest);
      setShowUndo(false);
      setDeletedNote(null);
    }
  };

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId), 
    [notes, activeNoteId]
  );

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || n.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  const handleCreateNote = async () => {
    const result = await addNote({
      title: 'Untethered Thought',
      content: '',
      tags: [],
      layout: 'standard'
    });
    if (result) setActiveNoteId(result.id);
  };

  const handleAiRefine = async () => {
    if (!activeNote) return;
    setIsAiLoading(true);
    try {
      const { title, tags } = await generateNoteMetadata(activeNote.content);
      await updateNote(activeNote.id, { title, tags });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeNote) return;
    setIsAiLoading(true);
    try {
      const summary = await summarizeNote(activeNote.content);
      if (summary) {
        await updateNote(activeNote.id, { 
          content: `${activeNote.content}\n\n---\n**AI Synthesis:**\n${summary}`
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') setLoginError("Popup blocked.");
      else if (err.code === 'auth/unauthorized-domain') setLoginError("Unauthorized domain.");
      else setLoginError("Sign-in failed.");
    }
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete);
      if (activeNoteId === noteToDelete) setActiveNoteId(null);
      setNoteToDelete(null);
    }
  };

  // --- Render Helpers ---

  if (authLoading || (user && notesLoading)) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0A0A0A] px-[20px]">
        <div className="flex flex-col items-center gap-[32px]">
           <div className="w-[64px] h-[64px] rounded-full border-[1px] border-[#C9A84C] border-t-transparent animate-spin opacity-40" />
           <span className="font-sans font-medium text-[11px] text-[#C9A84C] tracking-[4px] uppercase animate-pulse">INITIATING</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0A] px-[20px] pt-[64px] pb-[48px] items-center text-center">
        {/* Badge */}
        <span className="font-sans font-medium text-[11px] text-[#C9A84C] tracking-[2px] uppercase mb-[16px]">
          THE PREMIUM EXPERIENCE
        </span>
        
        {/* Title */}
        <h1 className="font-serif font-bold text-[48px] text-[#F0EBE1] leading-[1.1] mb-[32px]">
          Pradip <br />
          <span className="italic font-normal text-[#C9A84C]">Notes</span>
        </h1>

        {/* Separator */}
        <div className="w-[48px] h-[1px] bg-[#C9A84C] opacity-40 mb-[32px]" />

        {/* Subtitle */}
        <p className="font-serif italic text-[20px] text-[#6B6560] leading-[1.6] max-w-[280px] mb-[64px]">
          "A refined sanctuary for the deliberate mind."
        </p>

        {/* Login Button */}
        <button 
          onClick={handleLogin}
          className="w-full max-w-[320px] h-[56px] bg-[#F0EBE1] rounded-[12px] flex items-center justify-center gap-[12px] text-[#0A0A0A] font-sans font-bold text-[16px] hover:bg-[#C9A84C] transition-colors active:scale-[0.98] mt-auto"
        >
          <UserIcon size={20} />
          ENTER THE SANCTUARY
        </button>

        {loginError && (
          <p className="mt-[24px] font-sans font-bold text-[11px] text-[#C0392B] uppercase tracking-[2px]">
            {loginError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-[#C9A84C] selection:text-[#0A0A0A] pb-[64px]">
      {!activeNote ? (
        <div className="flex flex-col">
          <AppHeader userName={user.displayName} />

          {/* Search Bar Section */}
          <div className="px-[20px] mb-[24px]">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-[12px] h-[48px] flex items-center px-[16px] gap-[12px]">
              {/* Magnifying Glass SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text"
                placeholder="DISCOVER THOUGHTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full font-sans font-normal text-[15px] text-[#F0EBE1] placeholder:text-[#3A3A3A] placeholder:font-medium placeholder:text-[12px] placeholder:tracking-[1.5px]"
              />
            </div>
          </div>

          {/* Note List Section */}
          <div className="px-[20px] flex flex-col gap-[16px]">
            <AnimatePresence initial={false}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => setActiveNoteId(note.id)}
                  onDelete={handleDeleteNote}
                />
              ))}
            </AnimatePresence>

            {filteredNotes.length === 0 && (
              <div className="py-[64px] text-center">
                <p className="font-serif italic text-[18px] text-[#3A3A3A]">Silent void.</p>
              </div>
            )}
          </div>

          {/* Create Button (FAB) */}
          <button
            onClick={handleCreateNote}
            className="fixed bottom-[32px] right-[20px] w-[64px] h-[64px] bg-[#C9A84C] rounded-full shadow-[0_16px_32px_rgba(0,0,0,0.6)] flex items-center justify-center text-[#0A0A0A] active:scale-95 transition-transform z-50 border-none"
            title="Create Note"
          >
            <Plus size={32} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Editor Header */}
          <header className="h-[64px] px-[20px] flex items-center justify-between border-b border-[#C9A84C]/20 shrink-0">
            <button 
              onClick={() => setActiveNoteId(null)}
              className="w-[48px] h-[48px] flex items-center justify-start text-[#C9A84C]"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-serif font-bold text-[18px] text-[#F0EBE1] truncate max-w-[200px]">
              {activeNote.title || "Untitled"}
            </h2>
            <button 
              onClick={() => handleDeleteNote(activeNote.id)}
              className="w-[48px] h-[48px] flex items-center justify-end text-[#C0392B]"
            >
              <Trash2 size={20} />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-[20px] no-scrollbar">
            <input 
              value={activeNote.title}
              onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
              placeholder="Title"
              className="w-full bg-transparent border-none outline-none font-serif font-bold text-[32px] text-[#F0EBE1] mb-[20px]"
            />
            
            {activeNote.layout === 'kanban' ? (
              <KanbanBoard note={activeNote} onUpdate={(u) => updateNote(activeNote.id, u)} />
            ) : (
              <textarea 
                value={activeNote.content}
                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                placeholder="Begin your thoughts..."
                className="w-full h-[60vh] bg-transparent border-none outline-none font-sans font-normal text-[17px] leading-[1.8] text-[#F0EBE1] resize-none"
              />
            )}
          </main>

          {/* Editor Toolbar */}
          <div className="h-[64px] bg-[#1C1C1C] border-t border-white/5 flex items-center px-[20px] gap-[16px] overflow-x-auto no-scrollbar shrink-0">
            <ToolbarButton icon={Bold} onClick={() => updateNote(activeNote.id, { content: activeNote.content + "**Text**" })} />
            <ToolbarButton icon={List} onClick={() => updateNote(activeNote.id, { content: activeNote.content + "\n- " })} />
            {isAiEnabled && (
              <button 
                onClick={handleAiRefine}
                disabled={isAiLoading}
                className="ml-auto bg-[#C9A84C]/10 text-[#C9A84C] px-[16px] py-[8px] rounded-[8px] text-[12px] font-bold tracking-[1px] font-sans"
              >
                {isAiLoading ? "REFINING..." : "AI REFINE"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[32px] left-[20px] right-[20px] z-[100] bg-[#1C1C1C] rounded-[12px] p-[14px_20px] flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/5"
          >
            <span className="text-[#F0EBE1] font-sans text-[14px]">Note deleted</span>
            <button 
              onClick={handleUndo}
              className="text-[#C9A84C] font-sans font-bold text-[14px] uppercase tracking-[1px]"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}

