/**
 * InlineCrop - Simple crop functionality without black areas
 * - Uses object-cover + object-position (safer than transforms)
 * - Prevents black areas by design
 * - Mobile-first touch gestures
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  savedTransform = null,
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  console.log('🔍 InlineCrop render - isActive:', isActive, 'savedTransform:', savedTransform);

  // Enhanced position and scale state
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Percentage for object-position
  const [scale, setScale] = useState(1); // Scale for zoom
  const [hasChanges, setHasChanges] = useState(false);
  
  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const prevActiveRef = useRef(isActive);

  // Get distance between touches for pinch gesture
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle start of interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      const touches = e.touches;
      if (touches.length === 1) {
        // Single touch - drag
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two finger pinch
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      setIsDragging(true);  
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement
  const handleMove = useCallback((e) => {
    if (!isActive || !isInteracting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        // Better sensitivity for drag - INVERTED for intuitive movement
        const sensitivity = 0.3;
        const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
        const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
        
        setPosition(prev => ({
          x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
          y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
        }));
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setHasChanges(true);
        
      } else if (touches.length === 2) {
        // Pinch zoom
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        if (scaleFactor > 0.8 && scaleFactor < 1.2) {
          setScale(prev => {
            const newScale = prev * scaleFactor;
            return Math.max(1, Math.min(3, newScale)); // Scale 1x to 3x
          });
          
          setLastDistance(distance);
          setHasChanges(true);
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      const sensitivity = 0.3;
      const deltaPercentX = -deltaX * sensitivity; // NEGATIVE for correct direction
      const deltaPercentY = -deltaY * sensitivity; // NEGATIVE for correct direction
      
      setPosition(prev => ({
        x: Math.max(10, Math.min(90, prev.x + deltaPercentX)),
        y: Math.max(10, Math.min(90, prev.y + deltaPercentY))
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
      setHasChanges(true);
    }
  }, [isActive, isInteracting, isDragging, lastTouch, lastDistance]);

  // Handle end of interaction
  const handleEnd = useCallback(() => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
  }, [isActive]);

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
    
    setScale(prev => {
      const newScale = prev * scaleDelta;
      return Math.max(1, Math.min(3, newScale));
    });
    
    setHasChanges(true);
  };

  // Always sync with savedTransform when it changes
  useEffect(() => {
    if (savedTransform && savedTransform.transform) {
      console.log('🔄 Syncing with savedTransform:', savedTransform.transform);
      setPosition(savedTransform.transform.position);
      setScale(savedTransform.transform.scale || 1);
    }
  }, [savedTransform]);

  // Reset position when becoming active
  useEffect(() => {
    if (isActive) {
      if (savedTransform && savedTransform.transform) {
        setPosition(savedTransform.transform.position);
        setScale(savedTransform.transform.scale || 1);
        console.log('🔄 Loading saved transform for active mode:', savedTransform.transform);
      } else {
        setPosition({ x: 50, y: 50 });
        setScale(1);
        console.log('🔄 Loading default transform for active mode');
      }
      setHasChanges(false);
      setIsInteracting(false);
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [isActive]);

  // Save when isActive changes from true to false
  useEffect(() => {
    if (prevActiveRef.current === true && isActive === false && hasChanges) {
      console.log('💾 Saving on exit - position:', position, 'scale:', scale);
      
      const transformData = {
        transform: {
          position: position,  
          scale: scale
        },
        originalImageSrc: imageSrc
      };
      
      console.log('📤 Sending transform data:', transformData);
      onSave(transformData);
      setHasChanges(false);
      
      setTimeout(() => {
        console.log('🚪 Calling onCancel to exit crop mode');
        onCancel();  
      }, 200);
    }
    
    prevActiveRef.current = isActive;
  }, [isActive, hasChanges, position, scale, imageSrc, onSave, onCancel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Global event listeners for smooth gesture handling
  useEffect(() => {
    if (!isActive) return;

    const handleGlobalMove = (e) => {
      if (isInteracting) {
        handleMove(e);
      }
    };

    const handleGlobalEnd = (e) => {
      if (isInteracting) {
        handleEnd(e);
      }
    };

    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [isActive, isInteracting, handleMove, handleEnd]);

  // CONDITIONAL RENDERS AFTER ALL HOOKS
  if (!isActive) {
    const displayPosition = savedTransform?.transform?.position || { x: 50, y: 50 };
    const displayScale = savedTransform?.transform?.scale || 1;
    
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} ref={containerRef}>
        <img
          src={imageSrc}
          alt="Preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${displayPosition.x}% ${displayPosition.y}%`,
            transform: `scale(${displayScale})`,
            transformOrigin: 'center'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* DEBUG: Only show when NOT active */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-sm p-2 rounded pointer-events-none z-50">
          <div>INACTIVE</div>
          <div>P: {displayPosition.x},{displayPosition.y}</div>
          <div>S: {displayScale}</div>
          <div>ST: {savedTransform ? 'YES' : 'NO'}</div>
        </div>
      </div>
    );
  }

  // Crop mode - active image with gestures
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ pointerEvents: 'auto' }}>
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none z-10"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        onWheel={handleWheel}
        style={{ touchAction: 'none', pointerEvents: 'auto' }}
      >
        <img
          src={imageSrc}
          alt="Adjust preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${position.x}% ${position.y}%`,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: isInteracting ? 'none' : 'transform 0.2s ease-out'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* DEBUG: Only show when ACTIVE */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-sm p-2 rounded pointer-events-none z-50">
          <div>ACTIVE</div>
          <div>P: {position.x},{position.y}</div>
          <div>S: {scale}</div>
          <div>Changes: {hasChanges ? 'YES' : 'NO'}</div>
        </div>
      </div>
    </div>
  );
};

export default InlineCrop;