import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const VotersModal = ({ isOpen, onClose, pollId }) => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [views, setViews] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && pollId) {
      loadVoters();
    }
  }, [isOpen, pollId]);

  const loadVoters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/polls/${pollId}/voters`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVoters(data.voters || []);
        setTotalVotes(data.total_votes || 0);
        setViews(data.views || 0);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los votantes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading voters:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los votantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        // Update local state
        setVoters(voters.map(voter => 
          voter.id === userId 
            ? { ...voter, is_following: !isFollowing }
            : voter
        ));
        
        toast({
          title: isFollowing ? "Dejaste de seguir" : "Siguiendo",
          description: isFollowing 
            ? "Ya no sigues a este usuario" 
            : "Ahora sigues a este usuario"
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la acción",
        variant: "destructive"
      });
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            {/* Handle bar */}
            <div className="w-full py-2 flex justify-center">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Title and close button */}
            <div className="px-6 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Me gusta y reproducciones
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats section */}
            <div className="px-6 pb-4 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-pink-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {totalVotes.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Votos</p>
              </div>
              
              <div className="w-px h-12 bg-gray-300" />
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {views.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Reproducciones</p>
              </div>
            </div>
          </div>

          {/* Voters list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando votantes...</p>
              </div>
            ) : voters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">
                  Aún no hay votos en esta publicación
                </p>
              </div>
            ) : (
              <div className="px-6 py-2">
                {voters.map((voter) => (
                  <div
                    key={voter.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        className="w-12 h-12 cursor-pointer ring-2 ring-gray-100"
                        onClick={() => {
                          onClose();
                          navigate(`/profile/${voter.username}`);
                        }}
                      >
                        <AvatarImage src={voter.avatar_url} alt={voter.display_name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                          {voter.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          onClose();
                          navigate(`/profile/${voter.username}`);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {voter.display_name}
                          </p>
                          {voter.is_verified && (
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          @{voter.username}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleFollowToggle(voter.id, voter.is_following)}
                      className={`ml-3 px-6 py-1.5 rounded-full font-semibold text-sm transition-all ${
                        voter.is_following
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {voter.is_following ? 'Siguiendo' : 'Seguir'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VotersModal;
