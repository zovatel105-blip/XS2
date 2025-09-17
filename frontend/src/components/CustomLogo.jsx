import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <img
      src="https://customer-assets.emergentagent.com/job_grind-reflection/artifacts/yvqdxdup_descarga%20%282%29.png"
      alt="Quick Actions Logo"
      width={size}
      height={size}
      className={`${className} object-cover`}
      style={{ 
        width: `${size * 1.4}px`, 
        height: `${size * 1.4}px`,
        objectFit: 'cover',
        clipPath: 'circle(35% at 50% 50%)',
        borderRadius: '50%',
        transform: 'scale(1)',
        margin: `${-size * 0.2}px`
      }}
    />
  );
};

export default CustomLogo;