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

//   // Inicializar Socket.IO
//  useEffect(() => {
//     const socket: Socket = io("https://backend-zoonito-6x8h.vercel.app", {
//       path: "/api/socket",
//       transports: ["websocket", "polling"],
//     });

//     socketRef.current = socket;

//     socket.on('connect', () => {
//       console.log('✅ Conectado a Socket.IO');
//       socket.emit('join-radio', { sessionId });
//     });

//     socket.on('listener-count', (count: number) => {
//       setListenerCount(count);
//     });

//     socket.on('connect_error', (error: Error) => {
//       console.error('❌ Error de conexión:', error);
//       setStreamError('Error de conexión con el servidor');
//     });

//     return () => {
//       socket.emit('leave-radio', { sessionId });
//       socket.disconnect();
//     };
//   }, [sessionId]);

//   // OWNER: Capturar y transmitir micrófono
//   useEffect(() => {
//     if (!isOwner || !isPlaying) {
//       if (mediaStreamRef.current) {
//         mediaStreamRef.current.getTracks().forEach(track => track.stop());
//         mediaStreamRef.current = null;
//       }
//       if (processorRef.current) {
//         processorRef.current.disconnect();
//         processorRef.current = null;
//       }
//       return;
//     }

//     const startMicrophoneStream = async () => {
//       try {
//         setIsLoadingStream(true);
//         setStreamError(null);

//         const stream = await navigator.mediaDevices.getUserMedia({
//           audio: {
//             echoCancellation: true,
//             noiseSuppression: true,
//             autoGainControl: true,
//             sampleRate: 44100
//           }
//         });

//         mediaStreamRef.current = stream;

//         const windowWithAudio = window as WindowWithAudioContext;
//         const AudioContextConstructor = window.AudioContext || windowWithAudio.webkitAudioContext;
        
//         if (!AudioContextConstructor) {
//           throw new Error('AudioContext no soportado en este navegador');
//         }

//         const audioContext = new AudioContextConstructor({
//           sampleRate: 44100
//         });
//         audioContextRef.current = audioContext;

//         const source = audioContext.createMediaStreamSource(stream);
//         const processor = audioContext.createScriptProcessor(4096, 1, 1);
//         processorRef.current = processor;

//         processor.onaudioprocess = (e: AudioProcessingEvent) => {
//           if (!socketRef.current?.connected) return;

//           const inputData = e.inputBuffer.getChannelData(0);
//           const buffer = new ArrayBuffer(inputData.length * 2);
//           const view = new Int16Array(buffer);
          
//           for (let i = 0; i < inputData.length; i++) {
//             const s = Math.max(-1, Math.min(1, inputData[i]));
//             view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
//           }

//           socketRef.current.emit('live-audio-chunk', {
//             sessionId,
//             audioChunk: buffer
//           });
//         };

//         source.connect(processor);
//         processor.connect(audioContext.destination);

//         setIsLoadingStream(false);
//         console.log('🎤 Micrófono transmitiendo');

//       } catch (error) {
//         console.error('❌ Error capturando micrófono:', error);
//         const errorMessage = error instanceof Error 
//           ? error.message 
//           : 'No se pudo acceder al micrófono';
//         setStreamError(errorMessage);
//         setIsLoadingStream(false);
//       }
//     };

//     startMicrophoneStream();

//     return () => {
//       if (mediaStreamRef.current) {
//         mediaStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//       if (processorRef.current) {
//         processorRef.current.disconnect();
//       }
//       if (audioContextRef.current) {
//         audioContextRef.current.close();
//       }
//     };
//   }, [isOwner, isPlaying, sessionId]);

//   // LISTENER: Recibir y reproducir audio
//   useEffect(() => {
//     if (isOwner || !isPlaying) {
//       audioQueueRef.current = [];
//       isPlayingQueueRef.current = false;
//       return;
//     }

//     const socket = socketRef.current;
//     if (!socket) return;

//     const windowWithAudio = window as WindowWithAudioContext;
//     const AudioContextConstructor = window.AudioContext || windowWithAudio.webkitAudioContext;
    
//     if (!AudioContextConstructor) {
//       setStreamError('AudioContext no soportado en este navegador');
//       return;
//     }

//     const audioContext = new AudioContextConstructor({
//       sampleRate: 44100,
//       latencyHint: 'interactive'
//     });
//     audioContextRef.current = audioContext;

//     let nextPlayTime = audioContext.currentTime;

//     const playAudioQueue = () => {
//       if (audioQueueRef.current.length === 0 || !isPlayingQueueRef.current) {
//         return;
//       }

//       const audioData = audioQueueRef.current.shift();
//       if (!audioData) return;
      
//       const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
//       buffer.getChannelData(0).set(audioData);

//       const source = audioContext.createBufferSource();
//       source.buffer = buffer;
//       source.connect(audioContext.destination);

//       if (nextPlayTime < audioContext.currentTime) {
//         nextPlayTime = audioContext.currentTime;
//       }
      
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
      
//       for (let i = 0; i < int16Array.length; i++) {
//         float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
//       }

//       audioQueueRef.current.push(float32Array);

//       if (!isPlayingQueueRef.current) {
//         isPlayingQueueRef.current = true;
//         setIsLoadingStream(false);
//         playAudioQueue();
//       }
//     };

//     socket.on('receive-live-audio', handleReceiveAudio);

//     setIsLoadingStream(true);
//     console.log('👂 Escuchando stream en vivo');

//     return () => {
//       socket.off('receive-live-audio', handleReceiveAudio);
//       audioQueueRef.current = [];
//       isPlayingQueueRef.current = false;
//       if (audioContextRef.current) {
//         audioContextRef.current.close();
//       }
//     };
//   }, [isOwner, isPlaying, sessionId]);

//   return {
//     isLoadingStream,
//     streamError,
//     listenerCount
//   };

// };



'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRadioStreamProps {
  sessionId: string;
  isOwner: boolean;
  isPlaying: boolean;
}

interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export const useRadioStream = ({ sessionId, isOwner, isPlaying }: UseRadioStreamProps) => {
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [listenerCount, setListenerCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingQueueRef = useRef<boolean>(false);

  // 🔌 Conectar al backend
  useEffect(() => {
    const socket: Socket = io("https://backend-zoonito-6x8h.vercel.app", {
      path: "/api/socket",
      transports: ["polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // "websocket", 
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

  // 🎙️ Propietario transmite desde micrófono
  useEffect(() => {
    if (!isOwner || !isPlaying) {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      processorRef.current?.disconnect();
      processorRef.current = null;
      return;
    }

    const startMicrophoneStream = async () => {
      try {
        setIsLoadingStream(true);
        setStreamError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });

        mediaStreamRef.current = stream;

        const AudioContextConstructor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
        if (!AudioContextConstructor) throw new Error('AudioContext no soportado');

        const audioContext = new AudioContextConstructor({ sampleRate: 44100 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!socketRef.current?.connected) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new Int16Array(buffer);

          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          socketRef.current.emit('live-audio-chunk', { sessionId, audioChunk: buffer });
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setIsLoadingStream(false);
        console.log('🎤 Transmitiendo audio del micrófono');
      } catch (err) {
        console.error('❌ Error capturando micrófono:', err);
        setStreamError('No se pudo acceder al micrófono');
        setIsLoadingStream(false);
      }
    };

    startMicrophoneStream();

    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      processorRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, [isOwner, isPlaying, sessionId]);

  // 🎧 Oyente recibe y reproduce audio
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

      // 🔹 Crear un Float32Array nuevo garantizado
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

      if (audioQueueRef.current.length > 0) {
        requestAnimationFrame(playAudioQueue);
      } else {
        isPlayingQueueRef.current = false;
      }
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
    console.log('👂 Escuchando transmisión en vivo');

    return () => {
      socket.off('receive-live-audio', handleReceiveAudio);
      audioQueueRef.current = [];
      audioContextRef.current?.close();
    };
  }, [isOwner, isPlaying, sessionId]);

  return { isLoadingStream, streamError, listenerCount };
};








