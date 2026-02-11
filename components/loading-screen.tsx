"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct * 100);
      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        setFadeOut(true);
        setTimeout(onDone, 400);
      }
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-400 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Orbiting dots container */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Pock-it! logo"
            className="animate-fade-up"
            style={{ width: 140, height: "auto" }}
          />
        </div>
        {/* Orbiting dots - 2 clockwise, 2 counter-clockwise */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-cw" style={{ position: "absolute" }}>
            <div className="h-3 w-3 rounded-full" style={{ background: "#f5a623" }} />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-ccw" style={{ position: "absolute" }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#4a9eff" }} />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-cw-2" style={{ position: "absolute" }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff6b6b" }} />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-orbit-ccw-2" style={{ position: "absolute" }}>
            <div className="h-2 w-2 rounded-full" style={{ background: "#51cf66" }} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-48">
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f5a623, #ff8c42)" }}
          />
        </div>
        <p className="mt-2 text-center font-mono text-[10px]" style={{ color: "rgba(0,0,0,0.3)" }}>
          {progress < 40 ? "Loading your Things..." : progress < 80 ? "Preparing workspace..." : "Almost ready..."}
        </p>
      </div>
    </div>
  );
}
