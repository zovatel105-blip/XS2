import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Image as ImageIcon, Type, Upload, Send, Loader2,
  Palette, AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import storyService from '../services/storyService';

const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const [step, setStep] = useState('choose'); // choose, create, upload
  const [storyType, setStoryType] = useState(''); // image, text, camera
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#667eea');
  const [textAlign, setTextAlign] = useState('center');
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false });
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { toast } = useToast();

  const backgroundColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b',
    '#fa709a', '#feb47b', '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f'
  ];

  const resetModal = () => {
    setStep('choose');
    setStoryType('');
    setContent('');
    setSelectedFile(null);
    setPreviewUrl('');
    setBackgroundColor('#667eea');
    setTextAlign('center');
    setTextStyle({ bold: false, italic: false });
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 10MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStep('create');
    }
  };

  const handleCreateStory = async () => {
    if (!content && !selectedFile) {
      toast({
        title: "Contenido requerido",
        description: "Agrega texto o selecciona una imagen",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let storyData;

      if (storyType === 'image' && selectedFile) {
        // Convert file to base64 for API
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(selectedFile);
        });

        storyData = {
          story_type: 'IMAGE',
          text_content: content || null,
          content_url: base64,
          background_color: backgroundColor,
          text_color: '#FFFFFF',
          font_style: `${textAlign}-${textStyle.bold ? 'bold' : 'normal'}-${textStyle.italic ? 'italic' : 'normal'}`,
          duration: 15
        };
      } else if (storyType === 'text') {
        storyData = {
          story_type: 'TEXT',
          text_content: content,
          content_url: null,
          background_color: backgroundColor,
          text_color: '#FFFFFF',
          font_style: `${textAlign}-${textStyle.bold ? 'bold' : 'normal'}-${textStyle.italic ? 'italic' : 'normal'}`,
          duration: 15
        };
      }

      const newStory = await storyService.createStory(storyData);
      
      toast({
        title: "Historia creada",
        description: "Tu historia se ha publicado exitosamente",
        variant: "default"
      });

      if (onStoryCreated) {
        onStoryCreated(newStory);
      }

      handleClose();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: "Error al crear historia",
        description: error.message || "No se pudo crear la historia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Crear Historia</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="hover:bg-gray-100 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'choose' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Qué tipo de historia quieres crear?</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      setStoryType('camera');
                      cameraInputRef.current?.click();
                    }}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Camera className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Tomar Foto</h4>
                      <p className="text-sm text-gray-600">Usa la cámara para crear tu historia</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setStoryType('image');
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Seleccionar Imagen</h4>
                      <p className="text-sm text-gray-600">Elige una foto de tu galería</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setStoryType('text');
                      setStep('create');
                    }}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Type className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">Historia de Texto</h4>
                      <p className="text-sm text-gray-600">Crea una historia solo con texto</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 'create' && (
              <div className="space-y-4">
                {/* Preview Area */}
                <div 
                  className="relative w-full h-64 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: storyType === 'text' ? backgroundColor : 'transparent'
                  }}
                >
                  {storyType === 'image' && previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {content && (
                    <div 
                      className={`absolute inset-0 flex items-center justify-center p-4 ${
                        storyType === 'image' ? 'bg-black/30' : ''
                      }`}
                    >
                      <p 
                        className={`text-white text-lg ${
                          textAlign === 'center' ? 'text-center' : 
                          textAlign === 'left' ? 'text-left' : 'text-right'
                        } ${textStyle.bold ? 'font-bold' : ''} ${
                          textStyle.italic ? 'italic' : ''
                        }`}
                      >
                        {content}
                      </p>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <div className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escribe algo para tu historia..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">{content.length}/500</p>
                </div>

                {/* Style Controls */}
                <div className="space-y-3">
                  {/* Background Colors (for text stories or overlay) */}
                  {storyType === 'text' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Color de fondo:</label>
                      <div className="flex gap-2 flex-wrap">
                        {backgroundColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setBackgroundColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              backgroundColor === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Alignment */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Alineación:</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'left', icon: AlignLeft },
                        { value: 'center', icon: AlignCenter },
                        { value: 'right', icon: AlignRight }
                      ].map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setTextAlign(value)}
                          className={`p-2 rounded-lg border ${
                            textAlign === value 
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Style */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Estilo:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTextStyle(prev => ({ ...prev, bold: !prev.bold }))}
                        className={`p-2 rounded-lg border ${
                          textStyle.bold 
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTextStyle(prev => ({ ...prev, italic: !prev.italic }))}
                        className={`p-2 rounded-lg border ${
                          textStyle.italic 
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep('choose')}
                    className="flex-1"
                    disabled={loading}
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handleCreateStory}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publicar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateStoryModal;