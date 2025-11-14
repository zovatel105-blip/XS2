import React, { useState, useEffect } from 'react';
import { X, Music, Share2, Bookmark, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import audioManager from '../services/AudioManager';

const AudioInfoModal = ({ audioId, isOpen, onClose, onUseSound }) => {
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dominantColor, setDominantColor] = useState('rgba(176, 97, 255, 0.15)');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && audioId) {
      fetchAudioDetails();
    }
  }, [isOpen, audioId]);

  // Extract vibrant color from cover image
  useEffect(() => {
    if (audio?.cover_url) {
      extractVibrantColor(audio.cover_url);
    }
  }, [audio?.cover_url]);

  const extractVibrantColor = (imageUrl) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        
        ctx.drawImage(img, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100).data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        for (let i = 0; i < imageData.length; i += 16) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (delta > 0) {
          const saturationBoost = 1.5;
          const midpoint = (max + min) / 2;
          
          r = Math.min(255, Math.floor(midpoint + (r - midpoint) * saturationBoost));
          g = Math.min(255, Math.floor(midpoint + (g - midpoint) * saturationBoost));
          b = Math.min(255, Math.floor(midpoint + (b - midpoint) * saturationBoost));
        }
        
        setDominantColor(`rgba(${r}, ${g}, ${b}, 0.2)`);
      } catch (error) {
        console.error('Error extracting color:', error);
        setDominantColor('rgba(176, 97, 255, 0.15)');
      }
    };
    
    img.onerror = () => {
      setDominantColor('rgba(176, 97, 255, 0.15)');
    };
    
    img.src = imageUrl;
  };

  const fetchAudioDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/audio/${audioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAudio(data.audio);
      } else {
        console.error('Error fetching audio details');
      }
    } catch (error) {
      console.error('Error fetching audio details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audio?.public_url) return;

    try {
      if (isPlaying) {
        await audioManager.pause();
        setIsPlaying(false);
      } else {
        const success = await audioManager.play(audio.public_url, {
          startTime: 0,
          loop: true
        });
        if (success) {
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleUseThisSound = () => {
    if (!audio) return;

    const audioForCreation = {
      id: audio.id,
      title: audio.title,
      artist: audio.artist,
      cover: audio.cover_url,
      preview_url: audio.public_url,
      duration: audio.duration,
      source: audio.source,
      is_system_music: audio.is_system_music
    };
    
    if (onUseSound) {
      onUseSound(audioForCreation);
    } else {
      navigate('/content-creation', {
        state: {
          preSelectedAudio: audioForCreation
        }
      });
    }
    onClose();
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/audio/${audioId}`;
      const shareText = `🎵 "${audio.title}" - ${audio.artist}`;
      
      if (navigator.share && navigator.canShare) {
        await navigator.share({
          title: `${audio.title} - ${audio.artist}`,
          text: shareText,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast({
          title: "Enlace copiado",
          description: "Se ha copiado al portapapeles"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewFullPage = () => {
    navigate(`/audio/${audioId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando audio...</p>
          </div>
        ) : audio ? (
          <div className="p-6 space-y-6">
            {/* Audio Info */}
            <div 
              className="rounded-lg border border-gray-200 p-6 transition-all duration-500"
              style={{ 
                background: `linear-gradient(to bottom, ${dominantColor} 0%, ${dominantColor.replace('0.2', '0.12')} 40%, ${dominantColor.replace('0.2', '0.05')} 70%, white 100%)`
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors relative"
                  onClick={handlePlayPause}
                >
                  {audio.cover_url ? (
                    <img 
                      src={audio.cover_url} 
                      alt={audio.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="w-10 h-10 text-gray-600" />
                  )}
                  
                  {/* Play/Pause overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 rounded-lg transition-opacity">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 ml-1 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {audio.title}
                  </h2>
                  {audio.artist && (
                    <p className="text-gray-600 truncate">{audio.artist}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {audio.uses_count || 0} usos
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleUseThisSound}
                className="flex items-center justify-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>Use Sound</span>
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </Button>
            </div>

            {/* View full page link */}
            <button
              onClick={handleViewFullPage}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver todos los videos con este audio →
            </button>
          </div>
        ) : (
          <div className="py-16 text-center px-6">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudo cargar la información del audio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioInfoModal;
