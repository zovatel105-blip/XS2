import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Hash, Music, ArrowLeft, Loader, X, TrendingUp, Star, Filter, Sparkles, Grid3X3, Users, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import searchService from '../services/searchService';
import SearchResultItem from '../components/search/SearchResultItem';
import AutocompleteDropdown from '../components/search/AutocompleteDropdown';
import DiscoverySection from '../components/search/DiscoverySection';
import PostsIcon from '../components/icons/PostsIcon';
import LogoWithQuickActions from '../components/LogoWithQuickActions';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [discoveryData, setDiscoveryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all';
    
    setSearchQuery(query);
    setActiveTab(filter);
    
    if (query) {
      handleSearch(query, filter);
    } else {
      loadDiscoveryContent();
    }
  }, []);

  const tabs = [
    { id: 'all', label: 'Todo', icon: Sparkles, description: 'Buscar en todo' },
    { id: 'users', label: 'Usuarios', icon: User, description: 'Encuentra personas' },
    { id: 'posts', label: 'Posts', icon: PostsIcon, description: 'Descubre contenido' },
    { id: 'hashtags', label: 'Hashtags', icon: Hash, description: 'Trending topics' },
    { id: 'sounds', label: 'Sonidos', icon: Music, description: 'Audio popular' },
  ];

  const updateURLParams = (query, filter) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter !== 'all') params.set('filter', filter);
    setSearchParams(params);
  };

  const loadDiscoveryContent = async () => {
    try {
      const suggestions = await searchService.getSearchSuggestions();
      setDiscoveryData(suggestions);
    } catch (error) {
      console.error('Error loading discovery content:', error);
    }
  };

  const handleSearch = async (query, filter = activeTab) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      loadDiscoveryContent();
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await searchService.universalSearch(query, filter, 'popularity', 50);
      setSearchResults(response.results || []);
      
      // Also load discovery content for empty states
      if (!response.results || response.results.length === 0) {
        await loadDiscoveryContent();
      }
      
    } catch (error) {
      console.error('Error searching:', error);
      toast({
        title: "Error en la búsqueda",
        description: "No se pudo realizar la búsqueda. Intenta de nuevo.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutocomplete = async (query) => {
    if (!query || query.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsAutocompleteLoading(true);
    try {
      const response = await searchService.getAutocomplete(query);
      setAutocompleteResults(response.suggestions || []);
      setShowAutocomplete(true);
    } catch (error) {
      console.error('Error in autocomplete:', error);
      setAutocompleteResults([]);
    } finally {
      setIsAutocompleteLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery, activeTab);
      updateURLParams(searchQuery, activeTab);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activeTab]);

  // Debounced autocomplete
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleAutocomplete(searchQuery);
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedSuggestionIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowAutocomplete(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      setShowAutocomplete(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text || suggestion.display);
    setShowAutocomplete(false);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showAutocomplete || autocompleteResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < autocompleteResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(autocompleteResults[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    loadDiscoveryContent();
    searchInputRef.current?.focus();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleResultClick = (result) => {
    console.log('Result clicked:', result);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Logo fijo SIEMPRE VISIBLE - Estilo TikTok */}
      <div 
        className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 hover:scale-110 transition-transform duration-300"
        style={{ 
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
        }}
      >
        <LogoWithQuickActions size={32} />
      </div>

      {/* TikTok Style Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors duration-200"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            
            <div className="flex-1 relative">
              {/* TikTok Style Search Input */}
              <div className="relative">
                <div className="relative bg-gray-100 rounded-lg border-0 focus-within:bg-gray-50 transition-colors duration-200">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors duration-200 group"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  )}
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-10 py-3 bg-transparent text-gray-900 placeholder-gray-500 border-0 focus:ring-0 focus:outline-none text-base"
                    autoFocus
                  />
                </div>
              </div>
              
              {isAutocompleteLoading && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
                </div>
              )}
              
              <AutocompleteDropdown
                suggestions={autocompleteResults}
                isVisible={showAutocomplete}
                onSuggestionClick={handleSuggestionClick}
                selectedIndex={selectedSuggestionIndex}
                onClose={() => setShowAutocomplete(false)}
              />
            </div>

            {/* More options (three dots) */}
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors duration-200">
              <div className="flex flex-col space-y-0.5">
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* TikTok Style Tabs */}
      {hasSearched && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            {/* Mobile and Desktop unified layout */}
            <div className="flex space-x-6 overflow-x-auto scrollbar-hide py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-1 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 relative ${
                      activeTab === tab.id
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Futuristic Content Area */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 relative z-10">
        {!searchQuery.trim() ? (
          <div className="space-y-8">
            {/* Cyberpunk Welcome Section */}
            <div className="text-center py-12">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
                {/* Glowing rings */}
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-ping delay-75"></div>
                <div className="absolute inset-4 rounded-full border-2 border-pink-500/30 animate-ping delay-150"></div>
                
                {/* Central icon */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <Search size={28} className="text-white drop-shadow-lg" />
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Explora el{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                  metaverso
                </span>
              </h1>
              <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                Descubre contenido épico, creadores innovadores y tendencias del futuro digital
              </p>
              
              {/* Floating particles effect */}
              <div className="relative">
                <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="absolute top-4 right-8 w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                <div className="absolute -top-2 right-0 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-500"></div>
              </div>
            </div>
            
            <DiscoverySection
              trendingContent={discoveryData.trending_posts || []}
              suggestedUsers={discoveryData.suggested_users || []}
              trendingHashtags={discoveryData.trending_hashtags || []}
            />
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-8">
              {/* Animated scanning rings */}
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-pink-500 border-l-transparent animate-spin-reverse"></div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <Search size={20} className="text-white animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">Escaneando el cyber-espacio...</h3>
            <p className="text-slate-400 text-lg mb-8">Procesando datos cuánticos para encontrar los mejores resultados</p>
            
            <div className="flex justify-center space-x-2 mb-6">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-500/50"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-75 shadow-lg shadow-purple-500/50"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-150 shadow-lg shadow-pink-500/50"></div>
            </div>
            
            {/* Progress bar */}
            <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse"></div>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          /* Neon Search Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Datos encontrados</h2>
                <p className="text-slate-400 mt-1">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "
                  <span className="text-cyan-400 font-medium">{searchQuery}</span>"
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-500">Filtro activo:</span>
                <div className={`px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/20`}>
                  {tabs.find(t => t.id === activeTab)?.label}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
              {searchResults.map((result, index) => (
                <div key={`${result.type}-${result.id}-${index}`} className="hover:bg-slate-800/50 transition-all duration-300 border-b border-slate-700/30 last:border-b-0 relative group">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <SearchResultItem
                    result={result}
                    onItemClick={handleResultClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          /* Cyberpunk No Results */
          <div className="text-center py-20">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
              {/* Error/glitch effect */}
              <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border-2 border-slate-600/30"></div>
              
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
                <Search size={28} className="text-slate-500" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4">404 • Datos no encontrados</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
              El archivo "<span className="text-red-400 font-mono">{searchQuery}</span>" no existe en nuestra base de datos. 
              Intenta con otros parámetros de búsqueda.
            </p>
            
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm mb-12">
              <Zap size={16} className="text-yellow-400" />
              <span>Sugerencia: Explora el contenido trending más abajo</span>
            </div>
            
            {/* Show discovery content */}
            <div className="mt-12">
              <DiscoverySection
                trendingContent={discoveryData.trending_posts || []}
                suggestedUsers={discoveryData.suggested_users || []}
                trendingHashtags={discoveryData.trending_hashtags || []}
              />
            </div>
          </div>
        ) : null}
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6));
        }
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;