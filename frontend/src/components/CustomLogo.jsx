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
      {/* Logo SVG con líneas cruzadas verde y azul formando una X */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Línea verde - diagonal de arriba izquierda a abajo derecha */}
        <path
          d="M15 15 L85 85 L80 90 L10 20 Z"
          fill="#00ff00"
          style={{ filter: 'drop-shadow(0 0 4px #00ff0070)' }}
        />
        
        {/* Línea azul - diagonal de arriba derecha a abajo izquierda */}
        <path
          d="M85 15 L15 85 L20 90 L90 20 Z"
          fill="#00aaff"
          style={{ filter: 'drop-shadow(0 0 4px #00aaff70)' }}
        />
      </svg>
    </div>
  );
};

export default CustomLogo;