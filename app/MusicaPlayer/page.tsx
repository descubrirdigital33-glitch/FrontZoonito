'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Play, Pause, Trash2, Edit2, Music, Save, X, Check,
  Volume2, VolumeX, Radio as RadioIcon, Database, HardDrive, ChevronDown, ChevronUp
} from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  file?: File;
  url: string;
  duracion: number;
  isInMemory?: boolean;
  isFromBackend?: boolean;
  order?: number;
}

interface CancionBackend {
  _id: string;
  radioId: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  order: number;
}

interface MusicaPlayerProps {
  radioId: string;
  cancionesBackend?: CancionBackend[];
  onCancionChange?: (cancion: Cancion | null) => void;
  onUploadToBackend?: (file: File, metadata: { title: string; artist: string }) => Promise<{ url: string }>;
  onDeleteFromBackend?: (trackId: string) => Promise<void>;
  canEdit: boolean;
  isOwner: boolean;
  isLive: boolean;
  isMicActive: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const MusicaPlayer: React.FC<MusicaPlayerProps> = ({
  radioId,
  cancionesBackend = [],
  onCancionChange,
  onUploadToBackend,
  onDeleteFromBackend,
  canEdit,
  isOwner,
  isLive,
  isMicActive,
}) => {
  const [cancionesMemoria, setCancionesMemoria] = useState<Cancion[]>([]);
  const [cancionActualId, setCancionActualId] = useState<string | null>(null);
  const [cancionSiguienteId, setCancionSiguienteId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editArtista, setEditArtista] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploadingToBackend, setUploadingToBackend] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const volumePanelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // ── Combinar canciones ──────────────────────────────────────────────────────
  const todasLasCanciones: Cancion[] = [
    ...cancionesBackend.map((track) => ({
      id: track._id,
      titulo: track.title,
      artista: track.artist,
      url: track.url,
      duracion: track.duration || 0,
      isFromBackend: true,
      order: track.order,
    })),
    ...cancionesMemoria,
  ].sort((a, b) => (a.order || 0) - (b.order || 0));

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Notificar cambio de canción actual
  useEffect(() => {
    const cancionActual = todasLasCanciones.find((c) => c.id === cancionActualId);
    onCancionChange?.(cancionActual || null);
  }, [cancionActualId]);

  // Eventos del audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onTimeUpdate = () => {
      if (!isScrubbing) setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      if (cancionSiguienteId) {
        reproducirCancion(cancionSiguienteId);
        setCancionSiguienteId(null);
      } else {
        const currentIndex = todasLasCanciones.findIndex((c) => c.id === cancionActualId);
        if (currentIndex !== -1 && currentIndex < todasLasCanciones.length - 1) {
          reproducirCancion(todasLasCanciones[currentIndex + 1].id);
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [cancionActualId, cancionSiguienteId, isScrubbing, todasLasCanciones]);

  // Aplicar volumen al audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Cerrar panel de volumen al clickear afuera
  useEffect(() => {
    if (!showVolume) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (volumePanelRef.current && !volumePanelRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };

    // Pequeño delay para no cerrar inmediatamente al abrir
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolume]);

  // ============================================================================
  // MANEJO DE ARCHIVOS
  // ============================================================================

  const procesarArchivo = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('audio/')) {
        alert('Por favor, sube solo archivos de audio');
        return;
      }

      const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      const nombreSinExtension = file.name.replace(/\.[^/.]+$/, '');
      const partes = nombreSinExtension.split(' - ');

      const nuevaCancion: Cancion = {
        id,
        titulo: partes[1] || nombreSinExtension,
        artista: partes[0] || 'Artista desconocido',
        file,
        url,
        duracion: 0,
        isInMemory: true,
        order: todasLasCanciones.length,
      };

      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setCancionesMemoria((prev) =>
          prev.map((c) => (c.id === id ? { ...c, duracion: audio.duration } : c))
        );
      });

      setCancionesMemoria((prev) => [...prev, nuevaCancion]);

      if (todasLasCanciones.length === 0 && !cancionActualId) {
        setCancionActualId(id);
      }
    },
    [todasLasCanciones.length, cancionActualId]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(procesarArchivo);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      Array.from(e.dataTransfer.files).forEach(procesarArchivo);
    },
    [procesarArchivo]
  );

  // ============================================================================
  // REPRODUCCIÓN
  // ============================================================================

  const reproducirCancion = (id: string) => {
    const cancion = todasLasCanciones.find((c) => c.id === id);
    if (!cancion || !audioRef.current) return;

    let audioUrl = cancion.url;
    if (cancion.isFromBackend && !cancion.url.startsWith('http')) {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || 'https://backend-zoonito-6x8h.vercel.app/api';
      audioUrl = `${API_URL.replace('/api', '')}${cancion.url}`;
    }

    audioRef.current.src = audioUrl;
    audioRef.current.volume = volume;
    audioRef.current.play().catch((err) => console.error('Error al reproducir:', err));
    setCancionActualId(id);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!cancionActualId && todasLasCanciones.length > 0) {
        reproducirCancion(todasLasCanciones[0].id);
      } else if (cancionActualId) {
        audioRef.current.play().catch((err) => console.error('Error al reproducir:', err));
        setIsPlaying(true);
      }
    }
  };

  const establecerSiguiente = (id: string) => {
    if (id === cancionActualId) return;
    setCancionSiguienteId(id);
  };

  // ============================================================================
  // SEEK — barra de progreso con drag libre (retroceder Y adelantar)
  // ============================================================================

  const calcularTiempoDesdePosicion = (clientX: number): number => {
    const bar = progressRef.current;
    if (!bar || duration === 0) return 0;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    e.preventDefault();
    setIsScrubbing(true);
    const t = calcularTiempoDesdePosicion(e.clientX);
    setScrubTime(t);
    setCurrentTime(t);
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const onMouseMove = (e: MouseEvent) => {
      const t = calcularTiempoDesdePosicion(e.clientX);
      setScrubTime(t);
      setCurrentTime(t);
    };

    const onMouseUp = (e: MouseEvent) => {
      const t = calcularTiempoDesdePosicion(e.clientX);
      if (audioRef.current) {
        audioRef.current.currentTime = t;
      }
      setCurrentTime(t);
      setIsScrubbing(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbing, duration]);

  // Touch support para la barra de progreso
  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    setIsScrubbing(true);
    const t = calcularTiempoDesdePosicion(e.touches[0].clientX);
    setScrubTime(t);
    setCurrentTime(t);
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const onTouchMove = (e: TouchEvent) => {
      const t = calcularTiempoDesdePosicion(e.touches[0].clientX);
      setScrubTime(t);
      setCurrentTime(t);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const t = calcularTiempoDesdePosicion(touch.clientX);
      if (audioRef.current) audioRef.current.currentTime = t;
      setCurrentTime(t);
      setIsScrubbing(false);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isScrubbing, duration]);

  // ============================================================================
  // EDICIÓN Y ELIMINACIÓN
  // ============================================================================

  const iniciarEdicion = (cancion: Cancion) => {
    setEditandoId(cancion.id);
    setEditTitulo(cancion.titulo);
    setEditArtista(cancion.artista);
  };

  const guardarEdicion = () => {
    if (!editandoId) return;
    setCancionesMemoria((prev) =>
      prev.map((c) =>
        c.id === editandoId ? { ...c, titulo: editTitulo, artista: editArtista } : c
      )
    );
    setEditandoId(null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditTitulo('');
    setEditArtista('');
  };

  const eliminarCancion = async (id: string) => {
    const cancion = todasLasCanciones.find((c) => c.id === id);
    if (!cancion) return;

    if (cancion.isInMemory) {
      if (cancion.url) URL.revokeObjectURL(cancion.url);
      setCancionesMemoria((prev) => prev.filter((c) => c.id !== id));
    } else if (cancion.isFromBackend && onDeleteFromBackend) {
      await onDeleteFromBackend(id);
    }

    if (id === cancionActualId) {
      audioRef.current?.pause();
      setCancionActualId(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
    if (id === cancionSiguienteId) setCancionSiguienteId(null);
  };

  // ============================================================================
  // SUBIR A BACKEND
  // ============================================================================

  const subirABackend = async (cancion: Cancion) => {
    if (!onUploadToBackend || !cancion.file) {
      alert('No se puede subir esta canción al backend');
      return;
    }
    setUploadingToBackend(true);
    try {
      await onUploadToBackend(cancion.file, {
        title: cancion.titulo,
        artist: cancion.artista,
      });
      setCancionesMemoria((prev) => prev.filter((c) => c.id !== cancion.id));
      alert('Canción subida exitosamente al backend');
    } catch (error) {
      console.error('Error subiendo al backend:', error);
      alert('Error al subir la canción al backend');
    } finally {
      setUploadingToBackend(false);
    }
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  const fmt = (seg: number): string => {
    if (!seg || !isFinite(seg)) return '0:00';
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displayTime = isScrubbing ? scrubTime : currentTime;
  const progressPct = duration > 0 ? (displayTime / duration) * 100 : 0;

  const cancionActual = todasLasCanciones.find((c) => c.id === cancionActualId);
  const cancionSiguiente = todasLasCanciones.find((c) => c.id === cancionSiguienteId);

  const volumeIcon = volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 h-full flex flex-col">
      <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Music size={24} />
          Playlist ({todasLasCanciones.length})
        </h2>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Database size={14} />
          <span>{cancionesBackend.length}</span>
          <HardDrive size={14} className="ml-2" />
          <span>{cancionesMemoria.length}</span>
        </div>
      </div>

      {/* ── Reproductor principal ─────────────────────────────────────────── */}
      {isOwner && cancionActualId && cancionActual && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 mb-4 select-none">

          {/* Fila superior: play + info + siguiente + volumen */}
          <div className="flex items-center gap-3 mb-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlayPause}
              disabled={!isLive}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0"
            >
              {isPlaying
                ? <Pause className="text-white" size={20} />
                : <Play className="text-white ml-0.5" size={20} />}
            </button>

            {/* Info canción */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{cancionActual.titulo}</div>
              <div className="text-white/70 text-xs truncate">{cancionActual.artista}</div>
            </div>

            {/* Siguiente */}
            {cancionSiguiente && (
              <div className="text-right hidden sm:block">
                <div className="text-white/50 text-[10px]">Siguiente:</div>
                <div className="text-white/80 text-xs truncate max-w-[110px]">{cancionSiguiente.titulo}</div>
              </div>
            )}

            {/* Botón de volumen */}
            <div className="relative flex-shrink-0" ref={volumePanelRef}>
              <button
                onClick={() => setShowVolume((v) => !v)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${showVolume
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                title="Volumen"
              >
                {volumeIcon}
              </button>

              {/* Panel de volumen flotante */}
              {showVolume && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-4"
                  style={{ width: 220 }}
                >
                  {/* Flecha decorativa */}
                  <div
                    className="absolute -top-2 right-3 w-4 h-2 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div className="w-3 h-3 bg-gray-900 border-l border-t border-white/10 rotate-45 translate-y-1 mx-auto" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Volume2 size={14} /> Volumen
                    </span>
                    <span className="text-white/60 text-xs font-mono">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${volume * 100}%, rgba(255,255,255,0.15) ${volume * 100}%, rgba(255,255,255,0.15) 100%)`,
                    }}
                  />

                  <div className="flex justify-between mt-1">
                    <span className="text-white/40 text-[10px]">Silencio</span>
                    <span className="text-white/40 text-[10px]">Máx</span>
                  </div>

                  {/* Presets rápidos */}
                  <div className="flex gap-1 mt-3">
                    {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                      <button
                        key={v}
                        onClick={() => setVolume(v)}
                        className={`flex-1 py-1 rounded text-[10px] font-medium transition-all
                          ${Math.abs(volume - v) < 0.05
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                      >
                        {v === 0 ? '🔇' : `${Math.round(v * 100)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tiempos */}
          <div className="flex items-center justify-between mb-2">
            <div className="bg-black/30 rounded px-2 py-1 font-mono text-white text-sm font-bold tracking-wider">
              {fmt(displayTime)}
            </div>
            <div className="text-white/50 text-xs">{fmt(duration)}</div>
            <div className="bg-black/30 rounded px-2 py-1 font-mono text-green-300 text-sm font-bold tracking-wider">
              -{fmt(duration - displayTime)}
            </div>
          </div>

          {/* ── Barra de progreso con drag libre ─────────────────────── */}
          <div
            ref={progressRef}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            className="relative h-5 flex items-center cursor-pointer group"
            title="Arrastrá para cambiar la posición"
          >
            {/* Track de fondo */}
            <div className="absolute inset-x-0 h-2 bg-white/20 rounded-full overflow-visible">
              {/* Relleno */}
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Thumb (bolita) */}
            <div
              className={`absolute w-4 h-4 bg-white rounded-full shadow-lg -translate-x-1/2 transition-transform
                ${isScrubbing ? 'scale-125' : 'scale-0 group-hover:scale-100'}`}
              style={{ left: `${progressPct}%` }}
            />
          </div>

          {/* Hint de uso */}
          <div className="mt-1.5 text-white/40 text-[10px] text-center">
            Arrastrá la barra para retroceder o adelantar
          </div>

          {/* Estado */}
          {isLive && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded ${
                  isPlaying ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}
              >
                {isPlaying ? '🎵 Reproduciendo' : '⏸️ Pausado'}
              </span>
              {isMicActive && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 animate-pulse">
                  🎤 Mic Activo
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      {canEdit && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-500/20'
              : 'border-purple-500/50 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="text-center">
            <Upload className="mx-auto mb-2 text-purple-400" size={32} />
            <p className="text-white font-semibold text-sm mb-1">Arrastrá archivos aquí</p>
            <p className="text-white/60 text-xs">o hacé clic para seleccionar</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* ── Leyenda ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {[
          { color: 'bg-green-500', label: 'Actual' },
          { color: 'bg-red-500', label: 'Siguiente' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 ${color} rounded-full`} />
            <span className="text-white/80">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Database size={12} className="text-blue-400" />
          <span className="text-white/80">Backend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-purple-400" />
          <span className="text-white/80">Memoria</span>
        </div>
      </div>

      {/* ── Lista de canciones ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {todasLasCanciones.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Music size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay canciones en la playlist</p>
            {canEdit && (
              <p className="text-xs mt-2">Subí archivos o esperá a que se carguen del backend</p>
            )}
          </div>
        ) : (
          todasLasCanciones.map((cancion, index) => {
            const esActual = cancion.id === cancionActualId;
            const esSiguiente = cancion.id === cancionSiguienteId;
            const estaEditando = cancion.id === editandoId;

            return (
              <div
                key={cancion.id}
                onDoubleClick={() => establecerSiguiente(cancion.id)}
                className={`group p-3 rounded-lg transition-all cursor-pointer ${
                  esActual
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : esSiguiente
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                }`}
              >
                {estaEditando ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      placeholder="Título"
                      className="w-full bg-white/10 text-white rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={editArtista}
                      onChange={(e) => setEditArtista(e.target.value)}
                      placeholder="Artista"
                      className="w-full bg-white/10 text-white rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={guardarEdicion}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Guardar
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="text-white/60 font-mono text-xs w-6 flex-shrink-0">{index + 1}</div>

                    {isOwner && (
                      <button
                        onClick={() => reproducirCancion(cancion.id)}
                        disabled={!isLive}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50 ${
                          esActual ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {esActual && isPlaying
                          ? <Pause className="text-white" size={16} />
                          : <Play className="text-white ml-0.5" size={16} />}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate text-sm">{cancion.titulo}</h4>
                      <p className="text-white/60 text-xs truncate">{cancion.artista}</p>
                    </div>

                    <div className="flex-shrink-0" title={cancion.isFromBackend ? 'En backend' : 'En memoria'}>
                      {cancion.isFromBackend
                        ? <Database size={14} className="text-blue-400" />
                        : <HardDrive size={14} className="text-purple-400" />}
                    </div>

                    <div className="text-white/60 text-xs flex-shrink-0 w-12 text-right">
                      {fmt(cancion.duracion)}
                    </div>

                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cancion.isInMemory && onUploadToBackend && (
                          <button
                            onClick={() => subirABackend(cancion)}
                            disabled={uploadingToBackend}
                            className="text-blue-400 hover:text-blue-300 p-1 disabled:opacity-50"
                            title="Subir a backend"
                          >
                            <Save size={14} />
                          </button>
                        )}
                        {cancion.isInMemory && (
                          <button
                            onClick={() => iniciarEdicion(cancion)}
                            className="text-yellow-400 hover:text-yellow-300 p-1"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarCancion(cancion.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      {canEdit && (
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-xs font-semibold mb-1">💡 Cómo usar:</p>
          <ul className="text-blue-300/80 text-[10px] space-y-0.5 list-disc list-inside">
            <li>Doble clic en una canción para marcarla como siguiente</li>
            <li>Arrastrá la barra de progreso para retroceder o adelantar</li>
            <li>Las canciones en memoria se pueden subir al backend (💾)</li>
            <li>Solo el dueño puede reproducir durante la transmisión en vivo</li>
          </ul>
        </div>
      )}

      {!isOwner && todasLasCanciones.length > 0 && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-xs">
            ℹ️ Solo el dueño de la radio puede controlar la reproducción durante la transmisión en vivo
          </p>
        </div>
      )}

      {!isLive && isOwner && todasLasCanciones.length > 0 && (
        <div className="mt-4 bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 flex items-center gap-2">
          <RadioIcon className="text-gray-400" size={16} />
          <p className="text-gray-300 text-xs">Iniciá la transmisión para reproducir música</p>
        </div>
      )}
    </div>
  );
};

export default MusicaPlayer;
