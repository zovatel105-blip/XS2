import React, { useState, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Plus, Bell, User, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const NavigationItem = ({ to, icon: Icon, label, isActive }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[60px]",
          isActive
            ? "text-blue-600 bg-blue-50 transform scale-105"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon 
            className={cn(
              "w-6 h-6 transition-all duration-300",
              isActive && "fill-current"
            )} 
          />
          <span className="text-xs font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
};

const BottomNavigation = ({ onCreatePoll }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [currentMode, setCurrentMode] = useState('feed'); // 'feed', 'following', 'explore'
  const longPressTimer = useRef(null);

  // Detectar el modo actual basado en la ruta
  useEffect(() => {
    if (location.pathname === '/feed') {
      setCurrentMode('feed');
    } else if (location.pathname === '/following') {
      setCurrentMode('following');
    } else if (location.pathname === '/explore') {
      setCurrentMode('explore');
    }
  }, [location.pathname]);

  // Long press handlers for home button
  const handleTouchStart = useCallback(() => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      // Vibration feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Ciclo: feed → following → explore → feed
      let nextMode = 'feed';
      let nextPath = '/feed';
      
      if (currentMode === 'feed') {
        nextMode = 'following';
        nextPath = '/following';
      } else if (currentMode === 'following') {
        nextMode = 'explore';
        nextPath = '/explore';
      } else if (currentMode === 'explore') {
        nextMode = 'feed';
        nextPath = '/feed';
      }
      
      setCurrentMode(nextMode);
      navigate(nextPath);
      setIsLongPressing(false);
    }, 800); // 800ms for long press
  }, [navigate, currentMode]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    handleTouchStart();
  }, [handleTouchStart]);

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  const handleMouseLeave = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  // Función para obtener el color y texto basado en el modo actual
  const getModeStyles = () => {
    switch (currentMode) {
      case 'following':
        return {
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          iconColor: 'text-purple-600',
          label: 'Following'
        };
      case 'explore':
        return {
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-600',
          iconColor: 'text-orange-600',
          label: 'Explorar'
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          iconColor: 'text-blue-600',
          label: 'Seguidos'
        };
    }
  };

  const modeStyles = getModeStyles();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {/* Home Button with Long Press */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <NavLink
              to="/feed"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[60px]",
                  isActive
                    ? "text-blue-600 bg-blue-50 transform scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                  isLongPressing && "transform scale-110 bg-purple-50 text-purple-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Home 
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      (isActive || isLongPressing) && "fill-current",
                      isLongPressing && "text-purple-600"
                    )} 
                  />
                  <span className={cn(
                    "text-xs font-medium",
                    isLongPressing ? "text-purple-600" : ""
                  )}>
                    {isLongPressing ? "Following" : "Seguidos"}
                  </span>
                </>
              )}
            </NavLink>
            
            {/* Long press indicator */}
            {isLongPressing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse">
                <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping"></div>
              </div>
            )}
          </div>
          
          <NavigationItem
            to="/explore"
            icon={Compass}
            label="Explorar"
          />

          {/* Create Content Button - Navigate to creation page */}
          <NavLink
            to="/create"
            className="flex flex-col items-center gap-1 px-3 py-2 transition-all duration-300 min-w-[60px] group"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-blue-700 to-purple-700"
                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                )}>
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-blue-700" : "text-blue-600"
                )}>Crear</span>
              </>
            )}
          </NavLink>

          <NavigationItem
            to="/messages"
            icon={MessageCircle}
            label="Mensajes"
          />

          <NavigationItem
            to="/profile"
            icon={User}
            label="Perfil"
          />
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;