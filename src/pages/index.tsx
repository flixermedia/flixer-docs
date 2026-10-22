import type { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme/Layout'

const services = [
  { tag: 'API', name: 'flixer', to: '/flixer/overview', text: 'Ts.ED + Fastify + Postgres backend: auth, libraries, history, admin API and live updates.' },
  { tag: 'Frontend', name: 'flixer-web', to: '/flixer-web/overview', text: 'Vue 3 PWA with video and music players, lyrics, subtitles and the admin dashboard.' },
  { tag: 'Streaming', name: 'flixer-streamer', to: '/flixer-streamer/overview', text: 'Go + ffmpeg service for direct play, remux, transcode, HLS, subtitles and lyrics.' },
  { tag: 'Indexing', name: 'flixer-indexer', to: '/flixer-indexer/overview', text: 'Go service that scans libraries, probes files, fetches metadata and subtitles.' },
]

export default function Home(): ReactNode {
  const logo = useBaseUrl('/img/logo.svg')
  return (
    <Layout title="Flixer Docs" description="Documentation for the Flixer media streaming platform">
      <header className="hero-flixer">
        <img src={logo} alt="" />
        <h1>Flixer</h1>
        <p>Self-hosted streaming for your movies, TV shows and music. Four small services, one admin dashboard.</p>
        <div className="hero-buttons">
          <Link className="button button--primary button--lg" to="/getting-started/quick-start">
            Quick start
          </Link>
          <Link className="button button--secondary button--lg" to="/architecture/overview">
            How it works
          </Link>
        </div>
      </header>
      <main className="card-grid">
        {services.map((service) => (
          <Link key={service.name} className="card-flixer" to={service.to}>
            <span className="tag">{service.tag}</span>
            <h3>{service.name}</h3>
            <p>{service.text}</p>
          </Link>
        ))}
      </main>
    </Layout>
  )
}
