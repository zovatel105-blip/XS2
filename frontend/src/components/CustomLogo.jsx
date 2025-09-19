import React from 'react';

const CustomLogo = ({ size = 24, className = "" }) => {
  return (
    <div
      className={`${className} relative flex items-center justify-center bg-black rounded-full`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Crear un logo puramente CSS para evitar el problema del borde blanco */}
      <div 
        className="relative flex items-center justify-center bg-black rounded-full"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`
        }}
      >
        {/* Logo personalizado con gradiente y formas CSS */}
        <div 
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #059669 100%)',
            width: `${Math.round(size * 0.85)}px`,
            height: `${Math.round(size * 0.85)}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Símbolo personalizado en el centro */}
          <div 
            className="text-white font-bold flex items-center justify-center"
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