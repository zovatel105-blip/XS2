/**
 * InlineCropTest - Componente de prueba para gestos sin autenticación
 */
import React, { useState } from 'react';
import InlineCrop from './InlineCrop';

const InlineCropTest = () => {
  const [isActive, setIsActive] = useState(false);
  const [savedTransform, setSavedTransform] = useState(null);

  // Imagen de prueba (placeholder)
  const testImageSrc = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='20' fill='%23666'%3EImagen de Prueba%3C/text%3E%3C/svg%3E";

  const handleSave = (transformData) => {
    console.log('🎯 Test: Transform saved:', transformData);
    setSavedTransform(transformData);
  };

  const handleCancel = () => {
    console.log('🚪 Test: Crop cancelled');
    setIsActive(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Controls */}
      <div className="p-4 bg-gray-900 text-white flex gap-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded ${
            isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isActive ? 'Desactivar Gestos' : 'Activar Gestos'}
        </button>
        
        <button
          onClick={() => setSavedTransform(null)}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded"
        >
          Reset Transform
        </button>
        
        <div className="flex-1 text-sm">
          <div>Estado: {isActive ? '🔴 ACTIVO - Puedes hacer gestos' : '🟢 INACTIVO'}</div>
          <div>Transform: {savedTransform ? 'SÍ' : 'NO'}</div>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 p-8">
        <div className="w-full max-w-md mx-auto aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden relative">
          <InlineCrop
            isActive={isActive}
            imageSrc={testImageSrc}
            savedTransform={savedTransform}
            onSave={handleSave}
            onCancel={handleCancel}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Debug Info */}
      <div className="p-4 bg-gray-900 text-white text-xs">
        <div className="mb-2">📋 Instrucciones de Prueba:</div>
        <div>1. Haz clic en "Activar Gestos" para entrar en modo ajuste</div>
        <div>2. Arrastra la imagen para moverla</div>
        <div>3. Usa la rueda del mouse para hacer zoom</div>
        <div>4. En móvil: usa pinch-to-zoom y arrastra con un dedo</div>
        <div>5. Los valores P (posición) y S (escala) deberían cambiar en tiempo real</div>
        
        {savedTransform && (
          <div className="mt-2 p-2 bg-blue-900 rounded">
            <div>🎯 Última transformación guardada:</div>
            <div>Posición X: {savedTransform.transform?.position?.x}</div>
            <div>Posición Y: {savedTransform.transform?.position?.y}</div>
            <div>Escala: {savedTransform.transform?.scale}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineCropTest;