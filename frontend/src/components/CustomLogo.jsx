import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_grind-reflection/artifacts/9nizlz3p_57121c2bf5fc481_file_0000000087746230b2ab9129fb1ba466_wm.png"
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