import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_grind-reflection/artifacts/yvqdxdup_descarga%20%282%29.png"
      alt="Quick Actions Logo"
      width={size}
      height={size}
      className={`${className} object-contain rounded-full`}
      style={{ 
        width: `${size * 0.8}px`, 
        height: `${size * 0.8}px`,
        objectFit: 'contain',
        padding: `${size * 0.1}px`,
        margin: `${size * 0.1}px`
      }}
    />
  );
};

export default CustomLogo;