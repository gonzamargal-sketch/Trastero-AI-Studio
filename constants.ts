
import { StorageItem, StorageRoom } from './types';

export const DEFAULT_ROOM: StorageRoom = {
  name: "Principal Trastero",
  dimensions: { width: 300, height: 250, depth: 300 } // Dimensions in cm
};

export const INITIAL_ITEMS: StorageItem[] = [
  {
    id: '1',
    name: 'Caja de Navidad',
    category: 'Decoración',
    quantity: 1,
    dimensions: { width: 40, height: 40, depth: 60 },
    location: 'Zona A',
    color: '#ef4444',
    position: { x: -100, y: 20, z: -100 }
  },
  {
    id: '2',
    name: 'Bicicleta Montaña',
    category: 'Deportes',
    quantity: 1,
    dimensions: { width: 20, height: 100, depth: 180 },
    location: 'Zona B',
    color: '#3b82f6',
    position: { x: 50, y: 50, z: 0 }
  },
  {
    id: '3',
    name: 'Maletas Viaje',
    category: 'Viajes',
    quantity: 2,
    dimensions: { width: 50, height: 75, depth: 30 },
    location: 'Zona A',
    color: '#10b981',
    position: { x: -80, y: 37.5, z: 100 }
  }
];

export const CATEGORIES = [
  'Muebles',
  'Decoración',
  'Deportes',
  'Herramientas',
  'Viajes',
  'Ropa',
  'Otros'
];

export const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#94a3b8'
];
