// src/db.js
export const initDB = () => {
  if (!localStorage.getItem('doc_patients')) {
    localStorage.setItem('doc_patients', JSON.stringify([
      { id: 1, firstName: 'mohssen', lastName: 'ben ali', dob: '1975-06-15', lastVisit: '2026-03-10' },
      { id: 2, firstName: 'aliya', lastName: 'belaiid', dob: '1982-11-22', lastVisit: '2026-02-05' },
      { id: 3, firstName: 'adb', lastName: 'el faz', dob: '1955-01-08', lastVisit: '2025-12-12' }
    ]));
  }

  // Init mock doctor accounts
  if (!localStorage.getItem('doc_accounts')) {
    localStorage.setItem('doc_accounts', JSON.stringify([
      { id: 1, email: 'admin@medilib.fr', password: 'admin', name: 'Dr. Admin' }
    ]));
  }

  // Init mock appointments
  if (!localStorage.getItem('doc_appointments')) {
    const today = new Date();
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    const yst = new Date(today); yst.setDate(yst.getDate() - 1);

    localStorage.setItem('doc_appointments', JSON.stringify([
      { id: 101, patientId: 1, patientName: 'Jean Dupont', date: today.toISOString().split('T')[0], time: '10:00', status: 'upcoming' },
      { id: 102, patientId: 2, patientName: 'Marie Martin', date: tmr.toISOString().split('T')[0], time: '14:30', status: 'upcoming' },
      { id: 103, patientId: 3, patientName: 'Luc Bernard', date: yst.toISOString().split('T')[0], time: '09:15', status: 'completed' }
    ]));
  }
};

// ==================== PATIENTS API ====================
export const getPatients = () => {
  return JSON.parse(localStorage.getItem('doc_patients')) || [];
};

export const addPatient = (patient) => {
  const patients = getPatients();
  const newPatient = {
    ...patient,
    id: Date.now(),
    lastVisit: new Date().toISOString().split('T')[0]
  };
  patients.push(newPatient);
  localStorage.setItem('doc_patients', JSON.stringify(patients));
  return newPatient;
};

export const updateLastVisit = (id) => {
  const patients = getPatients();
  const updated = patients.map(p => {
    if (p.id === id) {
      return { ...p, lastVisit: new Date().toISOString().split('T')[0] };
    }
    return p;
  });
  localStorage.setItem('doc_patients', JSON.stringify(updated));
};

export const updatePatient = (id, updatedData) => {
  const patients = getPatients();
  const updated = patients.map(p => p.id === id ? { ...p, ...updatedData } : p);
  localStorage.setItem('doc_patients', JSON.stringify(updated));
  return updated.find(p => p.id === id);
};

export const deletePatient = (id) => {
  const patients = getPatients();
  const filtered = patients.filter(p => p.id !== id);
  localStorage.setItem('doc_patients', JSON.stringify(filtered));
};

// ==================== APPOINTMENTS API ====================
export const getAppointments = () => {
  return JSON.parse(localStorage.getItem('doc_appointments')) || [];
};

export const addAppointment = (appt) => {
  const appts = getAppointments();
  const newAppt = { ...appt, id: Date.now() };
  appts.push(newAppt);
  localStorage.setItem('doc_appointments', JSON.stringify(appts));
  return newAppt;
};

// ==================== DOCTORS API ====================
export const registerDoctor = (name, email, password) => {
  const docs = JSON.parse(localStorage.getItem('doc_accounts')) || [];
  if (docs.find(d => d.email === email)) {
    throw new Error("Cet email est déjà utilisé.");
  }
  const newDoc = { id: Date.now(), name, email, password };
  docs.push(newDoc);
  localStorage.setItem('doc_accounts', JSON.stringify(docs));
  return newDoc;
};

export const loginDoctor = (email, password) => {
  const docs = JSON.parse(localStorage.getItem('doc_accounts')) || [];
  const doc = docs.find(d => d.email === email && d.password === password);
  if (!doc) {
    throw new Error("Identifiants incorrects.");
  }
  return doc;
};
