import { useEffect, useRef } from 'react';

/**
 * Hook para registrar vistas de publicaciones
 * Registra una vista después de que el elemento esté visible por ~2 segundos
 */
export const useViewTracking = (pollId, isActive = true) => {
  const viewRegisteredRef = useRef(new Set());
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Si no hay pollId o no está activo, no hacer nada
    if (!pollId || !isActive) {
      return;
    }

    // Si ya registramos la vista para este poll en esta sesión, no hacerlo de nuevo
    if (viewRegisteredRef.current.has(pollId)) {
      return;
    }

    // Registrar vista después de 2 segundos
    timeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Obtener o crear session_id para usuarios no autenticados
        let sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('session_id', sessionId);
        }

        const headers = {
          'Content-Type': 'application/json',
        };

        // Agregar session_id para usuarios no autenticados
        headers['X-Session-ID'] = sessionId;

        // Agregar token si está disponible
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/polls/${pollId}/view`,
          {
            method: 'POST',
            headers,
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Vista registrada para poll ${pollId}. Total vistas: ${data.total_views}`);
          // Marcar como registrado en esta sesión
          viewRegisteredRef.current.add(pollId);
        } else {
          console.warn(`⚠️ No se pudo registrar vista para poll ${pollId}:`, response.status);
        }
      } catch (error) {
        console.error(`❌ Error registrando vista para poll ${pollId}:`, error);
      }
    }, 2000); // 2 segundos

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pollId, isActive]);

  return null;
};

/**
 * Hook para registrar vistas con IntersectionObserver
 * Más preciso - solo cuenta cuando el elemento es visible en pantalla
 */
export const useViewTrackingWithObserver = (ref, pollId, threshold = 0.5) => {
  const viewRegisteredRef = useRef(new Set());
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!pollId || !ref.current) {
      return;
    }

    // Si ya registramos la vista para este poll, no hacerlo de nuevo
    if (viewRegisteredRef.current.has(pollId)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // El elemento está visible, iniciar contador de 2 segundos
            timeoutRef.current = setTimeout(async () => {
              try {
                const token = localStorage.getItem('token');
                
                // Obtener o crear session_id para usuarios no autenticados
                let sessionId = localStorage.getItem('session_id');
                if (!sessionId) {
                  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  localStorage.setItem('session_id', sessionId);
                }

                const headers = {
                  'Content-Type': 'application/json',
                };

                headers['X-Session-ID'] = sessionId;

                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(
                  `${process.env.REACT_APP_BACKEND_URL}/api/polls/${pollId}/view`,
                  {
                    method: 'POST',
                    headers,
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  console.log(`✅ Vista registrada para poll ${pollId}. Total vistas: ${data.total_views}`);
                  viewRegisteredRef.current.add(pollId);
                } else {
                  console.warn(`⚠️ No se pudo registrar vista para poll ${pollId}:`, response.status);
                }
              } catch (error) {
                console.error(`❌ Error registrando vista para poll ${pollId}:`, error);
              }
            }, 2000);
          } else {
            // El elemento ya no es visible, cancelar el contador
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        });
      },
      {
        threshold: threshold, // Elemento debe estar al menos 50% visible
      }
    );

    observer.observe(ref.current);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, [ref, pollId, threshold]);

  return null;
};
