import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-lg z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          <NavigationItem
            to="/feed"
            icon={Home}
            label="Seguidos"
          />
          
          <NavigationItem
            to="/explore"
            icon={Compass}
            label="Explorar"
          />

          {/* Create Content Button - Navigate to creation page */}
          <NavigationItem
            to="/create"
            icon={Plus}
            label="Crear"
          />

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