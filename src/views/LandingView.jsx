import React, { useState, useEffect, useRef } from 'react';
import { Activity, Beaker, ShieldCheck, UserPlus, LogIn, ChevronRight, Zap, ArrowRight, Star, Cpu, Bluetooth, Tablet, Users, Globe, Lock, CheckCircle2, Layout, Database, Clock, ZapOff, Fingerprint, Waves, Smartphone, Shield, Radio, Heart } from 'lucide-react';
import Magnetic from '../components/Magnetic';
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useInView } from 'framer-motion';

const SectionHeader = ({ tag, title, desc, centered = true }) => (
   <motion.div
      className={`section-header ${centered ? 'text-center' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
   >
      <div className="tag">{tag}</div>
      <h2 className="title-md">{title}</h2>
      {desc && <p className="section-desc">{desc}</p>}
   </motion.div>
);

const LandingView = ({ onNavigate }) => {
   const [pulse, setPulse] = useState(false);
   const [activeStep, setActiveStep] = useState(0);
   const containerRef = useRef(null);

   const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start start", "end end"]
   });

   const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
   const bgTextY = useTransform(scrollYProgress, [0, 1], [0, -500]);
   const rotateHero = useTransform(scrollYProgress, [0, 0.2], [0, -5]);
   const bentoY = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
   const bentoOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

   useEffect(() => {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
   }, []);

   const titleVariants = {
      hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
   };

   const steps = [
      { title: "Authentification", icon: <Lock />, desc: "Connexion sécurisée en tant que docteur à votre interface dédiée." },
      { title: "Interface Docteur", icon: <Tablet />, desc: "Ouverture instantanée de votre espace et outils de diagnostic." },
      { title: "Gestion Patients", icon: <Users />, desc: "Planification et suivi complet de votre registre de rendez-vous." },
      { title: "Lancer la Séance", icon: <Activity />, desc: "Appairage BLE, acquisition PPG et calcul automatisé du niveau de stress." },
      { title: "Stockage", icon: <Database />, desc: "Archivage automatique de toutes les métriques et résultats du patient." }
   ];

   return (
      <motion.div ref={containerRef} className="view-container landing-view" initial="hidden" animate="visible">

         {/* 🚀 HERO SECTION */}
         <motion.div className="hero-section center-hero" style={{ scale, rotateZ: rotateHero, position: "relative", overflow: "hidden" }}>

            {/* ✨ Abstract Medical Aurora Background */}
            <div className="aurora-bg">
               <div className="aurora-blob blob-1"></div>
               <div className="aurora-blob blob-2"></div>
               <div className="aurora-blob blob-3"></div>
               <div className="mesh-grid"></div>
            </div>

            <div className="hero-text full-width">
                <motion.h1 className="hero-heading gradient-text text-center mt-4" variants={titleVariants} style={{ fontSize: '2.8rem', lineHeight: '1.2' }}>
                   {"Stress Analyzer".split('').map((char, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, type: 'spring' }}>{char}</motion.span>
                   ))}
                </motion.h1>
                <div className="pfa-full-name text-center mt-2 opacity-80 uppercase tracking-widest font-bold text-xs color-primary">
                   Système de détection de stress basé sur l'analyse des signaux ppg
                </div>
               <motion.p className="hero-subtext m-auto text-center mt-6" variants={titleVariants}>
                  Déterminer les niveaux de stress à partir d’un signal PPG en temps réel grâce à une télémétrie de précision.
               </motion.p>

            </div>

            {/* Floating Decor Items */}
            <motion.div className="ambient-orb orb-1" animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="ambient-orb orb-2" animate={{ y: [0, 30, 0], scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
         </motion.div>

         {/* 🚀 INFINITE BANNER */}
         <div className="infinite-banner-container">
            <div className="infinite-banner">
               {[...Array(6)].map((_, i) => (
                  <React.Fragment key={i}>
                     <span className="banner-item"><Heart size={16} /> SIGNAL PARFAIT</span>
                     <span className="banner-separator">•</span>
                     <span className="banner-item"><Zap size={16} /> TEMPS RÉEL</span>
                     <span className="banner-separator">•</span>
                     <span className="banner-item"><Shield size={16} /> SÉCURISÉ</span>
                     <span className="banner-separator">•</span>
                     <span className="banner-item"><Radio size={16} /> SANS FIL</span>
                     <span className="banner-separator">•</span>
                  </React.Fragment>
               ))}
            </div>
         </div>

         {/* 🍱 BENTO GRID (New Section) */}
         <motion.section className="section-container" style={{ y: bentoY, opacity: bentoOpacity }}>
            <SectionHeader tag="Capacités" title="Écosystème Intelligent" />
            <div className="bento-grid">
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <div className="bento-content">
                     <Waves className="bento-icon-main" size={24} />
                     <h4>Algorithmes embarqués</h4>
                     <p>Pour la détection instantanée du stress émotionnel.</p>
                  </div>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Clock className="bento-icon" />
                  <h4>Zéro Latence</h4>
                  <p>Buffer optimisé pour télémétrie PPG haute résolution.</p>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Bluetooth className="bento-icon" />
                  <h4>Bluetooth Fiable</h4>
                  <p>Connexion BLE stable et automatique avec l'ESP32.</p>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Tablet className="bento-icon" />
                  <h4>Interface Moderne</h4>
                  <p>UX fluide dédiée à l'expertise clinique biomédicale.</p>
               </motion.div>
            </div>
         </motion.section>

         {/* 🔄 WORKFLOW SECTION */}
         <section className="section-container workflow-sec">
            <div className="workflow-grid">
               <div className="workflow-info">
                  <SectionHeader tag="Processus" title="Comment ça marche ?" centered={false} />
                  <div className="steps-container">
                     {steps.map((s, i) => (
                        <motion.div key={i} className={`step-item ${activeStep === i ? 'active' : ''}`} onMouseEnter={() => setActiveStep(i)} whileHover={{ x: 10 }}>
                           <div className="step-num">0{i + 1}</div>
                           <div className="step-body">
                              <h4>{s.title}</h4>
                              <AnimatePresence>
                                 {activeStep === i && (
                                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                       {s.desc}
                                    </motion.p>
                                 )}
                              </AnimatePresence>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
               <div className="workflow-visual">
                  <AnimatePresence mode="wait">
                     <motion.div key={activeStep} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ type: 'spring', damping: 15 }} className="glass-card visual-display">
                        {steps[activeStep].icon}
                     </motion.div>
                  </AnimatePresence>
               </div>
            </div>
         </section>

         {/* 👨‍💻 ÉQUIPE */}
         <section className="section-container">
            <SectionHeader
               tag="L'Équipe"
               title="Notre Équipe"
               desc="Cette application a été développée par des étudiants en 2ème année cycle ingénieur génie biomédical."
            />
            <div className="team-grid">
               {[
                  { name: "GHABRI Diaa", role: "Élève Ingénieur", photo: "/team/diaa.jpg" },
                  { name: "SAAFI Eya", role: "Élève Ingénieur", photo: "/team/eya.jpg" },
                  { name: "YAHYAOUI Mohamed Amir", role: "Élève Ingénieur", photo: "/team/amir.jpg" }
               ].map((member, i) => (
                  <motion.div
                     key={i}
                     className="team-card glass-card"
                     whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.1)' }}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.2, duration: 0.5 }}
                  >
                     <div className="team-photo-wrapper m-auto">
                        <img 
                           src={member.photo} 
                           alt={member.name}
                           className="team-img"
                           onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="photo-inner-fallback">
                           <span>{member.name.charAt(0)}</span>
                        </div>
                     </div>
                     <h3 className="team-name mt-6">{member.name}</h3>
                     <span className="team-role">{member.role}</span>
                  </motion.div>
               ))}
            </div>
         </section>

         {/* 📬 FOOTER */}
         <footer className="footer-premium">
            <div className="footer-grid">
               <div className="f-col">
                  <div className="f-logo">Stress <strong>Analyzer</strong></div>
                  <p>Système de détection de stress basé sur l'analyse des signaux ppg.</p>
                  <p className="text-xs opacity-50 mt-2">PFA - Génie Biomédical</p>
               </div>
               <div className="f-col">
                  <h5>Plateforme</h5>
                  <a href="#">Monitor</a><a href="#">Patients</a><a href="#">Hardware</a>
               </div>
               <div className="f-col">
                  <h5>Contact</h5>
                  <a href="#">Github</a><a href="#">Documentation</a><a href="#">Support</a>
               </div>
            </div>
            <div className="footer-bottom">
               &copy; 2026 ISTMT - UTM | Bio-Medical PFA Project.
            </div>
         </footer>

         <style dangerouslySetInnerHTML={{
            __html: `
        .section-container { max-width: 1300px; margin: 12rem auto; padding: 0 2rem; position: relative; }
        .text-center { text-align: center; }
        .m-auto { margin-left: auto; margin-right: auto; }
        .justify-center { justify-content: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-10 { margin-top: 2.5rem; }
        .tag { color: var(--primary); text-transform: uppercase; letter-spacing: 5px; font-weight: 700; font-size: 0.75rem; margin-bottom: 1rem; font-family: 'JetBrains Mono'; }
        .title-md { font-size: 4rem; letter-spacing: -0.04em; margin-bottom: 2rem; line-height: 1.1; }
        .section-desc { color: var(--text-muted); font-size: 1.25rem; max-width: 600px; margin: 0 auto 4rem; }
        
        /* Aurora Background */
        .aurora-bg { position: absolute; inset: 0; z-index: -2; overflow: hidden; background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, var(--background) 70%); }
        .aurora-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: floatBlob 20s infinite alternate ease-in-out; }
        .blob-1 { width: 50vw; height: 50vw; background: rgba(99, 102, 241, 0.4); top: -20%; left: -10%; }
        .blob-2 { width: 60vw; height: 60vw; background: rgba(45, 212, 191, 0.25); bottom: -20%; right: -10%; animation-delay: -5s; }
        .blob-3 { width: 45vw; height: 45vw; background: rgba(56, 189, 248, 0.3); top: 20%; left: 30%; animation-delay: -10s; }
        .mesh-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 50px 50px; mask-image: linear-gradient(to bottom, black 30%, transparent 90%); -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 90%); z-index: 1; }

        @keyframes floatBlob {
           0% { transform: translate(0, 0) scale(1) rotate(0deg); }
           33% { transform: translate(5%, 10%) scale(1.1) rotate(5deg); }
           66% { transform: translate(-5%, 15%) scale(0.9) rotate(-5deg); }
           100% { transform: translate(-10%, -5%) scale(1.05) rotate(0deg); }
        }

        /* Floating Decor */
        .ambient-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.15; z-index: -1; pointer-events: none; }
        .orb-1 { width: 400px; height: 400px; background: var(--primary); top: -100px; left: -100px; }
        .orb-2 { width: 300px; height: 300px; background: var(--success); bottom: 100px; right: 0; }

        /* Infinite Banner */
        .infinite-banner-container { width: 100vw; overflow: hidden; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1rem 0; margin: 4rem 0; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; }
        .infinite-banner { display: flex; width: max-content; animation: scrollBanner 30s linear infinite; }
        .banner-item { display: flex; align-items: center; gap: 0.75rem; font-family: 'JetBrains Mono'; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; white-space: nowrap; }
        .banner-separator { color: var(--border); margin: 0 3rem; }
        @keyframes scrollBanner { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .bg-parallax-text { position: absolute; top: 10%; left: 0; right: 0; font-size: 25vw; font-weight: 900; color: var(--border); opacity: 0.03; text-align: center; pointer-events: none; z-index: -1; user-select: none; }

        /* Bento Grid */
        .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .bento-item { padding: 2.5rem; border-radius: 32px; min-height: 220px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; background: var(--surface); border: 1px solid var(--border); }
        .bento-item h4 { font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--text-main); }
        .bento-item p { color: var(--text-muted); font-size: 1rem; line-height: 1.5; }
        .bento-icon { color: var(--primary); margin-bottom: 1rem; width: 32px; height: 32px; }
        .bento-icon-main { color: var(--primary); margin-bottom: 2rem; }
        .text-side { flex: 1; }
        .activity-bars { display: flex; gap: 6px; align-items: flex-end; height: 60px; }
        .act-bar { width: 8px; background: var(--primary); border-radius: 4px; opacity: 0.8; }

        .waves-anim { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; overflow: hidden; opacity: 0.2; }
        .wave { position: absolute; bottom: 0; width: 200%; height: 100%; background: linear-gradient(transparent, var(--primary)); border-radius: 40%; animation: wave 10s infinite linear; }
        .wave:nth-child(2) { animation-duration: 7s; opacity: 0.5; left: -50%; }
        .wave:nth-child(3) { animation-duration: 5s; opacity: 0.3; left: -20%; }
        @keyframes wave { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Workflow */
        .workflow-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .step-item { display: flex; gap: 2rem; padding: 2rem; border-radius: 24px; transition: 0.4s var(--ease-expo); cursor: pointer; border: 1px solid transparent; }
        .step-item.active { background: var(--secondary); border-color: var(--border); box-shadow: var(--shadow-md); }
        .step-num { font-size: 2.5rem; font-family: 'Outfit'; font-weight: 800; color: var(--primary); opacity: 0.1; }
        .step-item.active .step-num { opacity: 1; transform: scale(1.1); }
        .visual-display { height: 450px; display: flex; justify-content: center; align-items: center; font-size: 6rem; color: var(--primary); position: relative; }
        .visual-display::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, var(--primary) 0%, transparent 70%); opacity: 0.05; }

        /* Team */
        .team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .team-card { padding: 3rem; border-radius: 32px; transition: 0.4s var(--ease-expo); display: flex; flex-direction: column; align-items: center; text-align: center; }
        .team-photo-wrapper { width: 180px; height: 180px; border-radius: 50px; background: linear-gradient(145deg, var(--surface), var(--secondary)); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; overflow: hidden; position: relative; box-shadow: var(--shadow-md); transition: 0.3s; }
        .team-photo-wrapper:hover { transform: scale(1.05); box-shadow: var(--shadow-lg); border-color: var(--primary); }
        .team-img { width: 100%; height: 100%; object-fit: cover; z-index: 1; }
        .photo-inner-fallback { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: var(--gradient-tech); color: white; font-family: 'Outfit'; font-size: 3.5rem; font-weight: 700; }
        .team-name { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text); }
        .team-role { font-size: 0.95rem; color: var(--primary); font-weight: 500; }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: 1fr 1fr; }
          .large-item { grid-column: span 2; }
          .workflow-grid { grid-template-columns: 1fr; }
          .team-grid { grid-template-columns: 1fr; }
        }
      `}} />
      </motion.div>
   );
};

export default LandingView;
