import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orbit — Hub Pessoal Cósmico',
    short_name: 'Orbit',
    description: 'Hub pessoal de tarefas, finanças e hábitos.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#090812',
    theme_color: '#844DFE',
    orientation: 'portrait-primary',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
