import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_feed-menu-options/artifacts/17e0koxw_IMG_2025_09_18_1241285351.png"
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