import React from 'react';

const TwykLogo = ({ size = 80, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/twyk-logo.png" 
        alt="Twyk Logo"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

// Logo simplificado para uso en navegación
export const TwykSimpleLogo = ({ size = 50, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/twyk-logo.png" 
        alt="Twyk Logo"
        width={size}
        height={size}
        className="object-contain rounded-xl"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

// Logo con texto
export const TwykLogoWithText = ({ size = 40, showText = true, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TwykSimpleLogo size={size} />
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Twyk
          </span>
        </div>
      )}
    </div>
  );
};

export default TwykLogo;
