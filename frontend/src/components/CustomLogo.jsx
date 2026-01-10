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
      {/* Logo igual que la página de login */}
      <img
        src="/votatuk-logo.jpg"
        alt="Logo"
        width={size}
        height={size}
        style={{
          display: 'block',
          objectFit: 'cover',
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: '20%'
        }}
      />
    </div>
  );
};

export default CustomLogo;