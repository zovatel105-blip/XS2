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
        return <User size={16} className="text-blue-500" />;
      case 'hashtag':
        return <Hash size={16} className="text-green-500" />;
      case 'music':
        return <Music size={16} className="text-pink-500" />;
      case 'trending':
        return <TrendingUp size={16} className="text-orange-500" />;
      case 'recent':
        return <Clock size={16} className="text-gray-500" />;
      default:
        return <Search size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${index}`}
          onClick={() => onSuggestionClick(suggestion)}
          className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
            index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            {suggestion.avatar ? (
              <img 
                src={suggestion.avatar} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {getIcon(suggestion.type)}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {suggestion.display || suggestion.text}
              </span>
              {suggestion.type && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {suggestion.type}
                </span>
              )}
            </div>
            
            {suggestion.subtitle && (
              <p className="text-xs text-gray-500 truncate">
                {suggestion.subtitle}
              </p>
            )}
          </div>
          
          {suggestion.count && (
            <div className="flex-shrink-0 ml-2">
              <span className="text-xs text-gray-400">
                {suggestion.count}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {suggestions.length === 0 && (
        <div className="px-4 py-6 text-center text-gray-500">
          <Search size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No se encontraron sugerencias</p>
        </div>
      )}
    </div>
  );
};

export default AutocompleteDropdown;