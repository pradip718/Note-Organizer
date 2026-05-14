import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Tags, Sparkles, Trash2, Clock, ChevronLeft, LogOut, User as UserIcon } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import { generateNoteMetadata, summarizeNote, isAiEnabled } from './services/aiService';
import { useAuth } from './contexts/AuthContext';
import { loginWithGoogle, logout } from './lib/firebase';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { notes, addNote, updateNote, deleteNote, isLoading: notesLoading } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

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
    return Array.from(tags);
  }, [notes]);

  const handleCreateNote = async () => {
    const result = await addNote({
      title: 'New Note',
      content: '',
      tags: [],
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
          content: `${activeNote.content}\n\n---\n**AI Summary:**\n${summary}`
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  if (authLoading || (user && notesLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-8 w-8 border-2 border-gray-300 border-t-gray-600 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f5] p-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">ZenNotes</h1>
          <p className="text-gray-500 mb-10 leading-relaxed text-sm">
            A minimalist, AI-powered space for your thoughts. Synchronized across all your devices securely.
          </p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-gray-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f5f5f5] text-gray-900 font-sans selection:bg-gray-200">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col z-20 absolute md:relative h-full"
          >
            {/* Sidebar Header */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                     <Sparkles size={16} className="text-white" />
                   </div>
                   <h1 className="text-xl font-medium tracking-tight">ZenNotes</h1>
                </div>
                <button 
                  onClick={handleCreateNote}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
                  title="New Note"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tags Scroll */}
            {allTags.length > 0 && (
              <div className="px-6 pb-4 overflow-x-auto flex gap-2 no-scrollbar">
                <button 
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0",
                    !selectedTag ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0",
                      selectedTag === tag ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Note List */}
            <div className="flex-1 overflow-y-auto px-3 pb-6">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-6 text-center">
                  <p className="text-sm">No notes found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        setActiveNoteId(note.id);
                        if (window.innerWidth < 768) setShowSidebar(false);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all group relative",
                        activeNoteId === note.id 
                          ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <h3 className="text-sm font-medium truncate mb-1 pr-6">{note.title || 'Untitled'}</h3>
                      <p className={cn(
                        "text-xs line-clamp-2 leading-relaxed opacity-70",
                      )}>
                        {note.content || 'Empty note'}
                      </p>
                      <div className="flex items-center gap-1 mt-2 opacity-50 text-[10px] uppercase tracking-wider font-semibold">
                        <Clock size={10} />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                          if (activeNoteId === note.id) setActiveNoteId(null);
                        }}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-100 mt-auto">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-2 text-gray-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate">{user.displayName || 'User'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full bg-white md:bg-[#f5f5f5] relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full md:p-8 h-full">
            <div className="bg-white md:rounded-3xl shadow-sm md:border border-gray-100 flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                  >
                    <ChevronLeft className={cn("transition-transform", !showSidebar && "rotate-180")} size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                      Last edited {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAiEnabled && (
                    <>
                      <button 
                        onClick={handleSummarize}
                        disabled={isAiLoading || !activeNote.content}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-600 rounded-xl transition-all disabled:opacity-50 text-xs md:text-sm font-medium"
                      >
                        <Sparkles size={16} className={cn(isAiLoading && "animate-pulse")} />
                        <span className="hidden sm:inline">Summarize</span>
                      </button>
                      <button 
                        onClick={handleAiRefine}
                        disabled={isAiLoading || !activeNote.content}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        <Sparkles size={16} className={cn(isAiLoading && "animate-pulse")} />
                        <span className="hidden sm:inline">AI Refine</span>
                        <span className="sm:hidden">Refine</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tag Editor */}
              <div className="px-8 pt-6 flex flex-wrap gap-2 items-center">
                <Tags size={14} className="text-gray-400 mr-1" />
                {activeNote.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
                {activeNote.tags.length === 0 && (
                  <span className="text-xs text-gray-300 italic">No tags</span>
                )}
              </div>

              {/* Editor Content */}
              <div className="flex-1 flex flex-col px-8 py-4 overflow-y-auto">
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Note Title"
                  className="text-2xl md:text-4xl font-bold tracking-tight mb-8 outline-none border-none placeholder:text-gray-200"
                />
                
                <div className="flex-1 flex flex-col lg:flex-row gap-8">
                  {/* Raw Input */}
                  <textarea 
                    value={activeNote.content}
                    onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                    placeholder="Start writing..."
                    className="flex-1 resize-none outline-none border-none text-lg leading-relaxed text-gray-700 placeholder:text-gray-200 pb-20 no-scrollbar"
                  />
                  
                  {/* Markdown Preview (Desktop Only) */}
                  {activeNote.content && (
                    <div className="hidden lg:block w-1/3 border-l border-gray-50 pl-8 overflow-y-auto no-scrollbar prose prose-sm prose-gray prose-p:leading-relaxed">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-300 mb-4">Preview</h4>
                      <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="max-w-md"
             >
                <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                  <Plus size={40} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-3">Clear your mind.</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Capture thoughts, organize ideas, and let our AI help you refine them. Start by creating a new note.
                </p>
                <button 
                  onClick={handleCreateNote}
                  className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                >
                  Create First Note
                </button>
             </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
