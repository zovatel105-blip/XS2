/**
 * SimpleCropModal - Simple crop logic with fixed frame overlay
 * - Load media in interactive container
 * - Touch gestures: drag (move X/Y) and pinch (zoom)  
 * - Fixed frame overlay (9:16, 1:1, etc.) as crop "window"
 * - Media moves/scales underneath the frame
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const SimpleCropModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  mediaFile = null,
  frameAspectRatio = 9/16, // 9:16 for TikTok, 1 for square, etc.
  title = 'Ajustar Imagen'
}) => {
  const [mediaSrc, setMediaSrc] = useState('');
  const [mediaType, setMediaType] = useState('image');
  
  // Transform state for the media (underneath the fixed frame)
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  
  // Touch/gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  
  const containerRef = useRef(null);
  const mediaRef = useRef(null);
  const canvasRef = useRef(null);

  // Load media when file changes
  useEffect(() => {
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaSrc(reader.result);
        setMediaType(mediaFile.type.startsWith('video/') ? 'video' : 'image');
        // Reset transform when new media loads
        setTransform({
          scale: 1,
          translateX: 0,
          translateY: 0
        });
      };
      reader.readAsDataURL(mediaFile);
    }
  }, [mediaFile]);

  // Auto-fit media when it loads
  const handleMediaLoad = useCallback(() => {
    if (!mediaRef.current || !containerRef.current) return;
    
    const media = mediaRef.current;
    const container = containerRef.current;
    
    // Get media dimensions
    const mediaWidth = mediaType === 'video' ? media.videoWidth : media.naturalWidth;
    const mediaHeight = mediaType === 'video' ? media.videoHeight : media.naturalHeight;
    
    // Get frame dimensions (fixed crop window)
    const frameWidth = container.clientWidth * 0.8; // 80% of container
    const frameHeight = frameWidth * frameAspectRatio;
    
    // Calculate scale to fit media in frame (covering the entire frame)
    const scaleX = frameWidth / mediaWidth;
    const scaleY = frameHeight / mediaHeight;
    const initialScale = Math.max(scaleX, scaleY);
    
    console.log(`📐 Auto-fit: scale=${initialScale}, frameSize=${frameWidth}x${frameHeight}`);
    
    setTransform(prev => ({
      ...prev,
      scale: initialScale
    }));
  }, [mediaType, frameAspectRatio]);

  // Add global event listeners for mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Get distance between two touches
  const getDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true);
      setLastPanPoint({
        x: touches[0].clientX,
        y: touches[0].clientY
      });
      console.log('👆 Touch start - drag mode activated');
    } else if (touches.length === 2) {
      // Two touches - start pinching
      setIsDragging(false);
      setLastDistance(getDistance(touches));
      console.log('🤏 Two fingers detected - pinch mode activated');
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging) {
      // Single touch - dragging (move X/Y)
      const deltaX = touches[0].clientX - lastPanPoint.x;
      const deltaY = touches[0].clientY - lastPanPoint.y;
      
      console.log(`🔄 Dragging: deltaX=${deltaX}, deltaY=${deltaY}`);
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));
      
      setLastPanPoint({
        x: touches[0].clientX,
        y: touches[0].clientY
      });
    } else if (touches.length === 2) {
      // Two touches - pinching (zoom)
      const distance = getDistance(touches);
      const scaleDelta = distance / lastDistance;
      
      console.log(`🔍 Pinching: distance=${distance}, scaleDelta=${scaleDelta}`);
      
      setTransform(prev => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
      }));
      
      setLastDistance(distance);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('👆 Touch end - gestures stopped');
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel handler for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * scaleDelta))
    }));
  };

  // Reset transform
  const handleReset = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
    handleMediaLoad(); // Re-fit the media
  };

  // Generate cropped media
  const generateCroppedMedia = useCallback(async () => {
    if (!mediaRef.current || !containerRef.current || !canvasRef.current) {
      return null;
    }

    const media = mediaRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Frame dimensions (fixed crop window)
    const frameWidth = container.clientWidth * 0.8;
    const frameHeight = frameWidth * frameAspectRatio;
    
    // Set canvas size to frame size
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate media position relative to frame
    const containerCenterX = container.clientWidth / 2;
    const containerCenterY = container.clientHeight / 2;
    const frameCenterX = frameWidth / 2;
    const frameCenterY = frameHeight / 2;

    // Get media dimensions
    const mediaWidth = mediaType === 'video' ? media.videoWidth : media.naturalWidth;
    const mediaHeight = mediaType === 'video' ? media.videoHeight : media.naturalHeight;

    // Apply transformations
    ctx.save();
    
    // Move to frame center
    ctx.translate(frameCenterX, frameCenterY);
    
    // Apply scale and translation
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(
      (transform.translateX) / transform.scale,
      (transform.translateY) / transform.scale
    );

    // Draw the media centered
    ctx.drawImage(
      media,
      -mediaWidth / 2,
      -mediaHeight / 2,
      mediaWidth,
      mediaHeight
    );

    ctx.restore();

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          blob.name = mediaFile?.name || 'cropped-media.jpg';
          resolve(blob);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [transform, mediaFile, frameAspectRatio, mediaType]);

  // Handle save
  const handleSave = async () => {
    const croppedBlob = await generateCroppedMedia();
    if (croppedBlob) {
      const croppedFile = new File([croppedBlob], mediaFile?.name || 'cropped-media.jpg', {
        type: 'image/jpeg'
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        onSave({
          file: croppedFile,
          blob: croppedBlob,
          base64: reader.result,
          originalFile: mediaFile
        });
        onClose();
      };
      reader.readAsDataURL(croppedBlob);
    }
  };

  // Handle close
  const handleClose = () => {
    setMediaSrc('');
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
    onClose();
  };

  if (!isOpen || !mediaFile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <h2 className="text-lg font-semibold">{title}</h2>
          
          <Button
            onClick={handleSave}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-semibold"
          >
            <Check className="w-5 h-5 mr-1" />
            Listo
          </Button>
        </div>

        {/* Main Container - Interactive media area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            ref={containerRef}
            className="relative w-full h-full max-w-sm max-h-[70vh] bg-gray-900 overflow-hidden select-none"
            style={{ touchAction: 'none' }} // Prevent default touch behaviors
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop dragging when mouse leaves
            onWheel={handleWheel}
          >
            {/* Media underneath (moves and scales) */}
            {mediaSrc && (
              <>
                {mediaType === 'video' ? (
                  <video
                    ref={mediaRef}
                    src={mediaSrc}
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    style={{
                      transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
                      transformOrigin: 'center'
                    }}
                    onLoadedMetadata={handleMediaLoad}
                    onDragStart={(e) => e.preventDefault()}
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    ref={mediaRef}
                    src={mediaSrc}
                    alt="Crop preview"
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    style={{
                      transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
                      transformOrigin: 'center'
                    }}
                    onLoad={handleMediaLoad}
                    onDragStart={(e) => e.preventDefault()}
                  />
                )}
              </>
            )}
            
            {/* Fixed Frame Overlay - The crop "window" */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="border-4 border-white shadow-lg pointer-events-none"
                style={{
                  width: '80%',
                  aspectRatio: `${1 / frameAspectRatio}`,
                  maxWidth: '90%',
                  maxHeight: '90%'
                }}
              >
                {/* Grid lines inside the frame */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Dark overlay outside the frame */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none">
              <div 
                className="absolute bg-transparent"
                style={{
                  left: '10%',
                  top: '50%',
                  width: '80%',
                  aspectRatio: `${1 / frameAspectRatio}`,
                  transform: 'translateY(-50%)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 text-white">
          <div className="flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white hover:bg-white/20 rounded-full p-3"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="text-center mt-4 text-gray-300 text-sm">
            Pellizca para hacer zoom • Arrastra para mover
          </div>
        </div>

        {/* Hidden canvas for generating cropped media */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleCropModal;