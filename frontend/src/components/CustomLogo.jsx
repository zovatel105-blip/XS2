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
        src="https://customer-assets.emergentagent.com/job_979c19d8-b9c0-4e35-80df-e411a6f88938/artifacts/qk9i0x5a_file_00000000a8a071f5befc3375a0b68179.png"
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