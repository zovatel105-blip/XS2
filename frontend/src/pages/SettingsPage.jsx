import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { 
  ArrowLeft, Settings, User, Shield, Bell, Eye, MessageCircle, 
  Lock, LogOut, Loader2, Save, Monitor, Key, Users, Share, Globe
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, apiRequest, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // Privacy settings
    is_public: true,
    allow_messages: true,
    
    // Notification settings
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: true,
    notifications_likes: true,
    notifications_comments: true,
    notifications_follows: true,
    notifications_mentions: true,
    
    // Discovery & Interaction settings
    discoverable: true,
    require_follow_approval: false,
    allow_comments: true,
    allow_shares: true,
    
    // Language & Accessibility settings
    app_language: 'es',
    dark_mode: false,
    large_text: false,
    
    // Account settings
    two_factor_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [modalsOpen, setModalsOpen] = useState({
    editProfile: false,
    changePassword: false
  });

  useEffect(() => {
    if (user) {
      setSettings({
        // Privacy settings
        is_public: user.is_public ?? true,
        allow_messages: user.allow_messages ?? true,
        
        // Notification settings
        notifications_enabled: user.notifications_enabled ?? true,
        email_notifications: user.email_notifications ?? true,
        push_notifications: user.push_notifications ?? true,
        notifications_likes: user.notifications_likes ?? true,
        notifications_comments: user.notifications_comments ?? true,
        notifications_follows: user.notifications_follows ?? true,
        notifications_mentions: user.notifications_mentions ?? true,
        
        // Discovery & Interaction settings
        discoverable: user.discoverable ?? true,
        require_follow_approval: user.require_follow_approval ?? false,
        allow_comments: user.allow_comments ?? true,
        allow_shares: user.allow_shares ?? true,
        
        // Language & Accessibility settings
        app_language: user.app_language ?? 'es',
        dark_mode: user.dark_mode ?? false,
        large_text: user.large_text ?? false,
        
        // Account settings
        two_factor_enabled: user.two_factor_enabled ?? false
      });
    }
  }, [user]);

  const handleSettingsChange = async (field, value) => {
    setLoading(true);
    
    try {
      const updatedUser = await apiRequest('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
      });

      // Update local settings state
      setSettings(prev => ({ ...prev, [field]: value }));
      
      // Update user context with new data
      await refreshUser();
      
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado exitosamente",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error de servidor",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/');
  };

  const handleProfileUpdate = async (updatedUser) => {
    // The EditProfileModal already updates the user state via updateUser()
    // This function can be used for any additional UI updates if needed
    console.log('Profile updated successfully from settings:', updatedUser);
  };

  const openModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Configuraciones
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Editar Perfil</h3>
                  <p className="text-sm text-gray-600">
                    Cambia tu nombre, biografía y foto de perfil
                  </p>
                </div>
                <Button
                  onClick={() => openModal('editProfile')}
                  variant="outline"
                  size="sm"
                  className="hover:bg-purple-50 hover:border-purple-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Cambiar Contraseña</h3>
                  <p className="text-sm text-gray-600">
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </p>
                </div>
                <Button
                  onClick={() => openModal('changePassword')}
                  variant="outline"
                  size="sm"
                  className="hover:bg-purple-50 hover:border-purple-300"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Perfil Público</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permite que otros usuarios vean tu perfil y estadísticas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.is_public}
                  onCheckedChange={(value) => handleSettingsChange('is_public', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Permitir Mensajes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Permite que otros usuarios te envíen mensajes directos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.allow_messages}
                  onCheckedChange={(value) => handleSettingsChange('allow_messages', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Notificaciones Generales</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Activa o desactiva todas las notificaciones
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications_enabled}
                  onCheckedChange={(value) => handleSettingsChange('notifications_enabled', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              {settings.notifications_enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Notificaciones por Email</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Recibe notificaciones importantes por correo electrónico
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(value) => handleSettingsChange('email_notifications', value)}
                      disabled={loading}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Notificaciones Push</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Recibe notificaciones push en tu dispositivo
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={(value) => handleSettingsChange('push_notifications', value)}
                      disabled={loading}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>

                  <div className="space-y-4 pl-8 border-l-2 border-gray-100">
                    <h4 className="font-medium text-gray-900 text-sm">Tipos de notificaciones:</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm">Me gusta</h5>
                        <p className="text-xs text-gray-600">Cuando alguien da like a tu contenido</p>
                      </div>
                      <Switch
                        checked={settings.notifications_likes}
                        onCheckedChange={(value) => handleSettingsChange('notifications_likes', value)}
                        disabled={loading}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm">Comentarios</h5>
                        <p className="text-xs text-gray-600">Cuando alguien comenta tu contenido</p>
                      </div>
                      <Switch
                        checked={settings.notifications_comments}
                        onCheckedChange={(value) => handleSettingsChange('notifications_comments', value)}
                        disabled={loading}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm">Nuevos seguidores</h5>
                        <p className="text-xs text-gray-600">Cuando alguien te empieza a seguir</p>
                      </div>
                      <Switch
                        checked={settings.notifications_follows}
                        onCheckedChange={(value) => handleSettingsChange('notifications_follows', value)}
                        disabled={loading}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm">Menciones</h5>
                        <p className="text-xs text-gray-600">Cuando alguien te menciona en un post</p>
                      </div>
                      <Switch
                        checked={settings.notifications_mentions}
                        onCheckedChange={(value) => handleSettingsChange('notifications_mentions', value)}
                        disabled={loading}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance & Data Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5" />
                Rendimiento y Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Calidad de Video</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ajusta la calidad de reproducción de videos
                    </p>
                  </div>
                </div>
                <select 
                  value={settings.video_quality || 'auto'}
                  onChange={(e) => handleSettingsChange('video_quality', e.target.value)}
                  disabled={loading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="auto">Automática</option>
                  <option value="high">Alta (HD)</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja (Ahorro datos)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Solo WiFi</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Reproducir videos solo cuando esté conectado a WiFi
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.wifi_only}
                  onCheckedChange={(value) => handleSettingsChange('wifi_only', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Save className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Ahorro de Batería</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Reducir animaciones y efectos para ahorrar batería
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.battery_saver}
                  onCheckedChange={(value) => handleSettingsChange('battery_saver', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Cache Automático</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Guardar contenido en cache para acceso offline
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.auto_cache}
                  onCheckedChange={(value) => handleSettingsChange('auto_cache', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Sincronización en Segundo Plano</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sincronizar contenido cuando la app está cerrada
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.background_sync}
                  onCheckedChange={(value) => handleSettingsChange('background_sync', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Language & Accessibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5" />
                Idioma y Accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Idioma de la Aplicación</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Selecciona tu idioma preferido
                    </p>
                  </div>
                </div>
                <select 
                  value={settings.app_language || 'es'}
                  onChange={(e) => handleSettingsChange('app_language', e.target.value)}
                  disabled={loading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Modo Oscuro</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Cambiar a tema oscuro para reducir fatiga visual
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.dark_mode}
                  onCheckedChange={(value) => handleSettingsChange('dark_mode', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Texto Grande</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Aumentar el tamaño del texto para mejor legibilidad
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.large_text}
                  onCheckedChange={(value) => handleSettingsChange('large_text', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Seguridad de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Autenticación de Dos Factores</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Agrega una capa extra de seguridad a tu cuenta
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.two_factor_enabled}
                  onCheckedChange={(value) => handleSettingsChange('two_factor_enabled', value)}
                  disabled={loading}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>
          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h3 className="font-medium text-red-900">Cerrar Sesión</h3>
                    <p className="text-sm text-red-700">
                      Sal de tu cuenta en este dispositivo
                    </p>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Salir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-500 space-y-2">
                <p>Usuario: <span className="font-medium">@{user?.username}</span></p>
                <p>Email: <span className="font-medium">{user?.email}</span></p>
                <p className="text-xs">
                  Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={modalsOpen.editProfile}
        onClose={() => closeModal('editProfile')}
        onProfileUpdate={handleProfileUpdate}
      />

      <ChangePasswordModal
        isOpen={modalsOpen.changePassword}
        onClose={() => closeModal('changePassword')}
      />
    </div>
  );
};

export default SettingsPage;