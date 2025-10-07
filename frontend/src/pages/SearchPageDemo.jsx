import React, { useState } from 'react';
import { ArrowLeft, Play, Heart, User, Hash, Music } from 'lucide-react';

const SearchPageDemo = () => {
  const [searchQuery] = useState('dibujo de personajes');

  // Sample search results for demonstration
  const sampleResults = [
    { id: '1', type: 'post', title: 'Dibujo de Mickey Mouse', image_url: 'https://via.placeholder.com/300x600/FF6B6B/FFFFFF?text=Mickey+Mouse', votes_count: 245 },
    { id: '2', type: 'post', title: 'Personaje Anime', image_url: 'https://via.placeholder.com/300x600/4ECDC4/FFFFFF?text=Anime+Character', votes_count: 189 },
    { id: '3', type: 'post', title: 'Superhéroe Original', image_url: 'https://via.placeholder.com/300x600/45B7D1/FFFFFF?text=Superhero', votes_count: 312 },
    { id: '4', type: 'post', title: 'Personaje de Disney', image_url: 'https://via.placeholder.com/300x600/96CEB4/FFFFFF?text=Disney+Princess', votes_count: 428 },
    { id: '5', type: 'post', title: 'Dibujo Kawaii', image_url: 'https://via.placeholder.com/300x600/FECA57/FFFFFF?text=Kawaii+Art', votes_count: 167 },
    { id: '6', type: 'post', title: 'Manga Style', image_url: 'https://via.placeholder.com/300x600/FF9FF3/FFFFFF?text=Manga+Style', votes_count: 203 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Minimalist Design */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        {/* Top Row - Back Button + Search Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="p-1">
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar"
                value={searchQuery}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 border-0 focus:ring-0 focus:outline-none text-base focus:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills - Horizontal Scrollable */}
        <div className="px-4 py-3 bg-white">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'disney', label: 'De disney', icon: '🏰', active: true },
              { id: 'animated', label: 'Animados', icon: '🎬', active: false },
              { id: 'characters', label: 'Personajes', icon: '👤', active: false },
              { id: 'art', label: 'Arte', icon: '🎨', active: false },
              { id: 'drawings', label: 'Dibujos', icon: '✏️', active: false },
              { id: 'anime', label: 'Anime', icon: '🎌', active: false },
              { id: 'manga', label: 'Manga', icon: '📚', active: false },
            ].map((filter) => (
              <button
                key={filter.id}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200 border ${
                  filter.active
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results - Image Grid Style */}
      <div className="px-3 py-2">
        {/* Results Grid - 2 Column Layout with 7:14 ratio */}
        <div className="grid grid-cols-2 gap-2">
          {sampleResults.map((result, index) => (
            <div
              key={result.id}
              className="relative bg-white rounded-xl overflow-hidden cursor-pointer group transform transition-transform duration-200 hover:scale-[1.02]"
            >
              {/* Image Container with 7:14 aspect ratio */}
              <div className="relative bg-gray-100" style={{ aspectRatio: '7 / 14' }}>
                {/* Main Image */}
                <img 
                  src={result.image_url} 
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Three dots menu button */}
                <button 
                  className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:bg-black/60 md:opacity-0 md:group-hover:opacity-100"
                >
                  <div className="flex flex-col space-y-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </button>
                
                {/* Content overlay for posts */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center">
                        <Play size={12} className="mr-1" fill="currentColor" />
                        <span>{result.votes_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SearchPageDemo;