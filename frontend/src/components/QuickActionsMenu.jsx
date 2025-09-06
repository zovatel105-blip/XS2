import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, X, Plus, User, Settings, Heart } from 'lucide-react';
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
        case 'favorites':
          handleFavorites();
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

  const handleFavorites = () => {
    toast({
      title: "❤️ Mis favoritos...",
      description: "Viendo contenido guardado",
    });
    
    // Navegar a favoritos o usar hash para filtrar
    navigate('/profile#favorites');
    
    if (onActionSelect) {
      onActionSelect('favorites');
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
      position: { x: -5, y: -25 }, // RESTAURADO: posición original superior
    },
    {
      id: 'search',
      icon: Search,
      label: 'Buscar',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      borderColor: 'border-blue-300',
      shadowColor: 'shadow-blue-500/50',
      position: { x: -22, y: -12 }, // MANTENIDO: posición original
    },
    {
      id: 'favorites',
      icon: Heart,
      label: 'Favoritos',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      borderColor: 'border-pink-300',
      shadowColor: 'shadow-pink-500/50',
      position: { x: -5, y: 25 }, // MANTENIDO: posición original
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
      {/* Overlay de fondo */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: -1 }}
        onClick={onClose}
      />

      {/* Centro del menú - Sin logo duplicado */}
      <div className="relative">

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <X size={10} className="text-white" />
        </button>

        {/* Botones de acción radiales */}
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.id;
          const delay = index * 100;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`absolute w-10 h-10 rounded-full ${action.color} ${action.borderColor} border-2 shadow-lg ${action.shadowColor} flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group ${
                isSelected ? 'scale-125 ring-4 ring-white/50' : ''
              }`}
              style={{ 
                left: `${action.position.x}px`,
                top: `${action.position.y}px`,
                transform: isVisible 
                  ? `translate(${action.position.x}px, ${action.position.y}px) scale(${isSelected ? 1.25 : 1})` 
                  : 'translate(0px, 0px) scale(0)',
                transitionDelay: isVisible ? `${delay}ms` : '0ms',
              }}
            >
              <Icon 
                size={16} 
                className={`text-white transition-all duration-200 ${
                  isSelected ? 'scale-125' : 'group-hover:scale-110'
                }`} 
              />
              
              {/* Tooltip */}
              <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded whitespace-nowrap transition-all duration-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {action.label}
              </div>
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

      {/* Instrucciones de uso */}
      <div className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-black/80 text-white text-sm rounded-lg whitespace-nowrap transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        Selecciona una acción rápida
      </div>
    </div>
  );
};

export default QuickActionsMenu;