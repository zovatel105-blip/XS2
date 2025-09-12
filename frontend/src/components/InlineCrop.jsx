/**
 * InlineCrop - TikTok-style crop functionality directly in the preview area
 * - Mobile-first touch gestures with desktop support
 * - Minimalist TikTok-inspired UI
 * - Smooth pinch-to-zoom with bounce limits
 * - Drag to reposition without going outside bounds
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const InlineCrop = ({
  isActive = false,
  imageSrc = '',
  onSave = () => {},
  onCancel = () => {},
  className = ''
}) => {
  // Transform state for the image
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // Touch interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Reset transform when becoming active
  useEffect(() => {
    if (isActive) {
      setTransform({ scale: 1, translateX: 0, translateY: 0 });
      setIsInteracting(false);
      setHasChanges(false);
      
      // Clear any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    }
  }, [isActive]);

  // Auto-save after interaction ends
  const scheduleAutoSave = useCallback(() => {
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Schedule auto-save after 800ms of inactivity
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (hasChanges) {
        await handleSave();
      }
    }, 800);
  }, [hasChanges]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Get distance between two touches (pinch gesture detection)
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle start of touch/mouse interaction
  const handleStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    setIsInteracting(true);
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1) {
        // Single finger - drag
        setIsDragging(true);
        setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
      } else if (touches.length === 2) {
        // Two fingers - pinch zoom
        setIsDragging(false);
        setLastDistance(getDistance(touches));
        
        // Center point between fingers for zoom origin
        const centerX = (touches[0].clientX + touches[1].clientX) / 2;
        const centerY = (touches[0].clientY + touches[1].clientY) / 2;
        setLastTouch({ x: centerX, y: centerY });
      }
    } else {
      // Mouse event
      setIsDragging(true);
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle movement during interaction - wrapped in useCallback
  const handleMove = useCallback((e) => {
    if (!isActive || !isInteracting) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches) {
      // Touch event
      const touches = e.touches;
      
      if (touches.length === 1 && isDragging) {
        // Single finger drag - move image smoothly
        const touch = touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        setTransform(prev => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY
        }));
        
        setLastTouch({ x: touch.clientX, y: touch.clientY });
        setHasChanges(true); // Mark as changed
        
      } else if (touches.length === 2) {
        // Two finger pinch - zoom with limits and bounce
        const distance = getDistance(touches);
        const scaleFactor = distance / lastDistance;
        
        if (scaleFactor > 0.5 && scaleFactor < 2) { // Prevent extreme scaling
          setTransform(prev => {
            let newScale = prev.scale * scaleFactor;
            
            // Apply limits with smooth bounce effect
            if (newScale < 0.5) {
              newScale = 0.5 + (0.5 - newScale) * 0.1; // Bounce back from minimum
            } else if (newScale > 3) {
              newScale = 3 + (newScale - 3) * 0.1; // Bounce back from maximum
            }
            
            return {
              ...prev,
              scale: newScale
            };
          });
          
          setLastDistance(distance);
          setHasChanges(true); // Mark as changed
        }
      }
    } else if (isDragging) {
      // Mouse drag
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  }, [isActive, isInteracting, isDragging, lastTouch, lastDistance]);

  // Handle end of interaction - wrapped in useCallback
  const handleEnd = useCallback((e) => {
    if (!isActive) return;
    
    setIsDragging(false);
    setIsInteracting(false);
    
    // Apply scale limits and bounce back if exceeded
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale))
    }));
  }, [isActive]);

  // Handle mouse wheel for desktop zoom
  const handleWheel = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
    }));
  };

  // Global event listeners for smooth gesture handling - FIXED dependencies
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

    // Add global listeners for smooth gesture tracking
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
  }, [isActive, isInteracting, handleMove, handleEnd]); // FIXED: Added missing dependencies

  // Generate cropped image
  const generateCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current || !canvasRef.current) {
      return null;
    }

    const img = imageRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to container size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply transform to draw the image as it appears to user
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(
      transform.translateX / transform.scale,
      transform.translateY / transform.scale
    );

    // Draw image centered
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    ctx.restore();

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [transform]);

  // Handle save
  const handleSave = async () => {
    const croppedBlob = await generateCrop();
    if (croppedBlob) {
      const reader = new FileReader();
      reader.onload = () => {
        onSave({
          blob: croppedBlob,
          base64: reader.result
        });
      };
      reader.readAsDataURL(croppedBlob);
    }
  };

  if (!isActive) {
    // Normal image display when not cropping
    return (
      <img
        src={imageSrc}
        alt="Preview"
        className={`w-full h-full object-cover ${className}`}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  }

  // Crop mode - TikTok-style interface
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ pointerEvents: 'auto' }}>
      {/* Dark semi-transparent overlay outside visible area */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Interactive image container - REMOVED redundant local handlers */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-move select-none"
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        onWheel={handleWheel}
        style={{ touchAction: 'none', pointerEvents: 'auto' }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: 'center',
            transition: isInteracting ? 'none' : 'transform 0.2s ease-out'
          }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Crop frame with clean, soft lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Rule of thirds grid - minimal and clean */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/60" />
          ))}
        </div>
        
        {/* Crop frame border - soft and clear */}
        <div className="absolute inset-0 border-2 border-white/80 rounded-sm shadow-lg" />
      </div>

      {/* Floating control buttons - minimal TikTok style */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 pointer-events-auto">
        <button
          onClick={onCancel}
          className="w-12 h-12 bg-black/70 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleSave}
          className="w-12 h-12 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Subtle interaction hint - bottom center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
          {isInteracting 
            ? (isDragging ? '👆 Moviendo...' : '🤏 Zoom...') 
            : '👆 Arrastra • 🤏 Pellizca para zoom'
          }
        </div>
      </div>

      {/* Hidden canvas for crop generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default InlineCrop;