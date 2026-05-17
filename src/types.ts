export interface KanbanCard {
  id: string;
  content: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cardIds: string[];
}

export interface KanbanData {
  columns: {
    todo: KanbanColumn;
    inProgress: KanbanColumn;
    done: KanbanColumn;
  };
  cards: Record<string, KanbanCard>;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  layout?: 'standard' | 'kanban';
  kanbanData?: KanbanData;
  color?: string;
  updatedAt: number;
  createdAt: number;
}

export type NoteSortOption = 'updated' | 'created' | 'title';
