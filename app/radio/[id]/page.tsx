'use client';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import { Play,RadioTower, Pause, Volume2, VolumeX, Users, Send, Trash2, GripVertical, Shield, Music, Share2, Settings, User, Check, X, Crown, Headphones, Mic, Upload, Edit2, Heart, SkipForward, Radio, Zap, Plus, MicOff, Ban } from 'lucide-react';
import { UserContext } from "../../context/UserContext";
import { useReproductor } from '../../context/ReproductorContext';
import { Cancion } from "../../components/Reproductor";
import Swal from 'sweetalert2';
import { useRadioStream } from '../../hooks/useRadioStream';
import  MusicaPlayer from "../../MusicaPlayer/page";


// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

// En tu archivo de radio, agrega este import

// Modifica la interfaz Track para incluir el flag de memoria
interface Track {
    _id: string;
    radioId: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
    order: number;
    isInMemory?: boolean; // Nueva propiedad
    file?: File; // Nueva propiedad para archivos en memoria
}

// En el componente RadioSystem, reemplaza el componente Playlist existente por:



interface User {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
    isPremium: boolean;
    token?: string;
}

interface RadioStation {
    _id: string;
    idMusico: string;
    name: string;
    description: string;
    logo?: string;
    streamUrl: string;
    icecastMount: string;
    isLive: boolean;
    isAutomated: boolean;
    autoPlaylist: string[];
    listeners: number;
    likes: number;
    guestCode?: string;
    allowGuests: boolean;
}

interface Track {
    _id: string;
    radioId: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
    order: number;
}

interface ChatMessage {
    _id: string;
    radioId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
}

interface TrackMetadata {
    title: string;
    artist: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-zoonito-6x8h.vercel.app/api';

const api = {
    async getRadio(radioId: string): Promise<RadioStation | null> {
        try {
            const res = await fetch(`${API_URL}/radio/${radioId}`);
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error fetching radio:', error);
            return null;
        }
    },

    async updateRadio(radioId: string, data: FormData, token: string): Promise<RadioStation | null> {
        try {
            if (!token?.includes('.')) {
                console.error("Token inválido");
                return null;
            }

            const res = await fetch(`${API_URL}/radio/${radioId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`
                },
                body: data
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Error en la respuesta del backend:', res.status, errorText);
                return null;
            }

            return res.json();
        } catch (error) {
            console.error('Error updating radio:', error);
            return null;
        }
    },

    async deleteRadio(radioId: string, token: string): Promise<boolean> {
        try {
            if (!token?.includes('.')) return false;
            const res = await fetch(`${API_URL}/radio/${radioId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            return res.ok;
        } catch (error) {
            console.error('Error deleting radio:', error);
            return false;
        }
    },

    async toggleLive(radioId: string, token: string, isLive: boolean): Promise<RadioStation | null> {
        try {
            if (!token?.includes('.')) return null;

            const res = await fetch(`${API_URL}/radio/${radioId}/live`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isLive })
            });

            if (res.ok) {
                return res.json();
            }

            console.log('Endpoint /live no disponible, usando PUT');
            const formData = new FormData();
            formData.append('isLive', isLive.toString());

            const resPut = await fetch(`${API_URL}/radio/${radioId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`
                },
                body: formData
            });

            if (!resPut.ok) {
                console.error('Error en PUT:', resPut.status);
                return null;
            }

            return resPut.json();
        } catch (error) {
            console.error('Error toggling live:', error);
            return null;
        }
    },

    async getTracks(radioId: string): Promise<Track[]> {
        try {
            const res = await fetch(`${API_URL}/radio/${radioId}/tracks`);
            if (!res.ok) return [];
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('Error fetching tracks:', error);
            return [];
        }
    },

    async uploadTrack(radioId: string, file: File, metadata: TrackMetadata, token: string): Promise<Track | null> {
        try {
            if (!token?.includes('.')) return null;
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', metadata.title);
            formData.append('artist', metadata.artist);

            const res = await fetch(`${API_URL}/radio/${radioId}/tracks`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.trim()}` },
                body: formData
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error uploading track:', error);
            return null;
        }
    },

    async deleteTrack(radioId: string, trackId: string, token: string): Promise<boolean> {
        try {
            if (!token?.includes('.')) return false;
            const res = await fetch(`${API_URL}/radio/${radioId}/tracks/${trackId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            return res.ok;
        } catch (error) {
            console.error('Error deleting track:', error);
            return false;
        }
    },

    async getMessages(radioId: string): Promise<ChatMessage[]> {
        try {
            const res = await fetch(`${API_URL}/radio/${radioId}/chat`);
            if (!res.ok) return [];
            return res.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    async sendMessage(radioId: string, text: string, token: string): Promise<ChatMessage | null> {
        try {
            if (!token?.includes('.')) return null;
            const res = await fetch(`${API_URL}/radio/${radioId}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    },

    async deleteMessage(radioId: string, messageId: string, token: string): Promise<boolean> {
        try {
            if (!token?.includes('.')) return false;
            const res = await fetch(`${API_URL}/radio/${radioId}/chat/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            return res.ok;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    },

    async toggleLike(radioId: string, token: string): Promise<{ liked: boolean } | null> {
        try {
            if (!token?.includes('.')) return null;
            const res = await fetch(`${API_URL}/radio/${radioId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error toggling like:', error);
            return null;
        }
    },

    async updateUser(data: FormData, token: string): Promise<User | null> {
        try {
            if (!token?.includes('.')) return null;
            const res = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token.trim()}` },
                body: data
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    },

    async registerListener(radioId: string, token: string): Promise<{ listeners: number } | null> {
        try {
            if (!token?.includes('.')) return null;
            const res = await fetch(`${API_URL}/radio/${radioId}/listener/register`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error registering listener:', error);
            return null;
        }
    },

    async unregisterListener(radioId: string, token: string): Promise<boolean> {
        try {
            if (!token?.includes('.')) return false;
            const res = await fetch(`${API_URL}/radio/${radioId}/listener/unregister`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            return res.ok;
        } catch (error) {
            console.error('Error unregistering listener:', error);
            return false;
        }
    },

    async generateGuestCode(radioId: string, token: string): Promise<RadioStation | null> {
        try {
            if (!token?.includes('.')) return null;
            const res = await fetch(`${API_URL}/radio/${radioId}/guest-code`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token.trim()}` }
            });
            if (!res.ok) return null;
            return res.json();
        } catch (error) {
            console.error('Error generating guest code:', error);
            return null;
        }
    }
};

// ============================================================================
// COMPONENTE: MODAL DE PERFIL
// ============================================================================

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onUpdate: (data: FormData) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('name', name);
        if (avatar) formData.append('avatar', avatar);

        await onUpdate(formData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User size={24} />
                        Mi Perfil
                    </h2>
                    <button onClick={onClose} className="text-white/60 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700">
                                <Upload size={16} className="text-white" />
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full bg-white/5 text-white/50 rounded-lg px-4 py-2 border border-white/10"
                        />
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Nombre de usuario</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                        />
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            {user.isPremium ? (
                                <Crown className="text-yellow-400" size={20} />
                            ) : (
                                <Headphones className="text-white/60" size={20} />
                            )}
                            <span className="text-white font-semibold">
                                {user.isPremium ? 'Plan Premium' : 'Plan Gratuito'}
                            </span>
                        </div>
                        <p className="text-white/60 text-sm whitespace-pre-line">
                            {user.isPremium
                                ? '✓ Transmisión de radio ilimitada\n✓ Sin anuncios\n✓ Automatización RadioBoss\n✓ Invitados en vivo'
                                : '✓ Escuchar radios\n✗ No puedes transmitir tu propia radio'}
                        </p>
                        {!user.isPremium && (
                            <button className="mt-3 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 rounded-lg transition-all">
                                Actualizar a Premium
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || name.trim() === ''}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Guardando...' : (
                            <>
                                <Check size={18} />
                                Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: MODAL EDITAR RADIO
// ============================================================================

interface EditRadioModalProps {
    radio: RadioStation;
    onClose: () => void;
    onUpdate: (data: FormData) => Promise<void>;
    onDelete: () => Promise<void>;
}

const EditRadioModal: React.FC<EditRadioModalProps> = ({ radio, onClose, onUpdate, onDelete }) => {
    const [name, setName] = useState(radio.name);
    const [description, setDescription] = useState(radio.description);
    const [logo, setLogo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(radio.logo || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        if (logo) {
            try {
                const cloudinaryFormData = new FormData();
                cloudinaryFormData.append('file', logo);
                cloudinaryFormData.append('upload_preset', 'zoonity_radios');

                const cloudinaryRes = await fetch(
                    'https://api.cloudinary.com/v1_1/dplncudbq/image/upload',
                    {
                        method: 'POST',
                        body: cloudinaryFormData
                    }
                );

                if (cloudinaryRes.ok) {
                    const data = await cloudinaryRes.json();
                    formData.append('logo', data.secure_url);
                } else {
                    throw new Error('Error al subir imagen a Cloudinary');
                }
            } catch (error) {
                console.error('Error subiendo a Cloudinary:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al subir imagen',
                    text: 'No se pudo subir la imagen. Intenta de nuevo.',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#ef4444',
                });
                setIsSaving(false);
                return;
            }
        }

        await onUpdate(formData);
        setIsSaving(false);
        onClose();
    };

    const handleDelete = async () => {
        await onDelete();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Edit2 size={24} />
                        Editar Radio
                    </h2>
                    <button onClick={onClose} className="text-white/60 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Radio size={40} className="text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700">
                                <Upload size={16} className="text-white" />
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Nombre de la radio</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                        />
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-white/10 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || name.trim() === ''}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center p-6">
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <p className="text-white mb-4">¿Eliminar esta radio permanentemente?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: MODAL COMPARTIR
// ============================================================================

interface ShareModalProps {
    radio: RadioStation;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ radio, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${window.location.origin}/radio/${radio._id}`;
    const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="400"></iframe>`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        Swal.fire({
            icon: 'success',
            title: '¡Copiado!',
            text: 'El texto se copió al portapapeles',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#8b5cf6',
            timer: 1500,
            showConfirmButton: false
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full border border-purple-500/30 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Share2 size={24} />
                        Compartir Radio
                    </h2>
                    <button onClick={onClose} className="text-white/60 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Link directo</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm"
                            />
                            <button
                                onClick={() => handleCopy(shareUrl)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={18} /> : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Stream URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={radio.streamUrl}
                                readOnly
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm"
                            />
                            <button
                                onClick={() => handleCopy(radio.streamUrl)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-white/80 text-sm mb-2 block">Código embed</label>
                        <div className="flex gap-2">
                            <textarea
                                value={embedCode}
                                readOnly
                                rows={3}
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm font-mono resize-none"
                            />
                            <button
                                onClick={() => handleCopy(embedCode)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: REPRODUCTOR PRINCIPAL CON CONTROL DE MICRÓFONO
// ============================================================================

interface PlayerProps {
    radio: RadioStation;
    currentTrack: Track | null;
    isPlaying: boolean;
    isMicMuted: boolean;
    micVolume: number;
    musicVolume: number;
    onPlayPause: () => void;
    onToggleMic: () => void;
    onMicVolumeChange: (volume: number) => void;
    onMusicVolumeChange: (volume: number) => void;
    onShare: () => void;
    onEdit: () => void;
    onToggleLike: () => void;
    onToggleLive: () => void;
    hasLiked: boolean;
    isOwner: boolean;
    canTransmit: boolean;
}

const Player: React.FC<PlayerProps> = ({
    radio,
    currentTrack,
    isPlaying,
    isMicMuted,
    micVolume,
    musicVolume,
    onPlayPause,
    onToggleMic,
    onMicVolumeChange,
    onMusicVolumeChange,
    onShare,
    onEdit,
    onToggleLike,
    onToggleLive,
    hasLiked,
    isOwner,
    canTransmit
}) => {
    const {
        isLoadingStream,
        streamError,
        listenerCount
    } = useRadioStream({
        sessionId: radio._id,
        isOwner,
        isPlaying
    });

    const [showVolumeControls, setShowVolumeControls] = useState(false);

    return (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-xl p-4 md:p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={onPlayPause}
                            disabled={!radio.isLive || isLoadingStream}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {isLoadingStream ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
                            ) : (
                                 <div className="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center md:w-10 md:h-10">
                                <Play size={24} className="text-white" />
                            </div>
                            )}
                        </button>

                        {/* Botón de mutear micrófono (solo para el dueño cuando está transmitiendo) */}
                        {isOwner && canTransmit && radio.isLive && (
                            <button
                                onClick={onToggleMic}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${isMicMuted
                                        ? 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500'
                                        : 'bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500'
                                    }`}
                            >
                                {isMicMuted ? (
                                    <MicOff className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                                ) : (
                                    <Mic className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                                )}
                            </button>
                        )}

                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                            {radio.logo ? (
                                <img src='../../assets/zoonito.jpg' alt={radio.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                                    <Radio size={24} className="text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {radio.isLive ? (
                                <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 animate-pulse">
                                    <Mic size={12} />
                                    EN VIVO
                                </span>
                            ) : (
                                <span className="bg-gray-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                                    <Radio size={12} />
                                    OFF LINE
                                </span>
                            )}
                            {isOwner && isPlaying && radio.isLive && (
                                <>
                                    <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 animate-pulse">
                                        <Mic size={12} />
                                        TRANSMITIENDO
                                    </span>
                                    {isMicMuted && (
                                        <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                                            <MicOff size={12} />
                                            MIC MUTEADO
                                        </span>
                                    )}
                                </>
                            )}
                            {!isOwner && isPlaying && !streamError && (
                                <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                                    <Volume2 size={12} />
                                    ESCUCHANDO
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">{radio.name}</h3>
                        {currentTrack ? (
                            <p className="text-purple-200 text-sm md:text-base truncate">
                                {currentTrack.title} - {currentTrack.artist}
                            </p>
                        ) : (
                            <p className="text-white/60 text-sm md:text-base">
                                {radio.description || (radio.isLive ? 'Transmitiendo en vivo' : 'Radio fuera de línea')}
                            </p>
                        )}
                        {streamError && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <X size={12} />
                                {streamError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                        <button
                            onClick={onToggleLike}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${hasLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/80 hover:text-white'
                                }`}
                        >
                            <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                            <span className="text-sm">{radio.likes}</span>
                        </button>

                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-white/80">
                            <Users size={18} />
                            <span className="text-sm">{listenerCount}</span>
                        </div>

                        {(isOwner && canTransmit) && (
                            <button
                                onClick={onShare}
                                className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-lg hover:bg-white/20"
                            >
                                <Share2 size={20} />
                            </button>
                        )}

                        {isOwner && (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                >
                                    <Settings size={20} />
                                </button>
                                {canTransmit && (
                                    <button
                                        onClick={onToggleLive}
                                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${radio.isLive
                                                ? 'bg-red-500/20 text-red-300 border-2 border-red-500/50 animate-pulse'
                                                : 'bg-green-500/20 text-green-300 border-2 border-green-500/50'
                                            }`}
                                    >
                                        <Mic size={16} className="inline mr-1" />
                                        {radio.isLive ? 'Detener' : 'Iniciar'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Controles de volumen para el dueño */}
                {isOwner && canTransmit && radio.isLive && (
                    <div className="bg-white/5 border border-purple-500/30 rounded-lg p-4">
                        <button
                            onClick={() => setShowVolumeControls(!showVolumeControls)}
                            className="w-full flex items-center justify-between text-white mb-3"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <Volume2 size={18} />
                                Controles de Volumen
                            </span>
                            <span className="text-xs text-white/60">
                                {showVolumeControls ? '▼' : '▶'}
                            </span>
                        </button>

                        {showVolumeControls && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-white/80 text-sm flex items-center gap-2">
                                            <Mic size={16} />
                                            Volumen del Micrófono
                                        </label>
                                        <span className="text-purple-300 text-sm font-semibold">
                                            {Math.round(micVolume * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={micVolume}
                                        onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        style={{
                                            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${micVolume * 100}%, rgba(255,255,255,0.1) ${micVolume * 100}%, rgba(255,255,255,0.1) 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-1">
                                        <span>Silencio</span>
                                        <span>Máximo</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-white/80 text-sm flex items-center gap-2">
                                            <Music size={16} />
                                            Volumen de la Música
                                        </label>
                                        <span className="text-blue-300 text-sm font-semibold">
                                            {Math.round(musicVolume * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={musicVolume}
                                        onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        style={{
                                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${musicVolume * 100}%, rgba(255,255,255,0.1) ${musicVolume * 100}%, rgba(255,255,255,0.1) 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-1">
                                        <span>Silencio</span>
                                        <span>Máximo</span>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                    <p className="text-blue-300 text-xs">
                                        💡 <strong>Tip:</strong> Baja la música al 30-40% cuando hables para que tu voz se escuche clara (efecto- bajo cortina).
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            onMicVolumeChange(1);
                                            onMusicVolumeChange(0.3);
                                        }}
                                        className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-2 px-3 rounded-lg text-xs transition-colors border border-purple-500/30"
                                    >
                                        🎤 Modo Locutor
                                        <span className="block text-[10px] text-white/40">Mic 100% • Música 30%</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onMicVolumeChange(0.5);
                                            onMusicVolumeChange(1);
                                        }}
                                        className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-2 px-3 rounded-lg text-xs transition-colors border border-blue-500/30"
                                    >
                                        🎵 Modo Musical
                                        <span className="block text-[10px] text-white/40">Mic 50% • Música 100%</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isOwner && isPlaying && radio.isLive && (
                    <div className={`border rounded-lg p-3 flex items-center gap-2 ${isMicMuted ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <p className={`text-sm ${isMicMuted ? 'text-red-300' : 'text-green-300'}`}>
                            {isMicMuted
                                ? '🔇 Tu micrófono está silenciado. Los oyentes no te escuchan.'
                                : `🎤 Tu micrófono está transmitiendo en vivo a ${listenerCount} oyente${listenerCount !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                )}

                {!canTransmit && !isOwner && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                        <Shield className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-yellow-200 text-sm">
                            Estás en modo oyente. <button className="underline font-semibold">Actualiza a Premium</button> para transmitir tu propia radio.
                        </p>
                    </div>
                )}

                {!radio.isLive && (
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 flex items-center gap-2">
                        <Radio className="text-gray-400" size={18} />
                        <p className="text-gray-300 text-sm">
                            {isOwner && canTransmit
                                ? 'Haz clic en "Iniciar" para comenzar a transmitir en vivo con tu micrófono'
                                : 'Esta radio está fuera de línea en este momento'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: ITEM DE PLAYLIST
// ============================================================================

interface PlaylistItemProps {
    track: Track;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onDelete: () => void;
    canEdit: boolean;
    isOwner: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
    track,
    isPlaying,
    onPlay,
    onPause,
    onDelete,
    canEdit,
    isOwner
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(track.duration || 0);
    const [isLoadingDuration, setIsLoadingDuration] = useState(track.duration === 0);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-zoonito-6x8h.vercel.app/api';
    const audioUrl = track.url.startsWith('http')
        ? track.url
        : `${API_URL.replace('/api', '')}${track.url}`;

    useEffect(() => {
        if (!isOwner) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(error => {
                console.error('Error al reproducir:', error);
            });
        } else if (!isPlaying && audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying, isOwner]);

    const formatDuration = (seconds: number): string => {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current && isFinite(audioRef.current.duration)) {
            const audioDuration = audioRef.current.duration;
            setDuration(audioDuration);
            setIsLoadingDuration(false);
        }
    };

    const handleLoadedData = () => {
        if (audioRef.current && duration === 0 && isFinite(audioRef.current.duration)) {
            const audioDuration = audioRef.current.duration;
            setDuration(audioDuration);
            setIsLoadingDuration(false);
        }
    };

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error('Error al cargar el audio:', e);
        setIsLoadingDuration(false);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !progressBarRef.current || duration === 0 || !isOwner) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`group flex flex-col gap-2 p-3 md:p-4 rounded-lg transition-all ${isPlaying
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                }`}
        >
            {isOwner && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                    onEnded={onPause}
                    crossOrigin="anonymous"
                    preload="metadata"
                />
            )}

            <div className="flex items-center gap-3">
                {isOwner ? (
                    <button
                        onClick={isPlaying ? onPause : onPlay}
                        className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-all flex-shrink-0"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 text-white" />
                        ) : (
                            <div className="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center md:w-10 md:h-10">
                                <Play size={24} className="text-white" />
                            </div>
                        )}
                    </button>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center flex-shrink-0">
                        {isPlaying ? (
                            <Volume2 className="w-5 h-5 text-white animate-pulse" />
                        ) : (
                            <Music className="w-5 h-5 text-white/60" />
                        )}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate text-sm md:text-base">
                        {track.title}
                    </h4>
                    <p className="text-white/60 text-xs md:text-sm truncate">
                        {track.artist}
                    </p>
                </div>

                {isOwner && (
                    <div className="text-white/60 text-xs md:text-sm flex-shrink-0">
                        {isLoadingDuration ? (
                            <span className="animate-pulse">Cargando...</span>
                        ) : (
                            <>
                                {formatDuration(currentTime)} / {formatDuration(duration)}
                            </>
                        )}
                    </div>
                )}

                {canEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {isOwner && (
                <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="w-full h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
                >
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

// ============================================================================
// COMPONENTE: PLAYLIST
// ============================================================================

interface PlaylistProps {
    radioId: string;
    radio: RadioStation | null;
    tracks: Track[];
    currentTrack: Track | null;
    onPlayTrack: (track: Track) => void;
    onDeleteTrack: (trackId: string) => void;
    onUploadTrack: (file: File, metadata: TrackMetadata) => Promise<void>;
    canEdit: boolean;
    isOwner: boolean;
}

const Playlist: React.FC<PlaylistProps> = ({
    radioId,
    radio,
    tracks,
    currentTrack,
    onPlayTrack,
    onDeleteTrack,
    onUploadTrack,
    canEdit,
    isOwner
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { agregarCancion } = useReproductor();

    const handlePlay = (track: Track) => {
        if (playingTrackId && playingTrackId !== track._id) {
            setPlayingTrackId(null);
        }

        setTimeout(() => {
            setPlayingTrackId(track._id);
        }, 50);
    };

    const handlePause = (trackId: string) => {
        if (playingTrackId === trackId) {
            setPlayingTrackId(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            setUploadFile(file);
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
            setShowUploadForm(true);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Archivo inválido',
                text: 'Por favor selecciona un archivo de audio',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !title || !artist) return;

        setIsUploading(true);
        try {
            await onUploadTrack(uploadFile, { title, artist });
            setUploadFile(null);
            setTitle('');
            setArtist('');
            setShowUploadForm(false);

            Swal.fire({
                icon: 'success',
                title: '¡Canción subida!',
                text: `${title} se agregó a la playlist`,
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al subir',
                text: 'No se pudo subir la canción. Intenta de nuevo.',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
        }
        setIsUploading(false);
    };

    const agregarTodas = () => {
        if (tracks.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Playlist vacía',
                text: 'No hay canciones para agregar',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
            });
            return;
        }

        let agregadas = 0;
        tracks.forEach(track => {
            const nuevaCancion: Cancion = {
                id: track._id,
                titulo: track.title,
                artista: track.artist,
                url: track.url,
                cover: radio?.logo || './assets/zoonito.jpg',
            };
            agregarCancion(nuevaCancion);
            agregadas++;
        });

        Swal.fire({
            icon: 'success',
            title: '¡Playlist agregada!',
            text: `${agregadas} canciones agregadas al reproductor global`,
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#8b5cf6',
            timer: 2000,
            showConfirmButton: false
        });
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Music size={24} />
                    Playlist ({tracks.length})
                </h2>
                <div className="flex gap-2">
                    {tracks.length > 0 && canEdit && (
                        <button
                            onClick={agregarTodas}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Agregar Todas</span>
                            <span className="sm:hidden">Todas</span>
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <Upload size={18} />
                            <span className="hidden md:inline">Subir Audio</span>
                            <span className="md:hidden">+</span>
                        </button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {showUploadForm && (
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-purple-500/30">
                    <h3 className="text-white font-semibold mb-3">Subir nueva pista</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Título"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Artista"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowUploadForm(false)}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !title || !artist}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white py-2 rounded-lg text-sm"
                            >
                                {isUploading ? 'Subiendo...' : 'Subir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-[400px] md:max-h-96 overflow-y-auto">
                {tracks.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                        <Music size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No hay pistas en la playlist</p>
                        {canEdit && <p className="text-sm mt-2">Sube tu primera pista para comenzar</p>}
                    </div>
                ) : (
                    tracks.map((track) => (
                        <PlaylistItem
                            key={track._id}
                            track={track}
                            isPlaying={playingTrackId === track._id}
                            onPlay={() => handlePlay(track)}
                            onPause={() => handlePause(track._id)}
                            onDelete={() => onDeleteTrack(track._id)}
                            canEdit={canEdit}
                            isOwner={isOwner}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: CHAT CON MODERACIÓN
// ============================================================================

interface ChatProps {
    radioId: string;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onDeleteMessage: (messageId: string) => void;
    isFrozen: boolean;
    canModerate: boolean;
    onToggleFreeze: () => void;
    listeners: number;
    currentUserId?: string;
}

const Chat: React.FC<ChatProps> = ({
    radioId,
    messages,
    onSendMessage,
    onDeleteMessage,
    isFrozen,
    canModerate,
    onToggleFreeze,
    listeners,
    currentUserId
}) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (inputValue.trim() && !isFrozen) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleDeleteMessage = (messageId: string) => {
        Swal.fire({
            icon: 'question',
            title: '¿Eliminar mensaje?',
            text: 'Esta acción no se puede deshacer',
            background: '#1a1a2e',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                onDeleteMessage(messageId);
            }
        });
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Users size={24} />
                    <span className="hidden md:inline">Chat en Vivo</span>
                    <span className="md:hidden">Chat</span>
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-white/60 text-xs md:text-sm">
                        {listeners > 0 ? `${listeners} oyentes` : 'Sin oyentes'}
                    </span>
                    {canModerate && (
                        <button
                            onClick={onToggleFreeze}
                            className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1 ${isFrozen
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                                    : 'bg-green-500/20 text-green-300 border border-green-500/50'
                                }`}
                        >
                            {isFrozen ? (
                                <>
                                    <Ban size={14} />
                                    <span className="hidden sm:inline">Congelado</span>
                                </>
                            ) : (
                                <>
                                    <Shield size={14} />
                                    <span className="hidden sm:inline">Activo</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {isFrozen && (
                <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
                    <Ban className="text-red-400" size={16} />
                    <p className="text-red-300 text-xs">
                        {canModerate
                            ? 'Chat congelado. Solo tú puedes escribir.'
                            : 'El chat está congelado por el moderador.'}
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                        <Users size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay mensajes aún</p>
                        <p className="text-xs mt-1">Sé el primero en chatear</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className="bg-white/5 rounded-lg p-2 md:p-3 group relative">
                            <div className="flex items-center gap-2 mb-1">
                                {msg.userAvatar && (
                                    <img
                                        src={msg.userAvatar}
                                        alt={msg.userName}
                                        className="w-6 h-6 rounded-full"
                                    />
                                )}
                                <span className="text-purple-400 font-medium text-xs md:text-sm">{msg.userName}</span>
                                <span className="text-white/40 text-xs">
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                                {canModerate && (
                                    <button
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="ml-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                        title="Eliminar mensaje"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="text-white/90 text-sm md:text-base">{msg.text}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isFrozen && !canModerate ? 'Chat congelado...' : 'Escribe un mensaje...'}
                    disabled={isFrozen && !canModerate}
                    className="flex-1 bg-white/10 text-white rounded-lg px-3 md:px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm md:text-base"
                />
                <button
                    onClick={handleSend}
                    disabled={(isFrozen && !canModerate) || !inputValue.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 md:px-4 py-2 rounded-lg transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: CONTROL DE INVITADOS
// ============================================================================

interface GuestControlProps {
    radioId: string;
    guestCode?: string;
    onGenerateCode: () => void;
    allowGuests: boolean;
}

const GuestControl: React.FC<GuestControlProps> = ({
    radioId,
    guestCode,
    onGenerateCode,
    allowGuests
}) => {
    const [copied, setCopied] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const handleCopy = () => {
        if (guestCode) {
            navigator.clipboard.writeText(guestCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            Swal.fire({
                icon: 'success',
                title: '¡Código copiado!',
                text: 'Comparte este código con tus invitados',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

   return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 mb-4">
            <Mic size={24} />
            Control de Invitados
        </h2>

        <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-3">
                    Genera un código para que otros puedan conectarse como invitados y hablar en tu radio.
                </p>

                {!guestCode ? (
                    <button
                        onClick={onGenerateCode}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                    >
                        Generar Código de Invitado
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                            <input
                                type={showCode ? 'text' : 'password'}
                                value={guestCode}
                                readOnly
                                className="flex-1 bg-white/10 text-white rounded-lg px-4 py-2 font-mono text-sm min-w-[150px]"
                            />
                            <button
                                onClick={() => setShowCode(!showCode)}
                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg"
                            >
                                {showCode ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button
                                onClick={handleCopy}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                            >
                                {copied ? <Check size={18} /> : 'Copiar'}
                            </button>
                        </div>
                        <p className="text-white/60 text-xs">
                            Comparte este código con tus invitados para que puedan conectarse
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
);

};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const RadioSystem: React.FC = () => {
    const params = useParams();
    const radioId = (params?.id as string);

    const { user, loginUser } = useContext(UserContext);
    const { agregarCancion } = useReproductor();

    const getToken = (): string | null => {
        if (user?.token) return user.token;
        const storedToken = localStorage.getItem('token');
        if (storedToken) return storedToken;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                return parsed.token || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const [radio, setRadio] = useState<RadioStation | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [micVolume, setMicVolume] = useState(1);
    const [musicVolume, setMusicVolume] = useState(0.7);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatFrozen, setIsChatFrozen] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const listenerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const token = getToken();
        if (!token || !isPlaying || !radio?.isLive) return;

        api.registerListener(radioId, token);

        listenerIntervalRef.current = setInterval(async () => {
            await api.registerListener(radioId, token);
        }, 15000);

        return () => {
            if (listenerIntervalRef.current) {
                clearInterval(listenerIntervalRef.current);
            }
            api.unregisterListener(radioId, token);
        };
    }, [isPlaying, radio?.isLive, radioId]);

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            if (radio) {
                loadMessages();
                loadRadio();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [radioId]);

    const loadData = async () => {
        try {
            const [radioData, tracksData, messagesData] = await Promise.all([
                api.getRadio(radioId),
                api.getTracks(radioId),
                api.getMessages(radioId)
            ]);

            if (radioData) setRadio(radioData);
            setTracks(tracksData);
            setMessages(messagesData);

            if (tracksData.length > 0) {
                setCurrentTrack(tracksData[0]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar',
                text: 'No se pudo cargar la información de la radio',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRadio = async () => {
        const radioData = await api.getRadio(radioId);
        if (radioData) setRadio(radioData);
    };

    const loadMessages = async () => {
        const messagesData = await api.getMessages(radioId);
        setMessages(messagesData);
    };

    const handleUpdateRadio = async (data: FormData) => {
        const token = getToken();
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'No autenticado',
                text: 'Debes iniciar sesión para editar la radio',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
            return;
        }

        const updatedRadio = await api.updateRadio(radioId, data, token);
        if (updatedRadio) {
            setRadio(updatedRadio);
            Swal.fire({
                icon: 'success',
                title: '¡Radio actualizada!',
                text: 'Los cambios se guardaron correctamente',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleDeleteRadio = async () => {
        const token = getToken();
        if (!token) return;

        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar radio?',
            text: 'Esta acción no se puede deshacer',
            background: '#1a1a2e',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const success = await api.deleteRadio(radioId, token);
            if (success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Radio eliminada',
                    text: 'Redirigiendo...',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#8b5cf6',
                    timer: 1500,
                    showConfirmButton: false
                });
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        }
    };

    const handleToggleLive = async () => {
        const token = getToken();
        if (!token || !radio) return;

        const newLiveState = !radio.isLive;

        const updatedRadio = await api.toggleLive(radio._id, token, newLiveState);

        if (updatedRadio) {
            setRadio(updatedRadio);

            setTimeout(async () => {
                const freshRadio = await api.getRadio(radioId);
                if (freshRadio) {
                    setRadio(freshRadio);
                }
            }, 500);

            if (newLiveState) {
                setIsMicMuted(false);
                Swal.fire({
                    icon: 'success',
                    title: '¡Transmisión iniciada!',
                    text: 'Tu radio está transmitiendo en vivo',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#8b5cf6',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                setIsPlaying(false);
                setIsMicMuted(false);
                Swal.fire({
                    icon: 'info',
                    title: 'Transmisión detenida',
                    text: 'Tu radio ya no está transmitiendo',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#8b5cf6',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar el estado de transmisión',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    const handleToggleMic = () => {
        setIsMicMuted(!isMicMuted);

        const newState = !isMicMuted;

        Swal.fire({
            icon: newState ? 'warning' : 'success',
            title: newState ? 'Micrófono silenciado' : 'Micrófono activo',
            text: newState ? 'Los oyentes no te escucharán' : 'Los oyentes te pueden escuchar',
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#8b5cf6',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handlePlayPause = () => {
        if (!radio?.isLive) {
            Swal.fire({
                icon: 'warning',
                title: 'Radio fuera de línea',
                text: 'La radio no está transmitiendo en este momento',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#f59e0b',
            });
            return;
        }
        setIsPlaying(!isPlaying);
    };

    const handleDeleteTrack = async (trackId: string) => {
        const token = getToken();
        if (!token) return;

        const result = await Swal.fire({
            icon: 'question',
            title: '¿Eliminar canción?',
            text: 'Se quitará de la playlist de la radio',
            background: '#1a1a2e',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const success = await api.deleteTrack(radioId, trackId, token);
            if (success) {
                const newTracks = tracks.filter(t => t._id !== trackId);
                setTracks(newTracks);

                if (currentTrack?._id === trackId) {
                    setCurrentTrack(newTracks.length > 0 ? newTracks[0] : null);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Eliminada',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#8b5cf6',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    };

    const handleUploadTrack = async (file: File, metadata: TrackMetadata) => {
        const token = getToken();
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'No autenticado',
                text: 'Debes iniciar sesión para subir canciones',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ef4444',
            });
            return;
        }

        const newTrack = await api.uploadTrack(radioId, file, metadata, token);

        if (newTrack) {
            setTracks(prevTracks => [...prevTracks, newTrack]);

            if (!currentTrack) {
                setCurrentTrack(newTrack);
            }

            setTimeout(async () => {
                const freshTracks = await api.getTracks(radioId);
                setTracks(freshTracks);
            }, 500);

            Swal.fire({
                icon: 'success',
                title: '¡Canción subida!',
                text: `${metadata.title} se agregó a la playlist de la radio`,
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleSendMessage = async (text: string) => {
        const token = getToken();
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para chatear',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#f59e0b',
            });
            return;
        }

        const newMessage = await api.sendMessage(radioId, text, token);
        if (newMessage) {
            setMessages([...messages, newMessage]);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        const token = getToken();
        if (!token) return;

        const success = await api.deleteMessage(radioId, messageId, token);
        if (success) {
            setMessages(messages.filter(m => m._id !== messageId));
            Swal.fire({
                icon: 'success',
                title: 'Mensaje eliminado',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleToggleLike = async () => {
        const token = getToken();
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para dar like',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#f59e0b',
            });
            return;
        }

        const result = await api.toggleLike(radioId, token);
        if (result && radio) {
            setHasLiked(!hasLiked);
            setRadio({
                ...radio,
                likes: hasLiked ? radio.likes - 1 : radio.likes + 1
            });
        }
    };

    const handleGenerateGuestCode = async () => {
        const token = getToken();
        if (!token) return;

        const updatedRadio = await api.generateGuestCode(radioId, token);
        if (updatedRadio) {
            setRadio(updatedRadio);
            Swal.fire({
                icon: 'success',
                title: '¡Código generado!',
                text: 'Comparte este código con tus invitados',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleUpdateProfile = async (data: FormData) => {
        const token = getToken();
        if (!token) return;

        const updatedUser = await api.updateUser(data, token);
        if (updatedUser) {
            loginUser({ ...updatedUser, token });
            Swal.fire({
                icon: 'success',
                title: '¡Perfil actualizado!',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#8b5cf6',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handlePlayTrack = (track: Track) => {
        const nuevaCancion: Cancion = {
            id: track._id,
            titulo: track.title,
            artista: track.artist,
            url: track.url,
            cover: radio?.logo || './assets/zoonito.jpg',
        };

        agregarCancion(nuevaCancion);
        setCurrentTrack(track);
    };

    const defaultRadio: RadioStation = {
        _id: radioId,
        idMusico: '',
        name: 'Radio sin configurar',
        description: 'Esta radio aún no tiene configuración',
        streamUrl: '',
        icecastMount: '/radio',
        isLive: false,
        isAutomated: false,
        autoPlaylist: [],
        listeners: 0,
        likes: 0,
        allowGuests: false
    };

    const displayRadio = radio || defaultRadio;
    const isOwner = user ? user._id === displayRadio.idMusico : false;
    const canTransmit = user ? user.isPremium : false;
    const canModerate = isOwner;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-white text-xl">Cargando radio...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                    <Music size={24} className="md:w-7 md:h-7" />
                                </div>
                                <span className="truncate">{displayRadio.name}</span>
                            </h1>
                            <p className="text-white/60 text-sm md:text-base">Sistema completo de transmisión y gestión</p>
                        </div>
                        {user && (
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 md:px-4 py-2 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-white m-1" />
                                    )}
                                </div>
                                <div className="text-left hidden md:block">
                                    <div className="text-sm font-medium">{user.name}</div>
                                    <div className="text-xs text-white/60">
                                        {user.isPremium ? '👑 Premium' : '🎧 Gratis'}
                                    </div>
                                </div>
                                <Settings size={18} className="text-white/60" />
                            </button>
                        )}
                    </header>

                    <div className="space-y-4 md:space-y-6">
                        <Player
                            radio={displayRadio}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            isMicMuted={isMicMuted}
                            micVolume={micVolume}
                            musicVolume={musicVolume}
                            onPlayPause={handlePlayPause}
                            onToggleMic={handleToggleMic}
                            onMicVolumeChange={setMicVolume}
                            onMusicVolumeChange={setMusicVolume}
                            onShare={() => setShowShareModal(true)}
                            onEdit={() => setShowEditModal(true)}
                            onToggleLike={handleToggleLike}
                            onToggleLive={handleToggleLive}
                            hasLiked={hasLiked}
                            isOwner={isOwner}
                            canTransmit={canTransmit}
                        />

                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                            <MusicaPlayer
                                radioId={radioId}
                                cancionesBackend={tracks} // Canciones que ya están en el backend
                                onCancionChange={(cancion) => {
                                    if (cancion) {
                                        setCurrentTrack({
                                            _id: cancion.id,
                                            radioId: radioId,
                                            title: cancion.titulo,
                                            artist: cancion.artista,
                                            url: cancion.url,
                                            duration: cancion.duracion,
                                            order: 0
                                        });
                                    } else {
                                        setCurrentTrack(null);
                                    }
                                }}
                                onUploadToBackend={async (file, metadata) => {
                                    const token = getToken();
                                    if (!token) throw new Error('No token');

                                    const newTrack = await api.uploadTrack(radioId, file, metadata, token);
                                    if (newTrack) {
                                        setTracks(prev => [...prev, newTrack]);
                                        return { url: newTrack.url };
                                    }
                                    throw new Error('Error al subir');
                                }}
                                onDeleteFromBackend={async (trackId) => {
                                    await handleDeleteTrack(trackId);
                                }}
                                canEdit={isOwner && canTransmit}
                                isOwner={isOwner}
                                isLive={radio?.isLive || false}
                                isMicActive={!isMicMuted && isPlaying}
                            />


                            <div className="h-[500px] md:h-[600px]">
                                <Chat
                                    radioId={radioId}
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    onDeleteMessage={handleDeleteMessage}
                                    isFrozen={isChatFrozen}
                                    canModerate={canModerate}
                                    onToggleFreeze={() => setIsChatFrozen(!isChatFrozen)}
                                    listeners={displayRadio.listeners}
                                    currentUserId={user?._id}
                                />
                            </div>
                        </div>

                        {isOwner && canTransmit && (
                            <GuestControl
                                radioId={radioId}
                                guestCode={displayRadio.guestCode}
                                onGenerateCode={handleGenerateGuestCode}
                                allowGuests={displayRadio.allowGuests}
                            />
                        )}
                    </div>
                </div>
            </div>

            {showProfileModal && user && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfileModal(false)}
                    onUpdate={handleUpdateProfile}
                />
            )}

            {showShareModal && isOwner && canTransmit && (
                <ShareModal
                    radio={displayRadio}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {showEditModal && isOwner && (
                <EditRadioModal
                    radio={displayRadio}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleUpdateRadio}
                    onDelete={handleDeleteRadio}
                />
            )}
        </>
    );
};

export default RadioSystem;


