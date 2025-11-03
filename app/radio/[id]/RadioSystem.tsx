'use client';
import React, { useState, useRef, useContext,useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Pause,
    Volume2,
    VolumeX,
    Users,
    Send,
    Trash2,
    GripVertical,
    Shield,
    Music,
    Share2,
    Settings,
    User,
    Check,
    Play,
    X,
    Crown,
    Headphones,
    Mic,
    Upload,
    Edit2,
    Heart,
    SkipForward,
    Radio,
    Zap,
    Plus,
    MicOff,
    Ban,
    RadioTower
} from 'lucide-react';

// Importamos todo desde RadioSystemCore
import { 
    useRadioSystem,
    api,
    type Track,
    type User as UserType,
    type RadioStation,
    type ChatMessage,
    type TrackMetadata
} from './RadioSystemCore';

import { UserContext } from "../../context/UserContext";
import { useReproductor } from '../../context/ReproductorContext';
import { Cancion } from "../../components/Reproductor";
import Swal from 'sweetalert2';
import { useRadioStream } from '../../hooks/useRadioStream';
import MusicaPlayer from "../../MusicaPlayer/page";

// ============================================================================
// COMPONENTES DE UI
// ============================================================================

// Modal de Perfil
interface ProfileModalProps {
    user: UserType;
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

// Modal Editar Radio
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

// Modal Compartir
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
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm overflow-hidden text-ellipsis"
                            />
                            <button
                                onClick={() => handleCopy(shareUrl)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0"
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
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm overflow-hidden text-ellipsis"
                            />
                            <button
                                onClick={() => handleCopy(radio.streamUrl)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0"
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
                                className="flex-1 bg-white/5 text-white rounded-lg px-4 py-2 border border-white/10 text-sm font-mono resize-none overflow-auto"
                            />
                            <button
                                onClick={() => handleCopy(embedCode)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0 self-start"
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

// Player Component
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
    user?: UserType;
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
    canTransmit,
    user
}) => {
    const {
        isLoadingStream,
        streamError,
        listenerCount
    } = useRadioStream({
        sessionId: radio._id,
        isOwner,
        isPlaying,
        micVolume,
        musicVolume,
        isMicMuted
    });

    const [showVolumeControls, setShowVolumeControls] = useState(false);

    return (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-xl p-4 md:p-6 shadow-2xl overflow-hidden">
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
                                <div className={`rounded-full w-8 h-8 flex items-center justify-center md:w-10 md:h-10 ${isOwner ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {isOwner ? (
                                        <RadioTower size={24} className="text-white" />
                                    ) : (
                                        <Play size={24} className="text-white ml-1" />
                                    )}
                                </div>
                            )}
                        </button>

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
                            {user?.avatar ? (
                                <img src={user.avatar} alt={radio.name} className="w-full h-full object-cover" />
                            ) : (
                                <img src="/assets/zoonito.jpg" alt={radio.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full md:w-auto overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {radio.isLive ? (
                                <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 animate-pulse flex-shrink-0">
                                    <Mic size={12} />
                                    EN VIVO
                                </span>
                            ) : (
                                <span className="bg-gray-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 flex-shrink-0">
                                    <Radio size={12} />
                                    OFF LINE
                                </span>
                            )}
                            {isOwner && isPlaying && radio.isLive && (
                                <>
                                    <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 animate-pulse flex-shrink-0">
                                        <Mic size={12} />
                                        TRANSMITIENDO
                                    </span>
                                    {isMicMuted && (
                                        <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 flex-shrink-0">
                                            <MicOff size={12} />
                                            MIC MUTEADO
                                        </span>
                                    )}
                                </>
                            )}
                            {!isOwner && isPlaying && !streamError && (
                                <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 flex-shrink-0">
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
                            <p className="text-white/60 text-sm md:text-base truncate">
                                {radio.description || (radio.isLive ? 'Transmitiendo en vivo' : 'Radio fuera de línea')}
                            </p>
                        )}
                        {streamError && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 truncate">
                                <X size={12} className="flex-shrink-0" />
                                <span className="truncate">{streamError}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                        <button
                            onClick={onToggleLike}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors flex-shrink-0 ${hasLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/80 hover:text-white'
                                }`}
                        >
                            <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                            <span className="text-sm">{radio.likes}</span>
                        </button>

                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-white/80 flex-shrink-0">
                            <Users size={18} />
                            <span className="text-sm">{listenerCount}</span>
                        </div>

                        <button
                            onClick={onShare}
                            className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-lg hover:bg-white/20 flex-shrink-0"
                        >
                            <Share2 size={20} />
                        </button>

                        {isOwner && (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 rounded-lg hover:bg-white/20 flex-shrink-0"
                                >
                                    <Settings size={20} />
                                </button>
                                {canTransmit && (
                                    <button
                                        onClick={onToggleLive}
                                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 whitespace-nowrap ${radio.isLive
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

                {isOwner && canTransmit && radio.isLive && (
                    <div className="bg-white/5 border border-purple-500/30 rounded-lg p-4 overflow-hidden">
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
                                        💡 <strong>Tip:</strong> Baja la música al 30-40% cuando hables para que tu voz se escuche clara (efecto bajo cortina).
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
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
                    <div className={`border rounded-lg p-3 flex items-center gap-2 overflow-hidden ${isMicMuted ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
                        }`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isMicMuted ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <p className={`text-sm ${isMicMuted ? 'text-red-300' : 'text-green-300'}`}>
                            {isMicMuted
                                ? '🔇 Tu micrófono está silenciado. Los oyentes no te escuchan.'
                                : `🎤 Tu micrófono está transmitiendo en vivo a ${listenerCount} oyente${listenerCount !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                )}

                {!canTransmit && !isOwner && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2 overflow-hidden">
                        <Shield className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-yellow-200 text-sm">
                            Estás en modo oyente. <button className="underline font-semibold">Actualiza a Premium</button> para transmitir tu propia radio.
                        </p>
                    </div>
                )}

                {!radio.isLive && (
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 flex items-start gap-2 overflow-hidden">
                        <Radio className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
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

// Chat Component
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
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Users size={24} />
                    <span className="hidden md:inline">Chat en Vivo</span>
                    <span className="md:hidden">Chat</span>
                </h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-white/60 text-xs md:text-sm whitespace-nowrap">
                        {listeners > 0 ? `${listeners} oyentes` : 'Sin oyentes'}
                    </span>
                    {canModerate && (
                        <button
                            onClick={onToggleFreeze}
                            className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1 flex-shrink-0 ${isFrozen
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
                <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2 flex-shrink-0">
                    <Ban className="text-red-400 flex-shrink-0" size={16} />
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {msg.userAvatar && (
                                    <img
                                        src={msg.userAvatar}
                                        alt={msg.userName}
                                        className="w-6 h-6 rounded-full flex-shrink-0"
                                    />
                                )}
                                <span className="text-purple-400 font-medium text-xs md:text-sm truncate">{msg.userName}</span>
                                <span className="text-white/40 text-xs flex-shrink-0">
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                                {canModerate && (
                                    <button
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="ml-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all flex-shrink-0"
                                        title="Eliminar mensaje"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="text-white/90 text-sm md:text-base break-words">{msg.text}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isFrozen && !canModerate ? 'Chat congelado...' : 'Escribe un mensaje...'}
                    disabled={isFrozen && !canModerate}
                    className="flex-1 bg-white/10 text-white rounded-lg px-3 md:px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm md:text-base min-w-0"
                />
                <button
                    onClick={handleSend}
                    disabled={(isFrozen && !canModerate) || !inputValue.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 md:px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

// Guest Control Component
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
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-6 overflow-hidden">
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
                                    className="flex-1 bg-white/10 text-white rounded-lg px-4 py-2 font-mono text-sm min-w-[150px] overflow-hidden text-ellipsis"
                                />
                                <button
                                    onClick={() => setShowCode(!showCode)}
                                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg flex-shrink-0"
                                >
                                    {showCode ? '👁️' : '👁️‍🗨️'}
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex-shrink-0"
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

    // 🎯 USAMOS EL HOOK CENTRALIZADO
    const {
        radio,
        tracks,
        currentTrack,
        isPlaying,
        isMicMuted,
        micVolume,
        musicVolume,
        messages,
        isChatFrozen,
        hasLiked,
        loading,
        setCurrentTrack,
        setTracks,
        setMicVolume,
        setMusicVolume,
        setIsChatFrozen,
        handleUpdateRadio,
        handleDeleteRadio,
        handleToggleLive,
        handleToggleMic,
        handlePlayPause,
        handleDeleteTrack,
        handleUploadTrack,
        handleSendMessage,
        handleDeleteMessage,
        handleToggleLike,
        handleGenerateGuestCode,
        handleUpdateProfile,
        displayRadio,
        isOwner,
        canTransmit,
        canModerate,
    } = useRadioSystem({
        radioId,
        user,
        getToken,
        loginUser
    });

    // Estados para modales
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Handler para reproducir track en el reproductor global
    const handlePlayTrackGlobal = (track: Track) => {
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
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 md:p-6 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Music size={24} className="md:w-7 md:h-7" />
                                </div>
                                <span className="truncate">{displayRadio.name}</span>
                            </h1>
                            <p className="text-white/60 text-sm md:text-base">Sistema completo de transmisión y gestión</p>
                        </div>
                        {user && (
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 md:px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0">
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
                                <Settings size={18} className="text-white/60 flex-shrink-0" />
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
                            user={user || undefined}
                        />

                        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                            <MusicaPlayer
                                radioId={radioId}
                                cancionesBackend={tracks}
                                onCancionChange={(cancion) => {
                                    if (cancion) {
                                        setCurrentTrack({
                                            _id: cancion.id,
                                            radioId: radioId,
                                            title: cancion.titulo,
                                            artist: cancion.artista,
                                            url: cancion.url,
                                            duration: cancion.duracion || 0,
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

            {showShareModal && (
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