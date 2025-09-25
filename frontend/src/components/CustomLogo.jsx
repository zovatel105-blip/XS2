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
      {/* Símbolo directo sin contenedores adicionales */}
      <div 
        className="text-black font-bold flex items-center justify-center"
        style={{ 
          fontSize: `${Math.round(size * 0.6)}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'transparent'
        }}
      >
        ⚡
      </div>
    </div>
  );
};

export default CustomLogo;