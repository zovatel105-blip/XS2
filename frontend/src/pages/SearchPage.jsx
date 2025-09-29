import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Hash, Music, ArrowLeft, Loader, X, TrendingUp, Star, Filter, Sparkles, Grid3X3, Users, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import searchService from '../services/searchService';
import SearchResultsGrid from '../components/search/SearchResultsGrid';
import AutocompleteDropdown from '../components/search/AutocompleteDropdown';

import PostsIcon from '../components/icons/PostsIcon';
import LogoWithQuickActions from '../components/LogoWithQuickActions';
import SEARCH_CONFIG from '../config/searchConfig';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);

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



  const handleSearch = async (query, filter = activeTab) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
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
    if (searchQuery.length >= SEARCH_CONFIG.VALIDATION.MIN_AUTOCOMPLETE_LENGTH) {
      setShowAutocomplete(SEARCH_CONFIG.FEATURES.ENABLE_AUTOCOMPLETE);
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


      {/* TikTok Style Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-4">
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
                  
                  {/* Microphone Icon */}
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors duration-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-500">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line stroke="currentColor" strokeWidth="2" strokeLinecap="round" x1="12" y1="19" x2="12" y2="23"/>
                      <line stroke="currentColor" strokeWidth="2" strokeLinecap="round" x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
                  
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors duration-200 group"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  )}
                  
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={SEARCH_CONFIG.UI.SEARCH_PLACEHOLDER}
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-16 py-3 bg-transparent text-gray-900 placeholder-gray-500 border-0 focus:ring-0 focus:outline-none text-base"
                    autoFocus
                    maxLength={SEARCH_CONFIG.VALIDATION.MAX_QUERY_LENGTH}
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
          <div className="w-full px-4">
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

      {/* Clean Content Area - TikTok Style - Full Width */}
      <div className="w-full">
        {/* Content Sections - Always visible - Mobile Optimized */}
        <div className="flex-1 px-0 sm:px-2 py-6 space-y-6 sm:space-y-8 w-full">
          {/* Recent Searches Section - Mobile Optimized */}
          <div className="space-y-3 sm:space-y-4 px-3 sm:px-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Búsquedas recientes</h3>
              <button className="text-sm text-gray-500 hover:text-gray-700">Ver más</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="w-5 h-5 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <span className="text-gray-700 flex-1">@usuario123</span>
                <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="w-5 h-5 text-gray-400">
                  <Music size={16} />
                </div>
                <span className="text-gray-700 flex-1">música viral</span>
                <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="w-5 h-5 text-gray-400">
                  <Hash size={16} />
                </div>
                <span className="text-gray-700 flex-1">#trending</span>
                <button className="w-4 h-4 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Stories Section - Horizontal Carousel matching reference */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 px-4">Stories</h3>
            
            {/* Horizontal Scrolling Carousel */}
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 px-4">
              {[
                { 
                  name: 'Pink', 
                  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600',
                  decoration: '🍩'
                },
                { 
                  name: 'Jessie', 
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-800',
                  decoration: '💃'
                },
                { 
                  name: 'Alex', 
                  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
                  decoration: '🍩'
                },
                { 
                  name: 'Maria', 
                  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
                  decoration: '🎨'
                },
                { 
                  name: 'Carlos', 
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
                  decoration: '🎵'
                },
                { 
                  name: 'Ana', 
                  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
                  decoration: '🌟'
                },
                { 
                  name: 'Luis', 
                  avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
                  background: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700',
                  decoration: '🎮'
                }
              ].map((story, index) => (
                <div key={index} className="flex-shrink-0 cursor-pointer group relative">
                  {/* Story Card - Carousel format matching reference */}
                  <div 
                    className={`relative rounded-2xl overflow-hidden shadow-xl group-hover:scale-[1.02] transition-all duration-300 ${story.background} flex items-center justify-center`}
                    style={{
                      width: '140px',
                      height: '200px'
                    }}
                  >
                    {/* Background pattern overlay */}
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    {/* Decorative content in center */}
                    <div className="text-5xl opacity-80 drop-shadow-lg">
                      {story.decoration}
                    </div>
                    
                    {/* Bottom gradient for avatar area */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    
                    {/* User avatar container */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="relative mb-1.5">
                        <div className="w-11 h-11 rounded-full bg-white p-0.5">
                          <img 
                            src={story.avatar}
                            alt={story.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                        {/* Red plus icon for first story (matching reference) */}
                        {index === 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold leading-none">+</span>
                          </div>
                        )}
                      </div>
                      
                      {/* User name */}
                      <p className="text-white text-sm font-semibold drop-shadow-lg text-center leading-tight">{story.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* You may like Section - Mobile Optimized Carousel */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 px-3 sm:px-0">You may like</h3>
            
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide pb-2 w-full pl-3 sm:pl-0">
              {[
                { 
                  title: 'Baile viral', 
                  views: '27.8M', 
                  image: 'bg-gradient-to-br from-pink-500 to-purple-600',
                  emoji: '💃'
                },
                { 
                  title: 'Recetas fáciles', 
                  views: '15.2M', 
                  image: 'bg-gradient-to-br from-green-500 to-teal-600',
                  emoji: '👩‍🍳'
                },
                { 
                  title: 'Música trending', 
                  views: '45.1M', 
                  image: 'bg-gradient-to-br from-purple-500 to-pink-600',
                  emoji: '🎵'
                },
                { 
                  title: 'Arte digital', 
                  views: '8.9M', 
                  image: 'bg-gradient-to-br from-orange-500 to-red-600',
                  emoji: '🎨'
                },
                { 
                  title: 'Gaming', 
                  views: '19.3M', 
                  image: 'bg-gradient-to-br from-blue-500 to-cyan-600',
                  emoji: '🎮'
                },
                { 
                  title: 'Viajes', 
                  views: '12.7M', 
                  image: 'bg-gradient-to-br from-yellow-500 to-orange-600',
                  emoji: '✈️'
                }
              ].map((content, index) => (
                <div key={index} className="flex-shrink-0 cursor-pointer group">
                  <div 
                    className={`${content.image} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 relative overflow-hidden`}
                    style={{
                      width: 'calc((100vw - 84px) / 2.8)', // Mobile responsive width
                      height: 'calc(((100vw - 84px) / 2.8) * 1.77)', // Maintain aspect ratio
                      minWidth: '100px',
                      maxWidth: '129px',
                      minHeight: '177px',
                      maxHeight: '230px'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <span className="relative z-10 drop-shadow-lg text-2xl sm:text-4xl">{content.emoji}</span>
                    <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/60 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                      {content.views}
                    </div>
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                      <div className="w-4 sm:w-5 h-4 sm:h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 sm:mt-2 text-center leading-tight truncate" style={{maxWidth: 'calc((100vw - 84px) / 2.8)', minWidth: '100px', maxWidth: '129px'}}>{content.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{SEARCH_CONFIG.UI.LOADING_MESSAGE}</h3>
            <p className="text-gray-600">{SEARCH_CONFIG.UI.LOADING_SUBTITLE}</p>
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
            <SearchResultsGrid 
              results={searchResults} 
              onItemClick={handleResultClick}
            />
          </div>
        ) : hasSearched ? (
          /* Clean No Results */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{SEARCH_CONFIG.UI.NO_RESULTS_TITLE}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No encontramos nada para "{searchQuery}". Intenta con otros términos.
            </p>

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