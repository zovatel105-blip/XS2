import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Maximize2, 
  Type, 
  Smile, 
  Sticker, 
  Music, 
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  X
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const StoryCreationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Estados principales
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' o 'video'
  const [mediaPreview, setMediaPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]);
  const [stickers, setStickers] = useState([]);
  
  // Estados de modales
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);

  // Manejo de archivos
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image') ? 'image' : 'video';
    setMediaType(fileType);
    setMediaFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreview(null);
  };

  // Publicar historia
  const handlePublishStory = () => {
    if (!mediaFile) {
      toast({
        title: "Error",
        description: "Debes añadir una foto o video para tu historia",
        variant: "destructive"
      });
      return;
    }

    // Por ahora solo mostramos confirmación (frontend only)
    toast({
      title: "¡Historia publicada!",
      description: "Tu historia se ha publicado exitosamente",
    });

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-orange-400 via-pink-500 to-red-500 overflow-hidden">
      {/* Header con botones circulares */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          {/* Botón volver */}
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          {/* Botones superiores derechos */}
          <div className="flex items-center gap-2">
            {/* Expandir */}
            <button
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>

            {/* Texto "Aa" */}
            <button
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <Type className="w-5 h-5 text-white" />
            </button>

            {/* Emoji */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <Smile className="w-5 h-5 text-white" />
            </button>

            {/* Stickers */}
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <Sticker className="w-5 h-5 text-white" />
            </button>

            {/* Música */}
            <button
              onClick={() => setShowMusicSelector(!showMusicSelector)}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <Music className="w-5 h-5 text-white" />
            </button>

            {/* Más opciones */}
            <button
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de contenido central */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-48">
        {!mediaPreview ? (
          /* Estado inicial - sin contenido */
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-white/30">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Añade contenido
                </h3>
                <p className="text-white/80 text-sm">
                  Sube una foto o video para comenzar tu historia
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Video
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Vista previa del contenido */
          <div className="relative w-full max-w-md h-full">
            {/* Botón para eliminar media */}
            <button
              onClick={handleRemoveMedia}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Preview de imagen o video */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black/20 backdrop-blur-sm border-2 border-white/30">
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={mediaPreview}
                  className="w-full h-full object-contain"
                  controls
                />
              )}

              {/* Overlays de texto (si los hay) */}
              {textOverlays.map((text, index) => (
                <div
                  key={index}
                  className="absolute text-white font-bold text-2xl"
                  style={{
                    top: `${text.y}%`,
                    left: `${text.x}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {text.content}
                </div>
              ))}

              {/* Stickers (si los hay) */}
              {stickers.map((sticker, index) => (
                <div
                  key={index}
                  className="absolute text-4xl"
                  style={{
                    top: `${sticker.y}%`,
                    left: `${sticker.x}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Área inferior - Descripción y botón publicar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 px-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Input de descripción */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30">
            <input
              type="text"
              placeholder="Añade una descripción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent text-white placeholder-white/60 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            {/* Botón "Tu historia" */}
            <button
              onClick={handlePublishStory}
              disabled={!mediaFile}
              className="flex-1 bg-white hover:bg-gray-100 disabled:bg-white/40 disabled:cursor-not-allowed text-gray-900 font-bold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">▶</span>
              </div>
              Tu historia
            </button>
          </div>

          {/* Información de música seleccionada */}
          {selectedMusic && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 flex items-center gap-3 border border-white/30">
              <Music className="w-5 h-5 text-white" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {selectedMusic.name}
                </p>
                <p className="text-white/60 text-xs truncate">
                  {selectedMusic.artist}
                </p>
              </div>
              <button
                onClick={() => setSelectedMusic(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales y pickers */}
      {showTextEditor && (
        <TextEditorModal
          onClose={() => setShowTextEditor(false)}
          onAdd={(text) => {
            setTextOverlays([...textOverlays, { content: text, x: 50, y: 50 }]);
            setShowTextEditor(false);
          }}
        />
      )}

      {showEmojiPicker && (
        <EmojiPickerModal
          onClose={() => setShowEmojiPicker(false)}
          onSelect={(emoji) => {
            setStickers([...stickers, { emoji, x: 50, y: 50 }]);
            setShowEmojiPicker(false);
          }}
        />
      )}

      {showStickerPicker && (
        <StickerPickerModal
          onClose={() => setShowStickerPicker(false)}
          onSelect={(sticker) => {
            setStickers([...stickers, { emoji: sticker, x: 50, y: 50 }]);
            setShowStickerPicker(false);
          }}
        />
      )}

      {showMusicSelector && (
        <MusicSelectorModal
          onClose={() => setShowMusicSelector(false)}
          onSelect={(music) => {
            setSelectedMusic(music);
            setShowMusicSelector(false);
          }}
        />
      )}
    </div>
  );
};

// Modal de editor de texto
const TextEditorModal = ({ onClose, onAdd }) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#ffffff');

  const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Añadir texto</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu texto aquí..."
          className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 resize-none"
          style={{ color }}
        />

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Color del texto</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full border-2 ${color === c ? 'border-purple-500 scale-110' : 'border-gray-200'} transition-all`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => text.trim() && onAdd(text)}
          disabled={!text.trim()}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 rounded-full transition-all"
        >
          Añadir texto
        </button>
      </div>
    </div>
  );
};

// Modal de emojis
const EmojiPickerModal = ({ onClose, onSelect }) => {
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🔥', '💯', '❤️', '💕', '💪', '👏', '🙌', '✨', '⭐', '🎉', '🎊', '🎈'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Emojis</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onSelect(emoji)}
              className="text-4xl hover:scale-125 transition-transform p-2"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de stickers
const StickerPickerModal = ({ onClose, onSelect }) => {
  const stickers = ['🎸', '🎵', '🎤', '🎧', '🎬', '📸', '🌟', '💫', '✨', '🌈', '🦄', '🐶', '🐱', '🍕', '🍔', '☕', '🎮', '⚽', '🏀', '🎯'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Stickers</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {stickers.map((sticker, index) => (
            <button
              key={index}
              onClick={() => onSelect(sticker)}
              className="text-4xl hover:scale-125 transition-transform p-2"
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de selector de música
const MusicSelectorModal = ({ onClose, onSelect }) => {
  const musicTracks = [
    { id: 1, name: 'Summer Vibes', artist: 'DJ Cool' },
    { id: 2, name: 'Dance Night', artist: 'The Beats' },
    { id: 3, name: 'Chill Mode', artist: 'Relaxer' },
    { id: 4, name: 'Party Time', artist: 'DJ Fire' },
    { id: 5, name: 'Love Song', artist: 'Romance' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4">
          <h3 className="text-xl font-bold text-gray-900">Añadir música</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2">
          {musicTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelect(track)}
              className="w-full text-left p-4 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{track.name}</p>
                <p className="text-sm text-gray-500 truncate">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryCreationPage;
