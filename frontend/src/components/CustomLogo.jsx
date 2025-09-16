import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_grind-reflection/artifacts/yvqdxdup_descarga%20%282%29.png"
      alt="Quick Actions Logo"
      width={size}
      height={size}
      className={`${className} object-contain rounded`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'contain'
      }}
    />
  );
};

export default CustomLogo;