import React from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import RightSideNavigation from './RightSideNavigation';
import { useTikTok } from '../contexts/TikTokContext';
import { useAuth } from '../contexts/AuthContext';

const ResponsiveLayout = ({ children, onCreatePoll }) => {
  const location = useLocation();
  const { isTikTokMode, hideRightNavigation } = useTikTok();
  const { isAuthenticated } = useAuth();
  
  // Check if we're on a page that should use the TikTok-style layout
  const isFeedPage = location.pathname === '/feed';
  const isExplorePage = location.pathname === '/explore';
  const isCreatePage = location.pathname === '/create';
  const shouldUseTikTokLayout = (isFeedPage || isExplorePage || isCreatePage) && isTikTokMode;
  
  // Force hide RightSideNavigation on create page regardless of other conditions
  const shouldHideRightNavigation = hideRightNavigation || isCreatePage;

  if (shouldUseTikTokLayout) {
    // Mobile TikTok mode - full screen without sidebars
    // For create page, don't apply bg-black to allow gradients
    const backgroundClass = isCreatePage ? '' : 'bg-black';
    
    return (
      <div className={`relative h-screen ${backgroundClass}`}>
        {children}
        {/* Right side navigation for mobile TikTok mode - HIDDEN on create page */}
        <div className="lg:hidden">
          {isAuthenticated && !shouldHideRightNavigation && !isCreatePage && <RightSideNavigation onCreatePoll={onCreatePoll} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:bg-gray-100">
      {/* Desktop Sidebar - Hidden on mobile */}
      {isAuthenticated && <DesktopSidebar />}
      
      {/* Main Content Area */}
      <div className={`${isAuthenticated ? 'lg:ml-60 lg:mr-16' : ''}`}>
        <div className="relative">
          {children}
        </div>
      </div>
      
      {/* Right Side Navigation */}
      <div className="hidden lg:block lg:fixed lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2 lg:z-20">
        {isAuthenticated && !hideRightNavigation && <RightSideNavigation onCreatePoll={onCreatePoll} />}
      </div>
      
      {/* Mobile Right Side Navigation - Only when not in TikTok mode */}
      <div className="lg:hidden">
        {!shouldUseTikTokLayout && isAuthenticated && !hideRightNavigation && (
          <RightSideNavigation onCreatePoll={onCreatePoll} />
        )}
      </div>
    </div>
  );
};

export default ResponsiveLayout;