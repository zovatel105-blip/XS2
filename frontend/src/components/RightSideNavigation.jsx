import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Swords, Plus, MessageCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';


const RightSideNavigation = ({ onCreatePoll }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-50"
         style={{ right: 'max(1rem, env(safe-area-inset-right))' }}>
      
      {/* Home/Inicio */}
      <button
        onClick={() => navigate('/feed')}
        className={cn(
          "rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10",
          location.pathname === '/feed' 
            ? "bg-blue-500 hover:bg-blue-600 w-5 h-12 shadow-xl"
            : "bg-white/80 hover:bg-white hover:scale-110 w-5 h-12 shadow-lg",
          "flex items-center justify-center"
        )}
        title="Inicio"
      >
        <Home className={cn(
          "w-4 h-4",
          location.pathname === '/feed' ? "text-white" : "text-gray-700"
        )} />
      </button>

      {/* Battle Live */}
      <button
        onClick={() => navigate('/explore')}
        className={cn(
          "rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10",
          location.pathname === '/explore'
            ? "bg-blue-500 hover:bg-blue-600 w-4 h-10 shadow-xl"
            : "bg-white/60 hover:bg-white hover:scale-110 w-4 h-10 shadow-lg",
          "flex items-center justify-center"
        )}
        title="Battle Live"
      >
        <Swords className={cn(
          "w-3 h-3",
          location.pathname === '/explore' ? "text-white" : "text-gray-600"
        )} />
      </button>

      {/* Subir/Crear */}
      <CreatePollModal onCreatePoll={onCreatePoll || (() => console.log('Create poll'))}>
        <button
          className={cn(
            "rounded-full transition-all duration-300 backdrop-blur-sm border border-pink-300/30",
            "bg-gradient-to-b from-pink-400 to-purple-500 hover:from-pink-300 hover:to-purple-400 hover:scale-110 w-5 h-12 shadow-xl ring-2 ring-pink-300/50 flex items-center justify-center"
          )}
          title="Crear"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </CreatePollModal>

      {/* Mensajes */}
      <button
        onClick={() => navigate('/messages')}
        className={cn(
          "rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10",
          location.pathname === '/messages'
            ? "bg-blue-500 hover:bg-blue-600 w-4 h-10 shadow-xl"
            : "bg-white/60 hover:bg-white hover:scale-110 w-4 h-10 shadow-lg",
          "flex items-center justify-center"
        )}
        title="Mensajes"
      >
        <MessageCircle className={cn(
          "w-3 h-3",
          location.pathname === '/messages' ? "text-white" : "text-gray-600"
        )} />
      </button>

      {/* Perfil */}
      <button
        onClick={() => navigate('/profile')}
        className={cn(
          "rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10",
          location.pathname === '/profile'
            ? "bg-blue-500 hover:bg-blue-600 w-4 h-10 shadow-xl"
            : "bg-white/60 hover:bg-white hover:scale-110 w-4 h-10 shadow-lg",
          "flex items-center justify-center"
        )}
        title="Perfil"
      >
        <User className={cn(
          "w-3 h-3",
          location.pathname === '/profile' ? "text-white" : "text-gray-600"
        )} />
      </button>
    </div>
  );
};

export default RightSideNavigation;