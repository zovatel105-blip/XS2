import React from 'react';

const VotaTokLogo = ({ size = 80, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/votatuk-logo.png" 
        alt="VotaTok Logo"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

// Logo simplificado para uso en navegación
export const VotaTokSimpleLogo = ({ size = 50, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/votatuk-logo.png" 
        alt="VotaTok Logo"
        width={size}
        height={size}
        className="object-contain rounded-xl"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

// Logo con texto para headers
export const VotaTokLogoWithText = ({ size = 40, showText = true, className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <VotaTokSimpleLogo size={size} />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-transparent">
            VotaTok
          </span>
          <span className="text-xs text-gray-500 -mt-1">
            TikTok Style Polls
          </span>
        </div>
      )}
    </div>
  );
};

export default VotaTokLogo;
