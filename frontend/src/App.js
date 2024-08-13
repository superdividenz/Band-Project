import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Dashboard from './screens/Dashboard';
import GigManagement from './screens/GigManagement';
import MemberDirectory from './screens/MemberDirectory';
import EquipmentInventory from './screens/EquipmentInventory';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gigs" element={<GigManagement />} />
            <Route path="/members" element={<MemberDirectory />} />
            <Route path="/equipment" element={<EquipmentInventory />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
