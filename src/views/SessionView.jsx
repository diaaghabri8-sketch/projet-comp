import React, { useState, useEffect, useRef } from 'react';
import useBLE from '../hooks/useBLE';
import ECGCanvas from '../components/ECGCanvas';
import { ArrowLeft, Activity, Bluetooth, PowerOff, Zap, RefreshCw, Cpu, AlertTriangle, HeartPulse, Brain, Gauge, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '../components/Magnetic';

const MiniGraph = ({ data, color, label, unit, threshold, type = 'line', secondaryData = null, secondaryColor = null, highlights = [] }) => {
  const width = 400;
  const height = 120;
  const padding = 10;

  if (!data || data.length === 0) return (
    <div className="mini-graph-placeholder glass-card">Calcul en cours...</div>
  );

  const getPoints = (d) => {
    const min = Math.min(...d) * 0.95;
    const max = Math.max(...d) * 1.05 || 1;
    const range = max - min;
    return d.map((val, i) => ({
      x: (i / (d.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 2 * padding) - padding
    }));
  };

  const points = getPoints(data);
  const pathData = points.length > 1 ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` : '';
  const areaData = points.length > 1 ? `${pathData} L ${width},${height} L 0,${height} Z` : '';

  let secondaryPath = '';
  if (secondaryData && secondaryData.length > 1) {
    const sPoints = getPoints(secondaryData);
    secondaryPath = `M ${sPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }

  const latestValue = data[data.length - 1];
  const isStressed = threshold && latestValue > threshold;

  return (
    <div className={`pro-graph-card ${isStressed ? 'alert' : ''}`}>
      <div className="graph-header">
        <div className="title-group">
          <span className="dot" style={{ background: color }}></span>
          <span className="label">{label}</span>
        </div>
        <div className="value-group">
          {highlights.map((h, i) => (
            <span key={i} className="highlight-badge" style={{ borderColor: h.color, color: h.color }}>
              {h.label}: {h.value}
            </span>
          ))}
          <span className="main-value" style={{ color }}>
            {latestValue?.toFixed(unit === 'ms' ? 0 : 1)} <small>{unit}</small>
          </span>
        </div>
      </div>
      <div className="svg-stage glass-card themed-graph-bg">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.05" />
            </pattern>
            <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {secondaryPath && (
            <path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
          )}

          <path d={areaData} fill={`url(#grad-${label})`} />
          <path
            d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
            filter={`drop-shadow(0 0 4px ${color}44)`}
          />

          {threshold && (
            <line x1="0" y1={height / 2.5} x2={width} y2={height / 2.5} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="5 5" />
          )}
        </svg>
      </div>
    </div>
  );
};

const FrequencyGraph = ({ data, labels, color, label, unit }) => {
  const width = 400;
  const height = 150;
  const padding = 20;

  if (!data || data.length === 0) return (
    <div className="mini-graph-placeholder glass-card">Calcul spectral...</div>
  );

  const maxVal = Math.max(...data) || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * (width - 2 * padding) + padding,
    y: height - (val / maxVal) * (height - 2 * padding) - padding
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="pro-graph-card frequency-plot">
      <div className="graph-header">
        <label>{label}</label>
        <span className="main-value" style={{ color }}>Spectrum <small>{unit}</small></span>
      </div>
      <div className="svg-stage glass-card">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <pattern id="hz-grid" width="40" height="150" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="150" stroke="rgba(255,255,255,0.05)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hz-grid)" />
          <path d={pathData} fill="none" stroke={color} strokeWidth="2" filter={`drop-shadow(0 0 5px ${color}88)`} />

          {/* Hz Markers */}
          {[0, 1, 2, 3, 4, 5].map(hz => {
            const x = (hz / 5) * (width - 2 * padding) + padding;
            return (
              <g key={hz}>
                <line x1={x} y1={height - padding} x2={x} y2={height - padding + 5} stroke="var(--text-muted)" />
                <text x={x} y={height - 5} fontSize="8" fill="var(--text-muted)" textAnchor="middle">{hz}Hz</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const SessionView = ({ patient, onEndSession }) => {
  const { isConnected, error, connect, disconnect, onData } = useBLE();
  const [bleData, setBleData] = useState({ signalHP: 0, pulse: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [isBeating, setIsBeating] = useState(false);
  const [hrvMetrics, setHrvMetrics] = useState({ rmssd: 0, sdnn: 0, lf: 0, hf: 0, ratio: 0 });
  const [history, setHistory] = useState({ 
     bpm: [], rr: [], rmssd: [], sdnn: [], ratio: [], signalHP: [], pulseRaw: [],
     lf: [], hf: [], ppgSpectrum: [], rrSpectrum: []
  });

  const canvasRef = useRef(null);
  const lastPeakTimeRef = useRef(null);
  const simIntervalRef = useRef(null);
  const bpmHistoryRef = useRef([]); // for stable BPM (last 8)
  const rrWindowRef = useRef([]);   // for HRV (last 30s)
  const historyLimit = 100; // number of points to keep for graphs

  useEffect(() => {
    onData((data) => {
      setBleData(data);

      setHistory(prev => {
        const newSignalHP = [...prev.signalHP, data.signalHP].slice(-historyLimit);
        const newPulseRaw = [...prev.pulseRaw, data.pulse || 0].slice(-historyLimit);

         let newSpectrum = prev.ppgSpectrum;
         // PPG FFT - Compute immediately using zero-padding for responsiveness
         if (newSignalHP.length > 10) { 
            const ppgBufferRaw = newSignalHP.slice(-128);
            const ppgBuffer128 = new Array(128).fill(0);
            // Zero-pad the beginning to reach 128 points
            for (let i = 0; i < ppgBufferRaw.length; i++) {
               ppgBuffer128[128 - ppgBufferRaw.length + i] = ppgBufferRaw[i];
            }
            
            const meanP = ppgBuffer128.reduce((a,b)=>a+b,0) / (ppgBufferRaw.length || 1);
            const windowed = ppgBuffer128.map((v, i) => {
               if (i < 128 - ppgBufferRaw.length) return 0; // Pad
               return (v - meanP) * (0.5 * (1 - Math.cos(2 * Math.PI * i / 127)));
            });
            const { spectrum } = computeSpectralPowers(windowed, 10);
            newSpectrum = spectrum.slice(0, 64);
         }

        return {
          ...prev,
          signalHP: newSignalHP,
          pulseRaw: newPulseRaw,
          ppgSpectrum: newSpectrum
        };
      });

      if (data.pulse > 0) {
        handlePulseDetection();
      }
    });
  }, [onData]);

  const handlePulseDetection = () => {
    const now = performance.now();
    if (lastPeakTimeRef.current) {
      const rrInterval = now - lastPeakTimeRef.current; // RR en ms

      if (rrInterval > 300 && rrInterval < 1500) {
        // --- Stable BPM (Old Logic: 8 samples mean) ---
        bpmHistoryRef.current.push(rrInterval);
        if (bpmHistoryRef.current.length > 8) bpmHistoryRef.current.shift();

        const meanRR = bpmHistoryRef.current.reduce((a, b) => a + b, 0) / bpmHistoryRef.current.length;
        const stableBpm = Math.round(60000 / meanRR);
        setBpm(stableBpm);

        // Update trend history for the lower graph
        setHistory(prev => ({
          ...prev,
          rr: [...prev.rr, rrInterval].slice(-historyLimit),
          bpm: [...prev.bpm, stableBpm].slice(-historyLimit)
        }));

        // HRV Window (32 seconds to match 128pt FFT @ 4Hz)
        rrWindowRef.current.push(rrInterval);
        let totalTime = rrWindowRef.current.reduce((s, r) => s + r, 0);
        while (totalTime > 32000 && rrWindowRef.current.length > 2) {
          rrWindowRef.current.shift();
          totalTime = rrWindowRef.current.reduce((s, r) => s + r, 0);
        }

        if (rrWindowRef.current.length > 20) {
          calculateHRV(rrWindowRef.current);
        }
      }
    }
    lastPeakTimeRef.current = now;
    setIsBeating(true);
    setTimeout(() => setIsBeating(false), 150);
  };

  const calculateHRV = (intervals) => {
    const N = intervals.length;
    if (N < 5) return;

    // 1. SDNN
    const mean = intervals.reduce((a, b) => a + b, 0) / N;
    const variance = intervals.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (N - 1);
    const sdnn = Math.sqrt(variance);

    // 2. RMSSD
    let sumDiffSq = 0;
    for (let i = 0; i < N - 1; i++) {
      sumDiffSq += Math.pow(intervals[i + 1] - intervals[i], 2);
    }
    const rmssd = Math.sqrt(sumDiffSq / (N - 1));

    // 3. Clinical Spectral Analysis (FFT on Interpolated RR)
    // Resampling at 4Hz (250ms intervals)
    const fs = 4;
    let currentTime = 0;
    const times = intervals.map(r => {
      const t = currentTime;
      currentTime += r / 1000; // to seconds
      return t;
    });

    // Create 128 points (exactly 32s window)
    const tempBuffer = [];
    for (let i = 0; i < 128; i++) {
      const targetT = i * (1 / fs);
      // Linear Interpolation
      let val = intervals[0];
      for (let j = 0; j < times.length - 1; j++) {
        if (targetT >= times[j] && targetT <= times[j + 1]) {
          const t0 = times[j], t1 = times[j + 1];
          const v0 = intervals[j], v1 = intervals[j + 1];
          val = v0 + (v1 - v0) * (targetT - t0) / (t1 - t0);
          break;
        }
      }
      tempBuffer.push(val);
    }

    // Correct Signal Centering + Hann Windowing
    const meanResampled = tempBuffer.reduce((a, b) => a + b, 0) / 128;
    const resampled = tempBuffer.map((v, i) => {
      const hann = 0.5 * (1 - Math.cos(2 * Math.PI * i / 127));
      return (v - meanResampled) * hann;
    });

    const { lf, hf, spectrum } = computeSpectralPowers(resampled, fs);
    const ratio = hf > 0 ? lf / hf : 0;
    const totalPower = lf + hf;
    const lf_nu = totalPower > 0 ? (lf / totalPower) * 100 : 0;
    const hf_nu = totalPower > 0 ? (hf / totalPower) * 100 : 0;

    setHrvMetrics({
      rmssd: Math.round(rmssd),
      sdnn: Math.round(sdnn),
      lf: lf.toFixed(2),
      hf: hf.toFixed(2),
      lf_nu: lf_nu.toFixed(1),
      hf_nu: hf_nu.toFixed(1),
      ratio: ratio.toFixed(2)
    });

    setHistory(prev => ({
       ...prev,
       rmssd: [...prev.rmssd, rmssd].slice(-historyLimit),
       sdnn: [...prev.sdnn, sdnn].slice(-historyLimit),
       ratio: [...prev.ratio, ratio].slice(-historyLimit),
       lf: [...prev.lf, lf].slice(-historyLimit),
       hf: [...prev.hf, hf].slice(-historyLimit),
       rrSpectrum: spectrum // RR Spectrum used for clinical HRV metrics
    }));
  };

  const computeSpectralPowers = (data, fs) => {
    // Simplest Cooley-Tukey for N=128
    const N = data.length;
    const real = [...data];
    const imag = new Array(N).fill(0);

    const fft = (re, im) => {
      const n = re.length;
      if (n <= 1) return;
      const reEven = [], imEven = [], reOdd = [], imOdd = [];
      for (let i = 0; i < n / 2; i++) {
        reEven.push(re[2 * i]); imEven.push(im[2 * i]);
        reOdd.push(re[2 * i + 1]); imOdd.push(im[2 * i + 1]);
      }
      fft(reEven, imEven); fft(reOdd, imOdd);
      for (let k = 0; k < n / 2; k++) {
        const th = -2 * Math.PI * k / n;
        const wRe = Math.cos(th), wIm = Math.sin(th);
        const tRe = wRe * reOdd[k] - wIm * imOdd[k];
        const tIm = reOdd[k] * wIm + imOdd[k] * wRe;
        re[k] = reEven[k] + tRe; im[k] = imEven[k] + tIm;
        re[k + n / 2] = reEven[k] - tRe; im[k + n / 2] = imEven[k] - tIm;
      }
    };

    fft(real, imag);

    const fullSpectrum = [];
    const N_inv = 1 / N; // Normalization factor
    let lfPower = 0; let hfPower = 0;
    for (let i = 1; i < N / 2; i++) {
      const freq = i * fs / N;
      const magSq = (real[i] * real[i] + imag[i] * imag[i]) * N_inv; // 1/N Normalization
      fullSpectrum.push(Math.sqrt(magSq));
      if (freq >= 0.04 && freq <= 0.15) lfPower += magSq;
      if (freq > 0.15 && freq <= 0.40) hfPower += magSq; // Scientific band 0.4Hz
    }

    return { lf: lfPower, hf: hfPower, spectrum: fullSpectrum };
  };

  // Simulation Logic
  useEffect(() => {
    if (isSimulating) {
      disconnect();
      let t = 0;
      simIntervalRef.current = setInterval(() => {
        t += 1;
        // Mock PPG signal update
        const fakeSignal = Math.sin(t * 0.5) * 50 + 512;
        setBleData(prev => ({ ...prev, signalHP: fakeSignal }));
        setHistory(prev => ({
          ...prev,
          signalHP: [...prev.signalHP, fakeSignal].slice(-historyLimit)
        }));

        // Trigger peak every ~800ms
        if (t % 8 === 0) {
          handlePulseDetection();
        }
      }, 100);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.5, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      className="view-container session-layout"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="session-topbar glass-card">
        <Magnetic>
          <button className="btn btn-secondary icon-btn-text" onClick={() => { disconnect(); onEndSession(); }}>
            <ArrowLeft size={16} /> Fin d'examen
          </button>
        </Magnetic>
        <div className="patient-tag">
          Patient en cours : <strong>{patient?.firstName} {patient?.lastName}</strong> <span className="pt-id">#{patient?.id}</span>
        </div>
      </div>

      <div className="monitor-container">
        <div className="monitor-sidebar">
          {/* BPM Panel */}
          <motion.div className="panel data-panel glass-card" variants={panelVariants}>
            {/* ... content remains same or similar ... */}
            <h3><HeartPulse size={18} className="mr-2" /> Rythme Cardiaque</h3>
            {/* ... inner part of BPM panel ... */}
            <div className="bpm-display">
              <motion.div className={`heart-icon ${isBeating ? 'beat' : ''}`} animate={isBeating ? { scale: [1, 1.2, 1] } : {}}>
                <HeartPulse size={48} color={isBeating ? "#ef4444" : "#64748b"} />
              </motion.div>
              <div className="bpm-value-box">
                <span className="val">{bpm || '--'}</span>
                <span className="unit">BPM</span>
              </div>
            </div>
          </motion.div>

          {/* New Medical Metrics Sidebar Section */}
          <motion.div className="panel metrics-panel glass-card" variants={panelVariants}>
            <h3><Activity size={18} className="mr-2" /> Live Parameters</h3>
            <div className="metrics-v-grid">
              <div className="metric-box">
                <label>Heart Rate (BPM)</label>
                <span className="val">{bpm || '--'}</span>
              </div>
              <div className="metric-box">
                <label>RMSSD</label>
                <span className="val" style={{ color: '#00ff88' }}>{hrvMetrics.rmssd} <small>ms</small></span>
              </div>
              <div className="metric-box">
                <label>SDNN</label>
                <span className="val" style={{ color: '#ffcc00' }}>{hrvMetrics.sdnn} <small>ms</small></span>
              </div>
              <div className="metric-box">
                <label>LF/HF Ratio</label>
                <span className="val" style={{ color: '#bf00ff' }}>{hrvMetrics.ratio}</span>
              </div>
              <div className="metric-box">
                <label>HF (ms²)</label>
                <span className="val">{hrvMetrics.hf}</span>
              </div>
              <div className="metric-box">
                <label>LF (ms²)</label>
                <span className="val">{hrvMetrics.lf}</span>
              </div>
              <div className="metric-box">
                <label>LF nu (%)</label>
                <span className="val" style={{ color: '#ff4444' }}>{hrvMetrics.lf_nu}</span>
              </div>
              <div className="metric-box">
                <label>HF nu (%)</label>
                <span className="val" style={{ color: '#44ff44' }}>{hrvMetrics.hf_nu}</span>
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div className="panel control-panel glass-card" variants={panelVariants}>
            <h3><Bluetooth size={18} className="mr-2" /> Paramètres Matériel</h3>

            {error && <div className="error-banner mb-3"><AlertTriangle size={14} /> {error}</div>}

            <div className="connection-status">
              Status : <span className={`status-dot ${isConnected ? 'on' : 'off'}`}></span>
              {isConnected ? 'Connecté (ESP32)' : isSimulating ? 'Mode Simulation' : 'Déconnecté'}
            </div>

            <div className="action-stack mt-4" style={{ display: 'grid', gap: '1rem' }}>
              <Magnetic>
                {isConnected ? (
                  <button className="btn btn-danger w-full" onClick={disconnect}>
                    <PowerOff size={16} /> Déconnecter l'appareil
                  </button>
                ) : (
                  <button className="btn btn-primary w-full" onClick={() => { setIsSimulating(false); connect(); }}>
                    <Zap size={16} /> Appairer l'ESP32
                  </button>
                )}
              </Magnetic>
              <div className="divider" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ou</div>
              <Magnetic>
                <button className={`btn btn-secondary w-full ${isSimulating ? 'active-sim' : ''}`} onClick={() => setIsSimulating(!isSimulating)}>
                  <RefreshCw size={16} className={isSimulating ? "spin" : ""} />
                  {isSimulating ? "Arrêter la Simulation" : "Lancer une Simulation"}
                </button>
              </Magnetic>
            </div>
          </motion.div>

          <motion.div className="panel stats-panel glass-card" variants={panelVariants}>
            <h3><Cpu size={18} className="mr-2" /> Capteur Brut</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span>Signal HP</span>
                <motion.strong animate={{ opacity: [0.5, 1] }}>{bleData.signalHP.toFixed(1)}</motion.strong>
              </div>
              <div className="stat-box">
                <span>Pulse Raw</span>
                <strong>{bleData.pulse.toFixed(1)}</strong>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="monitor-main glass-card pro-analytics-hub"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="monitor-header">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Activity className="text-primary pulse-slow" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">PPG-Based HRV Analysis Engine</h2>
                <div className="hub-badges">
                  <span className="badge-tech">CALIBRATED FFT</span>
                  <span className="badge-tech">1/N NORMALIZED</span>
                  <span className="badge-tech">N=128 @ 4Hz</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pro-monitor-grid vertical-stack">
            <MiniGraph data={history.pulseRaw} color="#22d3ee" label="1. Peak Detection (Pulse Events)" unit="raw" />
             <MiniGraph data={history.signalHP} color="#00f2fe" label="2. PPG Signal (Time Domain)" unit="u.a" />
             <div className="dual-monitor-grid">
                <FrequencyGraph data={history.ppgSpectrum} color="#a855f7" label="3a. PPG Signal Spectrum (10Hz)" unit="Hz" />
                <FrequencyGraph data={history.rrSpectrum} color="#f59e0b" label="3b. IBI Variability Spectrum (4Hz)" unit="Hz" />
             </div>
             <div className="dual-monitor-grid">
                <MiniGraph data={history.lf} color="#ff4444" label="4a. LF Power (0.04–0.15 Hz)" unit="ms²" />
                <MiniGraph data={history.hf} color="#44ff44" label="4b. HF Power (0.15–0.40 Hz)" unit="ms²" />
             </div>
            <MiniGraph data={history.ratio} color="#bf00ff" label="5. LF/HF Ratio (Autonomic Balance)" unit="" threshold={2.0} />
            <MiniGraph data={history.rmssd} color="#00ff88" label="6. RMSSD (Short-term HRV)" unit="ms" />
            <MiniGraph data={history.sdnn} color="#ffcc00" label="7. SDNN (Overall HRV)" unit="ms" />
            <MiniGraph data={history.rr} color="#38bdf8" label="8. NN Intervals (IBI - Filtered RR)" unit="ms" />
          </div>
        </motion.div>
      </div>


      <style dangerouslySetInnerHTML={{
        __html: `
        .monitor-container { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 1rem; margin-bottom: 2rem; }
        .monitor-container { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 1rem; }
        .monitor-sidebar { display: flex; flex-direction: column; gap: 1rem; }
        
        /* Pro Monitor Hub */
        .pro-analytics-hub { min-height: 1400px; padding: 2rem; }
        .pro-monitor-grid.vertical-stack { display: flex; flex-direction: column; gap: 2.5rem; margin-top: 2rem; }
        .dual-monitor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .frequency-plot .svg-stage { height: 180px; }
        .frequency-plot text { font-family: 'JetBrains Mono'; }
        
        .metrics-v-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem; }
        .metric-box { background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: 12px; border: 1px solid var(--border); }
        .metric-box label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
        .metric-box .val { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 1.1rem; color: var(--primary); }
        .metric-box .val small { font-size: 0.7rem; font-weight: 400; opacity: 0.5; }
        
        .pro-graph-card { display: flex; flex-direction: column; gap: 1rem; }
        
        .svg-stage.themed-graph-bg { padding: 0.5rem; border-radius: 20px; overflow: hidden; background: var(--secondary) !important; border: 1px solid var(--border); color: var(--text-muted); }
        .mini-graph-placeholder { height: 120px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem; }
        .graph-header { display: flex; justify-content: space-between; align-items: center; }
        .title-group { display: flex; align-items: center; gap: 0.75rem; }
        .title-group .dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
        .title-group .label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .value-group { display: flex; align-items: center; gap: 0.75rem; }
        .highlight-badge { padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid; font-size: 0.7rem; font-family: 'JetBrains Mono'; font-weight: 700; background: rgba(0,0,0,0.3); }
        .main-value { font-family: 'Outfit'; font-weight: 800; font-size: 1.6rem; }
        .main-value small { font-size: 0.75rem; opacity: 0.6; }
        
        .svg-stage { padding: 0.5rem; border-radius: 20px; overflow: hidden; background: #050508 !important; border: 1px solid rgba(255,255,255,0.03); }
        .mini-graph-placeholder { height: 120px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem; }
        
        .pulse-slow { animation: pulse 3s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        
        .spin { animation: rotate 2s linear infinite; }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        .active-sim { border-color: var(--primary) !important; color: var(--primary) !important; box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
        
        /* Alert state */
        .pro-graph-card.alert .svg-stage { border-color: rgba(239, 68, 68, 0.3); }
        .pro-graph-card.alert .main-value { color: var(--danger) !important; }
      `}} />
    </motion.div>
  );
};

export default SessionView;
