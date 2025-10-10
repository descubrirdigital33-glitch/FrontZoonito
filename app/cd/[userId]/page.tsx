'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, Play, Pause, Star, Share2, Music, Clock, User, ChevronLeft, Disc, Plus, Trash2, Edit } from 'lucide-react';
import { useReproductor } from '../../context/ReproductorContext';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import Reproductor from '../../components/Reproductor';

interface Track {
  name: string;
  url: string;
  duration: number;
}

interface CD {
  _id: string;
  userId: string;
  title: string;
  artist: string;
  genre: string;
  coverImage?: string;
  duration: string;
  tracks: Track[];
  likes?: number;
  plays?: number;
}

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  url: string;
  cover: string;
}

const API_BASE_URL = 'http://localhost:5000';

export default function UserCDsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [cds, setCds] = useState<CD[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCD, setSelectedCD] = useState<CD | null>(null);
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [userFavorites, setUserFavorites] = useState<{ [key: string]: boolean }>({});
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Usar el contexto del reproductor
  const { lista, agregarCancion, setLista, setIndiceActual, indiceActual, reproduciendo, togglePlay } = useReproductor();
  const { user } = useContext(UserContext);

  const isOwner = user && userId && String(user._id) === String(userId);

  useEffect(() => {
    if (!userId) return;

    const fetchCDs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cds/user/${userId}`);
        const data = await res.json();

        const cdsData = Array.isArray(data) ? data : data.cds || [];

        const cdsWithStats = cdsData.map((cd: CD) => ({
          ...cd,
          likes: cd.likes || 0,
          plays: cd.plays || 0
        }));

        setCds(cdsWithStats);

        const likes: { [key: string]: boolean } = {};
        const favorites: { [key: string]: boolean } = {};
        cdsWithStats.forEach((cd: CD) => {
          likes[cd._id] = false;
          favorites[cd._id] = false;
        });
        setUserLikes(likes);
        setUserFavorites(favorites);

      } catch (err) {
        console.error('Error fetching CDs:', err);
        showToast('Error al cargar los CDs');
      } finally {
        setLoading(false);
      }
    };

    fetchCDs();
  }, [userId]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const normalizeAudioUrl = (url: string): string | null => {
    if (!url || url.trim() === '') return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }

    return `${API_BASE_URL}/${url}`;
  };

  // Verificar si un track está actualmente reproduciéndose
  const isTrackPlaying = (cd: CD, trackIndex: number): boolean => {
    if (!reproduciendo || lista.length === 0) return false;
    const currentSong = lista[indiceActual];
    const track = cd.tracks[trackIndex];
    return currentSong?.titulo === track.name && currentSong?.artista === cd.artist;
  };

  // Verificar si un CD está actualmente reproduciéndose
  const isCDPlaying = (cd: CD): boolean => {
    if (!reproduciendo || lista.length === 0) return false;
    const currentSong = lista[indiceActual];
    return cd.tracks.some(track => 
      currentSong?.titulo === track.name && currentSong?.artista === cd.artist
    );
  };

  // Verificar si un track está en la playlist
  const isTrackInPlaylist = (cd: CD, trackIndex: number): boolean => {
    const track = cd.tracks[trackIndex];
    return lista.some(c => c.titulo === track.name && c.artista === cd.artist);
  };

  const handleDeleteCD = async (cdId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cds/${cdId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCds(prev => prev.filter(cd => cd._id !== cdId));
        showToast('CD eliminado exitosamente');
        setShowDeleteConfirm(null);
        if (selectedCD?._id === cdId) {
          setSelectedCD(null);
        }
      } else {
        showToast('Error al eliminar el CD');
      }
    } catch (err) {
      console.error('Error deleting CD:', err);
      showToast('Error al eliminar el CD');
    }
  };

  const handleEditCD = (cdId: string) => {
    router.push(`/crearcd?userId=${userId}&edit=${cdId}`);
  };

  const handleCDClick = (cd: CD) => {
    if (cd.userId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentMusicoId', cd.userId);
      }
    }
    setSelectedCD(cd);
  };

  const toggleLike = (cdId: string) => {
    setUserLikes(prev => ({ ...prev, [cdId]: !prev[cdId] }));
    setCds(prev => prev.map(cd => {
      if (cd._id === cdId) {
        const newLikes = (cd.likes || 0) + (userLikes[cdId] ? -1 : 1);
        return { ...cd, likes: newLikes };
      }
      return cd;
    }));
    showToast(userLikes[cdId] ? 'Like eliminado' : 'Te gusta este album');
  };

  const toggleFavorite = (cdId: string) => {
    setUserFavorites(prev => ({ ...prev, [cdId]: !prev[cdId] }));
    showToast(userFavorites[cdId] ? 'Eliminado de favoritos' : 'Añadido a favoritos');
  };

  const handleShare = (cd: CD) => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/cds/${cd._id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Enlace copiado al portapapeles');
      }).catch(() => {
        showToast('No se pudo copiar el enlace');
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función mejorada para reproducir o pausar un track
  const handlePlayPauseTrack = (cd: CD, trackIndex: number) => {
    const track = cd.tracks[trackIndex];
    const normalizedUrl = normalizeAudioUrl(track.url);

    if (!normalizedUrl) {
      showToast('Esta canción no tiene audio disponible');
      return;
    }

    // Si este track está reproduciéndose actualmente, pausar
    if (isTrackPlaying(cd, trackIndex)) {
      togglePlay();
      return;
    }

    // Buscar si el track ya está en la playlist
    const indexInList = lista.findIndex(c => 
      c.titulo === track.name && c.artista === cd.artist
    );

    if (indexInList !== -1) {
      // Si está en la lista, cambiar índice y reproducir
      setIndiceActual(indexInList);
      if (!reproduciendo) togglePlay();
    } else {
      // Si no está, agregarlo y reproducir
      const nuevaCancion: Cancion = {
        id: `${cd._id}-${track.name}-${Date.now()}`,
        titulo: track.name,
        artista: cd.artist || 'Artista desconocido',
        url: normalizedUrl,
        cover: cd.coverImage || '/default-cover.png',
      };

      const newList = [...lista, nuevaCancion];
      setLista(newList);
      setIndiceActual(newList.length - 1);
      if (!reproduciendo) togglePlay();
    }

    showToast(`"${track.name}" ${isTrackPlaying(cd, trackIndex) ? 'pausada' : 'reproduciendo'}`);
  };

  // Función para agregar un track a la playlist sin reproducir
  const addTrackToPlaylist = (track: Track, cd: CD) => {
    const normalizedUrl = normalizeAudioUrl(track.url);

    if (!normalizedUrl) {
      showToast('Esta canción no tiene audio disponible');
      return;
    }

    // Verificar si ya está en la playlist
    if (isTrackInPlaylist(cd, cd.tracks.indexOf(track))) {
      showToast('Esta canción ya está en la playlist');
      return;
    }

    const nuevaCancion: Cancion = {
      id: `${cd._id}-${track.name}-${Date.now()}`,
      titulo: track.name,
      artista: cd.artist || 'Artista desconocido',
      url: normalizedUrl,
      cover: cd.coverImage || '/default-cover.png',
    };

    agregarCancion(nuevaCancion);
    showToast(`"${track.name}" añadida a la playlist`);
  };

  // Función para reproducir todo el álbum
  const playAlbum = (cd: CD) => {
    const tracksWithAudio: Cancion[] = [];

    cd.tracks.forEach(track => {
      const normalizedUrl = normalizeAudioUrl(track.url);
      if (normalizedUrl) {
        tracksWithAudio.push({
          id: `${cd._id}-${track.name}-${Date.now()}`,
          titulo: track.name,
          artista: cd.artist || 'Artista desconocido',
          url: normalizedUrl,
          cover: cd.coverImage || '/default-cover.png',
        });
      }
    });

    if (tracksWithAudio.length === 0) {
      showToast('Este album no tiene canciones con audio');
      return;
    }

    setLista(tracksWithAudio);
    setIndiceActual(0);
    if (!reproduciendo) togglePlay();
    showToast(`"${cd.title}" listo para reproducir (${tracksWithAudio.length} canciones)`);
  };

  // Función para agregar todo el álbum a la playlist
  const addAlbumToPlaylist = (cd: CD) => {
    const tracksWithAudio: Cancion[] = [];

    cd.tracks.forEach(track => {
      const normalizedUrl = normalizeAudioUrl(track.url);
      if (normalizedUrl) {
        const alreadyInList = lista.some(c => 
          c.titulo === track.name && c.artista === cd.artist
        );
        
        if (!alreadyInList) {
          tracksWithAudio.push({
            id: `${cd._id}-${track.name}-${Date.now()}`,
            titulo: track.name,
            artista: cd.artist || 'Artista desconocido',
            url: normalizedUrl,
            cover: cd.coverImage || '/default-cover.png',
          });
        }
      }
    });

    if (tracksWithAudio.length === 0) {
      showToast('Todas las canciones ya están en la playlist o no tienen audio');
      return;
    }

    tracksWithAudio.forEach(cancion => agregarCancion(cancion));
    showToast(`${tracksWithAudio.length} canciones añadidas a la playlist`);
  };

  const genres = ['all', ...Array.from(new Set(cds.map(cd => cd.genre)))];
  const filteredCDs = currentFilter === 'all' ? cds : cds.filter(cd => cd.genre === currentFilter);

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <p className="text-xl">Usuario no identificado</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center text-white">
        <div className="text-center">
          <Disc className="w-16 h-16 mx-auto animate-spin mb-4" />
          <p className="text-xl">Cargando tu música...</p>
        </div>
      </div>
    );
  }

  if (cds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col items-center justify-center text-white">
        <div className="text-center mb-4">
          <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <p className="text-xl text-white/60 mb-4">No hay CDs para este usuario</p>
          {isOwner && (
            <button
              onClick={() => router.push(`/crearcd?userId=${userId}`)}
              className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full font-semibold hover:scale-105 transition-transform border border-white/20"
            >
              Crear mi primer CD
            </button>
          )}
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-gray-600 rounded-full font-semibold hover:bg-gray-700 transition-colors"
        >
          Home
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white pb-32">
        <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Disc className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                    {isOwner ? 'Mi Colección Musical' : 'Colección Musical'}
                  </h1>
                  <p className="text-sm text-white/60">{cds.length} álbumes en total</p>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => router.push(`/crearcd?userId=${userId}`)}
                  className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full font-semibold hover:scale-105 transition-transform border border-white/20"
                >
                  Crear Nuevo CD
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {genres.length > 1 && (
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setCurrentFilter(genre)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${currentFilter === genre
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                >
                  {genre === 'all' ? 'Todos' : genre}
                </button>
              ))}
            </div>
          )}

          {filteredCDs.length === 0 ? (
            <div className="text-center py-20">
              <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-xl text-white/60">No hay CDs en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCDs.map(cd => (
                <div
                  key={cd._id}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10"
                >
                  <div
                    className="relative aspect-square overflow-hidden cursor-pointer"
                    onClick={() => handleCDClick(cd)}
                  >
                    {cd.coverImage ? (
                      <img
                        src={cd.coverImage}
                        alt={cd.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <Music className="w-24 h-24 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCDPlaying(cd)) {
                            togglePlay();
                          } else {
                            playAlbum(cd);
                          }
                        }}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform ${
                          isCDPlaying(cd) ? 'bg-pink-600 animate-pulse' : 'bg-white'
                        }`}
                      >
                        {isCDPlaying(cd) ? (
                          <Pause className="w-8 h-8 text-white" fill="currentColor" />
                        ) : (
                          <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                        )}
                      </button>
                    </div>

                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-semibold">
                      {cd.genre}
                    </div>

                    {isCDPlaying(cd) && (
                      <div className="absolute top-3 left-3 bg-pink-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        Reproduciendo
                      </div>
                    )}

                    {isOwner && (
                      <div className="absolute bottom-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCD(cd._id);
                          }}
                          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all hover:scale-110"
                          title="Editar CD"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(cd._id);
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-all hover:scale-110"
                          title="Eliminar CD"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-1 truncate">{cd.title}</h3>
                    <p className="text-white/60 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {cd.artist || 'Artista desconocido'}
                    </p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{cd.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>{cd.plays || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{cd.duration}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(cd._id);
                        }}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${userLikes[cd._id]
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-white/10 hover:bg-white/20'
                          }`}
                      >
                        <Heart className={`w-4 h-4 ${userLikes[cd._id] ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(cd._id);
                        }}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${userFavorites[cd._id]
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-white/10 hover:bg-white/20'
                          }`}
                      >
                        <Star className={`w-4 h-4 ${userFavorites[cd._id] ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(cd);
                        }}
                        className="flex-1 py-2 rounded-lg font-semibold bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCD && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCD(null)}
          >
            <div
              className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-lg p-6 border-b border-white/10">
                <button
                  onClick={() => setSelectedCD(null)}
                  className="float-right text-3xl hover:text-red-500 transition-colors"
                >
                  ×
                </button>
                <div className="flex gap-6">
                  {selectedCD.coverImage ? (
                    <img
                      src={selectedCD.coverImage}
                      alt={selectedCD.title}
                      className="w-32 h-32 rounded-xl object-cover shadow-2xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <Music className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{selectedCD.title}</h2>
                    <p className="text-xl text-white/80 mb-2">{selectedCD.artist || 'Artista desconocido'}</p>
                    <div className="flex gap-4 text-sm text-white/60">
                      <span className="px-3 py-1 bg-white/10 rounded-full">{selectedCD.genre}</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full">{selectedCD.duration}</span>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleEditCD(selectedCD._id)}
                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar CD
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(selectedCD._id)}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar CD
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>{selectedCD.likes || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-gray-400" />
                    <span>{selectedCD.plays || 0} reproducciones</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => {
                      if (isCDPlaying(selectedCD)) {
                        togglePlay();
                      } else {
                        playAlbum(selectedCD);
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCDPlaying(selectedCD)
                        ? 'bg-pink-600 hover:bg-pink-700 animate-pulse'
                        : 'bg-pink-500 hover:bg-pink-600'
                    }`}
                  >
                    {isCDPlaying(selectedCD) ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pausar Álbum
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" fill="currentColor" />
                        Reproducir Álbum
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => addAlbumToPlaylist(selectedCD)}
                    className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar a Playlist
                  </button>
                </div>

                {selectedCD.tracks && selectedCD.tracks.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Lista de canciones ({selectedCD.tracks.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedCD.tracks.map((track, index) => {
                        const normalizedUrl = normalizeAudioUrl(track.url);
                        const hasValidAudio = normalizedUrl !== null;
                        const isPlaying = isTrackPlaying(selectedCD, index);
                        const inPlaylist = isTrackInPlaylist(selectedCD, index);

                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                              isPlaying 
                                ? 'bg-pink-500/20 border border-pink-500/50' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-white/40 w-6 flex-shrink-0">{index + 1}</span>
                              <button
                                onClick={() => handlePlayPauseTrack(selectedCD, index)}
                                disabled={!hasValidAudio}
                                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                                  hasValidAudio
                                    ? isPlaying
                                      ? 'bg-pink-600 animate-pulse'
                                      : 'bg-pink-500 hover:bg-pink-600'
                                    : 'bg-white/5 cursor-not-allowed'
                                }`}
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4" fill="currentColor" />
                                ) : (
                                  <Play className="w-4 h-4" fill={hasValidAudio ? 'currentColor' : 'none'} />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{track.name}</p>
                                <div className="flex items-center gap-2 text-xs text-white/40">
                                  {!hasValidAudio && <span>Sin audio disponible</span>}
                                  {isPlaying && <span className="text-pink-400 font-semibold">Reproduciendo</span>}
                                  {!isPlaying && inPlaylist && <span className="text-purple-400">En playlist</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => addTrackToPlaylist(track, selectedCD)}
                                disabled={!hasValidAudio || inPlaylist}
                                className={`p-2 rounded-lg transition-all ${
                                  hasValidAudio && !inPlaylist
                                    ? 'bg-white/10 hover:bg-purple-500/30 hover:scale-110'
                                    : 'bg-white/5 cursor-not-allowed opacity-50'
                                }`}
                                title={inPlaylist ? "Ya está en playlist" : "Agregar a playlist"}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <span className="text-white/60 ml-1">{formatDuration(track.duration)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => toggleLike(selectedCD._id)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${userLikes[selectedCD._id]
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-white/10 hover:bg-white/20'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${userLikes[selectedCD._id] ? 'fill-current' : ''}`} />
                    {userLikes[selectedCD._id] ? 'Te gusta' : 'Me gusta'}
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedCD._id)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${userFavorites[selectedCD._id]
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-white/10 hover:bg-white/20'
                      }`}
                  >
                    <Star className={`w-5 h-5 ${userFavorites[selectedCD._id] ? 'fill-current' : ''}`} />
                    Favorito
                  </button>
                  <button
                    onClick={() => handleShare(selectedCD)}
                    className="flex-1 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">¿Eliminar CD?</h3>
                <p className="text-white/60">
                  Esta acción no se puede deshacer. El CD y todas sus canciones serán eliminados permanentemente.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCD(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast.show && (
          <div className="fixed bottom-6 right-6 bg-white text-black px-6 py-3 rounded-full shadow-2xl font-semibold animate-in slide-in-from-bottom-5 z-50">
            {toast.message}
          </div>
        )}
      </div>

    </>
  );
}