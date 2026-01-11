import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Facebook, MessageCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

const ShareModal = ({ isOpen, onClose, content }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!content) return null;

  const { type, title, description, url, imageUrl } = content;

  // URLs para compartir en diferentes plataformas
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + '\n' + description + '\n' + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + ' - ' + description)}`,
  };

  const handleShare = async (platform) => {
    try {
      switch (platform) {
        case 'copy':
          await copyToClipboard(url);
          toast({
            title: "🔗 Enlace copiado",
            description: "El enlace se ha copiado al portapapeles",
          });
          break;

        default:
          // Para Facebook, WhatsApp, Telegram
          window.open(shareUrls[platform], '_blank', 'width=600,height=400');
          toast({
            title: "🚀 Compartiendo...",
            description: `Abriendo ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          });
          break;
      }
      
      // Cerrar modal después de compartir
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error al compartir:', error);
      toast({
        title: "❌ Error al compartir",
        description: "Hubo un problema al intentar compartir el contenido",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Compartir en Facebook'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Compartir por WhatsApp'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785L24 5.405c.309-1.239-.473-1.8-1.335-1.688z"/>
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Compartir en Telegram'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={
            isMobile 
              ? "fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              : "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          }
          onClick={onClose}
        >
          <motion.div
            initial={
              isMobile 
                ? { y: "100%", opacity: 1 }
                : { scale: 0.95, opacity: 0 }
            }
            animate={
              isMobile 
                ? { y: "0%", opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            exit={
              isMobile 
                ? { y: "100%", opacity: 1 }
                : { scale: 0.95, opacity: 0 }
            }
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3
            }}
            className={
              isMobile
                ? "bg-white rounded-t-3xl p-6 w-full fixed bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto"
                : "bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            }
            onClick={(e) => e.stopPropagation()}
            style={isMobile ? { 
              paddingBottom: `max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))`
            } : {}}
          >
            {/* Drag Indicator for Mobile */}
            {isMobile && (
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Compartir {type === 'poll' ? 'Votación' : 'Perfil'}
              </h3>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              <p className="text-xs text-gray-500 truncate">{url}</p>
            </div>

            {/* Platform Options */}
            <div className="space-y-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleShare(platform.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg text-white transition-colors ${platform.color}`}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{platform.name}</div>
                      <div className="text-xs opacity-90">{platform.description}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-70" />
                  </motion.button>
                );
              })}
              
              {/* Copy Link Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleShare('copy')}
                className="w-full flex items-center gap-4 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                <Copy className="h-6 w-6" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Copiar Enlace</div>
                  <div className="text-xs opacity-90">Copiar al portapapeles</div>
                </div>
              </motion.button>
            </div>

            {/* Mobile Close Button */}
            {isMobile && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full py-3 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;