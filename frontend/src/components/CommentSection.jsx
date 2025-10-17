import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader2, AlertCircle, RefreshCw, Send, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import commentService from '../services/commentService';
import { cn } from '../lib/utils';
import Comment from './Comment';

const CommentSection = ({ 
  pollId, 
  isVisible = true, 
  maxHeight = "600px",
  showHeader = true 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Cargar comentarios
  const loadComments = async (pageNum = 0, append = false) => {
    if (!pollId || loading || !isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newComments = await commentService.getCommentsForFrontend(pollId, 20, pageNum * 20);
      
      if (append) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      
      setHasMore(newComments.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error al cargar comentarios. Intenta nuevamente.');
      toast({
        title: "Error al cargar comentarios",
        description: err.message || "Intenta recargar la página",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar más comentarios
  const loadMoreComments = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  };

  // Agregar nuevo comentario con optimistic UI
  const handleAddComment = async (content, parentId = null) => {
    if (!content.trim() || submitting || !isAuthenticated) return;
    
    setSubmitting(true);
    
    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      },
      created_at: new Date().toISOString(),
      likes_count: 0,
      replies: [],
      parent_id: parentId,
      is_liked: false,
      status: 'sending' // Mark as sending
    };
    
    // Optimistic update
    if (parentId) {
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...comment.replies, optimisticComment]
          };
        }
        return comment;
      }));
    } else {
      setComments(prev => [optimisticComment, ...prev]);
    }
    
    try {
      const newComment = await commentService.addCommentForFrontend(pollId, content.trim(), parentId);
      
      // Replace optimistic comment with real one
      if (parentId) {
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === optimisticComment.id 
                  ? { ...newComment, status: 'sent' }
                  : reply
              )
            };
          }
          return comment;
        }));
      } else {
        setComments(prev => prev.map(comment => 
          comment.id === optimisticComment.id 
            ? { ...newComment, status: 'sent' }
            : comment
        ));
      }
      
      setShowNewCommentForm(false);
      
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se ha publicado correctamente",
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      
      // Rollback optimistic update
      if (parentId) {
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== optimisticComment.id)
            };
          }
          return comment;
        }));
      } else {
        setComments(prev => prev.filter(comment => comment.id !== optimisticComment.id));
      }
      
      toast({
        title: "Error al agregar comentario",
        description: err.message || "No se pudo agregar el comentario. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar like de comentario
  const handleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await commentService.toggleCommentLike(commentId);
      
      // Actualizar el estado local
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            userLiked: result.liked,
            likes: result.likes
          };
        }
        // También actualizar en replies
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId 
              ? { ...reply, userLiked: result.liked, likes: result.likes }
              : reply
          )
        };
      }));
      
      toast({
        title: result.liked ? "¡Te gusta!" : "Like removido",
        description: result.liked ? "Has dado like a este comentario" : "Ya no te gusta este comentario",
      });
    } catch (err) {
      console.error('Error liking comment:', err);
      toast({
        title: "Error",
        description: err.message || "No se pudo procesar el like. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Responder a comentario
  const handleReplyToComment = async (parentCommentId, content) => {
    return await handleAddComment(content, parentCommentId);
  };

  // Editar comentario
  const handleEditComment = async (commentId, content) => {
    if (!isAuthenticated) return;
    
    try {
      await commentService.updateComment(commentId, content);
      // Recargar comentarios para mostrar la edición
      loadComments(0, false);
      toast({
        title: "Comentario editado",
        description: "Tu comentario se ha actualizado correctamente",
      });
    } catch (err) {
      console.error('Error editing comment:', err);
      toast({
        title: "Error al editar comentario",
        description: err.message || "No se pudo editar el comentario. Intenta de nuevo.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated) return;
    
    try {
      await commentService.deleteComment(commentId);
      // Recargar comentarios para actualizar la vista
      loadComments(0, false);
      toast({
        title: "Comentario eliminado",
        description: "El comentario se ha eliminado correctamente",
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast({
        title: "Error al eliminar comentario",
        description: err.message || "No se pudo eliminar el comentario. Intenta de nuevo.",
        variant: "destructive",
      });
      throw err;
    }
  };



  // Cargar comentarios al montar el componente
  useEffect(() => {
    if (pollId && isVisible) {
      loadComments(0, false);
    }
  }, [pollId, isVisible]);

  // Formulario para nuevo comentario - Diseño minimalista
  const NewCommentForm = () => (
    <motion.div
      className="new-comment-form p-3 sm:p-6 bg-white border-b border-gray-100"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <form 
        onSubmit={async (e) => {
          e.preventDefault();
          const content = e.target.content.value.trim();
          if (!content) return;
          
          try {
            await handleAddComment(content);
            e.target.reset();
          } catch (error) {
            // Error ya manejado en handleAddComment
          }
        }}
        className="space-y-3 sm:space-y-4"
      >
        <div className="relative">
          <textarea
            name="content"
            placeholder="Escribe un comentario..."
            className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all duration-200 placeholder:text-gray-400 bg-white text-sm sm:text-base"
            rows={3}
            maxLength={500}
            required
          />
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400 px-2 py-1">
            {500}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowNewCommentForm(false)}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Comentar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );

  if (!pollId) {
    return null;
  }

  return (
    <motion.div 
      className="comment-section bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl overflow-hidden shadow-lg"
      style={{ maxHeight }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header moderno - solo mostrar cuando showHeader = true */}
      {showHeader && (
        <div className="comment-header p-6 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 border-b border-gray-100 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Comentarios</h3>
                {comments.length > 0 && (
                  <p className="text-sm text-gray-500">{comments.length} comentario{comments.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadComments(0, false)}
                disabled={loading}
                className="h-10 px-4 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              
              {user && (
                <Button
                  size="sm"
                  onClick={() => setShowNewCommentForm(!showNewCommentForm)}
                  className={cn(
                    "px-5 py-2 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg",
                    showNewCommentForm 
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  )}
                >
                  {showNewCommentForm ? (
                    'Cancelar'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Comentar
                    </>
                  )}
                </Button>
              )}
              
              {!user && (
                <div className="text-sm text-gray-500 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                  <span>Inicia sesión para comentar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Formulario de nuevo comentario */}
      <AnimatePresence>
        {showNewCommentForm && <NewCommentForm />}
      </AnimatePresence>
      
      {/* Lista de comentarios con diseño moderno */}
      <div className="comment-list overflow-y-auto flex-1 bg-gradient-to-b from-white to-gray-50/30" style={{ maxHeight: `calc(${maxHeight} - 140px)` }}>
        {error && (
          <motion.div 
            className="error-message p-4 m-4 bg-red-50 border border-red-200 rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadComments(0, false)}
                className="h-8 text-red-700 hover:text-red-800 hover:bg-red-100 rounded-xl"
              >
                Reintentar
              </Button>
            </div>
          </motion.div>
        )}
        
        {loading && comments.length === 0 ? (
          <div className="loading-state p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-gray-500">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
              <span className="font-medium">Cargando comentarios...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-state p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Sé el primero!</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              No hay comentarios aún. Inicia la conversación y comparte tu perspectiva.
            </p>
            {user && (
              <Button
                onClick={() => setShowNewCommentForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Escribir primer comentario
              </Button>
            )}
          </div>
        ) : (
          <div className="comments-container p-3 sm:p-6 space-y-4 sm:space-y-6">
            <AnimatePresence mode="popLayout">
              {comments.map((comment, index) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={handleReplyToComment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onLike={handleCommentLike}
                  depth={0}
                  maxDepth={3}
                />
              ))}
            </AnimatePresence>
            
            {/* Botón cargar más - Diseño moderno */}
            {hasMore && (
              <div className="load-more p-6 text-center border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-8 py-3 rounded-2xl font-medium transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Mostrar más comentarios'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Área de comentario flotante moderna */}
      {!showHeader && user && !showNewCommentForm && (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 p-3 sm:p-4">
          <Button
            onClick={() => setShowNewCommentForm(true)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 sm:py-4 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Escribir comentario</span>
          </Button>
        </div>
      )}
      
      {/* Aviso para usuarios no autenticados - Diseño moderno */}
      {!user && (
        <div className="auth-notice p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/60">
          <div className="text-center">
            <p className="text-amber-800 font-medium mb-2 text-sm sm:text-base">
              ¡Únete a la conversación!
            </p>
            <p className="text-xs sm:text-sm text-amber-700">
              <a href="/login" className="font-semibold hover:underline text-indigo-600 hover:text-indigo-700 transition-colors">
                Inicia sesión
              </a> para comentar y conectar con la comunidad
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CommentSection;