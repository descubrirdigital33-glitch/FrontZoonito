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
            origin?: string;
            enablejsapi?: number;
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
  const [apiReady, setApiReady] = useState(false);
  
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar API de YouTube con retry y timeout
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadYouTubeAPI = () => {
      // Si ya está cargada, marcar como ready
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded');
        setApiReady(true);
        return;
      }

      // Verificar si ya existe el script
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (existingScript) {
        console.log('YouTube API script already exists, waiting for load...');
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      
      tag.onerror = () => {
        console.error('Failed to load YouTube API script');
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying YouTube API load (${retryCount}/${maxRetries})...`);
          setTimeout(loadYouTubeAPI, 2000);
        } else {
          setError('No se pudo cargar la API de YouTube. Verifica tu conexión.');
        }
      };

      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Callback global cuando YouTube API esté lista
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API loaded successfully');
        setApiReady(true);
      };
    };

    loadYouTubeAPI();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
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

  // Obtener información del video
  const getVideoInfo = async (videoId: string): Promise<{ title: string; duration: number; thumbnail: string } | null> => {
    try {
      return {
        title: 'YouTube Video',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
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

    // Destruir player anterior si existe
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying previous player:', e);
      }
      playerInstanceRef.current = null;
    }

    // Verificar que la API esté disponible
    if (!window.YT || !window.YT.Player) {
      setError('La API de YouTube está cargando. Intenta de nuevo en unos segundos.');
      setIsLoading(false);
      
      // Esperar a que la API se cargue
      setTimeout(() => {
        if (window.YT && window.YT.Player) {
          createPlayer(videoId);
        }
      }, 2000);
      return;
    }

    try {
      // Limpiar el contenedor antes de crear nuevo player
      const container = document.getElementById(`youtube-player-${radioId}`);
      if (container) {
        container.innerHTML = '';
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
          playsinline: 1,
          origin: window.location.origin, // CRÍTICO para producción
          enablejsapi: 1
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
            console.log('YouTube player state:', event.data);
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setError(''); // Limpiar errores previos
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              handleTrackEnd();
            }
          },
          onError: (event: YouTubePlayerEvent) => {
            console.error('YouTube player error:', event);
            
            // Mensajes de error más específicos
            let errorMessage = 'Error al cargar el video de YouTube';
            switch (event.data) {
              case 2:
                errorMessage = 'ID de video inválido';
                break;
              case 5:
                errorMessage = 'Error de reproductor HTML5';
                break;
              case 100:
                errorMessage = 'Video no encontrado o privado';
                break;
              case 101:
              case 150:
                errorMessage = 'El video no permite reproducción embebida';
                break;
              default:
                errorMessage = `Error de YouTube (código: ${event.data})`;
            }
            
            setError(errorMessage);
            setIsLoading(false);
            setIsPlaying(false);
            
            // Intentar siguiente si está en playlist
            if (playlist.length > 1) {
              setTimeout(() => {
                const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
                const nextIndex = (currentIndex + 1) % playlist.length;
                const nextTrack = playlist[nextIndex];
                if (nextTrack && nextTrack.id !== videoId) {
                  loadTrack(nextTrack.url);
                }
              }, 2000);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      setError('Error al inicializar el reproductor de YouTube');
      setIsLoading(false);
    }
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

      console.log('Audio context configured (YouTube audio capture requires backend)');
      
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
    
    // Reproducir siguiente en la playlist si existe
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

    // Verificar que la API esté lista
    if (!window.YT || !window.YT.Player) {
      setError('Esperando que la API de YouTube esté lista...');
      setIsLoading(true);
      
      // Esperar hasta 5 segundos a que la API se cargue
      let attempts = 0;
      const checkAPI = setInterval(() => {
        attempts++;
        if (window.YT && window.YT.Player) {
          clearInterval(checkAPI);
          loadTrack(url); // Reintentar
        } else if (attempts >= 10) {
          clearInterval(checkAPI);
          setError('No se pudo cargar la API de YouTube. Recarga la página.');
          setIsLoading(false);
        }
      }, 500);
      return;
    }

    const videoInfo = await getVideoInfo(videoId);
    
    if (!videoInfo) {
      setError('No se pudo obtener información del video');
      return;
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

    // Si no hay track actual, reproducir este
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
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
          <Youtube size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">YouTube Music</h2>
          <p className="text-white/60 text-sm">Reproduce música desde YouTube</p>
        </div>
      </div>

      {/* Estado de API */}
      {!apiReady && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Loader size={16} className="text-blue-400 animate-spin" />
            <p className="text-blue-300 text-xs">
              Cargando API de YouTube...
            </p>
          </div>
        </div>
      )}

      {/* Advertencia de limitación */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <div className="text-yellow-400 flex-shrink-0 mt-0.5">⚠️</div>
          <div className="flex-1 min-w-0">
            <p className="text-yellow-300 text-xs font-semibold mb-1">
              Limitación Importante
            </p>
            <p className="text-yellow-200 text-xs mb-2">
              La música de YouTube solo se escucha localmente en tu dispositivo. Los oyentes NO escuchan esta música por restricciones de YouTube. Para transmitir música real, usa el reproductor MP3.
            </p>
            {error && error.includes('API') && (
              <div className="bg-red-500/20 border border-red-500/40 rounded p-2 mt-2">
                <p className="text-red-300 text-xs">
                  🔧 <strong>Error de API:</strong> {error}
                  <button 
                    onClick={() => window.location.reload()} 
                    className="ml-2 underline font-semibold hover:text-red-200"
                  >
                    Recargar página
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input para URL */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddToPlaylist()}
            placeholder="Pega la URL de YouTube aquí..."
            className="flex-1 bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-500 border border-white/10"
            disabled={!isLive || isLoading || !apiReady}
          />
          <button
            onClick={handleAddToPlaylist}
            disabled={!isLive || isLoading || !youtubeUrl.trim() || !apiReady}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Agregar
          </button>
        </div>
        {error && !error.includes('API') && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Player oculto de YouTube */}
      <div ref={playerContainerRef} style={{ display: 'none' }}>
        <div id={`youtube-player-${radioId}`}></div>
      </div>

      {/* Reproductor actual */}
      {currentTrack && (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4 mb-3">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/64?text=YT';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{currentTrack.title}</h3>
              <p className="text-white/60 text-sm">
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader size={24} className="text-white animate-spin" />
              ) : (
                <>
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white ml-1" />
                    )}
                  </button>
                  {playlist.length > 1 && (
                    <button
                      onClick={skipToNext}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Siguiente"
                    >
                      <SkipForward size={18} className="text-white" />
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
            {musicVolume === 0 ? (
              <VolumeX size={18} className="text-white/60" />
            ) : (
              <Volume2 size={18} className="text-white/60" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <span className="text-white/60 text-sm w-12 text-right">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Playlist con clicks para cambiar */}
      {playlist.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Youtube size={18} />
            Cola de reproducción ({playlist.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlist.map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrackFromPlaylist(track)}
                className={`bg-white/5 rounded-lg p-3 flex items-center gap-3 group cursor-pointer hover:bg-white/10 transition-all ${
                  currentTrack?.id === track.id ? 'ring-2 ring-red-500 bg-white/10' : ''
                }`}
              >
                <div className="text-white/60 text-sm font-mono w-6 flex-shrink-0">
                  {index + 1}
                </div>
                <img 
                  src={track.thumbnail} 
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/48?text=YT';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{track.title}</p>
                  {currentTrack?.id === track.id ? (
                    <span className="text-red-400 text-xs flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                      Reproduciendo
                    </span>
                  ) : (
                    <span className="text-white/40 text-xs">Click para reproducir</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(track.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info offline */}
      {!isLive && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
          <p className="text-yellow-300 text-sm">
            ⚠️ Activa la transmisión en vivo para poder reproducir música de YouTube
          </p>
        </div>
      )}

      {/* Estado vacío */}
      {playlist.length === 0 && !currentTrack && (
        <div className="text-center py-8 text-white/60">
          <Youtube size={48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay videos en la cola</p>
          <p className="text-xs mt-1">Agrega una URL de YouTube para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default RadioYoutube;
