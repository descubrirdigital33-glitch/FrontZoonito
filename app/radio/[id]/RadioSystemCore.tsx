import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface Track {
    _id: string;
    radioId: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
    order: number;
    isInMemory?: boolean;
    file?: File;
}

export interface User {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
    isPremium: boolean;
    token?: string;
}

export interface RadioStation {
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

export interface ChatMessage {
    _id: string;
    radioId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
}

export interface TrackMetadata {
    title: string;
    artist: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-zoonito-6x8h.vercel.app/api';

export const api = {
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
// HOOK PERSONALIZADO PARA LÓGICA DE RADIO
// ============================================================================

export interface UseRadioSystemProps {
    radioId: string;
    user: User | null;
    getToken: () => string | null;
    loginUser?: (user: User) => void;
}

export interface UseRadioSystemReturn {
    // Estados
    radio: RadioStation | null;
    tracks: Track[];
    currentTrack: Track | null;
    isPlaying: boolean;
    isMicMuted: boolean;
    micVolume: number;
    musicVolume: number;
    messages: ChatMessage[];
    isChatFrozen: boolean;
    hasLiked: boolean;
    loading: boolean;
    
    // Setters
    setRadio: React.Dispatch<React.SetStateAction<RadioStation | null>>;
    setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
    setCurrentTrack: React.Dispatch<React.SetStateAction<Track | null>>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    setIsMicMuted: React.Dispatch<React.SetStateAction<boolean>>;
    setMicVolume: React.Dispatch<React.SetStateAction<number>>;
    setMusicVolume: React.Dispatch<React.SetStateAction<number>>;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setIsChatFrozen: React.Dispatch<React.SetStateAction<boolean>>;
    setHasLiked: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Handlers
    handleUpdateRadio: (data: FormData) => Promise<void>;
    handleDeleteRadio: () => Promise<void>;
    handleToggleLive: () => Promise<void>;
    handleToggleMic: () => void;
    handlePlayPause: () => void;
    handleDeleteTrack: (trackId: string) => Promise<void>;
    handleUploadTrack: (file: File, metadata: TrackMetadata) => Promise<void>;
    handleSendMessage: (text: string) => Promise<void>;
    handleDeleteMessage: (messageId: string) => Promise<void>;
    handleToggleLike: () => Promise<void>;
    handleGenerateGuestCode: () => Promise<void>;
    handleUpdateProfile: (data: FormData) => Promise<void>;
    handlePlayTrack: (track: Track) => void;
    
    // Computed
    defaultRadio: RadioStation;
    displayRadio: RadioStation;
    isOwner: boolean;
    canTransmit: boolean;
    canModerate: boolean;
}

export const useRadioSystem = ({
    radioId,
    user,
    getToken,
    loginUser
}: UseRadioSystemProps): UseRadioSystemReturn => {
    
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
    const [loading, setLoading] = useState(true);

    const listenerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================================================
    // EFECTOS
    // ============================================================================

    // Registro de listener
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

    // Carga inicial y polling
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

    // ============================================================================
    // FUNCIONES DE CARGA
    // ============================================================================

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

    // ============================================================================
    // HANDLERS
    // ============================================================================

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
        if (!token || !loginUser) return;

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
        setCurrentTrack(track);
    };

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================

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

    return {
        // Estados
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
        
        // Setters
        setRadio,
        setTracks,
        setCurrentTrack,
        setIsPlaying,
        setIsMicMuted,
        setMicVolume,
        setMusicVolume,
        setMessages,
        setIsChatFrozen,
        setHasLiked,
        
        // Handlers
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
        handlePlayTrack,
        
        // Computed
        defaultRadio,
        displayRadio,
        isOwner,
        canTransmit,
        canModerate,
    };
};

// Demo component para testing
export default function RadioSystemCoreDemo() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
            <div className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-purple-500/30">
                <h1 className="text-3xl font-bold text-white mb-4">📡 RadioSystemCore</h1>
                <p className="text-white/80 mb-6">
                    Este componente exporta toda la lógica de negocio y API para el sistema de radio.
                </p>
                
                <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <h2 className="text-xl font-semibold text-purple-400 mb-2">✅ Exports disponibles:</h2>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>• <code className="text-green-400">api</code> - Cliente API completo</li>
                            <li>• <code className="text-green-400">useRadioSystem</code> - Hook con toda la lógica</li>
                            <li>• <code className="text-green-400">Track, User, RadioStation...</code> - Tipos TypeScript</li>
                        </ul>
                    </div>
                    
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">📦 Uso en RadioSystem:</h3>
                        <pre className="text-xs text-green-300 bg-black/30 p-3 rounded overflow-x-auto">
{`import { useRadioSystem } from './RadioSystemCore';

const RadioSystem = () => {
  const {
    radio,
    tracks,
    isPlaying,
    handlePlayPause,
    handleToggleLive,
    // ... todos los estados y handlers
  } = useRadioSystem({
    radioId,
    user,
    getToken,
    loginUser
  });
  
  // Tu UI aquí
}`}
                        </pre>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">🎯 Ventajas de esta separación:</h3>
                        <ul className="text-white/70 text-sm space-y-1">
                            <li>✓ Lógica separada de la UI</li>
                            <li>✓ Fácil testing de funciones</li>
                            <li>✓ Reutilizable en otros componentes</li>
                            <li>✓ Código más mantenible</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}