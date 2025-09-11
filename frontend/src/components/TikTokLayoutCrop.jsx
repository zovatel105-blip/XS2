/**
 * TikTokLayoutCrop - Exact TikTok crop experience
 * - Fullscreen image/video background
 * - Resizable and movable crop frame
 * - TikTok-style controls and layout
 * - Touch gestures for frame manipulation
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw, Move, ZoomIn } from 'lucide-react';
import { Button } from './ui/button';

const TikTokLayoutCrop = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  mediaFile = null,
  aspectRatio = 9/16, // Default TikTok ratio
  title = 'Ajustar'
}) => {
  const [mediaSrc, setMediaSrc] = useState('');
  const [mediaType, setMediaType] = useState('image');
  
  // Crop frame state (this is what moves and resizes)
  const [cropFrame, setCropFrame] = useState({
    x: 50, // Percentage from left
    y: 50, // Percentage from top
    width: 80, // Percentage of container
    height: 80 // Will be calculated based on aspect ratio
  });
  
  // Media transform state (background image/video)
  const [mediaTransform, setMediaTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  
  // Interaction state
  const [isDraggingFrame, setIsDraggingFrame] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastDistance, setLastDistance] = useState(0);
  
  const containerRef = useRef(null);
  const mediaRef = useRef(null);
  const frameRef = useRef(null);
  const canvasRef = useRef(null);

  // Load media
  useEffect(() => {
    if (mediaFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaSrc(reader.result);
        setMediaType(mediaFile.type.startsWith('video/') ? 'video' : 'image');
        
        // Reset states
        setMediaTransform({ scale: 1, translateX: 0, translateY: 0 });
        setCropFrame({ x: 50, y: 50, width: 60, height: 60 * aspectRatio });
      };
      reader.readAsDataURL(mediaFile);
    }
  }, [mediaFile, aspectRatio]);

  // Get distance between touches
  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Simplified touch handlers that actually work on mobile
  const handleTouchStart = (e) => {
    const touches = e.touches;
    console.log(`🔥 Touch start: ${touches.length} fingers`);
    
    if (touches.length === 1) {
      // Single touch - check if touching the frame or background
      const touch = touches[0];
      const frameElement = frameRef.current;
      
      if (frameElement) {
        const frameRect = frameElement.getBoundingClientRect();
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check if touch is inside the crop frame
        if (touchX >= frameRect.left && touchX <= frameRect.right &&
            touchY >= frameRect.top && touchY <= frameRect.bottom) {
          setIsDraggingFrame(true);
          console.log('📱 Dragging FRAME');
        } else {
          setIsDraggingMedia(true);
          console.log('🖼️ Dragging MEDIA');
        }
      } else {
        setIsDraggingMedia(true);
      }
      
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    } else if (touches.length === 2) {
      // Two finger pinch - always for media zoom
      setIsDraggingFrame(false);
      setIsDraggingMedia(false);
      setLastDistance(getDistance(touches));
      console.log('🤏 Pinch started');
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling
    const touches = e.touches;
    
    if (touches.length === 1) {
      const touch = touches[0];
      const deltaX = touch.clientX - lastTouch.x;
      const deltaY = touch.clientY - lastTouch.y;
      
      console.log(`🔄 Delta: ${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}`);
      
      if (isDraggingFrame && containerRef.current) {
        // Move the crop frame
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Convert pixel movement to percentage
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;
        
        setCropFrame(prev => {
          const newX = Math.max(prev.width/2, Math.min(100 - prev.width/2, prev.x + deltaXPercent));
          const newY = Math.max(prev.height/2, Math.min(100 - prev.height/2, prev.y + deltaYPercent));
          
          console.log(`📱 Frame moved to: ${newX.toFixed(1)}, ${newY.toFixed(1)}`);
          return { ...prev, x: newX, y: newY };
        });
        
      } else if (isDraggingMedia) {
        // Move the background media
        setMediaTransform(prev => {
          const newTransform = {
            ...prev,
            translateX: prev.translateX + deltaX,
            translateY: prev.translateY + deltaY
          };
          
          console.log(`🖼️ Media moved to: ${newTransform.translateX.toFixed(1)}, ${newTransform.translateY.toFixed(1)}`);
          return newTransform;
        });
      }
      
      setLastTouch({ x: touch.clientX, y: touch.clientY });
      
    } else if (touches.length === 2) {
      // Pinch zoom
      const distance = getDistance(touches);
      const scaleFactor = distance / lastDistance;
      
      if (scaleFactor > 0.1 && scaleFactor < 10) { // Sanity check
        setMediaTransform(prev => {
          const newScale = Math.max(0.5, Math.min(3, prev.scale * scaleFactor));
          console.log(`🔍 Media zoom: ${newScale.toFixed(2)}x`);
          return { ...prev, scale: newScale };
        });
        
        setLastDistance(distance);
      }
    }
  };

  const handleTouchEnd = (e) => {
    console.log('✋ Touch ended');
    setIsDraggingFrame(false);
    setIsDraggingMedia(false);
  };

  // Reset everything
  const handleReset = () => {
    setMediaTransform({ scale: 1, translateX: 0, translateY: 0 });
    setCropFrame({ x: 50, y: 50, width: 60, height: 60 * aspectRatio });
    console.log('🔄 Reset all');
  };

  // Generate cropped result
  const generateCrop = useCallback(async () => {
    if (!mediaRef.current || !containerRef.current || !canvasRef.current) {
      return null;
    }

    const media = mediaRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Calculate actual crop dimensions
    const containerRect = container.getBoundingClientRect();
    const cropWidth = (cropFrame.width / 100) * containerRect.width;
    const cropHeight = (cropFrame.height / 100) * containerRect.height;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Get media dimensions
    const mediaWidth = mediaType === 'video' ? media.videoWidth : media.naturalWidth;
    const mediaHeight = mediaType === 'video' ? media.videoHeight : media.naturalHeight;

    // Calculate crop area on the actual media
    const scaleX = mediaWidth / containerRect.width;
    const scaleY = mediaHeight / containerRect.height;
    
    const cropX = (cropFrame.x / 100) * containerRect.width * scaleX;
    const cropY = (cropFrame.y / 100) * containerRect.height * scaleY;
    const cropW = cropWidth * scaleX;
    const cropH = cropHeight * scaleY;

    // Draw cropped area
    ctx.drawImage(
      media,
      cropX, cropY, cropW, cropH,
      0, 0, cropWidth, cropHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          blob.name = mediaFile?.name || 'tiktok-crop.jpg';
          resolve(blob);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [cropFrame, mediaFile, mediaType]);

  // Handle save
  const handleSave = async () => {
    const croppedBlob = await generateCrop();
    if (croppedBlob) {
      const croppedFile = new File([croppedBlob], mediaFile?.name || 'tiktok-crop.jpg', {
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

  if (!isOpen || !mediaFile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* TikTok Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          
          <Button
            onClick={handleSave}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-semibold"
          >
            <Check className="w-4 h-4 mr-1" />
            Listo
          </Button>
        </div>

        {/* Fullscreen Media Background */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {mediaSrc && (
            <>
              {mediaType === 'video' ? (
                <video
                  ref={mediaRef}
                  src={mediaSrc}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `translate(${mediaTransform.translateX}px, ${mediaTransform.translateY}px) scale(${mediaTransform.scale})`,
                    transformOrigin: 'center'
                  }}
                  muted
                  playsInline
                />
              ) : (
                <img
                  ref={mediaRef}
                  src={mediaSrc}
                  alt="Crop source"
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  style={{
                    transform: `translate(${mediaTransform.translateX}px, ${mediaTransform.translateY}px) scale(${mediaTransform.scale})`,
                    transformOrigin: 'center'
                  }}
                  onDragStart={(e) => e.preventDefault()}
                />
              )}
            </>
          )}
          
          {/* Dark overlay outside crop area */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Crop Frame - TikTok Style */}
          <div
            ref={frameRef}
            className="absolute border-4 border-white shadow-2xl bg-transparent"
            style={{
              left: `${cropFrame.x}%`,
              top: `${cropFrame.y}%`,
              width: `${cropFrame.width}%`,
              height: `${cropFrame.height}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onTouchStart={handleFrameTouchStart}
          >
            {/* Grid lines inside frame */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/30" />
              ))}
            </div>
            
            {/* Corner handles */}
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg" />
            
            {/* Center move handle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <Move className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        {/* TikTok Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            
            <div className="text-center text-white">
              <div className="text-sm opacity-80">Marco: {cropFrame.width.toFixed(0)}%</div>
              <div className="text-xs opacity-60">Zoom: {mediaTransform.scale.toFixed(1)}x</div>
            </div>
            
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full w-12 h-12 p-0"
            >
              <ZoomIn className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="text-center mt-4 text-white/70 text-sm">
            Arrastra el marco • Pellizca la imagen para zoom
          </div>
        </div>

        {/* Hidden canvas for crop generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default TikTokLayoutCrop;