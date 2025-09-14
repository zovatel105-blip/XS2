/**
 * Definiciones centralizadas de los 8 tipos de layout soportados
 * Este archivo centraliza toda la configuración de layouts para consistencia
 */

export const LAYOUT_TYPES = {
  CAROUSEL: 'off',
  SPLIT_VERTICAL: 'vertical',
  SPLIT_HORIZONTAL: 'horizontal',
  TRIPTYCH_VERTICAL: 'triptych-vertical',
  TRIPTYCH_HORIZONTAL: 'triptych-horizontal',
  GRID_2X2: 'grid-2x2',
  GRID_3X2: 'grid-3x2',
  GRID_2X3: 'horizontal-3x2'
};

export const LAYOUT_DEFINITIONS = [
  {
    id: LAYOUT_TYPES.CAROUSEL,
    name: 'Carrusel',
    displayName: 'Pantalla Completa',
    description: 'Varias imágenes o videos en pantalla completa desplazables en carrusel vertical',
    minImages: 2,
    maxImages: 10,
    gridClasses: '', // No grid - usa carrusel
    icon: '🎠',
    category: 'carousel'
  },
  {
    id: LAYOUT_TYPES.SPLIT_VERTICAL,
    name: 'Split Vertical',
    displayName: 'Lado a lado',
    description: 'Pantalla dividida en 2 partes lado a lado',
    minImages: 2,
    maxImages: 2,
    gridClasses: 'grid grid-cols-2 gap-0.5',
    icon: '⬌',
    category: 'split'
  },
  {
    id: LAYOUT_TYPES.SPLIT_HORIZONTAL,
    name: 'Split Horizontal',
    displayName: 'Arriba y abajo',
    description: 'Pantalla dividida en 2 partes arriba y abajo',
    minImages: 2,
    maxImages: 2,
    gridClasses: 'grid grid-cols-1 grid-rows-2 gap-0.5',
    icon: '⬍',
    category: 'split'
  },
  {
    id: LAYOUT_TYPES.TRIPTYCH_VERTICAL,
    name: 'Triptych Vertical',
    displayName: 'Triptych lado a lado',
    description: 'Pantalla dividida en 3 partes de lado a lado',
    minImages: 3,
    maxImages: 3,
    gridClasses: 'grid grid-cols-3 gap-0.5',
    icon: '⬌⬌',
    category: 'triptych'
  },
  {
    id: LAYOUT_TYPES.TRIPTYCH_HORIZONTAL,
    name: 'Triptych Horizontal',
    displayName: 'Triptych arriba y abajo',
    description: 'Pantalla dividida en 3 partes arriba y abajo',
    minImages: 3,
    maxImages: 3,
    gridClasses: 'grid grid-cols-1 grid-rows-3 gap-0.5',
    icon: '⬍⬍',
    category: 'triptych'
  },
  {
    id: LAYOUT_TYPES.GRID_2X2,
    name: 'Grid 2x2',
    displayName: 'Grid 2x2',
    description: 'Pantalla dividida en 4 partes iguales (cuadrícula de 2x2)',
    minImages: 4,
    maxImages: 4,
    gridClasses: 'grid grid-cols-2 grid-rows-2 gap-0.5',
    icon: '⬜',
    category: 'grid'
  },
  {
    id: LAYOUT_TYPES.GRID_3X2,
    name: 'Grid 3x2',
    displayName: 'Grid 3x2',
    description: 'Pantalla dividida en 6 partes (3 columnas × 2 filas)',
    minImages: 6,
    maxImages: 6,
    gridClasses: 'grid grid-cols-3 grid-rows-2 gap-0.5',
    icon: '⬜⬜',
    category: 'grid'
  },
  {
    id: LAYOUT_TYPES.GRID_2X3,
    name: 'Grid 2x3',
    displayName: 'Grid 2x3',
    description: 'Pantalla dividida en 6 partes (2 columnas × 3 filas)',
    minImages: 6,
    maxImages: 6,
    gridClasses: 'grid grid-cols-2 grid-rows-3 gap-0.5',
    icon: '⬜⬜⬜',
    category: 'grid'
  }
];

/**
 * Obtiene la definición de layout por ID
 * @param {string} layoutId - ID del layout
 * @returns {Object|null} - Definición del layout o null si no existe
 */
export const getLayoutDefinition = (layoutId) => {
  return LAYOUT_DEFINITIONS.find(layout => layout.id === layoutId) || null;
};

/**
 * Obtiene las clases CSS Grid para un layout específico
 * @param {string} layoutId - ID del layout
 * @returns {string} - Clases CSS Grid
 */
export const getLayoutGridClasses = (layoutId) => {
  const layout = getLayoutDefinition(layoutId);
  return layout ? layout.gridClasses : 'grid grid-cols-2 gap-0.5'; // fallback
};

/**
 * Verifica si un layout es válido
 * @param {string} layoutId - ID del layout
 * @returns {boolean} - Si el layout es válido
 */
export const isValidLayout = (layoutId) => {
  return LAYOUT_DEFINITIONS.some(layout => layout.id === layoutId);
};

/**
 * Obtiene layouts por categoría
 * @param {string} category - Categoría del layout
 * @returns {Array} - Array de layouts de la categoría
 */
export const getLayoutsByCategory = (category) => {
  return LAYOUT_DEFINITIONS.filter(layout => layout.category === category);
};

/**
 * Obtiene el número mínimo y máximo de imágenes para un layout
 * @param {string} layoutId - ID del layout
 * @returns {Object} - Objeto con minImages y maxImages
 */
export const getLayoutImageLimits = (layoutId) => {
  const layout = getLayoutDefinition(layoutId);
  return layout ? { 
    minImages: layout.minImages, 
    maxImages: layout.maxImages 
  } : { minImages: 1, maxImages: 10 };
};