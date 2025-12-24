
export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface StorageZone {
  id: string;
  name: string;
  dimensions: Dimensions;
  position: Position;
  color: string;
  shelves: number; 
  shelfHeights: number[]; // Altura de cada compartimento en cm
}

export interface StorageItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  dimensions: Dimensions;
  location: string; // zoneId
  photoUrl?: string;
  position: Position;
  color: string;
  reminderDate?: string;
  reminderNote?: string;
}

export interface StorageRoom {
  dimensions: Dimensions;
  name: string;
}

export type AppView = 'inventory' | 'planner' | 'ai-insights' | 'categories' | 'settings';

export interface OptimizationSuggestion {
  itemId: string;
  suggestedPosition: Position;
  reasoning: string;
}
