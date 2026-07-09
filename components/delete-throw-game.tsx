"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, X } from "lucide-react";

interface Rect { left: number; top: number; width: number; height: number; }

interface DeleteThrowGameProps {
  noteRect: Rect;
  bg: string;
  title: string;
  onComplete: () => void; // landed in the bin -> delete
  onCancel: () => void;   // backed out
}

type Phase = "crumple" | "aim" | "flying" | "success" | "miss";

/* ----- tiny WebAudio sound helper (no assets) ----- */
function useSfx() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ctx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  };
  const tone = (freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.15) => {
    const ac = ctx(); if (!ac) return;
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime + start);
    g.gain.setValueAtTime(0, ac.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(ac.currentTime + start); o.stop(ac.currentTime + start + dur + 0.02);
  };
  return {
    resume: () => { const ac = ctx(); if (ac && ac.state === "suspended") ac.resume(); },
    whoosh: () => { const ac = ctx(); if (!ac) return; const o = ac.createOscillator(); const g = ac.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(620, ac.currentTime); o.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.25); g.gain.setValueAtTime(0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.28); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.3); },
    success: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.25, "triangle", 0.18)); },
    miss: () => { tone(160, 0, 0.3, "square", 0.12); tone(120, 0.08, 0.3, "square", 0.1); },
  };
}

const CONFETTI_COLORS = ["#f5b301", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7"];

export default function DeleteThrowGame({ noteRect, bg, title, onComplete, onCancel }: DeleteThrowGameProps) {
  const sfx = useSfx();
  const [phase, setPhase] = useState<Phase>("crumple");
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; dx: number; dy: number; rot: number; color: string }[]>([]);
  const phaseRef = useRef<Phase>("crumple");
  phaseRef.current = phase;

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const R = 30; // ball radius
  // randomized bin so a pure vertical flick won't always work — you must aim
  const geo = useRef({
    binCx: vw * (Math.random() < 0.5 ? 0.28 : 0.72),
    rimY: vh * 0.17,
    halfOpening: 40,
    binW: 86,
    binH: 104,
    startX: vw * 0.5,
    startY: vh - 150,
  });

  /* Escape = "Keep it" (back out of the game) */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const ballRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: geo.current.startX, y: geo.current.startY });
  const vel = useRef({ x: 0, y: 0 });
  const rot = useRef(0);
  const dragging = useRef(false);
  const grabOffset = useRef({ x: 0, y: 0 });
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const rafId = useRef<number | null>(null);

  const render = useCallback(() => {
    const el = ballRef.current;
    if (el) el.style.transform = `translate(${pos.current.x - R}px, ${pos.current.y - R}px) rotate(${rot.current}deg)`;
  }, []);

  /* crumple -> drop into ready position -> aim */
  useEffect(() => {
    const t1 = setTimeout(() => {
      // settle ball at start position
      pos.current = { x: geo.current.startX, y: geo.current.startY };
      render();
      setPhase("aim");
    }, 720);
    return () => clearTimeout(t1);
  }, [render]);

  const reset = useCallback((to: Phase) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    vel.current = { x: 0, y: 0 };
    rot.current = 0;
    pos.current = { x: geo.current.startX, y: geo.current.startY };
    render();
    setPhase(to);
  }, [render]);

  const launch = useCallback(() => {
    setPhase("flying");
    sfx.whoosh();
    const g = geo.current;
    const gravity = 2200; // px/s^2
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      vel.current.y += gravity * dt;
      vel.current.x *= 0.999;
      const prevY = pos.current.y;
      pos.current.x += vel.current.x * dt;
      pos.current.y += vel.current.y * dt;
      rot.current += vel.current.x * dt * 0.6;
      render();

      // success: descending through the rim, within the opening
      const inX = Math.abs(pos.current.x - g.binCx) <= g.halfOpening;
      if (vel.current.y > 0 && prevY < g.rimY && pos.current.y >= g.rimY && inX) {
        // sink into the bin
        pos.current.x = g.binCx;
        pos.current.y = g.rimY + g.binH * 0.5;
        render();
        sfx.success();
        burstConfetti(g.binCx, g.rimY);
        setPhase("success");
        setTimeout(onComplete, 1100);
        return;
      }
      // miss conditions
      if (pos.current.y > vh + 120 || pos.current.x < -120 || pos.current.x > vw + 120 || pos.current.y < -260) {
        sfx.miss();
        setPhase("miss");
        setTimeout(() => reset("aim"), 750);
        return;
      }
      rafId.current = requestAnimationFrame(step);
    };
    rafId.current = requestAnimationFrame(step);
  }, [render, onComplete, reset, sfx, vh, vw]);

  const burstConfetti = (cx: number, cy: number) => {
    const pieces = Array.from({ length: 36 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 36 + Math.random();
      const speed = 60 + Math.random() * 140;
      return {
        id: i, x: cx, y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 80,
        rot: Math.random() * 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      };
    });
    setConfetti(pieces);
  };

  /* ----- drag handlers ----- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (phaseRef.current !== "aim") return;
    sfx.resume();
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    grabOffset.current = { x: e.clientX - pos.current.x, y: e.clientY - pos.current.y };
    samples.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    pos.current = { x: e.clientX - grabOffset.current.x, y: e.clientY - grabOffset.current.y };
    rot.current += 2;
    render();
    samples.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (samples.current.length > 6) samples.current.shift();
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const s = samples.current;
    if (s.length < 2) { reset("aim"); return; }
    const first = s[0];
    const lastS = s[s.length - 1];
    const dt = (lastS.t - first.t) / 1000 || 0.016;
    // velocity in px/s from the flick, with a launch multiplier
    vel.current = {
      x: ((lastS.x - first.x) / dt) * 1.0,
      y: ((lastS.y - first.y) / dt) * 1.0,
    };
    const speed = Math.hypot(vel.current.x, vel.current.y);
    // too weak a flick -> just drops back
    if (speed < 250 || vel.current.y > -150) {
      sfx.miss();
      setPhase("miss");
      setTimeout(() => reset("aim"), 650);
      return;
    }
    launch();
  };

  useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current); }, []);
  useEffect(() => { render(); }, [render]);

  const g = geo.current;
  const showCrumple = phase === "crumple";

  return (
    <div className="fixed inset-0 z-50" style={{ background: "rgba(8,10,16,0.72)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
      {/* back out */}
      <button onClick={onCancel} aria-label="Keep entry"
        className="absolute left-4 top-4 z-50 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}>
        <X className="h-3.5 w-3.5" /> Keep it
      </button>

      {/* TRASH CAN (far away target) */}
      <div className="absolute" style={{ left: g.binCx - g.binW / 2, top: g.rimY, width: g.binW, height: g.binH }}>
        {/* opening ellipse */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -6, width: g.binW, height: 16, borderRadius: "50%", background: "#0f1117", border: "2px solid #4b5563" }} />
        {/* body */}
        <div className="absolute left-1/2 -translate-x-1/2 overflow-hidden" style={{ top: 2, width: g.binW - 8, height: g.binH, borderRadius: "6px 6px 12px 12px", background: "linear-gradient(180deg,#374151,#1f2937)", border: "2px solid #4b5563", borderTop: "none" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="absolute top-2 bottom-2" style={{ left: `${18 + i * 20}%`, width: 2, background: "rgba(255,255,255,0.06)" }} />
          ))}
          <Trash2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 26, height: 26, color: "rgba(255,255,255,0.25)" }} />
        </div>
        {phase === "success" && (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 animate-pop-in text-[10px] font-black uppercase tracking-widest" style={{ color: "#86efac" }}>Gone!</div>
        )}
      </div>

      {/* AIM GUIDE: animated dashed arc from ball to bin */}
      {phase === "aim" && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 5 }}>
            <defs>
              <marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.8)" />
              </marker>
            </defs>
            <path
              d={`M ${g.startX} ${g.startY - R} Q ${(g.startX + g.binCx) / 2} ${g.startY - 220} ${g.binCx} ${g.rimY + 18}`}
              fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="3" strokeDasharray="3 10" strokeLinecap="round"
              markerEnd="url(#ah)" className="throw-arc"
            />
          </svg>
          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-sm font-bold" style={{ bottom: 70, color: "rgba(255,255,255,0.92)" }}>
            Flick the paper into the bin
            <span className="mt-1 block text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Aim and match the force</span>
          </p>
        </>
      )}

      {phase === "miss" && (
        <p className="absolute left-1/2 -translate-x-1/2 animate-pop-in text-sm font-black uppercase tracking-widest" style={{ top: g.rimY + g.binH + 30, color: "#fca5a5" }}>Missed! Try again</p>
      )}

      {/* CRUMPLE: note morphs into a paper ball at its original position */}
      {showCrumple && (
        <div
          className="paper-crumple absolute"
          style={{
            left: noteRect.left, top: noteRect.top, width: noteRect.width, height: noteRect.height,
            background: bg, borderRadius: 4, border: "1px solid rgba(0,0,0,0.1)",
            ["--ball-x" as any]: `${geo.current.startX - noteRect.left - R}px`,
            ["--ball-y" as any]: `${geo.current.startY - noteRect.top - R}px`,
            ["--ball-d" as any]: `${R * 2}px`,
          }}
        >
          <span className="absolute left-3 top-3 text-[10px] font-bold opacity-30">{title}</span>
        </div>
      )}

      {/* THE PAPER BALL (draggable / flying) */}
      {!showCrumple && (
        <div
          ref={ballRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute touch-none"
          style={{
            width: R * 2, height: R * 2, left: 0, top: 0,
            cursor: phase === "aim" ? "grab" : "default",
            zIndex: 20,
            transform: `translate(${pos.current.x - R}px, ${pos.current.y - R}px)`,
            willChange: "transform",
          }}
        >
          <PaperBall color={bg} size={R * 2} />
        </div>
      )}

      {/* CONFETTI */}
      {confetti.map((c) => (
        <span key={c.id} className="confetti-piece absolute" style={{
          left: c.x, top: c.y, background: c.color,
          ["--cx" as any]: `${c.dx}px`, ["--cy" as any]: `${c.dy}px`, ["--cr" as any]: `${c.rot}deg`,
        }} />
      ))}
    </div>
  );
}

/* crumpled paper ball with shading from the note's color */
function PaperBall({ color, size }: { color: string; size: number }) {
  return (
    <div
      className="relative h-full w-full"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 45%, rgba(0,0,0,0.18) 100%)`,
        boxShadow: "inset -4px -5px 8px rgba(0,0,0,0.28), inset 3px 3px 6px rgba(255,255,255,0.5), 0 4px 10px rgba(0,0,0,0.4)",
      }}
    >
      {/* crumple creases */}
      <svg viewBox="0 0 60 60" className="absolute inset-0 h-full w-full" style={{ opacity: 0.35 }}>
        <path d="M14 20 L28 26 L20 34 L32 40 L24 48" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        <path d="M40 16 L34 28 L44 32 L36 42" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        <path d="M22 14 L30 22 L42 22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>
    </div>
  );
}
