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

const NoteCard = ({ note, active, onClick, onDelete, index }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, type: "spring", damping: 20 }}
      className="group relative px-2 overflow-hidden"
    >
      <div className="absolute inset-0 right-0 flex justify-end items-center pointer-events-none pr-8">
         <div className="w-20 h-2/3 bg-[#c0392b] rounded-3xl flex items-center justify-center text-white">
            <Trash2 size={24} />
         </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            onDelete(note.id);
          }
        }}
        className="relative z-10"
      >
        <button
          onClick={onClick}
          onContextMenu={(e) => {
            e.preventDefault();
            // Simple context menu simulation
            if (confirm("Expunge this thought?")) onDelete(note.id);
          }}
          className={cn(
            "w-full text-left py-10 px-8 rounded-[32px] transition-all flex flex-col gap-4 border-l-4 bg-[#0a0a0a]",
            active 
              ? "bg-[#161616] border-[#c9a84c] shadow-[0_20px_40px_rgba(0,0,0,0.4)]" 
              : "hover:bg-[#111111] border-transparent hover:border-white/10"
          )}
        >
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-mono text-[#c9a84c] tracking-[0.2em] uppercase font-bold">
              {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
             </span>
             <div className="flex gap-2 text-[#6b6560]">
               {note.layout === 'kanban' && <Layout size={14} />}
               {note.tags.length > 0 && <Tags size={14} />}
             </div>
          </div>
          
          <h3 className={cn(
            "text-2xl font-serif font-bold transition-all line-clamp-1",
            active ? "text-[#f0ebe1]" : "text-[#6b6560] group-hover:text-[#f0ebe1]"
          )}>
            {note.title || 'Untitled Thought'}
          </h3>
          
          <div className="text-base text-[#6b6560] line-clamp-3 leading-relaxed font-light overflow-hidden pointer-events-none opacity-60 prose-editorial scale-90 origin-top-left">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content || 'Blank page. Begin the inscription...'}</ReactMarkdown>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {note.tags.map((tag: string) => (
              <span key={tag} className="text-[9px] uppercase tracking-widest text-[#c9a84c]/40 font-bold border border-[#c9a84c]/10 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </button>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="absolute top-10 right-8 opacity-0 group-hover:opacity-100 md:flex hidden p-4 bg-[#c0392b]/10 text-[#c0392b] rounded-2xl transition-all hover:bg-[#c0392b] hover:text-white backdrop-blur-md z-20"
        >
          <Trash2 size={18} />
        </motion.button>
      </motion.div>
      <div className="h-px w-2/3 mx-auto bg-white/5 mt-0 group-last:hidden" />
    </motion.div>
  );
};

const BrandWordmark = () => (
  <div className="flex flex-col items-start gap-1 group cursor-default">
    <div className="flex flex-col">
      <motion.span 
        initial={{ opacity: 0, tracking: "0.2em" }}
        animate={{ opacity: 1, tracking: "0.4em" }}
        className="text-[9px] uppercase font-bold text-[#c9a84c] mb-1"
      >
        THE PREMIUM
      </motion.span>
      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-serif font-bold tracking-tighter text-[#f0ebe1] flex items-baseline gap-1"
      >
        Pradip<span className="italic font-normal text-[#c9a84c]/80">Notes</span>
      </motion.h1>
    </div>
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      className="h-[1px] bg-[#c9a84c]/30"
    />
  </div>
);

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

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-sm w-full bg-[#141414] border border-white/10 p-8 rounded-[32px] shadow-2xl"
        >
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-3 text-[#f0ebe1]">{title}</h2>
          <p className="text-[#6b6560] text-base leading-relaxed mb-10 font-light">{message}</p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-3xl bg-white/5 text-[#f0ebe1] font-bold hover:bg-white/10 transition-all text-xs tracking-widest uppercase"
            >
              CANCEL
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-8 py-4 rounded-3xl bg-[#c0392b] text-white font-bold hover:bg-[#c0392b]/80 transition-all text-xs tracking-widest uppercase shadow-xl shadow-red-500/20"
            >
              EXPUNGE
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
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
    <div className="flex gap-6 h-full overflow-x-auto pb-10 no-scrollbar snap-x md:snap-none px-4 md:px-0">
      {(['todo', 'inProgress', 'done'] as const).map(colId => (
        <div 
          key={colId} 
          className="flex-shrink-0 w-[320px] md:w-1/3 flex flex-col h-full bg-[#0d0d0d] rounded-[40px] border border-white/5 snap-center overflow-hidden"
        >
          <div className={cn(
            "h-1.5 w-full",
            colId === 'todo' ? "bg-red-500/50" : colId === 'inProgress' ? "bg-[#c9a84c]" : "bg-emerald-500/50"
          )} />
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#111111]">
            <h3 className="font-serif font-bold text-xl text-[#f0ebe1]">{data.columns[colId].title}</h3>
            <span className="text-[10px] font-mono text-[#c9a84c] bg-[#c9a84c]/10 px-2 py-0.5 rounded-full font-bold">{data.columns[colId].cardIds.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {data.columns[colId].cardIds.map(cardId => {
              const card = data.cards[cardId];
              return (
                <motion.div
                  layoutId={cardId}
                  key={cardId}
                  className="bg-[#161616] p-6 rounded-3xl border border-white/5 group relative shadow-xl"
                >
                  <textarea
                    value={card.content}
                    onChange={(e) => updateCardContent(cardId, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-[#f0ebe1] resize-none h-24 font-light leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                     <div className="flex gap-2">
                        {colId !== 'todo' && (
                          <button onClick={() => moveCard(cardId, colId, colId === 'done' ? 'inProgress' : 'todo')} className="p-2 text-[#6b6560] hover:text-[#c9a84c] bg-white/5 rounded-xl transition-all">
                            <ChevronLeft size={16} />
                          </button>
                        )}
                        {colId !== 'done' && (
                          <button onClick={() => moveCard(cardId, colId, colId === 'todo' ? 'inProgress' : 'done')} className="p-2 text-[#6b6560] hover:text-[#c9a84c] bg-white/5 rounded-xl transition-all">
                            <ChevronRight size={16} />
                          </button>
                        )}
                     </div>
                     <button onClick={() => deleteCard(cardId, colId)} className="opacity-0 group-hover:opacity-100 p-2 text-[#c0392b]/50 hover:text-[#c0392b] transition-all bg-[#c0392b]/5 rounded-xl">
                       <Trash size={16} />
                     </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          <button 
            onClick={() => addCard(colId)}
            className="mx-6 mb-8 mt-2 p-5 rounded-3xl border border-dashed border-white/10 text-[#6b6560] text-sm hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all flex items-center justify-center gap-2 bg-white/[0.02]"
          >
            <Plus size={18} /> INSCRIBE CARD
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
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-16 h-16 bg-[#c9a84c] rounded-full blur-[80px]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-[10px] font-mono tracking-[0.5em] text-[#c9a84c] uppercase font-bold animate-pulse">INITIATING</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] p-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
             transition={{ duration: 15, repeat: Infinity }}
             className="absolute -top-1/4 -right-1/4 w-[100vw] h-[100vw] rounded-full bg-[#c9a84c] blur-[200px]"
           />
        </div>

        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full text-center z-10"
        >
          <div className="mb-20">
            <motion.div 
              animate={{ rotate: [0, 2, -2, 0], scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 10 }}
              className="w-32 h-32 bg-[#111111] rounded-[48px] flex items-center justify-center mx-auto mb-12 shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/5 relative group"
            >
              <Sparkles className="text-[#c9a84c]" size={48} />
              <div className="absolute inset-4 border border-[#c9a84c]/20 rounded-[32px]" />
            </motion.div>
            <div className="flex justify-center">
              <BrandWordmark />
            </div>
            <p className="mt-12 text-[#6b6560] leading-relaxed font-light tracking-widest italic font-serif text-lg">
              "A refined sanctuary for the deliberate mind."
            </p>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-[#f0ebe1] text-[#0a0a0a] px-12 py-6 rounded-[32px] font-bold hover:bg-[#c9a84c] transition-all shadow-[0_20px_40px_rgba(201,168,76,0.2)] flex items-center justify-center gap-4 active:scale-95 group"
          >
            <UserIcon size={22} className="group-hover:translate-x-1 transition-transform" />
            ENTER THE SANCTUARY
          </button>
          
          {loginError && (
            <p className="mt-12 text-[10px] text-[#c0392b] font-bold uppercase tracking-[0.4em] animate-bounce">{loginError}</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#f5f5f4] overflow-hidden selection:bg-[#c19a6b] selection:text-[#0a0a0a]">
      {/* Sidebar - Editorial List */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full md:w-[400px] md:relative bg-[#0a0a0a] z-50 border-r border-white/5 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-12 pb-8">
              <div className="flex items-center justify-between mb-16">
                <BrandWordmark />
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="md:hidden p-3 bg-white/5 rounded-2xl text-[#6b6560]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c9a84c]/40" size={18} />
                <input 
                  type="text"
                  placeholder="DISCOVER THOUGHTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-[#111111] border border-white/5 rounded-2xl text-[11px] font-mono tracking-[0.2em] uppercase focus:border-[#c9a84c]/50 focus:bg-[#161616] outline-none transition-all placeholder:text-white/10"
                />
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                        selectedTag === tag 
                          ? "bg-[#c9a84c] text-[#0a0a0a] border-[#c9a84c]" 
                          : "bg-transparent text-[#6b6560] border-white/5 hover:border-white/10 hover:text-[#f0ebe1]"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar space-y-4">
              <AnimatePresence initial={false}>
                {filteredNotes.map((note, idx) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={idx}
                    active={activeNoteId === note.id}
                    onClick={() => {
                      setActiveNoteId(note.id);
                      if (window.innerWidth < 768) setShowSidebar(false);
                    }}
                    onDelete={(id: string) => setNoteToDelete(id)}
                  />
                ))}
              </AnimatePresence>
              
              {filteredNotes.length === 0 && (
                <div className="py-20 text-center opacity-10 font-serif italic text-2xl">
                  <p>Silent void.</p>
                </div>
              )}
            </div>

            {/* Profile Bar */}
            <div className="p-10 border-t border-white/5 bg-[#0a0a0a]">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#111111] border border-[#c9a84c]/20 overflow-hidden flex items-center justify-center p-0.5">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#1c1c1c] flex items-center justify-center text-[#c9a84c] font-bold text-xs">
                          {user.displayName?.split(' ').map(n => n[0]).join('') || 'A'}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-[11px] font-bold tracking-widest uppercase truncate text-[#f0ebe1]">{user.displayName || 'Architect'}</p>
                       <p className="text-[10px] text-[#6b6560] truncate tracking-wider italic font-serif ">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="p-4 hover:bg-white/5 rounded-2xl text-[#6b6560] hover:text-[#c0392b] transition-all active:scale-90">
                    <LogOut size={20} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full relative">
            {/* Sticky Header / Toolbar */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "z-40 px-6 md:px-16 py-8 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-3xl flex items-center justify-between sticky top-0"
              )}
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="p-4 hover:bg-white/5 rounded-3xl text-[#6b6560] transition-all active:scale-90"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-[#c9a84c] uppercase font-bold">SEQUENCE #{activeNote.id.slice(-6)}</span>
                  <div className="flex items-center gap-2 text-[#6b6560]">
                    <Clock size={12} />
                    <span className="text-[11px] font-serif italic tracking-wide">Revised {new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 hidden lg:block">
                 <h2 className="text-sm font-serif font-bold tracking-widest uppercase text-[#f0ebe1]/40 line-clamp-1 max-w-[200px]">
                   {activeNote.title || 'Untitled'}
                 </h2>
              </div>

              <div className="flex items-center gap-4">
                <button className="p-4 hover:bg-white/5 rounded-2xl text-[#6b6560] transition-all group relative">
                  <Menu size={20} />
                  <div className="absolute top-full right-0 mt-4 w-48 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <button onClick={handleSummarize} className="w-full text-left px-5 py-4 hover:bg-white/5 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                      <Sparkles size={14} /> AI Synthesis
                    </button>
                    <button onClick={() => setNoteToDelete(activeNote.id)} className="w-full text-left px-5 py-4 hover:bg-[#c0392b]/10 text-[#c0392b] text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                      <Trash2 size={14} /> Expunge Note
                    </button>
                  </div>
                </button>
              </div>
            </motion.header>

            {/* Floating Editor Toolbar (Bottom) */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] px-6 w-full max-w-2xl">
               <motion.div 
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="bg-[#111111]/90 backdrop-blur-2xl p-2 rounded-[32px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar"
               >
                 <div className="flex items-center gap-1">
                    <ToolbarButton icon={Bold} label="Bold" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '**' })} />
                    <ToolbarButton icon={Italic} label="Italic" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '_' })} />
                    <ToolbarButton icon={Type} label="H1" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '\n# ' })} />
                    <ToolbarButton icon={Quote} label="Quote" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '\n> ' })} />
                 </div>
                 
                 <div className="h-8 w-px bg-white/10 mx-1" />
                 
                 <div className="flex items-center gap-1">
                    <ToolbarButton icon={List} label="Bullets" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '\n- ' })} />
                    <ToolbarButton icon={CheckSquare} label="Tasks" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '\n- [ ] ' })} />
                    <ToolbarButton icon={Code} label="Code" onClick={() => updateNote(activeNote.id, { content: activeNote.content + '\n```\n\n```' })} />
                 </div>

                 <div className="h-8 w-px bg-white/10 mx-1" />

                 <div className="flex items-center gap-1">
                    <ToolbarButton 
                      icon={Layout} 
                      active={activeNote.layout === 'kanban'} 
                      label="Kanban Layout" 
                      onClick={() => updateNote(activeNote.id, { layout: activeNote.layout === 'kanban' ? 'standard' : 'kanban' })} 
                    />
                    {isAiEnabled && (
                      <button 
                        onClick={handleAiRefine}
                        disabled={isAiLoading || !activeNote.content}
                        className={cn(
                          "p-3 rounded-2xl transition-all flex items-center gap-2",
                          isAiLoading ? "bg-[#c9a84c] text-[#0a0a0a]" : "bg-[#c9a84c]/10 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#0a0a0a]"
                        )}
                      >
                        <Sparkles size={20} className={cn(isAiLoading && "animate-spin")} />
                      </button>
                    )}
                 </div>
               </motion.div>
            </div>

            {/* Editor Body */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-60">
              <div className="max-w-6xl mx-auto px-6 md:px-24 py-24">
                <textarea 
                  rows={1}
                  value={activeNote.title}
                  onChange={(e) => {
                    updateNote(activeNote.id, { title: e.target.value });
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onBlur={(e) => e.target.style.height = 'auto'}
                  placeholder="The Inscription Title..."
                  className="w-full text-5xl md:text-8xl font-serif font-bold bg-transparent border-none outline-none mb-16 placeholder:opacity-5 selection:bg-[#c9a84c] selection:text-[#0a0a0a] resize-none overflow-hidden"
                />

                {activeNote.layout === 'kanban' ? (
                  <KanbanBoard note={activeNote} onUpdate={(u) => updateNote(activeNote.id, u)} />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
                    <div className="flex flex-col">
                      <textarea 
                        value={activeNote.content}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                        onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                        placeholder="Begin your next legacy here..."
                        className="w-full flex-1 bg-transparent border-none outline-none text-2xl leading-[1.8] text-[#f0ebe1]/90 font-light resize-none min-h-[60vh] placeholder:italic placeholder:opacity-5 serif"
                      />
                    </div>
                    <div className="hidden lg:block border-l border-white/5 pl-24 prose-editorial">
                      <div className="sticky top-12">
                        <span className="text-[10px] font-mono tracking-[0.4em] text-[#c9a84c] uppercase block mb-12 font-bold">SYNTHESIS</span>
                        {activeNote.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.content}</ReactMarkdown>
                        ) : (
                          <div className="space-y-4 opacity-5">
                             <div className="h-4 w-full bg-[#f0ebe1] rounded-full" />
                             <div className="h-4 w-5/6 bg-[#f0ebe1] rounded-full" />
                             <div className="h-4 w-4/6 bg-[#f0ebe1] rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div 
                   animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }}
                   transition={{ duration: 12, repeat: Infinity }}
                   className="absolute -top-1/4 -right-1/4 w-[90vw] h-[90vw] rounded-full bg-[#c9a84c] blur-[180px]"
                 />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl text-center z-10"
              >
                 <BrandWordmark />
                 <h2 className="text-5xl font-serif font-bold mt-16 mb-8 text-[#f0ebe1]">Begin Your Next Sequence</h2>
                 <p className="text-[#6b6560] font-light leading-[1.8] mb-16 italic font-serif text-xl px-10">
                   Capture fleeting brilliance, coordinate complex maneuvers, and refine them into lasting legacy. Your sanctuary for deliberate thought awaits.
                 </p>
                 <button 
                   onClick={handleCreateNote}
                   className="px-16 py-6 bg-[#f0ebe1] text-[#0a0a0a] rounded-[32px] font-bold hover:bg-[#c9a84c] transition-all flex items-center gap-4 mx-auto active:scale-95 shadow-[0_30px_60px_rgba(0,0,0,0.4)] group"
                 >
                   <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
                   NEW INSCRIPTION
                 </button>
              </motion.div>
          </div>
        )}
      </div>

      {/* FAB for Mobile */}
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCreateNote}
        className="fixed bottom-12 right-12 w-20 h-20 bg-[#c9a84c] rounded-[32px] shadow-[0_30px_60px_rgba(201,168,76,0.5)] z-[60] flex items-center justify-center text-[#0a0a0a] active:scale-95 group transition-all"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 border-4 border-[#c9a84c]/30 rounded-[32px] pointer-events-none"
        />
      </motion.button>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title="Archive Sequence?"
        message="This thought will be permanently expunged from your record. Are you certain?"
      />
    </div>
  );
}
