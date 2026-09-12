// Dual-engine luxury cafe bell chime with mobile auto-unlock, WakeLock, and vibration
class AudioNotifier {
  constructor() {
    this.audioCtx = null;
    this.audioElement = null;
    this.isMuted = false;
    this.isUnlocked = false;
    this.wakeLock = null;
    this.repeatInterval = null;
    this.isRepeating = false;
    this.isTemporarilySilenced = false;
    this.listeners = new Set();

    if (typeof window !== "undefined") {
      this.setupAutoUnlock();
      this.setupVisibilityHandler();
    }
  }

  // Auto-resume AudioContext and trigger chime when returning from background or unlocking phone
  setupVisibilityHandler() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const handleResume = () => {
      this.initContext();
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      // If alarm is currently repeating, chime immediately upon returning to foreground
      if (this.isRepeating && !this.isMuted && !this.isTemporarilySilenced) {
        this.playChime();
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleResume();
      }
    });

    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
  }

  // Pre-load HTML5 audio element for instant hardware-accelerated playback
  getAudioElement() {
    if (!this.audioElement && typeof window !== "undefined") {
      try {
        this.audioElement = new Audio("/audio/ting.mp3");
        this.audioElement.preload = "auto";
      } catch (e) {
        console.warn("HTML5 audio initialization fallback:", e);
      }
    }
    return this.audioElement;
  }

  // Auto-unlock AudioContext on first user interaction (touch, click, keydown)
  setupAutoUnlock() {
    const unlock = () => {
      this.initContext();
      const el = this.getAudioElement();
      if (el) {
        // Silent play to unlock iOS Safari & Android Chrome audio policy
        el.volume = 0;
        el.play().then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = 1;
          this.isUnlocked = true;
        }).catch(() => {});
      }
      this.isUnlocked = true;
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("click", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
  }

  initContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  // Play the signature Two Hearts Cafe reception desk "Ting!" chime
  playChime() {
    if (this.isMuted || this.isTemporarilySilenced) return;

    const nowTime = Date.now();
    if (this.lastChimePlayedAt && nowTime - this.lastChimePlayedAt < 350) {
      return;
    }
    this.lastChimePlayedAt = nowTime;

    // 1. Trigger strong phone vibration pattern
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([300, 100, 300, 100, 500]);
      } catch (e) {
        // Ignore vibration errors
      }
    }

    // 2. Play HTML5 Audio Element (/audio/ting.mp3)
    let playedHtml5 = false;
    const el = this.getAudioElement();
    if (el) {
      try {
        el.currentTime = 0;
        el.volume = 1;
        const promise = el.play();
        if (promise !== undefined) {
          promise.then(() => {
            playedHtml5 = true;
          }).catch((err) => {
            console.warn("HTML5 audio play prevented by policy, using synthesizer:", err);
            this.playSynthesizedBell();
          });
        }
      } catch (err) {
        console.warn("HTML5 audio playback failed, falling back to Web Audio:", err);
      }
    }

    // 3. Simultaneously trigger Web Audio API synthesized bell for maximum richness and guarantee
    this.playSynthesizedBell();
  }

  // Web Audio API Synthesized High-Resolution Bell Chime (E6 1318Hz + B6 1975Hz + harmonic strike)
  playSynthesizedBell() {
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Strike tap Note 1: High E6 (1318.5 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.6);

      // Strike tap Note 2: Harmonic B6 (1975.5 Hz) slightly delayed for rich resonance
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1975.5, now + 0.02);
      gain2.gain.setValueAtTime(0.25, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 1.8);

      // High metallic ping: E7 (2637 Hz)
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(2637.0, now);
      gain3.gain.setValueAtTime(0.18, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(this.audioCtx.destination);
      osc3.start(now);
      osc3.stop(now + 0.7);
    } catch (err) {
      console.warn("Web Audio chime could not be played:", err);
    }
  }

  // Play bright, celebratory payment success chime (G5 784Hz -> C6 1046Hz -> E6 1318Hz)
  playPaymentSuccessChime() {
    if (this.isMuted) return;

    // Trigger double vibration for mobile counter devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 250]);
      } catch (e) {}
    }

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [
        { freq: 784, time: 0, dur: 0.22 },       // G5
        { freq: 1046.5, time: 0.12, dur: 0.32 }, // C6
        { freq: 1318.5, time: 0.24, dur: 0.9 }   // E6 (ringing metallic tone)
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);
        gain.gain.setValueAtTime(0.3, now + time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (err) {
      console.warn("Payment chime could not be played:", err);
    }
  }

  // Request Screen Wake Lock so cafe counter tablet never turns off
  async requestWakeLock() {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request("screen");
          this.wakeLock.addEventListener("release", () => {
            this.wakeLock = null;
          });
          return true;
        }
      } catch (err) {
        console.warn("Screen Wake Lock could not be obtained:", err.message);
      }
    }
    return false;
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  // Continuous repeating chime until order is accepted/rejected
  startRepeatingChime(intervalMs = 3000) {
    if (this.repeatInterval) return; // already chiming
    this.isTemporarilySilenced = false;
    this.isRepeating = true;
    this.notifyListeners();

    // Play immediately first time
    this.playChime();

    this.repeatInterval = setInterval(() => {
      this.playChime();
    }, intervalMs);
  }

  // Stop the repeating chime when all placed orders are accepted or rejected
  stopRepeatingChime() {
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
    this.isRepeating = false;
    this.isTemporarilySilenced = false;
    this.notifyListeners();
  }

  // Temporarily snooze/silence the active ringing
  silenceAlarm() {
    this.isTemporarilySilenced = true;
    this.notifyListeners();
  }

  // Un-silence the alarm
  resumeAlarm() {
    this.isTemporarilySilenced = false;
    this.notifyListeners();
    if (this.isRepeating) {
      this.playChime();
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      isRepeating: this.isRepeating,
      isMuted: this.isMuted,
      isSilenced: this.isTemporarilySilenced
    });
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn({
          isRepeating: this.isRepeating,
          isMuted: this.isMuted,
          isSilenced: this.isTemporarilySilenced
        });
      } catch (e) {
        console.warn("AudioNotifier listener error:", e);
      }
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.notifyListeners();
    return this.isMuted;
  }
}

export const soundNotifier = new AudioNotifier();

