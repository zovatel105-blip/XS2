import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} relative flex items-center justify-center bg-white rounded-full`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Logo completamente blanco */}
      <div 
        className="relative flex items-center justify-center bg-white rounded-full"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`
        }}
      >
        {/* Logo personalizado completamente blanco */}
        <div 
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: 'white',
            width: `${Math.round(size * 0.85)}px`,
            height: `${Math.round(size * 0.85)}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Símbolo en negro para contraste */}
          <div 
            className="text-black font-bold flex items-center justify-center"
            style={{ 
              fontSize: `${Math.round(size * 0.4)}px`,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            ⚡
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLogo;