import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} rounded-full overflow-hidden relative`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        backgroundColor: 'black',
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      {/* Fondo negro sólido que cubrirá todo */}
      <div 
        className="absolute inset-0 bg-black rounded-full"
        style={{ 
          zIndex: 0,
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Logo con filtros para eliminar blancos */}
      <img
        src="https://customer-assets.emergentagent.com/job_feed-menu-options/artifacts/17e0koxw_IMG_2025_09_18_1241285351.png"
        alt="Quick Actions Logo"
        width={size}
        height={size}
        className="w-full h-full object-cover absolute inset-0 rounded-full"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 1,
          filter: 'contrast(1.2) brightness(0.9)',
          // Eliminar cualquier borde o outline
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
      />
      
      {/* Máscara negra para forzar que los bordes sean negros */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at center, transparent 42%, black 48%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      
      {/* Capa adicional para eliminar completamente cualquier rastro blanco */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, black 45%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default CustomLogo;