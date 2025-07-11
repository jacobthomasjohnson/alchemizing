import confetti from "canvas-confetti";

export default function dynamicConfetti() {
  // ─── CONFIGURABLE RANGES ──────────────────────────────────────────
  const totalDuration = 10; // total ramp time (ms)
  const steps = 220; // how many mini-bursts
  const baseCount = 700; // total particles per direction
  const perStepCount = Math.ceil(baseCount / steps);

  // For each parameter, define [start, end] values:
  const gravityDownRange = [-1, -0]; // start → end for downward burst
  const gravityUpRange = [+1, +0]; // start → end for upward burst
  const velocityRange = [50, 120]; // launch speed (px/frame)
  const spreadRange = [60, 120]; // cone spread (degrees)
  const decayRange = [0.9, 0.6]; // particle decay
  const driftRange = [0, 0.2]; // horizontal drift
  const scalarRange = [0.3, 0.2]; // size multiplier
  const ticksRange = [10, 100]; // lifespan in animation ticks
  const originYDownRange = [1, 2]; // y origin for downward burst
  const originYUpRange = [-0, -1]; // y origin for upward burst
  const colorPalette = ["#FFD9EC", "#D0F0FF"];
  const shapePalette = ["circle", "triangle", "square"];

  // ─── HELPERS ──────────────────────────────────────────────────────
  const lerp = ([a, b], t) => a + (b - a) * t;

  // ─── SCHEDULE BURSTS ──────────────────────────────────────────────
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // normalized 0→1
    const delay = Math.round(t * totalDuration); // when to fire

    // interpolate each parameter
    const gravityDown = lerp(gravityDownRange, t);
    const gravityUp = lerp(gravityUpRange, t);
    const startVel = lerp(velocityRange, t);
    const spread = lerp(spreadRange, t);
    const decay = lerp(decayRange, t);
    const drift = lerp(driftRange, t);
    const scalar = lerp(scalarRange, t);
    const ticks = Math.round(lerp(ticksRange, t));
    const originYDown = lerp(originYDownRange, t);
    const originYUp = lerp(originYUpRange, t);

    setTimeout(() => {
      // downward (from below)
      confetti({
        particleCount: perStepCount,
        angle: 90,
        spread,
        startVelocity: startVel,
        gravity: gravityDown,
        decay,
        drift,
        scalar,
        ticks,
        origin: { x: 0.5, y: originYDown },
        colors: colorPalette,
        shapes: shapePalette,
      });

      // upward (from above)
      confetti({
        particleCount: perStepCount,
        angle: 270,
        spread,
        startVelocity: startVel,
        gravity: gravityUp,
        decay,
        drift: -drift, // you can invert drift if you like
        scalar,
        ticks,
        origin: { x: 0.5, y: originYUp },
        colors: colorPalette,
        shapes: shapePalette,
      });
    }, delay);
  }
}
