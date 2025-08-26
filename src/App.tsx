import { ConnectButton } from '@rainbow-me/rainbowkit';
import './App.css';
import { NftList } from './components/NftList';
import { AdminPage } from './components/AdminPage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';


function App() {
  return (
    <Router>
      <div>
      <header className="appHeader">
        <h1 className="headerTitle">Excelsior Grand Resort NFT Collection</h1>
        <nav className="headerNav">
          <Link to="/" className="navLink">Home</Link>
          <Link to="/admin" className="navLink">Admin</Link>
          {/* You might need to wrap or pass a className to ConnectButton if the library allows it */}
          <div className="connectButton">
            <ConnectButton />
          </div>
        </nav>
      </header>

      <main className="appMain">
        <Routes>
          <Route path="/" element={<NftList />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      </div>
    </Router>
  );
}

export default App;
