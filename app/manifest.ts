import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ポケモンクイズ',
    short_name: 'PokeQuiz',
    description: 'ポケモンの名前を当てるクイズゲーム！',
    start_url: '/',
    display: 'standalone',
    background_color: '#7c3aed',
    theme_color: '#FFCC00',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
