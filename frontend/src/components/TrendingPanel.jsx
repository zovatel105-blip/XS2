/**
 * TrendingPanel - Shows trending topics and popular content
 */
import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, Play, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const TrendingPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fallback trending data (should be replaced with API data)
  const trendingTopics = [
    {
      id: 1,
      hashtag: '#Gaming2024',
      posts: 1234,
      growth: '+12%',
      category: 'gaming'
    },
    {
      id: 2,
      hashtag: '#Arte',
      posts: 856,
      growth: '+8%',
      category: 'art'
    },
    {
      id: 3,
      hashtag: '#TechTrends',
      posts: 642,
      growth: '+15%',
      category: 'tech'
    },
    {
      id: 4,
      hashtag: '#Moda2024',
      posts: 421,
      growth: '+6%',
      category: 'fashion'
    },
    {
      id: 5,
      hashtag: '#Música',
      posts: 312,
      growth: '+9%',
      category: 'music'
    }
  ];

  const trendingPolls = [
    {
      id: 1,
      title: '¿Mejor juego del año?',
      author: 'GameMaster',
      votes: 15420,
      timeAgo: '2h',
      trending: true
    },
    {
      id: 2,
      title: '¿Cuál es tu serie favorita?',
      author: 'CineFilm',
      votes: 8932,
      timeAgo: '4h',
      trending: true
    },
    {
      id: 3,
      title: 'Mejor smartphone 2024',
      author: 'TechReviewer',
      votes: 6754,
      timeAgo: '6h',
      trending: true
    }
  ];

  const categories = [
    { id: 'all', label: 'Todo', icon: TrendingUp },
    { id: 'gaming', label: 'Gaming', icon: Play },
    { id: 'art', label: 'Arte', icon: Hash },
    { id: 'tech', label: 'Tech', icon: Hash },
  ];

  const filteredTopics = selectedCategory === 'all' 
    ? trendingTopics 
    : trendingTopics.filter(topic => topic.category === selectedCategory);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-gray-900">Tendencias</h2>
        </div>
      </div>

      {/* Category tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex-1 text-xs",
                selectedCategory === category.id 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-gray-200"
              )}
            >
              <category.icon className="w-3 h-3 mr-1" />
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Trending hashtags */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Hashtags populares</h3>
        <div className="space-y-3">
          {filteredTopics.slice(0, 5).map((topic, index) => (
            <div 
              key={topic.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xs font-semibold text-gray-400 w-4">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {topic.hashtag}
                  </div>
                  <div className="text-xs text-gray-500">
                    {topic.posts.toLocaleString()} votaciones
                  </div>
                </div>
              </div>
              <Badge 
                variant={topic.growth.startsWith('+') ? 'default' : 'secondary'} 
                className="text-xs bg-green-100 text-green-700"
              >
                {topic.growth}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Trending polls */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Votaciones populares</h3>
        <div className="space-y-3">
          {trendingPolls.map((poll) => (
            <div 
              key={poll.id}
              className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100"
            >
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {poll.title}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>@{poll.author}</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{poll.votes.toLocaleString()}</span>
                    </div>
                    <span>{poll.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show more */}
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" size="sm" className="w-full text-purple-600 hover:text-purple-700">
          Ver más tendencias
        </Button>
      </div>
    </div>
  );
};

export default TrendingPanel;