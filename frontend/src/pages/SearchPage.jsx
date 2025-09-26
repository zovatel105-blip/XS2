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
import SEARCH_CONFIG from '../config/searchConfig';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [discoveryData, setDiscoveryData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(SEARCH_CONFIG.FILTERS.DEFAULT);
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
    { id: SEARCH_CONFIG.FILTERS.ALL, label: 'Todo', icon: Sparkles, description: 'Buscar en todo' },
    { id: SEARCH_CONFIG.FILTERS.USERS, label: 'Usuarios', icon: User, description: 'Encuentra personas' },
    { id: SEARCH_CONFIG.FILTERS.POSTS, label: 'Posts', icon: PostsIcon, description: 'Descubre contenido' },
    { id: SEARCH_CONFIG.FILTERS.HASHTAGS, label: 'Hashtags', icon: Hash, description: 'Trending topics' },
    { id: SEARCH_CONFIG.FILTERS.SOUNDS, label: 'Sonidos', icon: Music, description: 'Audio popular' },
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
      const response = await searchService.universalSearch(
        query, 
        filter, 
        SEARCH_CONFIG.SORT_OPTIONS.DEFAULT, 
        SEARCH_CONFIG.LIMITS.SEARCH_RESULTS
      );
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
    if (!query || query.length < SEARCH_CONFIG.VALIDATION.MIN_AUTOCOMPLETE_LENGTH) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    if (query.length > SEARCH_CONFIG.VALIDATION.MAX_QUERY_LENGTH) {
      return; // Ignore queries that are too long
    }

    setIsAutocompleteLoading(true);
    try {
      const response = await searchService.getAutocomplete(query, SEARCH_CONFIG.LIMITS.AUTOCOMPLETE_RESULTS);
      setAutocompleteResults(response.suggestions || []);
      setShowAutocomplete(SEARCH_CONFIG.FEATURES.ENABLE_AUTOCOMPLETE);
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
    }, SEARCH_CONFIG.DEBOUNCE.SEARCH_DELAY);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, activeTab]);

  // Debounced autocomplete
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleAutocomplete(searchQuery);
    }, SEARCH_CONFIG.DEBOUNCE.AUTOCOMPLETE_DELAY);

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

      {/* Clean Content Area - TikTok Style */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {!searchQuery.trim() ? (
          <div className="space-y-8">
            {/* Clean Welcome Section */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <Search size={24} className="text-gray-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Descubre contenido increíble
              </h1>
              <p className="text-gray-600 text-base mb-8 max-w-md mx-auto">
                Busca usuarios, videos, sonidos y hashtags populares
              </p>
            </div>
            
            {/* Recent Searches Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Búsquedas recientes</h3>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <div className="w-5 h-5 border-2 border-gray-400 rounded-full relative">
                    <div className="absolute inset-1 border-2 border-gray-400 rounded-full transform rotate-90">
                      <div className="absolute top-0 left-1/2 w-0.5 h-1 bg-gray-400 transform -translate-x-1/2 -translate-y-0.5"></div>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-5 h-5 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span className="text-gray-700 flex-1">búsqueda anterior</span>
                  <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <button className="text-gray-500 text-sm hover:text-gray-700 flex items-center space-x-1">
                <span>Ver más</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>

            {/* You may like Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Te podría gustar</h3>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <div className="w-5 h-5 border-2 border-gray-400 rounded-full relative">
                    <div className="absolute inset-1 border-2 border-gray-400 rounded-full transform rotate-90">
                      <div className="absolute top-0 left-1/2 w-0.5 h-1 bg-gray-400 transform -translate-x-1/2 -translate-y-0.5"></div>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="space-y-2">
                {['contenido viral', 'música trending', 'crear contenido', 'efectos populares'].map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${index < 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-gray-700">{suggestion}</span>
                    {index === 0 && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Búsqueda reciente</span>}
                  </div>
                ))}
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
            <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Buscando...</h3>
            <p className="text-gray-600">Encontrando los mejores resultados</p>
          </div>
        ) : searchResults.length > 0 ? (
          /* Clean Search Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-gray-600">
                  {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchQuery}"
                </p>
              </div>
            </div>
            
            {/* TikTok Style Results Grid */}
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map((result, index) => (
                <div key={`${result.type}-${result.id}-${index}`} className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 group cursor-pointer">
                  <SearchResultItem
                    result={result}
                    onItemClick={handleResultClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          /* Clean No Results */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin resultados</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No encontramos nada para "{searchQuery}". Intenta con otros términos.
            </p>
            
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