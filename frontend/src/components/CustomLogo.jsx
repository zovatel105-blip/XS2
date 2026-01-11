import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        background: 'transparent'
      }}
    >
      {/* Logo actualizado */}
      <img
        src="/votatuk-logo.png"
        alt="Logo"
        width={size}
        height={size}
        style={{
          display: 'block',
          objectFit: 'contain',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};

export default CustomLogo;