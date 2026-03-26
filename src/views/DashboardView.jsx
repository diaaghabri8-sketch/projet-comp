import React, { useState, useEffect } from 'react';
import { getPatients, addPatient, updateLastVisit, updatePatient, deletePatient, getAppointments, addAppointment } from '../db';
import { Users, Plus, Calendar, CalendarPlus, FileText, ChevronRight, X, User, Edit2, Trash2, Clock, CheckCircle2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '../components/Magnetic';

const DashboardView = ({ onStartSession }) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' });
  const [apptForm, setApptForm] = useState({ patientId: '', date: '', time: '' });

  useEffect(() => {
    setPatients(getPatients());
    setAppointments(getAppointments());
  }, []);

  const handleSavePatient = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    
    if (editingPatient) {
       updatePatient(editingPatient.id, form);
    } else {
       addPatient(form);
    }
    setPatients(getPatients());
    setShowModal(false);
    setForm({ firstName: '', lastName: '', dob: '' });
    setEditingPatient(null);
  };

  const handleDeletePatient = (id) => {
    if (window.confirm("Voulez-vous supprimer ce dossier patient ?")) {
       deletePatient(id);
       setPatients(getPatients());
    }
  };

  const handleStart = (p) => {
    updateLastVisit(p.id);
    onStartSession(p);
  };

  const handleCreateAppt = (e) => {
    e.preventDefault();
    const p = patients.find(pat => pat.id.toString() === apptForm.patientId);
    if (!p) return;
    addAppointment({
       patientId: p.id,
       patientName: `${p.firstName} ${p.lastName}`,
       date: apptForm.date,
       time: apptForm.time,
       status: 'upcoming'
    });
    setAppointments(getAppointments());
    setShowApptModal(false);
    setApptForm({ patientId: '', date: '', time: '' });
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Smooth Tilt for Patient Cards
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    e.currentTarget.style.setProperty('--x', `${x}px`);
    e.currentTarget.style.setProperty('--y', `${y}px`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const getNowYYYYMMDD = () => {
     const d = new Date();
     const m = d.getMonth() + 1;
     const dy = d.getDate();
     return `${d.getFullYear()}-${m < 10 ? '0'+m : m}-${dy < 10 ? '0'+dy : dy}`;
  };
  const todayStr = getNowYYYYMMDD();
  
  const getDaysDiff = (dateStr) => {
     const target = new Date(dateStr);
     const today = new Date(todayStr);
     const diffTime = target - today;
     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const apptToday = appointments.filter(a => a.date === todayStr);
  const apptUpcoming = appointments.filter(a => a.date > todayStr).sort((a,b) => new Date(a.date) - new Date(b.date));
  const apptPast = appointments.filter(a => a.date < todayStr).sort((a,b) => new Date(b.date) - new Date(a.date));

  const filteredPatients = patients.filter(p => 
    p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toString().includes(searchQuery)
  );

  return (
    <motion.div 
      className="view-container dashboard-layout"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dash-header flex-col">
        <div className="dash-titles w-full">
          <div className="flex-row items-center justify-between w-full flex-wrap gap-4">
            <div>
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="dash-badge">
                 Workspace Praticien
               </motion.div>
               <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Tableau de Bord</motion.h1>
            </div>
            {/* The Navbar Tabs */}
            <div className="dash-navbars glass-card">
               <button className={`nav-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>Rendez-vous</button>
               <button className={`nav-tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>Dossiers Patients</button>
            </div>
          </div>
        </div>
      </div>

      {/* 📅 APPOINTMENTS TAB */}
      {activeTab === 'appointments' && (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="tab-section mt-10">
            <div className="flex-row justify-between items-center mb-8 flex-wrap gap-4">
               <div className="section-title">
                 <h2 className="text-3xl font-bold">Planning des séances</h2>
                 <span className="text-muted">Consultez vos rendez-vous classés</span>
               </div>
               <Magnetic>
                 <button className="btn btn-secondary glass-blur-btn" onClick={() => setShowApptModal(true)}>
                   <Plus size={18} /> Ajouter un rendez-vous
                 </button>
               </Magnetic>
            </div>
            
            <div className="appt-columns-grid">
              
              {/* Aujourd'hui */}
              <div className="appt-column">
                 <h3 className="col-title text-primary"><Clock size={16}/> Aujourd'hui</h3>
                 <div className="col-content">
                    {apptToday.length === 0 ? <p className="empty-sm">Aucun rendez-vous</p> : 
                      apptToday.map(app => (
                        <div key={app.id} className="appointment-card glass-card border-l-primary scale-on-hover" onClick={() => setSelectedAppt(app)} style={{ cursor: 'pointer' }}>
                           <div className="app-time text-primary"><Clock size={14}/> {app.time}</div>
                           <div className="app-patient">{app.patientName}</div>
                           <div className="app-status mt-2"><span className="badge-primary">À faire</span></div>
                        </div>
                      ))
                    }
                 </div>
              </div>

              {/* Prochains */}
              <div className="appt-column">
                 <h3 className="col-title text-blue"><Calendar size={16}/> Prochains</h3>
                 <div className="col-content">
                    {apptUpcoming.length === 0 ? <p className="empty-sm">Rien de prévu</p> : 
                      apptUpcoming.map(app => {
                        const days = getDaysDiff(app.date);
                        return (
                          <div key={app.id} className="appointment-card glass-card border-l-blue scale-on-hover" onClick={() => setSelectedAppt(app)} style={{ cursor: 'pointer' }}>
                             <div className="app-time text-blue"><Calendar size={14}/> {app.date} à {app.time}</div>
                             <div className="app-patient">{app.patientName}</div>
                             <div className="app-status mt-2"><span className="badge-blue">Dans {days} jour{days > 1 ? 's':''}</span></div>
                          </div>
                        )
                      })
                    }
                 </div>
              </div>

              {/* Anciens */}
              <div className="appt-column">
                 <h3 className="col-title text-muted"><FileText size={16}/> Historique</h3>
                 <div className="col-content opacity-75">
                    {apptPast.length === 0 ? <p className="empty-sm">Vide</p> : 
                      apptPast.map(app => (
                        <div key={app.id} className="appointment-card glass-card border-l-gray scale-on-hover" onClick={() => setSelectedAppt(app)} style={{ cursor: 'pointer' }}>
                           <div className="app-time text-muted"><CheckCircle2 size={14}/> {app.date} à {app.time}</div>
                           <div className="app-patient">{app.patientName}</div>
                           <div className="app-status mt-2"><span className="badge-gray">Passé</span></div>
                        </div>
                      ))
                    }
                 </div>
              </div>

            </div>
        </motion.div>
      )}

      {/* 🧬 PATIENTS TAB */}
      {activeTab === 'patients' && (
      <motion.div 
        className="tab-section mt-10 patient-grid-v2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex-row justify-between items-center mb-8 flex-wrap gap-4" style={{ gridColumn: '1 / -1' }}>
           <div className="section-title">
             <h2 className="text-3xl font-bold">Dossiers Patients</h2>
             <span className="text-muted">Gérez l'historique et lancez la télémétrie</span>
           </div>
           
           <div className="search-box">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Rechercher (nom, ID)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>

           <Magnetic>
             <button className="btn btn-primary premium-dash-btn" onClick={() => { setEditingPatient(null); setForm({firstName:'', lastName:'', dob:''}); setShowModal(true); }}>
               <Plus size={18} /> Ajouter un patient
             </button>
           </Magnetic>
        </div>
        {filteredPatients.map((p) => (
          <motion.div 
            key={p.id} 
            className="patient-card-v2 glass-card spotlight-card" 
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            onMouseLeave={(e) => e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)"}
          >
            <div className="pc-top-v2">
              <div className="pc-avatar-v2"><User size={24} /></div>
              <div className="pc-info-v2">
                <h3>{p.firstName} <span>{p.lastName}</span></h3>
                <span className="pc-id-v2">REF_{p.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="pc-actions-mini">
                 <button title="Planifier un rendez-vous" onClick={(e) => { e.stopPropagation(); setApptForm({...apptForm, patientId: p.id.toString()}); setShowApptModal(true); }}><CalendarPlus size={16}/></button>
                 <button title="Modifier" onClick={(e) => { e.stopPropagation(); setEditingPatient(p); setForm(p); setShowModal(true); }}><Edit2 size={16}/></button>
                 <button className="del" title="Supprimer" onClick={(e) => { e.stopPropagation(); handleDeletePatient(p.id); }}><Trash2 size={16}/></button>
              </div>
            </div>
            
            <div className="pc-stats-grid">
               <div className="pc-stat-item">
                  <Calendar size={12}/>
                  <div className="val">{p.dob || 'N/A'}</div>
               </div>
               <div className="pc-stat-item">
                  <FileText size={12}/>
                  <div className="val">{p.lastVisit}</div>
               </div>
            </div>

            <Magnetic>
              <button className="btn btn-secondary-v2 w-full pc-action-v2" onClick={() => handleStart(p)}>
                Lancer Monitor <ChevronRight size={16}/>
              </button>
            </Magnetic>
            <div className="card-glint"></div>
          </motion.div>
        ))}

        {filteredPatients.length === 0 && (
          <motion.div 
            className="empty-state-v2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Users size={48} />
            <h3>Aucun dossier actif</h3>
            <p>Commencez dès maintenant en ajoutant votre premier dossier patient.</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}><Plus size={18}/> Nouveau Dossier</button>
          </motion.div>
        )}
      </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-v2 glass-card"
              initial={{ y: 100, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 50, opacity: 0, filter: "blur(15px)" }}
            >
              <div className="modal-header">
                <h2>{editingPatient ? 'Modifier le Dossier' : 'Nouveau Dossier'}</h2>
                <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleSavePatient} className="modal-form">
                <div className="input-group">
                  <label>Prénom</label>
                  <input className="input-classic" required autoFocus type="text" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} placeholder="ex: Jean" />
                </div>
                <div className="input-group">
                  <label>Nom</label>
                  <input className="input-classic" required type="text" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} placeholder="ex: Dupont" />
                </div>
                <div className="input-group">
                  <label>Date de Naissance</label>
                  <input className="input-classic" type="date" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">{editingPatient ? 'Mettre à jour' : 'Enregistrer le patient'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showApptModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-v2 glass-card"
              initial={{ y: 100, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: 50, opacity: 0, filter: "blur(15px)" }}
            >
              <div className="modal-header">
                <h2>Nouveau Rendez-vous</h2>
                <button className="icon-btn" onClick={() => setShowApptModal(false)}><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateAppt} className="modal-form">
                <div className="input-group">
                  <label>Patient</label>
                  <select className="input-classic" required autoFocus value={apptForm.patientId} onChange={e=>setApptForm({...apptForm, patientId: e.target.value})}>
                     <option value="" disabled>Sélectionner un patient...</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Date du rendez-vous</label>
                  <input className="input-classic" required type="date" value={apptForm.date} onChange={e=>setApptForm({...apptForm, date: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Heure</label>
                  <input className="input-classic" required type="time" value={apptForm.time} onChange={e=>setApptForm({...apptForm, time: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowApptModal(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Créer le rendez-vous</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedAppt && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-v2 glass-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>Détails du Rendez-vous</h2>
                <button className="icon-btn" onClick={() => setSelectedAppt(null)}><X size={20}/></button>
              </div>
              
              {(() => {
                 const p = patients.find(pat => pat.id === selectedAppt.patientId);
                 if (!p) return <p>Patient introuvable.</p>;
                 return (
                   <div className="appt-detail-box">
                      <div className="flex-col gap-4 mb-8 mt-4">
                         <div className="flex-row items-center gap-4">
                            <div className="pc-avatar-v2" style={{ width: '64px', height: '64px' }}><User size={32} /></div>
                            <div>
                               <h3 className="text-3xl font-bold">{p.firstName} {p.lastName}</h3>
                               <span className="text-muted font-mono text-sm">REF_{p.id.toString().padStart(4, '0')}</span>
                            </div>
                         </div>
                         <div className="pc-stats-grid mt-4">
                            <div className="pc-stat-item"><Calendar size={14} /> <span className="val">{selectedAppt.date} à {selectedAppt.time}</span></div>
                            <div className="pc-stat-item"><FileText size={14} /> <span className="val">Né(e): {p.dob || 'NC'}</span></div>
                         </div>
                      </div>
                      <div className="flex-row gap-4">
                         <button className="btn btn-secondary w-full" onClick={() => setSelectedAppt(null)}>Fermer</button>
                         <button className="btn btn-primary w-full" onClick={() => { setSelectedAppt(null); handleStart(p); }}>Lancer la Séance <ChevronRight size={18}/></button>
                      </div>
                   </div>
                 );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .dash-badge { font-family: 'JetBrains Mono'; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--primary); margin-bottom: 0.5rem; }
        .premium-dash-btn { background: var(--text-main); color: var(--bg-color); border: none; padding: 0.75rem 1.5rem; border-radius: 99px; font-weight: 600; font-family: 'Outfit'; }
        
        /* Navbars & Tabs */
        .dash-navbars { display: flex; gap: 0.5rem; padding: 0.5rem; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .nav-tab { background: transparent; color: var(--text-muted); padding: 0.5rem 1.5rem; border-radius: 12px; font-weight: 500; font-family: 'Outfit'; border: none; cursor: pointer; transition: 0.3s ease; }
        .nav-tab:hover { color: var(--text-main); }
        .nav-tab.active { background: var(--secondary); color: var(--text-main); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        
        .flex-row { display: flex; flex-direction: row; }
        .flex-col { display: flex; flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .w-full { width: 100%; }
        .flex-wrap { flex-wrap: wrap; }
        .gap-4 { gap: 1rem; }
        .text-3xl { font-size: 2rem; }
        .font-bold { font-weight: 700; }
        .text-primary { color: var(--primary); }
        .text-blue { color: #38bdf8; }
        .text-muted { color: var(--text-muted); }
        .mt-10 { margin-top: 2.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .text-sm { font-size: 0.85rem; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        /* Search */
        .search-box { position: relative; flex: 1; max-width: 400px; min-width: 250px; }
        .search-box input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 99px; background: var(--secondary); border: 1px solid var(--border); color: var(--text-main); font-family: 'Inter'; outline: none; transition: 0.3s; }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

        /* Appointments Grid */
        .appt-columns-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .appt-column { display: flex; flex-direction: column; gap: 1rem; }
        .col-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
        .col-content { display: flex; flex-direction: column; gap: 1rem; }
        
        .appointment-card { padding: 1.5rem; border-radius: 16px; border-left: 4px solid var(--border); transition: 0.2s; }
        .scale-on-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .appointment-card.border-l-primary { border-left-color: var(--primary); }
        .appointment-card.border-l-blue { border-left-color: #38bdf8; }
        .appointment-card.border-l-gray { border-left-color: var(--text-muted); }
        
        .app-time { display: flex; align-items: center; gap: 0.4rem; font-family: 'JetBrains Mono'; font-size: 0.75rem; margin-bottom: 0.8rem; font-weight: 500; }
        .app-patient { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .empty-sm { color: var(--text-muted); font-size: 0.9rem; font-style: italic; opacity: 0.5; padding: 1rem 0; }
        
        .badge-primary { background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        .badge-blue { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
        .badge-gray { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }

        .patient-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; margin-top: 0rem; }
        .patient-card-v2 { padding: 2.5rem; border-radius: 28px; position: relative; overflow: hidden; transition: transform 0.1s ease-out; cursor: pointer; }
        .pc-top-v2 { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; position: relative; }
        .pc-avatar-v2 { width: 48px; height: 48px; background: var(--secondary); border: 1px solid var(--border); border-radius: 14px; display: flex; justify-content: center; align-items: center; color: var(--primary); }
        .pc-info-v2 { flex: 1; }
        .pc-info-v2 h3 { margin: 0; font-size: 1.4rem; font-weight: 600; }
        .pc-info-v2 h3 span { font-weight: 300; }
        .pc-id-v2 { font-family: 'JetBrains Mono'; font-size: 0.75rem; color: var(--text-muted); }
        
        .pc-actions-mini { display: flex; gap: 0.5rem; }
        .pc-actions-mini button { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); border-radius: 10px; padding: 0.5rem; cursor: pointer; transition: 0.3s; }
        .pc-actions-mini button:hover { color: var(--primary); border-color: var(--primary); }
        .pc-actions-mini button.del:hover { color: #f43f5e; border-color: #f43f5e; }

        .pc-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
        .pc-stat-item { background: var(--secondary); padding: 0.8rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); border: 1px solid var(--border-light); }
        .pc-stat-item .val { font-weight: 600; color: var(--text-main); }
        
        .pc-action-v2 { font-family: 'Outfit'; font-weight: 500; font-size: 0.95rem; }
        .card-glint { position: absolute; inset: 0; background: radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.08) 0%, transparent 40%); pointer-events: none; }
        
        .empty-state-v2 { grid-column: 1/-1; padding: 8rem 2rem; text-align: center; background: var(--surface); border: 1px dashed var(--border); border-radius: 32px; color: var(--text-muted); }
        
        .modal-content-v2 { width: 100%; max-width: 500px; padding: 3rem; border-radius: 32px; }
        .input-classic { width: 100%; padding: 1rem 1.25rem; background: var(--secondary); border: 1px solid var(--border); border-radius: 14px; color: var(--text-main); font-family: 'Inter'; transition: 0.3s; }
        .input-classic:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
      `}} />
    </motion.div>
  );
};

export default DashboardView;
