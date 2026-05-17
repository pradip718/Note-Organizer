import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Trash, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Note, KanbanCard } from '../types';

interface KanbanBoardProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
}

export const KanbanBoard = ({ note, onUpdate }: KanbanBoardProps) => {
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
      {(['todo', 'inProgress', 'done'] as const).map((colId) => (
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
