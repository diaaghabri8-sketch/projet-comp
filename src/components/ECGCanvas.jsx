import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const ECG_W = 1200;
const ECG_H = 320;
const DRAW_SPEED = 3;        // pixels advanced per frame
const BASELINE = ECG_H / 2;
const GRID_SMALL = 20;       // 1mm small square
const GRID_LARGE = 100;      // 5mm large square

// ─── P-QRS-T Synthesizer ─────────────────────────────────────────────────────
const getECGSample = (phase) => {
  if (phase > 1) return 0;
  // P-wave
  if (phase < 0.12) return Math.sin(phase * Math.PI / 0.12) * 18;
  // PR segment
  if (phase < 0.20) return 0;
  // Q dip
  if (phase < 0.23) return -(phase - 0.20) / 0.03 * 14;
  // R spike — sharp & tall
  if (phase < 0.27) return -14 + (phase - 0.23) / 0.04 * 140;
  // S descent
  if (phase < 0.31) return 126 - (phase - 0.27) / 0.04 * 155;
  // Return to baseline
  if (phase < 0.36) return -29 + (phase - 0.31) / 0.05 * 29;
  // ST segment
  if (phase < 0.44) return 0;
  // T-wave (smooth dome)
  if (phase < 0.65) return Math.sin((phase - 0.44) / 0.21 * Math.PI) * 32;
  // Iso line
  return 0;
};

const ECGCanvas = forwardRef((_, ref) => {
  const canvasRef   = useRef(null);
  const pointsRef   = useRef([]);
  const sweepRef    = useRef(0);
  const phaseRef    = useRef(1.1);   // > 1 ⇒ inactive (flat line)
  const rafRef      = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerPeak() {
      phaseRef.current = 0;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const N = Math.floor(ECG_W / DRAW_SPEED);
    pointsRef.current = new Array(N).fill(0);

    // ── Grid ──────────────────────────────────────────────────────────────────
    const drawGrid = () => {
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, ECG_H);
      bg.addColorStop(0, '#060a0a');
      bg.addColorStop(1, '#03070a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, ECG_W, ECG_H);

      // Fine grid (1 mm)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(0, 230, 120, 0.055)';
      ctx.beginPath();
      for (let x = 0; x < ECG_W; x += GRID_SMALL) { ctx.moveTo(x, 0); ctx.lineTo(x, ECG_H); }
      for (let y = 0; y < ECG_H; y += GRID_SMALL) { ctx.moveTo(0, y); ctx.lineTo(ECG_W, y); }
      ctx.stroke();

      // Bold grid (5 mm)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(0, 230, 120, 0.13)';
      ctx.beginPath();
      for (let x = 0; x < ECG_W; x += GRID_LARGE) { ctx.moveTo(x, 0); ctx.lineTo(x, ECG_H); }
      for (let y = 0; y < ECG_H; y += GRID_LARGE) { ctx.moveTo(0, y); ctx.lineTo(ECG_W, y); }
      ctx.stroke();

      // Baseline guide (faint dashed)
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(0, 230, 120, 0.12)';
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(0, BASELINE); ctx.lineTo(ECG_W, BASELINE);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // ── Logic (advance synth & buffer) ────────────────────────────────────────
    const logicUpdate = () => {
      const sample = getECGSample(phaseRef.current);
      if (phaseRef.current <= 1) phaseRef.current += 0.010; // wave speed
      pointsRef.current[sweepRef.current] = sample;
      sweepRef.current = (sweepRef.current + 1) % N;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const render = () => {
      logicUpdate();
      drawGrid();

      const cur = sweepRef.current;
      const GAP = 30; // dark gap behind sweep head

      // ── Layer 1: wide outer glow (fat, very faint) ────────────────────────
      ctx.lineWidth = 8;
      ctx.lineJoin  = 'round';
      ctx.lineCap   = 'round';
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = 'rgba(0, 255, 130, 0.07)';
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < N; i++) {
        const dist = (N + cur - i) % N;
        if (dist < GAP) { first = true; continue; }
        const x = i * DRAW_SPEED;
        const y = BASELINE - pointsRef.current[i];
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ── Layer 2: medium glow ──────────────────────────────────────────────
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(0, 255, 130, 0.22)';
      ctx.shadowBlur  = 18;
      ctx.shadowColor = '#00ff82';
      ctx.beginPath();
      first = true;
      for (let i = 0; i < N; i++) {
        const dist = (N + cur - i) % N;
        if (dist < GAP) { first = true; continue; }
        const x = i * DRAW_SPEED;
        const y = BASELINE - pointsRef.current[i];
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ── Layer 3: bright core line ──────────────────────────────────────────
      ctx.lineWidth  = 2;
      ctx.strokeStyle = '#6fffb0';
      ctx.shadowBlur  = 6;
      ctx.shadowColor = '#6fffb0';
      ctx.beginPath();
      first = true;
      for (let i = 0; i < N; i++) {
        const dist = (N + cur - i) % N;
        if (dist < GAP) { first = true; continue; }
        const x = i * DRAW_SPEED;
        const y = BASELINE - pointsRef.current[i];
        if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ── Sweep-head beam (vertical glowing bar) ─────────────────────────────
      ctx.shadowBlur = 0;
      const sweepX = cur * DRAW_SPEED;
      const beamGrad = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 4, 0);
      beamGrad.addColorStop(0, 'rgba(110, 255, 176, 0)');
      beamGrad.addColorStop(1, 'rgba(110, 255, 176, 0.22)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(sweepX - 20, 0, 24, ECG_H);

      // Bright leading edge
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(110,255,176, 0.55)';
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, ECG_H);
      ctx.stroke();

      // ── Overlay labels ─────────────────────────────────────────────────────
      ctx.shadowBlur = 0;
      ctx.fillStyle  = 'rgba(0,0,0,0.45)';
      ctx.fillRect(10, 10, 200, 44);

      ctx.fillStyle = '#00e676';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('LEAD II  —  ECG SYNTHÉTISÉ', 18, 28);
      ctx.fillStyle = 'rgba(0,230,120,0.55)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('25 mm/s   ▪   10 mm/mV   ▪   60 Hz LP', 18, 46);

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(0,230,120,0.18)',
      boxShadow: '0 0 40px rgba(0,230,120,0.07), inset 0 0 30px rgba(0,0,0,0.6)',
      background: '#060a0a',
    }}>
      <canvas
        ref={canvasRef}
        width={ECG_W}
        height={ECG_H}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
        borderRadius: '16px',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px',
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)',
      }} />
    </div>
  );
});

export default ECGCanvas;
