import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  ArrowLeft, ChevronRight, User, Shield, Bell, Eye, MessageCircle, 
  Lock, LogOut, Save, Monitor, Key, Globe, Moon, Sun, Volume2, Smartphone,
  Download, Wifi, BatteryLow, Languages, Type, HelpCircle, Info, Mail, Settings,
  Mic, UserCircle, UserCircle2
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import voiceService, { VOICE_TYPES } from '../services/voiceService';

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
    
    // Performance & Data settings
    video_quality: 'auto',
    wifi_only: false,
    battery_saver: false,
    auto_cache: true,
    background_sync: true,
    
    // Language & Accessibility settings
    app_language: 'es',
    dark_mode: false,
    large_text: false,
    
    // Account settings
    two_factor_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [savingField, setSavingField] = useState(null);
  const [modalsOpen, setModalsOpen] = useState({
    editProfile: false,
    changePassword: false
  });

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState(() => voiceService.getPreferences());
  const [testingVoice, setTestingVoice] = useState(false);

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
        
        // Performance & Data settings
        video_quality: user.video_quality ?? 'auto',
        wifi_only: user.wifi_only ?? false,
        battery_saver: user.battery_saver ?? false,
        auto_cache: user.auto_cache ?? true,
        background_sync: user.background_sync ?? true,
        
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
    // Prevent multiple simultaneous updates to the same field
    if (savingField === field) {
      return;
    }

    // Optimistic update - update UI immediately
    const previousValue = settings[field];
    setSettings(prev => ({ ...prev, [field]: value }));
    setSavingField(field);
    
    try {
      // Use PUT for settings updates (backend endpoint)
      const settingsUpdate = { [field]: value };
      const updatedUser = await apiRequest('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsUpdate)
      });

      // Update user context with new data if needed
      if (updatedUser) {
        await refreshUser();
      }
      
      toast({
        title: "Configuración actualizada",
        description: `${getFieldDisplayName(field)} se ha guardado exitosamente`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error updating settings:', error);
      
      // Revert optimistic update on error
      setSettings(prev => ({ ...prev, [field]: previousValue }));
      
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo actualizar la configuración. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSavingField(null);
    }
  };

  // Helper function to get display name for field
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      is_public: 'Privacidad de perfil',
      allow_messages: 'Mensajes',
      notifications_enabled: 'Notificaciones',
      email_notifications: 'Notificaciones por email',
      push_notifications: 'Notificaciones push',
      dark_mode: 'Modo oscuro',
      large_text: 'Texto grande',
      video_quality: 'Calidad de video',
      wifi_only: 'Solo WiFi',
      battery_saver: 'Ahorro de batería'
    };
    return fieldNames[field] || field;
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
    console.log('Profile updated successfully from settings:', updatedUser);
  };

  const openModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModalsOpen(prev => ({ ...prev, [modalName]: false }));
  };

  // Voice settings handlers
  const handleVoiceTypeChange = (voiceType) => {
    const updated = voiceService.setPreferredVoiceType(voiceType);
    setVoiceSettings(updated);
    toast({
      title: "Voz actualizada",
      description: `Tipo de voz cambiado a ${voiceType === VOICE_TYPES.FEMALE ? 'Femenina' : voiceType === VOICE_TYPES.MALE ? 'Masculina' : 'Neutral'}`,
    });
  };

  const handleVoiceRateChange = (rate) => {
    const updated = voiceService.setVoiceParams({ rate: parseFloat(rate) });
    setVoiceSettings(updated);
  };

  const testVoice = async () => {
    if (testingVoice) return;
    setTestingVoice(true);
    
    // Textos de prueba en diferentes idiomas
    const testTexts = [
      "¡Hola! Esta es una prueba de voz en español.",
      "Hello! This is a voice test in English.",
      "Olá! Este é um teste de voz em português."
    ];
    
    const randomText = testTexts[Math.floor(Math.random() * testTexts.length)];
    
    await voiceService.speak(randomText, {
      onEnd: () => setTestingVoice(false),
      onError: () => setTestingVoice(false)
    });
  };

  // Componente para elementos de configuración con flecha
  const SettingsItem = ({ icon: Icon, title, description, onClick, rightElement, showChevron = false }) => (
    <div 
      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {rightElement}
        {showChevron && (
          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );

  // Componente para separadores de sección
  const SectionSeparator = () => (
    <div className="border-t border-gray-200 my-1" />
  );

  // Componente para títulos de sección
  const SectionTitle = ({ children }) => (
    <div className="px-4 py-3 bg-gray-50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {children}
      </h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header moderno y limpio */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            Configuración
          </h1>
        </div>
      </header>

      {/* Lista vertical limpia */}
      <div className="max-w-md mx-auto bg-white">
        
        {/* Sección: Cuenta */}
        <SectionTitle>Cuenta</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={User}
            title="Editar perfil"
            description="Nombre, foto, biografía"
            onClick={() => openModal('editProfile')}
            showChevron
          />
          <SettingsItem
            icon={Key}
            title="Cambiar contraseña"
            description="Actualizar contraseña"
            onClick={() => openModal('changePassword')}
            showChevron
          />
        </div>

        <SectionSeparator />

        {/* Sección: Privacidad */}
        <SectionTitle>Privacidad</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Globe}
            title="Perfil público"
            description="Permitir que otros vean tu perfil"
            rightElement={
              <Switch
                checked={settings.is_public}
                onCheckedChange={(value) => handleSettingsChange('is_public', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
          <SettingsItem
            icon={MessageCircle}
            title="Permitir mensajes"
            description="Recibir mensajes directos"
            rightElement={
              <Switch
                checked={settings.allow_messages}
                onCheckedChange={(value) => handleSettingsChange('allow_messages', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
        </div>

        <SectionSeparator />

        {/* Sección: Notificaciones */}
        <SectionTitle>Notificaciones</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Bell}
            title="Notificaciones"
            description="Activar todas las notificaciones"
            rightElement={
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={(value) => handleSettingsChange('notifications_enabled', value)}
                disabled={savingField === 'notifications_enabled'}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
          {settings.notifications_enabled && (
            <>
              <SettingsItem
                icon={Mail}
                title="Notificaciones por email"
                description="Recibir por correo electrónico"
                rightElement={
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(value) => handleSettingsChange('email_notifications', value)}
                    disabled={savingField === 'email_notifications'}
                    className="data-[state=checked]:bg-blue-600"
                  />
                }
              />
              <SettingsItem
                icon={Smartphone}
                title="Notificaciones push"
                description="Recibir en el dispositivo"
                rightElement={
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(value) => handleSettingsChange('push_notifications', value)}
                    disabled={savingField === 'push_notifications'}
                    className="data-[state=checked]:bg-blue-600"
                  />
                }
              />
            </>
          )}
        </div>

        <SectionSeparator />

        {/* Sección: Rendimiento */}
        <SectionTitle>Rendimiento</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Monitor}
            title="Calidad de video"
            description="Ajustar calidad de reproducción"
            rightElement={
              <select 
                value={settings.video_quality}
                onChange={(e) => handleSettingsChange('video_quality', e.target.value)}
                disabled={loading}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
              >
                <option value="auto">Auto</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            }
          />
          <SettingsItem
            icon={Wifi}
            title="Solo WiFi"
            description="Reproducir solo con WiFi"
            rightElement={
              <Switch
                checked={settings.wifi_only}
                onCheckedChange={(value) => handleSettingsChange('wifi_only', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
          <SettingsItem
            icon={BatteryLow}
            title="Ahorro de batería"
            description="Reducir animaciones"
            rightElement={
              <Switch
                checked={settings.battery_saver}
                onCheckedChange={(value) => handleSettingsChange('battery_saver', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
        </div>

        <SectionSeparator />

        {/* Sección: Apariencia */}
        <SectionTitle>Apariencia</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Languages}
            title="Idioma"
            description="Español"
            rightElement={
              <select 
                value={settings.app_language}
                onChange={(e) => handleSettingsChange('app_language', e.target.value)}
                disabled={loading}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
              </select>
            }
          />
          <SettingsItem
            icon={settings.dark_mode ? Moon : Sun}
            title="Modo oscuro"
            description="Tema oscuro para la interfaz"
            rightElement={
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={(value) => handleSettingsChange('dark_mode', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
          <SettingsItem
            icon={Type}
            title="Texto grande"
            description="Aumentar tamaño del texto"
            rightElement={
              <Switch
                checked={settings.large_text}
                onCheckedChange={(value) => handleSettingsChange('large_text', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
        </div>

        <SectionSeparator />

        {/* Sección: Voz VS */}
        <SectionTitle>Voz de VS</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Mic}
            title="Tipo de voz"
            description="La voz se adapta automáticamente al idioma"
            rightElement={
              <select 
                value={voiceSettings.voiceType}
                onChange={(e) => handleVoiceTypeChange(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
              >
                <option value={VOICE_TYPES.FEMALE}>Femenina</option>
                <option value={VOICE_TYPES.MALE}>Masculina</option>
                <option value={VOICE_TYPES.NEUTRAL}>Neutral</option>
              </select>
            }
          />
          <SettingsItem
            icon={Volume2}
            title="Velocidad de voz"
            description="Ajustar velocidad de lectura"
            rightElement={
              <select 
                value={voiceSettings.rate}
                onChange={(e) => handleVoiceRateChange(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-none focus:outline-none"
              >
                <option value="0.8">Lenta</option>
                <option value="1.0">Normal</option>
                <option value="1.1">Rápida</option>
                <option value="1.3">Muy rápida</option>
              </select>
            }
          />
          <div 
            className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${testingVoice ? 'opacity-50' : ''}`}
            onClick={testVoice}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Globe className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Probar voz</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {testingVoice ? 'Reproduciendo...' : 'Escuchar una muestra con detección de idioma'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {testingVoice ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
              )}
            </div>
          </div>
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-700">
              💡 La voz detecta automáticamente el idioma del texto (español, inglés, portugués, francés, etc.) y usa tu tipo de voz preferido en cada idioma.
            </p>
          </div>
        </div>

        <SectionSeparator />

        {/* Sección: Seguridad */}
        <SectionTitle>Seguridad</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={Shield}
            title="Autenticación de dos factores"
            description="Seguridad adicional"
            rightElement={
              <Switch
                checked={settings.two_factor_enabled}
                onCheckedChange={(value) => handleSettingsChange('two_factor_enabled', value)}
                disabled={loading}
                className="data-[state=checked]:bg-blue-600"
              />
            }
          />
        </div>

        <SectionSeparator />

        {/* Sección: Soporte */}
        <SectionTitle>Soporte</SectionTitle>
        <div className="bg-white">
          <SettingsItem
            icon={HelpCircle}
            title="Centro de ayuda"
            description="Preguntas frecuentes y soporte"
            showChevron
          />
          <SettingsItem
            icon={Info}
            title="Acerca de"
            description="Versión de la aplicación"
            showChevron
          />
        </div>

        <SectionSeparator />

        {/* Sección: Cuenta (Acciones críticas) */}
        <div className="bg-white mt-8">
          <div 
            className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
            onClick={handleLogout}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
                <p className="text-sm text-red-500 mt-0.5">Salir de tu cuenta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la cuenta */}
        <div className="px-4 py-6 text-center border-t border-gray-100 mt-8">
          <div className="space-y-1 text-xs text-gray-500">
            <p>@{user?.username}</p>
            <p>{user?.email}</p>
            <p>
              Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long'
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Modales */}
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