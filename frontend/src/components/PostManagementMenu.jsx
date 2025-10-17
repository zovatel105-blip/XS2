import React, { useState } from 'react';
import { 
  MoreVertical, 
  Edit, 
  Pin, 
  Archive, 
  Globe, 
  Lock, 
  Trash2, 
  X 
} from 'lucide-react';
import '../styles/PostManagement.css';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';

const PostManagementMenu = ({ poll, onUpdate, onDelete, currentUser, isOwnProfile, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(poll.title || '');
  const [editDescription, setEditDescription] = useState(poll.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Show menu only in own profile - more reliable than ID matching
  if (!currentUser || !isOwnProfile) {
    return null;
  }

  const handleEdit = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "El título no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedPoll = {
        ...poll,
        title: editTitle.trim(),
        description: editDescription.trim()
      };
      
      await onUpdate(poll.id, updatedPoll);
      setShowEditDialog(false);
      
      toast({
        title: "Éxito",
        description: "Publicación editada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo editar la publicación",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async () => {
    setIsLoading(true);
    try {
      const updatedPoll = {
        ...poll,
        is_pinned: !poll.is_pinned
      };
      
      await onUpdate(poll.id, updatedPoll);
      
      toast({
        title: "Éxito",
        description: poll.is_pinned ? "Publicación desanclada" : "Publicación anclada en el perfil"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo anclar la publicación",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const updatedPoll = {
        ...poll,
        is_archived: !poll.is_archived
      };
      
      await onUpdate(poll.id, updatedPoll);
      
      toast({
        title: "Éxito",
        description: poll.is_archived ? "Publicación desarchivada" : "Publicación archivada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo archivar la publicación",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacy = async () => {
    setIsLoading(true);
    try {
      const updatedPoll = {
        ...poll,
        is_private: !poll.is_private
      };
      
      await onUpdate(poll.id, updatedPoll);
      
      toast({
        title: "Éxito",
        description: poll.is_private ? "Publicación hecha pública" : "Publicación hecha privada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la privacidad",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(poll.id);
      setShowDeleteDialog(false);
      
      toast({
        title: "Éxito",
        description: "Publicación eliminada permanentemente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Menu Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={className || "post-management-trigger absolute top-1 right-1 z-[9999] bg-white/90 hover:bg-white active:bg-gray-100 text-gray-800 rounded-full w-12 h-12 p-0 shadow-xl border-2 border-gray-300 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"}
        style={!className ? { 
          position: 'absolute',
          top: '4px',
          right: '4px',
          zIndex: 99999
        } : {}}
      >
        <MoreVertical className="post-management-icon w-6 h-6" />
      </button>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Bottom Sheet Content */}
          <div className="fixed bottom-0 left-0 right-0 z-[101] animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-w-lg mx-auto">
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Menu Options */}
              <div className="py-2">
                {/* Editar título/descripción */}
                <button
                  onClick={() => {
                    setShowEditDialog(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 flex items-center gap-4"
                >
                  <Edit className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <div className="text-gray-900 text-base font-medium">Editar título/descripción</div>
                </button>

                {/* Separador */}
                <div className="my-2 border-t border-gray-100" />

                {/* Fijar en perfil */}
                <button
                  onClick={() => {
                    handlePin();
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 flex items-center gap-4 disabled:opacity-50"
                >
                  <Pin className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <div className="text-gray-900 text-base font-medium">
                    {poll.is_pinned ? 'Desanclar del perfil' : 'Fijar en perfil'}
                  </div>
                </button>

                {/* Archivar publicación */}
                <button
                  onClick={() => {
                    handleArchive();
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 flex items-center gap-4 disabled:opacity-50"
                >
                  <Archive className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <div className="text-gray-900 text-base font-medium">
                    {poll.is_archived ? 'Desarchivar publicación' : 'Archivar publicación'}
                  </div>
                </button>

                {/* Separador */}
                <div className="my-2 border-t border-gray-100" />

                {/* Hacer publicación privada/pública */}
                <button
                  onClick={() => {
                    handlePrivacy();
                    setIsOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 flex items-center gap-4 disabled:opacity-50"
                >
                  {poll.is_private ? (
                    <>
                      <Globe className="w-6 h-6 text-gray-600 flex-shrink-0" />
                      <div className="text-gray-900 text-base font-medium">Hacer publicación pública</div>
                    </>
                  ) : (
                    <>
                      <Lock className="w-6 h-6 text-gray-600 flex-shrink-0" />
                      <div className="text-gray-900 text-base font-medium">Hacer publicación privada</div>
                    </>
                  )}
                </button>

                {/* Separador */}
                <div className="my-2 border-t border-gray-100" />

                {/* Eliminar publicación */}
                <button
                  onClick={() => {
                    setShowDeleteDialog(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-6 py-4 text-left hover:bg-red-50 active:bg-red-100/50 transition-colors duration-150 flex items-center gap-4"
                >
                  <Trash2 className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div className="text-red-500 text-base font-medium">Eliminar publicación</div>
                </button>
              </div>
              
              {/* Safe Area Bottom Padding (for mobile notch/home bar) */}
              <div className="h-6" />
            </div>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar publicación</DialogTitle>
            <DialogDescription>
              Modifica el título y descripción de tu publicación.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título/Pregunta</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="¿Cuál es tu pregunta?"
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {editTitle.length}/200 caracteres
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Añade contexto o detalles..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                {editDescription.length}/500 caracteres
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>¿Eliminar publicación?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La publicación será eliminada permanentemente
              junto con todos sus votos y comentarios.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostManagementMenu;