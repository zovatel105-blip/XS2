/**
 * TikTokTextOverlay - TikTok-style text editing with fonts, colors, and animations
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Palette, AlignCenter, AlignLeft, AlignRight, Bold, Italic, X } from 'lucide-react';
import { Button } from './ui/button';

const TikTokTextOverlay = ({
  isOpen = false,
  onClose = () => {},
  onSave = (textData) => {},
  initialText = '',
  containerWidth = 400,
  containerHeight = 600
}) => {
  const [text, setText] = useState(initialText);
  const [textStyle, setTextStyle] = useState({
    fontFamily: 'Inter',
    fontSize: 24,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    position: { x: 50, y: 50 }, // Percentage based
    animation: 'none'
  });
  const [activeTab, setActiveTab] = useState('font');
  const textRef = useRef(null);

  // TikTok-style font options with Google Fonts
  const tiktokFonts = [
    { name: 'Classic', family: 'Inter, sans-serif', preview: 'Aa' },
    { name: 'Handwriting', family: 'Kalam, cursive', preview: 'Aa' },
    { name: 'Elegant', family: 'Playfair Display, serif', preview: 'Aa' },
    { name: 'Mono', family: 'Roboto Mono, monospace', preview: 'Aa' },
    { name: 'Script', family: 'Dancing Script, cursive', preview: 'Aa' },
    { name: 'Fun', family: 'Fredoka, sans-serif', preview: 'Aa' }
  ];

  // TikTok-style color presets
  const colorPresets = [
    '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FECA57', '#FF9FF3', '#A8E6CF', '#FFD93D',
    '#6C5CE7', '#FD79A8', '#FDCB6E', '#E17055', '#74B9FF'
  ];

  // Background/outline styles
  const backgroundStyles = [
    { name: 'None', style: { backgroundColor: 'transparent' } },
    { name: 'Semi-transparent', style: { backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px' } },
    { name: 'Solid', style: { backgroundColor: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: '8px' } },
    { name: 'Outline', style: { backgroundColor: 'transparent', textStroke: '2px currentColor', WebkitTextStroke: '2px white' } }
  ];

  // Text animations
  const animations = [
    { name: 'None', value: 'none' },
    { name: 'Fade In', value: 'fadeIn' },
    { name: 'Slide Up', value: 'slideUp' },
    { name: 'Bounce', value: 'bounce' },
    { name: 'Zoom', value: 'zoom' },
    { name: 'Typewriter', value: 'typewriter' }
  ];

  const updateStyle = (updates) => {
    setTextStyle(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    const textData = {
      text,
      style: textStyle,
      id: Date.now().toString()
    };
    onSave(textData);
    onClose();
  };

  const getAnimationStyle = () => {
    switch (textStyle.animation) {
      case 'fadeIn':
        return {
          animation: 'fadeIn 0.5s ease-in-out'
        };
      case 'slideUp':
        return {
          animation: 'slideUp 0.5s ease-out'
        };
      case 'bounce':
        return {
          animation: 'bounce 0.6s ease-out'
        };
      case 'zoom':
        return {
          animation: 'zoomIn 0.4s ease-out'
        };
      default:
        return {};
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">Add Text</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Preview Area */}
          <div 
            className="relative bg-gray-900 mx-4 mt-4 rounded-xl overflow-hidden"
            style={{ aspectRatio: '9/16', height: '200px' }}
          >
            {text && (
              <div
                ref={textRef}
                className="absolute cursor-move select-none"
                style={{
                  left: `${textStyle.position.x}%`,
                  top: `${textStyle.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: textStyle.fontFamily,
                  fontSize: `${textStyle.fontSize}px`,
                  color: textStyle.color,
                  fontWeight: textStyle.fontWeight,
                  fontStyle: textStyle.fontStyle,
                  textAlign: textStyle.textAlign,
                  textShadow: textStyle.textShadow,
                  maxWidth: '80%',
                  wordWrap: 'break-word',
                  ...backgroundStyles.find(bg => bg.name === textStyle.backgroundType)?.style,
                  ...getAnimationStyle()
                }}
              >
                {text}
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your text..."
              className="w-full p-3 border rounded-lg resize-none h-20 text-center text-lg"
              maxLength={100}
            />
          </div>

          {/* Style Tabs */}
          <div className="flex border-b">
            {[
              { id: 'font', icon: Type, label: 'Font' },
              { id: 'color', icon: Palette, label: 'Color' },
              { id: 'align', icon: AlignCenter, label: 'Align' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Style Options */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {activeTab === 'font' && (
              <div className="space-y-4">
                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium mb-2">Font</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tiktokFonts.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => updateStyle({ fontFamily: font.family })}
                        className={`p-2 border rounded text-center ${
                          textStyle.fontFamily === font.family ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        style={{ fontFamily: font.family }}
                      >
                        <div className="text-lg">{font.preview}</div>
                        <div className="text-xs text-gray-600">{font.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={textStyle.fontSize}
                    onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">{textStyle.fontSize}px</div>
                </div>

                {/* Font Weight & Style */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStyle({ fontWeight: textStyle.fontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`flex-1 p-2 border rounded flex items-center justify-center gap-1 ${
                      textStyle.fontWeight === 'bold' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Bold className="w-4 h-4" />
                    Bold
                  </button>
                  <button
                    onClick={() => updateStyle({ fontStyle: textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`flex-1 p-2 border rounded flex items-center justify-center gap-1 ${
                      textStyle.fontStyle === 'italic' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <Italic className="w-4 h-4" />
                    Italic
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'color' && (
              <div className="space-y-4">
                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium mb-2">Text Color</label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateStyle({ color })}
                        className={`w-8 h-8 rounded border-2 ${
                          textStyle.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Style */}
                <div>
                  <label className="block text-sm font-medium mb-2">Background</label>
                  <div className="space-y-2">
                    {backgroundStyles.map((bg) => (
                      <button
                        key={bg.name}
                        onClick={() => updateStyle({ backgroundType: bg.name })}
                        className={`w-full p-2 border rounded text-left ${
                          textStyle.backgroundType === bg.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        {bg.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'align' && (
              <div className="space-y-4">
                {/* Text Alignment */}
                <div>
                  <label className="block text-sm font-medium mb-2">Alignment</label>
                  <div className="flex gap-2">
                    {[
                      { align: 'left', icon: AlignLeft },
                      { align: 'center', icon: AlignCenter },
                      { align: 'right', icon: AlignRight }
                    ].map(({ align, icon: Icon }) => (
                      <button
                        key={align}
                        onClick={() => updateStyle({ textAlign: align })}
                        className={`flex-1 p-2 border rounded flex items-center justify-center ${
                          textStyle.textAlign === align ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animations */}
                <div>
                  <label className="block text-sm font-medium mb-2">Animation</label>
                  <div className="space-y-2">
                    {animations.map((anim) => (
                      <button
                        key={anim.value}
                        onClick={() => updateStyle({ animation: anim.value })}
                        className={`w-full p-2 border rounded text-left ${
                          textStyle.animation === anim.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        {anim.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!text.trim()}>
              Add Text
            </Button>
          </div>
        </motion.div>

        {/* CSS Animations */}
        <style jsx>{`
          /* TikTok-style animations */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translate(-50%, 20px); opacity: 0; }
            to { transform: translate(-50%, -50%); opacity: 1; }
          }
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translate(-50%, -50%); }
            40%, 43% { transform: translate(-50%, -60px); }
            70% { transform: translate(-50%, -45px); }
            90% { transform: translate(-50%, -55px); }
          }
          @keyframes zoomIn {
            from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          @keyframes typewriter {
            from { width: 0; }
            to { width: 100%; }
          }
          
          /* Enhanced scrollbar hiding */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Smooth snap scrolling */
          .snap-scroll {
            scroll-snap-type: y mandatory;
            scroll-behavior: smooth;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }
          .snap-scroll > * {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default TikTokTextOverlay;