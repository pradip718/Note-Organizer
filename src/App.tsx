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

import { NoteCard } from './components/NoteCard';
import { AppHeader } from './components/AppHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { ToolbarButton } from './components/ToolbarButton';
import { LoginScreen } from './screens/LoginScreen';

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
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
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

