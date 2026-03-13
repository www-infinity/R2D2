/* ── R2D2 Signal Engine — WebAudio ──────────────────────────────────────────── */

const SignalEngine = (function () {
  let audioCtx    = null;
  let activeOscs  = [];
  let ringTimer   = null;

  /* ── AudioContext (lazy, resumes on user gesture) ──────────────────────── */
  function ctx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  /* ── Low-level tone ────────────────────────────────────────────────────── */
  function tone(freq, duration, gain, offset) {
    const ac       = ctx();
    const start    = ac.currentTime + (offset || 0);
    const osc      = ac.createOscillator();
    const gainNode = ac.createGain();

    osc.type          = "sine";
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(gain || 0.08, start);
    gainNode.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration + 0.01);
    activeOscs.push(osc);
  }

  /* ── Stop everything ───────────────────────────────────────────────────── */
  function stopAll() {
    clearInterval(ringTimer);
    ringTimer = null;
    activeOscs.forEach(function (o) { try { o.stop(); } catch (e) {} });
    activeOscs = [];
  }

  /* ── Play your own number as a melody ──────────────────────────────────── */
  function playPhoneNumber(pn) {
    stopAll();
    const cfg     = buildSignalConfig(pn);
    const pulseOn = cfg.pulseOnMs / 1000;
    const gap     = cfg.pulseOffMs / 2000;
    let t = 0;
    pn.blocks.forEach(function (block) {
      const freq = BLOCK_FREQ[block] || 440;
      tone(freq, pulseOn, cfg.gain, t);
      t += pulseOn + gap;
    });
  }

  /* ── Call phases ────────────────────────────────────────────────────────── */
  function playRing(pn, onPhase) {
    stopAll();
    onPhase && onPhase("scanning");

    /* scanning: rising sweep */
    let step = 0;
    const sweep = setInterval(function () {
      tone(150 + step * 90, 0.12, 0.06);
      step++;
      if (step >= 7) {
        clearInterval(sweep);
        onPhase && onPhase("ringing");

        /* ring: dual-tone every 2 s */
        const fA = pn ? (BLOCK_FREQ[pn.blocks[0]] || 480) : 480;
        const fB = pn ? (BLOCK_FREQ[pn.blocks[1]] || 620) : 620;
        tone(fA, 0.4, 0.08);
        tone(fB, 0.4, 0.06);
        ringTimer = setInterval(function () {
          tone(fA, 0.4, 0.08);
          tone(fB, 0.4, 0.06);
        }, 2000);
      }
    }, 180);
  }

  function playConnect() {
    stopAll();
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 0.1, i * 0.13); });
  }

  function playHangup() {
    stopAll();
    [440, 390, 330, 280].forEach(function (f, i) { tone(f, 0.1, 0.07, i * 0.09); });
  }

  /* ── UI feedback sounds ─────────────────────────────────────────────────── */
  function playScan() {
    for (let i = 0; i < 8; i++) {
      tone(100 + i * 140 + Math.random() * 40, 0.07, 0.05, i * 0.11);
    }
  }

  function playEarn() {
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.09, 0.07, i * 0.07); });
  }

  function playLevelUp() {
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach(function (f, i) { tone(f, 0.14, 0.09, i * 0.09); });
  }

  function playTrending() {
    /* rising arpeggio + shimmer */
    [440, 550, 660, 880, 1100].forEach(function (f, i) { tone(f, 0.1, 0.07, i * 0.08); });
    setTimeout(function () {
      [1100, 880, 660, 550, 440].forEach(function (f, i) { tone(f, 0.08, 0.05, i * 0.07); });
    }, 600);
  }

  return { playPhoneNumber, playRing, playConnect, playHangup, playScan, playEarn, playLevelUp, playTrending, stopAll };
}());
