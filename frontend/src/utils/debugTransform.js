/**
 * Debug helper for media transform functionality
 * Use in browser console to test transform data
 */

// Function to test transform data structure
window.debugTransform = {
  // Test transform data creation (like InlineCrop)
  createTransformData: (x = 30, y = 70, scale = 1.2) => {
    const transformData = {
      transform: {
        position: { x, y },
        scale: scale
      },
      originalImageSrc: 'test-image.jpg'
    };
    console.log('🔧 Created transform data:', transformData);
    return transformData;
  },

  // Test media object with transform (like in poll response)
  createMediaWithTransform: (url, transform = null) => {
    const media = {
      type: 'image',
      url: url || 'https://picsum.photos/400/300',
      thumbnail: url || 'https://picsum.photos/400/300',
      transform: transform || {
        position: { x: 25, y: 75 },
        scale: 1.3
      }
    };
    console.log('🖼️ Created media with transform:', media);
    return media;
  },

  // Test CSS style generation (like in PollCard)
  generateTransformStyles: (media) => {
    if (!media.transform) {
      console.log('⚠️ No transform data found');
      return {};
    }

    const styles = {
      objectPosition: `${media.transform.position?.x || 50}% ${media.transform.position?.y || 50}%`,
      transform: `scale(${media.transform.scale || 1})`,
      transformOrigin: 'center center'
    };
    
    console.log('🎨 Generated styles:', styles);
    return styles;
  },

  // Apply transform to an existing image element
  applyTransformToImage: (imageSelector, transform) => {
    const img = document.querySelector(imageSelector);
    if (!img) {
      console.log('❌ Image not found:', imageSelector);
      return;
    }

    const styles = {
      objectPosition: `${transform.position?.x || 50}% ${transform.position?.y || 50}%`,
      transform: `scale(${transform.scale || 1})`,
      transformOrigin: 'center center'
    };

    Object.assign(img.style, styles);
    console.log('✅ Applied transform to image:', imageSelector, styles);
  },

  // Test complete flow
  testCompleteFlow: () => {
    console.log('🧪 Testing complete transform flow...');
    
    // Step 1: Create transform data (InlineCrop output)
    const transformData = window.debugTransform.createTransformData(20, 80, 1.5);
    
    // Step 2: Extract transform for storage (ContentCreationPage)
    const savedTransform = transformData.transform;
    console.log('💾 Saved transform:', savedTransform);
    
    // Step 3: Create media object (Backend response)
    const media = window.debugTransform.createMediaWithTransform('test.jpg', savedTransform);
    
    // Step 4: Generate CSS styles (PollCard render)
    const styles = window.debugTransform.generateTransformStyles(media);
    
    console.log('🎉 Complete flow test successful!');
    return { transformData, savedTransform, media, styles };
  }
};

// Auto-run test on load
console.log('🔧 Debug Transform Utils loaded. Use window.debugTransform to test functionality.');
console.log('💡 Try: window.debugTransform.testCompleteFlow()');