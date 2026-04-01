import React, { useState, useEffect } from 'react';
import { getPatients, addPatient, updateLastVisit, updatePatient, deletePatient, getAppointments, addAppointment, getPatientHistory, deleteSession } from '../db';
import { Users, Plus, Calendar, CalendarPlus, FileText, ChevronRight, X, User, Edit2, Trash2, Clock, CheckCircle2, Search, History, PlayCircle, BarChart3, Info } from 'lucide-react';
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
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', sex: 'm' });
  const [apptForm, setApptForm] = useState({ patientId: '', date: '', time: '' });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

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
    setForm({ firstName: '', lastName: '', dob: '', sex: 'm' });
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

  const handleOpenHistory = (p) => {
    setHistoryPatient(p);
    setPatientHistory(getPatientHistory(p.id));
    setShowHistoryModal(true);
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm("Supprimer cet historique ?")) {
      deleteSession(sessionId);
      if (historyPatient) {
        setPatientHistory(getPatientHistory(historyPatient.id));
      }
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' à ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <div className="patient-header-v2 mb-8">
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
        <div className="patient-header-v2" style={{ gridColumn: '1 / -1' }}>
           <div className="section-title">
             <h2 className="text-3xl font-bold">Dossiers Patients</h2>
             <span className="text-muted">Gérez l'historique et lancez la télémétrie</span>
           </div>
           
           <div className="search-box">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Rechercher (nom, ID)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
           </div>

           <Magnetic>
             <button className="btn btn-primary premium-dash-btn" onClick={() => { setEditingPatient(null); setForm({firstName:'', lastName:'', dob:'', sex:'m'}); setShowModal(true); }}>
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
                <div className="flex items-center gap-2">
                   <span className="pc-id-v2">REF_{p.id.toString().padStart(4, '0')}</span>
                   <span className={`badge-mini ${p.sex === 'f' ? 'pink' : 'blue'}`}>{p.sex === 'f' ? 'F' : 'H'}</span>
                </div>
              </div>
              <div className="pc-actions-mini">
                 <button title="Voir Historique" onClick={(e) => { e.stopPropagation(); handleOpenHistory(p); }}><History size={16}/></button>
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
                <div className="input-group">
                  <label>Sexe</label>
                  <select className="input-classic" value={form.sex} onChange={e=>setForm({...form, sex: e.target.value})}>
                    <option value="m">Homme</option>
                    <option value="f">Femme</option>
                  </select>
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
                      <div className="flex-col gap-4 mb-8 mt-4 text-left">
                         <div className="flex-row items-center gap-4">
                            <div className="pc-avatar-v2" style={{ width: '64px', height: '64px' }}><User size={32} /></div>
                            <div>
                               <h3 className="text-3xl font-bold">{p.firstName} {p.lastName}</h3>
                               <p className="text-muted font-mono text-sm">REF_{p.id.toString().padStart(4, '0')}</p>
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

        {showHistoryModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-v2 glass-card history-modal"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <div className="modal-header">
                <div className="flex items-center gap-4">
                   <History className="text-primary" />
                   <div>
                     <h2 className="text-xl">Historique Patient</h2>
                     <p className="text-xs opacity-50 uppercase tracking-widest">{historyPatient?.firstName} {historyPatient?.lastName}</p>
                   </div>
                </div>
                <button className="icon-btn" onClick={() => setShowHistoryModal(false)}><X size={20}/></button>
              </div>

              <div className="history-list-scroll mt-6">
                {patientHistory.length === 0 ? (
                  <div className="text-center py-10 opacity-40">
                    <History size={48} className="mx-auto mb-4" />
                    <p>Aucune séance enregistrée pour le moment.</p>
                  </div>
                ) : (
                  patientHistory.map(session => (
                    <div key={session.id} className="history-item glass-card mb-4 hover-highlight">
                       <div className="flex items-center justify-between mb-2">
                          <span className="h-date">{formatDateTime(session.date)}</span>
                          <span className={`h-status-badge ${session.avgStress > 70 ? 'high' : 'low'}`}>
                            {session.avgStress > 70 ? 'Stress Élevé' : 'Normal'}
                          </span>
                       </div>
                       <div className="h-metrics-grid">
                          <div className="h-metric">
                            <label>Durée</label>
                            <span>{Math.floor(session.duration / 60)}m {session.duration % 60}s</span>
                          </div>
                          <div className="h-metric">
                            <label>BPM Moyen</label>
                            <span>{session.avgBpm} bpm</span>
                          </div>
                          <div className="h-metric">
                            <label>Stress Moyen</label>
                            <span>{session.avgStress}%</span>
                          </div>
                          <div className="h-metric">
                            <label>RMSSD</label>
                            <span>{session.avgRmssd || 0} ms</span>
                          </div>
                       </div>
                       <div className="h-actions mt-4">
                          <button className="btn-h-view" onClick={() => { setSelectedSession(session); setShowReportModal(true); }}>
                             <BarChart3 size={14} /> Rapport de séance
                          </button>
                          <button className="btn-h-del" onClick={() => handleDeleteSession(session.id)}><Trash2 size={12} /></button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showReportModal && selectedSession && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content-v2 glass-card report-modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-primary" />
                  <div>
                    <h2 className="text-xl">Rapport d'Analyse</h2>
                    <p className="text-xs opacity-50 uppercase">{formatDateTime(selectedSession.date)}</p>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => setShowReportModal(false)}><X size={20}/></button>
              </div>

              <div className="report-content mt-6">
                <div className="session-summary-grid">
                   <div className="summary-item">
                     <label>Durée Totale</label>
                     <div className="val">{Math.floor(selectedSession.duration / 60)}m {selectedSession.duration % 60}s</div>
                   </div>
                   <div className="summary-item">
                     <label>BPM Moyen</label>
                     <div className="val">{selectedSession.avgBpm} <small>bpm</small></div>
                   </div>
                   <div className="summary-item">
                     <label>Stress Moyen</label>
                     <div className="val" style={{ color: selectedSession.avgStress > 70 ? '#ef4444' : '#22c55e' }}>{selectedSession.avgStress}%</div>
                   </div>
                   <div className="summary-item">
                     <label>RMSSD Moyen</label>
                     <div className="val">{selectedSession.avgRmssd || 0} <small>ms</small></div>
                   </div>
                </div>

                <div className="charts-stack mt-8">
                   <div className="report-chart-box">
                      <label>Score de Stress (%)</label>
                      <SessionChart data={selectedSession.data.metrics.map(m => m.stressScore)} color="#ef4444" unit="%" />
                   </div>
                   <div className="report-chart-box mt-6">
                      <label>Rythme Cardiaque (BPM)</label>
                      <SessionChart data={selectedSession.data.metrics.map(m => m.bpm)} color="#38bdf8" unit="bpm" />
                   </div>
                   <div className="report-chart-box mt-6">
                      <label>RMSSD (ms)</label>
                      <SessionChart data={selectedSession.data.metrics.map(m => m.rmssd)} color="#fbbf24" unit="ms" />
                   </div>
                   <div className="report-chart-box mt-6">
                      <label>Puissance HF (ms²)</label>
                      <SessionChart data={selectedSession.data.metrics.map(m => m.hf)} color="#44ff44" unit="ms²" />
                   </div>
                </div>
                
                <div className="medical-insight mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-left">
                   <Info size={16} className="text-primary mb-2" />
                   <p className="text-xs italic leading-relaxed">
                     L'analyse HRV s'appuie sur la fréquence de puissance (HF) et le RMSSD pour évaluer l'activité parasympathique. 
                     Un niveau de stress prolongé {'>'} 70% suggère une activation sympathique prédominante.
                   </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .dash-badge { font-family: 'JetBrains Mono'; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--primary); margin-bottom: 0.5rem; }
        .premium-dash-btn { background: var(--text-main); color: var(--bg-color); border: none; padding: 0.75rem 1.5rem; border-radius: 99px; font-weight: 600; font-family: 'Outfit'; }
        .dash-navbars { display: flex; gap: 0.5rem; padding: 0.5rem; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .nav-tab { background: transparent; color: var(--text-muted); padding: 0.5rem 1.5rem; border-radius: 12px; font-weight: 500; font-family: 'Outfit'; border: none; cursor: pointer; transition: 0.3s ease; }
        .nav-tab.active { background: var(--secondary); color: var(--text-main); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .search-box { position: relative; flex: 1; max-width: 320px; min-width: 200px; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 1rem; color: var(--text-muted); pointer-events: none; z-index: 10; }
        .patient-header-v2 { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; width: 100%; }
        .search-box input { width: 100%; padding: 0.8rem 1rem 0.8rem 3rem; border-radius: 99px; background: var(--secondary); border: 1px solid var(--border); color: var(--text-main); font-family: 'Inter'; outline: none; transition: 0.3s; }
        .search-box input:focus { border-color: var(--primary); background: var(--surface); }
        .appt-columns-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .appt-column { display: flex; flex-direction: column; gap: 1rem; }
        .col-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
        .appointment-card { padding: 1.5rem; border-radius: 16px; border-left: 4px solid var(--border); transition: 0.2s; }
        .patient-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; margin-top: 0rem; }
        .patient-card-v2 { padding: 2.5rem; border-radius: 28px; position: relative; overflow: hidden; transition: transform 0.1s ease-out; cursor: pointer; }
        .pc-avatar-v2 { width: 48px; height: 48px; background: var(--secondary); border: 1px solid var(--border); border-radius: 14px; display: flex; justify-content: center; align-items: center; color: var(--primary); }
        .pc-info-v2 h3 { margin: 0; font-size: 1.4rem; font-weight: 600; }
        .pc-actions-mini { display: flex; gap: 0.5rem; margin-top: 0rem; }
        .pc-actions-mini button { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); border-radius: 10px; padding: 0.6rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        .pc-actions-mini button:hover { color: var(--primary); border-color: var(--primary); background: rgba(var(--primary-rgb), 0.05); }
        .pc-actions-mini button.del:hover { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .pc-stat-item { background: var(--secondary); padding: 0.8rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted); border: 1px solid var(--border-light); }
        .pc-stat-item .val { font-weight: 600; color: var(--text-main); }
        .card-glint { position: absolute; inset: 0; background: radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.08) 0%, transparent 40%); pointer-events: none; }
        .modal-content-v2 { width: 500px; max-width: 95%; padding: 3rem; border-radius: 32px; z-index: 1000; }
        .badge-mini { font-family: 'JetBrains Mono'; font-size: 0.6rem; padding: 1px 4px; border-radius: 4px; font-weight: 700; border: 1px solid; }
        .badge-mini.pink { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-color: rgba(244, 63, 94, 0.2); }
        .badge-mini.blue { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border-color: rgba(56, 189, 248, 0.2); }
        .history-modal { max-width: 600px; height: 80vh; display: flex; flex-direction: column; }
        .history-list-scroll { flex: 1; overflow-y: auto; padding-right: 1rem; }
        .history-item { padding: 1.5rem; border: 1px solid var(--border); border-radius: 20px; transition: 0.3s; }
        .h-status-badge { font-size: 0.6rem; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; font-weight: 800; }
        .h-status-badge.low { background: #22c55e22; color: #22c55e; }
        .h-status-badge.high { background: #ef444422; color: #ef4444; }
        .h-metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem; }
        .h-metric label { display: block; font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px; }
        .h-metric span { font-family: 'JetBrains Mono'; font-weight: 700; color: var(--text-main); font-size: 0.9rem; }
        .btn-h-view { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: var(--primary); font-weight: 600; font-size: 0.8rem; cursor: pointer; }
        .btn-h-del { background: transparent; border: none; color: #ef4444; opacity: 0.4; cursor: pointer; transition: 0.3s; }
        .btn-h-del:hover { opacity: 1; }
        .report-modal-container { max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto; }
        .session-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .summary-item { background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 16px; border: 1px solid var(--border); }
        .summary-item label { display: block; font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
        .summary-item .val { font-size: 1.5rem; font-weight: 800; }
        .report-chart-box { padding: 1.5rem; background: #050508; border-radius: 20px; border: 1px solid var(--border); }
        .report-chart-box label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-muted); }
      `}} />
    </motion.div>
  );
};

const SessionChart = ({ data, color, unit = '' }) => {
   const width = 600;
   const height = 150;
   const margin = { top: 10, right: 10, bottom: 25, left: 40 };
   const chartWidth = width - margin.left - margin.right;
   const chartHeight = height - margin.top - margin.bottom;
   
   const { points, maxVal, minVal } = React.useMemo(() => {
     if (!data || data.length < 2) return { points: [], maxVal: 0, minVal: 0 };
     const maxV = Math.max(...data, 1) * 1.1;
     const minV = Math.min(...data) * 0.9;
     const range = maxV - minV || 1;
     
     return {
       maxVal: maxV,
       minVal: minV,
       points: data.map((val, i) => ({
          x: margin.left + (i / (data.length - 1)) * chartWidth,
          y: margin.top + chartHeight - ((val - minV) / range) * chartHeight
       }))
     };
   }, [data]);

   if (points.length < 2) return <div className="text-muted text-xs p-4">Pas assez de données.</div>;

   const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
   const midVal = (maxVal + minVal) / 2;
   const midY = margin.top + chartHeight / 2;
   
   return (
     <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
       {/* 📈 AXES & GRID */}
       {/* Y-Axis Grid */}
       <line x1={margin.left} y1={margin.top} x2={width - margin.right} y2={margin.top} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
       <line x1={margin.left} y1={midY} x2={width - margin.right} y2={midY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4" />
       <line x1={margin.left} y1={margin.top + chartHeight} x2={width - margin.right} y2={margin.top + chartHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
       
       <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + chartHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
       
       {/* Labels Amplitudes (Y) */}
       <text x={margin.left - 8} y={margin.top + 4} textAnchor="end" fontSize="9" fontWeight="600" fill={color}>{Math.round(maxVal)}{unit}</text>
       <text x={margin.left - 8} y={midY + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{Math.round(midVal)}</text>
       <text x={margin.left - 8} y={margin.top + chartHeight} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">{Math.round(minVal)}{unit}</text>
       
       {/* X-Axis Vertical markers */}
       {[0.25, 0.5, 0.75].map(ratio => (
         <line key={ratio} x1={margin.left + ratio * chartWidth} y1={margin.top + chartHeight} x2={margin.left + ratio * chartWidth} y2={margin.top + chartHeight + 4} stroke="rgba(255,255,255,0.2)" />
       ))}

       {/* Labels Temps (X) */}
       <text x={margin.left} y={height - 4} fontSize="9" fill="rgba(255,255,255,0.4)">0s</text>
       <text x={margin.left + 0.5 * chartWidth} y={height - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">Moy</text>
       <text x={width - margin.right} y={height - 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">Temps</text>

       <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
       <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="3" fill={color} />
     </svg>
   );
};

export default DashboardView;
