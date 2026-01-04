import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Image, Play, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import AppConfig from '../config/config';
import uploadService from '../services/uploadService';

const VSCreatePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRefs = useRef([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [questions, setQuestions] = useState([
    {
      id: 1,
      options: [
        { id: 'a', text: '', image: null, imagePreview: null },
        { id: 'b', text: '', image: null, imagePreview: null }
      ]
    }
  ]);

  const addQuestion = () => {
    if (questions.length >= 10) return;
    setQuestions([...questions, {
      id: Date.now(),
      options: [
        { id: 'a', text: '', image: null, imagePreview: null },
        { id: 'b', text: '', image: null, imagePreview: null }
      ]
    }]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateOption = (questionId, optionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(opt => 
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      }
      return q;
    }));
  };

  const handleImageUpload = (questionId, optionId, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateOption(questionId, optionId, 'image', file);
        updateOption(questionId, optionId, 'imagePreview', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isValid = () => {
    return questions.every(q => 
      q.options.every(opt => (opt.text && opt.text.trim()) || opt.imagePreview)
    );
  };

  const handlePublish = async () => {
    if (!isValid() || isPublishing) return;
    
    setIsPublishing(true);
    
    try {
      const backendUrl = AppConfig.BACKEND_URL;
      
      // Preparar datos para el backend
      const vsData = {
        questions: questions.map(q => ({
          options: q.options.map(opt => ({
            id: opt.id,
            text: opt.text || `Opción ${opt.id.toUpperCase()}`,
            image: opt.imagePreview // Base64 image
          }))
        }))
      };
      
      console.log('Enviando VS data:', vsData);
      console.log('Token:', token ? 'presente' : 'ausente');
      console.log('Backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/vs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vsData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create VS experience: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('VS creado exitosamente:', result);
      
      // Navegar al feed para ver la publicación
      navigate('/feed');
      
    } catch (error) {
      console.error('Error publishing VS:', error);
      alert('Error al publicar: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Crear VS</h1>
        <button
          onClick={handlePublish}
          disabled={!isValid() || isPublishing}
          className={cn(
            "px-4 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-2",
            isValid() && !isPublishing
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              : "bg-white/10 text-white/40"
          )}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publicando...</span>
            </>
          ) : (
            <span>Publicar</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.map((question, qIndex) => (
          <div 
            key={question.id}
            className="bg-white/5 rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-sm">Pregunta {qIndex + 1}</span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(question.id)}
                  className="p-2 rounded-full hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {question.options.map((option, oIndex) => (
                <div key={option.id} className="space-y-2">
                  {/* Image Upload Area */}
                  <div 
                    onClick={() => fileInputRefs.current[`${question.id}-${option.id}`]?.click()}
                    className={cn(
                      "aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden",
                      option.imagePreview 
                        ? "border-transparent" 
                        : "border-white/20 hover:border-white/40 flex items-center justify-center"
                    )}
                  >
                    {option.imagePreview ? (
                      <img 
                        src={option.imagePreview} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Image className="w-8 h-8 text-white/40 mx-auto mb-2" />
                        <span className="text-white/40 text-xs">Añadir imagen</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => fileInputRefs.current[`${question.id}-${option.id}`] = el}
                    onChange={(e) => handleImageUpload(question.id, option.id, e)}
                    className="hidden"
                  />
                  
                  {/* Text Input */}
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                    placeholder={`Opción ${oIndex === 0 ? 'A' : 'B'}`}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        {questions.length < 10 && (
          <button
            onClick={addQuestion}
            className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-2 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Añadir pregunta</span>
          </button>
        )}
      </div>

      {/* Preview Button */}
      {isValid() && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handlePublish}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold"
          >
            <Play className="w-5 h-5" />
            <span>Iniciar experiencia VS</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VSCreatePage;
