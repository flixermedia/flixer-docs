import type { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme/Layout'

const services = [
  { tag: 'Backend', name: 'flixer', to: '/flixer/overview', text: 'Accounts, libraries, settings, playback authorization, and administration.' },
  { tag: 'Web app', name: 'flixer-web', to: '/flixer-web/overview', text: 'Browse your library, manage your account, and play media.' },
  { tag: 'Playback', name: 'flixer-streamer', to: '/flixer-streamer/overview', text: 'Delivers authorized media and handles playback conversion.' },
  { tag: 'Library scans', name: 'flixer-indexer', to: '/flixer-indexer/overview', text: 'Finds media and adds metadata and artwork to your library.' },
  { tag: 'Logging', name: 'flixer-logger', to: '/flixer-logger/overview', text: 'Collects structured service events for search and troubleshooting.' },
  { tag: 'Updates', name: 'flixer-updater', to: 'https://github.com/flixermedia/flixer-updater', text: 'Handles in-dashboard updates, backups, and rollback.' },
  { tag: 'Optional', name: 'flixer-ai', to: '/flixer-ai/overview', text: 'Adds recommendations when the optional AI profile is enabled.' },
  { tag: 'Catalogue', name: 'flixer-plugins', to: '/flixer-plugins/overview', text: 'Official catalogue and schemas for Flixer plugins.' },
  { tag: 'Independent', name: 'flixer-cloud', to: 'https://github.com/flixermedia/flixer-cloud', text: 'A separate public website, not part of the self-hosted server.' },
  { tag: 'Docs', name: 'flixer-docs', to: '/ecosystem', text: 'Repository guide to the Flixer services and supporting projects.' },
]

export default function Home(): ReactNode {
  const logo = useBaseUrl('/img/logo.svg')
  return (
    <Layout title="Flixer Docs" description="Install, run, and understand the Flixer media platform">
      <header className="hero-flixer">
        <img src={logo} alt="" />
        <h1>Flixer</h1>
        <p>Self-host your media library. Set up Flixer, add a library, and start watching.</p>
        <div className="hero-buttons">
          <Link className="button button--primary button--lg" to="/getting-started/quick-start">
            Get started
          </Link>
          <Link className="button button--secondary button--lg" to="/operations/troubleshooting">
            Get help
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
