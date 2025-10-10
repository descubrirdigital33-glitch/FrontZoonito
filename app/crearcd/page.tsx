'use client';
import { useEffect, useState, useContext, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserContext } from '../context/UserContext';
import { Trash2, Edit, Music, Disc3, Play, Pause, Image, GripVertical, Check, X, Upload, Save, ArrowLeft } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  file?: File;
  url: string;
  duration?: number;
}

interface CD {
  id: string;
  title: string;
  artist: string;
  genre: string;
  tracks: Track[];
  duration: string;
  coverImage?: string;
  coverFile?: File;
}

interface BackendTrack {
  name: string;
  url: string;
  duration: number;
}

interface BackendCD {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  tracks: BackendTrack[];
  duration: string;
  coverImage: string;
}

const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae'];

export default function SubirCD() {
  const { user } = useContext(UserContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const userIdFromQuery = searchParams.get('userId');
  const editCdId = searchParams.get('edit'); // ID del CD a editar
  const [isEditMode, setIsEditMode] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [cd, setCD] = useState<CD>({
    id: `cd-${Date.now()}`,
    title: 'Nuevo CD',
    artist: user?.name || 'Sin definir',
    genre: 'Rock',
    tracks: [],
    duration: '00:00',
    coverImage: undefined,
    coverFile: undefined
  });
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingArtist, setEditingArtist] = useState(false);
  const [editingTrack, setEditingTrack] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isLoadingCD, setIsLoadingCD] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (user && user._id === userIdFromQuery) {
      setWelcomeName(user.name || 'Usuario');
    }
  }, [user, userIdFromQuery]);

  // Cargar CD para editar
  useEffect(() => {
    if (editCdId) {
      loadCDForEdit(editCdId);
    }
  }, [editCdId]);

  const loadCDForEdit = async (cdId: string) => {
    setIsLoadingCD(true);
    setIsEditMode(true);
    try {
      const response = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/cds/${cdId}`);
      if (!response.ok) throw new Error('Error al cargar el CD');

      const data: BackendCD = await response.json();
      console.log('📀 CD cargado para editar:', data);

      // Transformar los tracks del backend
      const transformedTracks: Track[] = data.tracks.map((track: BackendTrack, index: number) => ({
        id: `track-${index}-${Date.now()}`,
        name: track.name,
        url: track.url.startsWith('http') ? track.url : `https://backend-zoonito-6x8h.vercel.app/${track.url}`,
        duration: track.duration || 0,
        file: undefined // No hay archivo físico al cargar desde BD
      }));

      setCD({
        id: data._id,
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        tracks: transformedTracks,
        duration: data.duration || '00:00',
        coverImage: data.coverImage?.startsWith('http')
          ? data.coverImage
          : `http://localhost:5000https://backend-zoonito-6x8h.vercel.app/${data.coverImage}`,
        coverFile: undefined
      });

      setUploadMessage('CD cargado para editar');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (error) {
      console.error('❌ Error cargando CD:', error);
      setUploadMessage('Error al cargar el CD para editar');
    } finally {
      setIsLoadingCD(false);
    }
  };

  // Calculate total duration
  useEffect(() => {
    const totalSeconds = cd.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    setCD(prev => ({ ...prev, duration: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` }));
  }, [cd.tracks]);

  // ---------- EDITING ----------
  const startEditingTitle = () => {
    setEditingTitle(true);
    setEditValue(cd.title);
  };

  const saveEditingTitle = () => {
    if (editValue.trim()) {
      setCD({ ...cd, title: editValue.trim() });
    }
    setEditingTitle(false);
    setEditValue('');
  };

  const startEditingArtist = () => {
    setEditingArtist(true);
    setEditValue(cd.artist);
  };

  const saveEditingArtist = () => {
    if (editValue.trim()) {
      setCD({ ...cd, artist: editValue.trim() });
    }
    setEditingArtist(false);
    setEditValue('');
  };

  const startEditingTrack = (trackIndex: number, currentTrack: Track) => {
    setEditingTrack(trackIndex);
    setEditValue(currentTrack.name);
  };

  const saveEditingTrack = () => {
    if (editingTrack !== null && editValue.trim()) {
      const newTracks = [...cd.tracks];
      newTracks[editingTrack] = { ...newTracks[editingTrack], name: editValue.trim() };
      setCD({ ...cd, tracks: newTracks });
    }
    setEditingTrack(null);
    setEditValue('');
  };

  const deleteTrack = (trackIndex: number) => {
    const trackToDelete = cd.tracks[trackIndex];
    if (trackToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToDelete.url);
    }
    const newTracks = cd.tracks.filter((_, idx) => idx !== trackIndex);
    setCD({ ...cd, tracks: newTracks });
  };

  // ---------- COVER MANAGEMENT ----------
  const startChangingCover = () => {
    if (coverInputRef.current) coverInputRef.current.click();
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Error: Solo se permiten imágenes');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage('Error: La imagen es muy grande (máx 10MB)');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    const url = URL.createObjectURL(file);
    setCD(prev => ({ ...prev, coverImage: url, coverFile: file }));
    console.log('📸 Portada seleccionada:', file.name);
    setUploadMessage('Portada cargada correctamente');
    setTimeout(() => setUploadMessage(''), 2000);
    if (e.target) e.target.value = '';
  };

  // ---------- PLAYBACK ----------
  const togglePlay = (trackIndex: number) => {
    const track = cd.tracks[trackIndex];

    if (playingTrack === trackIndex) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play();
        setPlayingTrack(trackIndex);
        audioRef.current.onended = () => setPlayingTrack(null);
      }
    }
  };

  // ---------- DRAG & DROP TRACKS ----------
  const handleDragStart = (trackIndex: number) => {
    setDraggedTrack(trackIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedTrack === null) return;
    const newTracks = [...cd.tracks];
    const [removed] = newTracks.splice(draggedTrack, 1);
    newTracks.splice(targetIndex, 0, removed);
    setCD({ ...cd, tracks: newTracks });
    setDraggedTrack(null);
  };

  // ---------- ADD TRACKS ----------
  const startAddingTrack = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    const promises: Promise<void>[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/') && cd.tracks.length + newTracks.length < 20) {
        const url = URL.createObjectURL(file);
        const trackName = file.name.replace(/\.[^/.]+$/, '');
        const track: Track = {
          id: `track-${Date.now()}-${Math.random()}`,
          name: trackName,
          file,
          url,
          duration: 0
        };

        const promise = new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audio.addEventListener('loadedmetadata', () => {
            track.duration = audio.duration;
            resolve();
          });
          audio.addEventListener('error', () => {
            track.duration = 0;
            resolve();
          });
        });

        promises.push(promise);
        newTracks.push(track);
      }
    });

    Promise.all(promises).then(() => {
      setCD({ ...cd, tracks: [...cd.tracks, ...newTracks] });
    });

    if (e.target) e.target.value = '';
  };

  // ---------- SAVE OR UPDATE TO BACKEND ----------
  const handleSaveCD = async () => {
    if (!user || !userIdFromQuery) {
      setUploadMessage('Error: Usuario no identificado');
      return;
    }

    if (cd.tracks.length === 0) {
      setUploadMessage('Error: Debes agregar al menos una canción');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('userId', userIdFromQuery);
      formData.append('title', cd.title);
      formData.append('artist', cd.artist);
      formData.append('genre', cd.genre);

      // Add cover image
      if (cd.coverFile) {
        console.log('📸 Agregando portada al FormData:', cd.coverFile.name);
        formData.append('coverFile', cd.coverFile);
      }

      // Add only NEW tracks (those with file)
      cd.tracks.forEach((track) => {
        if (track.file) {
          formData.append('audioFile', track.file);
        }
      });

      // En modo edición, enviar la información de tracks existentes
      if (isEditMode) {
        const existingTracks = cd.tracks
          .filter(track => !track.file)
          .map(track => ({
            name: track.name,
            url: track.url,
            duration: track.duration
          }));
        formData.append('existingTracks', JSON.stringify(existingTracks));
      }

      console.log('📤 Enviando CD:', {
        mode: isEditMode ? 'EDITAR' : 'CREAR',
        title: cd.title,
        tracks: cd.tracks.length,
        newTracks: cd.tracks.filter(t => t.file).length,
        existingTracks: cd.tracks.filter(t => !t.file).length
      });

      const url = isEditMode
        ? `https://backend-zoonito-6x8h.vercel.app/api/cds/${cd.id}`
        : 'https://backend-zoonito-6x8h.vercel.app/api/cds';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${isEditMode ? 'actualizar' : 'guardar'} el CD`);
      }

      const data = await response.json();
      console.log('✅ CD guardado:', data);
      setUploadMessage(`¡CD ${isEditMode ? 'actualizado' : 'guardado'} exitosamente!`);

      // Clean up object URLs
      cd.tracks.forEach(track => {
        if (track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url);
        }
      });
      if (cd.coverImage && cd.coverImage.startsWith('blob:')) {
        URL.revokeObjectURL(cd.coverImage);
      }

      setTimeout(() => {
        router.push(`/cd/${userIdFromQuery}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Error uploading CD:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadMessage(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingCD) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Disc3 className="w-16 h-16 mx-auto animate-spin mb-4 text-cyan-400" />
          <p className="text-xl">Cargando CD para editar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <audio ref={audioRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverSelect}
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/cd/${userIdFromQuery}`)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <Disc3 className="w-12 h-12 animate-spin text-cyan-400" style={{ animationDuration: '3s' }} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-gray-300 bg-clip-text text-transparent">
              {isEditMode ? 'Editar CD' : 'Crear Nuevo CD'}
            </h1>
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-6 mb-6">
            <div
              className="relative w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group cursor-pointer border-2 border-transparent hover:border-cyan-400 transition-all"
              onClick={startChangingCover}
            >
              {cd.coverImage ? (
                <>
                  <img src={cd.coverImage} alt={cd.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Image className="w-10 h-10 text-white" />
                  </div>
                  {cd.coverFile && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src="/assets/lemon.jpg"
                    alt="Portada por defecto"
                    className="w-16 h-16 object-cover rounded-lg shadow-md mb-2"
                  />
                  <p className="text-xs text-white/70 text-center px-2">Click para agregar portada</p>
                </div>

              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Título del CD</label>
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="flex-1 px-3 py-2 bg-white/10 border border-cyan-400 rounded text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      autoFocus
                    />
                    <button onClick={saveEditingTitle} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingTitle(false)} className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-cyan-300">{cd.title}</h2>
                    <button onClick={startEditingTitle} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Edit className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Artista</label>
                {editingArtist ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingArtist();
                        if (e.key === 'Escape') setEditingArtist(false);
                      }}
                      className="flex-1 px-3 py-2 bg-white/10 border border-cyan-400 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      autoFocus
                    />
                    <button onClick={saveEditingArtist} className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingArtist(false)} className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg text-purple-300 font-semibold">{cd.artist}</p>
                    <button onClick={startEditingArtist} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                      <Edit className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Género</label>
                <select
                  value={cd.genre}
                  onChange={(e) => setCD({ ...cd, genre: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400"
                >
                  {GENRES.map(genre => (
                    <option key={genre} value={genre} className="bg-gray-800">{genre}</option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-400">{cd.tracks.length} canciones • {cd.duration}</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent mb-6">
            {cd.tracks.length > 0 ? (
              <ul className="space-y-2">
                {cd.tracks.map((track, index) => {
                  const isPlaying = playingTrack === index;
                  const isEditing = editingTrack === index;
                  const isDragging = draggedTrack === index;
                  const isNewTrack = !!track.file;

                  return (
                    <li
                      key={track.id}
                      className={`text-sm hover:bg-white/5 rounded-lg p-2 transition-all ${isDragging ? 'opacity-50' : ''}`}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-mono text-xs w-6">{String(index + 1).padStart(2, '0')}</span>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingTrack();
                              if (e.key === 'Escape') setEditingTrack(null);
                            }}
                            className="flex-1 px-2 py-1 bg-white/10 border border-cyan-400 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                          />
                          <button onClick={saveEditingTrack} className="p-1 bg-green-500 hover:bg-green-600 rounded transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingTrack(null)} className="p-1 bg-red-500 hover:bg-red-600 rounded transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing" />
                          <span className="text-cyan-400 font-mono text-xs w-6">{String(index + 1).padStart(2, '0')}</span>
                          <span className="flex-1 text-gray-200">
                            {track.name}
                            {isNewTrack && <span className="ml-2 text-xs text-green-400">(Nueva)</span>}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePlay(index)}
                              className={`p-1.5 rounded-full transition-all ${isPlaying ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}
                              title={isPlaying ? 'Pausar' : 'Reproducir'}
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => startEditingTrack(index, track)}
                              className="p-1.5 rounded-full bg-white/10 text-gray-400 hover:bg-amber-500 hover:text-white transition-all"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTrack(index)}
                              className="p-1.5 rounded-full bg-white/10 text-gray-400 hover:bg-red-500 hover:text-white transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aún no hay canciones agregadas</p>
              </div>
            )}

            {cd.tracks.length < 20 && (
              <button
                onClick={startAddingTrack}
                className="w-full mt-4 px-4 py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-cyan-400 rounded-lg text-gray-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                {isEditMode ? 'Agregar más canciones' : 'Subir canciones MP3'}
              </button>
            )}
          </div>

          {uploadMessage && (
            <div className={`mb-4 p-4 rounded-lg text-center font-semibold ${uploadMessage.includes('Error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
              {uploadMessage}
            </div>
          )}

          <button
            onClick={handleSaveCD}
            disabled={isUploading || cd.tracks.length === 0}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Disc3 className="w-6 h-6 animate-spin" />
                {isEditMode ? 'Actualizando CD...' : 'Guardando CD...'}
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                {isEditMode ? 'Actualizar CD' : 'Guardar CD'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
