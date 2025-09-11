/**
 * AvatarUpload - Specialized component for uploading profile avatars with crop functionality
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Loader2, X, Check, Crop } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import uploadService from '../services/uploadService';
import { cn } from '../lib/utils';
import ImageCropModal from './ImageCropModal';

const AvatarUpload = ({
  currentAvatar = null,
  onAvatarUpdate = () => {},
  size = 'lg', // sm, md, lg, xl
  showUploadButton = true,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-12 h-12', icon: 'w-4 h-4', button: 'h-6 text-xs' },
    md: { container: 'w-20 h-20', icon: 'w-5 h-5', button: 'h-8 text-sm' },
    lg: { container: 'w-32 h-32', icon: 'w-8 h-8', button: 'h-10 text-base' },
    xl: { container: 'w-40 h-40', icon: 'w-10 h-10', button: 'h-12 text-lg' }
  };

  const config = sizeConfig[size] || sizeConfig.lg;

  // Handle file selection - now opens crop modal
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file
    const validation = uploadService.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB for avatars
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (!validation.isValid) {
      toast({
        title: "Archivo no válido",
        description: validation.errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    // Set selected file and open crop modal
    setSelectedFile(file);
    setShowCropModal(true);
  };

  // Handle crop save
  const handleCropSave = (cropResult) => {
    setPreview(cropResult.base64);
    setShowCropModal(false);
    
    // Upload the cropped image
    uploadAvatar(cropResult.file);
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    setIsUploading(true);

    try {
      const result = await uploadService.uploadFile(
        file,
        'avatar',
        (progress) => {
          // Progress is handled by the loading state
          console.log(`Upload progress: ${progress}%`);
        }
      );

      // Get the full URL for the avatar
      const avatarUrl = uploadService.getPublicUrl(result.public_url);

      // Update user avatar in context/database
      if (updateUser) {
        await updateUser({ avatar_url: avatarUrl });
      }

      // Call callback
      onAvatarUpdate(result, avatarUrl);
      
      // Clear preview (will show the new avatar)
      setPreview(null);

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil ha sido actualizada exitosamente",
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      setPreview(null);
      
      toast({
        title: "Error al subir avatar",
        description: error.message || "No se pudo actualizar tu foto de perfil",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Get current display image
  const getDisplayImage = () => {
    if (preview) return preview;
    if (currentAvatar) {
      return currentAvatar.startsWith('http') 
        ? currentAvatar 
        : uploadService.getPublicUrl(currentAvatar);
    }
    return user?.avatar_url;
  };

  const displayImage = getDisplayImage();

  return (
    <div className={cn("relative inline-block w-full h-full", className)}>
      {/* Avatar Container */}
      <div
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden bg-gray-200",
          "transition-all duration-200 cursor-pointer",
          dragOver && "shadow-lg scale-105",
          isUploading && "opacity-75"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            document.getElementById('avatar-file-input')?.click();
          }
        }}
      >
        {/* Current Avatar or Placeholder */}
        {displayImage ? (
          <img
            src={displayImage}
            alt="Avatar"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <Camera className={cn("text-gray-600", config.icon)} />
          </div>
        )}

        {/* Upload Overlay */}
        <AnimatePresence>
          {(dragOver || (!displayImage && !isUploading)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <Upload className={cn("text-white", config.icon)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"
            >
              <Loader2 className={cn("text-white animate-spin", config.icon)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Indicator */}
        <AnimatePresence>
          {!isUploading && preview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1 right-1 bg-green-500 rounded-full p-1"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Button (Optional) */}
      {showUploadButton && (
        <div className="mt-3 text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('avatar-file-input')?.click()}
            disabled={isUploading}
            className={config.button}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Cambiar foto
              </>
            )}
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id="avatar-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {/* Drag Instructions (when dragging) */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          >
            Suelta para cambiar avatar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarUpload;