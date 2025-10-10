'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Heart, Music, Users, Calendar, Play, Plus, Pause, Volume2, Trash2 } from 'lucide-react';
import { useReproductor } from '../../context/ReproductorContext';
import { Cancion } from '../../components/Reproductor';
import Link from 'next/link';

interface Music {
  _id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  soloist?: boolean;
  likes?: number;
  rating?: number;
  cover?: string;
  coverUrl?: string;
  avatarArtist?: string;
  idMusico?: string;
  audioUrl?: string;
  releaseDate?: string;
}

interface ArtistInfo {
  name: string;
  genre?: string;
  avatarArtist?: string;
  soloist?: boolean;
  totalLikes: number;
  totalSongs: number;
  biography?: string;
  members?: string[];
  formedYear?: number;
}

interface LocalPlaylistItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover?: string;
}




const FANPAGE_PLAYLIST_KEY = 'fanpage_local_playlist';

export default function ArtistFanPage() {
  const params = useParams();
  const artistSlug = params?.artist as string;
  const artistName = artistSlug?.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [songs, setSongs] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  type TabType = 'musica' | 'biografia' | 'galeria';
  const [selectedTab, setSelectedTab] = useState<TabType>('musica');

  const [localPlaylist, setLocalPlaylist] = useState<LocalPlaylistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FANPAGE_PLAYLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { agregarCancion, setLista, setIndiceActual } = useReproductor();
  const [artistId, setArtistId] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FANPAGE_PLAYLIST_KEY, JSON.stringify(localPlaylist));
    }
  }, [localPlaylist]);

  useEffect(() => {
    if (localPlaylist.length > 0 && audioRef.current) {
      const currentSong = localPlaylist[currentPlayingIndex];
      if (currentSong && audioRef.current.src !== currentSong.url) {
        audioRef.current.pause();
        audioRef.current.src = currentSong.url;
        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }
    }
  }, [currentPlayingIndex, localPlaylist]);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
        if (!res.ok) throw new Error('Error al obtener música');
        const allData: Music[] = await res.json();
        console.log('Datos recibidos en fanpage:', allData);

        // Filtramos las canciones del artista
        const artistSongs = allData.filter(
          song => song.artist.toLowerCase() === artistName.toLowerCase()
        );

        setSongs(artistSongs);

        if (artistSongs.length === 0) {
          setArtistInfo(null);
          setArtistId(null); // aseguramos limpiar el idMusico si no hay canciones
          return;
        }

        // Guardamos el ideMusico de la primera canción que tenga ese campo
        const firstSongWithId = artistSongs.find(song => song.idMusico);
        setArtistId(firstSongWithId?.idMusico || null);
        console.log('idMusico del artista:', firstSongWithId?.idMusico);

        const songWithAvatar = artistSongs.find(song => song.avatarArtist) || artistSongs[0];

        const totalLikes = artistSongs.reduce((sum, song) => sum + (song.likes || 0), 0);
        const info: ArtistInfo = {
          name: artistName,
          genre: songWithAvatar?.genre || 'Desconocido',
          avatarArtist: songWithAvatar?.avatarArtist || '/default-artist.png',
          soloist: songWithAvatar?.soloist,
          totalLikes,
          totalSongs: artistSongs.length,
          biography: `${artistName} es un ${songWithAvatar?.soloist ? 'artista solista' : 'grupo musical'} reconocido en el género ${songWithAvatar?.genre || 'musical'}. Con ${artistSongs.length} canciones en su repertorio, ha cautivado a miles de fans con su estilo único y emotivo.`,
          members: songWithAvatar?.soloist ? undefined : ['Miembro 1', 'Miembro 2', 'Miembro 3', 'Miembro 4'],
          formedYear: 2018,
        };
        setArtistInfo(info);

      } catch (err) {
        console.error('Error cargando artista:', err);
      } finally {
        setLoading(false);
      }
    };

    if (artistName) {
      fetchArtistData();
    }
  }, [artistName]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const addToPlaylist = (song: Music) => {
    const nueva: Cancion = {
      id: song._id,
      titulo: song.title,
      artista: song.artist,
      url: song.audioUrl || '',
      cover: song.coverUrl || song.cover || '',
    };
    agregarCancion(nueva);
  };

  const playAll = () => {
    const playlist: Cancion[] = songs.map(s => ({
      id: s._id,
      titulo: s.title,
      artista: s.artist,
      url: s.audioUrl || '',
      cover: s.coverUrl || s.cover || '',
    }));
    setLista(playlist);
    setIndiceActual(0);
  };

  const addToLocalPlaylist = (song: Music) => {
    if (!song.audioUrl) {
      console.error('No hay URL de audio para esta canción');
      return;
    }

    const newSong: LocalPlaylistItem = {
      id: song._id,
      title: song.title,
      artist: song.artist,
      url: song.audioUrl,
      cover: song.coverUrl || song.cover,
    };

    if (localPlaylist.some(s => s.id === newSong.id)) {
      return;
    }

    setLocalPlaylist(prev => [...prev, newSong]);

    if (localPlaylist.length === 0) {
      setCurrentPlayingIndex(0);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = newSong.url;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  };

  const removeFromLocalPlaylist = (id: string) => {
    const index = localPlaylist.findIndex(s => s.id === id);
    const newPlaylist = localPlaylist.filter(s => s.id !== id);
    setLocalPlaylist(newPlaylist);

    if (newPlaylist.length === 0) {
      setIsPlaying(false);
      setCurrentPlayingIndex(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    } else if (index === currentPlayingIndex) {
      const newIndex = currentPlayingIndex >= newPlaylist.length ? 0 : currentPlayingIndex;
      setCurrentPlayingIndex(newIndex);
    } else if (index < currentPlayingIndex) {
      setCurrentPlayingIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || localPlaylist.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const nextSong = () => {
    if (localPlaylist.length === 0) return;
    const newIndex = (currentPlayingIndex + 1) % localPlaylist.length;
    setCurrentPlayingIndex(newIndex);
  };

  const prevSong = () => {
    if (localPlaylist.length === 0) return;
    const newIndex = (currentPlayingIndex - 1 + localPlaylist.length) % localPlaylist.length;
    setCurrentPlayingIndex(newIndex);
  };

  const playSongAtIndex = (index: number) => {
    setCurrentPlayingIndex(index);
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextSong();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentPlayingIndex, localPlaylist.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900">
        <div className="text-white text-2xl animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!artistInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900">
        <div className="text-white text-2xl">Artista no encontrado</div>
      </div>
    );
  }

  const currentSong = localPlaylist[currentPlayingIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 overflow-x-hidden">
      <audio ref={audioRef} />

      {/* Hero Section */}
      <div className="relative h-96 md:h-[28rem] bg-gradient-to-b from-black/60 to-transparent">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${artistInfo.avatarArtist})` }}
        />
        <div className="relative h-full flex items-end p-4 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 w-full">
            <img
              src={artistInfo.avatarArtist}
              alt={artistInfo.name}
              className="w-24 sm:w-28 md:w-32 lg:w-36 h-24 sm:h-28 md:h-32 lg:h-36 rounded-lg shadow-2xl border-4 border-white/20 flex-shrink-0 object-cover"
            />

            <div className="flex-1 text-center md:text-left w-full md:w-auto">
              <p className="text-pink-300 text-xs md:text-sm font-semibold mb-2">
                {artistInfo.soloist ? 'ARTISTA SOLISTA' : 'GRUPO MUSICAL'}
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg break-words">
                {artistInfo.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 text-white text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <Heart className="w-3 h-3 md:w-4 md:h-4 text-pink-400" />
                  <span>{artistInfo.totalLikes.toLocaleString()} likes</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Music className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                  <span>{artistInfo.totalSongs} canciones</span>
                </div>
                {artistInfo.members && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                    <span className="hidden sm:inline">{artistInfo.members.length} miembros</span>
                    <span className="sm:hidden">{artistInfo.members.length}</span>
                  </div>
                )}
                {artistInfo.formedYear && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                    <span className="hidden sm:inline">Desde {artistInfo.formedYear}</span>
                    <span className="sm:hidden">{artistInfo.formedYear}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>   {/* Action Buttons */}
      <div className="px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-10">
        <button
          onClick={playAll}
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 md:py-2.5 px-4 md:px-5 rounded-full flex items-center justify-center gap-2 shadow-md transition transform hover:scale-105"
        >
          <Play className="w-4 h-4 md:w-4 md:h-4" fill="white" />
          <span className="hidden sm:inline">Agregar todas al reproductor</span>
          <span className="sm:hidden">Agregar todas</span>
        </button>
        {/* Botón Cds dinámico usando ideMusico */}
        <Link
          href={artistId ? `/cd/${artistId}` : '#'}
          className={`bg-white/10 text-white font-semibold py-2 md:py-2.5 px-4 md:px-5 rounded-full backdrop-blur-sm transition text-center 
  ${artistId ? 'hover:bg-white/20' : 'opacity-50 cursor-not-allowed'}`}
        >
          Cds
        </Link>

        <Link
          href="/"
          className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 md:py-2.5 px-4 md:px-5 rounded-full backdrop-blur-sm transition text-center"
        >
          Volver es aca
        </Link>
      </div>


      {/* Reproductor local flotante */}
      {localPlaylist.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-3 md:p-4 shadow-2xl z-50 sm:w-80">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <img
              src={currentSong?.cover || '../../assets/lemon.jpg'}
              alt={currentSong?.title}
              className="w-12 h-12 md:w-14 md:h-14 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-xs md:text-sm truncate">
                {currentSong?.title || 'Sin canción'}
              </p>
              <p className="text-white/80 text-xs truncate">
                {currentSong?.artist || '...'}
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center gap-2 md:gap-3 mb-2">
            <button onClick={prevSong} className="text-white hover:text-pink-200">
              <Play className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            </button>
            <button
              onClick={togglePlay}
              className="bg-white text-pink-600 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:scale-110 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
            </button>
            <button onClick={nextSong} className="text-white hover:text-pink-200">
              <Play className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <p className="text-white/70 text-xs text-center mb-2">
            {currentPlayingIndex + 1} / {localPlaylist.length}
          </p>

          <div className="max-h-24 md:max-h-32 overflow-y-auto space-y-1">
            {localPlaylist.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-1.5 md:p-2 rounded text-xs cursor-pointer ${idx === currentPlayingIndex ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                onClick={() => playSongAtIndex(idx)}
              >
                <span className="text-white/60 w-4 flex-shrink-0">{idx + 1}</span>
                <span className="text-white flex-1 truncate min-w-0">{item.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromLocalPlaylist(item.id); }}
                  className="text-red-400 hover:text-red-300 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 md:px-8 mb-4 md:mb-6">
        <div className="flex gap-2 md:gap-4 border-b border-white/20 overflow-x-auto">
          {[
            { id: 'musica' as const, label: 'Música' },
            { id: 'biografia' as const, label: 'Biografía' },
            { id: 'galeria' as const, label: 'Galería' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 md:px-6 py-2 md:py-3 font-semibold transition whitespace-nowrap ${selectedTab === tab.id
                ? 'text-pink-400 border-b-2 border-pink-400'
                : 'text-white/70 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-32 sm:pb-20">
        {selectedTab === 'musica' && (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={song._id}
                className="backdrop-blur-md hover:bg-white/20 rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-4 group transition bg-white/10"
              >
                <div className="text-white/50 font-semibold w-6 md:w-8 flex-shrink-0">{index + 1}</div>
                <img
                  src={song.coverUrl || song.cover || '../../assets/lemon.jpg'}
                  alt={song.title}
                  className="w-10 h-10 md:w-12 md:h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm md:text-base truncate">{song.title}</h3>
                  <p className="text-white/60 text-xs md:text-sm truncate">{song.album || 'Single'}</p>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-white/70 flex-shrink-0">
                  <Heart className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{song.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  <button
                    onClick={() => addToLocalPlaylist(song)}
                    className="bg-pink-600 hover:bg-pink-700 text-white p-1.5 md:p-2 rounded-full transition"
                    title="Reproducir en esta página"
                  >
                    <Play className="w-3 h-3 md:w-4 md:h-4" fill="white" />
                  </button>
                  <button
                    onClick={() => addToPlaylist(song)}
                    className="bg-white/20 hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition"
                    title="Agregar al reproductor global"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'biografia' && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-8 max-w-3xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">Sobre {artistInfo.name}</h2>
            <p className="text-white/80 text-sm md:text-lg leading-relaxed mb-4 md:mb-6">
              {artistInfo.biography}
            </p>
            {artistInfo.members && (
              <>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">Miembros</h3>
                <ul className="space-y-2">
                  {artistInfo.members.map((member, idx) => (
                    <li key={idx} className="text-white/70 text-sm md:text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      {member}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {selectedTab === 'galeria' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {songs.slice(0, 8).map(song => (
              <div
                key={song._id}
                className="aspect-square rounded-lg overflow-hidden shadow-lg hover:scale-105 transition transform"
              >
                <img
                  src={song.coverUrl || song.cover || '../../assets/lemon.jpg'}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}