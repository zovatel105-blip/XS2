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
  const handleNext = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debes seleccionar una foto o video primero",
        variant: "destructive"
      });
      return;
    }

    // Convertir archivo a base64 para pasar a la siguiente página
    const reader = new FileReader();
    reader.onloadend = () => {
      sessionStorage.setItem('storyMediaType', fileType);
      sessionStorage.setItem('storyMediaPreview', previewUrl);
      sessionStorage.setItem('storyMediaFile', reader.result);
      sessionStorage.setItem('storyFileName', selectedFile.name);
      
      // Navegar a página de edición
      navigate('/story-edit');
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Header con botones transparentes sobre la imagen */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-4">
        <div className="flex items-start justify-between">
          {/* Botón cerrar a la izquierda */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Botones en vertical a la derecha */}
          <div className="flex flex-col gap-3">
            <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all">
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
        /* Estado inicial - sin botón en el centro */
        <div className="absolute inset-0">
        </div>
      ) : (
        /* Preview del contenido seleccionado - fullscreen con bordes curvos arriba y abajo */
        <div className="absolute top-0 left-0 right-0 bottom-32">
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
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8">
        {previewUrl ? (
          /* Barra inferior con imagen - botón blanco centrado */
          <div className="flex items-center justify-center">
            <button
              onClick={handleNext}
              className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 transition-all shadow-2xl"
            >
            </button>
          </div>
        ) : (
          /* Barra inferior sin imagen - botón galería a la izquierda y botón captura al centro */
          <div className="flex items-center justify-center px-4">
            {/* Botón de galería a la izquierda con icono */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-8 w-16 h-16 rounded-full bg-white hover:bg-gray-100 transition-all shadow-2xl flex items-center justify-center"
            >
              <ImageIcon className="w-8 h-8 text-black" />
            </button>
            
            {/* Botón circular de captura en el centro */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCapturePage;
