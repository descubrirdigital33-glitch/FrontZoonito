'use client';

import { Socket } from 'socket.io-client';
interface SetupAudioMixerParams {
  audioContext: AudioContext;
  sessionId: string;
  socket: Socket | null;
  micVolume: number;
  musicVolume: number;
}

interface AudioMixerResult {
  mediaStream: MediaStream;
  mixer: GainNode;
  micSource: MediaStreamAudioSourceNode;
  micGain: GainNode;
  trackSource: MediaElementAudioSourceNode | null;
  trackGain: GainNode;
  processor: ScriptProcessorNode;
  cleanup: () => void;
}

interface CleanupParams {
  mediaStream: MediaStream | null;
  processor: ScriptProcessorNode | null;
  mixerNode: GainNode | null;
  micSource: MediaStreamAudioSourceNode | null;
  micGain: GainNode | null;
  trackSource: MediaElementAudioSourceNode | null;
  trackGain: GainNode | null;
  audioContext: AudioContext | null;
}

/**
 * Configura el mixer de audio con controles independientes para micrófono y música
 */
export const setupAudioMixer = async ({
  audioContext,
  sessionId,
  socket,
  micVolume,
  musicVolume
}: SetupAudioMixerParams): Promise<AudioMixerResult | null> => {
  try {
    // Crear el mixer principal
    const mixer = audioContext.createGain();
    mixer.gain.value = 1.0;

    // 🎤 CONFIGURAR MICRÓFONO con control de ganancia independiente
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    });

    const micSource = audioContext.createMediaStreamSource(micStream);
    const micGain = audioContext.createGain();
    micGain.gain.value = micVolume;

    // Conectar: Micrófono -> Ganancia del Mic -> Mixer
    micSource.connect(micGain);
    micGain.connect(mixer);
    console.log(`🎤 Micrófono conectado con volumen: ${Math.round(micVolume * 100)}%`);

    // 🎵 CONFIGURAR MÚSICA con control de ganancia independiente
    const trackGain = audioContext.createGain();
    trackGain.gain.value = musicVolume;

    let trackSourceRef: MediaElementAudioSourceNode | null = null;

    const connectTrackAudio = () => {
      const audioElements = document.querySelectorAll('audio');
      if (audioElements.length > 0) {
        const audioElement = audioElements[0] as HTMLAudioElement;
        if (!trackSourceRef) {
          try {
            const trackSource = audioContext.createMediaElementSource(audioElement);
            trackSourceRef = trackSource;

            // Conectar: Música -> Ganancia de Música -> Mixer
            trackSource.connect(trackGain);
            trackGain.connect(mixer);

            // También conectar al destino para que se escuche localmente
            trackSource.connect(audioContext.destination);

            console.log(`🎵 Música conectada con volumen: ${Math.round(musicVolume * 100)}%`);
          } catch (err) {
            console.warn('⚠️ Error conectando audio de música:', err);
          }
        }
      } else {
        console.log('⏳ Esperando elemento <audio>...');
      }
    };

    connectTrackAudio();
    const reconnectInterval = setInterval(connectTrackAudio, 2000);

    // 📡 PROCESADOR PARA TRANSMITIR
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    mixer.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!socket?.connected) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const buffer = new ArrayBuffer(inputData.length * 2);
      const view = new Int16Array(buffer);

      // Convertir a Int16
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      socket.emit('live-audio-chunk', { sessionId, audioChunk: buffer });
    };

    console.log('✅ Mixer configurado: Mic y Música con controles independientes');

    // Función de limpieza
    const cleanup = () => {
      clearInterval(reconnectInterval);
      cleanupAudioMixer({
        mediaStream: micStream,
        processor,
        mixerNode: mixer,
        micSource,
        micGain,
        trackSource: trackSourceRef,
        trackGain,
        audioContext
      });
    };

    return {
      mediaStream: micStream,
      mixer,
      micSource,
      micGain,
      trackSource: trackSourceRef,
      trackGain,
      processor,
      cleanup
    };
  } catch (error) {
    console.error('❌ Error en setupAudioMixer:', error);
    return null;
  }
};

/**
 * Limpia todos los recursos de audio
 */
export const cleanupAudioMixer = ({
  mediaStream,
  processor,
  mixerNode,
  micSource,
  micGain,
  trackSource,
  trackGain,
  audioContext
}: CleanupParams) => {
  try {
    // Detener todas las pistas del stream
    mediaStream?.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Pista detenida:', track.kind);
    });

    // Desconectar nodos
    processor?.disconnect();
    mixerNode?.disconnect();
    micSource?.disconnect();
    micGain?.disconnect();
    trackSource?.disconnect();
    trackGain?.disconnect();

    // Cerrar el contexto de audio
    if (audioContext?.state !== 'closed') {
      audioContext?.close();
      console.log('🔇 AudioContext cerrado');
    }

    console.log('✅ Recursos de audio liberados');
  } catch (error) {
    console.error('⚠️ Error al limpiar recursos de audio:', error);
  }
};

/**
 * Ajusta el volumen del micrófono en tiempo real
 */
export const setMicVolume = (micGain: GainNode | null, volume: number, isMuted: boolean = false) => {
  if (micGain) {
    micGain.gain.value = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    console.log(`🎤 Volumen del micrófono ajustado: ${isMuted ? 0 : Math.round(volume * 100)}%`);
  }
};

/**
 * Ajusta el volumen de la música en tiempo real
 */
export const setMusicVolume = (trackGain: GainNode | null, volume: number) => {
  if (trackGain) {
    trackGain.gain.value = Math.max(0, Math.min(1, volume));
    console.log(`🎵 Volumen de la música ajustado: ${Math.round(volume * 100)}%`);
  }

};
