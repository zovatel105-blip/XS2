import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { 
  ArrowLeft, Settings, User, Shield, Bell, Eye, MessageCircle, 
  Lock, LogOut, Loader2, Save
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
    is_public: true,
    allow_messages: true
  });
  const [loading, setLoading] = useState(false);
  const [modalsOpen, setModalsOpen] = useState({
    editProfile: false,
    changePassword: false
  });

  useEffect(() => {
    if (user) {
      setSettings({
        is_public: user.is_public ?? true,
        allow_messages: user.allow_messages ?? true
      });
    }
  }, [user]);

  const handleSettingsChange = async (field, value) => {
    setLoading(true);
    
    try {
      const response = await apiRequest('/auth/settings', {
        method: 'PUT',
        body: JSON.stringify({ [field]: value })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setSettings(prev => ({ ...prev, [field]: value }));
        
        toast({
          title: "Configuración actualizada",
          description: "Los cambios se han guardado exitosamente",
          variant: "default"
        });

        // Refresh user data
        await refreshUser();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error al actualizar",
          description: errorData.detail || "No se pudo actualizar la configuración",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
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

          {/* Notifications Settings - Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
                <p className="text-gray-600">
                  Las configuraciones de notificaciones estarán disponibles en una futura actualización
                </p>
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