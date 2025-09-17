import React, { useState } from 'react';
import { MoreHorizontal, EyeOff, UserX, Bell, BellOff, Flag, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import AppConfig from '../config/config';

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'Spam', icon: '', description: 'Contenido no deseado o repetitivo' },
  { id: 'harassment', label: 'Acoso', icon: '', description: 'Comportamiento abusivo o intimidatorio' },
  { id: 'hate', label: 'Discurso de odio', icon: '', description: 'Contenido que promueve odio o discriminación' },
  { id: 'violence', label: 'Violencia', icon: '', description: 'Contenido violento o que incita a la violencia' },
  { id: 'nudity', label: 'Desnudez/Sexual', icon: '', description: 'Contenido sexual explícito o desnudez' },
  { id: 'misinformation', label: 'Información falsa', icon: '', description: 'Información incorrecta o engañosa' },
  { id: 'other', label: 'Otro', icon: '', description: 'Otro tipo de contenido inapropiado' }
];

const FeedMenu = ({ 
  poll, 
  onNotInterested, 
  onHideUser, 
  onToggleNotifications, 
  onReport,
  className = "",
  isNotificationEnabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportCategory, setSelectedReportCategory] = useState(null);
  const [reportComment, setReportComment] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleNotInterested = async () => {
    try {
      await onNotInterested?.(poll.id);
      toast({
        title: "Contenido ocultado",
        description: "Este tipo de contenido aparecerá menos en tu feed",
        duration: 3000,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo ocultar el contenido",
        variant: "destructive",
        duration: AppConfig.TOAST_DURATION,
      });
    }
  };

  const handleHideUser = async () => {
    try {
      const authorUsername = poll.author?.username || poll.authorUser?.username || 'usuario';
      await onHideUser?.(poll.author?.id || poll.authorUser?.id || poll.author?.username);
      toast({
        title: "Usuario ocultado",
        description: `Ya no verás contenido de @${authorUsername}`,
        duration: 3000,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error", 
        description: "No se pudo ocultar al usuario",
        variant: "destructive",
        duration: AppConfig.TOAST_DURATION,
      });
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const authorUsername = poll.author?.username || poll.authorUser?.username || 'usuario';
      await onToggleNotifications?.(poll.author?.id || poll.authorUser?.id || poll.author?.username);
      toast({
        title: isNotificationEnabled ? "Notificaciones desactivadas" : "Notificaciones activadas",
        description: isNotificationEnabled 
          ? `Ya no recibirás notificaciones de @${authorUsername}`
          : `Recibirás notificaciones cuando @${authorUsername} publique contenido`,
        duration: 3000,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las notificaciones",
        variant: "destructive", 
        duration: AppConfig.TOAST_DURATION,
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReportCategory) {
      toast({
        title: "Selecciona una categoría",
        description: "Debes seleccionar el tipo de problema",
        variant: "destructive",
        duration: AppConfig.TOAST_DURATION,
      });
      return;
    }

    setIsSubmittingReport(true);
    try {
      await onReport?.(poll.id, {
        category: selectedReportCategory,
        comment: reportComment.trim(),
        reportedBy: user?.id,
        pollAuthor: poll.author?.id || poll.authorUser?.id,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener la comunidad segura",
        duration: 3000,
      });
      
      // Reset state
      setShowReportModal(false);
      setSelectedReportCategory(null);
      setReportComment('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte. Inténtalo de nuevo",
        variant: "destructive",
        duration: AppConfig.TOAST_DURATION,
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="relative">
      {/* Menu Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-center text-white hover:text-gray-300 hover:scale-105 transition-all duration-200 h-auto p-2 rounded-lg bg-black/20 backdrop-blur-sm ${className}`}
      >
        <MoreHorizontal className="w-5 h-5" />
      </Button>

      {/* Menu Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-600/50 overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-600/50">
              <h3 className="text-white font-medium text-sm">Opciones del contenido</h3>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              {/* No me interesa */}
              <button
                onClick={handleNotInterested}
                className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 flex items-center gap-3"
              >
                <EyeOff className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm font-medium">No me interesa</div>
                  <div className="text-gray-400 text-xs">Este contenido aparecerá menos</div>
                </div>
              </button>

              {/* Ocultar usuario */}
              <button
                onClick={handleHideUser}
                className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 flex items-center gap-3"
              >
                <UserX className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm font-medium">Ocultar usuario</div>
                  <div className="text-gray-400 text-xs">No mostrar contenido de este usuario</div>
                </div>
              </button>

              {/* Activar/Desactivar notificaciones */}
              <button
                onClick={handleToggleNotifications}
                className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors duration-200 flex items-center gap-3"
              >
                {isNotificationEnabled ? (
                  <BellOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Bell className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="text-white text-sm font-medium">
                    {isNotificationEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {isNotificationEnabled 
                      ? 'Dejar de recibir alertas de este usuario'
                      : 'Recibir alertas cuando publique contenido'
                    }
                  </div>
                </div>
              </button>

              {/* Separador */}
              <div className="my-2 border-t border-gray-600/50" />

              {/* Reportar */}
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-red-900/30 transition-colors duration-200 flex items-center gap-3"
              >
                <Flag className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-red-400 text-sm font-medium">Reportar</div>
                  <div className="text-gray-400 text-xs">Contenido inapropiado o spam</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowReportModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-900 rounded-xl shadow-2xl border border-gray-600/50 w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
              <h2 className="text-xl font-bold text-white">Reportar contenido</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-white font-medium mb-4">¿Cuál es el problema?</h3>
                <div className="space-y-2">
                  {REPORT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedReportCategory(category.id)}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        selectedReportCategory === category.id
                          ? 'border-red-500 bg-red-500/10 text-white'
                          : 'border-gray-600/50 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-sm text-gray-400 mt-1">{category.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Proporciona más información sobre el problema..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {reportComment.length}/500 caracteres
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowReportModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={isSubmittingReport}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!selectedReportCategory || isSubmittingReport}
                >
                  {isSubmittingReport ? 'Enviando...' : 'Enviar reporte'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedMenu;