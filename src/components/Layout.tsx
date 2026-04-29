import { Link, Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

function isChallengeDetailPath(pathname: string): boolean {
  return /^\/challenges\/[^/]+$/.test(pathname)
}

export function Layout() {
  const { pathname } = useLocation()
  const challengeDetail = isChallengeDetailPath(pathname)

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Code Learn Platform
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link to="/">Dashboard</Link>
          <Link to="/challenges">Challenges</Link>
        </nav>
      </header>
      <main
        className={
          challengeDetail ? `${styles.main} ${styles.mainChallengeDetail}` : styles.main
        }
      >
        <Outlet />
      </main>
    </div>
  )
}
