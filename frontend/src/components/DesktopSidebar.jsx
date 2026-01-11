import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Users, 
  Radio, 
  Upload, 
  User, 
  MoreHorizontal,
  Heart,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      icon: Home, 
      label: 'Para ti', 
      path: '/feed',
      active: location.pathname === '/feed'
    },
    { 
      icon: Compass, 
      label: 'Explorar', 
      path: '/explore',
      active: location.pathname === '/explore'
    },
    { 
      icon: Users, 
      label: 'Siguiendo', 
      path: '/following',
      active: location.pathname === '/following'
    },
    { 
      icon: Radio, 
      label: 'LIVE', 
      path: '/live',
      active: location.pathname === '/live'
    }
  ];

  const bottomItems = [
    { 
      icon: Upload, 
      label: 'Cargar', 
      path: '/upload'
    },
    { 
      icon: User, 
      label: 'Perfil', 
      path: `/profile/${user?.username}`
    },
    { 
      icon: MessageCircle, 
      label: 'Mensajes', 
      path: '/messages'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-60 lg:h-screen lg:fixed lg:left-0 lg:top-0 lg:bg-white lg:border-r lg:border-gray-200 lg:z-10">
      {/* Logo */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Twyk</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors
                  ${item.active 
                    ? 'bg-pink-50 text-pink-600 border-r-2 border-pink-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${item.active ? 'text-pink-600' : 'text-gray-600'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4 mx-4"></div>

        {/* Bottom Navigation */}
        <nav className="space-y-1 px-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* More Options */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Más</span>
          </button>
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {((user?.displayName || user?.username || 'U') + '').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full text-gray-600 hover:text-gray-900"
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default DesktopSidebar;