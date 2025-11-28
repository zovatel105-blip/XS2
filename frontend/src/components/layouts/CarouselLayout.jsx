// ==========================
//  FULL FIXED CAROUSEL LAYOUT
//  by ChatGPT – optimized playback, fixed audio, fixed video ghost playback
// ==========================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Trophy } from 'lucide-react';
import audioManager from '../../services/AudioManager';

const CarouselLayout = ({
  poll,
  onVote,
  isActive,
  currentSlide: externalCurrentSlide,
  onSlideChange,
  onThumbnailChange,
  onAudioChange,
  optimizeVideo = false,
  renderPriority = 'medium',
  shouldUnload = false,
  isThumbnail = false // Nuevo prop para ocultar UI en miniaturas
}) => {

  const navigate = useNavigate();

  // === Tracking references for video DOM elements ===
  const videoRefs = useRef(new Map());

  // === Prevent audio race conditions ===
  const audioLoading = useRef(false);
  const currentSlideSafe = useRef(0);

  const totalSlides = poll.options?.length || 1;

  // === Slide state ===
  const [internalCurrentSlide, setInternalCurrentSlide] = useState(0);
  const currentSlide =
    externalCurrentSlide !== undefined ? externalCurrentSlide : internalCurrentSlide;
  const setCurrentSlide =
    onSlideChange || setInternalCurrentSlide;

  // === Touch swipe ===
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const mobile = window.innerWidth <= 768;

  // On poll change → reset slide
  useEffect(() => {
    setCurrentSlide(0);
    currentSlideSafe.current = 0;
  }, [poll.id]);

  useEffect(() => {
    currentSlideSafe.current = currentSlide;
  }, [currentSlide]);

  // ========== TOUCH HANDLERS ==========
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const diff = touchStart - touchEnd;

    if (diff > 50) setCurrentSlide((s) => (s + 1) % totalSlides);
    if (diff < -50) setCurrentSlide((s) => (s - 1 + totalSlides) % totalSlides);
  };

  // ========== AUDIO HANDLING ==========
  useEffect(() => {
    if (!isActive) {
      audioManager.stop();
      audioLoading.current = false;
      return;
    }

    const option = poll.options[currentSlide];
    if (!option) return;

    const extractedAudioId = option.extracted_audio_id;

    if (!extractedAudioId) {
      audioManager.stop();
      onAudioChange?.(null);
      // 🎨 Cuando no hay audio extraído, notificar thumbnail del video
      if (onThumbnailChange && option.thumbnail_url) {
        onThumbnailChange(option.thumbnail_url);
      }
      return;
    }

    const loadAndPlay = async () => {
      if (audioLoading.current) return;

      audioLoading.current = true;
      const slideOnStart = currentSlide;

      try {
        await audioManager.stop();

        // Fetch audio file
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/audio/${extractedAudioId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!res.ok) {
          audioLoading.current = false;
          return;
        }

        const data = await res.json();
        const audioData = data.audio || data;

        const audioUrl =
          audioData.public_url ||
          audioData.url ||
          audioData.preview_url;

        if (!audioUrl) {
          console.error('⚠ No audio URL found');
          audioLoading.current = false;
          return;
        }

        // 🎨 CORRECCIÓN IMPORTANTE: Usar cover_url del audio primero (igual que AudioDetailPage)
        // Prioridad: 1) audioData.cover_url, 2) option.thumbnail_url (fallback)
        const coverImage = audioData.cover_url || option.thumbnail_url;

        // Update thumbnail for MusicPlayer
        if (onThumbnailChange && coverImage) {
          console.log(`🖼️ Notificando cover para slide ${currentSlide}:`, coverImage);
          onThumbnailChange(coverImage);
        }

        // Update UI music player with complete audio object
        onAudioChange?.({
          id: audioData.id,
          title: audioData.title || 'Original Sound',
          artist: audioData.artist || poll.author?.display_name || 'Unknown',
          preview_url: audioUrl,
          cover: coverImage, // Usando la misma prioridad que definimos arriba
          isOriginal: true,
          source: 'User Upload'
        });

        // Prevent wrong slide playback
        if (currentSlideSafe.current !== slideOnStart) return;

        await audioManager.play(audioUrl, {
          startTime: 0,
          volume: 0.7,
          loop: true
        });

      } catch (err) {
        console.error('Audio error:', err);
      } finally {
        audioLoading.current = false;
      }
    };

    loadAndPlay();
  }, [currentSlide, isActive]);

  // ========== VIDEO SUPPRESSION FIX (THE IMPORTANT PART) ==========
  //
  // This ensures that:
  //   • Only the current slide's video can play (and always muted)
  //   • All other videos are FORCED to pause + reset
  //   • No ghost autoplay occurs
  //
  useEffect(() => {
    if (!poll.options) return;

    videoRefs.current.forEach((video, id) => {
      if (!video) return;

      const index = poll.options.findIndex((o) => o.id === id);
      const shouldPlay = isActive && index === currentSlide;

      if (shouldPlay) {
        video.pause();
        video.currentTime = 0;
        video.muted = true;

        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
      }
    });
  }, [currentSlide, isActive, poll.options]);

  // ========== WINNER + PERCENTAGE ==========
  const getPercentage = (votes) => {
    if (!poll.userVote || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const winningOption = poll.userVote
    ? poll.options.reduce((p, c) => (p.votes > c.votes ? p : c), poll.options[0])
    : {};

  // ===========================================================
  //   RENDER
  // ===========================================================

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* SLIDE WRAPPER */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {poll.options.map((option, idx) => {
          const percentage = getPercentage(option.votes);
          const isWinner = option.id === winningOption.id && poll.userVote;
          const isSelected = poll.userVote === option.id;

          return (
            <div
              key={option.id}
              className="relative flex-shrink-0 w-full h-full overflow-hidden rounded-lg"
              onClick={() => onVote(option.id)}
            >
              {/* MEDIA */}
              <div className="absolute inset-0">
                {option.media?.type === 'video' ? (
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(option.id, el);
                    }}
                    src={option.media.url}
                    muted
                    playsInline
                    loop
                    preload={
                      idx === currentSlide
                        ? 'auto'
                        : Math.abs(currentSlide - idx) <= 1
                        ? 'metadata'
                        : 'none'
                    }
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={option.media?.url}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>

              {/* WINNER/SELECTED SIMILAR UI - Solo visible cuando NO es thumbnail */}
              {!isThumbnail && mobile && poll.userVote && (
                <div>
                  {percentage > 0 && (
                    <div
                      className={cn(
                        'absolute inset-x-0 bottom-0 rounded-t-lg transition-all',
                        isWinner
                          ? 'bg-green-500/40'
                          : isSelected
                          ? 'bg-blue-500/40'
                          : 'bg-white/30'
                      )}
                      style={{
                        height: `${Math.max(percentage, 15)}%`
                      }}
                    >
                      {isWinner && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">
                          <Trophy className="w-4 h-4 text-green-300" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mentioned Users */}
              {!isThumbnail && option.mentioned_users && option.mentioned_users.length > 0 && (
                <div className="absolute bottom-24 left-0 right-0 z-20 flex flex-wrap gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                  {option.mentioned_users.slice(0, 2).map((user, idx) => (
                    <div 
                      key={idx} 
                      className="relative group/user cursor-pointer transition-transform hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        const username = user.username || user.display_name?.toLowerCase().replace(/\s+/g, '_');
                        if (username) navigate(`/profile/${username}`);
                      }}
                    >
                      <img 
                        src={user.avatar_url || '/default-avatar.png'} 
                        className="w-8 h-8 rounded-full border border-white shadow-sm"
                        alt={user.display_name}
                      />
                    </div>
                  ))}
                  {option.mentioned_users.length > 2 && (
                    <div className="w-8 h-8 rounded-full bg-black/60 text-white text-xs flex items-center justify-center border border-white shadow-sm">
                      +{option.mentioned_users.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* INDICATORS - Solo visible cuando NO es thumbnail */}
      {!isThumbnail && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {poll.options.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'w-8 h-2 rounded-full transition-all',
                i === currentSlide ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselLayout;
