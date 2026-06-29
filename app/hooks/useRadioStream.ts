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
    const socket: Socket = io("https://backendzoonito.onrender.com", {
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
