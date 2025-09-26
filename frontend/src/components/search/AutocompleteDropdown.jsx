import React from 'react';
import { Search, User, Hash, Music, TrendingUp, Clock } from 'lucide-react';

const AutocompleteDropdown = ({ 
  suggestions, 
  isVisible, 
  onSuggestionClick, 
  selectedIndex,
  onClose 
}) => {
  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'user':
        return <User size={16} className="text-gray-600" />;
      case 'hashtag':
        return <Hash size={16} className="text-gray-600" />;
      case 'music':
        return <Music size={16} className="text-gray-600" />;
      case 'trending':
        return <TrendingUp size={16} className="text-green-600" />;
      case 'recent':
        return <Clock size={16} className="text-gray-500" />;
      default:
        return <Search size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl mt-2 max-h-80 overflow-y-auto z-50 shadow-cyan-500/10">
      {/* Neon top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${index}`}
          onClick={() => onSuggestionClick(suggestion)}
          className={`group flex items-center px-4 py-3 hover:bg-slate-800/60 cursor-pointer transition-all duration-200 relative ${
            index === selectedIndex ? 'bg-slate-800/80 border-l-2 border-cyan-500 shadow-lg shadow-cyan-500/10' : ''
          }`}
        >
          {index === selectedIndex && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
          )}
          
          <div className="flex-shrink-0 mr-3 relative">
            {suggestion.avatar ? (
              <div className="relative">
                <img 
                  src={suggestion.avatar} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-600/50"
                />
                {/* Glow effect for avatars */}
                <div className="absolute inset-0 w-8 h-8 rounded-full ring-1 ring-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-600/50 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                {getIcon(suggestion.type)}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                {suggestion.display || suggestion.text}
              </span>
              {suggestion.type && (
                <span className="text-xs text-slate-400 bg-slate-800/60 border border-slate-600/30 px-2 py-0.5 rounded-full flex-shrink-0 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                  {suggestion.type}
                </span>
              )}
            </div>
            
            {suggestion.subtitle && (
              <p className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">
                {suggestion.subtitle}
              </p>
            )}
          </div>
          
          {suggestion.count && (
            <div className="flex-shrink-0 ml-2 relative z-10">
              <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                {suggestion.count}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {suggestions.length === 0 && (
        <div className="px-4 py-6 text-center text-slate-400">
          <Search size={24} className="mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No se encontraron sugerencias en el cyber-espacio</p>
        </div>
      )}
    </div>
  );
};

export default AutocompleteDropdown;