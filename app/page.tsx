// 'use client';
// import { useEffect, useState, useContext } from 'react';
// import { UserContext } from './context/UserContext';
// import { ChevronLeft, ChevronRight, Heart, Star, Search, X, Sparkles, Play, Download, ArrowUp } from 'lucide-react';
// import { Cancion } from "./components/Reproductor";
// import { useReproductor } from './context/ReproductorContext';
// import Link from 'next/link';

// interface Music {
//   _id: string;
//   title: string;
//   artist: string;
//   album?: string;
//   genre?: string;
//   soloist?: boolean;
//   likes?: number;
//   rating?: number;
//   cover?: string;
//   coverUrl?: string;
//   avatarArtist?: string;
//   audioUrl?: string;
//   likedByUser?: boolean;
//   userRating?: number;
//   avance?: boolean;
//   idMusico?: string;
// }

// interface ArtistData {
//   name: string;
//   genre?: string;
//   avatarArtist?: string;
//   totalLikes: number;
//   soloist?: boolean;
// }

// interface Patrocinio {
//   _id: string;
//   idMusico: string;
//   banda: string;
//   disco?: string;
//   fecha: string;
//   hora?: string;
//   direccion: string;
//   imagenUrl: string;
//   promocionado: boolean;
//   lanzar?: boolean;
//   diseño: "claro" | "oscuro";
//   creadoPor: string;
//   congelar?: boolean;
// }

// const mockMusics: Music[] = [
//   { _id: '1', title: 'Live at Sunset', artist: 'The Rockers', cover: '/assets/cantando.jpg', likes: 120, rating: 4.5, genre: '' },
//   { _id: '2', title: 'Acoustic Dreams', artist: 'Jane Doe', cover: 'https://images.unsplash.com/photo-1509339022327-1e1e25360a9f?auto=format&fit=crop&w=1200&q=80', likes: 98, rating: 4.2, genre: 'Pop' },
//   { _id: '3', title: 'Electronic Vibes', artist: 'DJ Pulse', cover: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1200&q=80', likes: 200, rating: 4.8, genre: 'Electronic' },
//   { _id: '4', title: 'Night Drive', artist: 'The Weekenders', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', likes: 156, rating: 4.6, genre: 'Hip-Hop' },
// ];

// const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae', 'efects'];

// export default function HomePage() {
//   const [musics, setMusics] = useState<Music[]>(mockMusics);
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [artistSlide, setArtistSlide] = useState(0);
//   const [avanceSlide, setAvanceSlide] = useState(0);
//   const [selectedGenre, setSelectedGenre] = useState<string>('');
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
//   const [hoverRating, setHoverRating] = useState(0);
//   const [patrocinios, setPatrocinios] = useState<Patrocinio[]>([]);
//   const [showSponsorAlert, setShowSponsorAlert] = useState(false);
//   const [currentSponsor, setCurrentSponsor] = useState<Patrocinio | null>(null);
//   const [showScrollTop, setShowScrollTop] = useState(false);
//   const user = useContext(UserContext);

//   const { lista, agregarCancion, setLista, setIndiceActual } = useReproductor();

//   const formatLikes = (likes: number): string => {
//     if (likes >= 1000) {
//       const k = Math.floor(likes / 100) / 10;
//       return `${k}k`;
//     }
//     return likes.toString();
//   };

//   const extractUserId = (userContext: unknown): string | null => {
//     if (!userContext || typeof userContext !== 'object') return null;
//     const ctx = userContext as { user?: { _id?: string } };
//     const userId = ctx?.user?._id;
//     return userId || null;
//   };

//   const getClosedSponsors = (): string[] => {
//     if (typeof window === 'undefined') return [];
//     const closed = window.localStorage.getItem('closedSponsors');
//     return closed ? JSON.parse(closed) : [];
//   };

//   const saveClosedSponsor = (sponsorId: string) => {
//     if (typeof window === 'undefined') return;
//     const closed = getClosedSponsors();
//     if (!closed.includes(sponsorId)) {
//       closed.push(sponsorId);
//       window.localStorage.setItem('closedSponsors', JSON.stringify(closed));
//     }
//   };

//   const checkForSponsor = (sponsors: Patrocinio[]) => {
//     const closedSponsors = getClosedSponsors();
//     const pendingSponsor = sponsors.find(s => !closedSponsors.includes(s._id));

//     if (pendingSponsor) {
//       setCurrentSponsor(pendingSponsor);
//       setShowSponsorAlert(true);
//     }
//   };

//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollPosition = window.scrollY;
//       const windowHeight = window.innerHeight;
      
//       if (scrollPosition > windowHeight / 2) {
//         setShowScrollTop(true);
//       } else {
//         setShowScrollTop(false);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const scrollToTop = () => {
//     window.scrollTo({
//       top: 0,
//       behavior: 'smooth'
//     });
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const resMusic = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
//         if (!resMusic.ok) throw new Error('Error al obtener música');
//         let data: Music[] = await resMusic.json();

//         const userId = extractUserId(user);

//         if (userId) {
//           try {
//             const likesRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-likes/${userId}`);
//             const ratingsRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-ratings/${userId}`);

//             if (likesRes.ok && ratingsRes.ok) {
//               const userLikes = await likesRes.json();
//               const userRatings = await ratingsRes.json();

//               data = data.map(m => ({
//                 ...m,
//                 likedByUser: userLikes.includes(m._id),
//                 userRating: userRatings[m._id] || 0
//               }));
//             }
//           } catch (err) {
//             console.warn('⚠️ No se pudieron cargar likes/ratings del usuario:', err);
//           }
//         }

//         setMusics(data.length > 0 ? data : mockMusics);

//         const resPatrocinios = await fetch('https://backend-zoonito-6x8h.vercel.app/api/eventos');
//         if (resPatrocinios.ok) {
//           const allEventos: Patrocinio[] = await resPatrocinios.json();

//           const patrociniosActivos = allEventos.filter(
//             e => e.promocionado && e.lanzar && new Date(e.fecha) >= new Date()
//           );

//           const patrociniosParaModal = allEventos.filter(
//             e => e.promocionado && !e.congelar && new Date(e.fecha) >= new Date()
//           );

//           setPatrocinios(patrociniosActivos);
//           checkForSponsor(patrociniosParaModal);
//         }
//       } catch (err) {
//         console.error('Error cargando datos:', err);
//         setMusics(mockMusics);
//       }
//     };

//     fetchData();
//   }, [user]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [musics.length, patrocinios.length]);

//   const handleCloseSponsor = async () => {
//     if (currentSponsor) {
//       saveClosedSponsor(currentSponsor._id);
//     }
//     setShowSponsorAlert(false);
//   };

//   // const handleGoToFanpage = () => {
//   //   if (currentSponsor) {
//   //     saveClosedSponsor(currentSponsor._id);
//   //     setShowSponsorAlert(false);
//   //     window.location.href = `/fanpage/${currentSponsor.banda.replace(/\s+/g, '-').toLowerCase()}`;
//   //   }
//   // };


//   const handleGoToFanpage = () => {
//   if (currentSponsor) {
//     // Guardar el ID del evento del sponsor en localStorage
//     localStorage.setItem('sponsorEventoId', currentSponsor.idMusico);
   
//     // Guardar que este sponsor fue cerrado
//     saveClosedSponsor(currentSponsor.idMusico);
//     setShowSponsorAlert(false);
//     // Redirigir a la página de publicaciones
//     window.location.href = `/publising`;
//   }
// };

//   const getSliderItems = () => {
//     const allItems: Array<Music | Patrocinio> = [];

//     if (musics.length < 3) {
//       return musics;
//     }

//     allItems.push(...musics.slice(0, 3));

//     const closedSponsors = getClosedSponsors();
//     const validSponsors = patrocinios.filter(p => !closedSponsors.includes(p._id));
//     allItems.push(...validSponsors);

//     return allItems;
//   };

//   const isPatrocinio = (item: Music | Patrocinio): item is Patrocinio => {
//     return 'banda' in item && 'creadoPor' in item;
//   };

//   const toggleLike = async (musicId: string) => {
//     try {
//       const music = musics.find(m => m._id === musicId);
//       const isLiked = music?.likedByUser;
//       const userId = extractUserId(user);

//       if (!userId) {
//         setMusics(prev => prev.map(m =>
//           m._id === musicId
//             ? {
//               ...m,
//               likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
//               likedByUser: !isLiked
//             }
//             : m
//         ));
//         return;
//       }

//       const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/like', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ musicId, userId }),
//       });

//       if (res.ok) {
//         setMusics(prev => prev.map(m =>
//           m._id === musicId
//             ? {
//               ...m,
//               likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
//               likedByUser: !isLiked
//             }
//             : m
//         ));
//       }
//     } catch (err) {
//       console.error('❌ Error toggling like:', err);
//     }
//   };

//   const submitRating = async (musicId: string, value: number) => {
//     const userId = extractUserId(user);

//     if (!userId) {
//       const { default: Swal } = await import('sweetalert2');
//       Swal.fire({
//         icon: 'warning',
//         title: 'Inicia sesión',
//         text: 'Debes iniciar sesión para calificar canciones',
//         background: '#1a1a2e',
//         color: '#fff',
//         confirmButtonColor: '#ec4899',
//         confirmButtonText: 'Entendido'
//       });
//       setShowRatingModal(null);
//       return;
//     }

//     try {
//       const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/rate', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ musicId, userId, rating: value }),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setMusics(prev => prev.map(m =>
//           m._id === musicId
//             ? { ...m, rating: data.newAverage, userRating: value }
//             : m
//         ));
//         setShowRatingModal(null);
//       }
//     } catch (err) {
//       console.error('❌ Error rating:', err);
//     }
//   };

//   const addToPlaylist = (music: Music) => {
//     const nueva: Cancion = {
//       id: music._id,
//       titulo: music.title,
//       artista: music.artist,
//       url: music.audioUrl || '',
//       cover: music.coverUrl || music.cover || '',
//     };

//     const yaExiste = lista.some(c => c.id === nueva.id);
//     if (!yaExiste) {
//       agregarCancion(nueva);
//     }
//   };

//   const downloadMusic = async (music: Music) => {
//     if (!music.audioUrl) {
//       const { default: Swal } = await import('sweetalert2');
//       Swal.fire({
//         icon: 'error',
//         title: 'No disponible',
//         text: 'Esta canción no tiene audio disponible para descargar',
//         background: '#1a1a2e',
//         color: '#fff',
//         confirmButtonColor: '#ec4899',
//       });
//       return;
//     }

//     try {
//       const audioUrl = music.audioUrl.startsWith('http')
//         ? music.audioUrl
//         : `http://localhost:5000${music.audioUrl.startsWith('/') ? '' : '/'}${music.audioUrl}`;

//       const audioResponse = await fetch(audioUrl, {
//         mode: 'cors',
//         credentials: 'omit'
//       });

//       if (!audioResponse.ok) {
//         throw new Error(`Error al descargar audio: ${audioResponse.status}`);
//       }

//       const audioBlob = await audioResponse.blob();
//       const audioArrayBuffer = await audioBlob.arrayBuffer();

//       let coverImageBuffer = null;

//       const imageSources = [
//         music.avatarArtist,
//         music.coverUrl,
//         music.cover
//       ].filter(Boolean);

//       for (const imageSource of imageSources) {
//         if (!imageSource) continue;

//         try {
//           const imageUrl = imageSource.startsWith('http')
//             ? imageSource
//             : `http://localhost:5000${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;

//           const imageResponse = await fetch(imageUrl, {
//             mode: 'cors',
//             credentials: 'omit'
//           });

//           if (imageResponse.ok) {
//             const imageBlob = await imageResponse.blob();
//             if (imageBlob.size <= 5 * 1024 * 1024 && imageBlob.type.startsWith('image/')) {
//               coverImageBuffer = await imageBlob.arrayBuffer();
//               console.log('✅ Imagen de portada cargada correctamente');
//               break;
//             }
//           }
//         } catch (imgErr) {
//           console.warn('⚠️ No se pudo cargar imagen desde:', imageSource, imgErr);
//           continue;
//         }
//       }

//       if (!coverImageBuffer) {
//         try {
//           const defaultImageUrl = '/assets/zoonito.jpg';
//           const defaultResponse = await fetch(defaultImageUrl, {
//             mode: 'cors',
//             credentials: 'omit'
//           });

//           if (defaultResponse.ok) {
//             const defaultBlob = await defaultResponse.blob();
//             if (defaultBlob.size <= 5 * 1024 * 1024 && defaultBlob.type.startsWith('image/')) {
//               coverImageBuffer = await defaultBlob.arrayBuffer();
//               console.log('✅ Imagen por defecto cargada');
//             }
//           }
//         } catch (defaultErr) {
//           console.warn('⚠️ No se pudo cargar la imagen por defecto:', defaultErr);
//         }
//       }

//       const fileExtension = music.audioUrl.toLowerCase().endsWith('.m4a') ? 'm4a' : 'mp3';

//       if (fileExtension === 'mp3' && coverImageBuffer) {
//         const mimeType = 'image/jpeg';
//         const mimeBytes = new TextEncoder().encode(mimeType);

//         const id3Size = 10 +
//           (music.title ? 10 + 1 + new TextEncoder().encode(music.title).length : 0) +
//           (music.artist ? 10 + 1 + new TextEncoder().encode(music.artist).length : 0) +
//           (music.album ? 10 + 1 + new TextEncoder().encode(music.album).length : 0) +
//           (music.genre ? 10 + 1 + new TextEncoder().encode(music.genre).length : 0) +
//           (coverImageBuffer ? 10 + 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength : 0);

//         const id3 = new ArrayBuffer(id3Size);
//         const view = new DataView(id3);
//         let offset = 0;

//         view.setUint8(offset++, 0x49);
//         view.setUint8(offset++, 0x44);
//         view.setUint8(offset++, 0x33);
//         view.setUint8(offset++, 0x03);
//         view.setUint8(offset++, 0x00);
//         view.setUint8(offset++, 0x00);
//         const size = id3Size - 10;
//         view.setUint8(offset++, (size >> 21) & 0x7F);
//         view.setUint8(offset++, (size >> 14) & 0x7F);
//         view.setUint8(offset++, (size >> 7) & 0x7F);
//         view.setUint8(offset++, size & 0x7F);

//         const writeTextFrame = (frameId: string, text: string) => {
//           const textBytes = new TextEncoder().encode(text);
//           const frameSize = 1 + textBytes.length;

//           for (let i = 0; i < 4; i++) {
//             view.setUint8(offset++, frameId.charCodeAt(i));
//           }
//           view.setUint32(offset, frameSize);
//           offset += 4;
//           view.setUint16(offset, 0);
//           offset += 2;

//           view.setUint8(offset++, 0x00);

//           const arr = new Uint8Array(id3, offset, textBytes.length);
//           arr.set(textBytes);
//           offset += textBytes.length;
//         };

//         if (music.title) writeTextFrame('TIT2', music.title);
//         if (music.artist) writeTextFrame('TPE1', music.artist);
//         if (music.album) writeTextFrame('TALB', music.album);
//         if (music.genre) writeTextFrame('TCON', music.genre);

//         if (coverImageBuffer) {
//           const frameSize = 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength;

//           view.setUint8(offset++, 0x41);
//           view.setUint8(offset++, 0x50);
//           view.setUint8(offset++, 0x49);
//           view.setUint8(offset++, 0x43);
//           view.setUint32(offset, frameSize);
//           offset += 4;
//           view.setUint16(offset, 0);
//           offset += 2;

//           view.setUint8(offset++, 0x00);

//           const mimeArr = new Uint8Array(id3, offset, mimeBytes.length);
//           mimeArr.set(mimeBytes);
//           offset += mimeBytes.length;
//           view.setUint8(offset++, 0x00);

//           view.setUint8(offset++, 0x03);

//           view.setUint8(offset++, 0x00);

//           const imgArr = new Uint8Array(id3, offset, coverImageBuffer.byteLength);
//           imgArr.set(new Uint8Array(coverImageBuffer));
//           offset += coverImageBuffer.byteLength;
//         }

//         const combined = new Uint8Array(id3.byteLength + audioArrayBuffer.byteLength);
//         combined.set(new Uint8Array(id3), 0);
//         combined.set(new Uint8Array(audioArrayBuffer), id3.byteLength);

//         const taggedBlob = new Blob([combined], { type: 'audio/mpeg' });

//         const url = window.URL.createObjectURL(taggedBlob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `${music.artist} - ${music.title}.mp3`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       } else {
//         const url = window.URL.createObjectURL(audioBlob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `${music.artist} - ${music.title}.${fileExtension}`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       }

//       const { default: Swal } = await import('sweetalert2');
//       Swal.fire({
//         icon: 'success',
//         title: '¡Descargando!',
//         text: `${music.title} - ${music.artist}${coverImageBuffer ? ' (con carátula)' : ''}`,
//         background: '#1a1a2e',
//         color: '#fff',
//         confirmButtonColor: '#ec4899',
//         timer: 2000,
//         showConfirmButton: false
//       });
//     } catch (err) {
//       console.error('Error descargando:', err);

//       try {
//         const audioUrl = music.audioUrl!.startsWith('http')
//           ? music.audioUrl
//           : `http://localhost:5000${music.audioUrl!.startsWith('/') ? '' : '/'}${music.audioUrl}`;

//         const a = document.createElement('a');
//         a.href = audioUrl;
//         a.download = `${music.artist} - ${music.title}.mp3`;
//         a.target = '_blank';
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);

//         const { default: Swal } = await import('sweetalert2');
//         Swal.fire({
//           icon: 'info',
//           title: 'Descarga iniciada',
//           text: `${music.title} - ${music.artist} (sin metadata)`,
//           background: '#1a1a2e',
//           color: '#fff',
//           confirmButtonColor: '#ec4899',
//           timer: 2000,
//           showConfirmButton: false
//         });
//       } catch (directErr) {
//         console.error('Error en descarga directa:', directErr);
//         const { default: Swal } = await import('sweetalert2');
//         Swal.fire({
//           icon: 'error',
//           title: 'Error',
//           text: 'No se pudo descargar la canción. Verifica que el archivo existe y está disponible.',
//           background: '#1a1a2e',
//           color: '#fff',
//           confirmButtonColor: '#ec4899',
//         });
//       }
//     }
//   };

//   const nextSlide = () => setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
//   const prevSlide = () => setCurrentSlide(prev => (prev - 1 + getSliderItems().length) % getSliderItems().length);

//   const groupedArtists = () => {
//     return musics.reduce((acc, song) => {
//       if (!acc[song.artist]) {
//         acc[song.artist] = {
//           name: song.artist,
//           genre: song.genre,
//           avatarArtist: song.avatarArtist,
//           totalLikes: song.likes || 0,
//           soloist: song.soloist
//         };
//       } else {
//         acc[song.artist].totalLikes += song.likes || 0;
//       }
//       return acc;
//     }, {} as Record<string, ArtistData>);
//   };

//   const artistsArray = Object.values(groupedArtists()).sort((a, b) => b.totalLikes - a.totalLikes);
//   const nextArtist = () => setArtistSlide(prev => (prev + 1) % artistsArray.length);
//   const prevArtist = () => setArtistSlide(prev => (prev - 1 + artistsArray.length) % artistsArray.length);

//   const avanceMusics = musics.filter(m => m.avance === true);
//   const nextAvance = () => setAvanceSlide(prev => (prev + 1) % Math.max(1, avanceMusics.length));
//   const prevAvance = () => setAvanceSlide(prev => (prev - 1 + Math.max(1, avanceMusics.length)) % Math.max(1, avanceMusics.length));

//   const filteredMusics = musics.filter(m => {
//     const matchesSearch = searchQuery === '' ||
//       m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       m.artist.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesGenre = selectedGenre === '' || m.genre === selectedGenre;

//     return matchesSearch && matchesGenre;
//   });

//   const groupedByGenre = filteredMusics.reduce((acc, music) => {
//     const genre = music.genre || 'Sin Género';
//     if (!acc[genre]) {
//       acc[genre] = [];
//     }
//     acc[genre].push(music);
//     return acc;
//   }, {} as Record<string, Music[]>);

//   const handleSearch = (value: string) => {
//     setSearchQuery(value);
//     setShowSearchResults(value.length > 0);
//   };

//   const closeSearch = () => {
//     setSearchQuery('');
//     setShowSearchResults(false);
//     setSelectedGenre('');
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('es-ES', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const sliderItems = getSliderItems();
//   const currentItem = sliderItems[currentSlide];

//   const getDisplayMusics = () => {
//     if (selectedGenre) {
//       return filteredMusics;
//     }
    
//     const total = filteredMusics.length;
    
//     if (total <= 6) {
//       return filteredMusics.slice(0, 6);
//     } else if (total <= 9) {
//       return filteredMusics.slice(0, 9);
//     } else {
//       return filteredMusics.slice(0, 12);
//     }
//   };

//   const displayMusics = getDisplayMusics();

//   return (
//     <div className="min-h-screen animate-gradient-x relative overflow-x-hidden">
//       <div className="absolute inset-0 bg-black/50 z-0"></div>

//       {showScrollTop && (
//         <button
//           onClick={scrollToTop}
//           className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 animate-bounce"
//           aria-label="Volver arriba"
//         >
//           <ArrowUp className="w-6 h-6" />
//         </button>
//       )}

//       {showSponsorAlert && currentSponsor && (
//         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-pink-500/30 animate-fade-in">
//             <div className="text-center">
//               <div className="mb-4">
//                 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg inline-block">
//                   ⭐ EVENTO DESTACADO
//                 </span>
//               </div>

//               <h2 className="text-4xl font-bold text-white mb-4 glow-text">
//                 ¡Nuevo Lanzamiento!
//               </h2>

//               <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
//                 <img
//                   src={currentSponsor.imagenUrl}
//                   alt={currentSponsor.disco || currentSponsor.banda}
//                   className="w-full h-72 object-cover"
//                 />
//               </div>

//               <h3 className="text-3xl font-bold text-pink-300 mb-2">{currentSponsor.banda}</h3>
//               {currentSponsor.disco && (
//                 <p className="text-2xl text-white mb-4">{currentSponsor.disco}</p>
//               )}

//               <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 mb-6 space-y-2">
//                 <p className="text-base text-gray-200 flex items-center justify-center gap-2">
//                   <span>📍</span> {currentSponsor.direccion}
//                 </p>
//                 <p className="text-base text-gray-200 flex items-center justify-center gap-2">
//                   <span>📅</span> {formatDate(currentSponsor.fecha)}
//                 </p>
//                 {currentSponsor.hora && (
//                   <p className="text-base text-gray-200 flex items-center justify-center gap-2">
//                     <span>🕐</span> {currentSponsor.hora}
//                   </p>
//                 )}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={handleCloseSponsor}
//                   className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-full font-semibold transition-all duration-300 hover:scale-105"
//                 >
//                   Cerrar
//                 </button>
//                 <button
//                   onClick={handleGoToFanpage}
//                   className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-full font-bold shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105"
//                 >
//                   Ver más
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//      <nav className="navbar sticky top-0 z-20 mb-8 bg-black/20 backdrop-blur-md">
//   <div className="px-4 py-3 border-b border-white/10">
//     <div className="relative max-w-2xl mx-auto">
//       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//       <input
//         type="text"
//         placeholder="Buscar por canción o artista..."
//         value={searchQuery}
//         onChange={(e) => handleSearch(e.target.value)}
//         className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
//       />
//       {searchQuery && (
//         <button
//           onClick={closeSearch}
//           className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
//         >
//           <X className="w-5 h-5" />
//         </button>
//       )}
//     </div>
//   </div>

//   {/* Contenedor con scroll horizontal */}
//   <div className="relative">
//     {/* Gradiente izquierdo para indicar más contenido */}
//     <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />
    
//     {/* Gradiente derecho para indicar más contenido */}
//     <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
    
//     <div className="flex py-3 px-4 gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
//       <button
//         onClick={() => setSelectedGenre('')}
//         className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${
//           selectedGenre === ''
//             ? 'bg-pink-500 text-white'
//             : 'bg-white/10 hover:bg-white/20 text-white'
//         }`}
//       >
//         Todos
//       </button>

//       {GENRES.map((genre) => (
//         <button
//           key={genre}
//           onClick={() => setSelectedGenre(genre)}
//           className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${
//             selectedGenre === genre
//               ? 'bg-pink-500 text-white'
//               : 'bg-white/10 hover:bg-white/20 text-white'
//           }`}
//         >
//           {genre}
//         </button>
//       ))}

//       <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition whitespace-nowrap ml-4 flex-shrink-0">
//         Suscribete
//       </button>
//     </div>
//   </div>
// </nav>

// <style jsx>{`
//   /* Ocultar scrollbar pero mantener funcionalidad */
//   .scrollbar-hide {
//     -ms-overflow-style: none;
//     scrollbar-width: none;
//   }
  
//   .scrollbar-hide::-webkit-scrollbar {
//     display: none;
//   }
  
//   /* Mejorar el scroll en móviles */
//   .overflow-x-auto {
//     -webkit-overflow-scrolling: touch;
//   }
// `}</style>
//       {showSearchResults && (
//         <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 overflow-y-auto">
//           <div className="min-h-screen p-6">
//             <div className="max-w-7xl mx-auto">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-3xl font-bold text-white">
//                   Resultados de búsqueda
//                   <span className="text-pink-500 ml-2">({filteredMusics.length})</span>
//                 </h2>
//                 <button
//                   onClick={closeSearch}
//                   className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition"
//                 >
//                   <X className="w-6 h-6 text-white" />
//                 </button>
//               </div>

//               {filteredMusics.length === 0 ? (
//                 <div className="text-center py-20">
//                   <p className="text-2xl text-gray-400">No se encontraron resultados</p>
//                   <p className="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
//                 </div>
//               ) : (
//                 Object.entries(groupedByGenre).map(([genre, songs]) => (
//                   <div key={genre} className="mb-12">
//                     <h3 className="text-2xl font-bold text-white mb-6 glow-text">{genre}</h3>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                       {songs.map(m => (
//                         <div key={m._id} className="glass-card overflow-hidden">
//                           <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
//                           <div className="p-4">
//                             <h3 className="font-bold text-lg glow-text">{m.title}</h3>

//                             <div className="flex items-center mt-1 gap-2">
//                               <img
//                                 src={m.avatarArtist || '/default-artist.png'}
//                                 alt={m.artist}
//                                 className="w-12 h-12 rounded-full object-cover border border-white/30"
//                               />
//                               <p className="text-sm text-neutral-300">{m.artist}</p>
//                             </div>

//                             <div className="mt-3 flex justify-between items-center">
//                               <button
//                                 onClick={() => toggleLike(m._id)}
//                                 className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
//                                   }`}
//                               >
//                                 <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
//                                 {formatLikes(m.likes ?? 0)}
//                               </button>

//                               <button
//                                 onClick={() => setShowRatingModal(m._id)}
//                                 className="flex items-center gap-1 hover:text-yellow-400 transition"
//                               >
//                                 <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//                                 {m.rating?.toFixed(1) ?? '0.0'}
//                               </button>

//                               <button
//                                 onClick={() => downloadMusic(m)}
//                                 className="flex items-center gap-1 hover:text-green-400 transition"
//                                 title="Descargar canción"
//                               >
//                                 <Download className="w-5 h-5" />
//                               </button>
//                             </div>

//                             <div className="mt-2 flex gap-2">
//                               <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
//                                 ➕ Playlist
//                               </button>
//                               <Link
//                                 href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
//                                 className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
//                               >
//                                 Conocelos
//                               </Link>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="relative z-10">
//         {!selectedGenre && !showSearchResults && (
//           <section className="mb-10 px-4">
//             <div className="relative rounded-2xl shadow-2xl overflow-hidden">
//               {currentItem && isPatrocinio(currentItem) ? (
//                 <Link href={`/fanpage/${currentItem.banda.replace(/\s+/g, '-').toLowerCase()}`}>
//                   <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500 cursor-pointer hover:opacity-95 relative"
//                     style={{ backgroundImage: `url(${currentItem.imagenUrl})` }}
//                   >
//                     <div className={`absolute inset-0 ${currentItem.diseño === "oscuro" ? "bg-gradient-to-t from-black via-black/70 to-transparent" : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"}`} />

//                     <div className="relative bg-black/60 backdrop-blur-md p-4 rounded-xl w-full">
//                       <div className="flex items-center gap-2 mb-2">
//                         <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
//                           ⭐ PATROCINADO
//                         </span>
//                       </div>
//                       <h2 className="text-3xl font-bold glow-text">{currentItem.banda}</h2>
//                       {currentItem.disco && (
//                         <p className="text-xl text-pink-300 mb-1">{currentItem.disco}</p>
//                       )}
//                       <p className="text-sm text-neutral-300 mt-2">📍 {currentItem.direccion}</p>
//                       <p className="text-sm text-neutral-300">
//                         📅 {formatDate(currentItem.fecha)} {currentItem.hora && `- 🕐 ${currentItem.hora}`}
//                       </p>
//                     </div>
//                   </div>
//                 </Link>
//               ) : currentItem && !isPatrocinio(currentItem) ? (
//                 <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500"
//                   style={{ backgroundImage: `url(${currentItem.coverUrl || currentItem.cover || './assets/zoonito.jpg'})` }}
//                 >
//                   <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl">
//                     <h2 className="text-2xl font-bold glow-text">{currentItem.title}</h2>
//                     <p className="text-sm text-neutral-300">{currentItem.artist}</p>
//                   </div>
//                 </div>
//               ) : null}

//               <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
//                 <ChevronLeft className="w-6 h-6 text-white" />
//               </button>
//               <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
//                 <ChevronRight className="w-6 h-6 text-white" />
//               </button>

//               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
//                 {sliderItems.slice(0, 5).map((_, idx) => (
//                   <button
//                     key={idx}
//                     onClick={() => setCurrentSlide(idx)}
//                     className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-pink-500 w-6' : 'bg-white/50'}`}
//                   />
//                 ))}
//               </div>
//             </div>
//           </section>
//         )}

//         {!showSearchResults && avanceMusics.length > 0 && (
//           <section className="mb-12 px-4">
//             <div className="flex items-center justify-between mb-6">
//               <div className="flex items-center gap-3">
//                 <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
//                 <h2 className="text-3xl font-bold text-white glow-text">
//                   Avances Exclusivos
//                 </h2>
//               </div>
//             </div>

//             <div className="relative">
//               <div className="glass-card overflow-hidden rounded-2xl shadow-2xl">
//                 {avanceMusics[avanceSlide] && (
//                   <div className="relative">
//                     <div
//                       className="h-[500px] md:h-[500px] bg-cover bg-center relative group"
//                       style={{ backgroundImage: `url(${avanceMusics[avanceSlide].coverUrl || avanceMusics[avanceSlide].cover || './assets/zoonito.jpg'})` }}
//                     >
//                       <div className="absolute inset-0 bg-black/85 md:bg-transparent" />
//                       <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

//                       <div className="absolute top-6 left-6">
//                         <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse">
//                           <Sparkles className="w-4 h-4" />
//                           AVANCE EXCLUSIVO
//                         </span>
//                       </div>

//                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                         <button
//                           onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
//                           className="bg-pink-500 hover:bg-pink-600 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
//                         >
//                           <Play className="w-12 h-12 fill-white" />
//                         </button>
//                       </div>

//                       <div className="absolute inset-0 md:bottom-0 md:inset-auto left-0 right-0 p-4 md:p-8 flex items-center md:items-end">
//                         <div className="bg-black/90 md:bg-black/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-pink-500/30 w-full">
//                           <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 glow-text">
//                             {avanceMusics[avanceSlide].title}
//                           </h3>

//                           <div className="flex items-center gap-3 mb-4">
//                             <img
//                               src={avanceMusics[avanceSlide].avatarArtist || '/default-artist.png'}
//                               alt={avanceMusics[avanceSlide].artist}
//                               className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-pink-500"
//                             />
//                             <div>
//                               <p className="text-base md:text-xl text-pink-300 font-semibold">
//                                 {avanceMusics[avanceSlide].artist}
//                               </p>
//                               {avanceMusics[avanceSlide].album && (
//                                 <p className="text-xs md:text-sm text-gray-300">
//                                   {avanceMusics[avanceSlide].album}
//                                 </p>
//                               )}
//                             </div>
//                           </div>
// {/* 
//                           <div className="flex flex-wrap gap-2 md:gap-3 items-center">
//                             <button
//                               onClick={() => toggleLike(avanceMusics[avanceSlide]._id)}
//                               className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-105 ${avanceMusics[avanceSlide].likedByUser
//                                   ? 'bg-red-500 text-white'
//                                   : 'bg-white/20 text-white hover:bg-white/30'
//                                 }`}
//                             >
//                               <Heart className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].likedByUser ? 'fill-white' : ''}`} />
//                               {formatLikes(avanceMusics[avanceSlide].likes ?? 0)}
//                             </button>

//                             <button
//                               onClick={() => setShowRatingModal(avanceMusics[avanceSlide]._id)}
//                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
//                             >
//                               <Star className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//                               {avanceMusics[avanceSlide].rating?.toFixed(1) ?? '0.0'}
//                             </button>

//                             <button
//                               onClick={() => downloadMusic(avanceMusics[avanceSlide])}
//                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-green-500 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
//                               title="Descargar canción"
//                             >
//                               <Download className="w-4 h-4 md:w-5 md:h-5" />
//                               <span className="hidden sm:inline">Descargar</span>
//                             </button>

//                             <button
//                               onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
//                               className="px-3 md:px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg"
//                             >
//                               <span className="hidden sm:inline">➕ </span>Añadir
//                             </button>

//                             {avanceMusics[avanceSlide].idMusico && (
//                               <Link
//                                 href={`/fanpage/${avanceMusics[avanceSlide].idMusico}`}
//                                 className="px-3 md:px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm md:text-base shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105 ring-1 ring-purple-400/30 hover:ring-pink-300/50"
//                               >
//                                 Saber Más
//                               </Link>
//                             )} 
//                               )} 
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div> */}


//                             <div className="flex flex-wrap gap-2 md:gap-3 items-center">
//                             <button
//                               onClick={() => toggleLike(avanceMusics[avanceSlide]._id)}
//                               className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-105 ${avanceMusics[avanceSlide].likedByUser
//                                 ? 'bg-red-500 text-white'
//                                 : 'bg-white/20 text-white hover:bg-white/30'
//                                 }`}
//                             >
//                               <Heart className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].likedByUser ? 'fill-white' : ''}`} />
//                               {formatLikes(avanceMusics[avanceSlide].likes ?? 0)}
//                             </button>

//                             <button
//                               onClick={() => setShowRatingModal(avanceMusics[avanceSlide]._id)}
//                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
//                             >
//                               <Star className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//                               {avanceMusics[avanceSlide].rating?.toFixed(1) ?? '0.0'}
//                             </button>

//                             <button
//                               onClick={() => downloadMusic(avanceMusics[avanceSlide])}
//                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-green-500 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
//                               title="Descargar canción"
//                             >
//                               <Download className="w-4 h-4 md:w-5 md:h-5" />
//                               <span className="hidden sm:inline">Descargar</span>
//                             </button>

//                             <button
//                               onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
//                               className="px-3 md:px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg"
//                             >
//                               <span className="hidden sm:inline">➕ </span>Añadir
//                             </button>

//                             {avanceMusics[avanceSlide].idMusico && (
//                             <Link
//                                 href={`/fanpage/${avanceMusics[avanceSlide].artist}`}
//                                 className="px-3 md:px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm md:text-base shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105 ring-1 ring-purple-400/30 hover:ring-pink-300/50"
//                               >
//                                 Saber Más
//                               </Link>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {avanceMusics.length > 1 && (
//                 <>
//                   <button
//                     onClick={prevAvance}
//                     className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
//                   >
//                     <ChevronLeft className="w-6 h-6" />
//                   </button>
//                   <button
//                     onClick={nextAvance}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
//                   >
//                     <ChevronRight className="w-6 h-6" />
//                   </button>

//                   <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
//                     {avanceMusics.map((_, idx) => (
//                       <button
//                         key={idx}
//                         onClick={() => setAvanceSlide(idx)}
//                         className={`w-3 h-3 rounded-full transition-all ${idx === avanceSlide
//                             ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-10'
//                             : 'bg-white/30 hover:bg-white/50'
//                           }`}
//                       />
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           </section>
//         )}

//         {selectedGenre && !showSearchResults && (
//           <div className="px-6 mb-6">
//             <h2 className="text-3xl font-bold glow-text">{selectedGenre}</h2>
//             <p className="text-neutral-400 mt-2">{filteredMusics.length} canciones encontradas</p>
//           </div>
//         )}

//         {!selectedGenre && !showSearchResults && (
//           <section className="px-6 mb-12">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-center text-2xl font-bold glow-text">Artistas Destacados</h2>
//             </div>
//             {artistsArray.length === 0 ? (
//               <p className="text-center text-neutral-300">No hay artistas</p>
//             ) : (
//               <div className="relative">
//                 <div className="overflow-hidden">
//                   <div
//                     className="flex gap-8 transition-transform duration-500 ease-out py-10"
//                     style={{ transform: `translateX(-${artistSlide * 100}%)` }}
//                   >
//                     {artistsArray.slice(0, 9).map((artist, index) => (
//                       <div key={index} className="flex-shrink-0 w-full md:w-[calc(33.333%-2rem)] min-w-[200px]">
//                         <Link
//                           href={`/fanpage/${artist.name.replace(/\s+/g, '-').toLowerCase()}`}
//                           className="flex flex-col items-center group cursor-pointer"
//                         >
//                           <div className="avatar-card mb-4 w-full h-48 overflow-hidden rounded-lg shadow-lg">
//                             <img
//                               src={artist.avatarArtist || '/assets/zoonito.jpg'}
//                               alt={artist.name}
//                               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
//                             />
//                           </div>

//                           <h3 className="text-sm font-semibold text-white text-center glow-secondary group-hover:glow-text transition-all mt-2">
//                             {artist.name}
//                           </h3>
//                           {artist.genre && (
//                             <p className="text-xs text-neutral-400 mt-1">{artist.genre}</p>
//                           )}
//                         </Link>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <button onClick={prevArtist} className="absolute left-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
//                   <ChevronLeft className="w-6 h-6 text-white" />
//                 </button>
//                 <button onClick={nextArtist} className="absolute right-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
//                   <ChevronRight className="w-6 h-6 text-white" />
//                 </button>
//               </div>
//             )}
//           </section>
//         )}

//         {!showSearchResults && (
//           <>
//             <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//               {displayMusics.map(m => (
//                 <div key={m._id} className="glass-card overflow-hidden">
//                   <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
//                   <div className="p-4">
//                     <h3 className="font-bold text-lg glow-text">{m.title}</h3>

//                     <div className="flex items-center mt-1 gap-2">
//                       <img
//                         src={m.avatarArtist || '/default-artist.png'}
//                         alt={m.artist}
//                         className="w-12 h-12 rounded-full object-cover border border-white/30"
//                       />
//                       <p className="text-sm text-neutral-300">{m.artist}</p>
//                     </div>

//                     <div className="mt-3 flex justify-between items-center">
//                       <button
//                         onClick={() => toggleLike(m._id)}
//                         className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
//                           }`}
//                       >
//                         <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
//                         {formatLikes(m.likes ?? 0)}
//                       </button>

//                       <button
//                         onClick={() => setShowRatingModal(m._id)}
//                         className="flex items-center gap-1 hover:text-yellow-400 transition"
//                       >
//                         <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
//                         {m.rating?.toFixed(1) ?? '0.0'}
//                       </button>

//                       <button
//                         onClick={() => downloadMusic(m)}
//                         className="flex items-center gap-1 hover:text-green-400 transition"
//                         title="Descargar canción"
//                       >
//                         <Download className="w-5 h-5" />
//                       </button>
//                     </div>

//                     <div className="mt-2 flex gap-2">
//                       <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
//                         ➕ Playlist
//                       </button>
//                       <Link
//                         href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
//                         className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
//                       >
//                         Conocelos
//                       </Link>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </main>

//             {!selectedGenre && filteredMusics.length > 12 && (
//               <div className="flex justify-center mb-10">
//                 <Link href="/musicAll" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded transition">
//                   Ver más
//                 </Link>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {showRatingModal && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
//           <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-sm w-full">
//             <h3 className="text-xl font-bold mb-4 text-white">Califica esta canción</h3>
//             <div className="flex justify-center gap-2 mb-6">
//               {[1, 2, 3, 4, 5].map(star => (
//                 <button
//                   key={star}
//                   onMouseEnter={() => setHoverRating(star)}
//                   onMouseLeave={() => setHoverRating(0)}
//                   onClick={() => submitRating(showRatingModal, star)}
//                   className="transition-transform hover:scale-110"
//                 >
//                   <Star
//                     className={`w-10 h-10 ${star <= (hoverRating || musics.find(m => m._id === showRatingModal)?.userRating || 0)
//                       ? 'fill-yellow-400 text-yellow-400'
//                       : 'text-gray-400'
//                       }`}
//                   />
//                 </button>
//               ))}
//             </div>
//             <button
//               onClick={() => setShowRatingModal(null)}
//               className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
//             >
//               Cerrar
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// // 'use client';
// // import { useEffect, useState, useContext } from 'react';
// // import { UserContext } from './context/UserContext';
// // import { ChevronLeft, ChevronRight, Heart, Star, Search, X, Sparkles, Play, Download, ArrowUp } from 'lucide-react';
// // import { Cancion } from "./components/Reproductor";
// // import { useReproductor } from './context/ReproductorContext';
// // import Link from 'next/link';

// // interface Music {
// //   _id: string;
// //   title: string;
// //   artist: string;
// //   album?: string;
// //   genre?: string;
// //   soloist?: boolean;
// //   likes?: number;
// //   rating?: number;
// //   cover?: string;
// //   coverUrl?: string;
// //   avatarArtist?: string;
// //   audioUrl?: string;
// //   likedByUser?: boolean;
// //   userRating?: number;
// //   avance?: boolean;
// //   idMusico?: string;
// // }

// // interface ArtistData {
// //   name: string;
// //   genre?: string;
// //   avatarArtist?: string;
// //   totalLikes: number;
// //   soloist?: boolean;
// // }

// // interface Patrocinio {
// //   _id: string;
// //   idMusico: string;
// //   banda: string;
// //   disco?: string;
// //   fecha: string;
// //   hora?: string;
// //   direccion: string;
// //   imagenUrl: string;
// //   promocionado: boolean;
// //   lanzar?: boolean;
// //   diseño: "claro" | "oscuro";
// //   creadoPor: string;
// //   congelar?: boolean;
// // }

// // const mockMusics: Music[] = [
// //   { _id: '1', title: 'Live at Sunset', artist: 'The Rockers', cover: '/assets/cantando.jpg', likes: 120, rating: 4.5, genre: '' },
// //   { _id: '2', title: 'Acoustic Dreams', artist: 'Jane Doe', cover: 'https://images.unsplash.com/photo-1509339022327-1e1e25360a9f?auto=format&fit=crop&w=1200&q=80', likes: 98, rating: 4.2, genre: 'Pop' },
// //   { _id: '3', title: 'Electronic Vibes', artist: 'DJ Pulse', cover: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1200&q=80', likes: 200, rating: 4.8, genre: 'Electronic' },
// //   { _id: '4', title: 'Night Drive', artist: 'The Weekenders', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', likes: 156, rating: 4.6, genre: 'Hip-Hop' },
// // ];

// // const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae', 'efects'];

// // export default function HomePage() {
// //   const [musics, setMusics] = useState<Music[]>(mockMusics);
// //   const [currentSlide, setCurrentSlide] = useState(0);
// //   const [artistSlide, setArtistSlide] = useState(0);
// //   const [avanceSlide, setAvanceSlide] = useState(0);
// //   const [selectedGenre, setSelectedGenre] = useState<string>('');
// //   const [searchQuery, setSearchQuery] = useState<string>('');
// //   const [showSearchResults, setShowSearchResults] = useState(false);
// //   const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
// //   const [hoverRating, setHoverRating] = useState(0);
// //   const [patrocinios, setPatrocinios] = useState<Patrocinio[]>([]);
// //   const [showSponsorAlert, setShowSponsorAlert] = useState(false);
// //   const [currentSponsor, setCurrentSponsor] = useState<Patrocinio | null>(null);
// //   const [showScrollTop, setShowScrollTop] = useState(false);
// //   const user = useContext(UserContext);

// //   const { lista, agregarCancion, setLista, setIndiceActual } = useReproductor();

// //   const formatLikes = (likes: number): string => {
// //     if (likes >= 1000) {
// //       const k = Math.floor(likes / 100) / 10;
// //       return `${k}k`;
// //     }
// //     return likes.toString();
// //   };

// //   const extractUserId = (userContext: unknown): string | null => {
// //     if (!userContext || typeof userContext !== 'object') return null;
// //     const ctx = userContext as { user?: { _id?: string } };
// //     const userId = ctx?.user?._id;
// //     return userId || null;
// //   };

// //   const getClosedSponsors = (): string[] => {
// //     if (typeof window === 'undefined') return [];
// //     const closed = window.localStorage.getItem('closedSponsors');
// //     return closed ? JSON.parse(closed) : [];
// //   };

// //   const saveClosedSponsor = (sponsorId: string) => {
// //     if (typeof window === 'undefined') return;
// //     const closed = getClosedSponsors();
// //     if (!closed.includes(sponsorId)) {
// //       closed.push(sponsorId);
// //       window.localStorage.setItem('closedSponsors', JSON.stringify(closed));
// //     }
// //   };

// //   const checkForSponsor = (sponsors: Patrocinio[]) => {
// //     const closedSponsors = getClosedSponsors();
// //     const pendingSponsor = sponsors.find(s => !closedSponsors.includes(s._id));

// //     if (pendingSponsor) {
// //       setCurrentSponsor(pendingSponsor);
// //       setShowSponsorAlert(true);
// //     }
// //   };

// //   useEffect(() => {
// //     const handleScroll = () => {
// //       const scrollPosition = window.scrollY;
// //       const windowHeight = window.innerHeight;

// //       if (scrollPosition > windowHeight / 2) {
// //         setShowScrollTop(true);
// //       } else {
// //         setShowScrollTop(false);
// //       }
// //     };

// //     window.addEventListener('scroll', handleScroll);
// //     return () => window.removeEventListener('scroll', handleScroll);
// //   }, []);

// //   const scrollToTop = () => {
// //     window.scrollTo({
// //       top: 0,
// //       behavior: 'smooth'
// //     });
// //   };

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         const resMusic = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
// //         if (!resMusic.ok) throw new Error('Error al obtener música');
// //         let data: Music[] = await resMusic.json();

// //         const userId = extractUserId(user);

// //         if (userId) {
// //           try {
// //             const likesRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-likes/${userId}`);
// //             const ratingsRes = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/user-ratings/${userId}`);

// //             if (likesRes.ok && ratingsRes.ok) {
// //               const userLikes = await likesRes.json();
// //               const userRatings = await ratingsRes.json();

// //               data = data.map(m => ({
// //                 ...m,
// //                 likedByUser: userLikes.includes(m._id),
// //                 userRating: userRatings[m._id] || 0
// //               }));
// //             }
// //           } catch (err) {
// //             console.warn('⚠️ No se pudieron cargar likes/ratings del usuario:', err);
// //           }
// //         }

// //         setMusics(data.length > 0 ? data : mockMusics);

// //         const resPatrocinios = await fetch('https://backend-zoonito-6x8h.vercel.app/api/eventos');
// //         if (resPatrocinios.ok) {
// //           const allEventos: Patrocinio[] = await resPatrocinios.json();

// //           const patrociniosActivos = allEventos.filter(
// //             e => e.promocionado && e.lanzar && new Date(e.fecha) >= new Date()
// //           );

// //           const patrociniosParaModal = allEventos.filter(
// //             e => e.promocionado && !e.congelar && new Date(e.fecha) >= new Date()
// //           );

// //           setPatrocinios(patrociniosActivos);
// //           checkForSponsor(patrociniosParaModal);
// //         }
// //       } catch (err) {
// //         console.error('Error cargando datos:', err);
// //         setMusics(mockMusics);
// //       }
// //     };

// //     fetchData();
// //   }, [user]);

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
// //     }, 3000);

// //     return () => clearInterval(interval);
// //   }, [musics.length, patrocinios.length]);

// //   const handleCloseSponsor = async () => {
// //     if (currentSponsor) {
// //       saveClosedSponsor(currentSponsor._id);
// //     }
// //     setShowSponsorAlert(false);
// //   };

// //   const handleGoToFanpage = () => {
// //     if (currentSponsor) {
// //       saveClosedSponsor(currentSponsor._id);
// //       setShowSponsorAlert(false);
// //       window.location.href = `/fanpage/${currentSponsor.banda.replace(/\s+/g, '-').toLowerCase()}`;
// //     }
// //   };

// //   const getSliderItems = () => {
// //     const allItems: Array<Music | Patrocinio> = [];

// //     if (musics.length < 3) {
// //       return musics;
// //     }

// //     allItems.push(...musics.slice(0, 3));

// //     const closedSponsors = getClosedSponsors();
// //     const validSponsors = patrocinios.filter(p => !closedSponsors.includes(p._id));
// //     allItems.push(...validSponsors);

// //     return allItems;
// //   };

// //   const isPatrocinio = (item: Music | Patrocinio): item is Patrocinio => {
// //     return 'banda' in item && 'creadoPor' in item;
// //   };

// //   const toggleLike = async (musicId: string) => {
// //     try {
// //       const music = musics.find(m => m._id === musicId);
// //       const isLiked = music?.likedByUser;
// //       const userId = extractUserId(user);

// //       if (!userId) {
// //         setMusics(prev => prev.map(m =>
// //           m._id === musicId
// //             ? {
// //               ...m,
// //               likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
// //               likedByUser: !isLiked
// //             }
// //             : m
// //         ));
// //         return;
// //       }

// //       const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/like', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ musicId, userId }),
// //       });

// //       if (res.ok) {
// //         setMusics(prev => prev.map(m =>
// //           m._id === musicId
// //             ? {
// //               ...m,
// //               likes: isLiked ? (m.likes || 0) - 1 : (m.likes || 0) + 1,
// //               likedByUser: !isLiked
// //             }
// //             : m
// //         ));
// //       }
// //     } catch (err) {
// //       console.error('❌ Error toggling like:', err);
// //     }
// //   };

// //   const submitRating = async (musicId: string, value: number) => {
// //     const userId = extractUserId(user);

// //     if (!userId) {
// //       const { default: Swal } = await import('sweetalert2');
// //       Swal.fire({
// //         icon: 'warning',
// //         title: 'Inicia sesión',
// //         text: 'Debes iniciar sesión para calificar canciones',
// //         background: '#1a1a2e',
// //         color: '#fff',
// //         confirmButtonColor: '#ec4899',
// //         confirmButtonText: 'Entendido'
// //       });
// //       setShowRatingModal(null);
// //       return;
// //     }

// //     try {
// //       const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music/rate', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ musicId, userId, rating: value }),
// //       });

// //       if (res.ok) {
// //         const data = await res.json();
// //         setMusics(prev => prev.map(m =>
// //           m._id === musicId
// //             ? { ...m, rating: data.newAverage, userRating: value }
// //             : m
// //         ));
// //         setShowRatingModal(null);
// //       }
// //     } catch (err) {
// //       console.error('❌ Error rating:', err);
// //     }
// //   };

// //   const addToPlaylist = (music: Music) => {
// //     const nueva: Cancion = {
// //       id: music._id,
// //       titulo: music.title,
// //       artista: music.artist,
// //       url: music.audioUrl || '',
// //       cover: music.coverUrl || music.cover || '',
// //     };

// //     const yaExiste = lista.some(c => c.id === nueva.id);
// //     if (!yaExiste) {
// //       agregarCancion(nueva);
// //     }
// //   };

// //   const downloadMusic = async (music: Music) => {
// //     if (!music.audioUrl) {
// //       const { default: Swal } = await import('sweetalert2');
// //       Swal.fire({
// //         icon: 'error',
// //         title: 'No disponible',
// //         text: 'Esta canción no tiene audio disponible para descargar',
// //         background: '#1a1a2e',
// //         color: '#fff',
// //         confirmButtonColor: '#ec4899',
// //       });
// //       return;
// //     }

// //     try {
// //       const audioUrl = music.audioUrl.startsWith('http')
// //         ? music.audioUrl
// //         : `http://localhost:5000${music.audioUrl.startsWith('/') ? '' : '/'}${music.audioUrl}`;

// //       const audioResponse = await fetch(audioUrl, {
// //         mode: 'cors',
// //         credentials: 'omit'
// //       });

// //       if (!audioResponse.ok) {
// //         throw new Error(`Error al descargar audio: ${audioResponse.status}`);
// //       }

// //       const audioBlob = await audioResponse.blob();
// //       const audioArrayBuffer = await audioBlob.arrayBuffer();

// //       let coverImageBuffer = null;

// //       const imageSources = [
// //         music.avatarArtist,
// //         music.coverUrl,
// //         music.cover
// //       ].filter(Boolean);

// //       for (const imageSource of imageSources) {
// //         if (!imageSource) continue;

// //         try {
// //           const imageUrl = imageSource.startsWith('http')
// //             ? imageSource
// //             : `http://localhost:5000${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;

// //           const imageResponse = await fetch(imageUrl, {
// //             mode: 'cors',
// //             credentials: 'omit'
// //           });

// //           if (imageResponse.ok) {
// //             const imageBlob = await imageResponse.blob();
// //             if (imageBlob.size <= 5 * 1024 * 1024 && imageBlob.type.startsWith('image/')) {
// //               coverImageBuffer = await imageBlob.arrayBuffer();
// //               console.log('✅ Imagen de portada cargada correctamente');
// //               break;
// //             }
// //           }
// //         } catch (imgErr) {
// //           console.warn('⚠️ No se pudo cargar imagen desde:', imageSource, imgErr);
// //           continue;
// //         }
// //       }

// //       if (!coverImageBuffer) {
// //         try {
// //           const defaultImageUrl = '/assets/zoonito.jpg';
// //           const defaultResponse = await fetch(defaultImageUrl, {
// //             mode: 'cors',
// //             credentials: 'omit'
// //           });

// //           if (defaultResponse.ok) {
// //             const defaultBlob = await defaultResponse.blob();
// //             if (defaultBlob.size <= 5 * 1024 * 1024 && defaultBlob.type.startsWith('image/')) {
// //               coverImageBuffer = await defaultBlob.arrayBuffer();
// //               console.log('✅ Imagen por defecto cargada');
// //             }
// //           }
// //         } catch (defaultErr) {
// //           console.warn('⚠️ No se pudo cargar la imagen por defecto:', defaultErr);
// //         }
// //       }

// //       const fileExtension = music.audioUrl.toLowerCase().endsWith('.m4a') ? 'm4a' : 'mp3';

// //       if (fileExtension === 'mp3' && coverImageBuffer) {
// //         const mimeType = 'image/jpeg';
// //         const mimeBytes = new TextEncoder().encode(mimeType);

// //         const id3Size = 10 +
// //           (music.title ? 10 + 1 + new TextEncoder().encode(music.title).length : 0) +
// //           (music.artist ? 10 + 1 + new TextEncoder().encode(music.artist).length : 0) +
// //           (music.album ? 10 + 1 + new TextEncoder().encode(music.album).length : 0) +
// //           (music.genre ? 10 + 1 + new TextEncoder().encode(music.genre).length : 0) +
// //           (coverImageBuffer ? 10 + 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength : 0);

// //         const id3 = new ArrayBuffer(id3Size);
// //         const view = new DataView(id3);
// //         let offset = 0;

// //         view.setUint8(offset++, 0x49);
// //         view.setUint8(offset++, 0x44);
// //         view.setUint8(offset++, 0x33);
// //         view.setUint8(offset++, 0x03);
// //         view.setUint8(offset++, 0x00);
// //         view.setUint8(offset++, 0x00);
// //         const size = id3Size - 10;
// //         view.setUint8(offset++, (size >> 21) & 0x7F);
// //         view.setUint8(offset++, (size >> 14) & 0x7F);
// //         view.setUint8(offset++, (size >> 7) & 0x7F);
// //         view.setUint8(offset++, size & 0x7F);

// //         const writeTextFrame = (frameId: string, text: string) => {
// //           const textBytes = new TextEncoder().encode(text);
// //           const frameSize = 1 + textBytes.length;

// //           for (let i = 0; i < 4; i++) {
// //             view.setUint8(offset++, frameId.charCodeAt(i));
// //           }
// //           view.setUint32(offset, frameSize);
// //           offset += 4;
// //           view.setUint16(offset, 0);
// //           offset += 2;

// //           view.setUint8(offset++, 0x00);

// //           const arr = new Uint8Array(id3, offset, textBytes.length);
// //           arr.set(textBytes);
// //           offset += textBytes.length;
// //         };

// //         if (music.title) writeTextFrame('TIT2', music.title);
// //         if (music.artist) writeTextFrame('TPE1', music.artist);
// //         if (music.album) writeTextFrame('TALB', music.album);
// //         if (music.genre) writeTextFrame('TCON', music.genre);

// //         if (coverImageBuffer) {
// //           const frameSize = 1 + mimeBytes.length + 1 + 1 + 1 + coverImageBuffer.byteLength;

// //           view.setUint8(offset++, 0x41);
// //           view.setUint8(offset++, 0x50);
// //           view.setUint8(offset++, 0x49);
// //           view.setUint8(offset++, 0x43);
// //           view.setUint32(offset, frameSize);
// //           offset += 4;
// //           view.setUint16(offset, 0);
// //           offset += 2;

// //           view.setUint8(offset++, 0x00);

// //           const mimeArr = new Uint8Array(id3, offset, mimeBytes.length);
// //           mimeArr.set(mimeBytes);
// //           offset += mimeBytes.length;
// //           view.setUint8(offset++, 0x00);

// //           view.setUint8(offset++, 0x03);

// //           view.setUint8(offset++, 0x00);

// //           const imgArr = new Uint8Array(id3, offset, coverImageBuffer.byteLength);
// //           imgArr.set(new Uint8Array(coverImageBuffer));
// //           offset += coverImageBuffer.byteLength;
// //         }

// //         const combined = new Uint8Array(id3.byteLength + audioArrayBuffer.byteLength);
// //         combined.set(new Uint8Array(id3), 0);
// //         combined.set(new Uint8Array(audioArrayBuffer), id3.byteLength);

// //         const taggedBlob = new Blob([combined], { type: 'audio/mpeg' });

// //         const url = window.URL.createObjectURL(taggedBlob);
// //         const a = document.createElement('a');
// //         a.href = url;
// //         a.download = `${music.artist} - ${music.title}.mp3`;
// //         document.body.appendChild(a);
// //         a.click();
// //         window.URL.revokeObjectURL(url);
// //         document.body.removeChild(a);
// //       } else {
// //         const url = window.URL.createObjectURL(audioBlob);
// //         const a = document.createElement('a');
// //         a.href = url;
// //         a.download = `${music.artist} - ${music.title}.${fileExtension}`;
// //         document.body.appendChild(a);
// //         a.click();
// //         window.URL.revokeObjectURL(url);
// //         document.body.removeChild(a);
// //       }

// //       const { default: Swal } = await import('sweetalert2');
// //       Swal.fire({
// //         icon: 'success',
// //         title: '¡Descargando!',
// //         text: `${music.title} - ${music.artist}${coverImageBuffer ? ' (con carátula)' : ''}`,
// //         background: '#1a1a2e',
// //         color: '#fff',
// //         confirmButtonColor: '#ec4899',
// //         timer: 2000,
// //         showConfirmButton: false
// //       });
// //     } catch (err) {
// //       console.error('Error descargando:', err);

// //       try {
// //         const audioUrl = music.audioUrl!.startsWith('http')
// //           ? music.audioUrl
// //           : `http://localhost:5000${music.audioUrl!.startsWith('/') ? '' : '/'}${music.audioUrl}`;

// //         const a = document.createElement('a');
// //         a.href = audioUrl;
// //         a.download = `${music.artist} - ${music.title}.mp3`;
// //         a.target = '_blank';
// //         document.body.appendChild(a);
// //         a.click();
// //         document.body.removeChild(a);

// //         const { default: Swal } = await import('sweetalert2');
// //         Swal.fire({
// //           icon: 'info',
// //           title: 'Descarga iniciada',
// //           text: `${music.title} - ${music.artist} (sin metadata)`,
// //           background: '#1a1a2e',
// //           color: '#fff',
// //           confirmButtonColor: '#ec4899',
// //           timer: 2000,
// //           showConfirmButton: false
// //         });
// //       } catch (directErr) {
// //         console.error('Error en descarga directa:', directErr);
// //         const { default: Swal } = await import('sweetalert2');
// //         Swal.fire({
// //           icon: 'error',
// //           title: 'Error',
// //           text: 'No se pudo descargar la canción. Verifica que el archivo existe y está disponible.',
// //           background: '#1a1a2e',
// //           color: '#fff',
// //           confirmButtonColor: '#ec4899',
// //         });
// //       }
// //     }
// //   };

// //   const nextSlide = () => setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
// //   const prevSlide = () => setCurrentSlide(prev => (prev - 1 + getSliderItems().length) % getSliderItems().length);

// //   const groupedArtists = () => {
// //     return musics.reduce((acc, song) => {
// //       if (!acc[song.artist]) {
// //         acc[song.artist] = {
// //           name: song.artist,
// //           genre: song.genre,
// //           avatarArtist: song.avatarArtist,
// //           totalLikes: song.likes || 0,
// //           soloist: song.soloist
// //         };
// //       } else {
// //         acc[song.artist].totalLikes += song.likes || 0;
// //       }
// //       return acc;
// //     }, {} as Record<string, ArtistData>);
// //   };

// //   const artistsArray = Object.values(groupedArtists()).sort((a, b) => b.totalLikes - a.totalLikes);
// //   const nextArtist = () => setArtistSlide(prev => (prev + 1) % artistsArray.length);
// //   const prevArtist = () => setArtistSlide(prev => (prev - 1 + artistsArray.length) % artistsArray.length);

// //   const avanceMusics = musics.filter(m => m.avance === true);
// //   const nextAvance = () => setAvanceSlide(prev => (prev + 1) % Math.max(1, avanceMusics.length));
// //   const prevAvance = () => setAvanceSlide(prev => (prev - 1 + Math.max(1, avanceMusics.length)) % Math.max(1, avanceMusics.length));

// //   const filteredMusics = musics.filter(m => {
// //     const matchesSearch = searchQuery === '' ||
// //       m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
// //       m.artist.toLowerCase().includes(searchQuery.toLowerCase());

// //     const matchesGenre = selectedGenre === '' || m.genre === selectedGenre;

// //     return matchesSearch && matchesGenre;
// //   });

// //   const groupedByGenre = filteredMusics.reduce((acc, music) => {
// //     const genre = music.genre || 'Sin Género';
// //     if (!acc[genre]) {
// //       acc[genre] = [];
// //     }
// //     acc[genre].push(music);
// //     return acc;
// //   }, {} as Record<string, Music[]>);

// //   const handleSearch = (value: string) => {
// //     setSearchQuery(value);
// //     setShowSearchResults(value.length > 0);
// //   };

// //   const closeSearch = () => {
// //     setSearchQuery('');
// //     setShowSearchResults(false);
// //     setSelectedGenre('');
// //   };

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('es-ES', {
// //       weekday: 'long',
// //       year: 'numeric',
// //       month: 'long',
// //       day: 'numeric'
// //     });
// //   };

// //   const sliderItems = getSliderItems();
// //   const currentItem = sliderItems[currentSlide];

// //   const getDisplayMusics = () => {
// //     if (selectedGenre) {
// //       return filteredMusics;
// //     }

// //     const total = filteredMusics.length;

// //     if (total <= 6) {
// //       return filteredMusics.slice(0, 6);
// //     } else if (total <= 9) {
// //       return filteredMusics.slice(0, 9);
// //     } else {
// //       return filteredMusics.slice(0, 12);
// //     }
// //   };

// //   const displayMusics = getDisplayMusics();

// //   return (
// //     <div className="min-h-screen animate-gradient-x relative overflow-x-hidden">
// //       <div className="absolute inset-0 bg-black/50 z-0"></div>

// //       {showScrollTop && (
// //         <button
// //           onClick={scrollToTop}
// //           className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 animate-bounce"
// //           aria-label="Volver arriba"
// //         >
// //           <ArrowUp className="w-6 h-6" />
// //         </button>
// //       )}

// //       {showSponsorAlert && currentSponsor && (
// //         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
// //           <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-pink-500/30 animate-fade-in">
// //             <div className="text-center">
// //               <div className="mb-4">
// //                 <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg inline-block">
// //                   ⭐ EVENTO DESTACADO
// //                 </span>
// //               </div>

// //               <h2 className="text-4xl font-bold text-white mb-4 glow-text">
// //                 ¡Nuevo Lanzamiento!
// //               </h2>

// //               <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
// //                 <img
// //                   src={currentSponsor.imagenUrl}
// //                   alt={currentSponsor.disco || currentSponsor.banda}
// //                   className="w-full h-72 object-cover"
// //                 />
// //               </div>

// //               <h3 className="text-3xl font-bold text-pink-300 mb-2">{currentSponsor.banda}</h3>
// //               {currentSponsor.disco && (
// //                 <p className="text-2xl text-white mb-4">{currentSponsor.disco}</p>
// //               )}

// //               <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 mb-6 space-y-2">
// //                 <p className="text-base text-gray-200 flex items-center justify-center gap-2">
// //                   <span>📍</span> {currentSponsor.direccion}
// //                 </p>
// //                 <p className="text-base text-gray-200 flex items-center justify-center gap-2">
// //                   <span>📅</span> {formatDate(currentSponsor.fecha)}
// //                 </p>
// //                 {currentSponsor.hora && (
// //                   <p className="text-base text-gray-200 flex items-center justify-center gap-2">
// //                     <span>🕐</span> {currentSponsor.hora}
// //                   </p>
// //                 )}
// //               </div>

// //               <div className="flex gap-3">
// //                 <button
// //                   onClick={handleCloseSponsor}
// //                   className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-full font-semibold transition-all duration-300 hover:scale-105"
// //                 >
// //                   Cerrar
// //                 </button>
// //                 <button
// //                   onClick={handleGoToFanpage}
// //                   className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-full font-bold shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105"
// //                 >
// //                   Ver más
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //       <nav className="navbar sticky top-0 z-20 mb-8 bg-black/20 backdrop-blur-md">
// //         <div className="px-4 py-3 border-b border-white/10">
// //           <div className="relative max-w-2xl mx-auto">
// //             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
// //             <input
// //               type="text"
// //               placeholder="Buscar por canción o artista..."
// //               value={searchQuery}
// //               onChange={(e) => handleSearch(e.target.value)}
// //               className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
// //             />
// //             {searchQuery && (
// //               <button
// //                 onClick={closeSearch}
// //                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
// //               >
// //                 <X className="w-5 h-5" />
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         {/* Contenedor con scroll horizontal */}
// //         <div className="relative">
// //           {/* Gradiente izquierdo para indicar más contenido */}
// //           <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />

// //           {/* Gradiente derecho para indicar más contenido */}
// //           <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />

// //           <div className="flex py-3 px-4 gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
// //             <button
// //               onClick={() => setSelectedGenre('')}
// //               className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${selectedGenre === ''
// //                   ? 'bg-pink-500 text-white'
// //                   : 'bg-white/10 hover:bg-white/20 text-white'
// //                 }`}
// //             >
// //               Todos
// //             </button>

// //             {GENRES.map((genre) => (
// //               <button
// //                 key={genre}
// //                 onClick={() => setSelectedGenre(genre)}
// //                 className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${selectedGenre === genre
// //                     ? 'bg-pink-500 text-white'
// //                     : 'bg-white/10 hover:bg-white/20 text-white'
// //                   }`}
// //               >
// //                 {genre}
// //               </button>
// //             ))}

// //             <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition whitespace-nowrap ml-4 flex-shrink-0">
// //               Suscribete
// //             </button>
// //           </div>
// //         </div>
// //       </nav>

// //       <style jsx>{`
// //   /* Ocultar scrollbar pero mantener funcionalidad */
// //   .scrollbar-hide {
// //     -ms-overflow-style: none;
// //     scrollbar-width: none;
// //   }
  
// //   .scrollbar-hide::-webkit-scrollbar {
// //     display: none;
// //   }
  
// //   /* Mejorar el scroll en móviles */
// //   .overflow-x-auto {
// //     -webkit-overflow-scrolling: touch;
// //   }
// // `}</style>

// //       {showSearchResults && (
// //         <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 overflow-y-auto">
// //           <div className="min-h-screen p-6">
// //             <div className="max-w-7xl mx-auto">
// //               <div className="flex justify-between items-center mb-6">
// //                 <h2 className="text-3xl font-bold text-white">
// //                   Resultados de búsqueda
// //                   <span className="text-pink-500 ml-2">({filteredMusics.length})</span>
// //                 </h2>
// //                 <button
// //                   onClick={closeSearch}
// //                   className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition"
// //                 >
// //                   <X className="w-6 h-6 text-white" />
// //                 </button>
// //               </div>

// //               {filteredMusics.length === 0 ? (
// //                 <div className="text-center py-20">
// //                   <p className="text-2xl text-gray-400">No se encontraron resultados</p>
// //                   <p className="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
// //                 </div>
// //               ) : (
// //                 Object.entries(groupedByGenre).map(([genre, songs]) => (
// //                   <div key={genre} className="mb-12">
// //                     <h3 className="text-2xl font-bold text-white mb-6 glow-text">{genre}</h3>
// //                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// //                       {songs.map(m => (
// //                         <div key={m._id} className="glass-card overflow-hidden">
// //                           <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
// //                           <div className="p-4">
// //                             <h3 className="font-bold text-lg glow-text">{m.title}</h3>

// //                             <div className="flex items-center mt-1 gap-2">
// //                               <img
// //                                 src={m.avatarArtist || '/default-artist.png'}
// //                                 alt={m.artist}
// //                                 className="w-12 h-12 rounded-full object-cover border border-white/30"
// //                               />
// //                               <p className="text-sm text-neutral-300">{m.artist}</p>
// //                             </div>

// //                             <div className="mt-3 flex justify-between items-center">
// //                               <button
// //                                 onClick={() => toggleLike(m._id)}
// //                                 className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
// //                                   }`}
// //                               >
// //                                 <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
// //                                 {formatLikes(m.likes ?? 0)}
// //                               </button>

// //                               <button
// //                                 onClick={() => setShowRatingModal(m._id)}
// //                                 className="flex items-center gap-1 hover:text-yellow-400 transition"
// //                               >
// //                                 <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
// //                                 {m.rating?.toFixed(1) ?? '0.0'}
// //                               </button>

// //                               <button
// //                                 onClick={() => downloadMusic(m)}
// //                                 className="flex items-center gap-1 hover:text-green-400 transition"
// //                                 title="Descargar canción"
// //                               >
// //                                 <Download className="w-5 h-5" />
// //                               </button>
// //                             </div>

// //                             <div className="mt-2 flex gap-2">
// //                               <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
// //                                 ➕ Playlist
// //                               </button>
// //                               <Link
// //                                 href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
// //                                 className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
// //                               >
// //                                 Conocelos
// //                               </Link>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </div>
// //                 ))
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div className="relative z-10">
// //         {!selectedGenre && !showSearchResults && (
// //           <section className="mb-10 px-4">
// //             <div className="relative rounded-2xl shadow-2xl overflow-hidden">
// //               {currentItem && isPatrocinio(currentItem) ? (
// //                 <Link href={`/fanpage/${currentItem.banda.replace(/\s+/g, '-').toLowerCase()}`}>
// //                   <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500 cursor-pointer hover:opacity-95 relative"
// //                     style={{ backgroundImage: `url(${currentItem.imagenUrl})` }}
// //                   >
// //                     <div className={`absolute inset-0 ${currentItem.diseño === "oscuro" ? "bg-gradient-to-t from-black via-black/70 to-transparent" : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"}`} />

// //                     <div className="relative bg-black/60 backdrop-blur-md p-4 rounded-xl w-full">
// //                       <div className="flex items-center gap-2 mb-2">
// //                         <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
// //                           ⭐ PATROCINADO
// //                         </span>
// //                       </div>
// //                       <h2 className="text-3xl font-bold glow-text">{currentItem.banda}</h2>
// //                       {currentItem.disco && (
// //                         <p className="text-xl text-pink-300 mb-1">{currentItem.disco}</p>
// //                       )}
// //                       <p className="text-sm text-neutral-300 mt-2">📍 {currentItem.direccion}</p>
// //                       <p className="text-sm text-neutral-300">
// //                         📅 {formatDate(currentItem.fecha)} {currentItem.hora && `- 🕐 ${currentItem.hora}`}
// //                       </p>
// //                     </div>
// //                   </div>
// //                 </Link>
// //               ) : currentItem && !isPatrocinio(currentItem) ? (
// //                 <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500"
// //                   style={{ backgroundImage: `url(${currentItem.coverUrl || currentItem.cover || './assets/zoonito.jpg'})` }}
// //                 >
// //                   <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl">
// //                     <h2 className="text-2xl font-bold glow-text">{currentItem.title}</h2>
// //                     <p className="text-sm text-neutral-300">{currentItem.artist}</p>
// //                   </div>
// //                 </div>
// //               ) : null}

// //               <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
// //                 <ChevronLeft className="w-6 h-6 text-white" />
// //               </button>
// //               <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
// //                 <ChevronRight className="w-6 h-6 text-white" />
// //               </button>

// //               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
// //                 {sliderItems.slice(0, 5).map((_, idx) => (
// //                   <button
// //                     key={idx}
// //                     onClick={() => setCurrentSlide(idx)}
// //                     className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-pink-500 w-6' : 'bg-white/50'}`}
// //                   />
// //                 ))}
// //               </div>
// //             </div>
// //           </section>
// //         )}

// //         {!showSearchResults && avanceMusics.length > 0 && (
// //           <section className="mb-12 px-4">
// //             <div className="flex items-center justify-between mb-6">
// //               <div className="flex items-center gap-3">
// //                 <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
// //                 <h2 className="text-3xl font-bold text-white glow-text">
// //                   Avances Exclusivos
// //                 </h2>
// //               </div>
// //             </div>

// //             <div className="relative">
// //               <div className="glass-card overflow-hidden rounded-2xl shadow-2xl">
// //                 {avanceMusics[avanceSlide] && (
// //                   <div className="relative">
// //                     <div
// //                       className="h-[500px] md:h-[500px] bg-cover bg-center relative group"
// //                       style={{ backgroundImage: `url(${avanceMusics[avanceSlide].coverUrl || avanceMusics[avanceSlide].cover || './assets/zoonito.jpg'})` }}
// //                     >
// //                       <div className="absolute inset-0 bg-black/85 md:bg-transparent" />
// //                       <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

// //                       <div className="absolute top-6 left-6">
// //                         <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse">
// //                           <Sparkles className="w-4 h-4" />
// //                           AVANCE EXCLUSIVO
// //                         </span>
// //                       </div>

// //                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
// //                         <button
// //                           onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
// //                           className="bg-pink-500 hover:bg-pink-600 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
// //                         >
// //                           <Play className="w-12 h-12 fill-white" />
// //                         </button>
// //                       </div>

// //                       <div className="absolute inset-0 md:bottom-0 md:inset-auto left-0 right-0 p-4 md:p-8 flex items-center md:items-end">
// //                         <div className="bg-black/90 md:bg-black/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-pink-500/30 w-full">
// //                           <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 glow-text">
// //                             {avanceMusics[avanceSlide].title}
// //                           </h3>

// //                           <div className="flex items-center gap-3 mb-4">
// //                             <img
// //                               src={avanceMusics[avanceSlide].avatarArtist || '/default-artist.png'}
// //                               alt={avanceMusics[avanceSlide].artist}
// //                               className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-pink-500"
// //                             />
// //                             <div>
// //                               <p className="text-base md:text-xl text-pink-300 font-semibold">
// //                                 {avanceMusics[avanceSlide].artist}
// //                               </p>
// //                               {avanceMusics[avanceSlide].album && (
// //                                 <p className="text-xs md:text-sm text-gray-300">
// //                                   {avanceMusics[avanceSlide].album}
// //                                 </p>
// //                               )}
// //                             </div>
// //                           </div>

// //                           <div className="flex flex-wrap gap-2 md:gap-3 items-center">
// //                             <button
// //                               onClick={() => toggleLike(avanceMusics[avanceSlide]._id)}
// //                               className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-105 ${avanceMusics[avanceSlide].likedByUser
// //                                 ? 'bg-red-500 text-white'
// //                                 : 'bg-white/20 text-white hover:bg-white/30'
// //                                 }`}
// //                             >
// //                               <Heart className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].likedByUser ? 'fill-white' : ''}`} />
// //                               {formatLikes(avanceMusics[avanceSlide].likes ?? 0)}
// //                             </button>

// //                             <button
// //                               onClick={() => setShowRatingModal(avanceMusics[avanceSlide]._id)}
// //                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
// //                             >
// //                               <Star className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
// //                               {avanceMusics[avanceSlide].rating?.toFixed(1) ?? '0.0'}
// //                             </button>

// //                             <button
// //                               onClick={() => downloadMusic(avanceMusics[avanceSlide])}
// //                               className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-green-500 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
// //                               title="Descargar canción"
// //                             >
// //                               <Download className="w-4 h-4 md:w-5 md:h-5" />
// //                               <span className="hidden sm:inline">Descargar</span>
// //                             </button>

// //                             <button
// //                               onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
// //                               className="px-3 md:px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg"
// //                             >
// //                               <span className="hidden sm:inline">➕ </span>Añadir
// //                             </button>

// //                             {avanceMusics[avanceSlide].idMusico && (
// //                             <Link
// //                                 href={`/fanpage/${avanceMusics[avanceSlide].idMusico}`}
// //                                 className="px-3 md:px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm md:text-base shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105 ring-1 ring-purple-400/30 hover:ring-pink-300/50"
// //                               >
// //                                 Saber Más
// //                               </Link>
// //                             )}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>

// //               {avanceMusics.length > 1 && (
// //                 <>
// //                   <button
// //                     onClick={prevAvance}
// //                     className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
// //                   >
// //                     <ChevronLeft className="w-6 h-6" />
// //                   </button>
// //                   <button
// //                     onClick={nextAvance}
// //                     className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
// //                   >
// //                     <ChevronRight className="w-6 h-6" />
// //                   </button>

// //                   <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
// //                     {avanceMusics.map((_, idx) => (
// //                       <button
// //                         key={idx}
// //                         onClick={() => setAvanceSlide(idx)}
// //                         className={`w-3 h-3 rounded-full transition-all ${idx === avanceSlide
// //                           ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-10'
// //                           : 'bg-white/30 hover:bg-white/50'
// //                           }`}
// //                       />
// //                     ))}
// //                   </div>
// //                 </>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {selectedGenre && !showSearchResults && (
// //           <div className="px-6 mb-6">
// //             <h2 className="text-3xl font-bold glow-text">{selectedGenre}</h2>
// //             <p className="text-neutral-400 mt-2">{filteredMusics.length} canciones encontradas</p>
// //           </div>
// //         )}

// //         {!selectedGenre && !showSearchResults && (
// //           <section className="px-6 mb-12">
// //             <div className="flex items-center justify-between mb-6">
// //               <h2 className="text-center text-2xl font-bold glow-text">Artistas Destacados</h2>
// //             </div>
// //             {artistsArray.length === 0 ? (
// //               <p className="text-center text-neutral-300">No hay artistas</p>
// //             ) : (
// //               <div className="relative">
// //                 <div className="overflow-hidden">
// //                   <div
// //                     className="flex gap-8 transition-transform duration-500 ease-out py-10"
// //                     style={{ transform: `translateX(-${artistSlide * 100}%)` }}
// //                   >
// //                     {artistsArray.slice(0, 9).map((artist, index) => (
// //                       <div key={index} className="flex-shrink-0 w-full md:w-[calc(33.333%-2rem)] min-w-[200px]">
// //                         <Link
// //                           href={`/fanpage/${artist.name.replace(/\s+/g, '-').toLowerCase()}`}
// //                           className="flex flex-col items-center group cursor-pointer"
// //                         >
// //                           <div className="avatar-card mb-4 w-full h-48 overflow-hidden rounded-lg shadow-lg">
// //                             <img
// //                               src={artist.avatarArtist || '/assets/zoonito.jpg'}
// //                               alt={artist.name}
// //                               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
// //                             />
// //                           </div>

// //                           <h3 className="text-sm font-semibold text-white text-center glow-secondary group-hover:glow-text transition-all mt-2">
// //                             {artist.name}
// //                           </h3>
// //                           {artist.genre && (
// //                             <p className="text-xs text-neutral-400 mt-1">{artist.genre}</p>
// //                           )}
// //                         </Link>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>

// //                 <button onClick={prevArtist} className="absolute left-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
// //                   <ChevronLeft className="w-6 h-6 text-white" />
// //                 </button>
// //                 <button onClick={nextArtist} className="absolute right-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
// //                   <ChevronRight className="w-6 h-6 text-white" />
// //                 </button>
// //               </div>
// //             )}
// //           </section>
// //         )}

// //         {!showSearchResults && (
// //           <>
// //             <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
// //               {displayMusics.map(m => (
// //                 <div key={m._id} className="glass-card overflow-hidden">
// //                   <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
// //                   <div className="p-4">
// //                     <h3 className="font-bold text-lg glow-text">{m.title}</h3>

// //                     <div className="flex items-center mt-1 gap-2">
// //                       <img
// //                         src={m.avatarArtist || '/default-artist.png'}
// //                         alt={m.artist}
// //                         className="w-12 h-12 rounded-full object-cover border border-white/30"
// //                       />
// //                       <p className="text-sm text-neutral-300">{m.artist}</p>
// //                     </div>

// //                     <div className="mt-3 flex justify-between items-center">
// //                       <button
// //                         onClick={() => toggleLike(m._id)}
// //                         className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
// //                           }`}
// //                       >
// //                         <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
// //                         {formatLikes(m.likes ?? 0)}
// //                       </button>

// //                       <button
// //                         onClick={() => setShowRatingModal(m._id)}
// //                         className="flex items-center gap-1 hover:text-yellow-400 transition"
// //                       >
// //                         <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
// //                         {m.rating?.toFixed(1) ?? '0.0'}
// //                       </button>

// //                       <button
// //                         onClick={() => downloadMusic(m)}
// //                         className="flex items-center gap-1 hover:text-green-400 transition"
// //                         title="Descargar canción"
// //                       >
// //                         <Download className="w-5 h-5" />
// //                       </button>
// //                     </div>

// //                     <div className="mt-2 flex gap-2">
// //                       <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
// //                         ➕ Playlist
// //                       </button>
// //                       <Link
// //                         href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
// //                         className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
// //                       >
// //                         Conocelos
// //                       </Link>
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </main>

// //             {!selectedGenre && filteredMusics.length > 12 && (
// //               <div className="flex justify-center mb-10">
// //                 <Link href="/musicAll" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded transition">
// //                   Ver más
// //                 </Link>
// //               </div>
// //             )}
// //           </>
// //         )}
// //       </div>

// //       {showRatingModal && (
// //         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
// //           <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-sm w-full">
// //             <h3 className="text-xl font-bold mb-4 text-white">Califica esta canción</h3>
// //             <div className="flex justify-center gap-2 mb-6">
// //               {[1, 2, 3, 4, 5].map(star => (
// //                 <button
// //                   key={star}
// //                   onMouseEnter={() => setHoverRating(star)}
// //                   onMouseLeave={() => setHoverRating(0)}
// //                   onClick={() => submitRating(showRatingModal, star)}
// //                   className="transition-transform hover:scale-110"
// //                 >
// //                   <Star
// //                     className={`w-10 h-10 ${star <= (hoverRating || musics.find(m => m._id === showRatingModal)?.userRating || 0)
// //                       ? 'fill-yellow-400 text-yellow-400'
// //                       : 'text-gray-400'
// //                       }`}
// //                   />
// //                 </button>
// //               ))}
// //             </div>
// //             <button
// //               onClick={() => setShowRatingModal(null)}
// //               className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
// //             >
// //               Cerrar
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }





'use client';
import { useEffect, useState, useContext } from 'react';
import { UserContext } from './context/UserContext';
import { ChevronLeft, ChevronRight, Heart, Star, Search, X, Sparkles, Play, Download, ArrowUp } from 'lucide-react';
import { Cancion } from "./components/Reproductor";
import { useReproductor } from './context/ReproductorContext';
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
  audioUrl?: string;
  likedByUser?: boolean;
  userRating?: number;
  avance?: boolean;
  idMusico?: string;
}

interface ArtistData {
  name: string;
  genre?: string;
  avatarArtist?: string;
  totalLikes: number;
  soloist?: boolean;
}

interface Patrocinio {
  _id: string;
  idMusico: string;
  banda: string;
  disco?: string;
  fecha: string;
  hora?: string;
  direccion: string;
  imagenUrl: string;
  promocionado: boolean;
  lanzar?: boolean;
  diseño: "claro" | "oscuro";
  creadoPor: string;
  congelar?: boolean;
}

const mockMusics: Music[] = [
  { _id: '1', title: 'Live at Sunset', artist: 'The Rockers', cover: '/assets/cantando.jpg', likes: 120, rating: 4.5, genre: '' },
  { _id: '2', title: 'Acoustic Dreams', artist: 'Jane Doe', cover: 'https://images.unsplash.com/photo-1509339022327-1e1e25360a9f?auto=format&fit=crop&w=1200&q=80', likes: 98, rating: 4.2, genre: 'Pop' },
  { _id: '3', title: 'Electronic Vibes', artist: 'DJ Pulse', cover: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1200&q=80', likes: 200, rating: 4.8, genre: 'Electronic' },
  { _id: '4', title: 'Night Drive', artist: 'The Weekenders', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', likes: 156, rating: 4.6, genre: 'Hip-Hop' },
];

const GENRES = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Folkclore', 'Reggae', 'efects'];

export default function HomePage() {
  const [musics, setMusics] = useState<Music[]>(mockMusics);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [artistSlide, setArtistSlide] = useState(0);
  const [avanceSlide, setAvanceSlide] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [patrocinios, setPatrocinios] = useState<Patrocinio[]>([]);
  const [showSponsorAlert, setShowSponsorAlert] = useState(false);
  const [currentSponsor, setCurrentSponsor] = useState<Patrocinio | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const user = useContext(UserContext);

  const { lista, agregarCancion, setLista, setIndiceActual } = useReproductor();

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
    const userId = ctx?.user?._id;
    return userId || null;
  };

  const getClosedSponsors = (): string[] => {
    if (typeof window === 'undefined') return [];
    const closed = window.localStorage.getItem('closedSponsors');
    return closed ? JSON.parse(closed) : [];
  };

  const saveClosedSponsor = (sponsorId: string) => {
    if (typeof window === 'undefined') return;
    const closed = getClosedSponsors();
    if (!closed.includes(sponsorId)) {
      closed.push(sponsorId);
      window.localStorage.setItem('closedSponsors', JSON.stringify(closed));
    }
  };

  const checkForSponsor = (sponsors: Patrocinio[]) => {
    const closedSponsors = getClosedSponsors();
    const pendingSponsor = sponsors.find(s => !closedSponsors.includes(s._id));

    if (pendingSponsor) {
      setCurrentSponsor(pendingSponsor);
      setShowSponsorAlert(true);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition > windowHeight / 2) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resMusic = await fetch('https://backend-zoonito-6x8h.vercel.app/api/music');
        if (!resMusic.ok) throw new Error('Error al obtener música');
        let data: Music[] = await resMusic.json();

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

        setMusics(data.length > 0 ? data : mockMusics);

        const resPatrocinios = await fetch('https://backend-zoonito-6x8h.vercel.app/api/eventos');
        if (resPatrocinios.ok) {
          const allEventos: Patrocinio[] = await resPatrocinios.json();

          const patrociniosActivos = allEventos.filter(
            e => e.promocionado && e.lanzar && new Date(e.fecha) >= new Date()
          );

          const patrociniosParaModal = allEventos.filter(
            e => e.promocionado && !e.congelar && new Date(e.fecha) >= new Date()
          );

          setPatrocinios(patrociniosActivos);
          checkForSponsor(patrociniosParaModal);
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setMusics(mockMusics);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
    }, 3000);

    return () => clearInterval(interval);
  }, [musics.length, patrocinios.length]);

  const handleCloseSponsor = async () => {
    if (currentSponsor) {
      saveClosedSponsor(currentSponsor._id);
    }
    setShowSponsorAlert(false);
  };

const handleGoToFanpage = () => {
  if (currentSponsor) {
    // Guardar el ID del evento del sponsor en localStorage
    localStorage.setItem('sponsorEventoId', currentSponsor.idMusico);
   
    // Guardar que este sponsor fue cerrado
    saveClosedSponsor(currentSponsor.idMusico);
    setShowSponsorAlert(false);
    // Redirigir a la página de publicaciones
    window.location.href = `/publising`;
  }
};

  const getSliderItems = () => {
    const allItems: Array<Music | Patrocinio> = [];

    if (musics.length < 3) {
      return musics;
    }

    allItems.push(...musics.slice(0, 3));

    const closedSponsors = getClosedSponsors();
    const validSponsors = patrocinios.filter(p => !closedSponsors.includes(p._id));
    allItems.push(...validSponsors);

    return allItems;
  };

  const isPatrocinio = (item: Music | Patrocinio): item is Patrocinio => {
    return 'banda' in item && 'creadoPor' in item;
  };

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

  const addToPlaylist = (music: Music) => {
    const nueva: Cancion = {
      id: music._id,
      titulo: music.title,
      artista: music.artist,
      url: music.audioUrl || '',
      cover: music.coverUrl || music.cover || '',
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

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % getSliderItems().length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + getSliderItems().length) % getSliderItems().length);

  const groupedArtists = () => {
    return musics.reduce((acc, song) => {
      if (!acc[song.artist]) {
        acc[song.artist] = {
          name: song.artist,
          genre: song.genre,
          avatarArtist: song.avatarArtist,
          totalLikes: song.likes || 0,
          soloist: song.soloist
        };
      } else {
        acc[song.artist].totalLikes += song.likes || 0;
      }
      return acc;
    }, {} as Record<string, ArtistData>);
  };

  const artistsArray = Object.values(groupedArtists()).sort((a, b) => b.totalLikes - a.totalLikes);
  const nextArtist = () => setArtistSlide(prev => (prev + 1) % artistsArray.length);
  const prevArtist = () => setArtistSlide(prev => (prev - 1 + artistsArray.length) % artistsArray.length);

  const avanceMusics = musics.filter(m => m.avance === true);
  const nextAvance = () => setAvanceSlide(prev => (prev + 1) % Math.max(1, avanceMusics.length));
  const prevAvance = () => setAvanceSlide(prev => (prev - 1 + Math.max(1, avanceMusics.length)) % Math.max(1, avanceMusics.length));

  const filteredMusics = musics.filter(m => {
    const matchesSearch = searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.artist.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre = selectedGenre === '' || m.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });

  const groupedByGenre = filteredMusics.reduce((acc, music) => {
    const genre = music.genre || 'Sin Género';
    if (!acc[genre]) {
      acc[genre] = [];
    }
    acc[genre].push(music);
    return acc;
  }, {} as Record<string, Music[]>);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
  };

  const closeSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedGenre('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sliderItems = getSliderItems();
  const currentItem = sliderItems[currentSlide];

  const getDisplayMusics = () => {
    if (selectedGenre) {
      return filteredMusics;
    }
    
    const total = filteredMusics.length;
    
    if (total <= 6) {
      return filteredMusics.slice(0, 6);
    } else if (total <= 9) {
      return filteredMusics.slice(0, 9);
    } else {
      return filteredMusics.slice(0, 12);
    }
  };

  const displayMusics = getDisplayMusics();

  return (
    <div className="min-h-screen animate-gradient-x relative overflow-x-hidden">
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-110 animate-bounce"
          aria-label="Volver arriba"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {showSponsorAlert && currentSponsor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-pink-500/30 animate-fade-in">
            <div className="text-center">
              <div className="mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg inline-block">
                  ⭐ EVENTO DESTACADO
                </span>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4 glow-text">
                ¡Nuevo Lanzamiento!
              </h2>

              <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={currentSponsor.imagenUrl}
                  alt={currentSponsor.disco || currentSponsor.banda}
                  className="w-full h-72 object-cover"
                />
              </div>

              <h3 className="text-3xl font-bold text-pink-300 mb-2">{currentSponsor.banda}</h3>
              {currentSponsor.disco && (
                <p className="text-2xl text-white mb-4">{currentSponsor.disco}</p>
              )}

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 mb-6 space-y-2">
                <p className="text-base text-gray-200 flex items-center justify-center gap-2">
                  <span>📍</span> {currentSponsor.direccion}
                </p>
                <p className="text-base text-gray-200 flex items-center justify-center gap-2">
                  <span>📅</span> {formatDate(currentSponsor.fecha)}
                </p>
                {currentSponsor.hora && (
                  <p className="text-base text-gray-200 flex items-center justify-center gap-2">
                    <span>🕐</span> {currentSponsor.hora}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseSponsor}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleGoToFanpage}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-full font-bold shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105"
                >
                  Ver más
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
<nav className="navbar sticky top-0 z-20 mb-8 bg-black/20 backdrop-blur-md">
  <div className="px-4 py-3 border-b border-white/10">
    <div className="relative max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar por canción o artista..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
      />
      {searchQuery && (
        <button
          onClick={closeSearch}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>

  {/* Contenedor con scroll horizontal */}
  <div className="relative">
    {/* Gradiente izquierdo para indicar más contenido */}
    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 to-transparent pointer-events-none z-10" />
    
    {/* Gradiente derecho para indicar más contenido */}
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
    
    <div className="flex py-3 px-4 gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
      <button
        onClick={() => setSelectedGenre('')}
        className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${
          selectedGenre === ''
            ? 'bg-pink-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        Todos
      </button>

      {GENRES.map((genre) => (
        <button
          key={genre}
          onClick={() => setSelectedGenre(genre)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap flex-shrink-0 ${
            selectedGenre === genre
              ? 'bg-pink-500 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {genre}
        </button>
      ))}

      <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition whitespace-nowrap ml-4 flex-shrink-0">
        Suscribete
      </button>
    </div>
  </div>
</nav>

<style jsx>{`
  /* Ocultar scrollbar pero mantener funcionalidad */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Mejorar el scroll en móviles */
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
`}</style>

      {showSearchResults && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 overflow-y-auto">
          <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">
                  Resultados de búsqueda
                  <span className="text-pink-500 ml-2">({filteredMusics.length})</span>
                </h2>
                <button
                  onClick={closeSearch}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {filteredMusics.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-2xl text-gray-400">No se encontraron resultados</p>
                  <p className="text-gray-500 mt-2">Intenta con otro término de búsqueda</p>
                </div>
              ) : (
                Object.entries(groupedByGenre).map(([genre, songs]) => (
                  <div key={genre} className="mb-12">
                    <h3 className="text-2xl font-bold text-white mb-6 glow-text">{genre}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {songs.map(m => (
                        <div key={m._id} className="glass-card overflow-hidden">
                          <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
                          <div className="p-4">
                            <h3 className="font-bold text-lg glow-text">{m.title}</h3>

                            <div className="flex items-center mt-1 gap-2">
                              <img
                                src={m.avatarArtist || '/default-artist.png'}
                                alt={m.artist}
                                className="w-12 h-12 rounded-full object-cover border border-white/30"
                              />
                              <p className="text-sm text-neutral-300">{m.artist}</p>
                            </div>

                            <div className="mt-3 flex justify-between items-center">
                              <button
                                onClick={() => toggleLike(m._id)}
                                className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
                                  }`}
                              >
                                <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
                                {formatLikes(m.likes ?? 0)}
                              </button>

                              <button
                                onClick={() => setShowRatingModal(m._id)}
                                className="flex items-center gap-1 hover:text-yellow-400 transition"
                              >
                                <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                {m.rating?.toFixed(1) ?? '0.0'}
                              </button>

                              <button
                                onClick={() => downloadMusic(m)}
                                className="flex items-center gap-1 hover:text-green-400 transition"
                                title="Descargar canción"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="mt-2 flex gap-2">
                              <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
                                ➕ Playlist
                              </button>
                              <Link
                                href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
                                className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
                              >
                                Conocelos
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {!selectedGenre && !showSearchResults && (
          <section className="mb-10 px-4">
            <div className="relative rounded-2xl shadow-2xl overflow-hidden">
              {currentItem && isPatrocinio(currentItem) ? (
                <Link href={`/fanpage/${currentItem.banda.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500 cursor-pointer hover:opacity-95 relative"
                    style={{ backgroundImage: `url(${currentItem.imagenUrl})` }}
                  >
                    <div className={`absolute inset-0 ${currentItem.diseño === "oscuro" ? "bg-gradient-to-t from-black via-black/70 to-transparent" : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"}`} />

                    <div className="relative bg-black/60 backdrop-blur-md p-4 rounded-xl w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                          ⭐ PATROCINADO
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold glow-text">{currentItem.banda}</h2>
                      {currentItem.disco && (
                        <p className="text-xl text-pink-300 mb-1">{currentItem.disco}</p>
                      )}
                      <p className="text-sm text-neutral-300 mt-2">📍 {currentItem.direccion}</p>
                      <p className="text-sm text-neutral-300">
                        📅 {formatDate(currentItem.fecha)} {currentItem.hora && `- 🕐 ${currentItem.hora}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : currentItem && !isPatrocinio(currentItem) ? (
                <div className="h-[400px] bg-cover bg-center flex items-end p-6 transition-all duration-500"
                  style={{ backgroundImage: `url(${currentItem.coverUrl || currentItem.cover || './assets/zoonito.jpg'})` }}
                >
                  <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl">
                    <h2 className="text-2xl font-bold glow-text">{currentItem.title}</h2>
                    <p className="text-sm text-neutral-300">{currentItem.artist}</p>
                  </div>
                </div>
              ) : null}

              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition">
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {sliderItems.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-pink-500 w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {!showSearchResults && avanceMusics.length > 0 && (
          <section className="mb-12 px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                <h2 className="text-3xl font-bold text-white glow-text">
                  Avances Exclusivos
                </h2>
              </div>
            </div>

            <div className="relative">
              <div className="glass-card overflow-hidden rounded-2xl shadow-2xl">
                {avanceMusics[avanceSlide] && (
                  <div className="relative">
                    <div
                      className="h-[500px] md:h-[500px] bg-cover bg-center relative group"
                      style={{ backgroundImage: `url(${avanceMusics[avanceSlide].coverUrl || avanceMusics[avanceSlide].cover || './assets/zoonito.jpg'})` }}
                    >
                      <div className="absolute inset-0 bg-black/85 md:bg-transparent" />
                      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                      <div className="absolute top-6 left-6">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse">
                          <Sparkles className="w-4 h-4" />
                          AVANCE EXCLUSIVO
                        </span>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
                          className="bg-pink-500 hover:bg-pink-600 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
                        >
                          <Play className="w-12 h-12 fill-white" />
                        </button>
                      </div>

                      <div className="absolute inset-0 md:bottom-0 md:inset-auto left-0 right-0 p-4 md:p-8 flex items-center md:items-end">
                        <div className="bg-black/90 md:bg-black/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-pink-500/30 w-full">
                          <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 glow-text">
                            {avanceMusics[avanceSlide].title}
                          </h3>

                          <div className="flex items-center gap-3 mb-4">
                            <img
                              src={avanceMusics[avanceSlide].avatarArtist || '/default-artist.png'}
                              alt={avanceMusics[avanceSlide].artist}
                              className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-pink-500"
                            />
                            <div>
                              <p className="text-base md:text-xl text-pink-300 font-semibold">
                                {avanceMusics[avanceSlide].artist}
                              </p>
                              {avanceMusics[avanceSlide].album && (
                                <p className="text-xs md:text-sm text-gray-300">
                                  {avanceMusics[avanceSlide].album}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                            <button
                              onClick={() => toggleLike(avanceMusics[avanceSlide]._id)}
                              className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-105 ${avanceMusics[avanceSlide].likedByUser
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].likedByUser ? 'fill-white' : ''}`} />
                              {formatLikes(avanceMusics[avanceSlide].likes ?? 0)}
                            </button>

                            <button
                              onClick={() => setShowRatingModal(avanceMusics[avanceSlide]._id)}
                              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
                            >
                              <Star className={`w-4 h-4 md:w-5 md:h-5 ${avanceMusics[avanceSlide].userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                              {avanceMusics[avanceSlide].rating?.toFixed(1) ?? '0.0'}
                            </button>

                            <button
                              onClick={() => downloadMusic(avanceMusics[avanceSlide])}
                              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full bg-white/20 hover:bg-green-500 text-white font-semibold text-sm md:text-base transition-all hover:scale-105"
                              title="Descargar canción"
                            >
                              <Download className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="hidden sm:inline">Descargar</span>
                            </button>

                            <button
                              onClick={() => addToPlaylist(avanceMusics[avanceSlide])}
                              className="px-3 md:px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm md:text-base transition-all hover:scale-105 shadow-lg"
                            >
                              <span className="hidden sm:inline">➕ </span>Añadir
                            </button>

                            {avanceMusics[avanceSlide].idMusico && (
                              <Link
                                href={`/saber-mas/${avanceMusics[avanceSlide].idMusico}`}
                                className="px-3 md:px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm md:text-base shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105 ring-1 ring-purple-400/30 hover:ring-pink-300/50"
                              >
                                Saber Más
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {avanceMusics.length > 1 && (
                <>
                  <button
                    onClick={prevAvance}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextAvance}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all hover:scale-110 shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {avanceMusics.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAvanceSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${idx === avanceSlide
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-10'
                            : 'bg-white/30 hover:bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {selectedGenre && !showSearchResults && (
          <div className="px-6 mb-6">
            <h2 className="text-3xl font-bold glow-text">{selectedGenre}</h2>
            <p className="text-neutral-400 mt-2">{filteredMusics.length} canciones encontradas</p>
          </div>
        )}

        {!selectedGenre && !showSearchResults && (
          <section className="px-6 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-center text-2xl font-bold glow-text">Artistas Destacados</h2>
            </div>
            {artistsArray.length === 0 ? (
              <p className="text-center text-neutral-300">No hay artistas</p>
            ) : (
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex gap-8 transition-transform duration-500 ease-out py-10"
                    style={{ transform: `translateX(-${artistSlide * 100}%)` }}
                  >
                    {artistsArray.slice(0, 9).map((artist, index) => (
                      <div key={index} className="flex-shrink-0 w-full md:w-[calc(33.333%-2rem)] min-w-[200px]">
                        <Link
                          href={`/fanpage/${artist.name.replace(/\s+/g, '-').toLowerCase()}`}
                          className="flex flex-col items-center group cursor-pointer"
                        >
                          <div className="avatar-card mb-4 w-full h-48 overflow-hidden rounded-lg shadow-lg">
                            <img
                              src={artist.avatarArtist || '/assets/zoonito.jpg'}
                              alt={artist.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          <h3 className="text-sm font-semibold text-white text-center glow-secondary group-hover:glow-text transition-all mt-2">
                            {artist.name}
                          </h3>
                          {artist.genre && (
                            <p className="text-xs text-neutral-400 mt-1">{artist.genre}</p>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={prevArtist} className="absolute left-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button onClick={nextArtist} className="absolute right-0 top-1/3 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition z-10 md:hidden">
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </section>
        )}

        {!showSearchResults && (
          <>
            <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayMusics.map(m => (
                <div key={m._id} className="glass-card overflow-hidden">
                  <img src={m.coverUrl || m.cover || './assets/zoonito.jpg'} alt={m.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-lg glow-text">{m.title}</h3>

                    <div className="flex items-center mt-1 gap-2">
                      <img
                        src={m.avatarArtist || '/default-artist.png'}
                        alt={m.artist}
                        className="w-12 h-12 rounded-full object-cover border border-white/30"
                      />
                      <p className="text-sm text-neutral-300">{m.artist}</p>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <button
                        onClick={() => toggleLike(m._id)}
                        className={`flex items-center gap-1 transition-all ${m.likedByUser ? 'text-red-500' : 'text-white hover:text-red-400'
                          }`}
                      >
                        <Heart className={`w-5 h-5 ${m.likedByUser ? 'fill-red-500' : ''}`} />
                        {formatLikes(m.likes ?? 0)}
                      </button>

                      <button
                        onClick={() => setShowRatingModal(m._id)}
                        className="flex items-center gap-1 hover:text-yellow-400 transition"
                      >
                        <Star className={`w-5 h-5 ${m.userRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        {m.rating?.toFixed(1) ?? '0.0'}
                      </button>

                      <button
                        onClick={() => downloadMusic(m)}
                        className="flex items-center gap-1 hover:text-green-400 transition"
                        title="Descargar canción"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button onClick={() => addToPlaylist(m)} className="w-1/2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-1 rounded transition">
                        ➕ Playlist
                      </button>
                      <Link
                        href={`/fanpage/${m.artist.replace(/\s+/g, '-').toLowerCase()}`}
                        className="w-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold py-2 rounded-lg shadow-lg hover:shadow-pink-400/50 transition-all duration-300 text-center ring-1 ring-purple-400/30 hover:ring-pink-300/50"
                      >
                        Conocelos
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </main>

            {!selectedGenre && filteredMusics.length > 12 && (
              <div className="flex justify-center mb-10">
                <Link href="/musicAll" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded transition">
                  Ver más
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-6 max-w-sm w-full">
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
    </div>
  );
}
