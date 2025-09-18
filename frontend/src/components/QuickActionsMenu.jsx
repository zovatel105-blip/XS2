import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, Plus, User, Settings, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const QuickActionsMenu = ({ isVisible, onClose, onActionSelect }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleActionClick = (actionType) => {
    setSelectedAction(actionType);
    
    setTimeout(() => {
      switch (actionType) {
        case 'search':
          handleSearch();
          break;
        case 'moments':
          handleMoments();
          break;
        case 'moments':
          handleMoments();
          break;

        case 'settings':
          handleSettings();
          break;
        case 'live':
          handleLive();
          break;
        default:
          break;
      }
      onClose();
      setSelectedAction(null);
    }, 200);
  };

  const handleSearch = () => {
    toast({
      title: "🔍 Abriendo búsqueda...",
      description: "Navegando a la página de búsqueda",
    });
    
    navigate('/search');
    
    if (onActionSelect) {
      onActionSelect('search');
    }
  };

  const handleMoments = () => {
    toast({
      title: "📸 Abriendo momentos...",
      description: "Navegando a historias de momentos",
    });
    
    navigate('/moments');
    
    if (onActionSelect) {
      onActionSelect('moments');
    }
  };

  const handleCreate = () => {
    toast({
      title: "✨ Crear publicación...",
      description: "Abriendo formulario de creación",
    });
    
    // Aquí se puede disparar el modal de crear publicación
    // O navegar a una página dedicada
    const createEvent = new CustomEvent('openCreateModal');
    window.dispatchEvent(createEvent);
    
    if (onActionSelect) {
      onActionSelect('create');
    }
  };

  const handleProfile = () => {
    toast({
      title: "👤 Mi perfil...",
      description: "Navegando a tu perfil",
    });
    
    navigate('/profile');
    
    if (onActionSelect) {
      onActionSelect('profile');
    }
  };

  const handleSettings = () => {
    toast({
      title: "⚙️ Configuraciones...",
      description: "Abriendo ajustes",
    });
    
    navigate('/settings');
    
    if (onActionSelect) {
      onActionSelect('settings');
    }
  };

  const handleLive = () => {
    toast({
      title: "🔴 En vivo",
      description: "Explorando contenido en vivo",
    });
    
    // Navegar a live o usar hash para filtrar
    navigate('/live');
    
    if (onActionSelect) {
      onActionSelect('live');
    }
  };

  if (!isVisible && !isAnimating) return null;

  const actions = [
    {
      id: 'moments',
      icon: Clock,
      label: 'Historias',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      borderColor: 'border-orange-300',
      shadowColor: 'shadow-orange-500/50',
      position: { x: -28, y: 8 }, // SUBIDO: 8px más arriba
    },
    {
      id: 'search',
      icon: Search,
      label: 'Buscar',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      borderColor: 'border-blue-300',
      shadowColor: 'shadow-blue-500/50',
      position: { x: -35, y: -13 }, // SUBIDO: 8px más arriba
    },
    {
      id: 'live',
      icon: Video,
      label: 'LIVE',
      color: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      borderColor: 'border-red-300',
      shadowColor: 'shadow-red-500/50',
      position: { x: -8, y: 16 }, // AJUSTADO: manteniendo distancia proporcional
    }
  ];

  return (
    <div 
      ref={menuRef}
      className="fixed top-4 right-4 z-[10001]"
      style={{ 
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10001,
      }}
    >


      {/* Centro del menú - Sin logo duplicado */}
      <div className="relative">



        {/* Botones de acción radiales */}
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.id;
          const isLiveAction = action.id === 'live';
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`
                group absolute rounded-full shadow-lg transition-all duration-500 transform
                ${action.color} ${action.borderColor} ${action.shadowColor}
                ${isSelected ? 'scale-125 ring-4 ring-white/50' : 'hover:scale-110 active:scale-95'}
                flex flex-col items-center justify-center border-2
                ${isLiveAction ? 'w-12 h-12' : 'w-10 h-10'}
              `}
              style={{
                left: `${action.position.x}px`,
                top: `${action.position.y}px`,
                transform: isVisible 
                  ? `translate(${action.position.x}px, ${action.position.y}px) scale(${isSelected ? 1.25 : 1})` 
                  : 'translate(0px, 0px) scale(0)',
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
              }}
            >
              <Icon 
                size={16} 
                className={`text-white transition-all duration-200 ${
                  isSelected ? 'scale-125' : 'group-hover:scale-110'
                } ${isLiveAction ? 'mb-0.5' : ''}`} 
              />
              
              {/* Texto LIVE dentro del botón */}
              {isLiveAction && (
                <span 
                  className="text-[8px] font-bold text-white leading-none"
                  style={{
                    textShadow: '0 1px 1px rgba(0,0,0,0.8)'
                  }}
                >
                  LIVE
                </span>
              )}
            </button>
          );
        })}

        {/* Líneas de conexión animadas */}
        <svg 
          className="absolute top-5 left-5 w-0 h-0 pointer-events-none"
          style={{ zIndex: -1 }}
        >
          {actions.map((action, index) => (
            <line
              key={`line-${action.id}`}
              x1="0"
              y1="0"
              x2={action.position.x}
              y2={action.position.y}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeDasharray="4,4"
              className={`transition-all duration-500 ${
                isVisible ? 'opacity-60' : 'opacity-0'
              }`}
              style={{
                transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
              }}
            />
          ))}
        </svg>
      </div>


    </div>
  );
};

export default QuickActionsMenu;