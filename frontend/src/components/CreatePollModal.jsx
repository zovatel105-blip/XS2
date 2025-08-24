import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, X, Sparkles, Upload, Image, Video, Play, Music, Send, AtSign, Settings } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { fileToBase64 } from '../services/mockData';
import pollService from '../services/pollService';
import MusicSelector from './MusicSelector';
import PollOptionUpload from './PollOptionUpload';
import UploadWidget from './UploadWidget';
import UserMentionInput from './UserMentionInput';
import VideoPlaybackSettings from './VideoPlaybackSettings';

const MediaUploadPreview = ({ media, onRemove, isVideo = false }) => {
  if (!media) return null;

  return (
    <div className="relative w-full h-32 sm:h-48 rounded-2xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
      {isVideo ? (
        <div className="relative w-full h-full">
          <img 
            src={media.thumbnail} 
            alt="Video preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900 ml-1" />
            </div>
          </div>
        </div>
      ) : (
        <img 
          src={media.url} 
          alt="Preview"
          className="w-full h-full object-cover"
        />
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-50 hover:text-red-500 transition-all duration-200 shadow-lg border border-gray-200"
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
};

const CreatePollModal = ({ onCreatePoll, children, isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([
    { text: '', media: null, mentionedUsers: [] },
    { text: '', media: null, mentionedUsers: [] }
  ]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New states for user mentions and video playback
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [videoPlaybackSettings, setVideoPlaybackSettings] = useState({
    playbackMode: 'sequential',
    autoplay: true,
    muted: false,
    loop: false
  });
  
  const { toast } = useToast();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? (open) => {
    if (!open) externalOnClose();
  } : setInternalIsOpen;

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, { text: '', media: null, mentionedUsers: [] }]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  // Handle video playback settings change
  const handleVideoPlaybackSettingsChange = (settings) => {
    setVideoPlaybackSettings(settings);
  };

  // Get videos from options
  const getVideosFromOptions = () => {
    return options
      .filter(option => option.media && option.media.type === 'video')
      .map(option => option.media);
  };

  const handleFileUpload = async (index, file) => {
    try {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen o video",
          variant: "destructive"
        });
        return;
      }

      const base64 = await fileToBase64(file);

      let mediaData = {
        type: isVideo ? 'video' : 'image',
        url: base64,
      };

      // Para videos, crear thumbnail con imagen placeholder más efectiva
      if (isVideo) {
        // Crear un thumbnail con una imagen sólida en lugar de SVG
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Fondo degradado
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1f2937');
        gradient.addColorStop(1, '#111827');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 600);
        
        // Ícono de play
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(160, 250);
        ctx.lineTo(160, 350);
        ctx.lineTo(240, 300);
        ctx.closePath();
        ctx.fill();
        
        // Texto "Video"
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Video', 200, 380);
        
        mediaData.thumbnail = canvas.toDataURL('image/png');
      }

      updateOption(index, 'media', mediaData);

      toast({
        title: "¡Archivo cargado!",
        description: `${isVideo ? 'Video' : 'Imagen'} agregado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el archivo",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Necesitas escribir una pregunta",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Necesitas al menos 2 opciones válidas",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Prepare poll data for API
      const allMentionedUsers = [];
      const processedOptions = validOptions.map(opt => {
        // Collect mentioned users from this option
        if (opt.mentionedUsers) {
          allMentionedUsers.push(...opt.mentionedUsers.map(user => user.id));
        }
        
        return {
          text: opt.text.trim(),
          media_type: opt.media?.type || null,
          media_url: opt.media?.url || null,
          thumbnail_url: opt.media?.type === 'image' ? opt.media?.url : opt.media?.thumbnail_url || null,
          mentioned_users: opt.mentionedUsers ? opt.mentionedUsers.map(user => user.id) : []
        };
      });

      const pollData = {
        title: title.trim(),
        description: null, // No description field in current UI
        options: processedOptions,
        music_id: selectedMusic?.id || null, // Add selected music
        tags: [], // No tags field in current UI
        category: 'general', // Default category
        // All mentioned users from all options
        mentioned_users: [...new Set(allMentionedUsers)], // Remove duplicates
        video_playback_settings: getVideosFromOptions().length > 0 ? videoPlaybackSettings : null
      };

      // Create poll using API
      const newPoll = await pollService.createPoll(pollData);

      toast({
        title: "¡Votación creada!",
        description: "Tu votación ha sido publicada exitosamente",
      });

      // Call parent callback with the new poll
      onCreatePoll(newPoll);

      // Reset form
      setTitle('');
      setOptions([
        { text: '', media: null, mentionedUsers: [] },
        { text: '', media: null, mentionedUsers: [] }
      ]);
      setSelectedMusic(null);
      setShowMusicSelector(false);
      setMentionedUsers([]); // Keep for legacy compatibility
      setVideoPlaybackSettings({
        playbackMode: 'sequential',
        autoplay: true,
        muted: false,
        loop: false
      });
      setIsOpen(false);

    } catch (error) {
      console.error('Error creating poll:', error);
      
      toast({
        title: "Error al crear votación",
        description: error.message || "No se pudo crear la votación. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] max-w-[800px] h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl sm:rounded-2xl">
        <DialogHeader className="border-b border-gray-100 pb-4 sm:pb-8 px-2">
          <DialogTitle className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            Crear Contenido
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-lg mt-2 sm:mt-3 text-gray-600 font-medium">
            Comparte tu creatividad con el mundo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8 py-4 sm:py-8 px-2">
          <div className="space-y-2 sm:space-y-4">
            <Label htmlFor="title" className="text-lg sm:text-xl font-bold text-gray-900">
              ¿Qué quieres preguntar?
            </Label>
            <Textarea
              id="title"
              placeholder="Escribe tu pregunta aquí... Sé creativo y haz que sea interesante para tu audiencia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[100px] sm:min-h-[120px] resize-none border-2 border-gray-200 focus:ring-2 focus:ring-gray-400 focus:border-transparent rounded-2xl text-base sm:text-lg p-4 sm:p-6 bg-gray-50"
            />
          </div>



          {/* Selector de Música Elegante - Responsive */}
          {selectedMusic ? (
            <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 sm:p-6 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                  <img 
                    src={selectedMusic.cover} 
                    alt={selectedMusic.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm sm:text-lg text-gray-900 truncate">{selectedMusic.title}</p>
                  <p className="text-xs sm:text-base text-gray-600 truncate">{selectedMusic.artist}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMusic(null);
                  setShowMusicSelector(false);
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm border border-gray-200 flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-6 sm:h-6" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMusicSelector(!showMusicSelector)}
              className="w-full h-12 sm:h-16 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all rounded-2xl"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-700 rounded-2xl flex items-center justify-center mr-2 sm:mr-4 shadow-sm">
                <Music className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-semibold">Agregar música (opcional)</span>
            </Button>
          )}

          {/* Selector de música expandido */}
          {showMusicSelector && !selectedMusic && (
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <MusicSelector
                onSelectMusic={(music) => {
                  setSelectedMusic(music);
                  setShowMusicSelector(false);
                }}
                selectedMusic={selectedMusic}
                pollTitle={title}
              />
            </div>
          )}

          {/* Opciones con Media - Mobile Optimized */}
          <div className="space-y-4 sm:space-y-8">
            <Label className="text-lg sm:text-xl font-bold text-gray-900">
              Opciones para votar
            </Label>
            {options.map((option, index) => (
              <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 sm:p-8 space-y-4 sm:space-y-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-xl shadow-lg flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <UserMentionInput
                      placeholder={`Descripción para la opción ${index + 1}... Usa @ para mencionar usuarios`}
                      value={option.text}
                      onChange={(newText) => updateOption(index, 'text', newText)}
                      onMentionSelect={(user) => {
                        const currentMentioned = option.mentionedUsers || [];
                        const exists = currentMentioned.find(u => u.id === user.id);
                        if (!exists) {
                          updateOption(index, 'mentionedUsers', [...currentMentioned, user]);
                          toast({
                            title: "Usuario mencionado",
                            description: `@${user.username} será notificado en la opción ${String.fromCharCode(65 + index)}`,
                          });
                        }
                      }}
                      className="border-2 border-gray-200 focus:ring-2 focus:ring-gray-400 focus:border-transparent rounded-2xl min-h-[50px] text-sm sm:text-lg bg-white px-3 sm:px-6 py-2 sm:py-3"
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="w-10 h-10 sm:w-12 sm:h-12 hover:bg-white hover:text-red-500 rounded-2xl border border-gray-200 shadow-sm flex-shrink-0"
                    >
                      <X className="w-4 h-4 sm:w-6 sm:h-6" />
                    </Button>
                  )}
                </div>

                {/* Usuarios mencionados en esta opción */}
                {option.mentionedUsers && option.mentionedUsers.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AtSign className="w-4 h-4 text-purple-600" />
                      <Label className="text-xs font-semibold text-purple-700">
                        Mencionados en opción {String.fromCharCode(65 + index)} ({option.mentionedUsers.length})
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {option.mentionedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-1 bg-white border border-purple-300 rounded-md px-2 py-1 text-xs"
                        >
                          <AtSign className="w-3 h-3 text-purple-600" />
                          <span className="font-medium text-gray-900">@{user.username}</span>
                          {user.is_verified && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedMentioned = option.mentionedUsers.filter(u => u.id !== user.id);
                              updateOption(index, 'mentionedUsers', updatedMentioned);
                            }}
                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Serán notificados cuando se vote por esta opción
                    </p>
                  </div>
                )}

                {/* Media Upload with new PollOptionUpload component */}
                <div className="space-y-4">
                  <PollOptionUpload
                    currentMedia={option.media}
                    onMediaSelect={(media) => updateOption(index, 'media', media)}
                    onMediaRemove={() => updateOption(index, 'media', null)}
                    optionText={option.text}
                    disabled={isCreating}
                  />
                </div>
              </div>
            ))}
            
            {options.length < 4 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full h-12 sm:h-16 border-2 border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl text-sm sm:text-lg font-bold"
              >
                <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-4" />
                Agregar otra opción
              </Button>
            )}
          </div>

          {/* Configuración de reproducción de video */}
          {getVideosFromOptions().length > 0 && (
            <VideoPlaybackSettings 
              videos={getVideosFromOptions()}
              onSettingsChange={handleVideoPlaybackSettingsChange}
              className="mt-6"
            />
          )}
        </form>

        <DialogFooter className="border-t border-gray-100 pt-4 sm:pt-8 px-2 gap-2 sm:gap-4 flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
            className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-2xl border-2 border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-4" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-4" />
                Publicar contenido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollModal;