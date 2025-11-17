import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader, Youtube, X, Plus, SkipForward } from 'lucide-react';

// Tipos
interface YouTubeTrack {
  id: string;
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
}

interface YouTubeMusicPlayerProps {
  radioId: string;
  isOwner: boolean;
  isLive: boolean;
  onTrackChange?: (track: YouTubeTrack | null) => void;
  onAudioReady?: (audioElement: HTMLAudioElement) => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
}

// Declarar tipos globales de YouTube API
declare global {
  interface Window {
    YT: {
      Player: {
        new (elementId: string, config: {
          height: string;
          width: string;
          videoId: string;
          playerVars: {
            autoplay: number;
            controls: number;
            disablekb: number;
            fs: number;
            modestbranding: number;
            playsinline: number;
          };
          events: {
            onReady: (event: YouTubePlayerEvent) => void;
            onStateChange: (event: YouTubePlayerEvent) => void;
            onError: (event: YouTubePlayerEvent) => void;
          };
        }): YouTubePlayer;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
    webkitAudioContext?: typeof AudioContext;
  }
}

interface YouTubePlayer {
  destroy: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  stopVideo: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

const RadioYoutube: React.FC<YouTubeMusicPlayerProps> = ({
  radioId,
  isOwner,
  isLive,
  onTrackChange,
  onAudioReady,
  musicVolume = 1,
  onMusicVolumeChange
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlist, setPlaylist] = useState<YouTubeTrack[]>([]);
  
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar API de YouTube
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API loaded');
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Actualizar volumen
  useEffect(() => {
    if (playerInstanceRef.current && typeof playerInstanceRef.current.setVolume === 'function') {
      playerInstanceRef.current.setVolume(musicVolume * 100);
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = musicVolume;
    }
  }, [musicVolume]);

  // Extraer ID de video de YouTube
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Verificar si el video permite reproducción embebida
  const checkVideoEmbeddable = async (videoId: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Obtener información del video
  const getVideoInfo = async (videoId: string): Promise<{ title: string; duration: number; thumbnail: string; embeddable: boolean } | null> => {
    try {
      const embeddable = await checkVideoEmbeddable(videoId);
      
      if (embeddable) {
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (response.ok) {
            const data = await response.json();
            return {
              title: data.title || 'YouTube Video',
              duration: 0,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              embeddable: true
            };
          }
        } catch (e) {
          console.error('Error fetching oEmbed:', e);
        }
      }
      
      return {
        title: 'YouTube Video',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embeddable
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  };

  // Crear o actualizar el reproductor de YouTube
  const createPlayer = (videoId: string) => {
    setIsLoading(true);
    setError('');

    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
      playerInstanceRef.current = null;
    }

    if (!window.YT || !window.YT.Player) {
      setError('La API de YouTube aún no está cargada');
      setIsLoading(false);
      return;
    }

    playerInstanceRef.current = new window.YT.Player(`youtube-player-${radioId}`, {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: (event: YouTubePlayerEvent) => {
          console.log('YouTube player ready');
          setIsLoading(false);
          setIsPlaying(true);
          
          const duration = event.target.getDuration();
          setDuration(duration);

          setupAudioContext(event.target);
          startTimeTracking();
        },
        onStateChange: (event: YouTubePlayerEvent) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handleTrackEnd();
          }
        },
        onError: (event: YouTubePlayerEvent) => {
          console.error('YouTube player error:', event);
          
          const errorMessages: { [key: number]: string } = {
            2: 'Solicitud inválida - El video ID es incorrecto',
            5: 'Error del reproductor HTML5',
            100: 'Video no encontrado o fue eliminado',
            101: '🚫 Este video NO permite reproducción embebida',
            150: '🚫 Este video NO permite reproducción embebida'
          };
          
          const errorMessage = errorMessages[event.data] || 'Error al cargar el video de YouTube';
          setError(errorMessage);
          setIsLoading(false);
          setIsPlaying(false);
          
          if (event.data === 101 || event.data === 150) {
            setError('🚫 Este video tiene reproducción embebida deshabilitada. El propietario del video no permite reproducirlo en otros sitios. Intenta con otro video.');
          }
        }
      }
    });
  };

  // Configurar Audio Context
  const setupAudioContext = (player: YouTubePlayer) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext) {
        if (!gainNodeRef.current) {
          gainNodeRef.current = audioContext.createGain();
          gainNodeRef.current.gain.value = musicVolume;
          gainNodeRef.current.connect(audioContext.destination);
        }
      }

      console.log('Audio context configured');
      
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  };

  // Iniciar seguimiento del tiempo
  const startTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.getCurrentTime === 'function') {
        const time = playerInstanceRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000);
  };

  // Manejar fin de track
  const handleTrackEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (playlist.length > 0) {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % playlist.length;
      const nextTrack = playlist[nextIndex];
      loadTrack(nextTrack.url);
    } else {
      setCurrentTrack(null);
      if (onTrackChange) onTrackChange(null);
    }
  };

  // Saltar al siguiente track
  const skipToNext = () => {
    if (playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    
    loadTrack(nextTrack.url);
  };

  // Reproducir track específico de la playlist
  const playTrackFromPlaylist = (track: YouTubeTrack) => {
    loadTrack(track.url);
  };

  // Cargar track de YouTube
  const loadTrack = async (url: string) => {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      setError('URL de YouTube inválida');
      return;
    }

    const videoInfo = await getVideoInfo(videoId);
    
    if (!videoInfo) {
      setError('No se pudo obtener información del video');
      return;
    }

    if (!videoInfo.embeddable) {
      setError('⚠️ Este video podría no permitir reproducción embebida. Si no se reproduce, intenta con otro video.');
    }

    const track: YouTubeTrack = {
      id: videoId,
      url: url,
      title: videoInfo.title,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail
    };

    setCurrentTrack(track);
    if (onTrackChange) onTrackChange(track);
    
    createPlayer(videoId);
  };

  // Agregar a la playlist
  const handleAddToPlaylist = async () => {
    if (!youtubeUrl.trim()) {
      setError('Por favor ingresa una URL de YouTube');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      setError('URL de YouTube inválida');
      return;
    }

    const videoInfo = await getVideoInfo(videoId);
    
    if (!videoInfo) {
      setError('No se pudo obtener información del video');
      return;
    }

    const track: YouTubeTrack = {
      id: videoId,
      url: youtubeUrl,
      title: videoInfo.title,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail
    };

    setPlaylist(prev => [...prev, track]);
    setYoutubeUrl('');
    setError('');

    if (!currentTrack) {
      loadTrack(track.url);
    }
  };

  // Controles de reproducción
  const togglePlayPause = () => {
    if (!playerInstanceRef.current) return;

    if (isPlaying) {
      playerInstanceRef.current.pauseVideo();
    } else {
      playerInstanceRef.current.playVideo();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (onMusicVolumeChange) {
      onMusicVolumeChange(newVolume);
    }
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
    
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      if (onTrackChange) onTrackChange(null);
      if (playerInstanceRef.current) {
        playerInstanceRef.current.stopVideo();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Youtube size={20} className="text-white sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">YouTube Music</h2>
          <p className="text-white/60 text-xs sm:text-sm truncate">Reproduce música desde YouTube</p>
        </div>
      </div>

      {/* Advertencia de limitación */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
        <div className="flex items-start gap-2">
          <div className="text-yellow-400 flex-shrink-0 mt-0.5 text-sm sm:text-base">⚠️</div>
          <div className="flex-1 min-w-0">
            <p className="text-yellow-300 text-xs font-semibold mb-1">
              Limitaciones Importantes
            </p>
            <ul className="text-yellow-200 text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
              <li>• La música solo se escucha localmente en tu dispositivo</li>
              <li>• Los oyentes NO escuchan esta música</li>
              <li>• <strong>Algunos videos bloquean reproducción embebida</strong></li>
              <li>• Para transmitir música real, usa el reproductor MP3</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input para URL */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddToPlaylist()}
            placeholder="Pega la URL de YouTube..."
            className="flex-1 bg-white/10 text-white rounded-lg px-3 sm:px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 border border-white/10 w-full"
            disabled={!isLive || isLoading}
          />
          <button
            onClick={handleAddToPlaylist}
            disabled={!isLive || isLoading || !youtubeUrl.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <Plus size={16} />
            <span className="whitespace-nowrap">Agregar</span>
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-xs sm:text-sm mt-2 break-words">{error}</p>
        )}
      </div>

      {/* Player oculto de YouTube */}
      <div ref={playerContainerRef} style={{ display: 'none' }}>
        <div id={`youtube-player-${radioId}`}></div>
      </div>

      {/* Reproductor actual */}
      {currentTrack && (
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 mb-3">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/64?text=YT';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">{currentTrack.title}</h3>
              <p className="text-white/60 text-xs sm:text-sm">
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {isLoading ? (
                <Loader size={20} className="text-white animate-spin sm:w-6 sm:h-6" />
              ) : (
                <>
                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={18} className="text-white sm:w-5 sm:h-5" />
                    ) : (
                      <Play size={18} className="text-white ml-0.5 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  {playlist.length > 1 && (
                    <button
                      onClick={skipToNext}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Siguiente"
                    >
                      <SkipForward size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-white/10 rounded-full h-1 mb-3">
            <div 
              className="bg-red-600 h-1 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Control de volumen */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {musicVolume === 0 ? (
                <VolumeX size={16} className="text-white/60 sm:w-[18px] sm:h-[18px]" />
              ) : (
                <Volume2 size={16} className="text-white/60 sm:w-[18px] sm:h-[18px]" />
              )}
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
              style={{
                WebkitAppearance: 'none',
                background: `linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(220, 38, 38) ${musicVolume * 100}%, rgba(255,255,255,0.1) ${musicVolume * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <span className="text-white/60 text-xs sm:text-sm w-8 sm:w-12 text-right flex-shrink-0">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Playlist */}
      {playlist.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm sm:text-base mb-2 flex items-center gap-2">
            <Youtube size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Cola ({playlist.length})</span>
          </h3>
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {playlist.map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrackFromPlaylist(track)}
                className={`bg-white/5 rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 group cursor-pointer hover:bg-white/10 transition-all ${
                  currentTrack?.id === track.id ? 'ring-2 ring-red-500 bg-white/10' : ''
                }`}
              >
                <div className="text-white/60 text-xs sm:text-sm font-mono w-4 sm:w-6 flex-shrink-0 text-center">
                  {index + 1}
                </div>
                <img 
                  src={track.thumbnail} 
                  alt={track.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48?text=YT';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs sm:text-sm truncate">{track.title}</p>
                  {currentTrack?.id === track.id ? (
                    <span className="text-red-400 text-[10px] sm:text-xs flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                      Reproduciendo
                    </span>
                  ) : (
                    <span className="text-white/40 text-[10px] sm:text-xs">Click para reproducir</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(track.id);
                  }}
                  className="opacity-60 sm:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all flex-shrink-0 p-1"
                >
                  <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info offline */}
      {!isLive && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mt-3 sm:mt-4">
          <p className="text-yellow-300 text-xs sm:text-sm">
            ⚠️ Activa la transmisión en vivo para poder reproducir música
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {playlist.length === 0 && !currentTrack && (
        <div className="text-center py-6 sm:py-8 text-white/60">
          <Youtube size={40} className="mx-auto mb-2 opacity-50 sm:w-12 sm:h-12" />
          <p className="text-xs sm:text-sm">No hay videos en la cola</p>
          <p className="text-[10px] sm:text-xs mt-1">Agrega una URL de YouTube para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default RadioYoutube;
