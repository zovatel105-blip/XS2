import React from 'react';
import CarouselLayout from './CarouselLayout';
import GridLayout from './GridLayout';

// Mapeo dinámico de layoutType → componente
const layoutComponents = {
  'off': CarouselLayout,
  'vertical': (props) => <GridLayout {...props} gridType="vertical" />,
  'horizontal': (props) => <GridLayout {...props} gridType="horizontal" />,
  'triptych-vertical': (props) => <GridLayout {...props} gridType="triptych-vertical" />,
  'triptych-horizontal': (props) => <GridLayout {...props} gridType="triptych-horizontal" />,
  'grid-2x2': (props) => <GridLayout {...props} gridType="grid-2x2" />,
  'grid-3x2': (props) => <GridLayout {...props} gridType="grid-3x2" />,
  'horizontal-3x2': (props) => <GridLayout {...props} gridType="horizontal-3x2" />
};

/**
 * Renderizador de layouts dinámico
 * @param {Object} poll - Datos de la publicación
 * @param {Function} onVote - Función para manejar votos
 * @param {boolean} isActive - Si el componente está activo
 * @returns {JSX.Element} - Componente de layout renderizado
 */
const LayoutRenderer = ({ poll, onVote, isActive }) => {
  // Obtener el layout type del poll, con fallback a 'vertical'
  const layoutType = poll.layout || 'vertical';
  
  // SOLO layout "off" debe usar carrusel
  if (layoutType === 'off') {
    return (
      <CarouselLayout 
        poll={poll} 
        onVote={onVote} 
        isActive={isActive}
      />
    );
  }
  
  // Todos los demás layouts usan GridLayout
  const gridType = layoutType === 'vertical' ? 'vertical' :
                   layoutType === 'horizontal' ? 'horizontal' :
                   layoutType === 'triptych-vertical' ? 'triptych-vertical' :
                   layoutType === 'triptych-horizontal' ? 'triptych-horizontal' :
                   layoutType === 'grid-2x2' ? 'grid-2x2' :
                   layoutType === 'grid-3x2' ? 'grid-3x2' :
                   layoutType === 'horizontal-3x2' ? 'horizontal-3x2' :
                   'vertical'; // fallback
  
  return (
    <GridLayout 
      poll={poll} 
      onVote={onVote} 
      isActive={isActive}
      gridType={gridType}
    />
  );
};

/**
 * Función utilitaria para obtener los tipos de layout disponibles
 * @returns {string[]} - Array de tipos de layout disponibles
 */
export const getAvailableLayouts = () => {
  return Object.keys(layoutComponents);
};

/**
 * Función utilitaria para verificar si un layout existe
 * @param {string} layoutType - Tipo de layout a verificar
 * @returns {boolean} - Si el layout existe
 */
export const isValidLayout = (layoutType) => {
  return layoutType in layoutComponents;
};

export default LayoutRenderer;