// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { io, Socket } from 'socket.io-client';

// interface UseRadioStreamProps {
//   sessionId: string;
//   isOwner: boolean;
//   isPlaying: boolean;
// }

// interface WindowWithAudioContext extends Window {
//   webkitAudioContext?: typeof AudioContext;
// }

// export const useRadioStream = ({ sessionId, isOwner, isPlaying }: UseRadioStreamProps) => {
//   const [isLoadingStream, setIsLoadingStream] = useState(false);
//   const [streamError, setStreamError] = useState<string | null>(null);
//   const [listenerCount, setListenerCount] = useState(0);

//   const socketRef = useRef<Socket | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const mediaStreamRef = useRef<MediaStream | null>(null);
//   const processorRef = useRef<ScriptProcessorNode | null>(null);
//   const audioQueueRef = useRef<Float32Array[]>([]);
//   const isPlayingQueueRef = useRef<boolean>(false);
  
//   // Nuevas referencias para el mixer
//   const mixerNodeRef = useRef<GainNode | null>(null);
//   const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
//   const trackSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

//   // 🔌 Conectar al backend
//   useEffect(() => {
//     const socket: Socket = io("https://backendzoonito-production.up.railway.app/", {
//       path: "/api/socket",
//       transports: ["websocket", "polling"],
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionAttempts: 5,
//     });

//     socketRef.current = socket;

//     socket.on('connect', () => {
//       console.log('✅ Conectado al servidor WebSocket');
//       socket.emit('join-radio', { sessionId });
//     });

//     socket.on('listener-count', (count: number) => setListenerCount(count));

//     socket.on('connect_error', (error: Error) => {
//       console.error('❌ Error de conexión:', error);
//       setStreamError('Error al conectar con el servidor');
//     });

//     return () => {
//       socket.emit('leave-radio', { sessionId });
//       socket.disconnect();
//     };
//   }, [sessionId]);

//   // 🎙️🎵 Propietario transmite micrófono + canciones
//   useEffect(() => {
//     if (!isOwner || !isPlaying) {
//       // Limpiar todo
//       mediaStreamRef.current?.getTracks().forEach(track => track.stop());
//       mediaStreamRef.current = null;
//       processorRef.current?.disconnect();
//       processorRef.current = null;
//       mixerNodeRef.current?.disconnect();
//       mixerNodeRef.current = null;
//       micSourceRef.current?.disconnect();
//       micSourceRef.current = null;
//       trackSourceRef.current?.disconnect();
//       trackSourceRef.current = null;
//       return;
//     }

//     const startBroadcast = async () => {
//       try {
//         setIsLoadingStream(true);
//         setStreamError(null);

//         // 1️⃣ Crear AudioContext
//         const AudioContextConstructor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
//         if (!AudioContextConstructor) throw new Error('AudioContext no soportado');

//         const audioContext = new AudioContextConstructor({ sampleRate: 44100 });
//         audioContextRef.current = audioContext;

//         // 2️⃣ Crear nodo mezclador (mixer) para combinar micrófono + música
//         const mixer = audioContext.createGain();
//         mixer.gain.value = 1.0;
//         mixerNodeRef.current = mixer;

//         // 3️⃣ Capturar micrófono
//         const micStream = await navigator.mediaDevices.getUserMedia({
//           audio: {
//             echoCancellation: true,
//             noiseSuppression: true,
//             autoGainControl: true,
//             sampleRate: 44100
//           }
//         });

//         mediaStreamRef.current = micStream;
//         const micSource = audioContext.createMediaStreamSource(micStream);
//         micSourceRef.current = micSource;
        
//         // Conectar micrófono al mixer
//         micSource.connect(mixer);
//         console.log('🎤 Micrófono conectado al mixer');

//         // 4️⃣ Buscar y conectar el elemento <audio> de las canciones
//         const connectTrackAudio = () => {
//           const audioElements = document.querySelectorAll('audio');
          
//           if (audioElements.length > 0) {
//             const audioElement = audioElements[0] as HTMLAudioElement;
            
//             // Solo crear fuente si no existe ya
//             if (!trackSourceRef.current) {
//               try {
//                 const trackSource = audioContext.createMediaElementSource(audioElement);
//                 trackSourceRef.current = trackSource;
                
//                 // Conectar al mixer (para transmitir)
//                 trackSource.connect(mixer);
                
//                 // También conectar directamente a destination (para escuchar localmente)
//                 trackSource.connect(audioContext.destination);
                
//                 console.log('🎵 Audio de canción conectado al mixer');
//               } catch (err) {
//                 console.warn('⚠️ Error conectando audio (puede estar ya conectado):', err);
//               }
//             }
//           } else {
//             console.log('⏳ Esperando elemento <audio>...');
//           }
//         };

//         // Conectar inmediatamente
//         connectTrackAudio();

//         // Reconectar si cambia la canción (cada 2 segundos)
//         const reconnectInterval = setInterval(connectTrackAudio, 2000);

//         // 5️⃣ Crear procesador para capturar y enviar audio mezclado
//         const processor = audioContext.createScriptProcessor(4096, 1, 1);
//         processorRef.current = processor;

//         // Conectar el mixer al procesador
//         mixer.connect(processor);
//         processor.connect(audioContext.destination);

//         processor.onaudioprocess = (e: AudioProcessingEvent) => {
//           if (!socketRef.current?.connected) return;

//           const inputData = e.inputBuffer.getChannelData(0);
//           const buffer = new ArrayBuffer(inputData.length * 2);
//           const view = new Int16Array(buffer);

//           // Convertir Float32 a Int16
//           for (let i = 0; i < inputData.length; i++) {
//             const s = Math.max(-1, Math.min(1, inputData[i]));
//             view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
//           }

//           // Enviar al backend
//           socketRef.current.emit('live-audio-chunk', { sessionId, audioChunk: buffer });
//         };

//         setIsLoadingStream(false);
//         console.log('✅ Transmisión iniciada: Micrófono + Música');

//         return () => clearInterval(reconnectInterval);
//       } catch (err) {
//         console.error('❌ Error iniciando transmisión:', err);
//         setStreamError('No se pudo iniciar la transmisión');
//         setIsLoadingStream(false);
//       }
//     };

//     startBroadcast();

//     return () => {
//       mediaStreamRef.current?.getTracks().forEach(track => track.stop());
//       processorRef.current?.disconnect();
//       mixerNodeRef.current?.disconnect();
//       micSourceRef.current?.disconnect();
//       trackSourceRef.current?.disconnect();
//       audioContextRef.current?.close();
//     };
//   }, [isOwner, isPlaying, sessionId]);

//   // 🎧 Oyente recibe y reproduce audio
//   useEffect(() => {
//     if (isOwner || !isPlaying) return;

//     const socket = socketRef.current;
//     if (!socket) return;

//     const AudioContextConstructor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
//     if (!AudioContextConstructor) {
//       setStreamError('AudioContext no soportado');
//       return;
//     }

//     const audioContext = new AudioContextConstructor({ sampleRate: 44100 });
//     audioContextRef.current = audioContext;
//     let nextPlayTime = audioContext.currentTime;

//     const playAudioQueue = () => {
//       if (audioQueueRef.current.length === 0 || !isPlayingQueueRef.current) return;

//       const audioData = audioQueueRef.current.shift();
//       if (!audioData) return;

//       // Crear Float32Array nuevo garantizado
//       const float32Data = new Float32Array(audioData.length);
//       float32Data.set(audioData);

//       const buffer = audioContext.createBuffer(1, float32Data.length, audioContext.sampleRate);
//       buffer.copyToChannel(float32Data, 0);

//       const source = audioContext.createBufferSource();
//       source.buffer = buffer;
//       source.connect(audioContext.destination);

//       if (nextPlayTime < audioContext.currentTime) nextPlayTime = audioContext.currentTime;
//       source.start(nextPlayTime);
//       nextPlayTime += buffer.duration;

//       if (audioQueueRef.current.length > 0) {
//         requestAnimationFrame(playAudioQueue);
//       } else {
//         isPlayingQueueRef.current = false;
//       }
//     };

//     const handleReceiveAudio = (audioChunk: ArrayBuffer) => {
//       const int16Array = new Int16Array(audioChunk);
//       const float32Array = new Float32Array(int16Array.length);
      
//       // Convertir Int16 a Float32
//       for (let i = 0; i < int16Array.length; i++) {
//         float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
//       }

//       audioQueueRef.current.push(float32Array);

//       if (!isPlayingQueueRef.current) {
//         isPlayingQueueRef.current = true;
//         playAudioQueue();
//       }
//     };

//     socket.on('receive-live-audio', handleReceiveAudio);
//     console.log('👂 Escuchando transmisión en vivo (micrófono + música)');

//     return () => {
//       socket.off('receive-live-audio', handleReceiveAudio);
//       audioQueueRef.current = [];
//       audioContextRef.current?.close();
//     };
//   }, [isOwner, isPlaying, sessionId]);

//   return { isLoadingStream, streamError, listenerCount };
// };


// Nuevo de aca para abajo el de arriba comentado es el que funciona


'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { setupAudioMixer, cleanupAudioMixer } from '../components/audioMixerUtils';

interface UseRadioStreamProps {
  sessionId: string;
  isOwner: boolean;
  isPlaying: boolean;
  micVolume?: number;
  musicVolume?: number;
  isMicMuted?: boolean;
}

interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export const useRadioStream = ({ 
  sessionId, 
  isOwner, 
  isPlaying,
  micVolume = 1.0,
  musicVolume = 0.7,
  isMicMuted = false
}: UseRadioStreamProps) => {
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [listenerCount, setListenerCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  // Referencias para el mixer de audio
  const mixerNodeRef = useRef<GainNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const trackSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const trackGainRef = useRef<GainNode | null>(null);

  // 🔌 Conexión al backend
  useEffect(() => {
    const socket: Socket = io("https://backendzoonito-production.up.railway.app/", {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      socket.emit('join-radio', { sessionId });
    });

    socket.on('listener-count', (count: number) => setListenerCount(count));

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Error de conexión:', error);
      setStreamError('Error al conectar con el servidor');
    });

    return () => {
      socket.emit('leave-radio', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  // 🎚️ Actualizar volumen del micrófono
  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.value = isMicMuted ? 0 : micVolume;
      console.log(`🎤 Volumen del micrófono: ${isMicMuted ? 0 : Math.round(micVolume * 100)}%`);
    }
  }, [micVolume, isMicMuted]);

  // 🎚️ Actualizar volumen de la música
  useEffect(() => {
    if (trackGainRef.current) {
      trackGainRef.current.gain.value = musicVolume;
      console.log(`🎵 Volumen de la música: ${Math.round(musicVolume * 100)}%`);
    }
  }, [musicVolume]);

  // 🎙️ Propietario transmite mic + música
  useEffect(() => {
    if (!isOwner || !isPlaying) {
      cleanupAudioMixer({
        mediaStream: mediaStreamRef.current,
        processor: processorRef.current,
        mixerNode: mixerNodeRef.current,
        micSource: micSourceRef.current,
        micGain: micGainRef.current,
        trackSource: trackSourceRef.current,
        trackGain: trackGainRef.current,
        audioContext: audioContextRef.current
      });

      mediaStreamRef.current = null;
      processorRef.current = null;
      mixerNodeRef.current = null;
      micSourceRef.current = null;
      micGainRef.current = null;
      trackSourceRef.current = null;
      trackGainRef.current = null;
      return;
    }

    const startBroadcast = async () => {
      try {
        setIsLoadingStream(true);
        setStreamError(null);

        const AudioContextConstructor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error('AudioContext no soportado');

        const audioContext = new AudioContextConstructor({ sampleRate: 44100 });
        audioContextRef.current = audioContext;

        const setupResult = await setupAudioMixer({
          audioContext,
          sessionId,
          socket: socketRef.current,
          micVolume: isMicMuted ? 0 : micVolume,
          musicVolume
        });

        if (!setupResult) {
          throw new Error('Error al configurar el mixer de audio');
        }

        mediaStreamRef.current = setupResult.mediaStream;
        mixerNodeRef.current = setupResult.mixer;
        micSourceRef.current = setupResult.micSource;
        micGainRef.current = setupResult.micGain;
        trackGainRef.current = setupResult.trackGain;
        processorRef.current = setupResult.processor;
        trackSourceRef.current = setupResult.trackSource;

        setIsLoadingStream(false);
        console.log('✅ Transmisión iniciada: Micrófono + Música con controles independientes');

        return setupResult.cleanup;
      } catch (err) {
        console.error('❌ Error iniciando transmisión:', err);
        setStreamError('No se pudo iniciar la transmisión');
        setIsLoadingStream(false);
      }
    };

    const cleanupPromise = startBroadcast();

    return () => {
      cleanupPromise?.then(cleanup => cleanup?.());
    };
  }, [isOwner, isPlaying, sessionId]);

  // 🎧 Oyente recibe audio
  useEffect(() => {
    if (isOwner || !isPlaying) return;

    const socket = socketRef.current;
    if (!socket) return;

    const AudioContextConstructor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
    if (!AudioContextConstructor) {
      setStreamError('AudioContext no soportado');
      return;
    }

    const audioContext = new AudioContextConstructor({ sampleRate: 44100 });
    audioContextRef.current = audioContext;
    let nextPlayTime = audioContext.currentTime;

    const playAudioQueue = () => {
      if (audioQueueRef.current.length === 0 || !isPlayingQueueRef.current) return;

      const audioData = audioQueueRef.current.shift();
      if (!audioData) return;

      const float32Data = new Float32Array(audioData.length);
      float32Data.set(audioData);

      const buffer = audioContext.createBuffer(1, float32Data.length, audioContext.sampleRate);
      buffer.copyToChannel(float32Data, 0);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      if (nextPlayTime < audioContext.currentTime) nextPlayTime = audioContext.currentTime;
      source.start(nextPlayTime);
      nextPlayTime += buffer.duration;

      if (audioQueueRef.current.length > 0) requestAnimationFrame(playAudioQueue);
      else isPlayingQueueRef.current = false;
    };

    const handleReceiveAudio = (audioChunk: ArrayBuffer) => {
      const int16Array = new Int16Array(audioChunk);
      const float32Array = new Float32Array(int16Array.length);

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
      }

      audioQueueRef.current.push(float32Array);

      if (!isPlayingQueueRef.current) {
        isPlayingQueueRef.current = true;
        playAudioQueue();
      }
    };

    socket.on('receive-live-audio', handleReceiveAudio);
    console.log('👂 Escuchando transmisión en vivo (micrófono + música)');

    return () => {
      socket.off('receive-live-audio', handleReceiveAudio);
      audioQueueRef.current = [];
      audioContextRef.current?.close();
    };
  }, [isOwner, isPlaying, sessionId]);

  return { isLoadingStream, streamError, listenerCount };
};
