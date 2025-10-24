// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { Mic, MicOff, Maximize2, Minimize2, Plus, X, Palette, Video, StopCircle } from 'lucide-react';
// import Swal from 'sweetalert2';

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
//   { name: 'Sunset', colors: ['#fb923c', '#f97316', '#ea580c'], gradient: 'from-orange-500/98 via-orange-600/98 to-orange-700/98' },
//   { name: 'Golden', colors: ['#fbbf24', '#f59e0b', '#d97706'], gradient: 'from-yellow-500/98 via-amber-500/98 to-yellow-600/98' },
//   { name: 'Emerald', colors: ['#10b981', '#059669', '#047857'], gradient: 'from-emerald-500/98 via-emerald-600/98 to-green-700/98' },
//   { name: 'Rose', colors: ['#fb7185', '#f43f5e', '#e11d48'], gradient: 'from-rose-400/98 via-rose-500/98 to-rose-600/98' },
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
//   const lyricsCanvasRef = useRef<HTMLCanvasElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const recordedChunksRef = useRef<Blob[]>([]);
//   const animationFrameRef = useRef<number | undefined>(undefined);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const backgroundColorRef = useRef({ r: 107, g: 33, b: 168 });
//   const targetColorRef = useRef({ r: 107, g: 33, b: 168 });

//   const isMobile = (): boolean => {
//     return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
//            (window.innerWidth <= 768);
//   };

//   useEffect(() => {
//     const audioElement = document.querySelector('audio') as HTMLAudioElement;
//     if (audioElement) {
//       audioElement.crossOrigin = 'anonymous';
//     }
//   }, [currentSong]);

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

//   const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
//     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? {
//       r: parseInt(result[1], 16),
//       g: parseInt(result[2], 16),
//       b: parseInt(result[3], 16)
//     } : { r: 0, g: 0, b: 0 };
//   };

//   const lerpColor = (current: { r: number; g: number; b: number }, target: { r: number; g: number; b: number }, speed: number) => {
//     return {
//       r: current.r + (target.r - current.r) * speed,
//       g: current.g + (target.g - current.g) * speed,
//       b: current.b + (target.b - current.b) * speed
//     };
//   };

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

//   useEffect(() => {
//     if (!isRecording || !lyricsCanvasRef.current || !lyrics) return;

//     const canvas = lyricsCanvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const theme = colorThemes[currentTheme];
//     const themeColors = theme.colors.map(hexToRgb);
    
//     let colorChangeTimer = 0;
//     const colorChangeDuration = 180;

//     const drawLyrics = () => {
//       colorChangeTimer++;
      
//       if (colorChangeTimer >= colorChangeDuration) {
//         targetColorRef.current = themeColors[Math.floor(Math.random() * themeColors.length)];
//         colorChangeTimer = 0;
//       }

//       backgroundColorRef.current = lerpColor(backgroundColorRef.current, targetColorRef.current, 0.01);

//       const currentColor = backgroundColorRef.current;
//       const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
//       const r = Math.round(currentColor.r);
//       const g = Math.round(currentColor.g);
//       const b = Math.round(currentColor.b);
      
//       gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
//       gradient.addColorStop(0.5, `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 1.2)}, ${Math.round(b * 1.1)})`);
//       gradient.addColorStop(1, `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.9)}, ${Math.round(b * 1.3)})`);
      
//       ctx.fillStyle = gradient;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       const time = Date.now() * 0.0005;
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
//       for (let i = 0; i < 80; i++) {
//         const x = (Math.sin(time * 0.5 + i * 0.8) * 0.3 + 0.5) * canvas.width;
//         const y = (Math.cos(time * 0.3 + i * 0.5) * 0.3 + 0.5) * canvas.height;
//         const size = Math.sin(time * 2 + i) * 8 + 12;
//         ctx.beginPath();
//         ctx.arc(x, y, size, 0, Math.PI * 2);
//         ctx.fill();
//       }

//       const centerY = canvas.height / 2;
//       const lineHeight = 100;
//       const startIndex = Math.max(0, currentLine - 2);
//       const endIndex = Math.min(lyrics.lines.length, currentLine + 3);

//       for (let i = startIndex; i < endIndex; i++) {
//         const line = lyrics.lines[i];
//         const offsetY = (i - currentLine) * lineHeight;
//         const y = centerY + offsetY;

//         if (i === currentLine) {
//           ctx.font = 'bold 70px Arial';
//           ctx.fillStyle = '#ffffff';
//           ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
//           ctx.shadowBlur = 25;
//         } else if (i === currentLine + 1) {
//           ctx.font = 'bold 50px Arial';
//           ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
//           ctx.shadowBlur = 10;
//         } else {
//           ctx.font = '35px Arial';
//           ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
//           ctx.shadowBlur = 0;
//         }

//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         ctx.fillText(line.text, canvas.width / 2, y);
//         ctx.shadowBlur = 0;
//       }

//       if (isRecording) {
//         requestAnimationFrame(drawLyrics);
//       }
//     };

//     const initialColor = themeColors[0];
//     backgroundColorRef.current = initialColor;
//     targetColorRef.current = themeColors[1];

//     drawLyrics();
//   }, [isRecording, currentLine, lyrics, currentTheme]);

//   const startRecording = async () => {
//     const audioElement = document.querySelector('audio') as HTMLAudioElement;
    
//     if (!audioElement || !currentSong) {
//       await Swal.fire({
//         icon: 'error',
//         title: 'Error',
//         text: 'No se encontró el audio o no hay canción seleccionada',
//         confirmButtonColor: '#ec4899'
//       });
//       return;
//     }

//     if (!lyrics || lyrics.lines.length === 0) {
//       await Swal.fire({
//         icon: 'warning',
//         title: '⚠️ Sin letras',
//         text: 'Necesitas agregar letras para grabar el karaoke',
//         confirmButtonColor: '#ec4899'
//       });
//       return;
//     }

//     try {
//       const recordCanvas = document.createElement('canvas');
//       recordCanvas.width = 1920;
//       recordCanvas.height = 1080;
//       lyricsCanvasRef.current = recordCanvas;

//       const canvasStream = recordCanvas.captureStream(30);

//       audioElement.crossOrigin = 'anonymous';
      
//       if (!audioContextRef.current) {
//         audioContextRef.current = new AudioContext();
//       }
      
//       const audioContext = audioContextRef.current;
//       const source = audioContext.createMediaElementSource(audioElement);
//       const destination = audioContext.createMediaStreamDestination();
      
//       source.connect(destination);
//       source.connect(audioContext.destination);
      
//       if (audioContext.state === 'suspended') {
//         await audioContext.resume();
//       }
      
//       const audioStream = destination.stream;

//       const combinedStream = new MediaStream([
//         ...canvasStream.getVideoTracks(),
//         ...audioStream.getAudioTracks()
//       ]);

//       const mediaRecorder = new MediaRecorder(combinedStream, {
//         mimeType: 'video/webm;codecs=h264,opus',
//         videoBitsPerSecond: 5000000,
//         audioBitsPerSecond: 320000
//       });

//       recordedChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
//         const url = URL.createObjectURL(webmBlob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `karaoke-${currentSong.titulo}-${Date.now()}.mp4`;
//         a.click();
//         URL.revokeObjectURL(url);

//         canvasStream.getTracks().forEach(track => track.stop());
//         audioStream.getTracks().forEach(track => track.stop());

//         const toast = Swal.mixin({
//           toast: true,
//           position: 'top-end',
//           showConfirmButton: false,
//           timer: 3000,
//           timerProgressBar: true
//         });

//         toast.fire({
//           icon: 'success',
//           title: '✅ Video Guardado',
//           text: `${currentSong.titulo}.mp4`
//         });
//       };

//       mediaRecorder.start(100);
//       mediaRecorderRef.current = mediaRecorder;
//       setIsRecording(true);

//       const toast = Swal.mixin({
//         toast: true,
//         position: 'top-end',
//         showConfirmButton: false,
//         timer: 2500,
//         timerProgressBar: true
//       });

//       toast.fire({
//         icon: 'success',
//         title: '🎤 Grabando',
//         text: 'Audio HD + Letras'
//       });

//     } catch (err) {
//       console.error('Error al grabar:', err);
      
//       await Swal.fire({
//         icon: 'error',
//         title: '❌ Error',
//         html: `
//           <p>No se pudo iniciar la grabación</p>
//           <p style="font-size: 12px; color: #666; margin-top: 10px;">
//             Error: ${err instanceof Error ? err.message : 'Desconocido'}
//           </p>
//         `,
//         confirmButtonColor: '#ec4899'
//       });
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

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
//         <canvas
//           ref={canvasRef}
//           className="absolute inset-0 w-full h-full"
//           style={{ background: `linear-gradient(135deg, ${colorThemes[currentTheme].colors.join(', ')})` }}
//         />

//         <div className="relative z-10 h-full flex flex-col">
//           <div className={`flex justify-between items-center p-4 border-b border-white/20 bg-black/30 transition-all duration-300 ${
//             isMaximized && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
//           }`}>
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
//                 <button
//                   onClick={handleAddLyrics}
//                   className="mt-4 flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
//                 >
//                   <Plus size={20} />
//                   Agregar letras
//                 </button>
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

//         {isRecording && (
//           <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
//             <div className="w-2 h-2 bg-white rounded-full"></div>
//             <span className="text-xs font-bold">REC</span>
//           </div>
//         )}
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
//           .swal-mobile-friendly {
//             font-size: 14px !important;
//           }
//           @media (max-width: 640px) {
//             .swal-mobile-friendly {
//               width: 95vw !important;
//               font-size: 12px !important;
//             }
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
  { name: 'Deep Blue', colors: ['#0a1929', '#1e3a8a', '#0c4a6e'], gradient: 'from-slate-950/98 via-blue-950/98 to-blue-900/98' },
  { name: 'Navy Ocean', colors: ['#0f172a', '#1e40af', '#075985'], gradient: 'from-slate-950/98 via-blue-900/98 to-cyan-900/98' },
  { name: 'Dark Crimson', colors: ['#450a0a', '#7f1d1d', '#991b1b'], gradient: 'from-red-950/98 via-red-900/98 to-rose-900/98' },
  { name: 'Blood Moon', colors: ['#1a0a0a', '#7f1d1d', '#450a0a'], gradient: 'from-black/98 via-red-950/98 to-red-900/98' },
  { name: 'Midnight Blue', colors: ['#020617', '#0c4a6e', '#164e63'], gradient: 'from-slate-950/98 via-blue-900/98 to-teal-900/98' },
  { name: 'Deep Purple', colors: ['#1e1b4b', '#4c1d95', '#581c87'], gradient: 'from-indigo-950/98 via-purple-900/98 to-purple-800/98' },
  { name: 'Dark Teal', colors: ['#042f2e', '#134e4a', '#115e59'], gradient: 'from-slate-950/98 via-teal-900/98 to-teal-800/98' },
  { name: 'Burgundy Night', colors: ['#450a0a', '#881337', '#9f1239'], gradient: 'from-red-950/98 via-rose-900/98 to-pink-900/98' },
  { name: 'Abyss Blue', colors: ['#020617', '#1e3a8a', '#312e81'], gradient: 'from-slate-950/98 via-blue-900/98 to-indigo-900/98' },
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
  const lyricsCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundColorRef = useRef({ r: 10, g: 25, b: 41 });
  const targetColorRef = useRef({ r: 10, g: 25, b: 41 });

  const isMobile = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768);
  };

  useEffect(() => {
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.crossOrigin = 'anonymous';
    }
  }, [currentSong]);

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

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const lerpColor = (current: { r: number; g: number; b: number }, target: { r: number; g: number; b: number }, speed: number) => {
    return {
      r: current.r + (target.r - current.r) * speed,
      g: current.g + (target.g - current.g) * speed,
      b: current.b + (target.b - current.b) * speed
    };
  };

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

  useEffect(() => {
    if (!isRecording || !lyricsCanvasRef.current || !lyrics) return;

    const canvas = lyricsCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = colorThemes[currentTheme];
    const themeColors = theme.colors.map(hexToRgb);

    let colorChangeTimer = 0;
    const colorChangeDuration = 180;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 1,
        color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const drawLyrics = () => {
      colorChangeTimer++;

      if (colorChangeTimer >= colorChangeDuration) {
        targetColorRef.current = themeColors[Math.floor(Math.random() * themeColors.length)];
        colorChangeTimer = 0;
      }

      backgroundColorRef.current = lerpColor(backgroundColorRef.current, targetColorRef.current, 0.01);

      const currentColor = backgroundColorRef.current;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

      const r = Math.round(currentColor.r);
      const g = Math.round(currentColor.g);
      const b = Math.round(currentColor.b);

      gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      gradient.addColorStop(0.5, `rgb(${Math.round(r * 0.8)}, ${Math.round(g * 1.2)}, ${Math.round(b * 1.1)})`);
      gradient.addColorStop(1, `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.9)}, ${Math.round(b * 1.3)})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const alpha = Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = p.color + alpha;
        ctx.fill();

        particles.forEach((p2, j) => {
          if (i !== j) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              const lineAlpha = Math.floor((1 - dist / 150) * 80).toString(16).padStart(2, '0');
              ctx.strokeStyle = p.color + lineAlpha;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        });
      });

      const time = Date.now() * 0.0005;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(time * 0.5 + i * 0.8) * 0.4 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.3 + i * 0.5) * 0.4 + 0.5) * canvas.height;
        const size = Math.sin(time * 2 + i) * 10 + 15;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const centerY = canvas.height / 2;
      const lineHeight = 100;
      const startIndex = Math.max(0, currentLine - 2);
      const endIndex = Math.min(lyrics.lines.length, currentLine + 3);

      for (let i = startIndex; i < endIndex; i++) {
        const line = lyrics.lines[i];
        const offsetY = (i - currentLine) * lineHeight;
        const y = centerY + offsetY;

        if (i === currentLine) {
          ctx.font = 'bold 70px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowBlur = 25;
        } else if (i === currentLine + 1) {
          ctx.font = 'bold 50px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 10;
        } else {
          ctx.font = '35px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(line.text, canvas.width / 2, y);
        ctx.shadowBlur = 0;
      }

      if (isRecording) {
        requestAnimationFrame(drawLyrics);
      }
    };

    const initialColor = themeColors[0];
    backgroundColorRef.current = initialColor;
    targetColorRef.current = themeColors[1];

    drawLyrics();
  }, [isRecording, currentLine, lyrics, currentTheme]);

  const startRecording = async () => {
    const audioElement = document.querySelector('audio') as HTMLAudioElement;

    if (!audioElement || !currentSong) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el audio o no hay canción seleccionada',
        confirmButtonColor: '#ec4899'
      });
      return;
    }

    if (!lyrics || lyrics.lines.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Sin letras',
        text: 'Necesitas agregar letras para grabar el karaoke',
        confirmButtonColor: '#ec4899'
      });
      return;
    }

    try {
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = 1920;
      recordCanvas.height = 1080;
      lyricsCanvasRef.current = recordCanvas;

      const canvasStream = recordCanvas.captureStream(30);

      audioElement.crossOrigin = 'anonymous';

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();

      source.connect(destination);
      source.connect(audioContext.destination);

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const audioStream = destination.stream;

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 320000
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `karaoke-${currentSong.titulo}-${Date.now()}.mp4`;
        a.click();
        URL.revokeObjectURL(url);

        canvasStream.getTracks().forEach(track => track.stop());
        audioStream.getTracks().forEach(track => track.stop());

        const toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        toast.fire({
          icon: 'success',
          title: '✅ Video Guardado',
          text: `${currentSong.titulo}.mp4`
        });
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      toast.fire({
        icon: 'success',
        title: '🎤 Grabando',
        text: 'Audio HD + Letras'
      });

    } catch (err) {
      console.error('Error al grabar:', err);

      await Swal.fire({
        icon: 'error',
        title: '❌ Error',
        html: `
          <p>No se pudo iniciar la grabación</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Error: ${err instanceof Error ? err.message : 'Desconocido'}
          </p>
        `,
        confirmButtonColor: '#ec4899'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

  if (!karaokeActive) {
    return (
      <div className={inlineMode ? 'inline-block' : 'fixed top-4 left-4 z-40'}>
        <button
          onClick={toggleKaraoke}
          className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center gap-2 ${inlineMode ? 'ml-2' : ''
            }`}
          title="Activar Karaoke"
        >
          <MicOff size={24} />
        </button>
      </div>
    );
  }

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
          <div className={`flex justify-between items-center p-4 border-b border-white/20 bg-black/30 transition-all duration-300 ${isMaximized && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
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

          <div className={`flex-1 overflow-hidden p-4 transition-all duration-500 ${isMaximized && !showControls ? 'pt-8' : ''
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
                      ${index === currentLine
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
            <div className="w-2 h-2 bg-white rounded-full"></div><span className="text-xs font-bold">REC</span>
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
