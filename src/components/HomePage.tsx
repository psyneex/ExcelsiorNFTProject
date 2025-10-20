import { Link } from 'react-router-dom';
import { COLLECTIONS } from '../config/contracts';
import './HomePage.css';

const FEATURE_COPY = [
  {
    title: 'Private reservations',
    body: 'Use token-gated booking codes to secure peak-season stays without the wait-list.',
  },
  {
    title: 'Flexible credits',
    body: 'Spend and top up on-suite upgrades, dining, and spa services at your pace.',
  },
  {
    title: 'Concierge perks',
    body: 'Unlock curated excursions and local partnerships tailored to each membership.',
  },
];

export const HomePage = () => {
  const primaryCollection = COLLECTIONS[0];

  return (
    <main className="homepage">
      <section className="homepage__hero">
        <div className="homepage__hero-text">
          <span className="homepage__eyebrow">Excelsior NFT Membership</span>
          <h1 className="homepage__heading">Stay like an owner, travel like a local.</h1>
          <p className="homepage__lead">
            Claim a tokenised residency pass that bundles priority booking, concierge care, and
            on-chain upgrade credits—ready whenever you are.
          </p>
          <div className="homepage__actions">
            <Link to={`/collection/${primaryCollection.id}`} className="homepage__action homepage__action--primary">
              Explore {primaryCollection.name}
            </Link>
            <Link to="/dashboard" className="homepage__action homepage__action--ghost">
              Open dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="homepage__features">
        <h2 className="homepage__subheading">Why members join</h2>
        <ul className="homepage__feature-list">
          {FEATURE_COPY.map((feature) => (
            <li key={feature.title} className="homepage__feature">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};
