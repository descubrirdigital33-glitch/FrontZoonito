'use client';
import { useState, useRef, ChangeEvent, DragEvent, useEffect, useContext } from 'react';
import { X, Upload, Music, Plus, Trash2, Save, MoveUp, MoveDown, RefreshCw, Edit } from 'lucide-react';
import Image from 'next/image';
import MusicDown from "../musicDown/page";
import { UserContext } from "../context/UserContext";
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    album: string;
    genre: string;
    coverFile: File | null;
    coverPreview: string;
    audioFile: File | null;
    audioName: string;
    soloist: boolean;
    avance: boolean;
}

interface SavedTrack {
    _id: string;
    title: string;
    artist: string;
    album: string;
    genre: string;
    coverUrl: string;
    audioUrl: string;
    soloist: boolean;
    avance: boolean;
    likes: number;
    rating: number;
    createdAt: string;
}

interface UploadProgress {
    [key: string]: number;
}

interface TrackUpdateData {
    title: string;
    artist: string;
    album: string;
    genre: string;
    soloist: boolean;
    avance: boolean;
    coverFile: File | null;
    coverUrl?: string;
}

export default function MusicUp() {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
    const [dragActive, setDragActive] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useContext(UserContext);

    const MAX_TRACKS = 25;
    const MAX_SIMULTANEOUS = 3;
    const API_URL = 'https://backend-zoonito-6x8h.vercel.app/api/music';
    const router = useRouter();

    const fetchSavedTracks = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setSavedTracks(data);
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la biblioteca',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#6366f1',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedTracks();
    }, []);

    const deleteSavedTrack = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta canción será eliminada permanentemente',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a2e',
            color: '#fff',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setSavedTracks(savedTracks.filter(track => track._id !== id));
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminada!',
                    text: 'La canción se eliminó correctamente',
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#1a1a2e',
                    color: '#fff',
                });
            }
        } catch (error) {
            console.error('Error deleting track:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la canción',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#6366f1',
            });
        }
    };

    const editSavedTrack = async (track: SavedTrack) => {
        const { value: formValues } = await Swal.fire({
            title: 'Editar Canción',
            html: `
                <div style="text-align: left; display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: #fff;">Título</label>
                        <input id="edit-title" class="swal2-input" style="width: 90%; margin: 0;" value="${track.title}">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: #fff;">Artista</label>
                        <input id="edit-artist" class="swal2-input" style="width: 90%; margin: 0;" value="${track.artist}">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: #fff;">Álbum</label>
                        <input id="edit-album" class="swal2-input" style="width: 90%; margin: 0;" value="${track.album || ''}">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: #fff;">Género</label>
                        <select id="edit-genre" class="swal2-input" style="width: 90%; margin: 0;">
                            <option value="">Seleccionar género</option>
                            <option value="Rock" ${track.genre === 'Rock' ? 'selected' : ''}>Rock</option>
                            <option value="efects" ${track.genre === 'efects' ? 'selected' : ''}>Efects Sound</option>
                            <option value="Pop" ${track.genre === 'Pop' ? 'selected' : ''}>Pop</option>
                            <option value="Jazz" ${track.genre === 'Jazz' ? 'selected' : ''}>Jazz</option>
                            <option value="Classical" ${track.genre === 'Classical' ? 'selected' : ''}>Clásica</option>
                            <option value="Electronic" ${track.genre === 'Electronic' ? 'selected' : ''}>Electrónica</option>
                            <option value="Hip-Hop" ${track.genre === 'Hip-Hop' ? 'selected' : ''}>Hip-Hop</option>
                            <option value="Folkclore" ${track.genre === 'Folkclore' ? 'selected' : ''}>Folkclore</option>
                            <option value="Reggae" ${track.genre === 'Reggae' ? 'selected' : ''}>Reggae</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: #fff;">Nueva Portada (opcional)</label>
                        <input type="file" id="edit-cover" accept="image/*" class="swal2-input" style="width: 90%; margin: 0; padding: 0.5rem;">
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff;">
                            <input type="checkbox" id="edit-soloist" ${track.soloist ? 'checked' : ''}>
                            Es solista
                        </label>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 0.5rem; color: #fff;">
                            <input type="checkbox" id="edit-avance" ${track.avance ? 'checked' : ''}>
                            Es avance
                        </label>
                    </div>
                </div>
            `,
            background: '#1a1a2e',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const coverInput = document.getElementById('edit-cover') as HTMLInputElement;
                return {
                    title: (document.getElementById('edit-title') as HTMLInputElement).value,
                    artist: (document.getElementById('edit-artist') as HTMLInputElement).value,
                    album: (document.getElementById('edit-album') as HTMLInputElement).value,
                    genre: (document.getElementById('edit-genre') as HTMLSelectElement).value,
                    soloist: (document.getElementById('edit-soloist') as HTMLInputElement).checked,
                    avance: (document.getElementById('edit-avance') as HTMLInputElement).checked,
                    coverFile: coverInput?.files?.[0] || null,
                };
            }
        });

        if (formValues) {
            await updateSavedTrack(track._id, formValues);
        }
    };

const updateSavedTrack = async (id: string, updates: TrackUpdateData) => {
    try {
        const token = localStorage.getItem('token');
        const CLOUD_NAME = "ddigfgmko";
        const UPLOAD_PRESET = "music_unsigned";

        console.log('🔄 Actualizando track:', id);
        console.log('📦 Updates recibidos:', updates);

        let coverUrl = updates.coverUrl;

        // Subir nueva portada a Cloudinary si hay coverFile
        if (updates.coverFile && updates.coverFile instanceof File) {
            console.log('📤 Subiendo nueva portada a Cloudinary...');
            const formData = new FormData();
            formData.append("file", updates.coverFile);
            formData.append("upload_preset", UPLOAD_PRESET);

            const cloudinaryRes = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!cloudinaryRes.ok) {
                const errorData = await cloudinaryRes.json();
                throw new Error(`Error al subir imagen a Cloudinary: ${errorData.error?.message || 'Desconocido'}`);
            }

            const cloudinaryData = await cloudinaryRes.json();
            coverUrl = cloudinaryData.secure_url;
            console.log('✅ Portada subida a Cloudinary:', coverUrl);

            // Alert para mostrar la URL al usuario
            alert(`Portada subida correctamente. URL: ${coverUrl}`);
        }

        // Preparar payload para backend
        const payload = {
            title: updates.title,
            artist: updates.artist,
            album: updates.album || "",
            genre: updates.genre || "",
            soloist: updates.soloist,
            avance: updates.avance,
            coverUrl // URL obtenida de Cloudinary
        };

        console.log('📦 Payload JSON a enviar al backend:', payload);

        // Enviar actualización al backend
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData: { message?: string };
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }
            throw new Error(errorData.message || `Error al actualizar: ${response.statusText}`);
        }

        const updatedTrack = await response.json();
        console.log('✅ Track actualizado:', updatedTrack);

        setSavedTracks(savedTracks.map(track =>
            track._id === id ? updatedTrack : track
        ));

        Swal.fire({
            icon: 'success',
            title: '¡Actualizada!',
            text: 'La canción se actualizó correctamente',
            timer: 2000,
            showConfirmButton: false,
            background: '#1a1a2e',
            color: '#fff',
        });

        return updatedTrack;

    } catch (error) {
        console.error('❌ Error updating track:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error instanceof Error ? error.message : 'No se pudo actualizar la canción',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#6366f1',
        });
    }
};


    const createEmptyTrack = (): MusicTrack => ({
        id: `track-${Date.now()}-${Math.random()}`,
        title: '',
        artist: '',
        album: '',
        genre: '',
        coverFile: null,
        coverPreview: '',
        audioFile: null,
        audioName: '',
        soloist: false,
        avance: false,
    });

    const addTrack = () => {
        if (tracks.length < MAX_TRACKS) {
            setTracks([...tracks, createEmptyTrack()]);
        }
    };

    const removeTrack = (id: string) => {
        setTracks(tracks.filter(track => track.id !== id));
    };

    const updateTrack = (id: string, field: keyof MusicTrack, value: string | boolean | File | null) => {
        setTracks(tracks.map(track => {
            if (track.id === id) {
                return { ...track, [field]: value };
            }
            return track;
        }));
    };

    const moveTrack = (index: number, direction: 'up' | 'down') => {
        const newTracks = [...tracks];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < tracks.length) {
            [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
            setTracks(newTracks);
        }
    };

    const handleCoverUpload = (trackId: string, file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setTracks(tracks.map(track =>
                    track.id === trackId
                        ? { ...track, coverFile: file, coverPreview: result }
                        : track
                ));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = (trackId: string, file: File) => {
        if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
            setTracks(tracks.map(track =>
                track.id === trackId
                    ? { ...track, audioFile: file, audioName: file.name }
                    : track
            ));
        }
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        const audioFiles = files.filter(f => f.type.startsWith('audio/') || f.type.startsWith('video/'));

        audioFiles.slice(0, MAX_TRACKS - tracks.length).forEach(file => {
            const newTrack = createEmptyTrack();
            newTrack.audioFile = file;
            newTrack.audioName = file.name;
            newTrack.title = file.name.replace(/\.[^/.]+$/, '');
            setTracks(prev => [...prev, newTrack]);
        });
    };

    const uploadTracks = async () => {
        if (tracks.length === 0) return;

        if (!user?._id) {
            Swal.fire({
                icon: 'error',
                title: 'No autenticado',
                text: 'Debes estar logueado para subir música',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#6366f1',
            });
            return;
        }

        const validTracks = tracks.filter(t => t.title && t.artist && t.audioFile);
        if (validTracks.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos incompletos',
                text: 'Por favor completa al menos título, artista y archivo de audio',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#6366f1',
            });
            return;
        }

        setIsUploading(true);
        const progress: Record<string, number> = {};
        const token = localStorage.getItem('token');
        const userId = user?._id;
        let uploadErrors = 0;

        const CLOUD_NAME = "ddigfgmko";
        const UPLOAD_PRESET = "music_unsigned";

        const uploadToCloudinary = async (file: File, resourceType: "auto" | "image" | "video" = "auto") => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Error al subir a Cloudinary");
            return data.secure_url as string;
        };

        for (let i = 0; i < validTracks.length; i += MAX_SIMULTANEOUS) {
            const batch = validTracks.slice(i, i + MAX_SIMULTANEOUS);

            await Promise.all(batch.map(async (track) => {
                progress[track.id] = 0;
                setUploadProgress({ ...progress });

                try {
                    let audioUrl = "";
                    let coverUrl = "";

                    if (track.audioFile) {
                        audioUrl = await uploadToCloudinary(track.audioFile, "video");
                        console.log(`Audio de "${track.title}" subido a Cloudinary:`, audioUrl);
                    } else {
                        console.warn(`Track "${track.title}" no tiene archivo de audio`);
                        return;
                    }

                    if (track.coverFile) {
                        coverUrl = await uploadToCloudinary(track.coverFile, "image");
                        console.log(`Cover de "${track.title}" subido a Cloudinary:`, coverUrl);
                    }

                    progress[track.id] = 70;
                    setUploadProgress({ ...progress });

                    console.log("Enviando metadata al backend:", {
                        title: track.title,
                        artist: track.artist,
                        album: track.album,
                        genre: track.genre,
                        soloist: track.soloist,
                        avance: track.avance,
                        userId,
                        audioUrl,
                        coverUrl
                    });

                    const response = await fetch(API_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: token ? `Bearer ${token}` : ""
                        },
                        body: JSON.stringify({
                            title: track.title,
                            artist: track.artist,
                            album: track.album || "",
                            genre: track.genre || "",
                            soloist: track.soloist,
                            avance: track.avance,
                            userId,
                            audioUrl,
                            coverUrl
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Error al guardar metadata: ${response.statusText}`);
                    }

                    progress[track.id] = 100;
                    setUploadProgress({ ...progress });

                } catch (error) {
                    console.error("❌ Error subiendo track:", error);
                    progress[track.id] = -1;
                    setUploadProgress({ ...progress });
                    uploadErrors++;
                }
            }));
        }

        setTimeout(() => {
            setIsUploading(false);
            setUploadProgress({});
            setTracks([]);

            if (uploadErrors === 0) {
                Swal.fire({
                    icon: "success",
                    title: "¡Éxito!",
                    text: `${validTracks.length} canción${validTracks.length !== 1 ? "es" : ""} subida${validTracks.length !== 1 ? "s" : ""} correctamente`,
                    timer: 2500,
                    showConfirmButton: false,
                    background: "#1a1a2e",
                    color: "#fff",
                }).then(() => location.reload());
            } else if (uploadErrors < validTracks.length) {
                Swal.fire({
                    icon: "warning",
                    title: "Subida parcial",
                    text: `Se subieron ${validTracks.length - uploadErrors} de ${validTracks.length} canciones`,
                    background: "#1a1a2e",
                    color: "#fff",
                    confirmButtonColor: "#6366f1",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo subir ninguna canción",
                    background: "#1a1a2e",
                    color: "#fff",
                    confirmButtonColor: "#6366f1",
                });
            }

            fetchSavedTracks();
        }, 1000);
    };

    return (
        <>
            <div className="min-h-screen animate-gradient-x relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-black/50 z-0"></div>
                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
                        <Image
                            src="/assets/cantando.jpg"
                            alt="Imagen de banda o CD"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="relative z-10 text-center px-6 md:px-12">
                            <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-6">
                                MusicUp
                            </h1>
                            <p className="text-lg md:text-2xl text-white drop-shadow-md mb-8">
                                ¿Tenés una banda o sos solista? ¡Subí tu CD y compartilo con el mundo!
                            </p>
                            <button
                                onClick={() => {
                                    if (user?._id) {
                                        router.push(`/crearcd?userId=${user._id}`);
                                    } else {
                                        Swal.fire({
                                            icon: 'warning',
                                            title: 'No autenticado',
                                            text: 'Debes estar logueado para crear un CD',
                                            background: '#1a1a2e',
                                            color: '#fff',
                                            confirmButtonColor: '#6366f1',
                                        });
                                    }
                                }}
                                className="px-8 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-fuchsia-500/50 hover:scale-105 transform"
                            >
                                Publicar CD
                            </button>
                        </div>
                    </div>

                    <MusicDown />

                    {tracks.length === 0 && (
                        <div
                            className={`glass-card p-12 mb-6 border-2 border-dashed transition-all ${dragActive ? 'border-pink-500 bg-pink-500/10' : 'border-white/20'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="text-center">
                                <Upload className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                                <h3 className="text-xl font-bold glow-text mb-2">
                                    Arrastra archivos aquí
                                </h3>
                                <p className="text-sm glow-secondary mb-4">
                                    o haz clic en el botón para seleccionar
                                </p>
                                <button
                                    onClick={addTrack}
                                    className="btn-glass btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Agregar Canción
                                </button>
                            </div>
                        </div>
                    )}

                    {tracks.length > 0 && (
                        <>
                            <div className="space-y-4 mb-6 min-h-[200px]">
                                {tracks.map((track, index) => (
                                    <div key={track.id} className="glass-card p-6 min-h-[300px]">
                                        <div className="flex gap-6">
                                            <div className="flex-shrink-0">
                                                <div className="cover-upload-box">
                                                    {track.coverPreview ? (
                                                        <Image
                                                            src={track.coverPreview}
                                                            alt="Cover"
                                                            width={140}
                                                            height={140}
                                                            className="cover-image"
                                                        />
                                                    ) : (
                                                        <div className="cover-placeholder">
                                                            <Image
                                                                src='/assets/zoonito.jpg'
                                                                alt="Cover"
                                                                width={140}
                                                                height={140}
                                                                className="cover-image"
                                                            />
                                                            <p className="text-xs mt-2">Portada</p>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleCoverUpload(track.id, file);
                                                        }}
                                                        className="cover-input"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="form-label">Título *</label>
                                                        <input
                                                            type="text"
                                                            value={track.title}
                                                            onChange={(e) => updateTrack(track.id, 'title', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Nombre de la canción"
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="form-label">Artista *</label>
                                                        <input
                                                            type="text"
                                                            value={track.artist}
                                                            onChange={(e) => updateTrack(track.id, 'artist', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Nombre del artista"
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="form-label">Álbum</label>
                                                        <input
                                                            type="text"
                                                            value={track.album}
                                                            onChange={(e) => updateTrack(track.id, 'album', e.target.value)}
                                                            className="form-input"
                                                            placeholder="Nombre del álbum"
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="form-label">Género</label>
                                                        <select
                                                            value={track.genre}
                                                            onChange={(e) => updateTrack(track.id, 'genre', e.target.value)}
                                                            className="form-input select-dark"
                                                            disabled={isUploading}
                                                        >
                                                            <option value="">Seleccionar género</option>
                                                            <option value="Rock">Rock</option>
                                                            <option value="efects">Efects Sound</option>
                                                            <option value="Pop">Pop</option>
                                                            <option value="Jazz">Jazz</option>
                                                            <option value="Classical">Clásica</option>
                                                            <option value="Electronic">Electrónica</option>
                                                            <option value="Hip-Hop">Hip-Hop</option>
                                                            <option value="Folkclore">Folkclore</option>
                                                            <option value="Reggae">Reggae</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="form-label">Archivo de Audio/Video *</label>
                                                    <div className="audio-upload-box">
                                                        {track.audioName ? (
                                                            <div className="flex items-center gap-3">
                                                                <Music className="w-5 h-5 text-pink-500" />
                                                                <span className="text-sm flex-1 truncate">{track.audioName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-white/50">Sin archivo</span>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="audio/*,video/*"
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleAudioUpload(track.id, file);
                                                            }}
                                                            className="audio-input"
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                </div>

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={track.soloist}
                                                        onChange={(e) => updateTrack(track.id, 'soloist', e.target.checked)}
                                                        className="checkbox-input"
                                                        disabled={isUploading}
                                                    />
                                                    <span className="text-sm glow-secondary">Es solista</span>
                                                </label>

                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={track.avance}
                                                        onChange={(e) => updateTrack(track.id, 'avance', e.target.checked)}
                                                        className="checkbox-input"
                                                        disabled={isUploading}
                                                    />
                                                    <span className="text-sm glow-secondary">Es avance</span>
                                                </label>

                                                {uploadProgress[track.id] !== undefined && (
                                                    <div className="progress-bar-container">
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{ width: `${uploadProgress[track.id]}%` }}
                                                        />
                                                        <span className="progress-text">
                                                            {uploadProgress[track.id] === -1 ? 'Error' : `${uploadProgress[track.id]}%`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => moveTrack(index, 'up')}
                                                    disabled={index === 0 || isUploading}
                                                    className="icon-btn"
                                                    title="Mover arriba"
                                                >
                                                    <MoveUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moveTrack(index, 'down')}
                                                    disabled={index === tracks.length - 1 || isUploading}
                                                    className="icon-btn"
                                                    title="Mover abajo"
                                                >
                                                    <MoveDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeTrack(track.id)}
                                                    disabled={isUploading}
                                                    className="icon-btn icon-btn-danger"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-6 flex flex-wrap gap-4 justify-between items-center">
                                <button
                                    onClick={addTrack}
                                    disabled={tracks.length >= MAX_TRACKS || isUploading}
                                    className="btn-glass btn-secondary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Agregar Otra Canción
                                </button>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setTracks([])}
                                        disabled={isUploading}
                                        className="btn-glass inline-flex items-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Limpiar Todo
                                    </button>
                                    <button
                                        onClick={uploadTracks}
                                        disabled={isUploading || tracks.length === 0}
                                        className="btn-glass btn-primary inline-flex items-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <span className="loading-spinner"></span>
                                                Subiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Subir {tracks.length} Canción{tracks.length !== 1 ? 'es' : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold glow-text">Biblioteca Musical</h2>
                            <button
                                onClick={fetchSavedTracks}
                                disabled={isLoading}
                                className="btn-glass inline-flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="loading-spinner mx-auto mb-4" style={{ width: '48px', height: '48px' }}></div>
                                <p className="glow-secondary">Cargando biblioteca...</p>
                            </div>
                        ) : savedTracks.length === 0 ? (
                            <div className="text-center py-12">
                                <Music className="w-16 h-16 mx-auto mb-4 text-white/20" />
                                <p className="glow-secondary text-lg">No hay canciones guardadas</p>
                                <p className="text-sm text-white/30 mt-2">Sube tu primera canción para comenzar</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {savedTracks.map((track) => (
                                    <div key={track._id} className="library-card">
                                        <div className="library-card-cover">
                                            {track.coverUrl ? (
                                                <Image 
                                                    src={track.coverUrl} 
                                                    alt={track.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="library-card-placeholder">
                                                    <Music className="w-12 h-12 text-white/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="library-card-content">
                                            <h3 className="library-card-title">{track.title}</h3>
                                            <p className="library-card-artist">{track.artist}</p>
                                            {track.album && (
                                                <p className="library-card-album">{track.album}</p>
                                            )}
                                            <div className="library-card-meta">
                                                {track.genre && (
                                                    <span className="library-card-badge">{track.genre}</span>
                                                )}
                                                {track.soloist && (
                                                    <span className="library-card-badge">Solista</span>
                                                )}
                                                {track.avance && (
                                                    <span className="library-card-badge">Avance</span>
                                                )}
                                            </div>
                                            <div className="library-card-stats">
                                                <span>❤️ {track.likes}</span>
                                                <span>⭐ {track.rating.toFixed(1)}</span>
                                            </div>
                                            <div className="library-card-actions">
                                                <button
                                                    onClick={() => editSavedTrack(track)}
                                                    className="library-card-edit"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteSavedTrack(track._id)}
                                                    className="library-card-delete"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style jsx>{`
        .library-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .library-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(255, 0, 221, 0.2);
          border-color: rgba(255, 0, 221, 0.3);
        }

        .library-card-cover {
          position: relative;
          width: 100%;
          padding-top: 100%;
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .library-card-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255, 0, 221, 0.1), rgba(0, 212, 255, 0.1));
        }

        .library-card-content {
          padding: 1rem;
        }

        .library-card-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .library-card-artist {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.25rem;
        }

        .library-card-album {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.5rem;
        }

        .library-card-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .library-card-badge {
          font-size: 0.625rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 0, 221, 0.2);
          border: 1px solid rgba(255, 0, 221, 0.3);
          border-radius: 0.25rem;
          color: #ff00dd;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .library-card-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.75rem;
        }

        .library-card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .library-card-edit {
          padding: 0.5rem 1rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 0.5rem;
          color: #6366f1;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .library-card-edit:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .library-card-delete {
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.5rem;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .library-card-delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .cover-upload-box {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 0.75rem;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .cover-upload-box:hover {
          border-color: rgba(255, 0, 221, 0.5);
          box-shadow: 0 0 20px rgba(255, 0, 221, 0.3);
        }

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .cover-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .select-dark {
          background-color: #1a1a2e;
          color: white;
        }

        .select-dark option {
          background-color: #1a1a2e;
          color: white;
        }

        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: #ff00dd;
          box-shadow: 0 0 0 2px rgba(255, 0, 221, 0.1);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .audio-upload-box {
          position: relative;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .audio-upload-box:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .audio-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-input {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
          accent-color: #ff00dd;
        }

        .progress-bar-container {
          position: relative;
          width: 100%;
          height: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #00d4ff, #ff00dd);
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
        }

        .icon-btn {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .icon-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }

        .icon-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .icon-btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
            </div>
        </>
    );
}



