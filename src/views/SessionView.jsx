import React, { useState, useEffect, useRef } from 'react';
import useBLE from '../hooks/useBLE';
import ECGCanvas from '../components/ECGCanvas';
import { saveSession } from '../db';
import { ArrowLeft, Activity, Bluetooth, PowerOff, Zap, RefreshCw, Cpu, AlertTriangle, HeartPulse, Brain, Gauge, Info, Pause, Circle, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from '../components/Magnetic';

const MiniGraph = React.memo(({ data, color, label, unit, threshold, thresholdType = 'above', type = 'line', secondaryData = null, secondaryColor = null, highlights = [], peaks = null }) => {
  const width = 400;
  const height = 100; // Compressed height
  const padding = 10;

  const safeId = React.useMemo(() => label.replace(/[^a-zA-Z0-0]/g, '-'), [label]);

  const points = React.useMemo(() => {
    if (!data || data.length < 2) return [];
    const validD = data.filter(v => Number.isFinite(v));
    if (validD.length < 2) return [];

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
      val,
      y: height - ((val - min) / range) * (height - 2 * padding) - padding
    }));
  }, [data, width, height, padding]);

  const pathData = React.useMemo(() =>
    points.length > 1 ? `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : ''
    , [points]);

  const areaData = React.useMemo(() =>
    points.length > 1 ? `${pathData} L ${width},${height} L 0,${height} Z` : ''
    , [pathData, width, height]);

  const peakMarkers = React.useMemo(() => {
    if (!peaks || !points.length) return [];
    return points.filter((p, i) => peaks[i] > 0).map((p, i) => (
      <g key={i}>
        <line x1={p.x - 5} y1={p.y - 5} x2={p.x + 5} y2={p.y + 5} stroke="#ef4444" strokeWidth="2" />
        <line x1={p.x + 5} y1={p.y - 5} x2={p.x - 5} y2={p.y + 5} stroke="#ef4444" strokeWidth="2" />
      </g>
    ));
  }, [peaks, points]);

  const latestValue = data[data.length - 1];
  const isStressed = threshold && (thresholdType === 'below' ? latestValue < threshold : latestValue > threshold);

  if (!data || data.length === 0) return (
    <div className="mini-graph-placeholder glass-card" style={{ height: 100 }}>Calcul...</div>
  );

  return (
    <div className={`pro-graph-card ${isStressed ? 'alert' : ''}`}>
      <div className="graph-header">
        <div className="title-group">
          <span className="dot" style={{ background: color }}></span>
          <span className="label" style={{ fontSize: '0.65rem' }}>{label}</span>
        </div>
        <div className="value-group">
          <span className="main-value" style={{ color, fontSize: '1.2rem' }}>
            {Number(latestValue || 0).toFixed(unit === 'ms' ? 0 : 1)} <small>{unit}</small>
          </span>
        </div>
      </div>
      <div className="svg-stage glass-card themed-graph-bg" style={{ height: 100 }}>
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
          <path d={areaData} fill={`url(#grad-${safeId})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
          {peakMarkers}
        </svg>
      </div>
    </div>
  );
});


const FrequencyGraph = React.memo(({ data, labels, color, label, unit }) => {
  const width = 400;
  const height = 100;
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
    <div className="mini-graph-placeholder glass-card" style={{ height: 100 }}>Calcul...</div>
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

        <div className="monitor-container">
          <div className="monitor-sidebar" style={{ maxHeight: '850px', overflowY: 'auto' }}>
            {/* BPM Panel */}
            <motion.div className="panel data-panel glass-card" variants={panelVariants}>
              <div className="flex items-center justify-between">
                <h3><HeartPulse size={16} className="mr-2" /> Rythme</h3>
                <div className="bpm-value-box">
                  <span className="val" style={{ fontSize: '1.5rem' }}>{bpm || '--'}</span>
                  <span className="unit">BPM</span>
                </div>
              </div>
            </motion.div>

            {/* Stress Score Gauge */}
            <motion.div className="panel score-panel glass-card" variants={panelVariants}>
              <div className="flex items-center justify-between mb-2">
                <h3><Gauge size={16} className="mr-2" /> Stress</h3>
                <span className={`score-label ${compositeScore > 80 ? 'high' : compositeScore > 50 ? 'med' : 'low'}`}>
                  {compositeScore > 80 ? 'CRITIQUE' : compositeScore > 50 ? 'MODÉRÉ' : 'OPTIMAL'}
                </span>
              </div>
              <div className="score-gauge-container" style={{ height: '60px' }}>
                <svg viewBox="0 0 100 50" className="gauge-svg" style={{ width: '120px' }}>
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
                <div className="score-value" style={{ fontSize: '1.5rem', bottom: '-5px' }}>{compositeScore}</div>
              </div>
            </motion.div>

            {/* Live Parameters Summary */}
            <motion.div className="panel metrics-panel glass-card" variants={panelVariants}>
              <div className="metrics-v-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="metric-box status-box" style={{ gridColumn: 'span 2', padding: '0.5rem', marginBottom: '0.5rem' }}>
                  <label>Clinical Status</label>
                  <span className="val" style={{ fontSize: '0.9rem', color: hrvMetrics.status === 'High Stress' ? '#f43f5e' : '#00ff88' }}>
                    {hrvMetrics.status || 'Analysing...'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div className="panel recording-panel glass-card" variants={panelVariants}>
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ fontSize: '0.8rem' }}><Zap size={14} className="mr-2" /> Contrôle</h3>
                <div className={`timer-badge ${isRecording ? 'pulse-red' : ''}`} style={{ fontSize: '0.75rem' }}>
                  {formatTime(recordingTime)}
                </div>
              </div>
              <div className="session-controls-grid">
                {sessionStatus === 'idle' ? (
                  <button className="btn btn-primary start-btn btn-sm" onClick={handleStartSession}>START</button>
                ) : (
                  <button className="btn btn-danger stop-btn btn-sm" onClick={handleStopSession} style={{ gridColumn: 'span 2' }}>STOP</button>
                )}
                <button className={`btn btn-sm w-full mt-2 ${isRecording ? 'btn-record-active' : 'btn-outline-record'}`} style={{ gridColumn: 'span 2' }} onClick={isRecording ? handleStopRecording : handleStartRecording}>
                  {isRecording ? 'STOP REC' : 'START REC'}
                </button>
              </div>
            </motion.div>

            {/* Hardware */}
            <motion.div className="panel hardware-panel glass-card" variants={panelVariants}>
              <h3 style={{ fontSize: '0.8rem' }}><Bluetooth size={14} className="mr-2" /> Hardware</h3>
              <div className="connection-status" style={{ fontSize: '0.7rem' }}>
                <span className={`status-dot ${isConnected ? 'on' : 'off'}`}></span>
                {isConnected ? 'CONNECTÉ' : isSimulating ? 'SIMULATION' : 'NON CONNECTÉ'}
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-secondary btn-xs" onClick={() => isConnected ? disconnect() : connect()}>{isConnected ? 'Disconn' : 'Connect'}</button>
                <button className="btn btn-secondary btn-xs" onClick={() => setIsSimulating(!isSimulating)}>Sim</button>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="monitor-main glass-card pro-analytics-hub"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="monitor-header" style={{ marginBottom: '1rem' }}>
              <div className="hub-badges">
                <span className="badge-tech font-bold text-primary uppercase">{patient.firstName} {patient.lastName}</span>
                <span className="badge-tech">Seuil: {rmssdNorm}ms</span>
              </div>
            </div>

            <div className="pro-monitor-grid vertical-stack" style={{ gap: '0.5rem' }}>
              <MiniGraph data={history.signalHP} peaks={history.pulseRaw} color="#00f2fe" label="1. PPG Signal & Peaks Overlay" unit="u.a" />
              <MiniGraph data={history.rr} color="#38bdf8" label="2. RR Intervals (NN Trend)" unit="ms" />

              <div className="dual-monitor-grid">
                <FrequencyGraph data={history.ppgSpectrum} color="#a855f7" label="3a. PPG FFT" unit="Hz" />
                <FrequencyGraph data={history.rrSpectrum} color="#f59e0b" label="3b. RR FFT" unit="Hz" />
              </div>

              <div className="dual-monitor-grid">
                <MiniGraph data={history.hf} color="#44ff44" label="4a. HF Power" unit="ms²" />
                <MiniGraph data={history.rmssd} color="#00ff88" label="4b. RMSSD (HRV)" unit="ms" threshold={rmssdNorm} thresholdType="below" />
              </div>

            </div>
          </motion.div>
        </div>


        <style dangerouslySetInnerHTML={{
          __html: `
        .monitor-container { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; margin-top: 1rem; }
        .monitor-sidebar { display: flex; flex-direction: column; gap: 0.75rem; }
        .pro-analytics-hub { min-height: auto; padding: 1rem; overflow: hidden; }
        .pro-monitor-grid.vertical-stack { display: flex; flex-direction: column; gap: 0.75rem; }
        .dual-monitor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .frequency-plot .svg-stage { height: 100px; }
        
        .metric-box { background: rgba(0,0,0,0.03); padding: 0.4rem; border-radius: 8px; border: 1px solid var(--border); }
        .metric-box label { font-size: 10px; opacity: 0.6; }
        .metric-box .val { font-size: 0.9rem; font-weight: 700; }
        
        .pro-graph-card { background: var(--surface); border: 1px solid var(--border); padding: 0.5rem; border-radius: 12px; }
        .svg-stage.themed-graph-bg { background: rgba(0,0,0,0.2) !important; }
        
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; }
        .btn-xs { padding: 0.2rem 0.5rem; font-size: 0.65rem; }
        
        .panel h3 { font-size: 0.75rem; margin-bottom: 0px; }
        .bpm-value-box .val { font-weight: 900; color: var(--primary); }
        .bpm-value-box .unit { font-size: 0.6rem; margin-left: 2px; opacity: 0.5; }
        
        .timer-badge { font-family: 'JetBrains Mono'; background: rgba(0,0,0,0.3); border-radius: 4px; padding: 2px 6px; }
        
        .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 4px; }
        .status-dot.on { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .status-dot.off { background: #ef4444; }
        
        .btn-outline-record { border: 1px solid var(--danger); color: var(--danger); background: transparent; }
        .btn-record-active { background: var(--danger); color: white; animation: rec-blink 1s infinite; }
        @keyframes rec-blink { 50% { opacity: 0.7; } }
      `}} />
      </motion.div>
    </RenderErrorBoundary>
  );
};

export default SessionView;
