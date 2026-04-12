import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, LogOut, Sun, Moon, Bluetooth, ShieldCheck, Heart, ArrowLeft } from 'lucide-react';
import Magnetic from './Magnetic';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

const Clock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR'));
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('fr-FR')), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="clock-display"><ClockIcon size={14} className="mr-1" /> {time}</div>;
};

const Navbar = ({ doctor, currentView, onNavigate, onLogout, theme, toggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="navbar-wrapper">
      {/* ROW 1: INSTITUTIONAL (FIXED) */}
      <div className="official-banner">
        <div className="banner-content">
          <div className="pfa-logos left">
            <img src="/istmt_logo.png" className="pfa-logo-img" alt="ISTMT" />
          </div>

          <div className="pfa-official-text">
            <span>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</span>
            <span>Université de Tunis El Manar</span>
            <span>Institut Supérieur des Technologies Médicales de Tunis</span>
          </div>

          <div className="pfa-logos right">
            <img src="/utm_logo.png" className="pfa-logo-img" alt="UTM" />
          </div>
        </div>
      </div>

      {/* ROW 2: ACTION BAR (CONTEXTUAL) */}
      <div className={`action-bar-container ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="action-bar glass-card">
          <div className="action-container">
            <div className="action-left">
              <AnimatePresence mode="wait">
                {currentView !== 'landing' && (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Magnetic>
                      <button
                        className="back-btn-v2"
                        onClick={() => {
                          if (currentView === 'session') onNavigate('dashboard');
                          else onNavigate('landing');
                        }}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    </Magnetic>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="app-branding" onClick={() => doctor ? onNavigate('dashboard') : onNavigate('landing')}>
                <span className="brand-text-v2">Stress <strong>Analyzer</strong></span>
              </div>
            </div>

            <div className="action-right">
              <div className="nav-pills-v2 hide-mobile">
              </div>

              <div className="actions-divider"></div>
              <Clock />

              <Magnetic>
                <button className="icon-btn theme-toggle-v2" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={20} />}
                </button>
              </Magnetic>

              {doctor ? (
                <div className="user-profile-v2">
                  <div className="avatar-v2">{doctor.name.charAt(0)}</div>
                  <span className="user-name-v2 hide-mobile">{doctor.name}</span>
                  <button className="icon-btn-text text-danger" onClick={onLogout}>
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="auth-links-v2">
                  <Magnetic>
                    <button className="btn btn-primary-v2" onClick={() => onNavigate('login')}>Connexion</button>
                  </Magnetic>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .navbar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .official-banner {
          background: var(--surface-solid);
          border-bottom: 2px solid var(--primary);
          padding: 0.75rem 2rem;
          color: var(--text-main);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .banner-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pfa-official-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
        }
        .pfa-official-text span {
          font-family: 'Outfit';
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.95rem;
          line-height: 1.2;
        }
        .pfa-official-text span:first-child { font-weight: 500; font-size: 0.8rem; opacity: 0.8; }

        .pfa-logo-img { height: 80px; width: auto; object-fit: contain; }
        .dark .pfa-logo-img { filter: brightness(1.2) contrast(1.1); }

        .action-bar-container {
          padding: 0.75rem 1.5rem;
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-scrolled {
          background: rgba(var(--bg-rgb), 0.5);
          backdrop-filter: blur(20px);
          padding: 0.4rem 1.5rem;
        }

        .action-bar {
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .action-container {
          padding: 0.6rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .action-left, .action-right { display: flex; align-items: center; gap: 1rem; }

        .app-branding { cursor: pointer; display: flex; align-items: center; }
        .brand-text-v2 { font-family: 'Outfit'; font-size: 1.2rem; color: var(--text-muted); }
        .brand-text-v2 strong { color: var(--text-main); font-weight: 800; }

        .back-btn-v2 { width: 42px; height: 42px; border-radius: 14px; background: var(--secondary); border: 1px solid var(--border); color: var(--text-main); display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.3s; }
        .back-btn-v2:hover { background: var(--surface-hover); border-color: var(--primary); transform: translateX(-3px); }

        .pill-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-family: 'JetBrains Mono'; font-weight: 700; color: var(--text-muted); background: var(--secondary); padding: 0.3rem 0.8rem; border-radius: 99px; border: 1px solid var(--border); }
        .actions-divider { width: 1px; height: 24px; background: var(--border); }
        
        .avatar-v2 { width: 34px; height: 34px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
        .user-profile-v2 { display: flex; align-items: center; gap: 0.75rem; background: var(--secondary); padding: 2px 10px 2px 2px; border-radius: 99px; border: 1px solid var(--border); }
        .user-name-v2 { font-size: 0.85rem; font-weight: 700; }

        .btn-primary-v2 { background: var(--primary); color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 99px; font-weight: 800; font-size: 0.9rem; font-family: 'Outfit'; transition: 0.3s; }
        .btn-primary-v2:hover { background: var(--primary-hover); transform: scale(1.05); box-shadow: 0 5px 15px var(--primary-shadow); }

        .clock-display { font-family: 'JetBrains Mono'; font-size: 0.85rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; }

        @media (max-width: 900px) {
           .hide-mobile { display: none; }
           .pfa-official-text span { font-size: 0.7rem; }
           .pfa-official-text span:first-child { font-size: 0.6rem; }
           .pfa-logo-img { height: 50px; }
        }
      `}} />
    </nav>
  );
};

export default Navbar;
