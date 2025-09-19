import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} rounded-full overflow-hidden relative`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        backgroundColor: 'black',
        clipPath: 'circle(50% at 50% 50%)'
      }}
    >
      {/* Fondo negro para cubrir esquinas blancas */}
      <div 
        className="absolute inset-0 bg-black rounded-full"
        style={{ zIndex: 0 }}
      />
      
      <img
        src="https://customer-assets.emergentagent.com/job_feed-menu-options/artifacts/17e0koxw_IMG_2025_09_18_1241285351.png"
        alt="Quick Actions Logo"
        width={size}
        height={size}
        className="w-full h-full object-cover relative"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          objectFit: 'cover',
          objectPosition: 'center center',
          imageRendering: 'high-quality',
          imageRendering: '-webkit-optimize-contrast',
          imageRendering: 'crisp-edges',
          zIndex: 1,
          mixBlendMode: 'screen' // Esto ayudará a que el logo se vea bien sobre el fondo negro
        }}
      />
      
      {/* Máscara negra adicional para asegurar que las esquinas sean negras */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 45%, black 50%)',
          zIndex: 2
        }}
      />
    </div>
  );
};

export default CustomLogo;