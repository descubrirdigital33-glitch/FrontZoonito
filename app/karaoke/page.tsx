'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Maximize2, Minimize2, Plus, X, Palette, Video, StopCircle } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsData {
  songId: string;
  title: string;
  artist: string;
  lines: LyricLine[];
}

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  url: string;
  cover?: string;
}

interface KaraokeProps {
  currentSong: Cancion | undefined;
  isPlaying: boolean;
  inlineMode?: boolean;
}

const colorThemes = [
  { name: 'Purple-Pink', colors: ['#6b21a8', '#ec4899', '#4c1d95'], gradient: 'from-purple-900/98 via-pink-900/98 to-indigo-900/98' },
  { name: 'Blue-Cyan', colors: ['#0c4a6e', '#06b6d4', '#164e63'], gradient: 'from-blue-900/98 via-cyan-800/98 to-teal-900/98' },
  { name: 'Blue-Purple', colors: ['#1e3a8a', '#7c3aed', '#312e81'], gradient: 'from-blue-900/98 via-purple-800/98 to-indigo-900/98' },
  { name: 'Teal-Blue', colors: ['#134e4a', '#0891b2', '#075985'], gradient: 'from-teal-900/98 via-cyan-800/98 to-blue-900/98' },
  { name: 'Ocean', colors: ['#1e40af', '#0ea5e9', '#0284c7'], gradient: 'from-blue-800/98 via-sky-700/98 to-blue-900/98' },
];

const Karaoke: React.FC<KaraokeProps> = ({ currentSong, isPlaying, inlineMode = false }) => {
  const [karaokeActive, setKaraokeActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLine, setCurrentLine] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // ======= CONTROL DE VISIBILIDAD DEL HEADER =======
  useEffect(() => {
    if (!isMaximized) {
      setShowControls(true);
      return;
    }

    const handleMouseMove = () => {
      setShowControls(true);
      
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }

      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Ocultar después de 3 segundos inicialmente
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isMaximized]);

  // ======= ANIMACIÓN DE FONDO =======
  useEffect(() => {
    if (!karaokeActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const theme = colorThemes[currentTheme];
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Conectar partículas cercanas
        particles.forEach((p2, j) => {
          if (i !== j) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = p.color + Math.floor((1 - dist / 100) * 50).toString(16).padStart(2, '0');
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [karaokeActive, currentTheme]);

  // ======= GRABACIÓN DE VIDEO =======
  const startRecording = async () => {
    const panel = document.getElementById('karaoke-panel');
    if (!panel) return;

    try {
      // Capturar el panel del karaoke como stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `karaoke-${currentSong?.titulo || 'recording'}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      alert('No se pudo iniciar la grabación. Asegúrate de dar permisos y seleccionar la pestaña correcta.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ======= FETCH DE LETRAS =======
  useEffect(() => {
    if (!karaokeActive || !currentSong) {
      setLyrics(null);
      setCurrentLine(-1);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${currentSong.id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found');
          } else {
            setError('error');
          }
          setLyrics(null);
          return;
        }

        const data: LyricsData = await response.json();
        setLyrics(data);
        setCurrentLine(-1);
      } catch (err) {
        setError('error');
        setLyrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong?.id, karaokeActive]);

  // ======= ESCUCHA DEL TIEMPO DE AUDIO =======
  useEffect(() => {
    if (!karaokeActive || !lyrics) return;

    const audioElement = document.querySelector('audio');
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      const time = audioElement.currentTime;
      let activeLine = -1;
      for (let i = lyrics.lines.length - 1; i >= 0; i--) {
        if (time >= lyrics.lines[i].time) {
          activeLine = i;
          break;
        }
      }
      setCurrentLine(activeLine);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => audioElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, [karaokeActive, lyrics]);

  // ======= AUTO-SCROLL =======
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLine]);

  const toggleKaraoke = () => {
    setKaraokeActive(!karaokeActive);
    if (!karaokeActive) setIsMaximized(false);
  };

  const handleAddLyrics = () => {
    if (currentSong) {
      window.location.href = `/liriceditor/${currentSong.id}`;
    }
  };

  const cycleTheme = () => {
    setCurrentTheme((prev) => (prev + 1) % colorThemes.length);
  };

  // ======= BOTÓN INACTIVO =======
  if (!karaokeActive) {
    return (
      <div className={inlineMode ? 'inline-block' : 'fixed top-4 left-4 z-40'}>
        <button
          onClick={toggleKaraoke}
          className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center gap-2 ${
            inlineMode ? 'ml-2' : ''
          }`}
          title="Activar Karaoke"
        >
          <MicOff size={24} />
        </button>
      </div>
    );
  }

  // ======= PANEL ACTIVO =======
  return (
    <>
      {!inlineMode && (
        <div className="fixed top-4 left-4 z-40">
          <button
            onClick={toggleKaraoke}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center gap-2 animate-pulse"
            title="Desactivar Karaoke"
          >
            <Mic size={24} />
          </button>
        </div>
      )}

      <div
        id="karaoke-panel"
        className={`
          fixed backdrop-blur-md shadow-2xl transition-all duration-300 overflow-hidden
          ${isMaximized ? 'inset-0 z-50 rounded-none' : 'bottom-4 left-4 right-4 h-96 md:left-auto md:w-96 z-30 rounded-xl'}
        `}
      >
        {/* Canvas de fondo animado */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: `linear-gradient(135deg, ${colorThemes[currentTheme].colors.join(', ')})` }}
        />

        {/* Contenido sobre el canvas */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/30">
            <div className="flex items-center gap-3">
              <Mic className="text-pink-400" size={24} />
              <div>
                <h3 className="text-white font-bold text-lg">Karaoke Mode</h3>
                <p className="text-gray-300 text-xs truncate max-w-[150px]">
                  {currentSong?.titulo || 'No hay canción'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cycleTheme}
                className="text-white hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Cambiar tema de color"
              >
                <Palette size={20} />
              </button>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="text-white hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Iniciar grabación"
                >
                  <Video size={20} />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-white/10 animate-pulse"
                  title="Detener grabación"
                >
                  <StopCircle size={20} />
                </button>
              )}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="text-white hover:text-pink-400 transition-colors"
                title={isMaximized ? 'Restaurar' : 'Maximizar'}
              >
                {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={toggleKaraoke}
                className="text-white hover:text-red-400 transition-colors"
                title="Cerrar Karaoke"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className={`flex-1 overflow-hidden p-4 transition-all duration-500 ${
            isMaximized && !showControls ? 'pt-8' : ''
          }`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500 border-solid"></div>
                <p className="text-white mt-4">Cargando letras...</p>
              </div>
            ) : error === 'not_found' || !lyrics ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-white/10 rounded-full p-6 mb-4">
                  <Mic size={48} className="text-gray-400" />
                </div>
                <h4 className="text-white text-xl font-bold mb-2">
                  Letras no disponibles
                </h4>
              </div>
            ) : error === 'error' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-400 text-lg">Error al cargar las letras</p>
                <p className="text-gray-300 text-sm mt-2">Intenta nuevamente más tarde</p>
              </div>
            ) : (
              <div
                ref={lyricsContainerRef}
                className="h-full overflow-y-auto scrollbar-custom space-y-4 pb-20"
              >
                {lyrics.lines.map((line, index) => (
                  <div
                    key={index}
                    ref={index === currentLine ? activeLineRef : null}
                    className={`
                      text-center py-2 px-4 rounded-lg transition-all duration-300
                      ${
                        index === currentLine
                          ? 'text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110'
                          : index === currentLine + 1
                          ? 'text-xl md:text-2xl text-white/80'
                          : 'text-lg text-white/40'
                      }
                    `}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-custom::-webkit-scrollbar {
            width: 0px;
            display: none;
          }
          .scrollbar-custom {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `,
      }} />
    </>
  );
};

export default Karaoke;