import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Hash, Music, ArrowLeft, Loader, X, TrendingUp, Star, Filter, Sparkles, Grid3X3, Users, Zap, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import searchService from '../services/searchService';
import storyService from '../services/storyService';
import SearchResultsGrid from '../components/search/SearchResultsGrid';
import AutocompleteDropdown from '../components/search/AutocompleteDropdown';
import TikTokScrollView from '../components/TikTokScrollView';

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
  
  // New states for real data
  const [recentSearches, setRecentSearches] = useState([]);
  const [stories, setStories] = useState([]);
  const [recommendedContent, setRecommendedContent] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    recentSearches: false,
    stories: false,
    recommendations: false
  });
  
  // TikTokScrollView states
  const [showTikTokView, setShowTikTokView] = useState(false);
  const [tikTokViewPosts, setTikTokViewPosts] = useState([]);
  const [currentTikTokIndex, setCurrentTikTokIndex] = useState(0);
  
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params and load real data
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all';
    
    setSearchQuery(query);
    setActiveTab(filter);
    
    if (query) {
      handleSearch(query, filter);
    }

    // Load real data on component mount
    loadRecentSearches();
    loadStories();
    loadRecommendedContent();
  }, []);

  // Load real recent searches
  const loadRecentSearches = async () => {
    if (!isAuthenticated) return;
    
    setLoadingStates(prev => ({ ...prev, recentSearches: true }));
    try {
      const response = await searchService.getRecentSearches(10);
      setRecentSearches(response.recent_searches || []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
      // Keep empty array if error
    } finally {
      setLoadingStates(prev => ({ ...prev, recentSearches: false }));
    }
  };

  // Load real stories
  const loadStories = async () => {
    if (!isAuthenticated) return;
    
    setLoadingStates(prev => ({ ...prev, stories: true }));
    try {
      const response = await storyService.getStories(20);
      setStories(response.stories || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      // Keep empty array if error
    } finally {
      setLoadingStates(prev => ({ ...prev, stories: false }));
    }
  };

  // Load recommended content  
  const loadRecommendedContent = async () => {
    if (!isAuthenticated) return;
    
    setLoadingStates(prev => ({ ...prev, recommendations: true }));
    try {
      const response = await searchService.getRecommendedContent(12);
      setRecommendedContent(response.recommendations || []);
    } catch (error) {
      console.error('Error loading recommended content:', error);
      // Keep empty array if error
    } finally {
      setLoadingStates(prev => ({ ...prev, recommendations: false }));
    }
  };

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
      
      // Save search to recent searches (only for authenticated users)
      if (isAuthenticated && query.trim().length > 0) {
        try {
          await searchService.saveRecentSearch(query.trim(), filter);
          // Optionally refresh recent searches to show the new one
          setTimeout(() => loadRecentSearches(), 500);
        } catch (error) {
          console.error('Error saving recent search:', error);
          // Fail silently for recent searches
        }
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

  const handleResultClick = async (result) => {
    console.log('Result clicked:', result);
    console.log('All search results:', searchResults);
    
    // Handle different result types
    if (result.type === 'post') {
      // Get the complete poll data from backend
      try {
        setIsLoading(true);
        
        // Get all post IDs from search results
        const postIds = searchResults.filter(r => r.type === 'post').map(p => p.id);
        const clickedIndex = postIds.findIndex(id => id === result.id);
        
        // Fetch complete poll data for all posts
        const completePolls = [];
        for (const postId of postIds) {
          try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/polls/${postId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const pollData = await response.json();
              console.log('Fetched poll data:', pollData);
              completePolls.push(pollData);
            } else {
              console.warn(`Failed to fetch poll ${postId}:`, response.status);
              const errorText = await response.text();
              console.warn(`Error response:`, errorText);
            }
          } catch (error) {
            console.error(`Error fetching poll ${postId}:`, error);
          }
        }
        
        console.log('Complete polls fetched:', completePolls.length);
        
        if (completePolls.length > 0) {
          console.log('Opening TikTokScrollView with polls:', completePolls);
          setTikTokViewPosts(completePolls);
          setCurrentTikTokIndex(clickedIndex >= 0 ? clickedIndex : 0);
          setShowTikTokView(true);
        } else {
          console.error('No complete polls fetched. Post IDs were:', postIds);
          toast({
            title: "Error",
            description: "No se pudieron cargar las publicaciones completas.",
            variant: "destructive",
          });
        }
        
      } catch (error) {
        console.error('Error loading complete poll data:', error);
        toast({
          title: "Error",
          description: "Error al cargar la publicación.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (result.type === 'user') {
      navigate(`/profile/${result.username}`);
    } else if (result.type === 'hashtag') {
      navigate(`/search?q=${encodeURIComponent(result.hashtag)}&filter=hashtags`);
    } else if (result.type === 'sound') {
      navigate(`/audio/${result.id}`);
    }
  };

  // TikTokScrollView functions - defined early to avoid hoisting issues
  const handleCloseTikTokView = () => {
    setShowTikTokView(false);
    setTikTokViewPosts([]);
    setCurrentTikTokIndex(0);
  };

  const handleTikTokVote = useCallback(async (pollId, optionIndex) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ option_index: optionIndex })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the poll in the list
        setTikTokViewPosts(prev => prev.map(poll => 
          poll.id === pollId ? { ...poll, ...result } : poll
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar tu voto.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleTikTokLike = useCallback(async (pollId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/polls/${pollId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Update the poll in the list
        setTikTokViewPosts(prev => prev.map(poll => 
          poll.id === pollId ? { ...poll, isLiked: result.liked, likesCount: result.likes_count } : poll
        ));
      }
    } catch (error) {
      console.error('Error liking poll:', error);
      toast({
        title: "Error",
        description: "No se pudo dar like.",
        variant: "destructive",
      });
    }
  };

  const handleTikTokShare = async (pollId) => {
    try {
      // Simple share functionality
      if (navigator.share) {
        await navigator.share({
          title: 'VotaTok - Poll',
          text: 'Mira este poll en VotaTok',
          url: `${window.location.origin}/poll/${pollId}`
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
        toast({
          title: "Enlace copiado",
          description: "El enlace se copió al portapapeles.",
        });
      }
    } catch (error) {
      console.error('Error sharing poll:', error);
      toast({
        title: "Error",
        description: "No se pudo compartir el poll.",
        variant: "destructive",
      });
    }
  };

  const handleTikTokComment = (pollId) => {
    // For now, just log - comment modal would be handled by TikTokScrollView
    console.log('Opening comments for poll:', pollId);
  };

  const handleTikTokSave = async (pollId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/polls/${pollId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: result.saved ? "Poll guardado" : "Poll removido",
          description: result.saved ? "Se guardó en tu colección." : "Se removió de tu colección.",
        });
      }
    } catch (error) {
      console.error('Error saving poll:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el poll.",
        variant: "destructive",
      });
    }
  };

  const handleTikTokCreatePoll = () => {
    // Navigate to create poll page
    navigate('/create');
  };

  const handleTikTokUpdatePoll = (pollId, updates) => {
    // Update poll in the list
    setTikTokViewPosts(prev => prev.map(poll => 
      poll.id === pollId ? { ...poll, ...updates } : poll
    ));
  };

  const handleTikTokDeletePoll = (pollId) => {
    // Remove poll from the list
    setTikTokViewPosts(prev => prev.filter(poll => poll.id !== pollId));
  };

  // Handle recent search click
  const handleRecentSearchClick = async (recentSearch) => {
    setSearchQuery(recentSearch.query);
    setActiveTab(recentSearch.search_type || 'all');
    await handleSearch(recentSearch.query, recentSearch.search_type || 'all');
  };

  // Handle delete recent search
  const handleDeleteRecentSearch = async (searchId, event) => {
    event.stopPropagation(); // Prevent triggering the search
    try {
      await searchService.deleteRecentSearch(searchId);
      setRecentSearches(prev => prev.filter(search => search.id !== searchId));
      toast({
        title: "Búsqueda eliminada",
        description: "La búsqueda ha sido eliminada del historial.",
      });
    } catch (error) {
      console.error('Error deleting recent search:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la búsqueda.",
        variant: "destructive",
      });
    }
  };

  // Handle story click
  const handleStoryClick = (story) => {
    // Navigate to story view or open story modal
    console.log('Story clicked:', story);
    // TODO: Implement story viewing functionality
  };

  // Handle recommended content click
  const handleRecommendedContentClick = (content) => {
    // Navigate to content or perform search
    if (content.type === 'hashtag') {
      setSearchQuery(content.hashtag);
      setActiveTab('hashtags');
      handleSearch(content.hashtag, 'hashtags');
    } else if (content.type === 'user') {
      navigate(`/profile/${content.username}`);
    } else if (content.type === 'poll') {
      navigate(`/poll/${content.id}`);
    }
  };

  // Get icon for search type
  const getSearchTypeIcon = (searchType) => {
    switch (searchType) {
      case 'users': return User;
      case 'hashtags': return Hash;
      case 'sounds': return Music;
      case 'posts': return PostsIcon;
      default: return Search;
    }
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
        {/* Content Sections - Only show when NOT searching */}
        {!hasSearched && (
          <div className="flex-1 px-0 sm:px-2 py-6 space-y-6 sm:space-y-8 w-full">
            {/* Recent Searches Section - Real Data */}
            {isAuthenticated && (
            <div className="space-y-3 sm:space-y-4 px-3 sm:px-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Búsquedas recientes</h3>
                {recentSearches.length > 0 && (
                  <button 
                    onClick={loadRecentSearches}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Actualizar
                  </button>
                )}
              </div>
              
              {loadingStates.recentSearches ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((recentSearch) => {
                    const IconComponent = getSearchTypeIcon(recentSearch.search_type);
                    return (
                      <div 
                        key={recentSearch.id}
                        onClick={() => handleRecentSearchClick(recentSearch)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                      >
                        <div className="w-5 h-5 text-gray-400">
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-700 truncate block">{recentSearch.query}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(recentSearch.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteRecentSearch(recentSearch.id, e)}
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Clock size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay búsquedas recientes</p>
                </div>
              )}
            </div>
          )}

          {/* Stories Section - Real Data */}
          {isAuthenticated && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 px-4">Stories</h3>
              
              {loadingStates.stories ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : stories.length > 0 ? (
                /* Horizontal Scrolling Carousel with Real Data */
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 px-4">
                  {stories.map((story, index) => {
                    // Generate gradient colors based on story content or user
                    const gradients = [
                      'bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600',
                      'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-800',
                      'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
                      'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
                      'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
                      'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
                      'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700'
                    ];
                    
                    const emojis = ['🎵', '💃', '🎨', '🌟', '🎮', '📸', '✨'];
                    
                    return (
                      <div 
                        key={story.id} 
                        onClick={() => handleStoryClick(story)}
                        className="flex-shrink-0 cursor-pointer group relative"
                      >
                        {/* Story Card - Small size carousel format */}
                        <div 
                          className={`relative rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-all duration-300 ${gradients[index % gradients.length]} flex items-center justify-center`}
                          style={{
                            width: '120px',
                            height: '160px'
                          }}
                        >
                          {/* Background image if available */}
                          {story.thumbnail_url && (
                            <img 
                              src={story.thumbnail_url}
                              alt={story.user?.display_name || 'Story'}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Background pattern overlay */}
                          <div className="absolute inset-0 bg-black/20"></div>
                          
                          {/* Decorative content in center (if no image) */}
                          {!story.thumbnail_url && (
                            <div className="text-4xl opacity-80 drop-shadow-lg">
                              {emojis[index % emojis.length]}
                            </div>
                          )}
                          
                          {/* Bottom gradient for avatar area */}
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                          
                          {/* Story status indicator */}
                          {!story.viewed && (
                            <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          
                          {/* User avatar container */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                            <div className="relative mb-1">
                              <div className="w-9 h-9 rounded-full bg-white p-0.5">
                                <img 
                                  src={story.user?.avatar_url || '/default-avatar.png'}
                                  alt={story.user?.display_name || 'User'}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              {/* Red plus icon for add story (first item if it's user's story) */}
                              {index === 0 && story.is_own_story && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                                  <span className="text-white text-xs font-bold leading-none">+</span>
                                </div>
                              )}
                            </div>
                            
                            {/* User name */}
                            <p className="text-white text-xs font-semibold drop-shadow-lg text-center leading-tight max-w-[100px] truncate">
                              {story.user?.display_name || story.user?.username || 'Usuario'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 px-4">
                  <div className="text-3xl mb-2">📖</div>
                  <p className="text-sm">No hay stories disponibles</p>
                  <p className="text-xs text-gray-400 mt-1">Sigue a más usuarios para ver sus stories</p>
                </div>
              )}
            </div>
          )}

          {/* You may like Section - Real Data */}
          {isAuthenticated && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 px-3 sm:px-0">You may like</h3>
              
              {loadingStates.recommendations ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : recommendedContent.length > 0 ? (
                <div className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide pb-2 w-full pl-3 sm:pl-0">
                  {recommendedContent.map((content, index) => {
                    // Dynamic gradient colors
                    const gradients = [
                      'bg-gradient-to-br from-pink-500 to-purple-600',
                      'bg-gradient-to-br from-green-500 to-teal-600',
                      'bg-gradient-to-br from-purple-500 to-pink-600',
                      'bg-gradient-to-br from-orange-500 to-red-600',
                      'bg-gradient-to-br from-blue-500 to-cyan-600',
                      'bg-gradient-to-br from-yellow-500 to-orange-600',
                      'bg-gradient-to-br from-indigo-500 to-purple-600',
                      'bg-gradient-to-br from-teal-500 to-green-600'
                    ];

                    // Get appropriate emoji based on content type
                    const getContentEmoji = (content) => {
                      if (content.hashtag && content.hashtag.includes('baile')) return '💃';
                      if (content.hashtag && content.hashtag.includes('música')) return '🎵';
                      if (content.hashtag && content.hashtag.includes('arte')) return '🎨';
                      if (content.hashtag && content.hashtag.includes('gaming')) return '🎮';
                      if (content.hashtag && content.hashtag.includes('viaje')) return '✈️';
                      if (content.hashtag && content.hashtag.includes('comida')) return '🍕';
                      if (content.type === 'user') return '👤';
                      if (content.type === 'hashtag') return '#️⃣';
                      if (content.type === 'poll') return '📊';
                      return ['🌟', '✨', '💫', '🎯', '🔥', '⭐'][index % 6];
                    };

                    // Format view count or engagement metrics
                    const formatViews = (num) => {
                      if (!num) return '0';
                      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                      return num.toString();
                    };

                    return (
                      <div 
                        key={content.id || index} 
                        onClick={() => handleRecommendedContentClick(content)}
                        className="flex-shrink-0 cursor-pointer group"
                      >
                        <div 
                          className={`${gradients[index % gradients.length]} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 relative overflow-hidden`}
                          style={{
                            width: 'calc((100vw - 84px) / 2.8)', // Mobile responsive width
                            height: 'calc(((100vw - 84px) / 2.8) * 1.77)', // Maintain aspect ratio
                            minWidth: '100px',
                            maxWidth: '129px',
                            minHeight: '177px',
                            maxHeight: '230px'
                          }}
                        >
                          {/* Background image if available */}
                          {content.thumbnail_url && (
                            <img 
                              src={content.thumbnail_url}
                              alt={content.title || content.hashtag}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          
                          <div className="absolute inset-0 bg-black/10"></div>
                          <span className="relative z-10 drop-shadow-lg text-2xl sm:text-4xl">
                            {getContentEmoji(content)}
                          </span>
                          
                          {/* View count or engagement metrics */}
                          <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-black/60 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                            {formatViews(content.engagement_count || content.view_count || content.total_votes || Math.floor(Math.random() * 50000))}
                          </div>
                          
                          {/* Trending indicator */}
                          <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                            <div className="w-4 sm:w-5 h-4 sm:h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content title */}
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1 sm:mt-2 text-center leading-tight truncate" 
                           style={{maxWidth: 'calc((100vw - 84px) / 2.8)', minWidth: '100px', maxWidth: '129px'}}>
                          {content.title || content.hashtag || content.username || 'Contenido trending'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 px-3">
                  <div className="text-2xl mb-2">🎯</div>
                  <p className="text-sm">No hay recomendaciones disponibles</p>
                  <p className="text-xs text-gray-400 mt-1">Interactúa más para obtener mejores sugerencias</p>
                </div>
              )}
            </div>
          )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{SEARCH_CONFIG.UI.LOADING_MESSAGE}</h3>
            <p className="text-gray-600">{SEARCH_CONFIG.UI.LOADING_SUBTITLE}</p>
          </div>
        ) : searchResults.length > 0 ? (
          /* Clean Search Results */
          <div className="space-y-4 px-4 py-6">
            <div className="flex items-center justify-between">
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

      {/* TikTokScrollView for search results with close button */}
      {showTikTokView && tikTokViewPosts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Close button */}
          <button
            onClick={handleCloseTikTokView}
            className="fixed top-4 right-4 z-[60] bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm transition-all duration-200"
          >
            <X size={20} />
          </button>
          
          {/* Back to search text */}
          <button
            onClick={handleCloseTikTokView}
            className="fixed top-4 left-4 z-[60] bg-black/50 hover:bg-black/70 text-white text-sm px-3 py-2 rounded-full backdrop-blur-sm transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver a búsqueda
          </button>
          
          <TikTokScrollView
            polls={tikTokViewPosts}
            initialIndex={currentTikTokIndex}
            onVote={handleTikTokVote}
            onLike={handleTikTokLike}
            onShare={handleTikTokShare}
            onComment={handleTikTokComment}
            onSave={handleTikTokSave}
            onCreatePoll={handleTikTokCreatePoll}
            onUpdatePoll={handleTikTokUpdatePoll}
            onDeletePoll={handleTikTokDeletePoll}
          />
        </div>
      )}
    </div>
  );
};

export default SearchPage;