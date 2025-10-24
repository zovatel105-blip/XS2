import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Video, Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const StoryCapturePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = file.type.startsWith('image') ? 'image' : 'video';
    setFileType(type);
    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Ir a la página de edición
  const handleNext = () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debes seleccionar una foto o video primero",
        variant: "destructive"
      });
      return;
    }

    // Guardar en sessionStorage para pasar a la siguiente página
    sessionStorage.setItem('storyMediaType', fileType);
    sessionStorage.setItem('storyMediaPreview', previewUrl);
    
    // Navegar a página de edición
    navigate('/story-edit');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Header con botones transparentes sobre la imagen */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4">
        <div className="flex items-center justify-between">
          {/* Botón cerrar */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <X className="w-7 h-7 text-white" />
          </button>

          {/* Botones configuración (solo visual) */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </button>
            <button className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v6m0 6v6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Área central - preview o prompt de captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!previewUrl ? (
        <div className="absolute inset-0 flex items-center justify-center pt-20 pb-32">
          {/* Estado inicial - sin contenido */}
          <div className="w-full h-full flex flex-col items-center justify-center px-8">
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8">
              <Camera className="w-16 h-16 text-white/60" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 text-center">
              Captura tu momento
            </h3>
            <p className="text-white/70 text-center text-sm mb-8">
              Sube una foto o video para comenzar tu historia
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-3"
              >
                <ImageIcon className="w-5 h-5" />
                Subir desde galería
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview del contenido seleccionado - fullscreen con bordes curvos arriba y abajo */
        <div className="absolute top-0 left-0 right-0 bottom-40">
          <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden">
            {fileType === 'image' ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                controls
              />
            )}
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">
        {previewUrl ? (
          /* Barra inferior con imagen cargada - descripción y botones */
          <div className="px-4 pb-5 space-y-3 bg-black">
            {/* Input de descripción */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Añade una descripción..."
                className="w-full bg-transparent text-white text-sm placeholder-white/50 px-0 py-2 border-b border-white/20 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón "Tu historia" */}
              <button
                onClick={handleNext}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white text-xs">📸</span>
                  </div>
                </div>
                <span>Tu historia</span>
              </button>

              {/* Botón siguiente (flecha) */}
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-all"
              >
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Barra inferior sin imagen - controles de captura */
          <div className="flex items-center justify-between px-4 pb-6 bg-black">
            {/* Modo seleccionado */}
            <div className="flex items-center gap-6">
              <button className="text-white/50 text-sm font-medium">
                TÁNER
              </button>
              <button className="text-white text-base font-bold">
                HISTORIA
              </button>
              <button className="text-white/50 text-sm font-medium">
                REEL
              </button>
            </div>

            {/* Botón de captura */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-white"></div>
            </button>

            {/* Preview de historias anteriores */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-xs">📸</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCapturePage;
