import './App.css';
import { NftList } from './components/NftList';
import { AdminPage } from './components/AdminPage';
import { HomePage } from './components/HomePage';
import { Collections } from './components/Collections';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';

function App() {
  return (
    <Router>
      <SiteLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collection/:collectionId" element={<NftList />} />
          <Route path="/dashboard" element={<AdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </SiteLayout>
    </Router>
  );
}

export default App;
