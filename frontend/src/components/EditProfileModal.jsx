import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { X, Save, User, Camera, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

const EditProfileModal = ({ isOpen, onClose, onProfileUpdate }) => {
  const { user, updateUser, apiRequest } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [isOpen, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty strings and unchanged values
      const updateData = {};
      if (formData.display_name.trim() !== (user.display_name || '')) {
        updateData.display_name = formData.display_name.trim();
      }
      if (formData.bio.trim() !== (user.bio || '')) {
        updateData.bio = formData.bio.trim();
      }
      if (formData.avatar_url.trim() !== (user.avatar_url || '')) {
        updateData.avatar_url = formData.avatar_url.trim();
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "Sin cambios",
          description: "No hay cambios que guardar",
          variant: "default"
        });
        setLoading(false);
        return;
      }

      const updatedUser = await updateUser(updateData);

      toast({
        title: "¡Perfil actualizado!",
        description: "Los cambios se han guardado exitosamente",
        variant: "default"
      });
      
      // Notify parent component of the update with the actual updated data
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Check if it's an API error with a detail message
      if (error.message && error.message.includes('API request failed')) {
        toast({
          title: "Error al actualizar",
          description: "Error del servidor. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error de conexión",
          description: error.message || "No se pudo conectar con el servidor",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Perfil
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-20 h-20 ring-2 ring-purple-200">
                <AvatarImage src={formData.avatar_url} alt="Preview" />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-xl font-bold">
                  {formData.display_name ? formData.display_name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-gray-600 text-center">
                Vista previa del avatar
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre de Usuario
              </label>
              <Input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Tu nombre de usuario"
                maxLength={50}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Máximo 50 caracteres
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Biografía
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Escribe algo sobre ti..."
                maxLength={160}
                rows={3}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500">
                {formData.bio.length}/160 caracteres
              </p>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                URL del Avatar
              </label>
              <Input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Ingresa la URL de tu imagen de perfil
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfileModal;