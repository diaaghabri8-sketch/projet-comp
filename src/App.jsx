import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import SessionView from './views/SessionView';
import MovingOrbs from './components/MovingOrbs';
import CustomCursor from './components/CustomCursor';
import CursorGrains from './components/CursorGrains';
import { initDB } from './db';

import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [view, setView] = useState('landing');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [doctor, setDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB();
    // Simulate initial sequence
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
       document.documentElement.classList.add('dark');
    } else {
       document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleNavigate = (v) => setView(v);
  const handleLogin = (doc) => {
    setDoctor(doc);
    setView('dashboard');
  };
  const handleLogout = () => {
    setDoctor(null);
    setView('landing');
  };
  const handleStartSession = (patient) => {
    setSelectedPatient(patient);
    setView('session');
  };

  const renderView = () => {
    switch (view) {
      case 'landing': return <LandingView key="landing" onNavigate={handleNavigate} />;
      case 'login': return <AuthView key="login" type="login" onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'register': return <AuthView key="register" type="register" onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'dashboard': return <DashboardView key="dashboard" onStartSession={handleStartSession} />;
      case 'session': return <SessionView key="session" patient={selectedPatient} onEndSession={() => setView('dashboard')} />;
      default: return <LandingView key="landing-def" onNavigate={handleNavigate} />;
    }
  };


  return (
    <div className="app-root">
      <AnimatePresence>
        {loading && (
          <motion.div 
            key="loader"
            className="initial-loader"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <motion.div 
              className="loader-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="logo-box large">
                 <div className="logo-plus">+</div>
              </div>
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >INITIALISATION DU SYSTÈME</motion.h2>
              <div className="loader-bar">
                <motion.div 
                  className="loader-fill"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomCursor />
      
      <Navbar 
        doctor={doctor} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        theme={theme} 
        toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
      />
      <main className="main-content">
        <AnimatePresence mode="wait">
          {!loading && renderView()}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .initial-loader {
          position: fixed; inset: 0; 
          background: var(--bg-color); 
          z-index: 10000; 
          display: flex; justify-content: center; align-items: center;
        }
        .loader-content { text-align: center; width: 300px; }
        .logo-box.large { width: 80px; height: 80px; font-size: 2.5rem; margin: 0 auto 2rem; border-radius: 20px; }
        .initial-loader h2 { font-family: 'JetBrains Mono'; font-size: 0.8rem; letter-spacing: 4px; color: var(--primary); margin-bottom: 1.5rem; }
        .loader-bar { width: 100%; height: 2px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .loader-fill { height: 100%; background: var(--gradient-tech); }
      `}} />
    </div>
  );
}

export default App;
