// 'use client';

// import { useEffect, useState, useRef } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { Plus, Save, X, Trash2, ArrowLeft, Music, Upload, Play, Pause, SkipBack, Clock, Mic, MicOff } from 'lucide-react';

// // ==== Tipos ====
// interface Cancion {
//   _id: string;
//   title: string;
//   artist: string;
//   audioUrl: string;
//   coverUrl?: string;
//   album?: string;
//   genre?: string;
// }

// interface LyricLine {
//   time: number;
//   text: string;
// }

// interface LyricsData {
//   _id?: string;
//   songId: string;
//   title: string;
//   artist: string;
//   lines: LyricLine[];
// }

// interface SpeechRecognition extends EventTarget {
//   continuous: boolean;
//   interimResults: boolean;
//   lang: string;
//   start: () => void;
//   stop: () => void;
//   onresult: (event: SpeechRecognitionEvent) => void;
//   onerror: (event: SpeechRecognitionErrorEvent) => void;
//   onend: () => void;
// }

// interface SpeechRecognitionEvent extends Event {
//   results: SpeechRecognitionResultList;
// }

// interface SpeechRecognitionResultList {
//   length: number;
//   item(index: number): SpeechRecognitionResult;
//   [index: number]: SpeechRecognitionResult;
// }

// interface SpeechRecognitionResult {
//   length: number;
//   item(index: number): SpeechRecognitionAlternative;
//   [index: number]: SpeechRecognitionAlternative;
//   isFinal: boolean;
// }

// interface SpeechRecognitionAlternative {
//   transcript: string;
//   confidence: number;
// }

// interface SpeechRecognitionErrorEvent extends Event {
//   error: string;
// }

// declare global {
//   interface Window {
//     SpeechRecognition: {
//       new(): SpeechRecognition;
//     };
//     webkitSpeechRecognition: {
//       new(): SpeechRecognition;
//     };
//   }
// }

// export default function LyricsEditor() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
  
//   const [selectedSong, setSelectedSong] = useState<Cancion | null>(null);
//   const [lyrics, setLyrics] = useState<LyricsData | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [lyricsExist, setLyricsExist] = useState(false);

//   // Estado para modo de sincronización
//   const [isRecordingMode, setIsRecordingMode] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
//   const [currentLineText, setCurrentLineText] = useState('');
  
//   // Estado para reconocimiento de voz
//   const [isListening, setIsListening] = useState(false);
//   const [speechSupported, setSpeechSupported] = useState(true);
//   const [autoAddLines, setAutoAddLines] = useState(true);
//   const [audioDuration, setAudioDuration] = useState(0);
//   const [audioLoaded, setAudioLoaded] = useState(false);
  
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);

//   // ===== Inicializar reconocimiento de voz =====
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
//       if (SpeechRecognitionConstructor) {
//         const recognition = new SpeechRecognitionConstructor();
//         recognition.continuous = true;
//         recognition.interimResults = true;
//         recognition.lang = 'es-ES';

//         recognition.onresult = (event: SpeechRecognitionEvent) => {
//           const transcript = Array.from(event.results)
//             .map((result: SpeechRecognitionResult) => result[0])
//             .map((result: SpeechRecognitionAlternative) => result.transcript)
//             .join('');

//           setCurrentLineText(transcript);

//           // Solo agregar automáticamente si está activado Y el resultado es final
//           if (autoAddLines && event.results[event.results.length - 1].isFinal) {
//             const finalTranscript = transcript.trim();
//             if (finalTranscript) {
//               // Pequeño delay para que se vea el texto antes de agregarse
//               setTimeout(() => {
//                 const currentAudioTime = audioRef.current?.currentTime || 0;
//                 const newLine: LyricLine = {
//                   time: parseFloat(currentAudioTime.toFixed(3)),
//                   text: finalTranscript,
//                 };

//                 setLyrics((prevLyrics) => {
//                   if (!prevLyrics) return null;
//                   return {
//                     ...prevLyrics,
//                     lines: [...prevLyrics.lines, newLine],
//                   };
//                 });
//                 setCurrentLineText('');
//               }, 500); // Medio segundo de delay para ver el texto
//             }
//           }
//         };

//         recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
//           console.error('Error de reconocimiento:', event.error);
//           if (event.error === 'no-speech') {
//             return;
//           }
//           setIsListening(false);
//         };

//         recognition.onend = () => {
//           if (isListening && isRecordingMode) {
//             try {
//               recognition.start();
//             } catch (e) {
//               console.log('Recognition already started');
//             }
//           }
//         };

//         recognitionRef.current = recognition;
//       } else {
//         setSpeechSupported(false);
//         console.warn('Reconocimiento de voz no soportado');
//       }
//     }

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, [isListening, isRecordingMode, autoAddLines]);

//   // ===== Fetch canción individual =====
//   useEffect(() => {
//     if (!id) return;

//     const fetchSong = async () => {
//       try {
//         const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${id}`);
        
//         if (!res.ok) {
//           throw new Error('Canción no encontrada');
//         }

//         const data: Cancion = await res.json();
//         setSelectedSong(data);
//         console.log('✅ Canción cargada:', data.title);
//       } catch (err) {
//         console.error(err);
//         setError('Error al cargar la canción');
//       }
//     };

//     fetchSong();
//   }, [id]);

//   // ===== Fetch letras de la canción =====
//   useEffect(() => {
//     if (!selectedSong) return;

//     const fetchLyrics = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         const res = await fetch(
//           `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`
//         );

//         if (res.status === 404) {
//           setLyrics({
//             songId: selectedSong._id,
//             title: selectedSong.title,
//             artist: selectedSong.artist,
//             lines: [],
//           });
//           setLyricsExist(false);
//           console.log('📝 No hay letras, listo para crear');
//           return;
//         }

//         if (!res.ok) {
//           throw new Error('Error al cargar letras');
//         }

//         const data: LyricsData = await res.json();
//         setLyrics(data);
//         setLyricsExist(true);
//         console.log('✅ Letras cargadas:', data.lines.length, 'líneas');
//       } catch (err) {
//         console.error(err);
//         setError('Error al cargar letras');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLyrics();
//   }, [selectedSong]);

//   // ===== Actualizar tiempo actual del audio =====
//   useEffect(() => {
//     const audio = audioRef.current;
//     if (!audio) return;

//     const handleTimeUpdate = () => {
//       setCurrentTime(audio.currentTime);
//     };

//     const handleEnded = () => {
//       setIsPlaying(false);
//       stopListening();
//     };

//     const handleLoadedMetadata = () => {
//       setAudioDuration(audio.duration);
//       setAudioLoaded(true);
//       console.log('Audio cargado, duración:', audio.duration);
//     };

//     const handleError = (e: Event) => {
//       console.error('Error al cargar audio:', e);
//       setError('Error al cargar el audio');
//     };

//     audio.addEventListener('timeupdate', handleTimeUpdate);
//     audio.addEventListener('ended', handleEnded);
//     audio.addEventListener('loadedmetadata', handleLoadedMetadata);
//     audio.addEventListener('error', handleError);

//     return () => {
//       audio.removeEventListener('timeupdate', handleTimeUpdate);
//       audio.removeEventListener('ended', handleEnded);
//       audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
//       audio.removeEventListener('error', handleError);
//     };
//   }, [selectedSong]);

//   // ===== Formatear tiempo =====
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins}:${String(secs).padStart(2, '0')}`;
//   };

//   // ===== Formatear tiempo con milésimas =====
//   const formatTimeWithMs = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     const ms = Math.floor((seconds % 1) * 1000);
//     return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
//   };

//   // ===== MODO GRABACIÓN: Toggle =====
//   const toggleRecordingMode = () => {
//     if (!audioLoaded) {
//       alert('⚠️ Espera a que el audio se cargue completamente');
//       return;
//     }
    
//     if (!isRecordingMode) {
//       setIsRecordingMode(true);
//       playAudio();
//       setTimeout(() => inputRef.current?.focus(), 100);
//     } else {
//       setIsRecordingMode(false);
//       pauseAudio();
//       stopListening();
//     }
//   };

//   // ===== VOZ: Iniciar escucha =====
//   const startListening = () => {
//     if (!speechSupported || !recognitionRef.current) {
//       alert('❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
//       return;
//     }

//     try {
//       recognitionRef.current.start();
//       setIsListening(true);
//       if (!isPlaying) playAudio();
//     } catch (e) {
//       console.log('Recognition already started');
//     }
//   };

//   // ===== VOZ: Detener escucha =====
//   const stopListening = () => {
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//     }
//   };

//   // ===== MODO GRABACIÓN: Agregar línea con timestamp actual =====
//   const addLineWithTimestamp = () => {
//     if (!lyrics) return;

//     // Si no hay texto, agregar línea vacía con timestamp actual
//     const lineText = currentLineText.trim() || '';

//     const newLine: LyricLine = {
//       time: parseFloat(currentTime.toFixed(3)),
//       text: lineText,
//     };

//     setLyrics({
//       ...lyrics,
//       lines: [...lyrics.lines, newLine],
//     });

//     setCurrentLineText('');
//     inputRef.current?.focus();
//   };

//   // ===== Manejar Enter en modo grabación =====
//   const handleRecordingKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && currentLineText.trim()) {
//       addLineWithTimestamp();
//     }
//   };

//   // ===== Controles de audio =====
//   const playAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.play().then(() => {
//         setIsPlaying(true);
//         console.log('Audio reproduciendo');
//       }).catch(err => {
//         console.error('Error al reproducir:', err);
//         alert('Error al reproducir el audio');
//       });
//     }
//   };

//   const pauseAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       setIsPlaying(false);
//       console.log('Audio pausado');
//     }
//   };

//   const restartAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.currentTime = 0;
//       setCurrentTime(0);
//       playAudio();
//       console.log('Audio reiniciado');
//     }
//   };

//   // ===== UPDATE: Actualizar texto de línea =====
//   const updateLine = (index: number, text: string) => {
//     if (!lyrics) return;
//     const updated = lyrics.lines.map((line, i) =>
//       i === index ? { ...line, text } : line
//     );
//     setLyrics({ ...lyrics, lines: updated });
//   };

//   // ===== UPDATE: Actualizar tiempo de línea =====
//   const updateTime = (index: number, time: number) => {
//     if (!lyrics) return;
//     const updated = lyrics.lines.map((line, i) =>
//       i === index ? { ...line, time } : line
//     );
//     setLyrics({ ...lyrics, lines: updated });
//   };

//   // ===== CREATE: Agregar nueva línea =====
//   const addLine = () => {
//     if (!lyrics) return;
    
//     const currentAudioTime = audioRef.current?.currentTime || 0;
//     const lastTime = lyrics.lines.length > 0 
//       ? lyrics.lines[lyrics.lines.length - 1].time + 1
//       : currentAudioTime;

//     setLyrics({
//       ...lyrics,
//       lines: [...lyrics.lines, { time: parseFloat(lastTime.toFixed(3)), text: '' }],
//     });
//   };

//   // ===== DELETE: Eliminar línea =====
//   const removeLine = (index: number) => {
//     if (!lyrics) return;
//     const filtered = lyrics.lines.filter((_, i) => i !== index);
//     setLyrics({ ...lyrics, lines: filtered });
//   };

//   // ===== CREATE/UPDATE: Guardar letras =====
//   const saveLyrics = async () => {
//     if (!lyrics || !selectedSong) return;

//     if (lyrics.lines.length === 0) {
//       alert('⚠️ Agrega al menos una línea de letra');
//       return;
//     }

//     const hasEmptyLines = lyrics.lines.some(line => !line.text.trim());
//     if (hasEmptyLines) {
//       if (!confirm('⚠️ Hay líneas vacías. ¿Deseas guardar de todas formas?')) {
//         return;
//       }
//     }

//     setSaving(true);
//     try {
//       const method = lyricsExist ? 'PUT' : 'POST';
//       const url = `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`;

//       const res = await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(lyrics),
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.error || 'Error al guardar');
//       }

//       const savedLyrics = await res.json();
//       setLyrics(savedLyrics);
//       setLyricsExist(true);
      
//       alert('🎵 Letras guardadas correctamente');
//       console.log('✅ Letras guardadas');
//     } catch (err) {
//       console.error(err);
//       alert(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ===== DELETE: Eliminar todas las letras =====
//   const deleteLyrics = async () => {
//     if (!lyrics || !selectedSong || !lyricsExist) return;

//     if (!confirm('🗑️ ¿Estás seguro de eliminar todas las letras? Esta acción no se puede deshacer.')) {
//       return;
//     }

//     setDeleting(true);
//     try {
//       const res = await fetch(
//         `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`,
//         { method: 'DELETE' }
//       );

//       if (!res.ok) throw new Error('Error al eliminar letras');

//       setLyrics({
//         songId: selectedSong._id,
//         title: selectedSong.title,
//         artist: selectedSong.artist,
//         lines: [],
//       });
//       setLyricsExist(false);
      
//       alert('🗑️ Letras eliminadas correctamente');
//       console.log('✅ Letras eliminadas');
//     } catch (err) {
//       console.error(err);
//       alert('❌ Error al eliminar letras');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // ===== Importar letras desde archivo .lrc =====
//   const importLRC = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file || !lyrics) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const content = e.target?.result as string;
//       const lines: LyricLine[] = [];

//       content.split('\n').forEach((line) => {
//         const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
//         if (match) {
//           const minutes = parseInt(match[1]);
//           const seconds = parseInt(match[2]);
//           const centiseconds = parseInt(match[3]);
//           const text = match[4].trim();
          
//           const time = minutes * 60 + seconds + centiseconds / 100;
//           lines.push({ time, text });
//         }
//       });

//       if (lines.length > 0) {
//         setLyrics({ ...lyrics, lines });
//         alert(`✅ ${lines.length} líneas importadas`);
//       } else {
//         alert('⚠️ No se encontraron líneas válidas en el archivo');
//       }
//     };

//     reader.readAsText(file);
//   };

//   // ===== Ordenar líneas por tiempo =====
//   const sortLines = () => {
//     if (!lyrics) return;
//     const sorted = [...lyrics.lines].sort((a, b) => a.time - b.time);
//     setLyrics({ ...lyrics, lines: sorted });
//   };

//   // ===== Render =====
//   if (error && !selectedSong) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 flex items-center justify-center p-6">
//         <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl text-center">
//           <p className="text-red-400 text-xl mb-4">{error}</p>
//           <button
//             onClick={() => router.back()}
//             className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg"
//           >
//             Volver
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 p-6">
//       <div className="max-w-5xl mx-auto">
//         {selectedSong && (
//           <audio 
//             ref={audioRef} 
//             src={selectedSong.audioUrl}
//             preload="metadata"
//             onLoadedMetadata={() => console.log('Metadata cargada')}
//             onError={(e) => console.error('Error de audio:', e)}
//           />
//         )}

//         <div className="flex items-center gap-4 mb-6">
//           <button
//             onClick={() => router.back()}
//             className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
//             title="Volver"
//           >
//             <ArrowLeft size={24} />
//           </button>
          
//           <div className="flex-1">
//             <h1 className="text-3xl font-bold text-white flex items-center gap-3">
//               <Music className="text-pink-400" />
//               Editor de Letras
//             </h1>
//             {selectedSong && (
//               <p className="text-gray-300 mt-1">
//                 {selectedSong.title} - {selectedSong.artist}
//               </p>
//             )}
//           </div>

//           {lyricsExist && (
//             <button
//               onClick={deleteLyrics}
//               disabled={deleting}
//               className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-800 text-white rounded-lg transition-colors"
//               title="Eliminar todas las letras"
//             >
//               <Trash2 size={16} />
//               {deleting ? 'Eliminando...' : 'Eliminar Todo'}
//             </button>
//           )}
//         </div>

//         {selectedSong && (
//           <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl mb-6 flex items-center gap-4">
//             {selectedSong.coverUrl && (
//               <img
//                 src={selectedSong.coverUrl}
//                 alt={selectedSong.title}
//                 className="w-20 h-20 rounded-lg object-cover"
//               />
//             )}
//             <div className="flex-1">
//               <h3 className="text-white font-bold text-lg">{selectedSong.title}</h3>
//               <p className="text-gray-300">{selectedSong.artist}</p>
//               {selectedSong.album && (
//                 <p className="text-gray-400 text-sm">📀 {selectedSong.album}</p>
//               )}
//               {selectedSong.genre && (
//                 <p className="text-gray-400 text-sm">🎵 {selectedSong.genre}</p>
//               )}
//             </div>
            
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={restartAudio}
//                 disabled={!audioLoaded}
//                 className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
//                 title="Reiniciar"
//               >
//                 <SkipBack size={20} />
//               </button>
//               <button
//                 onClick={isPlaying ? pauseAudio : playAudio}
//                 disabled={!audioLoaded}
//                 className="p-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
//                 title={isPlaying ? 'Pausar' : 'Reproducir'}
//               >
//                 {isPlaying ? <Pause size={24} /> : <Play size={24} />}
//               </button>
//               <div className="text-white ml-2">
//                 {audioLoaded ? (
//                   <>
//                     <div className="font-mono text-lg font-bold">
//                       {formatTime(currentTime)}
//                     </div>
//                     <div className="font-mono text-xs text-gray-400">
//                       {formatTimeWithMs(currentTime)} / {formatTime(audioDuration)}
//                     </div>
//                   </>
//                 ) : (
//                   <div className="text-gray-400 text-sm">Cargando audio...</div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md p-6 rounded-xl mb-6 border-2 border-green-500/50">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <Clock className="text-green-400" size={24} />
//               <div>
//                 <h3 className="text-white font-bold text-lg">
//                   Sincronización en Tiempo Real
//                 </h3>
//                 <p className="text-gray-300 text-sm">
//                   Usa reconocimiento de voz o escribe manualmente
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               {/* Contador grande de tiempo */}
//               {isRecordingMode && (
//                 <div className="bg-black/30 px-6 py-3 rounded-lg border-2 border-green-500">
//                   <div className="text-green-400 font-mono text-3xl font-bold leading-none">
//                     {formatTimeWithMs(currentTime)}
//                   </div>
//                   <div className="text-gray-400 text-xs text-center mt-1">
//                     {currentTime.toFixed(3)}s
//                   </div>
//                 </div>
//               )}
//               <button
//                 onClick={toggleRecordingMode}
//                 className={`px-6 py-3 rounded-lg font-bold transition-all ${
//                   isRecordingMode
//                     ? 'bg-red-500 hover:bg-red-600 animate-pulse'
//                     : 'bg-green-500 hover:bg-green-600'
//                 } text-white`}
//               >
//                 {isRecordingMode ? '⏹ Detener' : '🎙️ Iniciar'}
//               </button>
//             </div>
//           </div>

//           {isRecordingMode && (
//             <>
//               <div className="flex gap-2 mb-3">
//                 <button
//                   onClick={isListening ? stopListening : startListening}
//                   disabled={!speechSupported}
//                   className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
//                     isListening
//                       ? 'bg-red-500 hover:bg-red-600 animate-pulse'
//                       : 'bg-blue-500 hover:bg-blue-600'
//                   } text-white disabled:bg-gray-600`}
//                   title={!speechSupported ? 'No soportado en este navegador' : ''}
//                 >
//                   {isListening ? <MicOff size={20} /> : <Mic size={20} />}
//                   {isListening ? 'Detener Voz' : 'Activar Voz'}
//                 </button>

//                 <label className="flex items-center gap-2 text-white cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={autoAddLines}
//                     onChange={(e) => setAutoAddLines(e.target.checked)}
//                     className="w-4 h-4"
//                   />
//                   <span className="text-sm">Auto-agregar líneas</span>
//                 </label>

//                 {isListening && (
//                   <div className="flex items-center gap-2 ml-auto">
//                     <div className="flex gap-1">
//                       <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
//                       <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '150ms'}}></div>
//                       <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
//                     </div>
//                     <span className="text-green-400 text-sm font-bold">Escuchando...</span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex gap-2">
//                 <div className="flex-1 relative">
//                   <input
//                     ref={inputRef}
//                     type="text"
//                     value={currentLineText}
//                     onChange={(e) => setCurrentLineText(e.target.value)}
//                     onKeyPress={handleRecordingKeyPress}
//                     className="w-full px-4 py-3 pr-32 rounded-lg bg-white/10 text-white border-2 border-green-500 focus:border-green-400 focus:outline-none text-lg"
//                     placeholder="Escribe o usa el reconocimiento de voz..."
//                   />
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 font-mono font-bold text-right">
//                     <div className="text-base">{formatTime(currentTime)}</div>
//                     <div className="text-xs opacity-80">{formatTimeWithMs(currentTime)}</div>
//                   </div>
//                 </div>
//                 <button
//                   onClick={addLineWithTimestamp}
//                   className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
//                 >
//                   ✓ Agregar
//                 </button>
//               </div>
//             </>
//           )}
//         </div>

//         {loading && (
//           <div className="flex justify-center items-center py-20">
//             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500"></div>
//           </div>
//         )}

//         {lyrics && !loading && (
//           <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
//             <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-white/20">
//               <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors">
//                 <Upload size={16} />
//                 Importar .lrc
//                 <input
//                   type="file"
//                   accept=".lrc"
//                   onChange={importLRC}
//                   className="hidden"
//                 />
//               </label>

//               <button
//                 onClick={sortLines}
//                 className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
//               >
//                 🔢 Ordenar por tiempo
//               </button>

//               <div className="ml-auto text-gray-300 text-sm flex items-center gap-2">
//                 📊 {lyrics.lines.length} líneas
//               </div>
//             </div>

//             <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
//               {lyrics.lines.length === 0 ? (
//                 <p className="text-gray-400 text-center py-8">
//                   No hay líneas. Usa el modo de sincronización o agrega manualmente.
//                 </p>
//               ) : (
//                 lyrics.lines.map((line, index) => (
//                   <div key={index} className="flex items-center gap-2 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
//                     <span className="text-gray-400 text-sm w-8 font-bold">{index + 1}</span>
                    
//                     <div className="flex flex-col gap-1 w-32">
//                       <input
//                         type="number"
//                         value={line.time.toFixed(3)}
//                         step={0.001}
//                         onChange={(e) => updateTime(index, parseFloat(e.target.value) || 0)}
//                         className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-pink-500 focus:outline-none text-sm font-mono"
//                         placeholder="0.000"
//                         title="Tiempo en segundos"
//                       />
//                       <span className="text-xs text-green-400 px-1 font-mono font-bold">
//                         {formatTimeWithMs(line.time)}
//                       </span>
//                     </div>
                    
//                     <input
//                       type="text"
//                       value={line.text}
//                       onChange={(e) => updateLine(index, e.target.value)}
//                       className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-pink-500 focus:outline-none"
//                       placeholder="Escribe la letra aquí..."
//                     />
                    
//                     <button
//                       onClick={() => removeLine(index)}
//                       className="p-2 text-red-400 hover:text-red-600 hover:bg-red-500/20 rounded-lg transition-colors"
//                       title="Eliminar línea"
//                     >
//                       <X size={20} />
//                     </button>
//                   </div>
//                 ))
//               )}
//             </div>

//             <div className="flex flex-wrap gap-3">
//               <button
//                 onClick={addLine}
//                 className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 <Plus size={20} />
//                 Agregar línea
//               </button>

//               <button
//                 onClick={saveLyrics}
//                 disabled={saving}
//                 className="flex items-center gap-2 px-8 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-800 text-white rounded-lg font-bold transition-colors"
//               >
//                 <Save size={20} />
//                 {saving ? 'Guardando...' : lyricsExist ? 'Actualizar Letras' : 'Crear Letras'}
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Save, X, Trash2, ArrowLeft, Music, Upload, Play, Pause, SkipBack, Clock, Mic, MicOff } from 'lucide-react';

// ==== Tipos ====
interface Cancion {
  _id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  album?: string;
  genre?: string;
}

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsData {
  _id?: string;
  songId: string;
  title: string;
  artist: string;
  lines: LyricLine[];
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

export default function LyricsEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [selectedSong, setSelectedSong] = useState<Cancion | null>(null);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lyricsExist, setLyricsExist] = useState(false);

  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineText, setCurrentLineText] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoAddLines, setAutoAddLines] = useState(true);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingTimelineIndex, setDraggingTimelineIndex] = useState<number | null>(null);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [dragPreviewTime, setDragPreviewTime] = useState<number | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<number>(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      setSpeechSupported(false);
      console.warn('❌ Reconocimiento de voz no soportado');
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Reconocimiento iniciado');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      if (isFinal) {
        if (autoAddLines && transcript.trim()) {
          const currentAudioTime = audioRef.current?.currentTime || 0;
          const newLine: LyricLine = {
            time: parseFloat(currentAudioTime.toFixed(3)),
            text: transcript.trim(),
          };

          setLyrics((prevLyrics) => {
            if (!prevLyrics) return null;
            return {
              ...prevLyrics,
              lines: [...prevLyrics.lines, newLine],
            };
          });

          setCurrentLineText('');
        }
      } else {
        setCurrentLineText(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        alert('❌ Permiso de micrófono denegado');
        setIsListening(false);
        return;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening && isRecordingMode) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Reiniciando...');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Limpieza');
        }
      }
    };
  }, [isListening, isRecordingMode, autoAddLines]);

  useEffect(() => {
    if (!id) return;

    const fetchSong = async () => {
      try {
        const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${id}`);
        if (!res.ok) throw new Error('Canción no encontrada');
        const data: Cancion = await res.json();
        setSelectedSong(data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la canción');
      }
    };

    fetchSong();
  }, [id]);

  useEffect(() => {
    if (!selectedSong) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`);

        if (res.status === 404) {
          setLyrics({
            songId: selectedSong._id,
            title: selectedSong.title,
            artist: selectedSong.artist,
            lines: [],
          });
          setLyricsExist(false);
          return;
        }

        if (!res.ok) throw new Error('Error al cargar letras');

        const data: LyricsData = await res.json();
        setLyrics(data);
        setLyricsExist(true);
      } catch (err) {
        console.error(err);
        setError('Error al cargar letras');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [selectedSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Encontrar la línea activa según el tiempo actual
      if (lyrics && lyrics.lines.length > 0) {
        const sortedLines = [...lyrics.lines].sort((a, b) => a.time - b.time);
        let currentIndex = -1;
        
        for (let i = 0; i < sortedLines.length; i++) {
          if (audio.currentTime >= sortedLines[i].time) {
            currentIndex = i;
          } else {
            break;
          }
        }
        
        // Encontrar el índice en el array original (no ordenado)
        if (currentIndex >= 0) {
          const activeLine = sortedLines[currentIndex];
          const originalIndex = lyrics.lines.findIndex(line => line.time === activeLine.time && line.text === activeLine.text);
          setActiveLineIndex(originalIndex);
          
          // Auto-scroll a la línea activa
          if (lyricsContainerRef.current && originalIndex >= 0) {
            const lineElement = lyricsContainerRef.current.children[originalIndex] as HTMLElement;
            if (lineElement) {
              lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        } else {
          setActiveLineIndex(null);
        }
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      stopListening();
    };
    
    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata cargada - Duración:', audio.duration);
      setAudioDuration(audio.duration);
      setAudioLoaded(true);
    };
    
    const handleCanPlay = () => {
      console.log('✅ Audio listo para reproducir');
      setAudioLoaded(true);
    };
    
    const handleLoadStart = () => {
      console.log('⏳ Iniciando carga de audio...');
    };
    
    const handleProgress = () => {
      console.log('📊 Progreso de carga...');
    };
    
    const handleError = (e: Event) => {
      console.error('❌ Error al cargar audio:', e);
      const audioElement = e.target as HTMLAudioElement;
      console.error('Error code:', audioElement.error?.code);
      console.error('Error message:', audioElement.error?.message);
      console.error('Audio URL:', audioElement.src);
      setError('Error al cargar el audio. Verifica la URL.');
      setAudioLoaded(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('error', handleError);

    if (audio.src) {
      console.log('🔄 Forzando carga de audio desde:', audio.src);
      audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('error', handleError);
    };
  }, [selectedSong, lyrics]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatTimeWithMs = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 1) {
      return parseFloat(timeStr) || 0;
    }
    
    const minutes = parseInt(parts[0]) || 0;
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]) || 0;
    const milliseconds = secondsParts[1] ? parseInt(secondsParts[1].padEnd(3, '0').substring(0, 3)) : 0;
    
    return minutes * 60 + seconds + milliseconds / 1000;
  };

  const formatTimeInput = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const toggleRecordingMode = () => {
    if (!audioLoaded) {
      alert('⚠️ Espera a que el audio se cargue');
      return;
    }
    
    if (!isRecordingMode) {
      setIsRecordingMode(true);
      playAudio();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setIsRecordingMode(false);
      pauseAudio();
      stopListening();
    }
  };

  const startListening = async () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('❌ Tu navegador no soporta reconocimiento de voz');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setIsListening(true);
      if (!isPlaying) playAudio();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('❌ Necesitas dar permiso para usar el micrófono');
        } else {
          alert(`❌ Error: ${error.message}`);
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        console.log('Error al detener');
      }
    }
  };

  const addLineWithTimestamp = () => {
    if (!lyrics) return;

    const newLine: LyricLine = {
      time: parseFloat(currentTime.toFixed(3)),
      text: currentLineText.trim() || '',
    };

    setLyrics({
      ...lyrics,
      lines: [...lyrics.lines, newLine],
    });

    setCurrentLineText('');
    inputRef.current?.focus();
  };

  const handleRecordingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentLineText.trim()) {
      addLineWithTimestamp();
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Error al reproducir:', err);
        alert('Error al reproducir el audio');
      });
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      playAudio();
    }
  };

  const updateLine = (index: number, text: string) => {
    if (!lyrics) return;
    const updated = lyrics.lines.map((line, i) =>
      i === index ? { ...line, text } : line
    );
    setLyrics({ ...lyrics, lines: updated });
  };

  const updateTime = (index: number, time: number) => {
    if (!lyrics) return;
    const updated = lyrics.lines.map((line, i) =>
      i === index ? { ...line, time } : line
    );
    setLyrics({ ...lyrics, lines: updated });
  };

  const addLine = () => {
    if (!lyrics) return;
    
    const currentAudioTime = audioRef.current?.currentTime || 0;
    const lastTime = lyrics.lines.length > 0 
      ? lyrics.lines[lyrics.lines.length - 1].time + 1
      : currentAudioTime;

    setLyrics({
      ...lyrics,
      lines: [...lyrics.lines, { time: parseFloat(lastTime.toFixed(3)), text: '' }],
    });
  };

  const removeLine = (index: number) => {
    if (!lyrics) return;
    const filtered = lyrics.lines.filter((_, i) => i !== index);
    setLyrics({ ...lyrics, lines: filtered });
  };

  const saveLyrics = async () => {
    if (!lyrics || !selectedSong) return;

    if (lyrics.lines.length === 0) {
      alert('⚠️ Agrega al menos una línea de letra');
      return;
    }

    const hasEmptyLines = lyrics.lines.some(line => !line.text.trim());
    if (hasEmptyLines) {
      if (!confirm('⚠️ Hay líneas vacías. ¿Deseas guardar de todas formas?')) {
        return;
      }
    }

    setSaving(true);
    try {
      const method = lyricsExist ? 'PUT' : 'POST';
      const url = `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lyrics),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      const savedLyrics = await res.json();
      setLyrics(savedLyrics);
      setLyricsExist(true);
      
      alert('🎵 Letras guardadas correctamente');
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteLyrics = async () => {
    if (!lyrics || !selectedSong || !lyricsExist) return;

    if (!confirm('🗑️ ¿Estás seguro de eliminar todas las letras?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(
        `https://backend-zoonito-6x8h.vercel.app/api/lyrics/${selectedSong._id}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Error al eliminar letras');

      setLyrics({
        songId: selectedSong._id,
        title: selectedSong.title,
        artist: selectedSong.artist,
        lines: [],
      });
      setLyricsExist(false);
      
      alert('🗑️ Letras eliminadas correctamente');
    } catch (err) {
      alert('❌ Error al eliminar letras');
    } finally {
      setDeleting(false);
    }
  };

  const importLRC = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lyrics) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines: LyricLine[] = [];

      content.split('\n').forEach((line) => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const centiseconds = parseInt(match[3]);
          const text = match[4].trim();
          
          const time = minutes * 60 + seconds + centiseconds / 100;
          lines.push({ time, text });
        }
      });

      if (lines.length > 0) {
        setLyrics({ ...lyrics, lines });
        alert(`✅ ${lines.length} líneas importadas`);
      } else {
        alert('⚠️ No se encontraron líneas válidas');
      }
    };

    reader.readAsText(file);
  };

  const sortLines = () => {
    if (!lyrics) return;
    const sorted = [...lyrics.lines].sort((a, b) => a.time - b.time);
    setLyrics({ ...lyrics, lines: sorted });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || !lyrics) return;
    
    const items = [...lyrics.lines];
    const draggedItem = items[draggedIndex];
    
    items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    
    setLyrics({ ...lyrics, lines: items });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTimelineMarkerDragStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggingTimelineIndex(index);
    setIsDraggingTimeline(true);
    
    // Mostrar preview inicial
    if (lyrics) {
      setDragPreviewTime(lyrics.lines[index].time);
      const position = (lyrics.lines[index].time / audioDuration) * 100;
      setDragPreviewPosition(position);
    }
  };

  const handleTimelineMarkerDrag = (e: React.MouseEvent) => {
    if (!isDraggingTimeline || draggingTimelineIndex === null || !lyrics) return;

    const timelineElement = e.currentTarget as HTMLElement;
    const rect = timelineElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * audioDuration;
    const roundedTime = parseFloat(newTime.toFixed(3));

    // Actualizar preview
    setDragPreviewTime(roundedTime);
    setDragPreviewPosition(percentage * 100);

    // Actualizar tiempo real
    updateTime(draggingTimelineIndex, roundedTime);
  };

  const handleTimelineMarkerDragEnd = () => {
    setIsDraggingTimeline(false);
    setDraggingTimelineIndex(null);
    setDragPreviewTime(null);
    setDragPreviewPosition(0);
  };

  if (error && !selectedSong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 p-6 pb-32">
      <div className="max-w-5xl mx-auto">
        {selectedSong && (
          <audio 
            ref={audioRef} 
            src={selectedSong.audioUrl}
            preload="auto"
            crossOrigin="anonymous"
            onLoadedMetadata={() => console.log('🎵 Metadata del audio cargada')}
            onCanPlay={() => console.log('🎵 Audio puede reproducirse')}
            onError={(e) => console.error('🎵 Error en elemento audio:', e)}
          />
        )}

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Music className="text-pink-400" />
              Editor de Letras
            </h1>
            {selectedSong && (
              <p className="text-gray-300 mt-1">
                {selectedSong.title} - {selectedSong.artist}
              </p>
            )}
          </div>

          {lyricsExist && (
            <button
              onClick={deleteLyrics}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-800 text-white rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              {deleting ? 'Eliminando...' : 'Eliminar Todo'}
            </button>
          )}
        </div>

        {selectedSong && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-purple-900/95 to-purple-900/90 backdrop-blur-xl border-t border-white/20 shadow-2xl z-50">
            <div className="max-w-5xl mx-auto p-4">
              <div className="flex items-center gap-4">
                {selectedSong.coverUrl && (
                  <img
                    src={selectedSong.coverUrl}
                    alt={selectedSong.title}
                    className="w-16 h-16 rounded-lg object-cover shadow-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base truncate">{selectedSong.title}</h3>
                  <p className="text-gray-300 text-sm truncate">{selectedSong.artist}</p>
                  
                  {audioLoaded && (
                    <div className="mt-2 relative h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
                        style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                      />
                      <div 
                        className="absolute inset-0 cursor-pointer"
                        onClick={(e) => {
                          if (!audioRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          audioRef.current.currentTime = percentage * audioDuration;
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-white text-sm font-mono">
                    {audioLoaded ? (
                      <div className="text-center">
                        <div className="font-bold">{formatTime(currentTime)}</div>
                        <div className="text-xs text-gray-400">{formatTime(audioDuration)}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">Cargando...</div>
                    )}
                  </div>
                  
                  <button
                    onClick={restartAudio}
                    disabled={!audioLoaded}
                    className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    title="Reiniciar"
                  >
                    <SkipBack size={20} />
                  </button>
                  
                  <button
                    onClick={isPlaying ? pauseAudio : playAudio}
                    disabled={!audioLoaded}
                    className="p-4 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-lg hover:shadow-pink-500/50"
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>

                  {isRecordingMode && (
                    <div className="px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                      <div className="text-green-400 font-mono text-sm font-bold">
                        {formatTimeWithMs(currentTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSong && audioLoaded && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-blue-400" size={20} />
              <h3 className="text-white font-bold">Línea Temporal</h3>
              <span className="text-gray-400 text-sm ml-auto">
                {formatTime(currentTime)} / {formatTime(audioDuration)}
              </span>
            </div>
            
            <div 
              className="relative h-16 bg-black/30 rounded-lg overflow-visible border border-white/20"
              style={{ userSelect: 'none' }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 transition-all duration-100"
                style={{ width: `${(currentTime / audioDuration) * 100}%` }}
              />
              
              <div 
                className="absolute top-0 h-full w-1 bg-pink-500 shadow-lg shadow-pink-500/50 transition-all duration-100 z-10"
                style={{ left: `${(currentTime / audioDuration) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50" />
              </div>
              
              {/* Preview flotante al arrastrar */}
              {isDraggingTimeline && dragPreviewTime !== null && draggingTimelineIndex !== null && (
                <div
                  className="absolute z-50 pointer-events-none"
                  style={{ 
                    left: `${dragPreviewPosition}%`,
                    top: '-60px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="bg-yellow-400 text-black px-4 py-3 rounded-lg shadow-2xl border-2 border-yellow-500 animate-pulse">
                    <div className="text-center">
                      <div className="text-xs font-semibold mb-1">
                        Línea #{draggingTimelineIndex + 1}
                      </div>
                      <div className="font-mono font-bold text-lg">
                        {formatTimeWithMs(dragPreviewTime)}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {dragPreviewTime.toFixed(3)}s
                      </div>
                    </div>
                    {/* Flecha apuntando hacia abajo */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-yellow-500"></div>
                  </div>
                </div>
              )}
              
              {lyrics && lyrics.lines.map((line, index) => {
                const position = (line.time / audioDuration) * 100;
                const isDragging = draggingTimelineIndex === index;
                return (
                  <div
                    key={index}
                    className={`absolute top-0 h-full transition-all group z-20 ${
                      isDragging 
                        ? 'w-2 bg-yellow-400 cursor-grabbing scale-110' 
                        : 'w-1 bg-green-400/70 hover:bg-green-400 hover:w-1.5 cursor-grab'
                    }`}
                    style={{ left: `${position}%` }}
                    title={isDragging ? undefined : `${formatTimeWithMs(line.time)} - ${line.text}`}
                    onMouseDown={(e) => handleTimelineMarkerDragStart(e, index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (audioRef.current && !isDraggingTimeline) {
                        audioRef.current.currentTime = line.time;
                      }
                    }}
                  >
                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full transition-all shadow-lg ${
                      isDragging 
                        ? 'w-4 h-4 bg-yellow-400 opacity-100 shadow-yellow-400/50' 
                        : 'w-2.5 h-2.5 bg-green-400 opacity-0 group-hover:opacity-100 shadow-green-400/50'
                    }`} />
                    
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full transition-all shadow-lg ${
                      isDragging 
                        ? 'w-4 h-4 bg-yellow-400 opacity-100 shadow-yellow-400/50' 
                        : 'w-2.5 h-2.5 bg-green-400 opacity-0 group-hover:opacity-100 shadow-green-400/50'
                    }`} />
                    
                    {!isDragging && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black/95 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 border border-green-400/50">
                        <div className="font-bold text-green-400">{formatTimeWithMs(line.time)}</div>
                        <div className="text-gray-300 mt-1 max-w-xs truncate">{line.text || '(vacío)'}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div 
                className="absolute inset-0 cursor-pointer"
                onMouseMove={isDraggingTimeline ? handleTimelineMarkerDrag : undefined}
                onMouseUp={handleTimelineMarkerDragEnd}
                onMouseLeave={handleTimelineMarkerDragEnd}
                onClick={(e) => {
                  if (isDraggingTimeline) return;
                  if (!audioRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  audioRef.current.currentTime = percentage * audioDuration;
                }}
              />
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-pink-500 rounded-full" />
                <span>Reproducción actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-400" />
                <span>Líneas de letra ({lyrics?.lines.length || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-yellow-400 rounded" />
                <span>Arrastra para ajustar tiempo</span>
              </div>
              <div className="ml-auto text-gray-500">
                💡 Click para saltar / Arrastra líneas verdes
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md p-6 rounded-xl mb-6 border-2 border-green-500/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="text-green-400" size={24} />
              <div>
                <h3 className="text-white font-bold text-lg">
                  Sincronización en Tiempo Real
                </h3>
                <p className="text-gray-300 text-sm">
                  Habla con pausas para crear líneas automáticas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isRecordingMode && (
                <div className="bg-black/30 px-6 py-3 rounded-lg border-2 border-green-500">
                  <div className="text-green-400 font-mono text-3xl font-bold leading-none">
                    {formatTimeWithMs(currentTime)}
                  </div>
                  <div className="text-gray-400 text-xs text-center mt-1">
                    {currentTime.toFixed(3)}s
                  </div>
                </div>
              )}
              <button
                onClick={toggleRecordingMode}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  isRecordingMode
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isRecordingMode ? '⏹ Detener' : '🎙️ Iniciar'}
              </button>
            </div>
          </div>

          {isRecordingMode && (
            <>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!speechSupported}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white disabled:bg-gray-600`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  {isListening ? 'Detener Voz' : 'Activar Voz'}
                </button>

                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAddLines}
                    onChange={(e) => setAutoAddLines(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Auto-agregar líneas</span>
                </label>

                {isListening && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex gap-1">
                      <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                    </div>
                    <span className="text-green-400 text-sm font-bold">Escuchando...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentLineText}
                    onChange={(e) => setCurrentLineText(e.target.value)}
                    onKeyPress={handleRecordingKeyPress}
                    className="w-full px-4 py-3 pr-32 rounded-lg bg-white/10 text-white border-2 border-green-500 focus:border-green-400 focus:outline-none text-lg"
                    placeholder="Escribe o usa el reconocimiento de voz..."
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 font-mono font-bold text-right">
                    <div className="text-base">{formatTime(currentTime)}</div>
                    <div className="text-xs opacity-80">{formatTimeWithMs(currentTime)}</div>
                  </div>
                </div>
                <button
                  onClick={addLineWithTimestamp}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
                >
                  ✓ Agregar
                </button>
              </div>
            </>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500"></div>
          </div>
        )}

        {lyrics && !loading && (
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl">
            <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-white/20">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors">
                <Upload size={16} />
                Importar .lrc
                <input
                  type="file"
                  accept=".lrc"
                  onChange={importLRC}
                  className="hidden"
                />
              </label>

              <button
                onClick={sortLines}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                🔢 Ordenar por tiempo
              </button>

              <div className="ml-auto text-gray-300 text-sm flex items-center gap-2">
                📊 {lyrics.lines.length} líneas
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2 scrollbar-thin" ref={lyricsContainerRef}>
              {lyrics.lines.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay líneas. Usa el modo de sincronización o agrega manualmente.
                </p>
              ) : (
                lyrics.lines.map((line, index) => {
                  const isActive = activeLineIndex === index;
                  return (
                    <div 
                      key={index} 
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-move ${
                        isActive
                          ? 'bg-green-500/30 border-2 border-green-400 shadow-lg shadow-green-500/30 scale-105'
                          : draggedIndex === index 
                          ? 'bg-pink-500/30 opacity-50 scale-95' 
                          : dragOverIndex === index
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <div className="w-4 h-0.5 bg-current rounded" />
                          <div className="w-4 h-0.5 bg-current rounded" />
                          <div className="w-4 h-0.5 bg-current rounded" />
                        </div>
                      </div>
                      
                      <span className={`text-sm w-8 font-bold ${isActive ? 'text-green-300' : 'text-gray-400'}`}>
                        {index + 1}
                      </span>
                      
                      <div className="flex flex-col gap-1 w-32">
                        <input
                          type="text"
                          value={formatTimeInput(line.time)}
                          onChange={(e) => updateTime(index, parseTimeInput(e.target.value))}
                          className={`w-full px-3 py-2 rounded-lg text-white border focus:outline-none text-sm font-mono ${
                            isActive
                              ? 'bg-green-500/20 border-green-400 ring-2 ring-green-400/50'
                              : 'bg-white/10 border-white/20 focus:border-pink-500'
                          }`}
                          placeholder="00:00.000"
                          title="Formato: MM:SS.mmm"
                        />
                        <span className={`text-xs px-1 font-mono font-bold ${isActive ? 'text-green-300' : 'text-green-400'}`}>
                          {line.time.toFixed(3)}s
                        </span>
                      </div>
                      
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => updateLine(index, e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-white border focus:outline-none ${
                          isActive
                            ? 'bg-green-500/20 border-green-400 ring-2 ring-green-400/50 font-bold'
                            : 'bg-white/10 border-white/20 focus:border-pink-500'
                        }`}
                        placeholder="Escribe la letra aquí..."
                      />
                      
                      {isActive && (
                        <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                          EN VIVO
                        </div>
                      )}
                      
                      <button
                        onClick={() => removeLine(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Eliminar línea"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={addLine}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Agregar línea
              </button>

              <button
                onClick={saveLyrics}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-800 text-white rounded-lg font-bold transition-colors"
              >
                <Save size={20} />
                {saving ? 'Guardando...' : lyricsExist ? 'Actualizar Letras' : 'Crear Letras'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}