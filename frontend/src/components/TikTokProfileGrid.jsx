import React from 'react';
import { Play, Vote, BarChart3, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import LayoutRenderer from './layouts/LayoutRenderer';
import PostManagementMenu from './PostManagementMenu';
import { Button } from './ui/button';

const TikTokProfileGrid = ({ 
  polls, 
  onPollClick, 
  onUpdatePoll, 
  onDeletePoll, 
  currentUser, 
  isOwnProfile = false, 
  showUseSoundButton = false, 
  onUseSound = null,
  currentAudio = null 
}) => {
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

  // Dummy vote function for profile grid (doesn't actually vote)
  const handleDummyVote = (optionId) => {
    // This is just for rendering purposes, actual voting happens in TikTokScrollView
    console.log('Profile grid vote click (no action):', optionId);
  };

  return (
    <div className="tiktok-profile-grid">
      {polls.map((poll, index) => {
        const voteCount = getVoteCount(poll);

        return (
          <motion.div
            key={poll.id}
            className="tiktok-profile-grid-item group relative overflow-hidden"
            onClick={() => onPollClick && onPollClick(poll)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {/* Render the actual layout as it appears in the feed */}
            <div className="w-full h-full">
              <LayoutRenderer 
                poll={poll} 
                onVote={handleDummyVote} 
                isActive={false} // Not active in profile grid
              />
            </div>

            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none" />

            {/* Play Button (responsive for touch) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
              </motion.div>
            </div>

            {/* Vote count overlay - bottom left */}
            {voteCount > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-medium pointer-events-none">
                <Vote className="w-3 h-3" />
                <span>{formatViewCount(voteCount)}</span>
              </div>
            )}

            {/* Debug indicator removed */}

            {/* Poll title overlay removed from profile grid */}
          </motion.div>
        );
      })}
    </div>
  );
};

export default TikTokProfileGrid;