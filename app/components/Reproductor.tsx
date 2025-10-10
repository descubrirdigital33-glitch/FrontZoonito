import React, { useState, useRef, useEffect } from 'react';
import { useReproductor } from '../context/ReproductorContext';
import Swal from 'sweetalert2';
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Volume2, VolumeX,
  Minimize2, X, Square, Edit2, Moon, Sun
} from "lucide-react";
export interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  url: string;
  cover?: string;
}

interface ListaGuardada {
  _id: string;
  nombre: string;
  canciones: Cancion[];
}

interface TraerListasOk {
  listas: ListaGuardada[];
}

interface TraerListasError {
  message: string;
}

type TraerListasResponse = TraerListasOk | TraerListasError;

type RepeatMode = 'off' | 'all' | 'one';

const Reproductor = () => {
  const { 
    lista: canciones, 
    setLista: setPlaylist,
    indiceActual: currentIndex,
    setIndiceActual: setCurrentIndex,
    reproduciendo: isPlaying,
    togglePlay: contextTogglePlay,
  } = useReproductor();

  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isClosed, setIsClosed] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [nombreListaActual, setNombreListaActual] = useState<string>('Mi Lista');
  const [listaId, setListaId] = useState<string | null>(null);
  const [windowState, setWindowState] = useState<1 | 2 | 3>(2);
  const [darkMode, setDarkMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef(volume);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldPlayRef = useRef(false);
  const isRemovingRef = useRef(false);

  const currentSong = canciones[currentIndex];

  // Sincronizar con el audio cuando cambia la canción
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || canciones.length === 0) return;

    audio.load();

    // Solo reproducir automáticamente si shouldPlayRef está activo o si ya estaba reproduciendo
    // y NO estamos en proceso de eliminar una canción
    if ((isPlaying || shouldPlayRef.current) && !isRemovingRef.current) {
      shouldPlayRef.current = false;
      audio.play().catch(err => {
        if (err.name !== 'AbortError') contextTogglePlay();
      });
    }
    
    // Resetear el flag de eliminación después de cargar la nueva canción
    isRemovingRef.current = false;
  }, [currentIndex]);

  // Sincronizar reproducción con el contexto
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || canciones.length === 0) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(() => {});
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, canciones.length]);

  const handleMinimizeClick = () => {
    setWindowState(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : 1));
  };

  const handleMaximizeClick = () => {
    setWindowState(prev => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : 3));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setToken(user.token);
    }
  }, []);

  const editarNombreLista = async () => {
    if (!listaId) {
      Swal.fire({
        icon: 'warning',
        title: 'Lista no guardada',
        text: 'Primero guarda la lista para poder editar su nombre',
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    const { value: nuevoNombre } = await Swal.fire({
      title: 'Editar nombre de lista',
      input: 'text',
      inputValue: nombreListaActual,
      inputLabel: 'Nuevo nombre',
      inputPlaceholder: 'Ingresa el nuevo nombre',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#8b5cf6',
      background: 'linear-gradient(to right, #7e22ce, #db2777)',
      color: '#fff',
      inputAttributes: { autocapitalize: 'off' },
    });

    if (nuevoNombre && nuevoNombre.trim() && nuevoNombre.trim() !== nombreListaActual) {
      try {
        const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/listas/${listaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ nombre: nuevoNombre.trim(), canciones })
        });

        const data = await res.json();
        if (res.ok) {
          setNombreListaActual(nuevoNombre.trim());
          Swal.fire({
            icon: 'success',
            title: 'Nombre actualizado',
            text: data.message,
            confirmButtonColor: '#ec4899',
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'No se pudo actualizar el nombre',
            confirmButtonColor: '#ec4899',
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo conectar con el servidor',
          confirmButtonColor: '#ec4899',
        });
      }
    }
  };

  const guardarLista = async () => {
    const { value: nombreLista } = await Swal.fire({
      title: 'Guardar lista',
      input: 'text',
      inputValue: nombreListaActual,
      inputLabel: 'Nombre de la lista',
      inputPlaceholder: 'Ingresa un nombre',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ec4899',
      cancelButtonColor: '#8b5cf6',
      background: 'linear-gradient(to right, #7e22ce, #db2777)',
      color: '#fff',
      inputAttributes: { autocapitalize: 'off' },
    });

    if (!nombreLista) return;

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/listas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nombreLista, canciones })
      });

      const data = await res.json();
      if (res.ok) {
        setNombreListaActual(nombreLista);
        setListaId(data.lista._id);
        Swal.fire({
          icon: 'success',
          title: '¡Lista guardada!',
          text: data.message,
          confirmButtonColor: '#ec4899',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo guardar la lista',
          confirmButtonColor: '#ec4899',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const eliminarLista = async (listaIdParam: string, nombreLista: string) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar lista?',
      text: `¿Estás seguro de eliminar "${nombreLista}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#8b5cf6',
      background: 'linear-gradient(to right, #7e22ce, #db2777)',
      color: '#fff',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/listas/${listaIdParam}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Lista eliminada!',
          text: data.message,
          confirmButtonColor: '#ec4899',
          timer: 2000,
          showConfirmButton: false,
        });

        if (listaIdParam === listaId) {
          setNombreListaActual('Mi Lista');
          setListaId(null);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo eliminar la lista',
          confirmButtonColor: '#ec4899',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const traerListas = async () => {
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No hay token de autenticación',
        confirmButtonColor: '#ec4899',
      });
      return;
    }

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/listas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: TraerListasResponse = await res.json();

      if ('listas' in data) {
        if (data.listas.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No hay listas guardadas',
            confirmButtonColor: '#ec4899',
          });
          return;
        }

        const options = data.listas.reduce((acc: Record<string, string>, lista: ListaGuardada) => {
          acc[lista.nombre] = lista.nombre;
          return acc;
        }, {});

        const resultado = await Swal.fire({
          title: 'Selecciona una lista',
          input: 'select',
          inputOptions: options,
          inputPlaceholder: 'Elige una lista',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Reproducir',
          denyButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#ec4899',
          denyButtonColor: '#ef4444',
          cancelButtonColor: '#8b5cf6',
          background: 'linear-gradient(to right, #7e22ce, #db2777)',
          color: '#000',
          preConfirm: () => {
            const select = Swal.getInput() as HTMLSelectElement | null;
            if (!select || !select.value) {
              Swal.showValidationMessage('Debes seleccionar una lista');
              return false;
            }
            return select.value;
          },
          preDeny: () => {
            const select = Swal.getInput() as HTMLSelectElement | null;
            if (!select || !select.value) {
              Swal.showValidationMessage('Debes seleccionar una lista');
              return false;
            }
            return select.value;
          }
        });

        if (resultado.value) {
          const listaElegida = data.listas.find((l: ListaGuardada) => l.nombre === resultado.value);
          if (!listaElegida) return;

          if (resultado.isDenied) {
            await eliminarLista(listaElegida._id, listaElegida.nombre);
            setTimeout(() => traerListas(), 500);
            return;
          }

          if (resultado.isConfirmed) {
            setNombreListaActual(listaElegida.nombre);
            setListaId(listaElegida._id);
            setPlaylist(listaElegida.canciones);
            if (listaElegida.canciones.length > 0) {
              setCurrentIndex(0);
              // Activar reproducción automática al cargar una lista
              shouldPlayRef.current = true;
              if (!isPlaying) contextTogglePlay();
            }
          }
        }
      } else if ('message' in data) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message,
          confirmButtonColor: '#ec4899',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo conectar con el servidor',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {};
    const handlePause = () => {};

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (currentIndex < canciones.length - 1) {
        // Pasar a la siguiente canción automáticamente
        shouldPlayRef.current = true;
        setCurrentIndex(currentIndex + 1);
      } else if (repeatMode === 'all') {
        // Volver al inicio si está en modo repetir todo
        shouldPlayRef.current = true;
        setCurrentIndex(0);
      } else {
        // Si llegamos al final y no hay repetición, pausar
        if (isPlaying) {
          contextTogglePlay();
        }
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [repeatMode, currentIndex, canciones.length, contextTogglePlay, setCurrentIndex, isPlaying]);

  const togglePlay = () => {
    // No permitir reproducción si no hay canciones
    if (!audioRef.current || canciones.length === 0) return;
    contextTogglePlay();
  };

  const nextSong = () => {
    if (canciones.length === 0) return;
    shouldPlayRef.current = isPlaying; // Mantener el estado de reproducción
    setCurrentIndex((currentIndex + 1) % canciones.length);
  };

  const prevSong = () => {
    if (canciones.length === 0) return;
    shouldPlayRef.current = isPlaying; // Mantener el estado de reproducción
    setCurrentIndex((currentIndex - 1 + canciones.length) % canciones.length);
  };

  const removeSong = (id: string) => {
    const indexToRemove = canciones.findIndex(c => c.id === id);
    const newPlaylist = canciones.filter(c => c.id !== id);

    // Marcar que estamos eliminando para prevenir autoplay
    isRemovingRef.current = true;
    
    // Guardar el estado de reproducción actual
    const wasPlaying = isPlaying;

    setPlaylist(newPlaylist);

    if (newPlaylist.length === 0) {
      // Si no quedan canciones, detener todo
      setCurrentIndex(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (isPlaying) {
        contextTogglePlay();
      }
    } else if (indexToRemove === currentIndex) {
      // Si eliminamos la canción actual
      const newIndex = currentIndex >= newPlaylist.length ? 0 : currentIndex;
      setCurrentIndex(newIndex);
      
      // Si estaba reproduciendo, pausar primero y luego el usuario decide
      if (wasPlaying && audioRef.current) {
        audioRef.current.pause();
        contextTogglePlay();
      }
    } else if (indexToRemove < currentIndex) {
      // Ajustar el índice si eliminamos una canción anterior
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentModeIndex + 1) % modes.length]);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return <Repeat1 size={22} />;
    if (repeatMode === 'all') return <Repeat size={22} />;
    return <Repeat size={22} />;
  };

  const handleSongClick = (index: number) => {
    if (clickTimerRef.current) {
      // Doble clic: reproducir inmediatamente
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      shouldPlayRef.current = true;
      setCurrentIndex(index);
      if (!isPlaying) contextTogglePlay();
    } else {
      // Primer clic: cambiar canción sin reproducir
      clickTimerRef.current = setTimeout(() => {
        setCurrentIndex(index);
        clickTimerRef.current = null;
      }, 250);
    }
  };

  const limpiarLista = async () => {
    if (canciones.length === 0) return;

    const confirmacion = await Swal.fire({
      title: '¿Limpiar lista?',
      text: `¿Estás seguro de eliminar todas las canciones de "${nombreListaActual}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#8b5cf6',
      background: 'linear-gradient(to right, #7e22ce, #db2777)',
      color: '#fff',
    });

    if (!confirmacion.isConfirmed) return;

    // Detener reproducción
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (isPlaying) {
      contextTogglePlay();
    }

    // Limpiar lista
    setPlaylist([]);
    setCurrentIndex(0);
    setNombreListaActual('Mi Lista');
    setListaId(null);

    Swal.fire({
      icon: 'success',
      title: '¡Lista limpiada!',
      text: 'Todas las canciones han sido eliminadas',
      confirmButtonColor: '#ec4899',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  if (isClosed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsClosed(false)}
          className="bg-gradient-to-br from-pink-500 via-purple-600 to-pink-600 hover:from-pink-600 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-2xl shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-3 border-4 border-white/30 animate-bounce"
        >
          <img
            src="/assets/lemon.jpg"
            alt="Abrir reproductor"
            className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white/50"
          />
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg">Abrir Reproductor</span>
            <span className="text-xs text-white/90">Lemon Music</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`
      ${darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-purple-900/95 via-violet-900/95 to-pink-900/95'
      }
      backdrop-blur-md rounded-xl transition-all duration-300
      ${darkMode ? 'shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(59,130,246,0.3),0_0_90px_rgba(59,130,246,0.1)]' : 'shadow-2xl'}
      ${windowState === 1 ? 'fixed bottom-4 right-4 w-80 z-50' : windowState === 2 ? 'w-full max-w-4xl mx-auto mb-4' : 'w-full h-[90vh] mx-auto mb-4'}
    `}>
      <div className={`${darkMode ? 'bg-gray-800 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]' : 'bg-blue-800 bg-gradient-to-t from-white/20 to-blue-800'} flex justify-between items-center p-3 border-b ${darkMode ? 'border-blue-500/50' : 'border-white/10'} rounded-lg`}>
        <div className="flex items-center gap-3 p-2 rounded-md">
          <img
            src="/assets/lemon.jpg"
            alt="Logo"
            className="w-12 h-12 rounded-full object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <h4 className="text-white font-semibold text-sm truncate">Lemon Músic</h4>
            <div className="flex items-center gap-1">
              <span className="text-white/80 text-xs truncate max-w-[150px]">{nombreListaActual}</span>
              {token && (
                <button
                  onClick={editarNombreLista}
                  className="text-white/70 hover:text-pink-400 transition-colors"
                  title="Editar nombre de lista"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-white hover:text-yellow-400 transition-colors"
            title={darkMode ? "Modo claro" : "Modo oscuro"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleMinimizeClick}
            className="text-white hover:text-pink-400 transition-colors"
            title="Minimizar"
          >
            <Minimize2 size={20} />
          </button>
          <button
            onClick={handleMaximizeClick}
            className="text-white hover:text-pink-400 transition-colors"
            title="Maximizar"
          >
            <Square size={20} />
          </button>
          <button
            onClick={() => setIsClosed(true)}
            className="text-white hover:text-red-500 transition-colors"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <audio ref={audioRef}>
        {currentSong && <source src={currentSong.url} />}
      </audio>

      {windowState !== 1 ? (
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {currentSong?.cover ? (
                  <img
                    src={currentSong?.cover || '/assets/zoonito.jpg'}
                    alt={currentSong?.titulo || 'Carátula del álbum'}
                    className="w-20 h-20 object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl shadow-lg">
                    🎵
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-base truncate">{currentSong?.titulo || "No hay canción"}</h3>
                  <p className="text-gray-300 text-sm truncate">{currentSong?.artista || "..."}</p>
                </div>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
                  disabled={canciones.length === 0}
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={prevSong} 
                  className={`text-white hover:text-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}
                  disabled={canciones.length === 0}
                >
                  <SkipBack size={28} />
                </button>
                <button
                  onClick={togglePlay}
                  className={`text-white text-3xl bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${darkMode ? 'shadow-[0_0_20px_rgba(59,130,246,0.8)]' : ''}`}
                  disabled={canciones.length === 0}
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <button 
                  onClick={nextSong} 
                  className={`text-white hover:text-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}
                  disabled={canciones.length === 0}
                >
                  <SkipForward size={28} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleRepeat}
                  className={`transition-colors ${repeatMode !== 'off' ? 'text-pink-400' : 'text-gray-400 hover:text-white'} ${darkMode ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}
                  title={`Repetir: ${repeatMode}`}
                >
                  {getRepeatIcon()}
                </button>
              </div>

              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
                <button
                  onClick={toggleMute}
                  className={`text-white hover:text-pink-400 transition-colors ${darkMode ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''}`}
                >
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <span className="text-white text-xs font-medium min-w-[2.5rem] text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              <div className="flex justify-end gap-2 p-2 flex-wrap">
                {token ? (
                  <>
                    <button
                      onClick={guardarLista}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={canciones.length === 0}
                    >
                      Guardar lista
                    </button>
                    <button
                      onClick={traerListas}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
                    >
                      Traer listas
                    </button>
                    <button
                      onClick={limpiarLista}
                      className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={canciones.length === 0}
                      title="Limpiar lista"
                    >
                      Limpiar lista
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
            </div>

            <div className={`${darkMode ? 'bg-black/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/30' : 'bg-black/20'} rounded-lg p-3`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold text-sm">
                  {nombreListaActual} ({canciones.length})
                </h4>
              </div>
              {canciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-64 bg-black/30 rounded-lg p-4">
                  <img src="/assets/lemon.jpg" alt="No hay canciones" className="w-40 h-40 object-cover rounded-full shadow-lg mb-3" />
                  <h3 className="text-white text-xl font-bold">NO HAY CANCIONES</h3>
                  <p className="text-gray-300 mt-1 text-center">Agrega canciones a la lista para reproducir</p>
                </div>
              ) : (
                <ul className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-custom">
                  {canciones.map((c, i) => (
                    <li
                      key={c.id}
                      className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors group ${i === currentIndex ? 'bg-pink-500/30 text-pink-300' : 'hover:bg-white/10 text-white'}`}
                      onClick={() => handleSongClick(i)}
                    >
                      <span className="text-sm truncate flex-1">
                        {c.titulo} - <span className="text-gray-400 text-xs">{c.artista}</span>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSong(c.id); }}
                        className="text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 flex items-center gap-3">
          <img
            src={currentSong?.cover || "/assets/lemon.jpg"}
            alt={currentSong?.titulo || "No hay canciones"}
            className="w-10 h-10 object-cover rounded shadow-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-xs truncate">{currentSong?.titulo || "No hay canción"}</h3>
            <p className="text-gray-300 text-[10px] truncate">{currentSong?.artista || "..."}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button 
              onClick={prevSong} 
              className="text-white hover:text-pink-400 transition-colors disabled:opacity-50"
              disabled={canciones.length === 0}
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={togglePlay}
              className="text-white bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              disabled={canciones.length === 0}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button 
              onClick={nextSong} 
              className="text-white hover:text-pink-400 transition-colors disabled:opacity-50"
              disabled={canciones.length === 0}
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .slider-thumb::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .scrollbar-custom::-webkit-scrollbar {
            width: 5px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: rgb(236, 72, 153);
            border-radius: 10px;
          }
        `
      }} />
    </div>
  );
};


export default Reproductor;

