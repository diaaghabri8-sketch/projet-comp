import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, LogOut, Sun, Moon, Bluetooth, ShieldCheck, Heart } from 'lucide-react';
import Magnetic from './Magnetic';
import { motion, AnimatePresence, useScroll } from 'framer-motion';

const Clock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('fr-FR'));
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString('fr-FR')), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="clock-display"><ClockIcon size={14} className="mr-1"/> {time}</div>;
};

const Navbar = ({ doctor, onNavigate, onLogout, theme, toggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar glass-card ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="scroll-progress-container">
        <motion.div 
           className="scroll-progress-fill"
           style={{ scaleX: useScroll().scrollYProgress }}
        />
      </div>
      <div className={`nav-container ${scrolled ? 'nav-compact' : ''}`}>
        <div className="nav-left">
          <Magnetic>
            <div className="nav-brand" onClick={() => doctor ? onNavigate('dashboard') : onNavigate('landing')}>
              <div className="logo-box-v2">
                 <Heart size={20} fill="currentColor" stroke="none" />
              </div>
              <span className="brand-text-v2">Stress <strong>Pulse</strong></span>
            </div>
          </Magnetic>
          
          <div className="nav-pills-v2">
             <div className="pill-item"><Bluetooth size={12}/> Connected</div>
             <div className="pill-item"><ShieldCheck size={12}/> Secure</div>
          </div>
        </div>

        <div className="nav-actions">
          <Clock />
          
          <div className="actions-divider"></div>
          
          <Magnetic>
            <button className="icon-btn theme-toggle-v2" onClick={toggleTheme} aria-label="Changer le thème">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </Magnetic>

          {doctor ? (
            <div className="user-profile-v2">
               <div className="avatar-v2">{doctor.name.charAt(0)}</div>
               <span className="user-name-v2">{doctor.name}</span>
               <button className="icon-btn-text text-danger" onClick={onLogout}>
                 <LogOut size={16} /> Quitter
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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .scroll-progress-container { position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: transparent; overflow: hidden; }
        .scroll-progress-fill { height: 100%; background: var(--gradient-tech); transform-origin: left; }
        
        .nav-left { display: flex; align-items: center; gap: 2rem; }
        .logo-box-v2 { width: 36px; height: 36px; background: var(--gradient-tech); border-radius: 10px; display: flex; justify-content: center; align-items: center; color: white; -webkit-mask-image: linear-gradient(rgba(0,0,0,1), rgba(0,0,0,0.8)); box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2); }
        .brand-text-v2 { font-family: 'Outfit'; font-size: 1.25rem; font-weight: 300; letter-spacing: -0.02em; }
        .brand-text-v2 strong { color: var(--text-main); font-weight: 600; }
        .nav-pills-v2 { display: flex; gap: 0.75rem; }
        .pill-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-family: 'JetBrains Mono'; color: var(--text-muted); background: var(--secondary); padding: 0.25rem 0.6rem; border-radius: 99px; border: 1px solid var(--border); }
        .actions-divider { width: 1px; height: 24px; background: var(--border); margin: 0 1rem; }
        .btn-primary-v2 { background: var(--text-main); color: var(--bg-color); padding: 0.6rem 1.2rem; border-radius: 99px; font-weight: 500; font-family: 'Outfit'; border: none; transition: 0.3s; }
        .btn-primary-v2:hover { filter: invert(0.1); transform: translateY(-2px); }
        .btn-secondary-v2 { background: var(--secondary); color: var(--text-main); padding: 0.6rem 1.2rem; border-radius: 99px; font-weight: 500; border: 1px solid var(--border); transition: 0.3s; }
        .btn-secondary-v2:hover { background: var(--surface-hover); }
        .navbar-scrolled { border-bottom: 2px solid var(--primary); backdrop-filter: blur(40px) saturate(180%); }
        .avatar-v2 { width: 34px; height: 34px; background: var(--primary); color: white; border-radius: 50%; font-family: 'Outfit'; display: flex; justify-content: center; align-items: center; font-weight: 600; }
        .user-profile-v2 { display: flex; align-items: center; gap: 0.75rem; background: var(--secondary); padding: 0.3rem 0.6rem 0.3rem 0.3rem; border-radius: 99px; border: 1px solid var(--border); }
      `}} />
    </nav>
  );
};

export default Navbar;
