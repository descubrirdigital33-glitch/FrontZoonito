// 'use client';
// import { useEffect, useState, useContext } from 'react';
// import { UserContext } from '../context/UserContext';
// import { Heart, Star, Search, X, Share2, TrendingUp, Clock, Sparkles, Music, Flame, Download } from 'lucide-react';
// import { Cancion } from "../components/Reproductor";
// import { useReproductor } from '../context/ReproductorContext';
// import Link from 'next/link';
// import Head from 'next/head';

// interface Music {
//     _id: string;
//     title: string;
//     artist: string;
//     album?: string;
//     genre?: string;
//     soloist?: boolean;
//     likes?: number;
//     rating?: number;
//     cover?: string;
//     coverUrl?: string;
//     avatarArtist?: string;
//     audioUrl?: string;
//     likedByUser?: boolean;
//     userRating?: number;
//     avance?: boolean;
//     idMusico?: string;
//     playCount?: number;
//     releaseDate?: string;
//     createdAt?: string;
// }

// const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae', 'efects'];

// interface Section {
//     id: string;
//     name: string;
//     icon: React.ReactNode;
//     color: string;
// }

// const SECTIONS: Section[] = [
//     { id: 'todas', name: 'Todas', icon: <Music className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
//     { id: 'avances', name: 'Avances', icon: <Sparkles className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
//     { id: 'nuevo', name: 'Lo Nuevo', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
//     { id: 'escuchado', name: 'Más Escuchado', icon: <TrendingUp className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
//     { id: 'calificado', name: 'Mejor Calificado', icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-amber-500' },
// ];

// export default function MusicAll() {
//     const [musics, setMusics] = useState<Music[]>([]);
//     const [filteredMusics, setFilteredMusics] = useState<Music[]>([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [selectedGenre, setSelectedGenre] = useState('Todos');
//     const [selectedSection, setSelectedSection] = useState('todas');
//     const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
//     const [hoverRating, setHoverRating] = useState(0);
//     const user = useContext(UserContext);

//     const { lista, agregarCancion } = useReproductor();

//     const formatLikes = (likes: number): string => {
//         if (likes >= 1000) {
//             const k = Math.floor(likes / 100) / 10;
//             return `${k}k`;
//         }
//         return likes.toString();
//     };

//     const extractUserId = (userContext: unknown): string | null => {
//         if (!userContext || typeof userContext !== 'object') return null;
//         const ctx = userContext as { user?: { _id?: string } };
//         return ctx?.user?._id || null;
//     };

//     const isNewRelease = (music: Music): boolean => {
//         const releaseDate = new Date(music.createdAt || music.releaseDate || '2000-01-01');
//         const now = new Date();
//         const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//         return diffDays <= 7;
//     };

//     useEffect(() => {
//         const fetchMusic = async () => {
//             try {
//                 const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
//                 if (!res.ok) throw new Error('Error al obtener música');
//                 let data: Music[] = await res.json();

//                 const userId = extractUserId(user);

//                 if (userId) {
//                     try {
//                         const likesRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-likes/${userId}`);
//                         const ratingsRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-ratings/${userId}`);

//                         if (likesRes.ok && ratingsRes.ok) {
//                             const userLikes = await likesRes.json();
//                             const userRatings = await ratingsRes.json();

//                             data = data.map(m => ({
//                                 ...m,
//                                 likedByUser: userLikes.includes(m._id),
//                                 userRating: userRatings[m._id] || 0
//                             }));
//                         }
//                     } catch (err) {
//                         console.warn('⚠️ No se pudieron cargar likes/ratings del usuario:', err);
//                     }
//                 }

//                 setMusics(data);
//                 setFilteredMusics(data);
//             } catch (err) {
//                 console.error('Error cargando música:', err);
//             }
//         };

//         fetchMusic();
//     }, [user]);

//     useEffect(() => {
//         let filtered = [...musics];

//         if (searchQuery) {
//             filtered = filtered.filter(m =>
//                 m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 m.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                 m.album?.toLowerCase().includes(searchQuery.toLowerCase())
//             );
//         }

//         if (selectedGenre !== 'Todos') {
//             filtered = filtered.filter(m => m.genre === selectedGenre);
//         }

//         switch (selectedSection) {
//             case 'avances':
//                 filtered = filtered.filter(m => m.avance === true);
//                 break;
//             case 'nuevo':
//                 filtered = filtered.filter(m => isNewRelease(m));
//                 filtered.sort((a, b) => {
//                     const dateA = new Date(a.createdAt || a.releaseDate || '2000-01-01').getTime();
//                     const dateB = new Date(b.createdAt || b.releaseDate || '2000-01-01').getTime();
//                     return dateB - dateA;
//                 });
//                 break;
//             case 'escuchado':
//                 filtered = filtered.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
//                 break;
//             case 'calificado':
//                 filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//                 break;
//         }

//         setFilteredMusics(filtered);
//     }, [musics, searchQuery, selectedGenre, selectedSection]);

//     const toggleLike = async (musicId: string) => {
//         try {
//             const music = musics.find(m => m._id === musicId);
//             const isLiked = music?.likedByUser;
//             const userId = extractUserId(user);

//             if (!userId) {
//                 setMusics(prev => prev.map(m =>
//                     m._id === musicId
//                         ? {
//                             ...m,
//                             likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
//                             likedByUser: !isLiked
//                         }
//                         : m
//                 ));
//                 return;
//             }

//             const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/like', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ musicId, userId }),
//             });

//             if (res.ok) {
//                 setMusics(prev => prev.map(m =>
//                     m._id === musicId
//                         ? {
//                             ...m,
//                             likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
//                             likedByUser: !isLiked
//                         }
//                         : m
//                 ));
//             }
//         } catch (err) {
//             console.error('❌ Error:', err);
//         }
//     };

//     const submitRating = async (musicId: string, value: number) => {
//         const userId = extractUserId(user);

//         if (!userId) {
//             const { default: Swal } = await import('sweetalert2');
//             Swal.fire({
//                 icon: 'warning',
//                 title: 'Inicia sesión',
//                 text: 'Debes iniciar sesión para calificar canciones',
//                 background: '#1a1a2e',
//                 color: '#fff',
//                 confirmButtonColor: '#ec4899',
//                 confirmButtonText: 'Entendido'
//             });
//             setShowRatingModal(null);
//             return;
//         }

//         try {
//             const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/rate', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ musicId, userId, rating: value }),
//             });

//             if (res.ok) {
//                 const data = await res.json();
//                 setMusics(prev => prev.map(m =>
//                     m._id === musicId
//                         ? { ...m, rating: data.newAverage, userRating: value }
//                         : m
//                 ));
//                 setShowRatingModal(null);
//             }
//         } catch (err) {
//             console.error('❌ Error rating:', err);
//         }
//     };

//     const shareMusic = async (music: Music) => {
//         if (typeof window === 'undefined' || typeof navigator === 'undefined') {
//             console.error('Esta función solo funciona en el navegador');
//             return;
//         }

//         const baseUrl = window.location.origin;
//         const shareUrl = `${baseUrl}/fanpage/${music.artist.replace(/\s+/g, '-').toLowerCase()}`;
//         const imageUrl = music.coverUrl || music.cover || `${baseUrl}/assets/zoonito.jpg`;

//         const whatsappText = `🎵 *${music.title}* - ${music.artist}
// ${music.album ? `📀 Álbum: ${music.album}` : ''}
// ⭐ Rating: ${music.rating?.toFixed(1) || '0.0'}
// ❤️ ${formatLikes(music.likes || 0)} likes
// 🎧 ${music.playCount ? `${formatLikes(music.playCount)} reproducciones` : ''}

// 🔗 Escúchalo aquí: ${shareUrl}

// 📸 ${imageUrl}`;

//         const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
//         const whatsappMobileUrl = `whatsapp://send?text=${encodeURIComponent(whatsappText)}`;

//         try {
//             const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

//             if (navigator.share) {
//                 const shareData = {
//                     title: `${music.title} - ${music.artist}`,
//                     text: whatsappText.replace(/\*/g, ''),
//                     url: shareUrl
//                 };

//                 if (navigator.canShare && navigator.canShare(shareData)) {
//                     try {
//                         await navigator.share(shareData);
//                         return;
//                     } catch (err) {
//                         if ((err as Error).name !== 'AbortError') {
//                             console.log('Web Share API cancelado, usando alternativa');
//                         }
//                     }
//                 }
//             }

//             if (isMobile) {
//                 window.location.href = whatsappMobileUrl;
//                 setTimeout(() => {
//                     window.location.href = whatsappWebUrl;
//                 }, 1500);
//             } else {
//                 window.open(whatsappWebUrl, '_blank');
//             }

//         } catch (err) {
//             if ((err as Error).name !== 'AbortError') {
//                 console.error('Error compartiendo:', err);
//                 const { default: Swal } = await import('sweetalert2');
//                 try {
//                     await navigator.clipboard.writeText(whatsappText);
//                     Swal.fire({
//                         icon: 'success',
//                         title: '¡Copiado al portapapeles!',
//                         html: `<div class="text-left"><p>Información de la canción copiada:</p><br/><strong>${music.title}</strong><br/>${music.artist}<br/><span class="text-xs text-gray-400">${shareUrl}</span></div>`,
//                         background: '#1a1a2e',
//                         color: '#fff',
//                         confirmButtonColor: '#ec4899',
//                         timer: 3000,
//                         showConfirmButton: false
//                     });
//                 } catch (clipErr) {
//                     console.error('Error al copiar:', clipErr);
//                 }
//             }
//         }
//     };

//     const addToPlaylist = (music: Music) => {
//         const nueva: Cancion = {
//             id: music._id,
//             titulo: music.title,
//             artista: music.artist,
//             url: music.audioUrl || '',
//             cover: music.coverUrl || music.cover || './assets/zoonito.jpg',
//         };

//         const yaExiste = lista.some(c => c.id === nueva.id);
//         if (!yaExiste) {
//             agregarCancion(nueva);
//         }
//     };

//     const downloadMusic = async (music: Music) => {
//         if (!music.audioUrl) {
//             const { default: Swal } = await import('sweetalert2');
//             Swal.fire({
//                 icon: 'error',
//                 title: 'No disponible',
//                 text: 'Esta canción no tiene audio disponible para descargar',
//                 background: '#1a1a2e',
//                 color: '#fff',
//                 confirmButtonColor: '#ec4899',
//             });
//             return;
//         }

//         try {
//             // Construir URL completa si es relativa
//             const audioUrl = music.audioUrl.startsWith('http')
//                 ? music.audioUrl
//                 : `http://localhost:5000${music.audioUrl.startsWith('/') ? '' : '/'}${music.audioUrl}`;

//             // Descargar el audio con modo no-cors para evitar problemas de CORS
//             const audioResponse = await fetch(audioUrl, {
//                 mode: 'cors',
//                 credentials: 'omit'
//             });

//             if (!audioResponse.ok) {
//                 throw new Error(`Error al descargar audio: ${audioResponse.status}`);
//             }

//             const audioBlob = await audioResponse.blob();
//             const audioArrayBuffer = await audioBlob.arrayBuffer();

//             // Descargar la imagen de portada si existe
//             let coverImageBuffer = null;

//             // Intentar con diferentes fuentes de imagen
//             const imageSources = [
//                 music.avatarArtist,
//                 music.coverUrl,
//                 music.cover
//             ].filter(Boolean);
//             for (const imageSource of imageSources) {
//                 if (!imageSource) continue; // Skip si es undefined/null

//                 try {
//                     // Construir URL completa si es relativa
//                     const imageUrl = imageSource.startsWith('http')
//                         ? imageSource
//                         : `http://localhost:5000${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;

//                     const imageResponse = await fetch(imageUrl, {
//                         mode: 'cors',
//                         credentials: 'omit'
//                     });

//                     if (imageResponse.ok) {
//                         const imageBlob = await imageResponse.blob();
//                         // Validar que la imagen no sea demasiado grande (máximo 5MB) y que sea una imagen
//                         if (imageBlob.size <= 5 * 1024 * 1024 && imageBlob.type.startsWith('image/')) {
//                             coverImageBuffer = await imageBlob.arrayBuffer();
//                             console.log('✅ Imagen de portada cargada correctamente');
//                             break; // Si se cargó correctamente, salir del loop
//                         }
//                     }
//                 } catch (imgErr) {
//                     console.warn('⚠️ No se pudo cargar imagen desde:', imageSource, imgErr);
//                     continue; // Intentar con la siguiente fuente
//                 }
//             }

//             // Si no se pudo cargar ninguna imagen, intentar con la imagen por defecto
//             if (!coverImageBuffer) {
//                 try {
//                     const defaultImageUrl = '/assets/zoonito.jpg';
//                     const defaultResponse = await fetch(defaultImageUrl, {
//                         mode: 'cors',
//                         credentials: 'omit'
//                     });

//                     if (defaultResponse.ok) {
//                         const defaultBlob = await defaultResponse.blob();
//                         if (defaultBlob.size <= 5 * 1024 * 1024 && defaultBlob.type.startsWith('image/')) {
//                             coverImageBuffer = await defaultBlob.arrayBuffer();
//                             console.log('✅ Imagen por defecto cargada');
//                         }
//                     }
//                 } catch (defaultErr) {
//                     console.warn('⚠️ No se pudo cargar la imagen por defecto:', defaultErr);
//                 }
//             }

//             // Determinar el formato del archivo
//             const fileExtension = music.audioUrl.toLowerCase().endsWith('.m4a') ? 'm4a' : 'mp3';

//             if (fileExtension === 'mp3' && coverImageBuffer) {
//                 // Calcular el tamaño correcto del tag ID3v2.3
//                 const mimeType = 'image/jpeg';
//                 const mimeBytes = new TextEncoder().encode(mimeType);

//                 const id3Size = 10 + // Header
//                     (music.title ? 10 + 1 + new TextEncoder().encode(music.title).length : 0) + // TIT2
//                     (music.artist ? 10 + 1 + new TextEncoder().encode(music.artist).length : 0) + // TPE1
//                     (music.album ? 10 + 1 + new TextEncoder().encode(music.album).length : 0) + // TALB
//                     (music.genre ? 10 + 1 + new TextEncoder().encode(music.genre).length : 0) + // TCON
//                     (coverImageBuffer ? 10 + 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength : 0); // APIC

//                 const id3 = new ArrayBuffer(id3Size);
//                 const view = new DataView(id3);
//                 let offset = 0;

//                 // ID3v2 Header
//                 view.setUint8(offset++, 0x49); // 'I'
//                 view.setUint8(offset++, 0x44); // 'D'
//                 view.setUint8(offset++, 0x33); // '3'
//                 view.setUint8(offset++, 0x03); // Version 2.3
//                 view.setUint8(offset++, 0x00); // Revision
//                 view.setUint8(offset++, 0x00); // Flags
//                 // Size (synchsafe)
//                 const size = id3Size - 10;
//                 view.setUint8(offset++, (size >> 21) & 0x7F);
//                 view.setUint8(offset++, (size >> 14) & 0x7F);
//                 view.setUint8(offset++, (size >> 7) & 0x7F);
//                 view.setUint8(offset++, size & 0x7F);

//                 // Helper function to write text frame
//                 const writeTextFrame = (frameId: string, text: string) => {
//                     const textBytes = new TextEncoder().encode(text);
//                     const frameSize = 1 + textBytes.length;

//                     // Frame header
//                     for (let i = 0; i < 4; i++) {
//                         view.setUint8(offset++, frameId.charCodeAt(i));
//                     }
//                     view.setUint32(offset, frameSize);
//                     offset += 4;
//                     view.setUint16(offset, 0); // Flags
//                     offset += 2;

//                     // Text encoding (0 = ISO-8859-1)
//                     view.setUint8(offset++, 0x00);

//                     // Text
//                     const arr = new Uint8Array(id3, offset, textBytes.length);
//                     arr.set(textBytes);
//                     offset += textBytes.length;
//                 };

//                 // Write frames
//                 if (music.title) writeTextFrame('TIT2', music.title);
//                 if (music.artist) writeTextFrame('TPE1', music.artist);
//                 if (music.album) writeTextFrame('TALB', music.album);
//                 if (music.genre) writeTextFrame('TCON', music.genre);

//                 // APIC frame (cover image)
//                 if (coverImageBuffer) {
//                     const frameSize = 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength;

//                     // Frame header
//                     view.setUint8(offset++, 0x41); // 'A'
//                     view.setUint8(offset++, 0x50); // 'P'
//                     view.setUint8(offset++, 0x49); // 'I'
//                     view.setUint8(offset++, 0x43); // 'C'
//                     view.setUint32(offset, frameSize);
//                     offset += 4;
//                     view.setUint16(offset, 0); // Flags
//                     offset += 2;

//                     // Text encoding
//                     view.setUint8(offset++, 0x00);

//                     // MIME type
//                     const mimeArr = new Uint8Array(id3, offset, mimeBytes.length);
//                     mimeArr.set(mimeBytes);
//                     offset += mimeBytes.length;
//                     view.setUint8(offset++, 0x00); // Null terminator

//                     // Picture type (3 = front cover)
//                     view.setUint8(offset++, 0x03);

//                     // Description (empty)
//                     view.setUint8(offset++, 0x00);

//                     // Image data
//                     const imgArr = new Uint8Array(id3, offset, coverImageBuffer.byteLength);
//                     imgArr.set(new Uint8Array(coverImageBuffer));
//                     offset += coverImageBuffer.byteLength;
//                 }

//                 // Combine ID3 tag with audio
//                 const combined = new Uint8Array(id3.byteLength + audioArrayBuffer.byteLength);
//                 combined.set(new Uint8Array(id3), 0);
//                 combined.set(new Uint8Array(audioArrayBuffer), id3.byteLength);

//                 const taggedBlob = new Blob([combined], { type: 'audio/mpeg' });

//                 // Descargar
//                 const url = window.URL.createObjectURL(taggedBlob);
//                 const a = document.createElement('a');
//                 a.href = url;
//                 a.download = `${music.artist} - ${music.title}.mp3`;
//                 document.body.appendChild(a);
//                 a.click();
//                 window.URL.revokeObjectURL(url);
//                 document.body.removeChild(a);
//             } else {
//                 // Para M4A o MP3 sin metadata
//                 const url = window.URL.createObjectURL(audioBlob);
//                 const a = document.createElement('a');
//                 a.href = url;
//                 a.download = `${music.artist} - ${music.title}.${fileExtension}`;
//                 document.body.appendChild(a);
//                 a.click();
//                 window.URL.revokeObjectURL(url);
//                 document.body.removeChild(a);
//             }

//             const { default: Swal } = await import('sweetalert2');
//             Swal.fire({
//                 icon: 'success',
//                 title: '¡Descargando!',
//                 text: `${music.title} - ${music.artist}${coverImageBuffer ? ' (con carátula)' : ''}`,
//                 background: '#1a1a2e',
//                 color: '#fff',
//                 confirmButtonColor: '#ec4899',
//                 timer: 2000,
//                 showConfirmButton: false
//             });
//         } catch (err) {
//             console.error('Error descargando:', err);

//             // Si falla la descarga con metadata, intentar descarga directa
//             try {
//                 const audioUrl = music.audioUrl!.startsWith('http')
//                     ? music.audioUrl
//                     : `http://localhost:5000${music.audioUrl!.startsWith('/') ? '' : '/'}${music.audioUrl}`;

//                 // Descarga directa usando un link temporal
//                 const a = document.createElement('a');
//                 a.href = audioUrl;
//                 a.download = `${music.artist} - ${music.title}.mp3`;
//                 a.target = '_blank';
//                 document.body.appendChild(a);
//                 a.click();
//                 document.body.removeChild(a);

//                 const { default: Swal } = await import('sweetalert2');
//                 Swal.fire({
//                     icon: 'info',
//                     title: 'Descarga iniciada',
//                     text: `${music.title} - ${music.artist} (sin metadata)`,
//                     background: '#1a1a2e',
//                     color: '#fff',
//                     confirmButtonColor: '#ec4899',
//                     timer: 2000,
//                     showConfirmButton: false
//                 });
//             } catch (directErr) {
//                 console.error('Error en descarga directa:', directErr);
//                 const { default: Swal } = await import('sweetalert2');
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Error',
//                     text: 'No se pudo descargar la canción. Verifica que el archivo existe y está disponible.',
//                     background: '#1a1a2e',
//                     color: '#fff',
//                     confirmButtonColor: '#ec4899',
//                 });
//             }
//         }
//     };

//     return (
//         <>
//             <Head>
//                 <meta property="og:title" content="MusicAll - Descubre Nueva Música" />
//                 <meta property="og:description" content="Explora el mejor catálogo de música. Avances exclusivos, lo nuevo y lo más escuchado." />
//                 <meta property="og:image" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/assets/zoonito.jpg`} />
//                 <meta property="og:type" content="music.playlist" />
//                 <meta name="twitter:card" content="summary_large_image" />
//             </Head>

//             <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black">
//                 <div className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-pink-500/20">
//                     <div className="max-w-7xl mx-auto p-4">
//                         <div className="flex items-center justify-between mb-4">
//                             <div className="flex items-center gap-3">
//                                 <Music className="w-8 h-8 text-pink-500" />
//                                 <h1 className="text-3xl font-bold text-white">
//                                     <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
//                                         MusicAll
//                                     </span>
//                                 </h1>
//                             </div>
//                             <Link
//                                 href="/"
//                                 className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition"
//                             >
//                                 ← Inicio
//                             </Link>
//                         </div>

//                         <div className="relative mb-4">
//                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                             <input
//                                 type="text"
//                                 placeholder="Buscar por canción, artista o álbum..."
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                                 className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-md rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
//                             />
//                             {searchQuery && (
//                                 <button
//                                     onClick={() => setSearchQuery('')}
//                                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
//                                 >
//                                     <X className="w-5 h-5" />
//                                 </button>
//                             )}
//                         </div>

//                         <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
//                             {SECTIONS.map(section => (
//                                 <button
//                                     key={section.id}
//                                     onClick={() => setSelectedSection(section.id)}
//                                     className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-300 ${selectedSection === section.id
//                                         ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
//                                         : 'bg-white/10 text-white hover:bg-white/20'
//                                         }`}
//                                 >
//                                     {section.icon}
//                                     {section.name}
//                                 </button>
//                             ))}
//                         </div>

//                         <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
//                             <button
//                                 onClick={() => setSelectedGenre('Todos')}
//                                 className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedGenre === 'Todos'
//                                     ? 'bg-pink-500 text-white'
//                                     : 'bg-white/10 hover:bg-white/20 text-white'
//                                     }`}
//                             >
//                                 Todos los géneros
//                             </button>
//                             {GENRES.map(genre => (
//                                 <button
//                                     key={genre}
//                                     onClick={() => setSelectedGenre(genre)}
//                                     className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedGenre === genre
//                                         ? 'bg-pink-500 text-white'
//                                         : 'bg-white/10 hover:bg-white/20 text-white'
//                                         }`}
//                                 >
//                                     {genre}
//                                 </button>
//                             ))}
//                         </div>

//                         <div className="flex items-center justify-between text-sm text-gray-300 mt-4">
//                             <span>{filteredMusics.length} canciones</span>
//                             {(searchQuery || selectedGenre !== 'Todos') && (
//                                 <button
//                                     onClick={() => {
//                                         setSearchQuery('');
//                                         setSelectedGenre('Todos');
//                                     }}
//                                     className="text-pink-400 hover:text-pink-300 transition"
//                                 >
//                                     Limpiar filtros
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="max-w-7xl mx-auto p-6">
//                     {filteredMusics.length === 0 ? (
//                         <div className="text-center py-20">
//                             <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
//                             <h2 className="text-2xl font-bold text-white mb-2">No se encontraron canciones</h2>
//                             <p className="text-gray-400">Intenta con otros términos de búsqueda o filtros</p>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                             {filteredMusics.map(music => (
//                                 <div
//                                     key={music._id}
//                                     className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
//                                 >
//                                     <div className="relative h-48 overflow-hidden group">
//                                         <img
//                                             src={music.coverUrl || music.cover || './assets/zoonito.jpg'}
//                                             alt={music.title}
//                                             className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//                                         />
//                                         {music.avance && (
//                                             <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
//                                                 <Sparkles className="w-3 h-3" />
//                                                 AVANCE
//                                             </div>
//                                         )}
//                                         {isNewRelease(music) && !music.avance && (
//                                             <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
//                                                 <Flame className="w-3 h-3" />
//                                                 NUEVO
//                                             </div>
//                                         )}
//                                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                                     </div>

//                                     <div className="p-4 space-y-3">
//                                         <div>
//                                             <h3 className="font-bold text-lg text-white truncate">{music.title}</h3>
//                                             <div className="flex items-center gap-2 mt-1">
//                                                 <img
//                                                     src={music.avatarArtist || '/default-artist.png'}
//                                                     alt={music.artist}
//                                                     className="w-8 h-8 rounded-full object-cover border border-pink-500/50"
//                                                 />
//                                                 <p className="text-sm text-gray-300 truncate">{music.artist}</p>
//                                             </div>
//                                             {music.album && (
//                                                 <p className="text-xs text-gray-400 mt-1 truncate">📀 {music.album}</p>
//                                             )}
//                                         </div>

//                                         <div className="flex items-center justify-between text-sm">
//                                             <button
//                                                 onClick={() => toggleLike(music._id)}
//                                                 className={`flex items-center gap-1 transition-all ${music.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
//                                                     }`}
//                                             >
//                                                 <Heart className={`w-4 h-4 ${music.likedByUser ? 'fill-red-500' : ''}`} />
//                                                 {formatLikes(music.likes ?? 0)}
//                                             </button>

//                                             <button
//                                                 onClick={() => setShowRatingModal(music._id)}
//                                                 className="flex items-center gap-1 hover:text-yellow-400 transition"
//                                             >
//                                                 <Star className={`w-4 h-4 ${music.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//                                                 {music.rating?.toFixed(1) ?? '0.0'}
//                                             </button>

//                                             {music.playCount !== undefined && (
//                                                 <span className="flex items-center gap-1 text-gray-400">
//                                                     <TrendingUp className="w-4 h-4" />
//                                                     {formatLikes(music.playCount)}
//                                                 </span>
//                                             )}
//                                         </div>

//                                         <div className="flex gap-2">
//                                             <button
//                                                 onClick={() => addToPlaylist(music)}
//                                                 className="flex-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-sm font-semibold py-2 rounded-lg transition"
//                                             >
//                                                 + Playlist
//                                             </button>
//                                             <button
//                                                 onClick={() => downloadMusic(music)}
//                                                 className="bg-green-500/20 hover:bg-green-500/30 text-green-300 p-2 rounded-lg transition"
//                                                 title="Descargar"
//                                             >
//                                                 <Download className="w-4 h-4" />
//                                             </button>
//                                             <button
//                                                 onClick={() => shareMusic(music)}
//                                                 className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
//                                                 title="Compartir"
//                                             >
//                                                 <Share2 className="w-4 h-4" />
//                                             </button>
//                                         </div>

//                                         <Link
//                                             href={`/fanpage/${music.artist.replace(/\s+/g, '-').toLowerCase()}`}
//                                             className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center"
//                                         >
//                                             Ver Artista
//                                         </Link>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>

//                 {showRatingModal && (
//                     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//                         <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-sm w-full border border-pink-500/30">
//                             <h3 className="text-xl font-bold mb-4 text-white">Califica esta canción</h3>
//                             <div className="flex justify-center gap-2 mb-6">
//                                 {[1, 2, 3, 4, 5].map(star => (
//                                     <button
//                                         key={star}
//                                         onMouseEnter={() => setHoverRating(star)}
//                                         onMouseLeave={() => setHoverRating(0)}
//                                         onClick={() => submitRating(showRatingModal, star)}
//                                         className="transition-transform hover:scale-110"
//                                     >
//                                         <Star
//                                             className={`w-10 h-10 ${star <= (hoverRating || musics.find(m => m._id === showRatingModal)?.userRating || 0)
//                                                 ? 'fill-yellow-400 text-yellow-400'
//                                                 : 'text-gray-400'
//                                                 }`}
//                                         />
//                                     </button>
//                                 ))}
//                             </div>
//                             <button
//                                 onClick={() => setShowRatingModal(null)}
//                                 className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
//                             >
//                                 Cerrar
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 <style jsx global>{`
//                     .hide-scrollbar::-webkit-scrollbar {
//                         display: none;
//                     }
//                     .hide-scrollbar {
//                         -ms-overflow-style: none;
//                         scrollbar-width: none;
//                     }
//                 `}</style>
//             </div>
//         </>
//     );

// }



'use client';
import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Heart, Star, Search, X, Share2, TrendingUp, Clock, Sparkles, Music, Flame, Download } from 'lucide-react';
import { Cancion } from "../components/Reproductor";
import { useReproductor } from '../context/ReproductorContext';
import Link from 'next/link';
import Head from 'next/head';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MusicAll - Descubre Nueva Música | Zoonito Music',
  description: 'Explora el mejor catálogo de música. Avances exclusivos, lo nuevo y lo más escuchado.',
  openGraph: {
    title: 'MusicAll - Descubre Nueva Música | Zoonito Music',
    description: 'Explora el mejor catálogo de música',
    images: ['/assets/zoonito.jpg'],
    type: 'music.playlist',
    siteName: 'Zoonito Music',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MusicAll - Descubre Nueva Música',
    description: 'Explora el mejor catálogo de música',
    images: ['/assets/zoonito.jpg'],
  },
};

// Tu componente aquí (sin el <Head>)

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
    audioUrl?: string;
    likedByUser?: boolean;
    userRating?: number;
    avance?: boolean;
    idMusico?: string;
    playCount?: number;
    releaseDate?: string;
    createdAt?: string;
}

const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae', 'efects'];

interface Section {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
}

const SECTIONS: Section[] = [
    { id: 'todas', name: 'Todas', icon: <Music className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'avances', name: 'Avances', icon: <Sparkles className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
    { id: 'nuevo', name: 'Lo Nuevo', icon: <Flame className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
    { id: 'escuchado', name: 'Más Escuchado', icon: <TrendingUp className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
    { id: 'calificado', name: 'Mejor Calificado', icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-amber-500' },
];

export default function MusicAll() {
    const [musics, setMusics] = useState<Music[]>([]);
    const [filteredMusics, setFilteredMusics] = useState<Music[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('Todos');
    const [selectedSection, setSelectedSection] = useState('todas');
    const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
    const [hoverRating, setHoverRating] = useState(0);
    const user = useContext(UserContext);

    const { lista, agregarCancion } = useReproductor();

    const formatLikes = (likes: number): string => {
        if (likes >= 1000) {
            const k = Math.floor(likes / 100) / 10;
            return `${k}k`;
        }
        return likes.toString();
    };

    const extractUserId = (userContext: unknown): string | null => {
        if (!userContext || typeof userContext !== 'object') return null;
        const ctx = userContext as { user?: { _id?: string } };
        return ctx?.user?._id || null;
    };

    const isNewRelease = (music: Music): boolean => {
        const releaseDate = new Date(music.createdAt || music.releaseDate || '2000-01-01');
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    useEffect(() => {
        const fetchMusic = async () => {
            try {
                const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
                if (!res.ok) throw new Error('Error al obtener música');
                let data: Music[] = await res.json();

                const userId = extractUserId(user);

                if (userId) {
                    try {
                        const likesRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-likes/${userId}`);
                        const ratingsRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-ratings/${userId}`);

                        if (likesRes.ok && ratingsRes.ok) {
                            const userLikes = await likesRes.json();
                            const userRatings = await ratingsRes.json();

                            data = data.map(m => ({
                                ...m,
                                likedByUser: userLikes.includes(m._id),
                                userRating: userRatings[m._id] || 0
                            }));
                        }
                    } catch (err) {
                        console.warn('⚠️ No se pudieron cargar likes/ratings del usuario:', err);
                    }
                }

                setMusics(data);
                setFilteredMusics(data);
            } catch (err) {
                console.error('Error cargando música:', err);
            }
        };

        fetchMusic();
    }, [user]);

    useEffect(() => {
        let filtered = [...musics];

        if (searchQuery) {
            filtered = filtered.filter(m =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.album?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedGenre !== 'Todos') {
            filtered = filtered.filter(m => m.genre === selectedGenre);
        }

        switch (selectedSection) {
            case 'avances':
                filtered = filtered.filter(m => m.avance === true);
                break;
            case 'nuevo':
                filtered = filtered.filter(m => isNewRelease(m));
                filtered.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.releaseDate || '2000-01-01').getTime();
                    const dateB = new Date(b.createdAt || b.releaseDate || '2000-01-01').getTime();
                    return dateB - dateA;
                });
                break;
            case 'escuchado':
                filtered = filtered.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
                break;
            case 'calificado':
                filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }

        setFilteredMusics(filtered);
    }, [musics, searchQuery, selectedGenre, selectedSection]);

    const toggleLike = async (musicId: string) => {
        try {
            const music = musics.find(m => m._id === musicId);
            const isLiked = music?.likedByUser;
            const userId = extractUserId(user);

            if (!userId) {
                setMusics(prev => prev.map(m =>
                    m._id === musicId
                        ? {
                            ...m,
                            likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
                            likedByUser: !isLiked
                        }
                        : m
                ));
                return;
            }

            const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ musicId, userId }),
            });

            if (res.ok) {
                setMusics(prev => prev.map(m =>
                    m._id === musicId
                        ? {
                            ...m,
                            likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
                            likedByUser: !isLiked
                        }
                        : m
                ));
            }
        } catch (err) {
            console.error('❌ Error toggling like:', err);
        }
    };

    const submitRating = async (musicId: string, value: number) => {
        const userId = extractUserId(user);

        if (!userId) {
            const { default: Swal } = await import('sweetalert2');
            Swal.fire({
                icon: 'warning',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para calificar canciones',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ec4899',
                confirmButtonText: 'Entendido'
            });
            setShowRatingModal(null);
            return;
        }

        try {
            const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ musicId, userId, rating: value }),
            });

            if (res.ok) {
                const data = await res.json();
                setMusics(prev => prev.map(m =>
                    m._id === musicId
                        ? { ...m, rating: data.newAverage, userRating: value }
                        : m
                ));
                setShowRatingModal(null);
            }
        } catch (err) {
            console.error('❌ Error rating:', err);
        }
    };

    const shareMusic = async (music: Music) => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            console.error('Esta función solo funciona en el navegador');
            return;
        }

        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/cancion/${music._id}`;
        
        const imageUrl = music.coverUrl || music.avatarArtist || music.cover;
        const fullImageUrl = imageUrl?.startsWith('http') 
            ? imageUrl 
            : imageUrl 
                ? `https://backend-zoonito-6x8h.vercel.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
                : `${baseUrl}/assets/zoonito.jpg`;

        const whatsappText = `🎵 *${music.title}*
🎤 ${music.artist}
${music.album ? `📀 ${music.album}\n` : ''}⭐ ${music.rating?.toFixed(1) || '0.0'}/5
❤️ ${formatLikes(music.likes || 0)} likes
${music.playCount ? `🎧 ${formatLikes(music.playCount)} reproducciones\n` : ''}
🔗 Escúchalo aquí: ${shareUrl}`;

        const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
        const whatsappMobileUrl = `whatsapp://send?text=${encodeURIComponent(whatsappText)}`;

        try {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (navigator.share) {
                const shareData = {
                    title: `${music.title} - ${music.artist}`,
                    text: `🎵 Escucha ${music.title} de ${music.artist} en Zoonito Music`,
                    url: shareUrl
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        return;
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                            console.log('Web Share API cancelado, usando alternativa');
                        }
                    }
                }
            }

            if (isMobile) {
                window.location.href = whatsappMobileUrl;
                setTimeout(() => {
                    window.open(whatsappWebUrl, '_blank');
                }, 1500);
            } else {
                window.open(whatsappWebUrl, '_blank');
            }

        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error compartiendo:', err);
                const { default: Swal } = await import('sweetalert2');
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Link copiado!',
                        html: `<div class="text-left"><p>Link copiado al portapapeles:</p><br/><strong>${music.title}</strong><br/>${music.artist}<br/><a href="${shareUrl}" target="_blank" class="text-pink-400 text-xs break-all">${shareUrl}</a></div>`,
                        background: '#1a1a2e',
                        color: '#fff',
                        confirmButtonColor: '#ec4899',
                        timer: 4000,
                        showConfirmButton: true,
                        confirmButtonText: 'Entendido'
                    });
                } catch (clipErr) {
                    console.error('Error al copiar:', clipErr);
                }
            }
        }
    };

    const addToPlaylist = (music: Music) => {
        const nueva: Cancion = {
            id: music._id,
            titulo: music.title,
            artista: music.artist,
            url: music.audioUrl || '',
            cover: music.coverUrl || music.cover || './assets/zoonito.jpg',
        };

        const yaExiste = lista.some(c => c.id === nueva.id);
        if (!yaExiste) {
            agregarCancion(nueva);
        }
    };

    const downloadMusic = async (music: Music) => {
        if (!music.audioUrl) {
            const { default: Swal } = await import('sweetalert2');
            Swal.fire({
                icon: 'error',
                title: 'No disponible',
                text: 'Esta canción no tiene audio disponible para descargar',
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ec4899',
            });
            return;
        }

        try {
            const audioUrl = music.audioUrl.startsWith('http')
                ? music.audioUrl
                : `https://backend-zoonito-6x8h.vercel.app${music.audioUrl.startsWith('/') ? '' : '/'}${music.audioUrl}`;

            const audioResponse = await fetch(audioUrl, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!audioResponse.ok) {
                throw new Error(`Error al descargar audio: ${audioResponse.status}`);
            }

            const audioBlob = await audioResponse.blob();
            const audioArrayBuffer = await audioBlob.arrayBuffer();

            let coverImageBuffer = null;

            const imageSources = [
                music.avatarArtist,
                music.coverUrl,
                music.cover
            ].filter(Boolean);
            
            for (const imageSource of imageSources) {
                if (!imageSource) continue;

                try {
                    const imageUrl = imageSource.startsWith('http')
                        ? imageSource
                        : `https://backend-zoonito-6x8h.vercel.app${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;

                    const imageResponse = await fetch(imageUrl, {
                        mode: 'cors',
                        credentials: 'omit'
                    });

                    if (imageResponse.ok) {
                        const imageBlob = await imageResponse.blob();
                        if (imageBlob.size <= 5 * 1024 * 1024 && imageBlob.type.startsWith('image/')) {
                            coverImageBuffer = await imageBlob.arrayBuffer();
                            console.log('✅ Imagen de portada cargada correctamente');
                            break;
                        }
                    }
                } catch (imgErr) {
                    console.warn('⚠️ No se pudo cargar imagen desde:', imageSource, imgErr);
                    continue;
                }
            }

            if (!coverImageBuffer) {
                try {
                    const defaultImageUrl = '/assets/zoonito.jpg';
                    const defaultResponse = await fetch(defaultImageUrl, {
                        mode: 'cors',
                        credentials: 'omit'
                    });

                    if (defaultResponse.ok) {
                        const defaultBlob = await defaultResponse.blob();
                        if (defaultBlob.size <= 5 * 1024 * 1024 && defaultBlob.type.startsWith('image/')) {
                            coverImageBuffer = await defaultBlob.arrayBuffer();
                            console.log('✅ Imagen por defecto cargada');
                        }
                    }
                } catch (defaultErr) {
                    console.warn('⚠️ No se pudo cargar la imagen por defecto:', defaultErr);
                }
            }

            const fileExtension = music.audioUrl.toLowerCase().endsWith('.m4a') ? 'm4a' : 'mp3';

            if (fileExtension === 'mp3' && coverImageBuffer) {
                const mimeType = 'image/jpeg';
                const mimeBytes = new TextEncoder().encode(mimeType);

                const id3Size = 10 +
                    (music.title ? 10 + 1 + new TextEncoder().encode(music.title).length : 0) +
                    (music.artist ? 10 + 1 + new TextEncoder().encode(music.artist).length : 0) +
                    (music.album ? 10 + 1 + new TextEncoder().encode(music.album).length : 0) +
                    (music.genre ? 10 + 1 + new TextEncoder().encode(music.genre).length : 0) +
                    (coverImageBuffer ? 10 + 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength : 0);

                const id3 = new ArrayBuffer(id3Size);
                const view = new DataView(id3);
                let offset = 0;

                view.setUint8(offset++, 0x49);
                view.setUint8(offset++, 0x44);
                view.setUint8(offset++, 0x33);
                view.setUint8(offset++, 0x03);
                view.setUint8(offset++, 0x00);
                view.setUint8(offset++, 0x00);
                const size = id3Size - 10;
                view.setUint8(offset++, (size >> 21) & 0x7F);
                view.setUint8(offset++, (size >> 14) & 0x7F);
                view.setUint8(offset++, (size >> 7) & 0x7F);
                view.setUint8(offset++, size & 0x7F);

                const writeTextFrame = (frameId: string, text: string) => {
                    const textBytes = new TextEncoder().encode(text);
                    const frameSize = 1 + textBytes.length;

                    for (let i = 0; i < 4; i++) {
                        view.setUint8(offset++, frameId.charCodeAt(i));
                    }
                    view.setUint32(offset, frameSize);
                    offset += 4;
                    view.setUint16(offset, 0);
                    offset += 2;

                    view.setUint8(offset++, 0x00);

                    const arr = new Uint8Array(id3, offset, textBytes.length);
                    arr.set(textBytes);
                    offset += textBytes.length;
                };

                if (music.title) writeTextFrame('TIT2', music.title);
                if (music.artist) writeTextFrame('TPE1', music.artist);
                if (music.album) writeTextFrame('TALB', music.album);
                if (music.genre) writeTextFrame('TCON', music.genre);

                if (coverImageBuffer) {
                    const frameSize = 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength;

                    view.setUint8(offset++, 0x41);
                    view.setUint8(offset++, 0x50);
                    view.setUint8(offset++, 0x49);
                    view.setUint8(offset++, 0x43);
                    view.setUint32(offset, frameSize);
                    offset += 4;
                    view.setUint16(offset, 0);
                    offset += 2;

                    view.setUint8(offset++, 0x00);

                    const mimeArr = new Uint8Array(id3, offset, mimeBytes.length);
                    mimeArr.set(mimeBytes);
                    offset += mimeBytes.length;
                    view.setUint8(offset++, 0x00);

                    view.setUint8(offset++, 0x03);

                    view.setUint8(offset++, 0x00);

                    const imgArr = new Uint8Array(id3, offset, coverImageBuffer.byteLength);
                    imgArr.set(new Uint8Array(coverImageBuffer));
                    offset += coverImageBuffer.byteLength;
                }

                const combined = new Uint8Array(id3.byteLength + audioArrayBuffer.byteLength);
                combined.set(new Uint8Array(id3), 0);
                combined.set(new Uint8Array(audioArrayBuffer), id3.byteLength);

                const taggedBlob = new Blob([combined], { type: 'audio/mpeg' });

                const url = window.URL.createObjectURL(taggedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${music.artist} - ${music.title}.mp3`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const url = window.URL.createObjectURL(audioBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${music.artist} - ${music.title}.${fileExtension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

            const { default: Swal } = await import('sweetalert2');
            Swal.fire({
                icon: 'success',
                title: '¡Descargando!',
                text: `${music.title} - ${music.artist}${coverImageBuffer ? ' (con carátula)' : ''}`,
                background: '#1a1a2e',
                color: '#fff',
                confirmButtonColor: '#ec4899',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error descargando:', err);

            try {
                const audioUrl = music.audioUrl!.startsWith('http')
                    ? music.audioUrl
                    : `https://backend-zoonito-6x8h.vercel.app${music.audioUrl!.startsWith('/') ? '' : '/'}${music.audioUrl}`;

                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `${music.artist} - ${music.title}.mp3`;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                const { default: Swal } = await import('sweetalert2');
                Swal.fire({
                    icon: 'info',
                    title: 'Descarga iniciada',
                    text: `${music.title} - ${music.artist} (sin metadata)`,
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#ec4899',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (directErr) {
                console.error('Error en descarga directa:', directErr);
                const { default: Swal } = await import('sweetalert2');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo descargar la canción. Verifica que el archivo existe y está disponible.',
                    background: '#1a1a2e',
                    color: '#fff',
                    confirmButtonColor: '#ec4899',
                });
            }
        }
    };

    return (
        <>
            <Head>
                <meta property="og:title" content="MusicAll - Descubre Nueva Música | Zoonito Music" />
                <meta property="og:description" content="Explora el mejor catálogo de música. Avances exclusivos, lo nuevo y lo más escuchado." />
                <meta property="og:image" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/assets/zoonito.jpg`} />
                <meta property="og:type" content="music.playlist" />
                <meta property="og:site_name" content="Zoonito Music" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="MusicAll - Descubre Nueva Música" />
                <meta name="twitter:description" content="Explora el mejor catálogo de música" />
                <meta name="twitter:image" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/assets/zoonito.jpg`} />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black">
                <div className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-pink-500/20">
                    <div className="max-w-7xl mx-auto p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Music className="w-8 h-8 text-pink-500" />
                                <h1 className="text-3xl font-bold text-white">
                                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                        MusicAll
                                    </span>
                                </h1>
                            </div>
                            <Link
                                href="/"
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition"
                            >
                                ← Inicio
                            </Link>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por canción, artista o álbum..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-md rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                            {SECTIONS.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setSelectedSection(section.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-300 ${selectedSection === section.id
                                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {section.icon}
                                    {section.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                            <button
                                onClick={() => setSelectedGenre('Todos')}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedGenre === 'Todos'
                                    ? 'bg-pink-500 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                Todos los géneros
                            </button>
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedGenre === genre
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-300 mt-4">
                            <span>{filteredMusics.length} canciones</span>
                            {(searchQuery || selectedGenre !== 'Todos') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedGenre('Todos');
                                    }}
                                    className="text-pink-400 hover:text-pink-300 transition"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-6">
                    {filteredMusics.length === 0 ? (
                        <div className="text-center py-20">
                            <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">No se encontraron canciones</h2>
                            <p className="text-gray-400">Intenta con otros términos de búsqueda o filtros</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMusics.map(music => (
                                <div
                                    key={music._id}
                                    className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
                                >
                                    <div className="relative h-48 overflow-hidden group">
                                        <img
                                            src={music.coverUrl || music.cover || './assets/zoonito.jpg'}
                                            alt={music.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        {music.avance && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                                <Sparkles className="w-3 h-3" />
                                                AVANCE
                                            </div>
                                        )}
                                        {isNewRelease(music) && !music.avance && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                                <Flame className="w-3 h-3" />
                                                NUEVO
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-white truncate">{music.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <img
                                                    src={music.avatarArtist || '/default-artist.png'}
                                                    alt={music.artist}
                                                    className="w-8 h-8 rounded-full object-cover border border-pink-500/50"
                                                />
                                                <p className="text-sm text-gray-300 truncate">{music.artist}</p>
                                            </div>
                                            {music.album && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">📀 {music.album}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <button
                                                onClick={() => toggleLike(music._id)}
                                                className={`flex items-center gap-1 transition-all ${music.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
                                                    }`}
                                            >
                                                <Heart className={`w-4 h-4 ${music.likedByUser ? 'fill-red-500' : ''}`} />
                                                {formatLikes(music.likes ?? 0)}
                                            </button>

                                            <button
                                                onClick={() => setShowRatingModal(music._id)}
                                                className="flex items-center gap-1 hover:text-yellow-400 transition"
                                            >
                                                <Star className={`w-4 h-4 ${music.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                {music.rating?.toFixed(1) ?? '0.0'}
                                            </button>

                                            {music.playCount !== undefined && (
                                                <span className="flex items-center gap-1 text-gray-400">
                                                    <TrendingUp className="w-4 h-4" />
                                                    {formatLikes(music.playCount)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => addToPlaylist(music)}
                                                className="flex-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-sm font-semibold py-2 rounded-lg transition"
                                            >
                                                + Playlist
                                            </button>
                                            <button
                                                onClick={() => downloadMusic(music)}
                                                className="bg-green-500/20 hover:bg-green-500/30 text-green-300 p-2 rounded-lg transition"
                                                title="Descargar"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => shareMusic(music)}
                                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 p-2 rounded-lg transition"
                                                title="Compartir"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <Link
                                            href={`/fanpage/${music.artist.replace(/\s+/g, '-').toLowerCase()}`}
                                            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center"
                                        >
                                            Ver Artista
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showRatingModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-sm w-full border border-pink-500/30">
                            <h3 className="text-xl font-bold mb-4 text-white">Califica esta canción</h3>
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => submitRating(showRatingModal, star)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${star <= (hoverRating || musics.find(m => m._id === showRatingModal)?.userRating || 0)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-400'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRatingModal(null)}
                                className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                <style jsx global>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .hide-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </div>
        </>
    );
}

