'use client';
import React, { useState, useRef, useContext, useEffect } from 'react';
import RadioYoutube from './RadioYoutube';
import { useParams } from 'next/navigation';
import {
    Pause, Volume2, VolumeX, Users, Send, Trash2, GripVertical,
    Shield, Music, Share2, Settings, User, Check, Play, X, Crown,
    Headphones, Mic, Upload, Edit2, Heart, SkipForward, Radio,
    Zap, Plus, MicOff, Ban, RadioTower
} from 'lucide-react';


import {
    useRadioSystem, api,
    type Track, type User as UserType,
    type RadioStation, type ChatMessage, type TrackMetadata
} from './RadioSystemCore';
import { UserContext } from '../../context/UserContext';
import { useReproductor } from '../../context/ReproductorContext';
import { Cancion } from '../../components/Reproductor';
import Swal from 'sweetalert2';
import { useRadioStream } from '../../hooks/useRadioStream';
import MusicaPlayer from '../../MusicaPlayer/page';

import './styles/RadioSystem.css';

// ============================================================
// ProfileModal
// ============================================================
interface ProfileModalProps {
    user: UserType;
    isOwner: boolean;
    radioId?: string;
    onClose: () => void;
    onUpdate: (data: FormData) => Promise<void>;
    onUpdateRadioLogo?: (avatarUrl: string) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    user, isOwner, radioId, onClose, onUpdate, onUpdateRadioLogo
}) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(user.avatar || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setAvatar(file); setPreviewUrl(URL.createObjectURL(file)); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const fd = new FormData();
        fd.append('name', name);
        if (avatar) fd.append('avatar', avatar);
        await onUpdate(fd);

        if (isOwner && avatar && onUpdateRadioLogo && radioId) {
            try {
                const cfd = new FormData();
                cfd.append('file', avatar);
                cfd.append('upload_preset', 'zoonity_radios');
                const res = await fetch('https://api.cloudinary.com/v1_1/dplncudbq/image/upload', {
                    method: 'POST', body: cfd
                });
                if (res.ok) {
                    const data = await res.json();
                    await onUpdateRadioLogo(data.secure_url);
                }
            } catch (err) { console.error('Error al actualizar logo de radio:', err); }
        }
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="rs-modal-overlay">
            <div className="rs-modal">
                <div className="rs-modal__header">
                    <h2 className="rs-modal__title"><User size={24} />Mi Perfil</h2>
                    <button className="rs-modal__close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="rs-modal__body">
                    <div className="rs-avatar-wrap">
                        <div className="rs-avatar">
                            <div className="rs-avatar__circle">
                                {previewUrl
                                    ? <img src={previewUrl} alt="Avatar" />
                                    : <User size={40} color="#fff" />}
                            </div>
                            {isOwner && (
                                <label className="rs-avatar__upload">
                                    <Upload size={16} color="#fff" />
                                    <input
                                        type="file" accept="image/*"
                                        className="rs-avatar__input"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {!isOwner && (
                        <div className="rs-note rs-note--warn">
                            🔒 Solo el dueño de la radio puede cambiar el avatar/logo
                        </div>
                    )}

                    {isOwner && avatar && (
                        <div className="rs-note rs-note--info">
                            💡 Al cambiar tu avatar, también se actualizará el logo de tu radio.
                        </div>
                    )}

                    <div className="rs-field">
                        <label className="rs-label">Email</label>
                        <input className="rs-input" type="email" value={user.email} disabled />
                    </div>

                    <div className="rs-field">
                        <label className="rs-label">Nombre de usuario</label>
                        <input
                            className="rs-input" type="text"
                            value={name} onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="rs-plan-box">
                        <div className="rs-plan-box__header">
                            {user.isPremium
                                ? <Crown size={20} color="#facc15" />
                                : <Headphones size={20} color="rgba(255,255,255,0.6)" />}
                            <span className="rs-plan-box__title">
                                {user.isPremium ? 'Plan Premium' : 'Plan Gratuito'}
                            </span>
                        </div>
                        <p className="rs-plan-box__details">
                            {user.isPremium
                                ? '✓ Transmisión ilimitada\n✓ Sin anuncios\n✓ Automatización RadioBoss\n✓ Invitados en vivo'
                                : '✓ Escuchar radios\n✗ No puedes transmitir tu propia radio'}
                        </p>
                        {!user.isPremium && (
                            <button className="rs-upgrade-btn">Actualizar a Premium</button>
                        )}
                    </div>
                </div>

                <div className="rs-modal__footer">
                    <button className="rs-btn rs-btn--ghost" onClick={onClose}>Cancelar</button>
                    <button
                        className={`rs-btn rs-btn--purple ${(isSaving || !name.trim()) ? 'rs-btn--disabled' : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? 'Guardando...' : <><Check size={18} />Guardar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// RadioSettingsModal
// ============================================================
interface RadioSettingsModalProps {
    radio: RadioStation;
    onClose: () => void;
    onUpdate: (data: FormData) => Promise<void>;
    onDelete: () => Promise<void>;
}

const RadioSettingsModal: React.FC<RadioSettingsModalProps> = ({
    radio, onClose, onUpdate, onDelete
}) => {
    const [name, setName] = useState(radio.name);
    const [description, setDescription] = useState(radio.description);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const displayLogo = radio.logo || radio.owner?.avatar || '/assets/zoonito.jpg';

    const handleSave = async () => {
        setIsSaving(true);
        const fd = new FormData();
        fd.append('name', name);
        fd.append('description', description);
        await onUpdate(fd);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="rs-modal-overlay">
            <div className="rs-modal">
                <div className="rs-modal__header">
                    <h2 className="rs-modal__title"><Radio size={24} />Configuración de Radio</h2>
                    <button className="rs-modal__close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="rs-modal__body">
                    <div className="rs-avatar-wrap">
                        <div className="rs-logo-square">
                            {displayLogo
                                ? <img src={displayLogo} alt="Logo" />
                                : <Radio size={40} color="#fff" />}
                        </div>
                    </div>

                    <div className="rs-note rs-note--info">
                        💡 El logo de la radio es tu avatar. Para cambiarlo, actualiza tu avatar en tu perfil.
                    </div>

                    <div className="rs-field">
                        <label className="rs-label">Nombre de la radio</label>
                        <input
                            className="rs-input" type="text"
                            value={name} onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="rs-field">
                        <label className="rs-label">Descripción</label>
                        <textarea
                            className="rs-textarea" rows={3}
                            value={description} onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rs-modal__footer">
                    <button className="rs-btn rs-btn--red" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 size={18} />
                    </button>
                    <button className="rs-btn rs-btn--ghost" onClick={onClose}>Cancelar</button>
                    <button
                        className={`rs-btn rs-btn--purple ${(isSaving || !name.trim()) ? 'rs-btn--disabled' : ''}`}
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                {showDeleteConfirm && (
                    <div className="rs-confirm">
                        <div className="rs-confirm__box">
                            <p className="rs-confirm__text">¿Eliminar esta radio permanentemente?</p>
                            <div className="rs-confirm__actions">
                                <button
                                    className="rs-btn rs-btn--ghost"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >Cancelar</button>
                                <button
                                    className="rs-btn rs-btn--red"
                                    onClick={async () => { await onDelete(); onClose(); }}
                                >Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// ShareModal
// ============================================================
interface ShareModalProps {
    radio: RadioStation;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ radio, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${window.location.origin}/radio/${radio.idMusico}`;
    const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="400"></iframe>`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Swal.fire({
            icon: 'success', title: '¡Copiado!',
            text: 'El texto se copió al portapapeles',
            background: '#1a1a2e', color: '#fff',
            confirmButtonColor: '#8b5cf6', timer: 1500, showConfirmButton: false
        });
    };

    return (
        <div className="rs-modal-overlay">
            <div className="rs-modal rs-share-modal">
                <div className="rs-modal__header">
                    <h2 className="rs-modal__title"><Share2 size={24} />Compartir Radio</h2>
                    <button className="rs-modal__close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="rs-modal__body">
                    <div className="rs-share-field">
                        <label className="rs-label">Link directo</label>
                        <div className="rs-share-row">
                            <input className="rs-share-input" type="text" value={shareUrl} readOnly />
                            <button className="rs-share-copy" onClick={() => handleCopy(shareUrl)}>
                                {copied ? <Check size={18} /> : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <div className="rs-share-field">
                        <label className="rs-label">Stream URL</label>
                        <div className="rs-share-row">
                            <input className="rs-share-input" type="text" value={radio.streamUrl} readOnly />
                            <button className="rs-share-copy" onClick={() => handleCopy(radio.streamUrl)}>
                                Copiar
                            </button>
                        </div>
                    </div>

                    <div className="rs-share-field">
                        <label className="rs-label">Código embed</label>
                        <div className="rs-share-row">
                            <textarea className="rs-share-textarea" rows={3} value={embedCode} readOnly />
                            <button
                                className="rs-share-copy"
                                style={{ alignSelf: 'flex-start' }}
                                onClick={() => handleCopy(embedCode)}
                            >Copiar</button>
                        </div>
                    </div>
                </div>

                <div className="rs-modal__footer">
                    <button className="rs-btn rs-btn--ghost" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Player — modo dueño intacto + modo oyente estéreo de auto
// ============================================================
interface PlayerProps {
    radio: RadioStation;
    currentTrack: Track | null;
    isPlaying: boolean;
    isMicMuted: boolean;
    micVolume: number;
    musicVolume: number;
    onPlayPause: () => void;
    onToggleMic: () => void;
    onMicVolumeChange: (v: number) => void;
    onMusicVolumeChange: (v: number) => void;
    onShare: () => void;
    onEditRadio: () => void;
    onToggleLike: () => void;
    onToggleLive: () => void;
    onUploadLogo: (file: File) => void;
    hasLiked: boolean;
    isOwner: boolean;
    canTransmit: boolean;
    user?: UserType;
    owner?: UserType;
    // Vienen del hook useRadioStream, llamado UNA sola vez en RadioSystem
    isLoadingStream: boolean;
    streamError: string | null;
    listenerCount: number;
}

// ── VU Meter animado (solo modo oyente) ─────────────────────
const VU_BARS = 28;

const VUMeter: React.FC<{ active: boolean }> = ({ active }) => {
    const [levels, setLevels] = useState<number[]>(Array(VU_BARS).fill(0));
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!active) {
            setLevels(Array(VU_BARS).fill(0));
            return;
        }

        let frame = 0;
        const targets = Array(VU_BARS).fill(0);
        const current = Array(VU_BARS).fill(0);

        const tick = () => {
            frame++;
            if (frame % 4 === 0) {
                for (let i = 0; i < VU_BARS; i++) {
                    const center = Math.abs(i - VU_BARS / 2) / (VU_BARS / 2);
                    const peak = (1 - center * 0.6) * (0.4 + Math.random() * 0.6);
                    targets[i] = peak;
                }
            }
            for (let i = 0; i < VU_BARS; i++) {
                current[i] += (targets[i] - current[i]) * 0.2;
            }
            setLevels([...current]);
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [active]);

    const getColor = (level: number, index: number) => {
        const center = Math.abs(index - VU_BARS / 2) / (VU_BARS / 2);
        if (level > 0.82) return '#ff3366';
        if (level > 0.6) return '#ffaa00';
        if (center < 0.3) return '#00d4ff';
        return '#00ff88';
    };

    return (
        <div className="rs-stereo__vu" aria-hidden="true">
            {levels.map((level, i) => (
                <div
                    key={i}
                    className="rs-stereo__vu-bar"
                    style={{
                        height: `${Math.max(4, level * 100)}%`,
                        background: active ? getColor(level, i) : 'rgba(255,255,255,0.06)',
                        boxShadow: active && level > 0.5 ? `0 0 6px ${getColor(level, i)}88` : 'none',
                    }}
                />
            ))}
        </div>
    );
};

// ── Barra de progreso tipo segmentos LED (solo modo oyente) ──
const SegmentBar: React.FC<{ current: number; total: number; segments?: number }> = ({
    current, total, segments = 30
}) => {
    const filled = total > 0 ? (current / total) * segments : 0;
    return (
        <div className="rs-stereo__progress-segs" aria-label="Progreso">
            {Array.from({ length: segments }, (_, i) => {
                const on = i < Math.floor(filled);
                const half = !on && i < filled;
                return (
                    <div
                        key={i}
                        className={`rs-stereo__seg${on ? ' rs-stereo__seg--on' : half ? ' rs-stereo__seg--half' : ''}`}
                    />
                );
            })}
        </div>
    );
};

// ── Señal de antena (solo modo oyente) ───────────────────────
const SignalBars: React.FC<{ strength?: number }> = ({ strength = 4 }) => (
    <div className="rs-stereo__signal" aria-label={`Señal: ${strength}/5`}>
        {[12, 18, 26, 34, 44].map((h, i) => (
            <div
                key={i}
                className={`rs-stereo__signal-bar${i < strength ? ' rs-stereo__signal-bar--on' : ''}`}
                style={{ height: h }}
            />
        ))}
    </div>
);

// ── Ticker con texto duplicado para loop sin salto (solo modo oyente) ──
const Ticker: React.FC<{ text: string; paused?: boolean }> = ({ text, paused }) => {
    const spaced = `${text}     ·     `;
    const double = spaced + spaced;
    return (
        <div className="rs-stereo__ticker-wrap">
            <div className={`rs-stereo__ticker${paused ? ' rs-stereo__ticker--paused' : ''}`}>
                {double}
            </div>
        </div>
    );
};

const Player: React.FC<PlayerProps> = ({
    radio, currentTrack, isPlaying, isMicMuted, micVolume, musicVolume,
    onPlayPause, onToggleMic, onMicVolumeChange, onMusicVolumeChange,
    onShare, onEditRadio, onToggleLike, onToggleLive, onUploadLogo,
    hasLiked, isOwner, canTransmit, user, owner,
    isLoadingStream, streamError, listenerCount
}) => {
    const [showVolumeControls, setShowVolumeControls] = useState(false);
    const displayLogo = radio.logo || owner?.avatar || '/assets/zoonito.jpg';

    // Texto del ticker para el modo oyente: usa el track que viene en vivo desde el backend
    // (vía socket "now-playing"), no solo lo que viene de tracks subidos manualmente
    const tickerText = currentTrack
        ? `${currentTrack.title}  —  ${currentTrack.artist}`
        : radio.isLive
            ? 'En vivo · ' + radio.name
            : radio.name + ' · ' + radio.description;

    // ============================================================
    // MODO DUEÑO — sin cambios de funcionalidad
    // ============================================================
    if (isOwner) {
        return (
            <div className="rs-player">
                <div className="rs-player__body">
                    {/* Fila principal */}
                    <div className="rs-player__row">

                        {/* Controles izquierda */}
                        <div className="rs-player__controls">
                            {/* Play/Pause */}
                            <button
                                className="rs-play-btn"
                                onClick={onPlayPause}
                                disabled={!radio.isLive || isLoadingStream}
                            >
                                {isLoadingStream
                                    ? <div className="rs-spinner" />
                                    : isPlaying
                                        ? <Pause size={28} />
                                        : (
                                            <div className={`rs-play-btn__inner ${isOwner ? 'rs-play-btn__inner--owner' : 'rs-play-btn__inner--listener'}`}>
                                                {isOwner
                                                    ? <RadioTower size={22} color="#fff" />
                                                    : <Play size={22} color="#fff" style={{ marginLeft: 3 }} />}
                                            </div>
                                        )}
                            </button>

                            {/* Mic toggle */}
                            {isOwner && canTransmit && radio.isLive && (
                                <button
                                    className={`rs-mic-btn ${isMicMuted ? 'rs-mic-btn--muted' : 'rs-mic-btn--active'}`}
                                    onClick={onToggleMic}
                                >
                                    {isMicMuted
                                        ? <MicOff size={22} color="#f87171" />
                                        : <Mic size={22} color="#86efac" />}
                                </button>
                            )}

                            {/* Logo */}
                            <div className="rs-radio-logo">
                                <img src={displayLogo} alt={radio.name} />
                                {isOwner && (
                                    <>
                                        <div className="rs-radio-logo__upload">
                                            <Upload size={24} />
                                        </div>
                                        <input
                                            type="file" accept="image/*"
                                            className="rs-radio-logo__input"
                                            onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                if (f) await onUploadLogo(f);
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="rs-player__info">
                            <div className="rs-player__badges">
                                {radio.isLive ? (
                                    <span className="rs-badge rs-badge--live"><Mic size={10} />EN VIVO</span>
                                ) : (
                                    <span className="rs-badge rs-badge--offline"><Radio size={10} />OFF LINE</span>
                                )}
                                {isOwner && isPlaying && radio.isLive && (
                                    <>
                                        <span className="rs-badge rs-badge--tx"><Mic size={10} />TRANSMITIENDO</span>
                                        {isMicMuted && (
                                            <span className="rs-badge rs-badge--muted"><MicOff size={10} />MIC MUTEADO</span>
                                        )}
                                    </>
                                )}
                                {!isOwner && isPlaying && !streamError && (
                                    <span className="rs-badge rs-badge--listen"><Volume2 size={10} />ESCUCHANDO</span>
                                )}
                            </div>
                            <h3 className="rs-player__name">{radio.name}</h3>
                            {currentTrack ? (
                                <p className="rs-player__track">{currentTrack.title} — {currentTrack.artist}</p>
                            ) : (
                                <p className="rs-player__track" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    {radio.description || (radio.isLive ? 'Transmitiendo en vivo' : 'Radio fuera de línea')}
                                </p>
                            )}
                            {streamError && (
                                <p className="rs-player__error">
                                    <X size={12} style={{ flexShrink: 0 }} />{streamError}
                                </p>
                            )}
                        </div>

                        {/* Acciones */}
                        <div className="rs-player__actions">
                            <button
                                className={`rs-like-btn ${hasLiked ? 'rs-like-btn--on' : 'rs-like-btn--off'}`}
                                onClick={onToggleLike}
                            >
                                <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                                <span>{radio.likes}</span>
                            </button>

                            <div className="rs-listeners">
                                <Users size={18} /><span>{listenerCount}</span>
                            </div>

                            <button className="rs-icon-btn" onClick={onShare} title="Compartir">
                                <Share2 size={20} />
                            </button>

                            {isOwner && (
                                <>
                                    <button className="rs-icon-btn" onClick={onEditRadio} title="Configurar radio">
                                        <Settings size={20} />
                                    </button>
                                    {canTransmit && (
                                        <button
                                            className={`rs-live-btn ${radio.isLive ? 'rs-live-btn--on' : 'rs-live-btn--off'}`}
                                            onClick={onToggleLive}
                                        >
                                            <Mic size={16} style={{ display: 'inline', marginRight: 4 }} />
                                            {radio.isLive ? 'Detener' : 'Iniciar'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Panel de volumen */}
                    {isOwner && canTransmit && radio.isLive && (
                        <div className="rs-volume-panel">
                            <button
                                className="rs-volume-panel__toggle"
                                onClick={() => setShowVolumeControls(!showVolumeControls)}
                            >
                                <span className="rs-volume-panel__toggle-label">
                                    <Volume2 size={18} />Controles de Volumen
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                    {showVolumeControls ? '▼' : '▶'}
                                </span>
                            </button>

                            {showVolumeControls && (
                                <div className="rs-volume-controls">
                                    {/* Mic */}
                                    <div className="rs-volume-row">
                                        <div className="rs-volume-label-row">
                                            <span className="rs-volume-label"><Mic size={16} />Volumen del Micrófono</span>
                                            <span className="rs-volume-value rs-volume-value--mic">
                                                {Math.round(micVolume * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.01" value={micVolume}
                                            className="rs-range"
                                            style={{
                                                background: `linear-gradient(to right,#8b5cf6 0%,#8b5cf6 ${micVolume * 100}%,rgba(255,255,255,0.1) ${micVolume * 100}%,rgba(255,255,255,0.1) 100%)`
                                            }}
                                            onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
                                        />
                                        <div className="rs-range-hints"><span>Silencio</span><span>Máximo</span></div>
                                    </div>

                                    {/* Music */}
                                    <div className="rs-volume-row">
                                        <div className="rs-volume-label-row">
                                            <span className="rs-volume-label"><Music size={16} />Volumen de la Música</span>
                                            <span className="rs-volume-value rs-volume-value--music">
                                                {Math.round(musicVolume * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.01" value={musicVolume}
                                            className="rs-range"
                                            style={{
                                                background: `linear-gradient(to right,#3b82f6 0%,#3b82f6 ${musicVolume * 100}%,rgba(255,255,255,0.1) ${musicVolume * 100}%,rgba(255,255,255,0.1) 100%)`
                                            }}
                                            onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                                        />
                                        <div className="rs-range-hints"><span>Silencio</span><span>Máximo</span></div>
                                    </div>

                                    <div className="rs-volume-tip">
                                        💡 <strong>Tip:</strong> Baja la música al 30–40% cuando hables para que tu voz se escuche clara.
                                    </div>

                                    <div className="rs-volume-presets">
                                        <button
                                            className="rs-preset-btn rs-preset-btn--mic"
                                            onClick={() => { onMicVolumeChange(1); onMusicVolumeChange(0.3); }}
                                        >
                                            🎤 Modo Locutor
                                            <span className="rs-preset-sub">Mic 100% · Música 30%</span>
                                        </button>
                                        <button
                                            className="rs-preset-btn rs-preset-btn--music"
                                            onClick={() => { onMicVolumeChange(0.5); onMusicVolumeChange(1); }}
                                        >
                                            🎵 Modo Musical
                                            <span className="rs-preset-sub">Mic 50% · Música 100%</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado del micrófono */}
                    {isOwner && isPlaying && radio.isLive && (
                        <div className={`rs-alert ${isMicMuted ? 'rs-alert--mic-muted' : 'rs-alert--mic-ok'}`}>
                            <div className="rs-alert__dot" />
                            <p style={{ margin: 0 }}>
                                {isMicMuted
                                    ? '🔇 Tu micrófono está silenciado. Los oyentes no te escuchan.'
                                    : `🎤 Tu micrófono está transmitiendo en vivo a ${listenerCount} oyente${listenerCount !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    )}

                    {!canTransmit && !isOwner && (
                        <div className="rs-alert rs-alert--premium">
                            <Shield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ margin: 0 }}>
                                Estás en modo oyente.{' '}
                                <button>Actualiza a Premium</button>{' '}
                                para transmitir tu propia radio.
                            </p>
                        </div>
                    )}

                    {!radio.isLive && (
                        <div className="rs-alert rs-alert--offline">
                            <Radio size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ margin: 0 }}>
                                {isOwner && canTransmit
                                    ? 'Haz clic en "Iniciar" para comenzar a transmitir en vivo con tu micrófono'
                                    : 'Esta radio está fuera de línea en este momento'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================
    // MODO OYENTE — Estilo estéreo de auto
    // ============================================================
    return (
        <div className="rs-car-stereo" role="region" aria-label="Reproductor de radio">
            {/* Raya superior */}
            <div className="rs-stereo__topbar" />

            {/* Display LCD */}
            <div className="rs-stereo__display">
                {/* Fila superior: badge + nombre + señal */}
                <div className="rs-stereo__display-top">
                    <span className={`rs-stereo__band${radio.isLive ? ' rs-stereo__band--live' : ''}`}>
                        {radio.isLive ? 'LIVE' : 'OFF'}
                    </span>
                    <span className="rs-stereo__freq">{radio.name}</span>
                    <SignalBars strength={radio.isLive ? 5 : 1} />
                </div>

                {/* Ticker con canción actual — toma currentTrack en vivo (now-playing por socket) */}
                <Ticker text={tickerText} paused={!isPlaying} />

                {/* Barra de progreso segmentada — estado de reproducción en vivo */}
                <div className="rs-stereo__progress-row">
                    <span className="rs-stereo__time-label">
                        {isPlaying ? 'LIVE' : '– –'}
                    </span>
                    <SegmentBar
                        current={isPlaying ? Date.now() % 30000 : 0}
                        total={30000}
                        segments={30}
                    />
                    <span className="rs-stereo__time-label rs-stereo__time-label--right">
                        {isPlaying ? '●' : '○'}
                    </span>
                </div>
            </div>

            {/* VU Meter */}
            <VUMeter active={isPlaying && radio.isLive && !streamError} />

            {/* Divisor */}
            <div className="rs-stereo__divider" />

            {/* Controles */}
            <div className="rs-stereo__controls">
                {/* Lado izquierdo: like + listeners */}
                <div className="rs-stereo__side rs-stereo__side--left">
                    <button
                        className={`rs-stereo__btn${hasLiked ? ' rs-stereo__btn--liked' : ''}`}
                        onClick={onToggleLike}
                        aria-label={hasLiked ? 'Quitar like' : 'Dar like'}
                        title={`${radio.likes} likes`}
                    >
                        <Heart size={15} fill={hasLiked ? 'currentColor' : 'none'} />
                    </button>

                    <div className="rs-stereo__listeners" title="Oyentes">
                        <Users size={11} />
                        <span>{listenerCount}</span>
                    </div>
                </div>

                {/* Play / Pause central */}
                <button
                    className={`rs-stereo__play${isPlaying ? ' rs-stereo__play--playing' : ''}`}
                    onClick={onPlayPause}
                    disabled={!radio.isLive || isLoadingStream}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isLoadingStream ? (
                        <div className="rs-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    ) : isPlaying ? (
                        <Pause size={22} />
                    ) : (
                        <Play size={22} style={{ marginLeft: 2 }} />
                    )}
                </button>

                {/* Lado derecho: compartir + error */}
                <div className="rs-stereo__side rs-stereo__side--right">
                    <button
                        className="rs-stereo__btn"
                        onClick={onShare}
                        aria-label="Compartir"
                    >
                        <Share2 size={15} />
                    </button>

                    {streamError && (
                        <button
                            className="rs-stereo__btn"
                            style={{ borderColor: 'rgba(255,51,102,0.4)', color: '#ff3366' }}
                            title={streamError}
                            aria-label="Error de conexión"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Divisor */}
            <div className="rs-stereo__divider" />

            {/* Info inferior */}
            {radio.isLive ? (
                <div className="rs-stereo__info">
                    <span className="rs-stereo__radio-name">{radio.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`rs-stereo__status-dot${radio.isLive ? ' rs-stereo__status-dot--live' : ' rs-stereo__status-dot--offline'}`} />
                        <span className="rs-stereo__status-label">
                            {isPlaying ? 'Escuchando' : radio.isLive ? 'En vivo' : 'Fuera de línea'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="rs-stereo__offline">
                    <div className="rs-stereo__offline-icon">
                        <Radio size={32} />
                    </div>
                    <p className="rs-stereo__offline-title">Radio fuera de línea</p>
                    <p className="rs-stereo__offline-sub">
                        {radio.description || 'El DJ no está transmitiendo en este momento'}
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================================
// Chat
// ============================================================
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
    radioId, messages, onSendMessage, onDeleteMessage,
    isFrozen, canModerate, onToggleFreeze, listeners, currentUserId
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

    const confirmDelete = (id: string) => {
        Swal.fire({
            icon: 'question', title: '¿Eliminar mensaje?',
            text: 'Esta acción no se puede deshacer',
            background: '#1a1a2e', color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
            confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar'
        }).then((r) => { if (r.isConfirmed) onDeleteMessage(id); });
    };

    return (
        <div className="rs-chat">
            <div className="rs-chat__header">
                <h2 className="rs-chat__title">
                    <Users size={24} />
                    <span className="rs-chat__title-text--sm">Chat</span>
                    <span className="rs-chat__title-text--lg">Chat en Vivo</span>
                </h2>
                <div className="rs-chat__meta">
                    <span className="rs-chat__listeners">
                        {listeners > 0 ? `${listeners} oyentes` : 'Sin oyentes'}
                    </span>
                    {canModerate && (
                        <button
                            className={`rs-freeze-btn ${isFrozen ? 'rs-freeze-btn--frozen' : 'rs-freeze-btn--active'}`}
                            onClick={onToggleFreeze}
                        >
                            {isFrozen
                                ? <><Ban size={14} /><span className="rs-freeze-btn__label">Congelado</span></>
                                : <><Shield size={14} /><span className="rs-freeze-btn__label">Activo</span></>}
                        </button>
                    )}
                </div>
            </div>

            {isFrozen && (
                <div className="rs-chat__frozen-notice">
                    <Ban size={16} style={{ flexShrink: 0 }} />
                    {canModerate
                        ? 'Chat congelado. Solo tú puedes escribir.'
                        : 'El chat está congelado por el moderador.'}
                </div>
            )}

            <div className="rs-chat__messages">
                {messages.length === 0 ? (
                    <div className="rs-chat__empty">
                        <Users size={48} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <p>No hay mensajes aún</p>
                        <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Sé el primero en chatear</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className="rs-msg">
                            <div className="rs-msg__header">
                                {msg.userAvatar && (
                                    <img className="rs-msg__avatar" src={msg.userAvatar} alt={msg.userName} />
                                )}
                                <span className="rs-msg__name">{msg.userName}</span>
                                <span className="rs-msg__time">
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                                {canModerate && (
                                    <button className="rs-msg__del" onClick={() => confirmDelete(msg._id)} title="Eliminar mensaje">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="rs-msg__text">{msg.text}</p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="rs-chat__input-row">
                <input
                    className="rs-chat__input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isFrozen && !canModerate ? 'Chat congelado...' : 'Escribe un mensaje...'}
                    disabled={isFrozen && !canModerate}
                />
                <button
                    className="rs-chat__send"
                    onClick={handleSend}
                    disabled={(isFrozen && !canModerate) || !inputValue.trim()}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

// ============================================================
// GuestControl
// ============================================================
interface GuestControlProps {
    radioId: string;
    guestCode?: string;
    onGenerateCode: () => void;
    allowGuests: boolean;
}

const GuestControl: React.FC<GuestControlProps> = ({ radioId, guestCode, onGenerateCode, allowGuests }) => {
    const [copied, setCopied] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const handleCopy = () => {
        if (!guestCode) return;
        navigator.clipboard.writeText(guestCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Swal.fire({
            icon: 'success', title: '¡Código copiado!',
            text: 'Comparte este código con tus invitados',
            background: '#1a1a2e', color: '#fff',
            confirmButtonColor: '#8b5cf6', timer: 1500, showConfirmButton: false
        });
    };

    return (
        <div className="rs-guest">
            <h2 className="rs-guest__title"><Mic size={24} />Control de Invitados</h2>
            <div className="rs-guest__box">
                <p className="rs-guest__desc">
                    Genera un código para que otros puedan conectarse como invitados y hablar en tu radio.
                </p>
                {!guestCode ? (
                    <button className="rs-guest__generate" onClick={onGenerateCode}>
                        Generar Código de Invitado
                    </button>
                ) : (
                    <>
                        <div className="rs-guest__code-row">
                            <input
                                className="rs-guest__code-input"
                                type={showCode ? 'text' : 'password'}
                                value={guestCode}
                                readOnly
                            />
                            <button className="rs-guest__icon-btn" onClick={() => setShowCode(!showCode)}>
                                {showCode ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button className="rs-guest__copy" onClick={handleCopy}>
                                {copied ? <Check size={18} /> : 'Copiar'}
                            </button>
                        </div>
                        <p className="rs-guest__hint">
                            Comparte este código con tus invitados para que puedan conectarse
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

// ============================================================
// COMPONENTE PRINCIPAL — RadioSystem
// ============================================================
const RadioSystem: React.FC = () => {
    const params = useParams();
    const radioId = params?.id as string;

    const { user, loginUser } = useContext(UserContext);
    const { agregarCancion } = useReproductor();

    const getToken = (): string | null => {
        if (user?.token) return user.token;
        const t = localStorage.getItem('token');
        if (t) return t;
        try {
            const u = localStorage.getItem('user');
            return u ? JSON.parse(u).token || null : null;
        } catch { return null; }
    };

    const {
        radio, tracks, currentTrack, isPlaying, isMicMuted,
        micVolume, musicVolume, messages, isChatFrozen, hasLiked, loading,
        setCurrentTrack, setTracks, setMicVolume, setMusicVolume, setIsChatFrozen,
        handleUpdateRadio, handleDeleteRadio, handleToggleLive, handleToggleMic,
        handlePlayPause, handleDeleteTrack, handleUploadTrack, handleSendMessage,
        handleDeleteMessage, handleToggleLike, handleGenerateGuestCode,
        handleUpdateProfile, displayRadio, isOwner, canTransmit, canModerate,
    } = useRadioSystem({ radioId, user, getToken, loginUser });

  const {
    isLoadingStream, streamError, listenerCount, nowPlaying, emitNowPlaying,
    isSharingSystemAudio, systemAudioError, shareSystemAudio, stopSystemAudio
} = useRadioStream({
    sessionId: radioId,
    isOwner,
    isPlaying,
    micVolume,
    musicVolume,
    isMicMuted
});
    // NUEVO: cuando el OYENTE recibe "now playing" por socket, actualiza su
    // currentTrack para que el Player (modo estéreo) muestre la canción que
    // está sonando en vivo, en tiempo real.
    useEffect(() => {
        if (isOwner) return; // el dueño ya maneja su propio currentTrack localmente
        if (!nowPlaying) return;

        setCurrentTrack(nowPlaying.id ? {
            _id: nowPlaying.id,
            radioId,
            title: nowPlaying.titulo || '',
            artist: nowPlaying.artista || '',
            url: '',
            duration: nowPlaying.duration || 0,
            order: 0
        } : null);
    }, [nowPlaying, isOwner, radioId, setCurrentTrack]);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showRadioSettingsModal, setShowRadioSettingsModal] = useState(false);
    const [displayLogo, setDisplayLogo] = useState(radio?.logo || '');

    const handleUpdateRadioLogo = async (avatarUrl: string) => {
        const token = getToken();
        if (!token || !isOwner) return;
        try {
            const fd = new FormData();
            fd.append('logo', avatarUrl);
            await handleUpdateRadio(fd);
            Swal.fire({
                icon: 'success', title: '¡Logo actualizado!',
                text: 'El logo de tu radio se actualizó con tu nuevo avatar',
                background: '#1a1a2e', color: '#fff',
                confirmButtonColor: '#8b5cf6', timer: 2000, showConfirmButton: false
            });
        } catch (err) { console.error('Error al actualizar logo de radio:', err); }
    };

    const handleUploadLogo = async (file: File) => {
        if (!radio) return;
        const token = getToken();
        if (!token || !isOwner) return;

        Swal.fire({
            title: 'Subiendo logo...', text: 'Por favor espera',
            background: '#1a1a2e', color: '#fff',
            allowOutsideClick: false, didOpen: () => Swal.showLoading(),
        });

        try {
            const cfd = new FormData();
            cfd.append('file', file);
            cfd.append('upload_preset', 'mi_upload_preset');
            const cRes = await fetch('https://api.cloudinary.com/v1_1/dplncudbq/image/upload', {
                method: 'POST', body: cfd
            });
            const cData = await cRes.json();

            if (!cRes.ok) {
                Swal.fire({
                    icon: 'error', title: 'Error Cloudinary',
                    text: cData.error?.message || 'Error al subir imagen',
                    background: '#1a1a2e', color: '#fff', confirmButtonColor: '#8b5cf6'
                });
                return;
            }

            const logoUrl = cData.secure_url;
            setDisplayLogo(logoUrl);

            const fd = new FormData();
            fd.append('logo', logoUrl);
            const updated = await api.updateRadio(radio._id, fd, token);
            if (!updated) throw new Error('Error actualizando radio en backend');

            Swal.fire({
                icon: 'success', title: '¡Logo actualizado!',
                text: 'El logo de tu radio se actualizó correctamente',
                background: '#1a1a2e', color: '#fff',
                confirmButtonColor: '#8b5cf6', timer: 2000, showConfirmButton: false
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            Swal.fire({
                icon: 'error', title: 'Error', text: msg,
                background: '#1a1a2e', color: '#fff', confirmButtonColor: '#8b5cf6'
            });
        }
    };

    const handlePlayTrackGlobal = (track: Track) => {
        const song: Cancion = {
            id: track._id,
            titulo: track.title,
            artista: track.artist,
            url: track.url,
            cover: radio?.logo || './assets/zoonito.jpg',
        };
        agregarCancion(song);
        setCurrentTrack(track);
    };

    if (loading) {
        return (
            <div className="rs-loading">
                <div className="rs-loading__content">
                    <div className="rs-loading__spinner" />
                    <p className="rs-loading__text">Cargando radio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="radio-root">
            <div className="rs-page">
                <div className="rs-container">

                    {/* Header */}
                    <header className="rs-header">
                        <div className="rs-header__title-wrap">
                            <h1 className="rs-header__title">
                                <div className="rs-header__title-icon">
                                    <Music size={24} color="#fff" />
                                </div>
                                <span className="rs-header__title-text">{displayRadio.name}</span>
                            </h1>
                            <p className="rs-header__subtitle">Sistema completo de transmisión y gestión</p>
                        </div>

                        {user && (
                            <button className="rs-profile-btn" onClick={() => setShowProfileModal(true)}>
                                <div className="rs-profile-avatar">
                                    {user.avatar
                                        ? <img src={user.avatar} alt={user.name} />
                                        : <User size={18} color="#fff" />}
                                </div>
                                <div className="rs-profile-info">
                                    <p className="rs-profile-name">{user.name}</p>
                                    <p className="rs-profile-plan">{user.isPremium ? '👑 Premium' : '🎧 Gratis'}</p>
                                </div>
                                <User size={18} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
                            </button>
                        )}
                    </header>

                    {/* Contenido */}
                    <div className="rs-stack">
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
                            onEditRadio={() => setShowRadioSettingsModal(true)}
                            onToggleLike={handleToggleLike}
                            onToggleLive={handleToggleLive}
                            onUploadLogo={handleUploadLogo}
                            hasLiked={hasLiked}
                            isOwner={isOwner}
                            canTransmit={canTransmit}
                            user={user || undefined}
                            owner={displayRadio.owner || user || undefined}
                            isLoadingStream={isLoadingStream}
                            streamError={streamError}
                            listenerCount={listenerCount}
                        />

                        <div className="rs-grid-2">
                            {(isOwner || canTransmit) && (
                                <>
                                    <MusicaPlayer
                                        radioId={radioId}
                                        cancionesBackend={tracks}
                                        onCancionChange={(cancion) => {
                                            setCurrentTrack(cancion ? {
                                                _id: cancion.id,
                                                radioId,
                                                title: cancion.titulo,
                                                artist: cancion.artista,
                                                url: cancion.url,
                                                duration: cancion.duracion || 0,
                                                order: 0
                                            } : null);
                                        }}
                                        // NUEVO: emite por socket cada cambio de canción / play / pause
                                        onNowPlayingChange={emitNowPlaying}
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

                                    <RadioYoutube
                                        radioId={radioId}
                                        isOwner={isOwner}
                                        isLive={radio?.isLive || false}
                                        musicVolume={musicVolume}
                                        onMusicVolumeChange={setMusicVolume}
                                        onTrackChange={(track) => {
                                            if (track) {
                                                setCurrentTrack({
                                                    _id: track.id,
                                                    radioId,
                                                    title: track.title,
                                                    artist: 'YouTube',
                                                    url: track.url,
                                                    duration: track.duration,
                                                    order: 0
                                                });
                                            }
                                        }}
                                    />
                                </>
                            )}

                            <div className={`rs-chat-wrapper ${!(isOwner || canTransmit) ? 'rs-grid-2--full' : ''}`}>
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

            {/* Modales */}
            {showProfileModal && user && (
                <ProfileModal
                    user={user}
                    isOwner={isOwner}
                    radioId={radioId}
                    onClose={() => setShowProfileModal(false)}
                    onUpdate={handleUpdateProfile}
                    onUpdateRadioLogo={handleUpdateRadioLogo}
                />
            )}

            {showShareModal && (
                <ShareModal
                    radio={displayRadio}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {showRadioSettingsModal && isOwner && (
                <RadioSettingsModal
                    radio={displayRadio}
                    onClose={() => setShowRadioSettingsModal(false)}
                    onUpdate={handleUpdateRadio}
                    onDelete={handleDeleteRadio}
                />
            )}
        </div>
    );
};

export default RadioSystem;
