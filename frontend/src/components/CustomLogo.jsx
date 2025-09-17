import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_grind-reflection/artifacts/5hxwy4go_descarga%20%284%29.png"
      alt="Quick Actions Logo"
      width={size}
      height={size}
      className={`${className} object-contain rounded-full`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'contain',
        imageRendering: 'high-quality',
        imageRendering: '-webkit-optimize-contrast',
        imageRendering: 'crisp-edges'
      }}
    />
  );
};

export default CustomLogo;