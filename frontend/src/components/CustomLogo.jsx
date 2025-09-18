import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_feed-menu-options/artifacts/xlpt0i3u_IMG_2025_09_18_1238093301.jpg"
      alt="Quick Actions Logo"
      width={size}
      height={size}
      className={`${className} object-cover rounded-full`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'cover',
        objectPosition: 'center center',
        imageRendering: 'high-quality',
        imageRendering: '-webkit-optimize-contrast',
        imageRendering: 'crisp-edges'
      }}
    />
  );
};

export default CustomLogo;