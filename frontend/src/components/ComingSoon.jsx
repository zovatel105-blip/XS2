import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-xl mx-auto text-center">
        
        {/* Simple Title */}
        <h1 className="text-7xl font-light text-black mb-4 tracking-wide">
          Coming Soon
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-12 font-light">
          Desktop version in development
        </p>

        {/* Simple Status */}
        <div className="border border-gray-200 rounded-lg p-8 mb-12 bg-gray-50">
          <div className="flex items-center justify-center mb-6 space-x-8">
            <div className="flex flex-col items-center space-y-2">
              <Monitor className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">Desktop</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="flex flex-col items-center space-y-2">
              <Smartphone className="w-8 h-8 text-black" />
              <span className="text-sm font-medium text-black">Mobile</span>
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
          </div>
          
          <p className="text-gray-700 text-base leading-relaxed">
            We're working on bringing you the best desktop experience. 
            For now, enjoy all features on your mobile device.
          </p>
        </div>

        {/* Simple Call to Action */}
        <div className="space-y-6">
          <p className="text-gray-600">
            Have a mobile device? Try the full app now!
          </p>
          
          <div className="space-y-2">
            <div className="bg-black text-white px-6 py-3 rounded-md font-medium">
              Access from mobile
            </div>
            <p className="text-gray-500 text-sm">
              or resize your browser window
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-400 text-sm">
          <p>Full mobile experience available</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;