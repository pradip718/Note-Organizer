export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  updatedAt: number;
  createdAt: number;
}

export type NoteSortOption = 'updated' | 'created' | 'title';
