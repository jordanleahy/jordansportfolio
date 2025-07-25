import { v4 as uuidv4 } from 'uuid';

export interface ArrayItem {
  id: string;
  [key: string]: any;
}

export const arrayHelpers = {
  /**
   * Add a new item to an array with generated ID
   */
  add: <T extends ArrayItem>(array: T[], newItem: Omit<T, 'id'>): T[] => {
    const itemWithId = { id: uuidv4(), ...newItem } as T;
    return [...array, itemWithId];
  },

  /**
   * Remove an item from array by ID
   */
  remove: <T extends ArrayItem>(array: T[], id: string): T[] =>
    array.filter(item => item.id !== id),

  /**
   * Update an item in array by ID
   */
  update: <T extends ArrayItem>(array: T[], id: string, updates: Partial<Omit<T, 'id'>>): T[] =>
    array.map(item => 
      item.id === id ? { ...item, ...updates } as T : item
    ),

  /**
   * Move an item to a different position
   */
  move: <T extends ArrayItem>(array: T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...array];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  },

  /**
   * Initialize array with default items and IDs
   */
  initialize: <T extends Omit<ArrayItem, 'id'>>(items: T[]): (T & { id: string })[] =>
    items.map(item => ({ id: uuidv4(), ...item })),
};