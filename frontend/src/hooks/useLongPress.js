import { useCallback, useRef } from 'react';

const useLongPress = (onLongPress, onShortPress, delay = 500) => {
  const timeout = useRef();
  const preventClick = useRef(false);

  const start = useCallback((event) => {
    console.log('🔄 LONGPRESS HOOK: start() called', event.type);
    
    // Prevenir el comportamiento por defecto
    event.preventDefault?.();
    
    // Limpiar timeout previo
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    preventClick.current = false;

    console.log(`⏱️ LONGPRESS HOOK: Setting timeout for ${delay}ms`);
    timeout.current = setTimeout(() => {
      console.log('🚀 LONGPRESS HOOK: Timeout reached - calling onLongPress');
      onLongPress(event);
      preventClick.current = true;
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((event) => {
    console.log('🛑 LONGPRESS HOOK: clear() called', event?.type, 'preventClick:', preventClick.current);
    
    if (timeout.current) {
      console.log('🔄 LONGPRESS HOOK: Clearing timeout');
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    // Si no fue un long press y hay callback para short press
    if (!preventClick.current && onShortPress) {
      console.log('👆 LONGPRESS HOOK: Calling onShortPress');
      onShortPress(event);
    }

    // Reset del flag
    setTimeout(() => {
      preventClick.current = false;
    }, 100);
  }, [onShortPress]);

  const cancel = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    preventClick.current = false;
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: cancel,
    onClick: (event) => {
      if (preventClick.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };
};

export default useLongPress;