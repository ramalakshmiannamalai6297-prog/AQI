import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Hotspots from "./pages/Hotspots";
import Prediction from "./pages/Prediction";
import Recommendations from "./pages/Recommendations";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content" style={{ flex: 1, width: "100%" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hotspots" element={<Hotspots />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;