import React, { useState, useCallback } from 'react';
import CustomLogo from './CustomLogo';
import QuickActionsMenu from './QuickActionsMenu';
import useLongPress from '../hooks/useLongPress';
import { useToast } from '../hooks/use-toast';

const LogoWithQuickActions = ({ size = 32, className = "" }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { toast } = useToast();

  const handleLongPress = useCallback(() => {
    setShowQuickActions(true);
    setIsPressed(false);
    
    // Haptic feedback si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    toast({
      title: "🚀 Menú de acciones rápidas",
      description: "Selecciona una acción",
      duration: 2000,
    });
  }, [toast]);

  const handleShortPress = useCallback(() => {
    console.log('👆 Short press detected - no action (regular click)');
    // Para un click corto, no hacemos nada especial
    // Esto permite que el logo siga siendo clickeable para otras funcionalidades si se necesitan
  }, []);

  const handleCloseMenu = useCallback(() => {
    console.log('✖️ Closing quick actions menu');
    setShowQuickActions(false);
  }, []);

  const handleActionSelect = useCallback((actionType) => {
    console.log('🎯 Quick action selected:', actionType);
    
    switch (actionType) {
      case 'search':
        // Aquí se puede implementar navegación a página de búsqueda
        console.log('🔍 Navigating to search...');
        break;
      case 'moments':
        // Aquí se puede implementar navegación a historias
        console.log('📸 Navigating to moments...');
        break;
      default:
        console.log('❓ Unknown action:', actionType);
    }
  }, []);

  const longPressProps = useLongPress(
    handleLongPress,
    handleShortPress,
    600 // 600ms para activar long press
  );



  return (
    <>
      <div
        {...longPressProps}
        className={`${className} relative flex items-center justify-center cursor-pointer select-none transition-all duration-300 ${
          isPressed 
            ? 'scale-110 shadow-2xl bg-white/95' 
            : 'hover:scale-105 hover:shadow-lg'
        }`}
        onMouseDown={(e) => {
          longPressProps.onMouseDown(e);
          setIsPressed(true);
        }}
        onMouseUp={(e) => {
          longPressProps.onMouseUp(e);
          setIsPressed(false);
        }}
        onMouseLeave={(e) => {
          longPressProps.onMouseLeave(e);
          setIsPressed(false);
        }}
        onTouchStart={(e) => {
          longPressProps.onTouchStart(e);
          setIsPressed(true);
        }}
        onTouchEnd={(e) => {
          longPressProps.onTouchEnd(e);
          setIsPressed(false);
        }}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        title="Mantén presionado para acciones rápidas"
      >
        {/* Efectos de ondas concéntricas estilo Pinterest */}
        {isPressed && (
          <>
            <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" style={{zIndex: -1}} />
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{zIndex: -2, animationDelay: '150ms'}} />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{zIndex: -3, animationDelay: '300ms'}} />
          </>
        )}
        
        <CustomLogo 
          size={size} 
          className={`transition-all duration-300 ${
            isPressed ? 'brightness-110 drop-shadow-lg' : 'hover:brightness-105'
          }`} 
        />
        
        {/* Indicador visual de carga durante long press */}
        {isPressed && (
          <div 
            className="absolute inset-0 border-2 border-blue-400 rounded-full"
            style={{
              animation: 'pulse 0.6s ease-out infinite'
            }}
          />
        )}
      </div>

      {/* Menú de acciones rápidas */}
      <QuickActionsMenu 
        isVisible={showQuickActions}
        onClose={handleCloseMenu}
        onActionSelect={handleActionSelect}
      />
    </>
  );
};

export default LogoWithQuickActions;