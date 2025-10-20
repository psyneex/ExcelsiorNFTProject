import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import './SiteLayout.css';

interface SiteLayoutProps {
  children: ReactNode;
}

export const SiteLayout = ({ children }: SiteLayoutProps) => {
  return (
    <div className="site">
      <header className="site__header">
        <div className="site__header-inner">
          <div className="site__brand">
            <span className="site__brand-subtitle">Excelsior NFT Program</span>
            <h1 className="site__brand-title">Grand Resort Collections</h1>
          </div>

          <nav className="site__nav">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `site__nav-link ${isActive ? 'site__nav-link--active' : ''}`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/collections"
              className={({ isActive }) =>
                `site__nav-link ${isActive ? 'site__nav-link--active' : ''}`
              }
            >
              Collections
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `site__nav-link ${isActive ? 'site__nav-link--active' : ''}`
              }
            >
              Dashboard
            </NavLink>
          </nav>

          <div className="site__connect">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="site__main">
        <div className="container">{children}</div>
      </main>

      <footer className="site__footer">
        <div className="container">
          <span>Excelsior Hospitality - NFT Membership Programme</span>
        </div>
      </footer>
    </div>
  );
};
