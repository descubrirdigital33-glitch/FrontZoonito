'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { setupAudioMixer, cleanupAudioMixer, captureSystemAudio, type SystemAudioResult } from '../components/audioMixerUtils';

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

export interface NowPlayingData {
  id: string | null;
  titulo: string | null;
  artista: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
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

  // NUEVO: estado de "qué se está escuchando ahora", lo reciben los oyentes (no-owner)
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);

  // 🎬 NUEVO: estado de "compartir audio de pestaña/pantalla" (para YouTube)
  const [isSharingSystemAudio, setIsSharingSystemAudio] = useState(false);
  const [systemAudioError, setSystemAudioError] = useState<string | null>(null);

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

  // 🎬 NUEVO: referencia al audio de pestaña/pantalla compartido (YouTube, etc.)
  const systemAudioRef = useRef<SystemAudioResult | null>(null);

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

    // NUEVO: el oyente recibe la info de "now playing" que emite el dueño
    socket.on('now-playing', (data: NowPlayingData) => {
      setNowPlaying(data);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Error de conexión:', error);
      setStreamError('Error al conectar con el servidor');
    });

    return () => {
      socket.off('now-playing');
      socket.emit('leave-radio', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  // NUEVO: función para que el dueño emita el "now playing" por el socket.
  // La expone el hook para conectarla con onNowPlayingChange del MusicaPlayer.
  const emitNowPlaying = useCallback((data: NowPlayingData) => {
    if (!isOwner) return; // solo el dueño emite, los oyentes solo reciben
    socketRef.current?.emit('now-playing', { sessionId, ...data });
    // Reflejamos también localmente del lado del dueño, por si quiere mostrar su propio estado
    setNowPlaying(data);
  }, [isOwner, sessionId]);

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

  // 🎬 NUEVO: función para que el dueño comparta el audio de una pestaña
  // (ej. la pestaña donde tiene YouTube abierto) y se mezcle con el mic
  // para que SÍ llegue a los oyentes.
  const shareSystemAudio = useCallback(async () => {
    if (!isOwner) return;
    setSystemAudioError(null);

    if (!audioContextRef.current || !mixerNodeRef.current) {
      setSystemAudioError('Primero tenés que iniciar la transmisión en vivo (Play) antes de compartir el audio del video.');
      return;
    }

    // Si ya había uno compartido, lo cerramos antes de abrir uno nuevo
    if (systemAudioRef.current) {
      systemAudioRef.current.cleanup();
      systemAudioRef.current = null;
    }

    const result = await captureSystemAudio(audioContextRef.current, mixerNodeRef.current, musicVolume);

    if (!result) {
      setSystemAudioError('No se pudo compartir el audio. Asegurate de tildar "Compartir audio de la pestaña" en el selector del navegador.');
      setIsSharingSystemAudio(false);
      return;
    }

    systemAudioRef.current = result;
    setIsSharingSystemAudio(true);

    // Si el usuario corta el compartir desde la barra/menú del navegador,
    // reflejamos eso en el estado de React.
    const [audioTrack] = result.stream.getAudioTracks();
    audioTrack?.addEventListener('ended', () => {
      systemAudioRef.current = null;
      setIsSharingSystemAudio(false);
    });
  }, [isOwner, musicVolume]);

  // 🎬 NUEVO: cortar manualmente el audio de pestaña/pantalla compartido
  const stopSystemAudio = useCallback(() => {
    if (systemAudioRef.current) {
      systemAudioRef.current.cleanup();
      systemAudioRef.current = null;
    }
    setIsSharingSystemAudio(false);
  }, []);

  // 🎬 Mantener el volumen del audio de sistema sincronizado con musicVolume
  useEffect(() => {
    if (systemAudioRef.current) {
      systemAudioRef.current.gain.gain.value = musicVolume;
    }
  }, [musicVolume]);

  // 🎙️ Propietario transmite mic + música
  useEffect(() => {
    if (!isOwner || !isPlaying) {
      // Si se corta la transmisión, también cortamos el audio de sistema compartido
      if (systemAudioRef.current) {
        systemAudioRef.current.cleanup();
        systemAudioRef.current = null;
        setIsSharingSystemAudio(false);
      }

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

  return {
    isLoadingStream,
    streamError,
    listenerCount,
    nowPlaying,
    emitNowPlaying,
    // 🎬 NUEVO
    isSharingSystemAudio,
    systemAudioError,
    shareSystemAudio,
    stopSystemAudio
  };
};
