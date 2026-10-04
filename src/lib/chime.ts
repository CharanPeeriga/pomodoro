/** Soft marimba-like chime synthesized with Web Audio, so no sound assets are needed. */

let context: AudioContext | null = null;

function note(ctx: AudioContext, frequency: number, start: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.22, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
  gain.connect(ctx.destination);

  // Fundamental plus a quiet overtone for a mallet-ish timbre.
  for (const [multiple, level] of [
    [1, 1],
    [4, 0.12],
  ]) {
    const osc = ctx.createOscillator();
    const partial = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency * multiple;
    partial.gain.value = level;
    osc.connect(partial).connect(gain);
    osc.start(start);
    osc.stop(start + 1.2);
  }
}

/** Descending notes when work ends (wind down), ascending when a break ends (back to it). */
export function playChime(direction: "down" | "up") {
  context ??= new AudioContext();
  const ctx = context;
  void ctx.resume();
  const notes = direction === "down" ? [880, 659.25, 523.25] : [523.25, 659.25, 880];
  notes.forEach((f, i) => note(ctx, f, ctx.currentTime + i * 0.16));
}
