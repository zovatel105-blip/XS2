import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Hash, Music, ArrowLeft, Loader, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import searchService from '../services/searchService';
import SearchResultItem from '../components/search/SearchResultItem';
import AutocompleteDropdown from '../components/search/AutocompleteDropdown';
import DiscoverySection from '../components/search/DiscoverySection';
import PostsIcon from '../components/icons/PostsIcon';

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
  
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
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
    { id: 'all', label: 'Todo', icon: Search },
    { id: 'users', label: 'Usuarios', icon: User },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
    { id: 'sounds', label: 'Sonidos', icon: Music },
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X size={16} />
                </button>
              )}
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar usuarios, posts, hashtags, sonidos..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm sm:text-base"
                autoFocus
              />
              
              {isAutocompleteLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Loader size={16} className="text-gray-400 animate-spin" />
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

      {/* Tabs */}
      {hasSearched && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            {/* Mobile Layout */}
            <div className="block md:hidden py-3">
              {/* Filter Tabs - Mobile */}
              <div className="flex space-x-1 overflow-x-auto pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-center py-3">
              {/* Filter Tabs - Desktop */}
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {!searchQuery.trim() ? (
          <DiscoverySection
            trendingContent={discoveryData.trending_posts || []}
            suggestedUsers={discoveryData.suggested_users || []}
            trendingHashtags={discoveryData.trending_hashtags || []}
          />
        ) : isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Buscando...</p>
          </div>
        ) : searchResults.length > 0 ? (
          /* Search Results */
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchQuery}"
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {searchResults.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}-${index}`}
                  result={result}
                  onItemClick={handleResultClick}
                />
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          /* No Results */
          <div className="text-center py-16">
            <Search size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500 mb-6">
              No pudimos encontrar nada para "{searchQuery}". Intenta con términos diferentes.
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
    </div>
  );
};

export default SearchPage;