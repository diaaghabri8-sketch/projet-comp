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
   const bentoY = useTransform(scrollYProgress, [0.1, 0.4], [100, 0]);
   const bentoOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

   useEffect(() => {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
   }, []);

   const titleVariants = {
      hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
      visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
   };

   return (
      <motion.div ref={containerRef} className="view-container landing-view" initial="hidden" animate="visible">

         {/* 🚀 HERO SECTION COMPACT */}
         <motion.div className="hero-section compact-hero" style={{ scale, position: "relative" }}>
            <div className="hero-text full-width">
               <motion.h1 className="hero-heading gradient-text text-center" variants={titleVariants} style={{ fontSize: '1.8rem' }}>
                  Stress Analyzer
               </motion.h1>
               <div className="pfa-full-name text-center opacity-60 uppercase tracking-widest font-bold text-[9px] color-primary">
                  Système de détection basé sur l'analyse des signaux PPG
               </div>

            </div>
         </motion.div>

         {/* 🍱 BENTO GRID */}
         <motion.section className="section-container" style={{ y: bentoY, opacity: bentoOpacity }}>
            <SectionHeader tag="Capacités" title="Écosystème Intelligent" />
            <div className="bento-grid">
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <div className="bento-content">
                     <Waves className="bento-icon-main" size={24} />
                     <h4>Algorithmes biomatrices</h4>
                     <p>Détection instantanée des états de stress par calcul fréquentiel.</p>
                  </div>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Clock className="bento-icon" />
                  <h4>Haute Fidélité</h4>
                  <p>Télémétrie brute synchronisée pour une acquisition sans perte.</p>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Bluetooth className="bento-icon" />
                  <h4>Transfert BLE</h4>
                  <p>Communication avec l'ESP32 optimisée par protocole asynchrone.</p>
               </motion.div>
               <motion.div className="bento-item glass-card" whileHover={{ scale: 0.98 }}>
                  <Tablet className="bento-icon" />
                  <h4>Expertise Clinique</h4>
                  <p>Dashboard structuré pour l'analyse HRV normative.</p>
               </motion.div>
            </div>
         </motion.section>

         {/* 👨‍💻 TEAM */}
         <section className="section-container">
            <SectionHeader
               tag="Développement"
               title="L'Équipe du Projet"
               desc="Conçu et réalisé par les élèves ingénieurs en Génie Biomédical."
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
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
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
                  <p className="text-xs opacity-50 mt-2">PFA - Génie Biomédical - ISTMT</p>
               </div>

            </div>
            <div className="footer-bottom">
               &copy; 2026 ISTMT - Université de Tunis El Manar.
            </div>
         </footer>

         <style dangerouslySetInnerHTML={{
            __html: `
        .section-container { max-width: 1300px; margin: 2rem auto; padding: 0 2rem; }
        .hero-section { min-height: 20vh; display: flex; align-items: center; justify-content: center; padding: 2rem 2rem 1rem; }
        .tag { color: var(--primary); text-transform: uppercase; letter-spacing: 5px; font-weight: 700; font-size: 0.7rem; margin-bottom: 0.75rem; font-family: 'JetBrains Mono'; text-align: center;}
        .title-md { font-size: 3rem; letter-spacing: -0.04em; margin-bottom: 1.5rem; line-height: 1.1; text-align: center;}
        .section-desc { color: var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto 3rem; text-align: center;}
        
        .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .bento-item { padding: 2rem; border-radius: 24px; background: var(--surface); border: 1px solid var(--border); transition: 0.3s; }
        .bento-item h4 { font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--text-main); }
        .bento-item p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.4; }
        .bento-icon { color: var(--primary); margin-bottom: 0.75rem; width: 28px; height: 28px; }
        .bento-icon-main { color: var(--primary); margin-bottom: 1.5rem; }

        .team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .team-card { padding: 2rem; border-radius: 24px; text-align: center; }
        .team-photo-wrapper { width: 150px; height: 150px; border-radius: 40px; background: var(--secondary); border: 1px solid var(--border); overflow: hidden; margin-bottom: 1.5rem; position: relative; }
        .team-img { width: 100%; height: 100%; object-fit: cover; }
        .photo-inner-fallback { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: var(--gradient-tech); color: white; font-size: 3rem; font-weight: 700; }
        .team-name { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.4rem; }
        .team-role { font-size: 0.85rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

        .footer-premium { background: var(--surface); border-top: 1px solid var(--border); padding: 4rem 2rem 2rem; margin-top: 4rem; }
        .footer-grid { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 4rem; }
        .f-logo { font-size: 1.5rem; font-family: 'Outfit'; margin-bottom: 1rem; }
        .f-col h5 { font-size: 1rem; margin-bottom: 1.5rem; color: var(--text-main); font-weight: 700; }
        .f-col a { display: block; color: var(--text-muted); text-decoration: none; margin-bottom: 0.75rem; font-size: 0.9rem; transition: 0.2s; }
        .f-col a:hover { color: var(--primary); }
        .footer-bottom { border-top: 1px solid var(--border); margin-top: 3rem; padding-top: 2rem; text-align: center; font-size: 0.85rem; color: var(--text-muted); }

        @media (max-width: 900px) {
           .bento-grid, .team-grid, .footer-grid { grid-template-columns: 1fr; }
           .title-md { font-size: 2.2rem; }
        }
      `}} />
      </motion.div>
   );
};

export default LandingView;
