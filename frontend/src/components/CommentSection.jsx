import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Loader2, AlertCircle, RefreshCw, Send, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
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

  if (!pollId) {
    return null;
  }

  return (
    <motion.div 
      className="comment-section bg-white rounded-2xl overflow-hidden"
      style={{ maxHeight }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header minimalista - solo mostrar cuando showHeader = true */}
      {showHeader && (
        <div className="comment-header p-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Comentarios</h3>
                {comments.length > 0 && (
                  <p className="text-sm text-gray-500">{comments.length} comentario{comments.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadComments(0, false)}
                disabled={loading}
                className="h-10 w-10 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <RefreshCw className={cn("w-5 h-5 text-gray-500", loading && "animate-spin")} />
              </button>
              
              {user && (
                <button
                  onClick={() => setShowNewCommentForm(!showNewCommentForm)}
                  className={cn(
                    "px-5 py-2 rounded-lg font-medium transition-all duration-200",
                    showNewCommentForm 
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  )}
                >
                  {showNewCommentForm ? (
                    'Cancelar'
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Comentar
                    </div>
                  )}
                </button>
              )}
              
              {!user && (
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span>Inicia sesión para comentar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de comentarios minimalista */}
      <div className="comment-list overflow-y-auto flex-1 bg-white" style={{ maxHeight: `calc(${maxHeight} - 140px)` }}>
        {error && (
          <motion.div 
            className="error-message p-4 m-4 bg-red-50 border border-red-200 rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button
                onClick={() => loadComments(0, false)}
                className="h-8 px-3 text-red-700 hover:text-red-800 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </motion.div>
        )}
        
        {loading && comments.length === 0 ? (
          <div className="loading-state p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="font-medium">Cargando comentarios...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-state flex items-center justify-center min-h-[400px] p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Todavía no hay comentarios</h3>
              <p className="text-gray-500 text-base">
                Inicia una conversación.
              </p>
            </div>
          </div>
        ) : (
          <div className="comments-container px-4 py-2 space-y-1">
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
      
      {/* Área de comentario flotante estilo Instagram */}
      {!showHeader && user && (
        <div className="sticky bottom-0 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user.avatar_url} alt={user.username} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {showNewCommentForm ? (
              <div className="flex-1">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const content = e.target.content.value.trim();
                    if (!content) return;
                    
                    try {
                      await handleAddComment(content);
                      e.target.reset();
                      setShowNewCommentForm(false);
                    } catch (error) {
                      // Error ya manejado en handleAddComment
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="content"
                    type="text"
                    placeholder="Añade un comentario..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-gray-300"
                    maxLength={500}
                    autoFocus
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="text-blue-500 hover:text-blue-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enviando...' : 'Publicar'}
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCommentForm(true)}
                className="flex-1 text-left px-3 py-2 text-gray-400 text-sm"
              >
                Añade un comentario...
              </button>
            )}
            
            <button className="text-gray-400 hover:text-gray-600 text-sm font-semibold">
              GIF
            </button>
          </div>
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