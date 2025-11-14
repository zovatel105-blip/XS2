import React from 'react';
import CarouselLayout from './CarouselLayout';
import GridLayout from './GridLayout';

// Mapeo dinámico de layoutType → componente para los 8 layouts soportados
const layoutComponents = {
  'off': CarouselLayout,                    // Carrusel vertical
  'vertical': (props) => <GridLayout {...props} gridType="vertical" />,           // Split Vertical (2 columnas)
  'horizontal': (props) => <GridLayout {...props} gridType="horizontal" />,       // Split Horizontal (2 filas)
  'triptych-vertical': (props) => <GridLayout {...props} gridType="triptych-vertical" />,   // Triptych Vertical (3 columnas)
  'triptych-horizontal': (props) => <GridLayout {...props} gridType="triptych-horizontal" />, // Triptych Horizontal (3 filas)
  'grid-2x2': (props) => <GridLayout {...props} gridType="grid-2x2" />,         // Grid 2x2 (4 partes)
  'grid-3x2': (props) => <GridLayout {...props} gridType="grid-3x2" />,         // Grid 3x2 (6 partes: 3 columnas × 2 filas)
  'horizontal-3x2': (props) => <GridLayout {...props} gridType="horizontal-3x2" /> // Grid 2x3 (6 partes: 2 columnas × 3 filas)
};

/**
 * Renderizador de layouts dinámico
 * @param {Object} poll - Datos de la publicación
 * @param {Function} onVote - Función para manejar votos
 * @param {boolean} isActive - Si el componente está activo
 * @returns {JSX.Element} - Componente de layout renderizado
 */
const LayoutRenderer = ({ 
  poll, 
  onVote, 
  isActive,
  currentSlide = 0,
  onSlideChange,
  handleTouchStart,
  handleTouchEnd,
  index,
  showLogo,
  // 🎵 NUEVO: Callback para notificar cambio de thumbnail en carrusel con audio original
  onThumbnailChange,
  // 🎵 NUEVO: Callback para notificar cambio de audio en carrusel con audio original
  onAudioChange,
  // 🚀 PERFORMANCE: Layout optimization props
  optimizeVideo = false,
  renderPriority = 'medium',
  shouldPreload = true,
  isVisible = true,
  shouldUnload = false,
  layout = null
}) => {
  // Obtener el layout type del poll, con fallback a 'vertical'
  const layoutType = poll.layout || 'vertical';
  
  // SOLO layout "off" debe usar carrusel
  if (layoutType === 'off') {
    return (
      <CarouselLayout 
        poll={poll} 
        onVote={onVote} 
        isActive={isActive}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        onThumbnailChange={onThumbnailChange}
        onAudioChange={onAudioChange}
        // 🚀 PERFORMANCE: Carousel optimization
        optimizeVideo={optimizeVideo}
        renderPriority={renderPriority}
        shouldPreload={shouldPreload}
        isVisible={isVisible}
        shouldUnload={shouldUnload}
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
      // 🚀 PERFORMANCE: Grid layout optimization (critical for 2x2 videos)
      optimizeVideo={optimizeVideo}
      renderPriority={renderPriority}
      shouldPreload={shouldPreload}
      isVisible={isVisible}
      shouldUnload={shouldUnload}
      layout={layout}
      index={index}
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