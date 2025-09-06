import React, { useState, useCallback } from 'react';
import CustomLogo from './CustomLogo';
import QuickActionsMenu from './QuickActionsMenu';
import useLongPress from '../hooks/useLongPress';
import { useToast } from '../hooks/use-toast';

const LogoWithQuickActions = ({ size = 24, className = "" }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { toast } = useToast();

  const handleLongPress = useCallback(() => {
    console.log('🎯 LONG PRESS DETECTED - SHOWING QUICK ACTIONS MENU');
    console.log('🔄 Setting showQuickActions to true...');
    setShowQuickActions(true);
    setIsPressed(false);
    
    // Haptic feedback si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(50);
      console.log('📳 Haptic feedback triggered');
    }
    
    // Test alert para debugging
    // alert('Long press detected!');
    
    toast({
      title: "🚀 Menú de acciones rápidas",
      description: "Selecciona una acción",
      duration: 2000,
    });
    
    console.log('✅ Long press handler completed');
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

  // Debug logging para el estado del menú
  console.log('🔍 LogoWithQuickActions render - showQuickActions:', showQuickActions);

  return (
    <>
      <div
        {...longPressProps}
        className={`${className} flex items-center justify-center cursor-pointer select-none transition-all duration-200 ${
          isPressed ? 'scale-95' : 'hover:scale-105'
        }`}
        onMouseDown={(e) => {
          console.log('🖱️ MouseDown event - combined handler');
          longPressProps.onMouseDown(e);
          setIsPressed(true);
        }}
        onMouseUp={(e) => {
          console.log('🖱️ MouseUp event - combined handler');
          longPressProps.onMouseUp(e);
          setIsPressed(false);
        }}
        onMouseLeave={(e) => {
          console.log('🖱️ MouseLeave event - combined handler');
          longPressProps.onMouseLeave(e);
          setIsPressed(false);
        }}
        onTouchStart={(e) => {
          console.log('📱 TouchStart event - combined handler');
          longPressProps.onTouchStart(e);
          setIsPressed(true);
        }}
        onTouchEnd={(e) => {
          console.log('📱 TouchEnd event - combined handler');
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
        <CustomLogo 
          size={size} 
          className={`transition-all duration-200 ${
            isPressed ? 'brightness-75' : ''
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