import React, { useState } from 'react';
import { Play, PlayCircle, Volume2, VolumeX, Settings, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const VideoPlaybackSettings = ({ 
  videos = [], 
  onSettingsChange,
  className = "" 
}) => {
  const [playbackMode, setPlaybackMode] = useState('sequential'); // 'sequential' | 'simultaneous' | 'manual'
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSettingChange = (key, value) => {
    const newSettings = {
      playbackMode,
      autoplay,
      muted,
      loop,
      [key]: value
    };

    // Update local state
    switch (key) {
      case 'playbackMode':
        setPlaybackMode(value);
        break;
      case 'autoplay':
        setAutoplay(value);
        break;
      case 'muted':
        setMuted(value);
        break;
      case 'loop':
        setLoop(value);
        break;
    }

    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const playbackModes = [
    {
      id: 'sequential',
      name: 'Uno por uno',
      description: 'Los videos se reproducen secuencialmente',
      icon: <Play className="w-4 h-4" />
    },
    {
      id: 'simultaneous',
      name: 'Todos a la vez',
      description: 'Todos los videos se reproducen simultáneamente',
      icon: <PlayCircle className="w-4 h-4" />
    },
    {
      id: 'manual',
      name: 'Reproducción manual',
      description: 'El usuario controla cuando reproducir cada video',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  // Only show if there are videos
  if (!videos || videos.length === 0) {
    return null;
  }

  const hasMultipleVideos = videos.length > 1;

  return (
    <Card className={`p-4 space-y-4 bg-gray-50 border-2 border-gray-200 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center">
          <Play className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Configuración de Video</h3>
          <p className="text-sm text-gray-600">
            {videos.length} video{videos.length > 1 ? 's' : ''} detectado{videos.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Playback Mode Selection - Only show if multiple videos */}
      {hasMultipleVideos && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">
            Modo de reproducción
          </Label>
          <div className="grid gap-2">
            {playbackModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSettingChange('playbackMode', mode.id)}
                className={`
                  w-full p-3 rounded-xl border-2 text-left transition-all
                  ${playbackMode === mode.id 
                    ? 'border-purple-500 bg-purple-50 text-purple-900' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${playbackMode === mode.id ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-xs text-gray-600">{mode.description}</div>
                  </div>
                  {playbackMode === mode.id && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Basic Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-gray-600" />
            <Label htmlFor="autoplay" className="text-sm font-medium">
              Reproducción automática
            </Label>
          </div>
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {muted ? (
              <VolumeX className="w-4 h-4 text-gray-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-600" />
            )}
            <Label htmlFor="muted" className="text-sm font-medium">
              Silenciar videos
            </Label>
          </div>
          <Switch
            id="muted"
            checked={muted}
            onCheckedChange={(checked) => handleSettingChange('muted', checked)}
          />
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-gray-200 pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between text-sm text-gray-600 hover:text-gray-900 px-2 py-1 h-auto"
        >
          <span>Configuración avanzada</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="loop" className="text-sm font-medium">
                Repetir videos en bucle
              </Label>
              <Switch
                id="loop"
                checked={loop}
                onCheckedChange={(checked) => handleSettingChange('loop', checked)}
              />
            </div>

            {/* Video Quality Preview */}
            <div className="text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-200">
              <div className="font-medium mb-1">Información de videos:</div>
              {videos.map((video, index) => (
                <div key={index} className="flex justify-between">
                  <span>Video {index + 1}</span>
                  <span>{video.type || 'video/mp4'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-700 mb-1">Vista previa de configuración:</div>
        <div className="space-y-1">
          {hasMultipleVideos && (
            <div>• Reproducción: {playbackModes.find(m => m.id === playbackMode)?.name}</div>
          )}
          <div>• Inicio automático: {autoplay ? 'Activado' : 'Desactivado'}</div>
          <div>• Audio: {muted ? 'Silenciado' : 'Con sonido'}</div>
          {loop && <div>• Repetición en bucle activada</div>}
        </div>
      </div>
    </Card>
  );
};

export default VideoPlaybackSettings;