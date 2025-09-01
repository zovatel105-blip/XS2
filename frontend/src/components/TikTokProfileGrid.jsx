import React from 'react';
import { Play, Vote, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const TikTokProfileGrid = ({ polls, onPollClick }) => {
  // Function to format vote count
  const formatViewCount = (votes) => {
    if (votes >= 1000000) {
      return `${(votes / 1000000).toFixed(1)}M`;
    } else if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}K`;
    }
    return votes.toString();
  };

  // Function to get vote count
  const getVoteCount = (poll) => {
    return poll.totalVotes || 0;
  };

  // Function to get all option images for creating a composite thumbnail
  const getOptionImages = (poll) => {
    if (!poll.options || poll.options.length === 0) {
      return [];
    }

    return poll.options.map(option => {
      // Debug log to see what data we're getting
      console.log('TikTokProfileGrid - Processing option:', {
        hasMedia: !!option.media,
        mediaType: option.media?.type,
        hasUrl: !!option.media?.url,
        hasThumbnail: !!option.media?.thumbnail,
        thumbnailValue: option.media?.thumbnail,
        urlValue: option.media?.url
      });

      if (option.media) {
        // For videos, prefer thumbnail over the video URL
        if (option.media.type === 'video') {
          const thumbnail = option.media.thumbnail || option.media.url;
          console.log('TikTokProfileGrid - Using video thumbnail:', thumbnail);
          return thumbnail;
        }
        // For images, use thumbnail first, then URL
        if (option.media.thumbnail) {
          return option.media.thumbnail;
        }
        if (option.media.url) {
          return option.media.url;
        }
      }
      // Fallback image for options without media
      return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=600&fit=crop&crop=center';
    });
  };

  // Function to create a composite thumbnail layout
  const renderCompositeThumbnail = (poll, images) => {
    if (images.length === 1) {
      // Single image - full cover
      return (
        <img
          src={images[0]}
          alt={poll.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            console.log('TikTokProfileGrid - Image failed to load:', images[0]);
            // Fallback to a solid color background
            e.target.style.display = 'none';
            e.target.parentElement.style.background = 'linear-gradient(135deg, #1f2937, #111827)';
          }}
        />
      );
    } else if (images.length === 2) {
      // Two images - split vertically
      return (
        <div className="w-full h-full flex">
          {images.slice(0, 2).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${poll.title} option ${idx + 1}`}
              className="w-1/2 h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.log('TikTokProfileGrid - Image failed to load:', img);
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #1f2937, #111827)';
              }}
            />
          ))}
        </div>
      );
    } else if (images.length === 3) {
      // Three images - one large on left, two stacked on right
      return (
        <div className="w-full h-full flex">
          <img
            src={images[0]}
            alt={`${poll.title} option 1`}
            className="w-2/3 h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.log('TikTokProfileGrid - Image failed to load:', images[0]);
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #1f2937, #111827)';
            }}
          />
          <div className="w-1/3 h-full flex flex-col">
            {images.slice(1, 3).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${poll.title} option ${idx + 2}`}
                className="w-full h-1/2 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  console.log('TikTokProfileGrid - Image failed to load:', img);
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #1f2937, #111827)';
                }}
              />
            ))}
          </div>
        </div>
      );
    } else {
      // Four or more images - 2x2 grid
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
          {images.slice(0, 4).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${poll.title} option ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                console.log('TikTokProfileGrid - Image failed to load:', img);
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #1f2937, #111827)';
              }}
            />
          ))}
        </div>
      );
    }
  };

  return (
    <div className="grid grid-cols-3 gap-px">
      {polls.map((poll, index) => {
        const optionImages = getOptionImages(poll);
        const voteCount = getVoteCount(poll);

        return (
          <motion.div
            key={poll.id}
            className="relative bg-black overflow-hidden cursor-pointer group"
            style={{ 
              width: '129.46px', 
              height: '229.66px' 
            }}
            onClick={() => onPollClick && onPollClick(poll)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {/* Composite Cover Images */}
            {renderCompositeThumbnail(poll, optionImages)}

            {/* Subtle dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

            {/* Play Button (on hover) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}
              >
                <Play className="w-6 h-6 text-white ml-1" />
              </motion.div>
            </div>

            {/* Vote Count with Vote icon - Bottom left corner */}
            <div className="absolute bottom-2 left-2 z-10">
              <div className="flex items-center gap-1 text-white font-bold drop-shadow-lg">
                <Vote className="w-4 h-4 fill-white" />
                <span className="text-sm font-bold">{formatViewCount(voteCount)}</span>
              </div>
            </div>

            {/* Subtle gradient overlay for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </motion.div>
        );
      })}
    </div>
  );
};

export default TikTokProfileGrid;