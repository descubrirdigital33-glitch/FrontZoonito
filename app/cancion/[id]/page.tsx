// app/cancion/[id]/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
// 🎵 Escucha
export async function generateMetadata({ params }: { params: { _id: string } }): Promise<Metadata> {
  try {
    const music = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${params._id}`, {
      cache: 'no-store' // O 'force-cache' según necesites
    }).then(r => r.json());
    alert(music)
    const imageUrl = music.coverUrl || music.avatarArtist || music.cover;
    const fullImageUrl = imageUrl?.startsWith('http') 
      ? imageUrl 
      : `https://backend-zoonito-6x8h.vercel.app${imageUrl?.startsWith('/') ? '' : '/'}${imageUrl}`;

    return {
      title: `${music.title} - ${music.artist} | Zoonito Music`,
      description: ` ESTA ES LA PARTE DEL BACKEND MAN ${music.title} de ${music.artist}${music.album ? ` del álbum ${music.album}` : ''}`,
      openGraph: {
        title: `${music.title} - ${music.artist}`,
        description: `⭐ ${music.rating?.toFixed(1) || '0.0'}/5 | ❤️ ${music.likes || 0} likes${music.playCount ? ` | 🎧 ${music.playCount} reproducciones` : ''}`,
        images: [{ 
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: `${music.title} - ${music.artist}`
        }],
        type: 'music.song',
        siteName: 'Zoonito Music',
        locale: 'es_AR',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${music.title} - ${music.artist}`,
        description: `🎵 Escucha esta canción en Zoonito Music`,
        images: [fullImageUrl],
      },
      // Metadatos adicionales para música
      other: {
        'music:musician': music.artist,
        'music:song': music.title,
        'music:album': music.album || '',
        'music:duration': music.duration || '',
      }
    };
  } catch (error) {
    console.error('Error generando metadata:', error);
    return {
      title: 'Canción no encontrada | Zoonito Music',
      description: 'Esta canción no está disponible'
    };
  }
}

// 🚨 IMPORTANTE: Necesitas el componente de la página
export default async function CancionPage({ params }: { params: { _id: string } }) {
  try {
    const music = await fetch(`https://backend-zoonito-6x8h.vercel.app/api/music/${params._id}`, {
      cache: 'no-store'
    }).then(r => r.json());

    // Redirigir a MusicAll con la canción seleccionada
    redirect(`/musicall?cancion=${params._id}`);
    
  } catch (error) {
    redirect('/musicall');
  }

}
