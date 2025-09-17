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
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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

const PostManagementMenu = ({ poll, onUpdate, onDelete, currentUser }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(poll.title || '');
  const [editDescription, setEditDescription] = useState(poll.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Only show menu for post owner
  if (!currentUser || poll.user_id !== currentUser.id) {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-50 bg-black/70 hover:bg-black/80 active:bg-black/90 text-white rounded-full w-10 h-10 p-0 shadow-lg border border-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 z-50 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-2">
          {/* Edición */}
          <DropdownMenuItem 
            onClick={() => setShowEditDialog(true)}
            className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5 mr-3" />
            Editar título/descripción
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Organización */}
          <DropdownMenuItem 
            onClick={handlePin} 
            disabled={isLoading}
            className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Pin className="w-5 h-5 mr-3" />
            {poll.is_pinned ? 'Desanclar del perfil' : 'Fijar en perfil'}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleArchive} disabled={isLoading}>
            <Archive className="w-4 h-4 mr-2" />
            {poll.is_archived ? 'Desarchivar publicación' : 'Archivar publicación'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Privacidad */}
          <DropdownMenuItem onClick={handlePrivacy} disabled={isLoading}>
            {poll.is_private ? (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Hacer publicación pública
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Hacer publicación privada
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Eliminar */}
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar publicación
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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