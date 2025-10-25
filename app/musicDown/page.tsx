"use client";
import { useEffect, useState, useContext, useRef } from "react";
import { UserContext } from "../context/UserContext";
import Swal from "sweetalert2";

interface Rating {
    user: string;
    value: number;
}

interface Music {
    _id: string;
    idMusico: string;
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    soloist: boolean;
    audioUrl: string;
    coverUrl?: string;
    likes: number;
    rating: number;
    ratings: Rating[];
    createdAt: string;
}

export default function MusicDown() {
    const { user } = useContext(UserContext);
    const [musicList, setMusicList] = useState<Music[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Music>>({});
    const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
    const [previewCover, setPreviewCover] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;

        fetch(`https://backend-zoonito-6x8h.vercel.app/api/music?userId=${user._id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("📦 ========== DATOS COMPLETOS ==========");
                console.log("Total de canciones:", data.length);
                console.log("Primer objeto completo:", data[0]);
                console.log("========================================");

                // Ver CADA canción con su coverUrl
                data.forEach((track: Music, index: number) => {
                    console.log(`🎵 Canción ${index + 1}:`, {
                        id: track._id,
                        title: track.title,
                        artist: track.artist,
                        coverUrl: track.coverUrl,
                        audioUrl: track.audioUrl,
                        idMusico: track.idMusico
                    });
                });

                // También puedes usar esto para ver todo en una tabla
                console.table(data.map((track: Music) => ({
                    Título: track.title,
                    Artista: track.artist,
                    CoverUrl: track.coverUrl ? '✅ Tiene' : '❌ No tiene',
                    AudioUrl: track.audioUrl ? '✅ Tiene' : '❌ No tiene'
                })));

                if (Array.isArray(data)) {
                    setMusicList(data);
                } else {
                    setMusicList([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("❌ Error fetching music:", err);
                setLoading(false);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo cargar la música",
                    background: "#1a1a2e",
                    color: "#fff",
                    confirmButtonColor: "#6366f1",
                });
            });
    }, [user]);

    // 🔹 Eliminar
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            background: "#1a1a2e",
            color: "#fff",
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setMusicList((prev) => prev.filter((m) => m._id !== id));
                Swal.fire({
                    icon: "success",
                    title: "¡Eliminado!",
                    text: "La música se eliminó correctamente",
                    timer: 2000,
                    showConfirmButton: false,
                    background: "#1a1a2e",
                    color: "#fff",
                });
            }
        } catch (err) {
            console.error("Error eliminando música:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar la música",
                background: "#1a1a2e",
                color: "#fff",
                confirmButtonColor: "#6366f1",
            });
        }
    };

    // 🔹 Editar
    const handleEdit = (music: Music) => {
        setEditing(music._id);
        setFormData({ ...music });
        setNewCoverFile(null);
        setPreviewCover(null);
    };

    // 🔹 Editar
    const handleAddLyrics = (id: string) => {
        window.location.href = `/liriceditor/${id}`;
    };


    // 🔹 Manejar cambio de imagen
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewCover(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 🔹 Actualizar con FormData
    const handleUpdate = async (id: string, track: Music) => {
        try {
            setUploading(true);

            const CLOUD_NAME = "ddigfgmko";
            const UPLOAD_PRESET = "music_unsigned";

            console.log('🔄 Iniciando actualización para ID:', id);
            console.log('📦 Datos del formulario:', formData);
            console.log('📸 Nueva portada:', newCoverFile);

            let coverUrl = formData.coverUrl; // URL actual

            // ✅ Si hay archivo nuevo, subirlo a Cloudinary
            if (newCoverFile) {
                console.log('📤 Subiendo portada a Cloudinary...');
                const cloudinaryFormData = new FormData();
                cloudinaryFormData.append("file", newCoverFile);
                cloudinaryFormData.append("upload_preset", UPLOAD_PRESET);

                const cloudinaryRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                    {
                        method: "POST",
                        body: cloudinaryFormData,
                    }
                );

                if (!cloudinaryRes.ok) {
                    const errorData = await cloudinaryRes.json();
                    console.error('❌ Error Cloudinary:', errorData);
                    throw new Error(`Error en Cloudinary: ${errorData.error?.message || 'Desconocido'}`);
                }

                const cloudinaryData = await cloudinaryRes.json();
                coverUrl = cloudinaryData.secure_url;
                console.log('✅ Portada subida a Cloudinary:', coverUrl);
            }

            // ✅ Preparar payload JSON para el backend
            const payload = {
                title: formData.title,
                artist: formData.artist,
                album: formData.album || "",
                genre: formData.genre || "",
                soloist: formData.soloist || false,
                ...(coverUrl && { coverUrl })
            };

            console.log('📦 Payload a enviar:', JSON.stringify(payload, null, 2));

            // ✅ Enviar al backend como JSON
            const res = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${id}`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log('📨 Status respuesta:', res.status, res.statusText);
            const responseText = await res.text();
            console.log('📨 Response (texto):', responseText);

            if (res.ok) {
                let updated: Music | null = null;
                try {
                    updated = JSON.parse(responseText);
                    console.log('✅ Respuesta parseada:', updated);
                } catch {
                    console.warn('⚠️ Respuesta no es JSON válido, usando datos locales');
                }

                // ✅ Crear versión local actualizada
                const updatedMusic: Music = {
                    ...track,
                    title: formData.title || track.title,
                    artist: formData.artist || track.artist,
                    album: formData.album || track.album || "",
                    genre: formData.genre || track.genre || "",
                    soloist: formData.soloist ?? track.soloist,
                    coverUrl: newCoverFile ? coverUrl! : (updated?.coverUrl || track.coverUrl),
                    _id: track._id,
                    idMusico: track.idMusico,
                    audioUrl: track.audioUrl,
                    likes: track.likes,
                    rating: track.rating,
                    ratings: track.ratings,
                    createdAt: track.createdAt,
                };

                // ✅ Refrescar la lista sin perder cambios visuales
                setMusicList((prev) =>
                    prev.map((m) => (m._id === id ? updatedMusic : m))
                );

                setEditing(null);
                setNewCoverFile(null);
                setPreviewCover(null);

                Swal.fire({
                    icon: "success",
                    title: "¡Actualizado!",
                    text: "La música se actualizó correctamente",
                    timer: 2000,
                    showConfirmButton: false,
                    background: "#1a1a2e",
                    color: "#fff",
                });
            } else {
                let errorMessage = "Error actualizando música";
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('❌ Error en handleUpdate:', err);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: err instanceof Error ? err.message : "No se pudo actualizar la música",
                background: "#1a1a2e",
                color: "#fff",
                confirmButtonColor: "#6366f1",
            });
        } finally {
            setUploading(false);
        }
    };


    const handleCancelEdit = () => {
        setEditing(null);
        setNewCoverFile(null);
        setPreviewCover(null);
        setFormData({});
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl">🎵</span>
                    </div>
                </div>
                <p className="mt-6 text-xl glow-text font-semibold animate-pulse">
                    Cargando música...
                </p>
                <p className="mt-2 text-sm text-gray-400">
                    Obteniendo tu biblioteca musical
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl glow-text font-bold mb-6">Biblioteca Musical</h1>
            {user && (
                <p className="glow-secondary mb-6">
                    Bienvenido, <span className="glow-text">{user.name}</span>
                </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {musicList.map((track) => (
                    <div
                        key={track._id}
                        className="glass-card p-4 flex flex-col gap-3 relative"
                    >
                        {editing === track._id ? (
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <img
                                        src={previewCover || track.coverUrl || "/placeholder.png"}
                                        alt="Preview"
                                        className="w-full h-40 object-cover rounded-lg cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    />
                                    <div
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <span className="text-white font-semibold">
                                            📸 Cambiar portada
                                        </span>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn-glass bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                    disabled={uploading}
                                >
                                    {newCoverFile ? "✅ Imagen seleccionada" : "📁 Seleccionar nueva portada"}
                                </button>

                                <input
                                    type="text"
                                    value={formData.title || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="form-input p-2 rounded bg-[#1a1a2e] text-white"
                                    placeholder="Título"
                                    disabled={uploading}
                                />
                                <input
                                    type="text"
                                    value={formData.artist || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, artist: e.target.value })
                                    }
                                    className="form-input p-2 rounded bg-[#1a1a2e] text-white"
                                    placeholder="Artista"
                                    disabled={uploading}
                                />
                                <input
                                    type="text"
                                    value={formData.album || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, album: e.target.value })
                                    }
                                    className="form-input p-2 rounded bg-[#1a1a2e] text-white"
                                    placeholder="Álbum"
                                    disabled={uploading}
                                />
                                <input
                                    type="text"
                                    value={formData.genre || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, genre: e.target.value })
                                    }
                                    className="form-input p-2 rounded bg-[#1a1a2e] text-white"
                                    placeholder="Género"
                                    disabled={uploading}
                                />
                                <label className="flex items-center gap-2 text-white">
                                    <input
                                        type="checkbox"
                                        checked={formData.soloist || false}
                                        onChange={(e) =>
                                            setFormData({ ...formData, soloist: e.target.checked })
                                        }
                                        disabled={uploading}
                                    />
                                    Solista
                                </label>

                                <button
                                    onClick={() => handleUpdate(track._id, track)}
                                    className="btn-glass btn-primary flex items-center justify-center gap-2"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Subiendo...</span>
                                        </>
                                    ) : (
                                        <>💾 Guardar</>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="btn-glass btn-danger"
                                    disabled={uploading}
                                >
                                    ❌ Cancelar
                                </button>
                            </div>
                        ) : (
                            <>

                                <img
                                    src={track.coverUrl}
                                    alt={track.title}
                                    className="w-full h-40 object-cover rounded-lg"
                                />

                                <div className="space-y-3">
                                    <h2 className="font-bold text-2xl glow-text tracking-wide">{track.title}</h2>
                                    <p className="text-base text-gray-300 font-medium">👤 {track.artist}</p>
                                    {track.album && <p className="text-sm text-gray-400">💿 {track.album}</p>}

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {track.genre && (
                                            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                                                🎶 {track.genre}
                                            </span>
                                        )}
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                                            {track.soloist ? "🎤 Solista" : "👥 Banda"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm border-t border-white/10 pt-3">
                                        <span className="text-pink-400">❤️ {track.likes}</span>
                                        <span className="text-yellow-400">
                                            ⭐ {track.rating.toFixed(1)} <span className="text-gray-500">({track.ratings.length})</span>
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        📅 {new Date(track.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <audio controls className="w-full mt-2">
                                    <source src={track.audioUrl} />
                                    Tu navegador no soporta audio.
                                </audio>

                                <div className="flex justify-between mt-3">
                                    <button
                                        onClick={() => handleEdit(track)}
                                        className="btn-glass btn-secondary"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(track._id)}
                                        className="btn-glass btn-danger"
                                    >
                                        🗑️ Eliminar
                                    </button>
                                    <button
                                        onClick={() => handleAddLyrics(track._id)}
                                        className="btn-glass btn-primary flex-1"
                                    >
                                        🎵 Editar letras
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

}
