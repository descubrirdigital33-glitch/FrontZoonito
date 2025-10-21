// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { Mic, MicOff, Maximize2, Minimize2, Plus, X, Palette, Video, StopCircle } from 'lucide-react';

// interface LyricLine {
//   time: number;
//   text: string;
// }

// interface LyricsData {
//   songId: string;
//   title: string;
//   artist: string;
//   lines: LyricLine[];
// }

// interface Cancion {
//   id: string;
//   titulo: string;
//   artista: string;
//   url: string;
//   cover?: string;
// }

// interface KaraokeProps {
//   currentSong: Cancion | undefined;
//   isPlaying: boolean;
//   inlineMode?: boolean;
// }

// const colorThemes = [
//   { name: 'Purple-Pink', colors: ['#6b21a8', '#ec4899', '#4c1d95'], gradient: 'from-purple-900/98 via-pink-900/98 to-indigo-900/98' },
//   { name: 'Blue-Cyan', colors: ['#0c4a6e', '#06b6d4', '#164e63'], gradient: 'from-blue-900/98 via-cyan-800/98 to-teal-900/98' },
//   { name: 'Blue-Purple', colors: ['#1e3a8a', '#7c3aed', '#312e81'], gradient: 'from-blue-900/98 via-purple-800/98 to-indigo-900/98' },
//   { name: 'Teal-Blue', colors: ['#134e4a', '#0891b2', '#075985'], gradient: 'from-teal-900/98 via-cyan-800/98 to-blue-900/98' },
//   { name: 'Ocean', colors: ['#1e40af', '#0ea5e9', '#0284c7'], gradient: 'from-blue-800/98 via-sky-700/98 to-blue-900/98' },
// ];

// const Karaoke: React.FC<KaraokeProps> = ({ currentSong, isPlaying, inlineMode = false }) => {
//   const [karaokeActive, setKaraokeActive] = useState(false);
//   const [isMaximized, setIsMaximized] = useState(false);
//   const [lyrics, setLyrics] = useState<LyricsData | null>(null);
//   const [currentLine, setCurrentLine] = useState(-1);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [currentTheme, setCurrentTheme] = useState(0);
//   const [isRecording, setIsRecording] = useState(false);
//   const [showControls, setShowControls] = useState(true);
//   const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
//   const lyricsContainerRef = useRef<HTMLDivElement>(null);
//   const activeLineRef = useRef<HTMLDivElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const recordedChunksRef = useRef<Blob[]>([]);
//   const animationFrameRef = useRef<number | undefined>(undefined);

//   // ======= CONTROL DE VISIBILIDAD DEL HEADER =======
//   useEffect(() => {
//     if (!isMaximized) {
//       setShowControls(true);
//       return;
//     }

//     const handleMouseMove = () => {
//       setShowControls(true);
      
//       if (hideControlsTimeoutRef.current) {
//         clearTimeout(hideControlsTimeoutRef.current);
//       }

//       hideControlsTimeoutRef.current = setTimeout(() => {
//         setShowControls(false);
//       }, 3000);
//     };

//     window.addEventListener('mousemove', handleMouseMove);
    
//     // Ocultar después de 3 segundos inicialmente
//     hideControlsTimeoutRef.current = setTimeout(() => {
//       setShowControls(false);
//     }, 3000);

//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       if (hideControlsTimeoutRef.current) {
//         clearTimeout(hideControlsTimeoutRef.current);
//       }
//     };
//   }, [isMaximized]);

//   // ======= ANIMACIÓN DE FONDO =======
//   useEffect(() => {
//     if (!karaokeActive || !canvasRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     canvas.width = canvas.offsetWidth;
//     canvas.height = canvas.offsetHeight;

//     const particles: Array<{
//       x: number;
//       y: number;
//       vx: number;
//       vy: number;
//       size: number;
//       color: string;
//       alpha: number;
//     }> = [];

//     const theme = colorThemes[currentTheme];
    
//     for (let i = 0; i < 50; i++) {
//       particles.push({
//         x: Math.random() * canvas.width,
//         y: Math.random() * canvas.height,
//         vx: (Math.random() - 0.5) * 2,
//         vy: (Math.random() - 0.5) * 2,
//         size: Math.random() * 3 + 1,
//         color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
//         alpha: Math.random() * 0.5 + 0.2,
//       });
//     }

//     const animate = () => {
//       ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       particles.forEach((p, i) => {
//         p.x += p.vx;
//         p.y += p.vy;

//         if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
//         if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

//         ctx.beginPath();
//         ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
//         ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
//         ctx.fill();

//         // Conectar partículas cercanas
//         particles.forEach((p2, j) => {
//           if (i !== j) {
//             const dx = p.x - p2.x;
//             const dy = p.y - p2.y;
//             const dist = Math.sqrt(dx * dx + dy * dy);

//             if (dist < 100) {
//               ctx.beginPath();
//               ctx.moveTo(p.x, p.y);
//               ctx.lineTo(p2.x, p2.y);
//               ctx.strokeStyle = p.color + Math.floor((1 - dist / 100) * 50).toString(16).padStart(2, '0');
//               ctx.lineWidth = 0.5;
//               ctx.stroke();
//             }
//           }
//         });
//       });

//       animationFrameRef.current = requestAnimationFrame(animate);
//     };

//     animate();

//     return () => {
//       if (animationFrameRef.current) {
//         cancelAnimationFrame(animationFrameRef.current);
//       }
//     };
//   }, [karaokeActive, currentTheme]);

//   // ======= GRABACIÓN DE VIDEO =======
//   const startRecording = async () => {
//     const panel = document.getElementById('karaoke-panel');
//     if (!panel) return;

//     try {
//       // Capturar el panel del karaoke como stream
//       const stream = await navigator.mediaDevices.getDisplayMedia({
//         video: {
//           displaySurface: 'browser',
//         },
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           sampleRate: 44100,
//         },
//       });

//       const mediaRecorder = new MediaRecorder(stream, {
//         mimeType: 'video/webm;codecs=vp9',
//         videoBitsPerSecond: 2500000,
//       });

//       recordedChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = () => {
//         const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `karaoke-${currentSong?.titulo || 'recording'}-${Date.now()}.webm`;
//         a.click();
//         URL.revokeObjectURL(url);
//         stream.getTracks().forEach(track => track.stop());
//       };

//       mediaRecorder.start();
//       mediaRecorderRef.current = mediaRecorder;
//       setIsRecording(true);
//     } catch (err) {
//       console.error('Error al iniciar grabación:', err);
//       alert('No se pudo iniciar la grabación. Asegúrate de dar permisos y seleccionar la pestaña correcta.');
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   // ======= FETCH DE LETRAS =======
//   useEffect(() => {
//     if (!karaokeActive || !currentSong) {
//       setLyrics(null);
//       setCurrentLine(-1);
//       return;
//     }

//     const fetchLyrics = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const response = await fetch(
//           `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${currentSong.id}`
//         );

//         if (!response.ok) {
//           if (response.status === 404) {
//             setError('not_found');
//           } else {
//             setError('error');
//           }
//           setLyrics(null);
//           return;
//         }

//         const data: LyricsData = await response.json();
//         setLyrics(data);
//         setCurrentLine(-1);
//       } catch (err) {
//         setError('error');
//         setLyrics(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLyrics();
//   }, [currentSong?.id, karaokeActive]);

//   // ======= ESCUCHA DEL TIEMPO DE AUDIO =======
//   useEffect(() => {
//     if (!karaokeActive || !lyrics) return;

//     const audioElement = document.querySelector('audio');
//     if (!audioElement) return;

//     const handleTimeUpdate = () => {
//       const time = audioElement.currentTime;
//       let activeLine = -1;
//       for (let i = lyrics.lines.length - 1; i >= 0; i--) {
//         if (time >= lyrics.lines[i].time) {
//           activeLine = i;
//           break;
//         }
//       }
//       setCurrentLine(activeLine);
//     };

//     audioElement.addEventListener('timeupdate', handleTimeUpdate);
//     return () => audioElement.removeEventListener('timeupdate', handleTimeUpdate);
//   }, [karaokeActive, lyrics]);

//   // ======= AUTO-SCROLL =======
//   useEffect(() => {
//     if (activeLineRef.current && lyricsContainerRef.current) {
//       activeLineRef.current.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center',
//       });
//     }
//   }, [currentLine]);

//   const toggleKaraoke = () => {
//     setKaraokeActive(!karaokeActive);
//     if (!karaokeActive) setIsMaximized(false);
//   };

//   const handleAddLyrics = () => {
//     if (currentSong) {
//       window.location.href = `/liriceditor/${currentSong.id}`;
//     }
//   };

//   const cycleTheme = () => {
//     setCurrentTheme((prev) => (prev + 1) % colorThemes.length);
//   };

//   // ======= BOTÓN INACTIVO =======
//   if (!karaokeActive) {
//     return (
//       <div className={inlineMode ? 'inline-block' : 'fixed top-4 left-4 z-40'}>
//         <button
//           onClick={toggleKaraoke}
//           className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center gap-2 ${
//             inlineMode ? 'ml-2' : ''
//           }`}
//           title="Activar Karaoke"
//         >
//           <MicOff size={24} />
//         </button>
//       </div>
//     );
//   }

//   // ======= PANEL ACTIVO =======
//   return (
//     <>
//       {!inlineMode && (
//         <div className="fixed top-4 left-4 z-40">
//           <button
//             onClick={toggleKaraoke}
//             className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center gap-2 animate-pulse"
//             title="Desactivar Karaoke"
//           >
//             <Mic size={24} />
//           </button>
//         </div>
//       )}

//       <div
//         id="karaoke-panel"
//         className={`
//           fixed backdrop-blur-md shadow-2xl transition-all duration-300 overflow-hidden
//           ${isMaximized ? 'inset-0 z-50 rounded-none' : 'bottom-4 left-4 right-4 h-96 md:left-auto md:w-96 z-30 rounded-xl'}
//         `}
//       >
//         {/* Canvas de fondo animado */}
//         <canvas
//           ref={canvasRef}
//           className="absolute inset-0 w-full h-full"
//           style={{ background: `linear-gradient(135deg, ${colorThemes[currentTheme].colors.join(', ')})` }}
//         />

//         {/* Contenido sobre el canvas */}
//         <div className="relative z-10 h-full flex flex-col">
//           {/* Header */}
//           <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/30">
//             <div className="flex items-center gap-3">
//               <Mic className="text-pink-400" size={24} />
//               <div>
//                 <h3 className="text-white font-bold text-lg">Karaoke Mode</h3>
//                 <p className="text-gray-300 text-xs truncate max-w-[150px]">
//                   {currentSong?.titulo || 'No hay canción'}
//                 </p>
//               </div>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={cycleTheme}
//                 className="text-white hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-white/10"
//                 title="Cambiar tema de color"
//               >
//                 <Palette size={20} />
//               </button>
//               {!isRecording ? (
//                 <button
//                   onClick={startRecording}
//                   className="text-white hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/10"
//                   title="Iniciar grabación"
//                 >
//                   <Video size={20} />
//                 </button>
//               ) : (
//                 <button
//                   onClick={stopRecording}
//                   className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-white/10 animate-pulse"
//                   title="Detener grabación"
//                 >
//                   <StopCircle size={20} />
//                 </button>
//               )}
//               <button
//                 onClick={() => setIsMaximized(!isMaximized)}
//                 className="text-white hover:text-pink-400 transition-colors"
//                 title={isMaximized ? 'Restaurar' : 'Maximizar'}
//               >
//                 {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
//               </button>
//               <button
//                 onClick={toggleKaraoke}
//                 className="text-white hover:text-red-400 transition-colors"
//                 title="Cerrar Karaoke"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//           </div>

//           {/* Contenido */}
//           <div className={`flex-1 overflow-hidden p-4 transition-all duration-500 ${
//             isMaximized && !showControls ? 'pt-8' : ''
//           }`}>
//             {loading ? (
//               <div className="flex flex-col items-center justify-center h-full">
//                 <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500 border-solid"></div>
//                 <p className="text-white mt-4">Cargando letras...</p>
//               </div>
//             ) : error === 'not_found' || !lyrics ? (
//               <div className="flex flex-col items-center justify-center h-full text-center px-4">
//                 <div className="bg-white/10 rounded-full p-6 mb-4">
//                   <Mic size={48} className="text-gray-400" />
//                 </div>
//                 <h4 className="text-white text-xl font-bold mb-2">
//                   Letras no disponibles
//                 </h4>
//               </div>
//             ) : error === 'error' ? (
//               <div className="flex flex-col items-center justify-center h-full">
//                 <p className="text-red-400 text-lg">Error al cargar las letras</p>
//                 <p className="text-gray-300 text-sm mt-2">Intenta nuevamente más tarde</p>
//               </div>
//             ) : (
//               <div
//                 ref={lyricsContainerRef}
//                 className="h-full overflow-y-auto scrollbar-custom space-y-4 pb-20"
//               >
//                 {lyrics.lines.map((line, index) => (
//                   <div
//                     key={index}
//                     ref={index === currentLine ? activeLineRef : null}
//                     className={`
//                       text-center py-2 px-4 rounded-lg transition-all duration-300
//                       ${
//                         index === currentLine
//                           ? 'text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-110'
//                           : index === currentLine + 1
//                           ? 'text-xl md:text-2xl text-white/80'
//                           : 'text-lg text-white/40'
//                       }
//                     `}
//                   >
//                     {line.text}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <style dangerouslySetInnerHTML={{
//         __html: `
//           .scrollbar-custom::-webkit-scrollbar {
//             width: 0px;
//             display: none;
//           }
//           .scrollbar-custom {
//             scrollbar-width: none;
//             -ms-overflow-style: none;
//           }
//         `,
//       }} />
//     </>
//   );
// };


// export default Karaoke;




'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Maximize2, Minimize2, Plus, X, Palette, Video, StopCircle } from 'lucide-react';
import Swal from 'sweetalert2';

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
  { name: 'Sunset', colors: ['#fb923c', '#f97316', '#ea580c'], gradient: 'from-orange-500/98 via-orange-600/98 to-orange-700/98' },
  { name: 'Golden', colors: ['#fbbf24', '#f59e0b', '#d97706'], gradient: 'from-yellow-500/98 via-amber-500/98 to-yellow-600/98' },
  { name: 'Emerald', colors: ['#10b981', '#059669', '#047857'], gradient: 'from-emerald-500/98 via-emerald-600/98 to-green-700/98' },
  { name: 'Rose', colors: ['#fb7185', '#f43f5e', '#e11d48'], gradient: 'from-rose-400/98 via-rose-500/98 to-rose-600/98' },
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

  // ======= DETECCIÓN DE DISPOSITIVO MÓVIL =======
  const isMobile = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

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
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    
    if (!panel || !audioElement) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el panel de karaoke o el audio',
        confirmButtonColor: '#ec4899'
      });
      return;
    }

    // DETECCIÓN: Si es móvil, mostrar instrucciones para grabación nativa
    if (isMobile()) {
      await Swal.fire({
        title: '📱 Grabar en Móvil',
        html: `
          <div style="text-align: left; padding: 15px;">
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #1e40af; font-size: 16px;">💡 Usa la grabadora nativa de tu dispositivo</strong>
            </div>

            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #065f46;">📱 Android:</strong>
              <ol style="color: #047857; margin: 10px 0 0 20px; line-height: 1.8;">
                <li>Desliza hacia abajo (panel de notificaciones)</li>
                <li>Busca "Grabar pantalla" o "Screen Recorder"</li>
                <li>Toca el ícono para iniciar</li>
                <li>Reproduce el karaoke normalmente</li>
                <li>Desliza de nuevo y detén cuando termines</li>
              </ol>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #92400e;">🍎 iPhone/iPad:</strong>
              <ol style="color: #78350f; margin: 10px 0 0 20px; line-height: 1.8;">
                <li>Ve a <strong>Ajustes → Centro de Control</strong></li>
                <li>Agrega "Grabación de pantalla"</li>
                <li>Desliza desde arriba derecha (o abajo en modelos antiguos)</li>
                <li>Mantén presionado el botón de grabar ⚫</li>
                <li>Activa el micrófono si quieres incluir tu voz</li>
                <li>Toca "Iniciar grabación"</li>
              </ol>
            </div>

            <div style="background: #e0e7ff; padding: 12px; border-radius: 8px;">
              <p style="margin: 0; color: #3730a3; text-align: center; font-size: 14px; font-weight: bold;">
                ✅ Grabará TODO: letras animadas, efectos visuales y audio sincronizado
              </p>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: '👍 Entendido',
        confirmButtonColor: '#ec4899',
        width: '95%',
        customClass: {
          popup: 'swal-mobile-friendly'
        }
      });
      return;
    }

    // ESCRITORIO: Grabación directa con getDisplayMedia
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      // Verificar si se capturó audio
      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        const retryResult = await Swal.fire({
          icon: 'warning',
          title: '⚠️ NO SE CAPTURÓ EL AUDIO',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p style="color: #991b1b; font-weight: bold; margin-bottom: 15px;">
                ❌ El video se grabará SIN SONIDO
              </p>
              <p style="margin-bottom: 10px; font-size: 15px;">Esto ocurrió porque:</p>
              <ul style="margin-left: 20px; color: #374151; line-height: 1.6;">
                <li><strong>NO marcaste "Compartir audio de la pestaña"</strong></li>
                <li>O seleccionaste "Ventana" en vez de "Pestaña"</li>
                <li>O tu navegador no soporta captura de audio</li>
              </ul>
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong style="color: #1e40af;">💡 Para capturar audio:</strong>
                <p style="color: #1e3a8a; margin-top: 5px; line-height: 1.5;">
                  1. Selecciona "Pestaña" (no Ventana ni Pantalla)<br/>
                  2. Busca y selecciona esta pestaña<br/>
                  3. ✅ Marca "Compartir audio de la pestaña"<br/>
                  4. Haz clic en "Compartir"
                </p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '🔄 Reintentar con audio',
          cancelButtonText: 'Continuar sin audio',
          confirmButtonColor: '#ec4899',
          cancelButtonColor: '#6b7280',
          width: '600px'
        });
        
        if (retryResult.isConfirmed) {
          displayStream.getTracks().forEach(track => track.stop());
          startRecording();
          return;
        }
        
        if (retryResult.isDismissed) {
          displayStream.getTracks().forEach(track => track.stop());
          return;
        }
      }

      // Configurar el MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000
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
        
        displayStream.getTracks().forEach(track => track.stop());

        Swal.fire({
          icon: 'success',
          title: '✅ Video Descargado',
          html: `
            <p>Tu video de karaoke se ha guardado exitosamente</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Archivo: <strong>karaoke-${currentSong?.titulo || 'recording'}.webm</strong>
            </p>
          `,
          confirmButtonColor: '#ec4899',
          timer: 4000,
          timerProgressBar: true
        });
      };

      // Detectar cuando el usuario detiene la compartición
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      });

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      await Swal.fire({
        icon: 'success',
        title: '✅ Grabación Iniciada',
        html: `
          <div style="text-align: left; padding: 10px;">
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #065f46;">🎬 Grabando:</strong>
              <ul style="color: #047857; margin-left: 20px; margin-top: 10px; line-height: 1.6;">
                <li>✅ Letras sincronizadas</li>
                <li>✅ Animaciones en vivo</li>
                <li>✅ Audio de la canción</li>
                <li>✅ Efectos visuales</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
              <strong style="color: #92400e;">⏹️ Para detener:</strong>
              <p style="color: #78350f; margin-top: 5px;">
                Haz clic en el botón rojo "STOP" o presiona "Dejar de compartir"
              </p>
            </div>

            <p style="margin-top: 15px; color: #6b7280; font-size: 13px; text-align: center;">
              💾 El video se descargará automáticamente al finalizar
            </p>
          </div>
        `,
        confirmButtonText: '👍 Entendido',
        confirmButtonColor: '#ec4899',
        timer: 5000,
        timerProgressBar: true
      });

    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      await Swal.fire({
        icon: 'error',
        title: '❌ Error al Grabar',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 15px; color: #991b1b; font-weight: bold;">
              No se pudo iniciar la grabación
            </p>
            
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <strong style="color: #991b1b;">Posibles causas:</strong>
              <ul style="color: #991b1b; margin-left: 20px; margin-top: 10px; line-height: 1.6;">
                <li>Cancelaste la ventana de permisos</li>
                <li>No diste permisos al navegador</li>
                <li>Tu navegador no soporta captura de pantalla</li>
              </ul>
            </div>

            <div style="background: #dbeafe; padding: 15px; border-radius: 8px;">
              <strong style="color: #1e40af;">💡 Usa Chrome o Edge actualizado</strong>
              <p style="color: #1e3a8a; margin-top: 5px;">
                Estos navegadores tienen mejor soporte para grabación
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ec4899',
        width: '550px'
      });
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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: `linear-gradient(135deg, ${colorThemes[currentTheme].colors.join(', ')})` }}
        />

        <div className="relative z-10 h-full flex flex-col">
          <div className={`flex justify-between items-center p-4 border-b border-white/20 bg-black/30 transition-all duration-300 ${
            isMaximized && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
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
                <button
                  onClick={handleAddLyrics}
                  className="mt-4 flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} />
                  Agregar letras
                </button>
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

        {isRecording && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span className="text-xs font-bold">REC</span>
          </div>
        )}
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
          .swal-mobile-friendly {
            font-size: 14px !important;
          }
          @media (max-width: 640px) {
            .swal-mobile-friendly {
              width: 95vw !important;
              font-size: 12px !important;
            }
          }
        `,
      }} />
    </>
  );
};

export default Karaoke;
