import React from 'react';

const PostsIcon = ({ size = 16, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main camera body */}
      <rect 
        x="3" 
        y="8" 
        width="18" 
        height="12" 
        rx="2" 
        ry="2" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      
      {/* Camera top/flash area */}
      <rect 
        x="7" 
        y="5" 
        width="10" 
        height="4" 
        rx="1" 
        ry="1" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      
      {/* Camera lens */}
      <circle 
        cx="12" 
        cy="14" 
        r="3" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
      />
      
      {/* Inner lens circle */}
      <circle 
        cx="12" 
        cy="14" 
        r="1.5" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
      />
      
      {/* Flash indicator */}
      <circle 
        cx="16" 
        cy="10" 
        r="0.5" 
        fill="currentColor"
      />
      
      {/* Small photos stack behind */}
      <rect 
        x="16" 
        y="6" 
        width="4" 
        height="3" 
        rx="0.5" 
        ry="0.5" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
        opacity="0.6"
      />
      
      <rect 
        x="17" 
        y="4" 
        width="4" 
        height="3" 
        rx="0.5" 
        ry="0.5" 
        stroke="currentColor" 
        strokeWidth="1" 
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
};

export default PostsIcon;