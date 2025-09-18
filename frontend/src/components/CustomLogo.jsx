import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} rounded-full overflow-hidden`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        backgroundColor: 'transparent',
        clipPath: 'circle(50% at 50% 50%)'
      }}
    >
      <img
        src="https://customer-assets.emergentagent.com/job_feed-menu-options/artifacts/17e0koxw_IMG_2025_09_18_1241285351.png"
        alt="Quick Actions Logo"
        width={size}
        height={size}
        className="w-full h-full object-cover"
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
    </div>
  );
};

export default CustomLogo;