import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Video, Image as ImageIcon, Upload, RotateCw, Zap, ZapOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const StoryCapturePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = frontal, 'environment' = trasera
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [captureMode, setCaptureMode] = useState('photo'); // 'photo' o 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Iniciar cámara al cargar la página
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Timer para grabación
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      // Detener stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: captureMode === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }

      // Aplicar flash si está habilitado
      if (flashEnabled && stream.getVideoTracks().length > 0) {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: true }]
          });
        }
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Por favor verifica los permisos.",
        variant: "destructive"
      });
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Cambiar entre cámara frontal y trasera
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Toggle flash
  const toggleFlash = async () => {
    const newFlashState = !flashEnabled;
    setFlashEnabled(newFlashState);

    if (streamRef.current && streamRef.current.getVideoTracks().length > 0) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: newFlashState }]
          });
        } catch (error) {
          console.error('Error al activar el flash:', error);
          toast({
            title: "Flash no disponible",
            description: "Tu dispositivo no soporta el flash.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Flash no disponible",
          description: "Tu dispositivo no tiene flash.",
          variant: "destructive"
        });
      }
    }
  };

  // Capturar foto desde la cámara
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      
      setSelectedFile(file);
      setFileType('image');
      setPreviewUrl(previewUrl);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Iniciar grabación de video
  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      // Reiniciar stream con audio para video
      if (captureMode === 'video') {
        await stopCamera();
        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], 'video.webm', { type: 'video/webm' });
        const previewUrl = URL.createObjectURL(blob);
        
        setSelectedFile(file);
        setFileType('video');
        setPreviewUrl(previewUrl);
        stopCamera();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      toast({
        title: "Error de grabación",
        description: "No se pudo iniciar la grabación de video.",
        variant: "destructive"
      });
    }
  };

  // Detener grabación de video
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Manejar captura/grabación según el modo
  const handleCapture = () => {
    if (captureMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // Manejar selección de archivo desde galería
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
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Ir a la página de edición
  const handleNext = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Debes capturar o seleccionar una foto o video primero",
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

  // Volver a captura (descartar preview)
  const handleRetake = () => {
    setSelectedFile(null);
    setFileType(null);
    setPreviewUrl(null);
    setIsRecording(false);
    setRecordingTime(0);
    startCamera();
  };

  // Formatear tiempo de grabación
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
