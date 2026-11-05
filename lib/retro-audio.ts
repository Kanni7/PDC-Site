/**
 * Tiny retro synth shared by the PDC arcade games.
 * Sounds are generated with Web Audio oscillators, so there are no audio files.
 * The AudioContext is only created from a user gesture (see `unlock`).
 */

export type ToneOptions = {
  type?: OscillatorType
  vol?: number
  /** Frequency to slide to by the end of the note */
  to?: number
  /** Seconds from now */
  delay?: number
}

export function createSynth(initialMuted = false) {
  let ac: AudioContext | null = null
  let muted = initialMuted

  const ctx = () => {
    if (!ac) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ac = new AC()
    }
    if (ac.state === "suspended") void ac.resume()
    return ac
  }

  return {
    tone(freq: number, dur: number, opts: ToneOptions = {}) {
      if (muted) return
      const c = ctx()
      if (!c) return
      const t = c.currentTime + (opts.delay ?? 0)
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = opts.type ?? "square"
      osc.frequency.setValueAtTime(freq, t)
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
      gain.gain.setValueAtTime(opts.vol ?? 0.05, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    },
    /** Call from a click/keypress so browsers allow audio to start */
    unlock() {
      if (!muted) ctx()
    },
    setMuted(m: boolean) {
      muted = m
    },
    dispose() {
      void ac?.close()
      ac = null
    },
  }
}

export type Synth = ReturnType<typeof createSynth>
