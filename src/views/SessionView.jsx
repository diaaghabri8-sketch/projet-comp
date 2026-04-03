import React, { useState, useEffect, useRef } from 'react';
import useBLE from '../hooks/useBLE';
import ECGCanvas from '../components/ECGCanvas';
import { saveSession } from '../db';
import { ArrowLeft, Activity, Bluetooth, PowerOff, Zap, RefreshCw, Cpu, AlertTriangle, HeartPulse, Brain, Gauge, Info, Pause, Circle, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '../components/Magnetic';

const MiniGraph = React.memo(({ data, color, label, unit, threshold, thresholdType = 'above', type = 'line', secondaryData = null, secondaryColor = null, highlights = [] }) => {
  const width = 400;
  const height = 120;
  const padding = 10;

  const safeId = React.useMemo(() => label.replace(/[^a-zA-Z0-0]/g, '-'), [label]);

  const points = React.useMemo(() => {
    if (!data || data.length < 2) return [];
    const validD = data.filter(v => Number.isFinite(v));
    if (validD.length < 2) return [];

    // Safer min/max without spread to prevent stack overflow
    let min = validD[0], max = validD[0];
    for (let i = 1; i < validD.length; i++) {
      if (validD[i] < min) min = validD[i];
      if (validD[i] > max) max = validD[i];
    }
    min *= 0.95;
    max = max * 1.05 || 1;
    const range = max - min || 1;
    return validD.map((val, i) => ({
      x: (i / (validD.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 2 * padding) - padding
    }));
  }, [data, width, height, padding]);

  const pathData = React.useMemo(() =>
    points.length > 1 ? `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : ''
    , [points]);

  const areaData = React.useMemo(() =>
    points.length > 1 ? `${pathData} L ${width},${height} L 0,${height} Z` : ''
    , [pathData, width, height]);

  const secondaryPath = React.useMemo(() => {
    if (!secondaryData || secondaryData.length < 2) return '';
    const sPoints = (function () {
      const validD = secondaryData.filter(v => Number.isFinite(v));
      if (validD.length < 2) return [];
      const min = Math.min(...validD) * 0.95;
      const max = Math.max(...validD) * 1.05 || 1;
      const range = max - min || 1;
      return validD.map((val, i) => ({
        x: (i / (validD.length - 1)) * width,
        y: height - ((val - min) / range) * (height - 2 * padding) - padding
      }));
    })();
    return sPoints.length > 1 ? `M ${sPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  }, [secondaryData, width, height, padding]);

  const latestValue = data[data.length - 1];
  const isStressed = threshold && (thresholdType === 'below' ? latestValue < threshold : latestValue > threshold);

  if (!data || data.length === 0) return (
    <div className="mini-graph-placeholder glass-card">Calcul en cours...</div>
  );

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
            {Number(latestValue || 0).toFixed(unit === 'ms' ? 0 : 1)} <small>{unit}</small>
          </span>
        </div>
      </div>
      <div className="svg-stage glass-card themed-graph-bg">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <pattern id={`grid-${safeId}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.05" />
            </pattern>
            <linearGradient id={`grad-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${safeId})`} />

          {secondaryPath && (
            <path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
          )}

          <path d={areaData} fill={`url(#grad-${safeId})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

          {threshold && (
            <line x1="0" y1={height / 2.5} x2={width} y2={height / 2.5} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="5 5" />
          )}
        </svg>
      </div>
    </div>
  );
});


const FrequencyGraph = React.memo(({ data, labels, color, label, unit }) => {
  const width = 400;
  const height = 150;
  const padding = 20;
  const safeId = React.useMemo(() => label.replace(/[^a-zA-Z0-0]/g, '-'), [label]);

  const points = React.useMemo(() => {
    if (!data || data.length < 2) return [];
    const cleanData = data.filter(v => Number.isFinite(v));
    if (cleanData.length < 2) return [];

    let maxVal = cleanData[0];
    for (let i = 1; i < cleanData.length; i++) if (cleanData[i] > maxVal) maxVal = cleanData[i];
    maxVal = (maxVal || 1) * 1.1;

    return cleanData.map((val, i) => ({
      x: (i / (cleanData.length - 1)) * (width - 2 * padding) + padding,
      y: height - (val / maxVal) * (height - 2 * padding) - padding
    }));
  }, [data, width, height, padding]);

  const pathData = React.useMemo(() =>
    points.length > 1 ? `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : ''
    , [points]);

  if (!data || data.length < 2) return (
    <div className="mini-graph-placeholder glass-card">Calcul spectral...</div>
  );

  return (
    <div className="pro-graph-card frequency-plot">
      <div className="graph-header">
        <label>{label}</label>
        <span className="main-value" style={{ color }}>Spectrum <small>{unit}</small></span>
      </div>
      <div className="svg-stage glass-card">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <pattern id={`hz-grid-${safeId}`} width="40" height="150" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="150" stroke="rgba(255,255,255,0.05)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#hz-grid-${safeId})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="2" />

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
});


class RenderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-box glass-card p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Erreur de Rendu Critique</h2>
          <p className="text-sm opacity-70 mb-4">{this.state.error?.message}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Réinitialiser l'interface</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getNormativeRMSSD = (age, sex) => {
  if (sex === 'm') {
    if (age <= 14) return 38; if (age <= 19) return 33; if (age <= 24) return 28;
    if (age <= 29) return 27; if (age <= 34) return 24; if (age <= 39) return 21;
    if (age <= 44) return 19; if (age <= 49) return 17; if (age <= 54) return 16;
    if (age <= 59) return 13; if (age <= 64) return 12; if (age <= 69) return 10;
    if (age <= 74) return 9; return 8;
  } else {
    if (age <= 14) return 40; if (age <= 19) return 36; if (age <= 24) return 31;
    if (age <= 29) return 30; if (age <= 34) return 28; if (age <= 39) return 25;
    if (age <= 44) return 22; if (age <= 49) return 19; if (age <= 54) return 18;
    if (age <= 59) return 15; if (age <= 64) return 14; if (age <= 69) return 11;
    if (age <= 74) return 11; return 9;
  }
};

const SessionView = ({ patient, onEndSession }) => {
  const { isConnected, error, connect, disconnect, onData } = useBLE();
  const [bleData, setBleData] = useState({ signalHP: 0, pulse: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [isBeating, setIsBeating] = useState(false);
  const [hrvMetrics, setHrvMetrics] = useState({ rmssd: 0, hf: 0 });
  const [history, setHistory] = useState({
    bpm: [], rr: [], rmssd: [], signalHP: [], pulseRaw: [],
    hf: [], ppgSpectrum: [], rrSpectrum: [], stressScore: []
  });
  const [compositeScore, setCompositeScore] = useState(0);

  // New Session & Recording States
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle', 'running', 'paused'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimeRef = useRef(0);
  const recordedSessionRef = useRef({
    startTime: null,
    duration: 0,
    metrics: [], // { time, bpm, rmssd, hf, stressScore }
    rawCurves: [] // { time, signalHP, pulseRaw }
  });
  const timerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);

  const historyRef = useRef({
    bpm: [], rr: [], rmssd: [], signalHP: [], pulseRaw: [],
    hf: [], ppgSpectrum: [], rrSpectrum: [], stressScore: []
  });
  const lastPeakTimeRef = useRef(null);
  const simIntervalRef = useRef(null);
  const beatTimeoutRef = useRef(null);
  const latestBleDataRef = useRef({ signalHP: 0, pulse: 0 });
  const bpmHistoryRef = useRef([]); // for stable BPM (last 8)
  const rrWindowRef = useRef([]);   // for HRV (last 30s)
  const rrWindowTotalTimeRef = useRef(0);
  const historyLimit = 100; // number of points to keep for graphs
  const maxRecordingPoints = 10000; // Limit to avoid memory bloat
  const fftBuffer128 = useRef(new Float32Array(128)); // Pre-allocated for FFT

  const age = patient.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : 35;
  const sex = patient.sex || 'm';
  const rmssdNorm = getNormativeRMSSD(age, sex);

  // --- Optimized Data Sync Loop (Throttled to 5Hz) ---
  useEffect(() => {
    const syncId = setInterval(() => {
      try {
        if (sessionStatus === 'paused') return;

        // Create new references for mutated arrays to trigger React.memo re-renders
        const h = historyRef.current;
        setHistory({
          signalHP: [...h.signalHP],
          pulseRaw: [...h.pulseRaw],
          rr: [...h.rr],
          bpm: [...h.bpm],
          rmssd: [...h.rmssd],
          hf: [...h.hf],
          stressScore: [...h.stressScore],
          ppgSpectrum: h.ppgSpectrum,
          rrSpectrum: h.rrSpectrum
        });
        setBleData(latestBleDataRef.current);

        // Handle Recording Data Log
        if (isRecording) {
          const now = Date.now();
          const p = recordedSessionRef.current;
          if (p.metrics.length < maxRecordingPoints) {
            p.metrics.push({
              time: recordingTimeRef.current,
              timestamp: now,
              bpm: (h.bpm[h.bpm.length - 1] || 0),
              rmssd: (h.rmssd[h.rmssd.length - 1] || 0),
              hf: (h.hf[h.hf.length - 1] || 0),
              stressScore: (h.stressScore[h.stressScore.length - 1] || 0)
            });
            p.rawCurves.push({
              time: recordingTimeRef.current,
              signalHP: latestBleDataRef.current.signalHP,
              pulseRaw: latestBleDataRef.current.pulseRaw
            });
          }
        }
      } catch (err) {
        console.error("UI Sync Error:", err);
      }
    }, 200);

    onData((data) => {
      if (sessionStatus === 'paused') return;
      // 1. Ref storage ONLY (zero render cost here)
      latestBleDataRef.current = data;

      // 2. Update History Ref
      const h = historyRef.current;
      const cleanHP = Number.isFinite(data.signalHP) ? data.signalHP : (h.signalHP[h.signalHP.length - 1] || 0);
      const cleanPulse = Number.isFinite(data.pulse) ? data.pulse : 0;

      h.signalHP.push(cleanHP);
      if (h.signalHP.length > historyLimit) h.signalHP.shift();

      h.pulseRaw.push(cleanPulse);
      if (h.pulseRaw.length > historyLimit) h.pulseRaw.shift();

      // 3. Optimized PPG FFT (Every 5 samples to save CPU)
      if (h.signalHP.length > 10 && h.signalHP.length % 5 === 0) {
        const ppgBufferRaw = h.signalHP.slice(-128);
        const buf = fftBuffer128.current;
        buf.fill(0);

        const offset = 128 - ppgBufferRaw.length;
        let sum = 0;
        for (let i = 0; i < ppgBufferRaw.length; i++) {
          const val = ppgBufferRaw[i];
          buf[offset + i] = val;
          sum += val;
        }

        const meanP = sum / (ppgBufferRaw.length || 1);
        for (let i = offset; i < 128; i++) {
          const hann = 0.5 * (1 - Math.cos(2 * Math.PI * i / 127));
          buf[i] = (buf[i] - meanP) * hann;
        }

        const { spectrum } = computeSpectralPowers(buf, 10);
        h.ppgSpectrum = spectrum.slice(0, 64);
      }

      // 4. Pulse Detection (with 250ms debounce to prevent noise-induced overhead)
      const now = performance.now();
      if (data.pulse > 0 && (!lastPeakTimeRef.current || (now - lastPeakTimeRef.current > 250))) {
        handlePulseDetection(now);
      }
    });

    return () => {
      clearInterval(syncId);
      if (timerRef.current) clearInterval(timerRef.current);
      onData(null); // Cleanup listener
    };
  }, [onData, sessionStatus, isRecording]);

  // Recording Timer Effect
  useEffect(() => {
    if (isRecording && sessionStatus === 'running') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, sessionStatus]);

  const handleStartSession = () => {
    setSessionStatus('running');
    if (!isConnected && !isSimulating) connect();
  };

  const handleHoldSession = () => {
    setSessionStatus(prev => prev === 'paused' ? 'running' : 'paused');
  };

  const handleStopSession = () => {
    setSessionStatus('idle');
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    // Option: prompt save before clearing?
  };

  const handleStartRecording = () => {
    if (sessionStatus !== 'running') setSessionStatus('running');
    setIsRecording(true);
    recordedSessionRef.current = {
      startTime: new Date().toISOString(),
      duration: 0,
      metrics: [],
      rawCurves: []
    };
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    recordingStartTimeRef.current = Date.now();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const finalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
    recordedSessionRef.current.duration = finalDuration;

    // SAVE TO DB
    try {
      saveSession(patient.id, {
        duration: finalDuration,
        avgStress: (function () {
          const m = recordedSessionRef.current.metrics;
          if (m.length === 0) return 0;
          return Math.round(m.reduce((a, b) => a + b.stressScore, 0) / m.length);
        })(),
        avgBpm: (function () {
          const m = recordedSessionRef.current.metrics;
          if (m.length === 0) return 0;
          const bm = m.filter(v => v.bpm > 0);
          return bm.length > 0 ? Math.round(bm.reduce((a, b) => a + b.bpm, 0) / bm.length) : 0;
        })(),
        avgRmssd: (function () {
          const m = recordedSessionRef.current.metrics;
          if (m.length === 0) return 0;
          return Math.round(m.reduce((a, b) => a + b.rmssd, 0) / m.length);
        })(),
        data: recordedSessionRef.current
      });
      alert("✅ Séance enregistrée avec succès dans l'historique du patient.");
    } catch (e) {
      console.error("Save Error:", e);
      alert("❌ Une erreur s'est produite lors de l'enregistrement.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePulseDetection = (now) => {
    try {
      if (lastPeakTimeRef.current) {
        const rrInterval = now - lastPeakTimeRef.current; // RR en ms

        if (rrInterval > 300 && rrInterval < 1500 && Number.isFinite(rrInterval)) {
          // --- Stable BPM (8 samples mean) ---
          bpmHistoryRef.current.push(rrInterval);
          if (bpmHistoryRef.current.length > 8) bpmHistoryRef.current.shift();

          const meanRR = bpmHistoryRef.current.reduce((a, b) => a + b, 0) / bpmHistoryRef.current.length;
          const stableBpm = Math.round(60000 / meanRR);
          setBpm(stableBpm);

          // Update Trend Ref
          const h = historyRef.current;
          h.rr.push(rrInterval);
          if (h.rr.length > historyLimit) h.rr.shift();
          h.bpm.push(stableBpm);
          if (h.bpm.length > historyLimit) h.bpm.shift();

          // HRV Window (32 seconds) - Optimized sliding window
          rrWindowRef.current.push(rrInterval);
          rrWindowTotalTimeRef.current += rrInterval;

          // Self-healing check if total time becomes corrupted
          if (!Number.isFinite(rrWindowTotalTimeRef.current)) {
            rrWindowTotalTimeRef.current = rrWindowRef.current.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
          }

          while (rrWindowTotalTimeRef.current > 32000 && rrWindowRef.current.length > 2) {
            const removed = rrWindowRef.current.shift();
            rrWindowTotalTimeRef.current -= removed;
          }

          if (rrWindowRef.current.length > 20) {
            const hrv = calculateHRV(rrWindowRef.current);
            if (hrv) {
              updateStressScore(hrv, stableBpm);
            }
          }
        }
      }
      lastPeakTimeRef.current = now;
      setIsBeating(true);
      if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
      beatTimeoutRef.current = setTimeout(() => setIsBeating(false), 150);
    } catch (err) {
      console.error("Pulse Detection Error:", err);
    }
  };

  const updateStressScore = (hrv, currentBpm) => {
    // Phase 3: BPM Normative Decision 
    // Table: 50-60: Very Low, 60-75: Low, 75-85: Moderate, 85-100: High, >100: Critical
    let bpmS = 0;
    if (currentBpm <= 75) bpmS = 0;       // Optimal/Normal
    else if (currentBpm <= 85) bpmS = 40; // Moderate
    else if (currentBpm <= 100) bpmS = 80; // High
    else bpmS = 100;                      // Critical Stress

    // Phase 2: HF Power Normative Decision (Vagal Tone)
    let hfVal = parseFloat(hrv.hf);
    let hfS = 0;
    if (hfVal >= 800) hfS = 0;
    else if (hfVal >= 300) hfS = 20;  // Marginal
    else if (hfVal >= 100) hfS = 70;  // Poor
    else hfS = 100;                  // Depleted

    // Phase 1: RMSSD Normative Decision (P25)
    let rmssdS = 0;
    if (hrv.rmssd >= rmssdNorm) {
      rmssdS = 0;
    } else {
      rmssdS = 100;
    }

    // FINAL COMBINED LOGIC - Weighted Decision (RMSSD=0.5, HF=0.3, BPM=0.2)
    const finalScore = Math.round((rmssdS * 0.5) + (hfS * 0.3) + (bpmS * 0.2));

    setCompositeScore(finalScore);
    const h = historyRef.current;
    h.stressScore.push(finalScore);
    if (h.stressScore.length > historyLimit) h.stressScore.shift();
  };

  const calculateHRV = (intervals) => {
    const N = intervals.length;
    if (N < 5) return null;

    // Étape 1 : convertir RR en secondes
    const intervalsSec = intervals.map(r => r / 1000);

    // RMSSD (en secondes)
    let sumDiffSq = 0;
    for (let i = 0; i < N - 1; i++) {
      sumDiffSq += Math.pow(intervalsSec[i + 1] - intervalsSec[i], 2);
    }
    const rmssd = Math.sqrt(sumDiffSq / (N - 1));

    // Spectral calculation
    const fs = 4;
    let currentTime = 0;
    const times = intervalsSec.map(r => {
      const t = currentTime;
      currentTime += r;
      return t;
    });

    const tempBuffer = [];
    for (let i = 0; i < 128; i++) {
      const targetT = i * (1 / fs);
      let val = intervalsSec[0];
      for (let j = 0; j < times.length - 1; j++) {
        if (targetT >= times[j] && targetT <= times[j + 1]) {
          const t0 = times[j], t1 = times[j + 1];
          const v0 = intervalsSec[j], v1 = intervalsSec[j + 1];
          const timeSpan = t1 - t0;
          val = timeSpan > 0.001 ? v0 + (v1 - v0) * (targetT - t0) / timeSpan : v0;
          break;
        }
      }
      tempBuffer.push(val);
    }

    const meanResampled = tempBuffer.reduce((a, b) => a + b, 0) / 128;
    const resampled = tempBuffer.map((v, i) => {
      const hann = 0.5 * (1 - Math.cos(2 * Math.PI * i / 127));
      return (v - meanResampled) * hann;
    });

    const { hf, spectrum } = computeSpectralPowers(resampled, fs);

    const metrics = {
      rmssd: Math.round(rmssd * 1000), // conversion en ms pour l'affichage
      hf: Number(hf * 1000000),           // scaling ajusté
      spectrum,
      bpm: bpm // Stabilized BPM from state
    };

    // --- HIERARCHICAL CLINICAL DECISION FUNNEL ---
    const isRmssdLow = metrics.rmssd < rmssdNorm; // HRV drop (P25)
    const isHfLow = parseFloat(metrics.hf) < 300; // Vagal tone drop
    const isBpmHigh = parseFloat(metrics.bpm) > 85; // Cardiovascular activation

    let clinicalStatus = 'Balanced';

    if (isRmssdLow) {
      if (isHfLow) {
        if (isBpmHigh) {
          clinicalStatus = 'High Stress'; // Triple failure (RMSSD + HF + BPM)
        } else {
          clinicalStatus = 'Stressed';      // True Stress (RMSSD + HF)
        }
      } else {
        clinicalStatus = 'Mild Stress';     // Isolated HRV drop (Fatigue)
      }
    } else {
      clinicalStatus = 'Balanced';           // System Stable
    }

    const finalMetrics = { ...metrics, status: clinicalStatus };

    setHrvMetrics(finalMetrics);
    const h = historyRef.current;
    h.rmssd.push(metrics.rmssd); if (h.rmssd.length > historyLimit) h.rmssd.shift();
    h.hf.push(metrics.hf); if (h.hf.length > historyLimit) h.hf.shift();
    h.rrSpectrum = metrics.spectrum;

    return metrics;
  };

  const computeSpectralPowers = (data, fs) => {
    try {
      const N = data.length;
      if (N === 0 || (N & (N - 1)) !== 0) return { lf: 0, hf: 0, spectrum: [] };

      const real = new Float64Array(data);
      const imag = new Float64Array(N);

      // Bit-reversal permutation
      for (let i = 0, j = 0; i < N; i++) {
        if (i < j) {
          [real[i], real[j]] = [real[j], real[i]];
          [imag[i], imag[j]] = [imag[j], imag[i]];
        }
        let m = N >> 1;
        while (m >= 1 && j >= m) {
          j -= m;
          m >>= 1;
        }
        j += m;
      }

      // Cooley-Tukey iterative FFT
      for (let len = 2; len <= N; len <<= 1) {
        const ang = -2 * Math.PI / len;
        const wlenRe = Math.cos(ang);
        const wlenIm = Math.sin(ang);
        for (let i = 0; i < N; i += len) {
          let wRe = 1, wIm = 0;
          for (let j = 0; j < len / 2; j++) {
            const uRe = real[i + j], uIm = imag[i + j];
            const vRe = real[i + j + len / 2] * wRe - imag[i + j + len / 2] * wIm;
            const vIm = real[i + j + len / 2] * wIm + imag[i + j + len / 2] * wRe;
            real[i + j] = uRe + vRe;
            imag[i + j] = uIm + vIm;
            real[i + j + len / 2] = uRe - vRe;
            imag[i + j + len / 2] = uIm - vIm;
            const tmpwRe = wRe * wlenRe - wIm * wlenIm;
            wIm = wRe * wlenIm + wIm * wlenRe;
            wRe = tmpwRe;
          }
        }
      }

      const fullSpectrum = [];
      let hfPower = 0;
      const df = fs / N; // Résolution fréquentielle
      for (let i = 1; i < N / 2; i++) {
        const freq = i * fs / N;
        // Étape 2 : corriger PSD
        const psd = (real[i] * real[i] + imag[i] * imag[i]) / (fs * N);
        const mag = Math.sqrt(Math.max(0, psd));
        fullSpectrum.push(mag);
        // Étape 3 : intégrer correctement avec df
        if (freq >= 0.15 && freq <= 0.40) hfPower += psd * df;
      }

      return {
        hf: Number.isFinite(hfPower) ? hfPower : 0,
        spectrum: fullSpectrum
      };
    } catch (e) {
      console.error("Spectral calculation error:", e);
      return { lf: 0, hf: 0, spectrum: [] };
    }
  };

  // Simulation Logic
  useEffect(() => {
    if (isSimulating) {
      disconnect();
      let t = 0;
      simIntervalRef.current = setInterval(() => {
        if (sessionStatus === 'paused') return;
        t += 1;
        // Mock PPG signal update
        const fakeSignal = Math.sin(t * 0.5) * 50 + 512;

        // Update direct display Ref
        latestBleDataRef.current = { signalHP: fakeSignal, pulse: 0 };

        // Update History Ref
        const h = historyRef.current;
        h.signalHP.push(fakeSignal);
        if (h.signalHP.length > historyLimit) h.signalHP.shift();

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
      if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
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
    <RenderErrorBoundary>
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
              <h3><HeartPulse size={18} className="mr-2" /> Rythme Cardiaque</h3>
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

            {/* New Composite Stress Score Gauge */}
            <motion.div className="panel score-panel glass-card" variants={panelVariants}>
              <div className="flex items-center justify-between mb-2">
                <h3><Gauge size={18} className="mr-2" /> Stress Score</h3>
                <span className={`score-label ${compositeScore > 80 ? 'high' : compositeScore > 50 ? 'med' : 'low'}`}>
                  {compositeScore > 80 ? 'CRITIQUE' : compositeScore > 50 ? 'MODÉRÉ' : 'OPTIMAL'}
                </span>
              </div>

              <div className="score-gauge-container">
                <svg viewBox="0 0 100 50" className="gauge-svg">
                  <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#ddd" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.1" />
                  <motion.path
                    d="M 10 45 A 40 40 0 0 1 90 45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={126 - (126 * compositeScore / 100)}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="score-value">{compositeScore}</div>
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
                  <span className="val" style={{ color: '#00ff88' }}>{Number(hrvMetrics.rmssd || 0).toFixed(0)} <small>ms</small></span>
                </div>
                <div className="metric-box">
                  <label>HF Power</label>
                  <span className="val" style={{ color: '#44ff44' }}>{Number(hrvMetrics.hf || 0).toFixed(0)}</span>
                </div>
                <div className="metric-box status-box mt-4" style={{
                  gridColumn: 'span 2',
                  borderColor: hrvMetrics.status === 'High Stress' ? '#f43f5e' :
                    hrvMetrics.status === 'Stressed' ? '#f59e0b' :
                      hrvMetrics.status === 'Mild Stress' ? '#eab308' : '#00ff88'
                }}>
                  <label>Clinical Decision</label>
                  <span className="val" style={{
                    color: hrvMetrics.status === 'High Stress' ? '#f43f5e' :
                      hrvMetrics.status === 'Stressed' ? '#f59e0b' :
                        hrvMetrics.status === 'Mild Stress' ? '#eab308' : '#00ff88'
                  }}>
                    {hrvMetrics.status || 'Analysing...'}
                  </span>
                  <p className="text-[10px] opacity-70 mt-1">
                    {hrvMetrics.status === 'High Stress' ? 'Total Vagal Depletion + Cardiovascular Activation' :
                      hrvMetrics.status === 'Stressed' ? 'Clinical Stress - Parasympathetic Drop' :
                        hrvMetrics.status === 'Mild Stress' ? 'Fatigue - Early Stress detected' : 'System Homeostasis'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Session & Recording Controls */}
            <motion.div className="panel recording-panel glass-card" variants={panelVariants}>
              <div className="flex items-center justify-between mb-4">
                <h3><Zap size={18} className="mr-2" /> Contrôle de Séance</h3>
                <div className={`timer-badge ${isRecording ? 'pulse-red' : ''}`}>
                  {formatTime(recordingTime)}
                </div>
              </div>

              <div className="session-controls-grid">
                {sessionStatus === 'idle' ? (
                  <button className="btn btn-primary start-btn" onClick={handleStartSession}>
                    <Zap size={16} /> START
                  </button>
                ) : (
                  <>
                    <button className={`btn ${sessionStatus === 'paused' ? 'btn-warning' : 'btn-secondary'} hold-btn`} onClick={handleHoldSession}>
                      <Pause size={16} /> {sessionStatus === 'paused' ? 'RESUME' : 'HOLD'}
                    </button>
                    <button className="btn btn-danger stop-btn" onClick={handleStopSession}>
                      <Square size={16} /> STOP
                    </button>
                  </>
                )}
              </div>

              <div className="recording-actions mt-4">
                {!isRecording ? (
                  <button className="btn btn-outline-record w-full" onClick={handleStartRecording}>
                    <Circle size={14} className="fill-red-500 text-red-500 mr-2" /> ENREGISTRER LA SÉANCE
                  </button>
                ) : (
                  <button className="btn btn-record-active w-full" onClick={handleStopRecording}>
                    <Square size={14} className="mr-2" /> STOP ENREGISTREMENT
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="recording-status-msg mt-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
                    <span className="rec-dot"></span> ENREGISTREMENT EN COURS...
                  </div>
                </div>
              )}
            </motion.div>

            {/* Control Panel (Hardware) */}
            <motion.div className="panel hardware-panel glass-card" variants={panelVariants}>
              <h3><Bluetooth size={18} className="mr-2" /> Connexion Capteur</h3>

              {error && <div className="error-banner mb-3"><AlertTriangle size={14} /> {error}</div>}

              <div className="connection-status">
                Matériel : <span className={`status-dot ${isConnected ? 'on' : 'off'}`}></span>
                {isConnected ? 'ESP32 CONNECTÉ' : isSimulating ? 'SIMULATION ACTIVE' : 'NON CONNECTÉ'}
              </div>

              <div className="action-stack mt-4" style={{ display: 'grid', gap: '1rem' }}>
                <Magnetic>
                  {!isConnected ? (
                    <button className="btn btn-secondary w-full" onClick={() => { setIsSimulating(false); connect(); }}>
                      <Zap size={16} /> Appairer l'ESP32
                    </button>
                  ) : (
                    <button className="btn btn-danger w-full opacity-50" onClick={disconnect}>
                      <PowerOff size={16} /> Débrancher
                    </button>
                  )}
                </Magnetic>
                <Magnetic>
                  <button className={`btn btn-secondary w-full ${isSimulating ? 'active-sim' : ''}`} onClick={() => setIsSimulating(!isSimulating)}>
                    <RefreshCw size={16} className={isSimulating ? "spin" : ""} />
                    {isSimulating ? "Stop Simulation" : "Mode Simulation"}
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

                  <div className="hub-badges">
                    <span className="badge-tech font-bold text-primary uppercase">{patient.firstName} {patient.lastName}</span>
                    <span className="badge-tech">{age}y / {sex === 'f' ? 'Female' : 'Male'}</span>
                    <span className="badge-tech">MIN RMSSD: {rmssdNorm}ms</span>
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
              <MiniGraph data={history.hf} color="#44ff44" label="4. HF Power (0.15–0.40 Hz)" unit="ms²" />
              <MiniGraph
                data={history.rmssd}
                color="#00ff88"
                label="5. RMSSD (Short-term HRV)"
                unit="ms"
                threshold={rmssdNorm}
                thresholdType="below"
              />
              <MiniGraph data={history.rr} color="#38bdf8" label="6. NN Intervals (IBI - Filtered RR)" unit="ms" />

              {/* Algorithm Analysis Panel */}
              <motion.div className="panel algo-panel glass-card mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="text-primary" />
                  <h3 className="text-xl font-bold">Logique Décisionnelle (Standard Clinique)</h3>
                </div>
                <div className="algo-grid">
                  <div className="algo-item">
                    <HeartPulse size={20} className="text-green-400" />
                    <div>
                      <h4>RMSSD Normatif </h4>
                      <p>Seuil dynamique basé sur l'âge et le sexe ({rmssdNorm}ms). Toute valeur inférieure indique un niveau de stress élevé.</p>
                    </div>
                  </div>
                  <div className="algo-item">
                    <Activity size={20} className="text-blue-400" />
                    <div>
                      <h4>HF Power (x4)</h4>
                      <p>Tonus parasympathique et état de relaxation profonde.</p>
                    </div>
                  </div>
                  <div className="algo-item">
                    <Zap size={20} className="text-yellow-400" />
                    <div>
                      <h4>BPM (x2)</h4>
                      <p>Réaction immédiate au stress physiologique.</p>
                    </div>
                  </div>
                </div>
                <div className="algo-footer mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm italic opacity-80">"L'intégration pondérée assure que la récupération à long terme est priorisée sur les réactions immédiates."</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>


        <style dangerouslySetInnerHTML={{
          __html: `
        .monitor-container { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 1rem; margin-bottom: 2rem; }
        .monitor-container { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 1rem; }
        .monitor-sidebar { display: flex; flex-direction: column; gap: 1rem; }
        
        .pro-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: var(--secondary); border: 1px solid var(--border); border-radius: 24px; margin-bottom: 2rem; }
        .ph-left { display: flex; align-items: center; gap: 1.5rem; }
        .btn-back { display: flex; align-items: center; gap: 0.75rem; background: var(--surface); border: 1px solid var(--border); padding: 0.6rem 1.2rem; border-radius: 12px; color: var(--text-main); font-weight: 600; cursor: pointer; transition: 0.3s; }
        .btn-back:hover { background: var(--border); border-color: var(--primary); color: var(--primary); }
        .patient-tag { font-family: 'Outfit'; font-size: 0.9rem; color: var(--text-muted); }
        .patient-tag strong { color: var(--text-main); font-weight: 600; }
        .pt-id { font-family: 'JetBrains Mono'; font-size: 0.75rem; opacity: 0.5; margin-left: 0.5rem; }
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
        .status-box { border-width: 2px; background: rgba(0,0,0,0.2) !important; }
        
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
        
        /* Recording Styles */
        .timer-badge { background: rgba(0,0,0,0.4); padding: 4px 12px; border-radius: 8px; font-family: 'JetBrains Mono'; font-weight: 800; color: var(--primary); font-size: 0.9rem; border: 1px solid var(--border); }
        .session-controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .session-controls-grid .start-btn { grid-column: span 2; }
        .btn-warning { background: #eab308; color: #000; }
        .btn-outline-record { border: 1px solid rgba(239, 68, 68, 0.4); color: white; background: rgba(239, 68, 68, 0.05); }
        .btn-outline-record:hover { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; }
        .btn-record-active { background: #ef4444; color: white; animation: rec-glow 2s infinite; }
        
        .pulse-red { color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
        .rec-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; animation: blink 1s infinite; }
        
        @keyframes rec-glow { 0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2); } 50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        
        .pulse-slow { animation: pulse 3s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        
        .spin { animation: rotate 2s linear infinite; }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        .active-sim { border-color: var(--primary) !important; color: var(--primary) !important; box-shadow: 0 0 15px rgba(99, 102, 241, 0.2); }
        
        /* Alert state */
        .pro-graph-card.alert .svg-stage { border-color: rgba(239, 68, 68, 0.3); }
        .pro-graph-card.alert .main-value { color: var(--danger) !important; }

        /* Scoring & Algorithm Panels */
        .score-gauge-container { position: relative; width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; }
        .gauge-svg { width: 180px; transform: rotate(0deg); }
        .score-value { position: absolute; bottom: 0; font-size: 2.5rem; font-weight: 900; family-font: 'Outfit'; color: var(--text-main); }
        .score-label { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
        .score-label.low { background: #22c55e22; color: #22c55e; }
        .score-label.med { background: #eab30822; color: #eab308; }
        .score-label.high { background: #ef444422; color: #ef4444; }
        .weighted-info { text-align: center; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

        .algo-grid { display: grid; gap: 1.5rem; margin-top: 1rem; }
        .algo-item { display: flex; gap: 1rem; align-items: flex-start; }
        .algo-item h4 { font-size: 0.9rem; font-weight: 700; margin-bottom: 2px; }
        .algo-item p { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }
        .text-green-400 { color: #4ade80; }
        .text-blue-400 { color: #60a5fa; }
        .text-yellow-400 { color: #facc15; }
        
        .error-boundary-box { 
          background: rgba(10, 10, 15, 0.95);
          border: 2px solid #ef4444;
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
          max-width: 500px;
          margin: 100px auto;
          color: white;
        }
      `}} />
      </motion.div>
    </RenderErrorBoundary>
  );
};

export default SessionView;
