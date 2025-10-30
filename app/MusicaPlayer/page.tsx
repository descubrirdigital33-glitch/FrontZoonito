'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Play, Pause, Trash2, Edit2, Music, SkipForward, Save, X, Check, Volume2, Radio as RadioIcon, Database, HardDrive } from 'lucide-react';

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
  isMicActive
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combinar canciones de backend y memoria
  const todasLasCanciones: Cancion[] = [
    ...cancionesBackend.map(track => ({
      id: track._id,
      titulo: track.title,
      artista: track.artist,
      url: track.url,
      duracion: track.duration || 0,
      isFromBackend: true,
      order: track.order
    })),
    ...cancionesMemoria
  ].sort((a, b) => (a.order || 0) - (b.order || 0));

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    const cancionActual = todasLasCanciones.find(c => c.id === cancionActualId);
    onCancionChange?.(cancionActual || null);
  }, [cancionActualId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnd);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleAudioEnd);
        }
      };
    }
  }, [cancionActualId, cancionSiguienteId]);

  // ============================================================================
  // MANEJO DE ARCHIVOS
  // ============================================================================

  const procesarArchivo = useCallback(async (file: File) => {
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
      order: todasLasCanciones.length
    };

    // Obtener duración
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      nuevaCancion.duracion = audio.duration;
      setCancionesMemoria(prev => 
        prev.map(c => c.id === id ? { ...c, duracion: audio.duration } : c)
      );
    });

    setCancionesMemoria(prev => [...prev, nuevaCancion]);

    // Si es la primera canción y no hay nada reproduciéndose
    if (todasLasCanciones.length === 0 && !cancionActualId) {
      setCancionActualId(id);
    }
  }, [todasLasCanciones.length, cancionActualId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(procesarArchivo);
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(procesarArchivo);
  }, [procesarArchivo]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // ============================================================================
  // REPRODUCCIÓN
  // ============================================================================

  const reproducirCancion = (id: string) => {
    const cancion = todasLasCanciones.find(c => c.id === id);
    if (!cancion || !audioRef.current) return;

    // Obtener la URL correcta
    let audioUrl = cancion.url;
    if (cancion.isFromBackend && !cancion.url.startsWith('http')) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-zoonito-6x8h.vercel.app/api';
      audioUrl = `${API_URL.replace('/api', '')}${cancion.url}`;
    }

    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(error => {
      console.error('Error al reproducir:', error);
    });
    
    setCancionActualId(id);
    setIsPlaying(true);
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
        audioRef.current.play().catch(error => {
          console.error('Error al reproducir:', error);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnd = () => {
    if (cancionSiguienteId) {
      reproducirCancion(cancionSiguienteId);
      setCancionSiguienteId(null);
    } else {
      // Reproducir la siguiente en la lista
      const currentIndex = todasLasCanciones.findIndex(c => c.id === cancionActualId);
      if (currentIndex !== -1 && currentIndex < todasLasCanciones.length - 1) {
        reproducirCancion(todasLasCanciones[currentIndex + 1].id);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const establecerSiguiente = (id: string) => {
    if (id === cancionActualId) return;
    setCancionSiguienteId(id);
  };

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

    const cancion = todasLasCanciones.find(c => c.id === editandoId);
    if (cancion?.isInMemory) {
      setCancionesMemoria(prev =>
        prev.map(c =>
          c.id === editandoId
            ? { ...c, titulo: editTitulo, artista: editArtista }
            : c
        )
      );
    }
    // Para canciones del backend, necesitarías implementar la actualización en el backend
    
    setEditandoId(null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditTitulo('');
    setEditArtista('');
  };

  const eliminarCancion = async (id: string) => {
    const cancion = todasLasCanciones.find(c => c.id === id);
    if (!cancion) return;

    if (cancion.isInMemory) {
      if (cancion.url) {
        URL.revokeObjectURL(cancion.url);
      }
      setCancionesMemoria(prev => prev.filter(c => c.id !== id));
    } else if (cancion.isFromBackend && onDeleteFromBackend) {
      await onDeleteFromBackend(id);
    }

    if (id === cancionActualId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCancionActualId(null);
      setIsPlaying(false);
    }

    if (id === cancionSiguienteId) {
      setCancionSiguienteId(null);
    }
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
      const result = await onUploadToBackend(cancion.file, {
        title: cancion.titulo,
        artist: cancion.artista
      });

      // Eliminar de memoria y confiar en que se recargará desde el backend
      setCancionesMemoria(prev => prev.filter(c => c.id !== cancion.id));
      
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

  const formatearDuracion = (segundos: number): string => {
    if (!segundos || !isFinite(segundos)) return '0:00';
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0 || !isOwner) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    // Solo permitir adelantar hasta donde ya se ha reproducido
    if (newTime <= currentTime || currentTime === 0) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else {
      // Si intenta adelantar más allá, solo avanzar hasta donde está
      audioRef.current.currentTime = currentTime;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const cancionActual = todasLasCanciones.find(c => c.id === cancionActualId);
  const cancionSiguiente = todasLasCanciones.find(c => c.id === cancionSiguienteId);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 h-full flex flex-col">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="metadata"
      />

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

      {/* Reproductor Global - Solo visible para el dueño */}
      {isOwner && cancionActualId && cancionActual && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={togglePlayPause}
              disabled={!isLive}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="text-white" size={20} />
              ) : (
                <Play className="text-white ml-1" size={20} />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {cancionActual.titulo}
              </div>
              <div className="text-white/80 text-xs truncate">
                {cancionActual.artista}
              </div>
            </div>

            {cancionSiguiente && (
              <div className="text-right">
                <div className="text-white/60 text-[10px]">
                  Siguiente:
                </div>
                <div className="text-white/80 text-xs truncate max-w-[120px]">
                  {cancionSiguiente.titulo}
                </div>
              </div>
            )}
          </div>

          {/* Tiempos en formato digital */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-black/30 rounded px-2 py-1 font-mono text-white text-sm font-bold tracking-wider">
                {formatearDuracion(currentTime)}
              </div>
              <span className="text-white/60 text-xs">transcurrido</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs">quedan</span>
              <div className="bg-black/30 rounded px-2 py-1 font-mono text-green-300 text-sm font-bold tracking-wider">
                -{formatearDuracion(duration - currentTime)}
              </div>
            </div>
          </div>

          {/* Barra de progreso interactiva */}
          <div className="relative">
            <div 
              onClick={handleProgressClick}
              className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:bg-white/30 transition-colors"
            >
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all shadow-lg"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            {/* Indicador de tiempo al hacer hover */}
            <div className="absolute -top-1 left-0 right-0 h-4 pointer-events-none">
              <div 
                className="absolute w-0.5 h-4 bg-white/50"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Estado de transmisión */}
          {isLive && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${
                isPlaying ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
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

      {/* Zona de Drop - Solo para el dueño */}
      {canEdit && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-400 bg-purple-500/20'
              : 'border-purple-500/50 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="text-center">
            <Upload className="mx-auto mb-2 text-purple-400" size={32} />
            <p className="text-white font-semibold text-sm mb-1">
              Arrastra archivos aquí
            </p>
            <p className="text-white/60 text-xs">
              o haz clic para seleccionar
            </p>
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

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-white/80">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-white/80">Siguiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database size={12} className="text-blue-400" />
          <span className="text-white/80">Backend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-purple-400" />
          <span className="text-white/80">Memoria</span>
        </div>
      </div>

      {/* Lista de Canciones */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {todasLasCanciones.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Music size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay canciones en la playlist</p>
            {canEdit && (
              <p className="text-xs mt-2">Sube archivos o espera a que se carguen del backend</p>
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
                  // Modo Edición
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
                        <Check size={14} />
                        Guardar
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo Normal
                  <div className="flex items-center gap-2">
                    {/* Número */}
                    <div className="text-white/60 font-mono text-xs w-6 flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Botón Play - Solo para el dueño */}
                    {isOwner && (
                      <button
                        onClick={() => reproducirCancion(cancion.id)}
                        disabled={!isLive}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50 ${
                          esActual
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {esActual && isPlaying ? (
                          <Pause className="text-white" size={16} />
                        ) : (
                          <Play className="text-white ml-0.5" size={16} />
                        )}
                      </button>
                    )}

                    {/* Info de la canción */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate text-sm">
                        {cancion.titulo}
                      </h4>
                      <p className="text-white/60 text-xs truncate">
                        {cancion.artista}
                      </p>
                    </div>

                    {/* Origen */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {cancion.isFromBackend ? (
                        <div title="En backend">
                          <Database size={14} className="text-blue-400" />
                        </div>
                      ) : (
                        <div title="En memoria">
                          <HardDrive size={14} className="text-purple-400" />
                        </div>
                      )}
                    </div>

                    {/* Duración */}
                    <div className="text-white/60 text-xs flex-shrink-0 w-12 text-right">
                      {formatearDuracion(cancion.duracion)}
                    </div>

                    {/* Acciones */}
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

      {/* Instrucciones */}
      {canEdit && (
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            <strong>💡 Cómo usar:</strong>
          </p>
          <ul className="text-blue-300/80 text-[10px] mt-1 space-y-0.5 list-disc list-inside">
            <li>Doble clic en una canción para marcarla como siguiente</li>
            <li>Las canciones en memoria (🔹) se pueden subir al backend (💾)</li>
            <li>Solo el dueño puede reproducir durante la transmisión en vivo</li>
            <li>Las canciones del backend (💿) están guardadas permanentemente</li>
          </ul>
        </div>
      )}

      {/* Advertencia si no es dueño */}
      {!isOwner && todasLasCanciones.length > 0 && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-xs">
            ℹ️ Solo el dueño de la radio puede controlar la reproducción durante la transmisión en vivo
          </p>
        </div>
      )}

      {/* Estado offline */}
      {!isLive && isOwner && todasLasCanciones.length > 0 && (
        <div className="mt-4 bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 flex items-center gap-2">
          <RadioIcon className="text-gray-400" size={16} />
          <p className="text-gray-300 text-xs">
            Inicia la transmisión para reproducir música
          </p>
        </div>
      )}
    </div>
  );
};


export default MusicaPlayer;
