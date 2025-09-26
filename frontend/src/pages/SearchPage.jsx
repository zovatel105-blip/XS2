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
    { id: 'all', label: 'Todo', icon: Sparkles, color: 'from-purple-500 to-pink-500', description: 'Buscar en todo' },
    { id: 'users', label: 'Usuarios', icon: User, color: 'from-blue-500 to-cyan-500', description: 'Encuentra personas' },
    { id: 'posts', label: 'Posts', icon: PostsIcon, color: 'from-green-500 to-emerald-500', description: 'Descubre contenido' },
    { id: 'hashtags', label: 'Hashtags', icon: Hash, color: 'from-orange-500 to-red-500', description: 'Trending topics' },
    { id: 'sounds', label: 'Sonidos', icon: Music, color: 'from-indigo-500 to-purple-500', description: 'Audio popular' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Logo fijo SIEMPRE VISIBLE - Estilo oscuro */}
      <div 
        className="fixed top-4 right-4 z-[9999] flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/30 shadow-2xl hover:scale-110 hover:border-cyan-400/50 transition-all duration-300"
        style={{ 
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
        }}
      >
        <LogoWithQuickActions size={32} />
      </div>

      {/* Futuristic Header with Neon Effects */}
      <div className="bg-black/30 backdrop-blur-2xl border-b border-cyan-500/20 sticky top-0 z-50 shadow-2xl relative">
        {/* Neon glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-3 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 flex-shrink-0 group hover:scale-110 active:scale-95 border border-slate-700/50 hover:border-cyan-500/30"
            >
              <ArrowLeft size={22} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>
            
            <div className="flex-1 relative">
              {/* Futuristic Search Input */}
              <div className="relative group">
                {/* Animated border glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                
                <div className="relative bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-600/50 group-focus-within:border-cyan-500/50 transition-all duration-300">
                  {/* Search icon with glow effect */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    <Search size={20} className="text-slate-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
                    <Search size={20} className="absolute inset-0 text-cyan-400 opacity-0 group-focus-within:opacity-50 blur-sm transition-opacity duration-300" />
                  </div>
                  
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-400 z-10 p-1 rounded-full hover:bg-red-500/10 transition-all duration-200 group/clear"
                    >
                      <X size={18} />
                      <X size={18} className="absolute inset-0 text-red-400 opacity-0 group-hover/clear:opacity-50 blur-sm transition-opacity duration-200" />
                    </button>
                  )}
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="🔍 Buscar en el universo digital..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-12 pr-12 py-4 sm:py-5 bg-transparent text-white placeholder-slate-400 border-0 focus:ring-0 focus:outline-none text-sm sm:text-base font-medium tracking-wide"
                    autoFocus
                  />
                  
                  {/* Typing indicator */}
                  {searchQuery && (
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
              
              {isAutocompleteLoading && (
                <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
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
          </div>
        </div>
      </div>

      {/* Cyberpunk-style Tabs */}
      {hasSearched && (
        <div className="bg-black/40 backdrop-blur-md border-b border-cyan-500/10 shadow-xl relative">
          {/* Circuit pattern background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            {/* Mobile Layout */}
            <div className="block lg:hidden py-4">
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-fit relative overflow-hidden border ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/20`
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                        </>
                      )}
                      <Icon size={16} className={`relative z-10 transition-all duration-300 ${activeTab === tab.id ? 'drop-shadow-glow' : ''}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-center py-6">
              <div className="flex space-x-4 bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border border-slate-700/50">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group flex items-center space-x-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-xl shadow-cyan-500/20 scale-105 border border-cyan-500/30`
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-300 hover:scale-102 border border-transparent hover:border-slate-600/30'
                      }`}
                    >
                      {activeTab === tab.id && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                        </>
                      )}
                      <Icon size={18} className={`relative z-10 group-hover:scale-110 transition-transform ${activeTab === tab.id ? 'drop-shadow-glow' : ''}`} />
                      <div className="relative z-10">
                        <span className="block">{tab.label}</span>
                        <span className="text-xs opacity-70 block">{tab.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Content Area */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {!searchQuery.trim() ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-xl">
                <Search size={32} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Descubre lo <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">increíble</span>
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Explora contenido trending, usuarios populares y los hashtags del momento
              </p>
            </div>
            
            <DiscoverySection
              trendingContent={discoveryData.trending_posts || []}
              suggestedUsers={discoveryData.suggested_users || []}
              trendingHashtags={discoveryData.trending_hashtags || []}
            />
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-xl animate-pulse">
              <Search size={24} className="text-white animate-ping" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Buscando...</h3>
            <p className="text-gray-600">Encontrando los mejores resultados para ti</p>
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          /* Enhanced Search Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resultados de búsqueda</h2>
                <p className="text-gray-600 mt-1">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchQuery}"
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filtrar por:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${tabs.find(t => t.id === activeTab)?.color} text-white`}>
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 overflow-hidden shadow-xl">
              {searchResults.map((result, index) => (
                <div key={`${result.type}-${result.id}-${index}`} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100/50 last:border-b-0">
                  <SearchResultItem
                    result={result}
                    onItemClick={handleResultClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          /* Enhanced No Results */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No encontramos nada</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No pudimos encontrar resultados para "{searchQuery}". Intenta con otros términos o explora el contenido trending.
            </p>
            
            {/* Show discovery content even when no results */}
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
      `}</style>
    </div>
  );
};

export default SearchPage;