import React, { useState } from 'react';
import { loginDoctor, registerDoctor } from '../db';
import { Lock, Mail, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Magnetic from '../components/Magnetic';

const AuthView = ({ type, onLogin, onNavigate }) => {
  const isLogin = type === 'login';
  const [email, setEmail] = useState(isLogin ? 'admin@medilib.fr' : '');
  const [password, setPassword] = useState(isLogin ? 'admin' : '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const doc = loginDoctor(email, password);
        onLogin(doc);
      } else {
        const doc = registerDoctor(name, email, password);
        onLogin(doc);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="view-container auth-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="auth-card glass-card">
        <div className="auth-header">
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {isLogin ? 'Bon retour parmi nous' : 'Créer un compte médical'}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {isLogin ? 'Connectez-vous à votre espace sécurisé.' : 'Déployez votre registre patient en local.'}
          </motion.p>
        </div>

        {error && (
          <motion.div 
            className="error-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
          >
            <ShieldAlert size={16}/> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                className="input-group"
                key="name-field"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <label>Nom complet</label>
                <div className="input-field">
                  <User size={18} className="input-icon" />
                  <input type="text" placeholder="Dr. Dupont" value={name} onChange={e=>setName(e.target.value)} required />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="input-group">
            <label>Email Workspace</label>
            <div className="input-field">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="admin@medilib.fr" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
          </div>
          
          <div className="input-group">
            <label>Mot de passe</label>
            <div className="input-field">
              <Lock size={18} className="input-icon" />
              <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
          </div>

          <Magnetic>
            <button type="submit" className="btn btn-primary w-full mt-4">
              {isLogin ? 'Accéder au Dashboard' : "S'inscrire"} <ArrowRight size={18} />
            </button>
          </Magnetic>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>Nouveau praticien ? <span onClick={() => onNavigate('register')}>Créer un espace</span></p>
          ) : (
            <p>Déjà enregistré ? <span onClick={() => onNavigate('login')}>Se connecter</span></p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import { AnimatePresence } from 'framer-motion';
export default AuthView;
