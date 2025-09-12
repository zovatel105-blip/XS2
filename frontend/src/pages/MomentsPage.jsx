import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Play, Eye, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import storyService from '../services/storyService';
import StoryViewer from '../components/StoryViewer';
import { AnimatePresence } from 'framer-motion';

const MomentsPage = () => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadStories();
  }, [isAuthenticated]);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        toast({
          title: "⚠️ Inicia sesión",
          description: "Necesitas iniciar sesión para ver las historias",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Cargar historias reales desde el backend
      const storiesData = await storyService.getStories(50);
      setStories(storiesData || []);
      
      if (storiesData && storiesData.length > 0) {
        toast({
          title: "📸 Momentos cargados",
          description: `${storiesData.length} historias disponibles`,
        });
      } else {
        toast({
          title: "📭 Sin historias",
          description: "No hay historias disponibles en este momento",
        });
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      toast({
        title: "Error al cargar momentos",
        description: "No se pudieron cargar las historias. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'hace unos minutos';
    if (diffInHours < 24) return `hace ${diffInHours}h`;
    return 'hace más de 24h';
  };

  const handleStoryClick = (storyIndex) => {
    setSelectedStoryIndex(storyIndex);
    setShowStoryViewer(true);
  };

  const handleCloseStory = () => {
    setShowStoryViewer(false);
    setSelectedStoryIndex(null);
  };

  const handleStoryEnd = () => {
    setShowStoryViewer(false);
    setSelectedStoryIndex(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Cargando momentos...</h2>
          <p className="text-white/70 mt-2">Obteniendo las historias más recientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              <Clock size={24} className="text-white" />
              <h1 className="text-xl font-bold text-white">Momentos</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Momentos Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {moments.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={64} className="text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay momentos disponibles</h3>
            <p className="text-white/70">Sigue a más usuarios para ver sus historias aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {moments.map((moment) => (
              <div
                key={moment.id}
                onClick={() => handleMomentClick(moment)}
                className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
              >
                {/* Thumbnail */}
                <img
                  src={moment.thumbnail}
                  alt={`Momento de ${moment.user.username}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
                
                {/* User info */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border-2 overflow-hidden ${
                    moment.isViewed ? 'border-gray-400' : 'border-purple-500'
                  }`}>
                    <img
                      src={moment.user.avatar}
                      alt={moment.user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-2">
                      <Eye size={12} />
                      <span>{moment.views}</span>
                    </div>
                    <span>{moment.duration}</span>
                  </div>
                  <p className="text-white text-xs mt-1 truncate">
                    @{moment.user.username}
                  </p>
                  <p className="text-white/70 text-xs">
                    {formatTimeAgo(moment.createdAt)}
                  </p>
                </div>

                {/* Indicator de no visto */}
                {!moment.isViewed && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full border-2 border-black" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de momento seleccionado */}
      {selectedMoment && (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
          <button
            onClick={handleCloseMoment}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          
          <div className="w-full max-w-sm aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden relative">
            <img
              src={selectedMoment.thumbnail}
              alt={`Momento de ${selectedMoment.user.username}`}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedMoment.user.avatar}
                  alt={selectedMoment.user.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">@{selectedMoment.user.username}</p>
                  <p className="text-sm text-white/70">{formatTimeAgo(selectedMoment.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 hover:scale-110 transition-transform">
                    <Heart size={20} />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center gap-1 hover:scale-110 transition-transform">
                    <MessageCircle size={20} />
                    <span className="text-sm">Comentar</span>
                  </button>
                </div>
                <div className="text-sm text-white/70">
                  {selectedMoment.views} vistas
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentsPage;