/* ── R2D2 Main Controller — Bot · Signal Processor · Directory · Calls ───────── */

/* ── R2D2 Canvas Bot ─────────────────────────────────────────────────────────── */
const R2D2Bot = (function () {
  let canvas, ctx, t = 0, scanning = false;

  function init(el) {
    canvas = el;
    ctx    = el.getContext("2d");
    _loop();
  }

  function setScanning(v) {
    scanning = v;
    const s = document.getElementById("bot-status");
    if (s) s.textContent = v ? "● SCANNING" : "● IDLE";
  }

  /* ── rounded-rect path helper ──────────────────────────────────────────── */
  function _rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function _draw() {
    const W = canvas.width, H = canvas.height, cx = W / 2;
    ctx.clearRect(0, 0, W, H);
    t += 0.022;
    const bob   = Math.sin(t) * 3;
    const blink = Math.sin(t * 1.8) > 0.93;

    /* ground shadow */
    ctx.fillStyle = "rgba(0,180,255,.07)";
    ctx.beginPath(); ctx.ellipse(cx, H - 8, 48, 10, 0, 0, Math.PI * 2); ctx.fill();

    /* legs */
    const legG = ctx.createLinearGradient(0, 170, 0, 215);
    legG.addColorStop(0, "#b8d0ec"); legG.addColorStop(1, "#6888a8");
    ctx.fillStyle = legG;
    _rr(cx - 31, 170 + bob, 20, 44, 4); ctx.fill();
    _rr(cx + 11, 170 + bob, 20, 44, 4); ctx.fill();

    /* centre leg */
    ctx.fillStyle = "#8898b0";
    _rr(cx - 8, 186 + bob, 16, 28, 3); ctx.fill();

    /* feet */
    ctx.fillStyle = "#6888a8";
    _rr(cx - 37, 209 + bob, 30, 10, 3); ctx.fill();
    _rr(cx +  7, 209 + bob, 30, 10, 3); ctx.fill();

    /* body */
    const bdG = ctx.createLinearGradient(cx - 42, 88, cx + 42, 178);
    bdG.addColorStop(0, "#ddeeff"); bdG.addColorStop(1, "#99bbdd");
    ctx.fillStyle = bdG;
    _rr(cx - 42, 90 + bob, 84, 84, 10); ctx.fill();

    /* body top blue band */
    ctx.fillStyle = "rgba(0,80,200,.22)";
    _rr(cx - 40, 92 + bob, 80, 18, 4); ctx.fill();

    /* chest panel outline */
    ctx.strokeStyle = "#00b4ff"; ctx.lineWidth = 1.5;
    _rr(cx - 24, 117 + bob, 48, 32, 5); ctx.stroke();

    /* chest indicator lights */
    const lights = [
      [cx - 14, 125 + bob, 4, "#00b4ff"],
      [cx,      125 + bob, 4, scanning ? "#ffdd00" : "#00ff9d"],
      [cx + 14, 125 + bob, 4, "#ff4455"],
      [cx -  6, 138 + bob, 3, "#9b5de5"],
      [cx +  6, 138 + bob, 3, "#00b4ff"],
    ];
    lights.forEach(function (l) {
      ctx.fillStyle = l[3]; ctx.shadowColor = l[3]; ctx.shadowBlur = 9;
      ctx.beginPath(); ctx.arc(l[0], l[1], l[2], 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    /* arms */
    ctx.fillStyle = "#99bbdd";
    ctx.fillRect(cx - 54, 98 + bob, 13, 38);
    ctx.fillRect(cx + 41, 98 + bob, 13, 38);
    ctx.fillStyle = "#6888a8";
    ctx.beginPath(); ctx.arc(cx - 48, 136 + bob, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 48, 136 + bob, 7, 0, Math.PI * 2); ctx.fill();

    /* dome */
    const dmG = ctx.createRadialGradient(cx - 10, 50 + bob, 5, cx, 65 + bob, 52);
    dmG.addColorStop(0, "#ffffff"); dmG.addColorStop(1, "#c0d8f0");
    ctx.fillStyle = dmG;
    ctx.beginPath();
    ctx.ellipse(cx, 83 + bob, 46, 52, 0, Math.PI, 0, true);
    ctx.closePath(); ctx.fill();

    /* dome blue stripe */
    ctx.fillStyle = "rgba(0,70,180,.18)";
    ctx.beginPath(); ctx.ellipse(cx, 83 + bob, 46, 52, 0, Math.PI * 1.56, Math.PI * 1.76, false);
    ctx.ellipse(cx, 83 + bob, 38, 44, 0, Math.PI * 1.76, Math.PI * 1.56, true);
    ctx.closePath(); ctx.fill();

    /* eye ring */
    ctx.strokeStyle = "#00b4ff"; ctx.lineWidth = 3;
    ctx.shadowColor = "#00b4ff"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(cx, 62 + bob, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;

    /* eye iris */
    const eyG = ctx.createRadialGradient(cx - 3, 59 + bob, 2, cx, 62 + bob, 14);
    eyG.addColorStop(0, "#60d8ff"); eyG.addColorStop(1, "#004eaa");
    ctx.fillStyle = eyG;
    ctx.beginPath(); ctx.arc(cx, 62 + bob, 14, 0, Math.PI * 2); ctx.fill();

    /* pupil */
    ctx.fillStyle = "#000820";
    ctx.beginPath(); ctx.arc(cx, 62 + bob, 5, 0, Math.PI * 2); ctx.fill();

    /* blink */
    if (blink) {
      ctx.fillStyle = "#c0d8f0";
      ctx.fillRect(cx - 17, 57 + bob, 34, 10);
    }

    /* side sensors */
    [[cx - 29, 73, "#ff4455"], [cx + 29, 73, "#00ff9d"]].forEach(function (s) {
      ctx.fillStyle = s[2]; ctx.shadowColor = s[2]; ctx.shadowBlur = 11;
      ctx.beginPath(); ctx.arc(s[0], s[1] + bob, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    /* signal rings */
    if (scanning) {
      for (let i = 1; i <= 4; i++) {
        const r  = 58 + i * 28 + Math.sin(t * 4 + i) * 5;
        const al = Math.max(0, .7 - i * .15 + Math.sin(t * 4 + i) * .08);
        ctx.strokeStyle = "rgba(0,180,255," + al + ")";
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.arc(cx, 122 + bob, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function _loop() { _draw(); requestAnimationFrame(_loop); }

  return { init, setScanning };
}());

/* ── Waveform Canvas ─────────────────────────────────────────────────────────── */
const Waveform = (function () {
  let canvas, ctx, t = 0, mode = "idle", bands = [];

  function init(el)          { canvas = el; ctx = el.getContext("2d"); _loop(); }
  function setMode(m, data)  { mode = m; bands = data || []; }

  function _draw() {
    const W = canvas.width, H = canvas.height, mid = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#071428"; ctx.fillRect(0, 0, W, H);
    t += 0.05;

    /* grid */
    ctx.strokeStyle = "rgba(26,58,92,.35)"; ctx.lineWidth = .5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(W,mid); ctx.stroke();

    if (mode === "idle") {
      ctx.strokeStyle = "rgba(0,180,255,.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = mid + Math.sin(x * .05 + t) * 2 + (Math.random() - .5) * .6;
        x ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.stroke();

    } else if (mode === "scanning" || mode === "processing") {
      ctx.strokeStyle = "#00b4ff"; ctx.lineWidth = 2;
      ctx.shadowColor = "#00b4ff"; ctx.shadowBlur = 6;
      const freqs = bands.length ? bands : [1,3,7,13];
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        let y = mid;
        freqs.forEach(function (f, i) { y += Math.sin(x * .02 * f + t * (1 + i*.3)) * (18 / (i+1)); });
        x ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;

    } else if (mode === "ringing") {
      ctx.strokeStyle = "#ffdd00"; ctx.lineWidth = 2;
      const amp = 26 + Math.sin(t * 8) * 10;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = mid + Math.sin(x * .09 + t * 6) * amp;
        x ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.stroke();

    } else if (mode === "connected") {
      ctx.strokeStyle = "#00ff9d"; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = mid + Math.sin(x*.07+t*4)*18 + Math.sin(x*.13+t*7)*7 + (Math.random()-.5)*3;
        x ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.stroke();

    } else if (mode === "signal") {
      const b = bands.length ? bands : [.5,.7,.3,.9,.4,.8,.2,.6,.6,.4];
      const bw = W / b.length;
      b.forEach(function (v, i) {
        const bh = v * (H - 12);
        ctx.fillStyle = "rgba(0,180,255," + (.25 + v * .55) + ")";
        ctx.fillRect(i * bw + 2, H - bh - 4, bw - 4, bh);
        ctx.fillStyle = "rgba(0,255,157," + (v * .3) + ")";
        ctx.fillRect(i * bw + 2, H - bh - 4, bw - 4, 4);
      });
    }
  }

  function _loop() { _draw(); requestAnimationFrame(_loop); }
  return { init, setMode };
}());

/* ── Signal Processor ────────────────────────────────────────────────────────── */
const SignalProcessor = (function () {
  const ASTRO = {
    star: {
      name:"Stellar Electromagnetic",
      desc:"Electromagnetic radiation from nuclear fusion. Blackbody peak in visible/UV spectrum.",
      bands:["Radio","Microwave","Infrared","Visible","UV","X-ray","Gamma"],
      profile:[.18,.30,.68,1.0,.82,.38,.10],
    },
    pulsar: {
      name:"Pulsar Radio Signal",
      desc:"Highly regular pulses from rotating neutron star. Period: ms to seconds. Very low dispersion.",
      bands:["VLF","LF","MF","HF","VHF","UHF","SHF"],
      profile:[.92,.70,.50,.28,.16,.08,.04],
    },
    planet: {
      name:"Planetary Core Seismic",
      desc:"P-waves and S-waves through planetary interior. Low-frequency dominated.",
      bands:["0.001 Hz","0.01 Hz","0.1 Hz","1 Hz","10 Hz","100 Hz","1 kHz"],
      profile:[.80,.92,1.0,.70,.38,.18,.06],
    },
    nebula: {
      name:"Nebula Spectral Emission",
      desc:"Ionised gas emission lines. Hα dominant, OIII and NII strong secondary lines.",
      bands:["Hα 656nm","Hβ 486nm","OIII 501nm","NII 658nm","SII 672nm","HeII 468nm","Hγ 434nm"],
      profile:[1.0,.58,.74,.45,.30,.22,.18],
    },
  };

  /* language heuristics by character set */
  function _detectLang(text) {
    if (/[\u4E00-\u9FFF]/.test(text)) return "Chinese (CJK)";
    if (/[\u3040-\u30FF]/.test(text)) return "Japanese (Kana)";
    if (/[\uAC00-\uD7AF]/.test(text)) return "Korean (Hangul)";
    if (/[\u0600-\u06FF]/.test(text)) return "Arabic";
    if (/[\u0900-\u097F]/.test(text)) return "Hindi (Devanagari)";
    if (/[\u0400-\u04FF]/.test(text)) return "Cyrillic";
    if (/[\u0370-\u03FF]/.test(text)) return "Greek";
    if (/[\u0080-\u00FF]/.test(text)) return "Latin Extended";
    return "Latin / ASCII";
  }

  function _textProfile(text) {
    const freq = {};
    for (let i = 0; i < text.length; i++) {
      const c = text[i].toLowerCase();
      freq[c] = (freq[c] || 0) + 1;
    }
    const total = text.length || 1;
    const top = Object.entries(freq)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 8);
    return { freq, top, total };
  }

  function processText(text) {
    if (!text.trim()) return null;
    const lang    = _detectLang(text);
    const prof    = _textProfile(text);
    const words   = text.trim().split(/\s+/).length;
    const entropy = _entropy(text);
    const bands   = prof.top.map(function (e) { return Math.min(1, e[1] / (prof.total * 0.15)); });

    return {
      lang,
      chars:    text.length,
      words,
      entropy:  entropy.toFixed(3),
      topChars: prof.top.slice(0, 5).map(function (e) {
        return e[0] === " " ? "[space]" : e[0];
      }),
      bands,
      signal: (entropy * 100).toFixed(1) + " Hz (equiv)",
    };
  }

  function _entropy(text) {
    const freq = {};
    for (let i = 0; i < text.length; i++) {
      const c = text[i]; freq[c] = (freq[c]||0)+1;
    }
    const n = text.length;
    return -Object.values(freq).reduce(function (s, c) {
      const p = c / n; return s + p * Math.log2(p);
    }, 0);
  }

  function processAstro(source, freqHz) {
    const info = ASTRO[source] || ASTRO.star;
    const mod  = freqHz / 440;
    const profile = info.profile.map(function (v) { return Math.min(1, v * (0.7 + mod * 0.3)); });
    return { name:info.name, desc:info.desc, bands:info.bands, profile };
  }

  return { processText, processAstro };
}());

/* ── Call waveform helpers (separate canvas from main signal canvas) ─────────── */
function _setCallWaveMode(cw, m) { if (cw) { cw.mode = m; cw.bands = []; } }

function _drawCallWave(cw) {
  if (!cw) return;
  const c = cw.canvas, ctx = cw.ctx, W = c.width, H = c.height, mid = H / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#071428"; ctx.fillRect(0, 0, W, H);
  cw.t = (cw.t || 0) + 0.06;
  const t = cw.t;
  if (cw.mode === "scanning") {
    ctx.strokeStyle = "#00b4ff"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = mid + Math.sin(x * .04 + t * 3) * 14 + Math.sin(x * .09 + t * 5) * 6;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  } else if (cw.mode === "ringing") {
    ctx.strokeStyle = "#ffdd00"; ctx.lineWidth = 1.5;
    const amp = 20 + Math.sin(t * 8) * 8;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = mid + Math.sin(x * .1 + t * 5) * amp;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  } else if (cw.mode === "connected") {
    ctx.strokeStyle = "#00ff9d"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = mid + Math.sin(x * .07 + t * 4) * 14 + Math.sin(x * .14 + t * 7) * 5 + (Math.random() - .5) * 2;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(0,180,255,.3)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = mid + Math.sin(x * .05 + t) * 1.5;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
}

/* ── Call Manager ────────────────────────────────────────────────────────────── */
const CallManager = (function () {
  let active    = false;
  let muted     = false;
  let durSecs   = 0;
  let durTimer  = null;
  let callWave  = null;

  function dial(contact) {
    if (active) return;
    active = true; muted = false; durSecs = 0;

    const overlay = document.getElementById("call-overlay");
    document.getElementById("call-name").textContent   = contact.name;
    document.getElementById("call-number").textContent = contact.phoneNumber.raw;
    document.getElementById("call-duration").classList.add("hidden");
    document.getElementById("call-phase").textContent  = "SCANNING…";
    document.getElementById("mute-btn").textContent    = "🎤 Mute";
    overlay.classList.remove("hidden");

    /* waveform on call canvas — initialise a dedicated Waveform for the call overlay */
    const wc = document.getElementById("call-waveform");
    if (wc && !callWave) {
      callWave = { canvas: wc, ctx: wc.getContext("2d"), t: 0, mode: "idle", bands: [] };
      (function loopCall() {
        _drawCallWave(callWave);
        requestAnimationFrame(loopCall);
      }());
    }
    _setCallWaveMode(callWave, "scanning");

    SignalEngine.playRing(contact.phoneNumber, function (phase) {
      const el = document.getElementById("call-phase");
      if (el) el.textContent = phase.toUpperCase() + "…";
      _setCallWaveMode(callWave, phase);

      if (phase === "ringing") {
        /* auto-connect after 4–8 s */
        setTimeout(function () {
          if (!active) return;
          document.getElementById("call-phase").textContent = "CONNECTED";
          document.getElementById("call-duration").classList.remove("hidden");
          Waveform.setMode("connected");
          _setCallWaveMode(callWave, "connected");
          SignalEngine.playConnect();
          durTimer = setInterval(function () {
            durSecs++;
            const el = document.getElementById("call-duration");
            if (el) el.textContent = formatDuration(durSecs);
          }, 1000);
        }, 4000 + Math.random() * 4000);
      }
    });
  }

  function hangup() {
    active = false;
    clearInterval(durTimer); durTimer = null;
    SignalEngine.playHangup();
    Waveform.setMode("idle");
    _setCallWaveMode(callWave, "idle");
    const overlay = document.getElementById("call-overlay");
    if (overlay) overlay.classList.add("hidden");
  }

  function toggleMute() {
    muted = !muted;
    const btn = document.getElementById("mute-btn");
    if (btn) btn.textContent = muted ? "🔇 Unmute" : "🎤 Mute";
  }

  return { dial, hangup, toggleMute };
}());

/* ── Directory ───────────────────────────────────────────────────────────────── */
const Directory = (function () {
  let contacts = [];
  let filter   = "all";
  let query    = "";

  function init() {
    contacts = generateSeedContacts(12);
    _render();
    document.getElementById("dir-search").addEventListener("input", function (e) {
      query = e.target.value.toLowerCase();
      _render();
    });
    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        filter = btn.dataset.filter;
        _render();
      });
    });
  }

  function _render() {
    const grid = document.getElementById("contacts-grid");
    if (!grid) return;
    const visible = contacts.filter(function (c) {
      if (filter === "online"   && c.status !== "online")   return false;
      if (filter === "favorite" && !c.favorite)              return false;
      if (query && c.name.toLowerCase().indexOf(query) === -1) return false;
      return true;
    });

    grid.innerHTML = visible.map(function (c) {
      const numBlocks = c.phoneNumber.blocks.map(function (b) {
        return '<span>' + b + '</span>';
      }).join("");
      const tags = c.tags.map(function (t) {
        return '<span class="contact-tag">' + t + '</span>';
      }).join("");
      const lastSeen = c.lastSeen ? formatRelative(c.lastSeen) : "";
      return [
        '<div class="contact-card" data-id="' + c.id + '">',
        '  <div class="contact-header">',
        '    <span class="contact-name">' + (c.favorite ? "⭐ " : "") + c.name + '</span>',
        '    <span class="status-dot status-' + c.status + '"></span>',
        '  </div>',
        '  <div class="contact-number">' + numBlocks + '</div>',
        '  <div class="contact-tags">'   + tags       + '</div>',
        '  <div class="contact-footer">',
        '    <span>' + (c.status === "offline" ? lastSeen : c.status) + '</span>',
        '    <button class="call-btn" data-id="' + c.id + '">📞 Call</button>',
        '  </div>',
        '</div>',
      ].join("\n");
    }).join("\n");

    grid.querySelectorAll(".call-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const c = contacts.find(function (x) { return x.id === btn.dataset.id; });
        if (c) CallManager.dial(c);
      });
    });
    grid.querySelectorAll(".contact-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const c = contacts.find(function (x) { return x.id === card.dataset.id; });
        if (c) CallManager.dial(c);
      });
    });
  }

  return { init };
}());

/* ── Level Tab switching ─────────────────────────────────────────────────────── */
function initLevelTabs() {
  document.querySelectorAll(".level-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".level-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".level-page").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      const pageId = "page-" + tab.dataset.level;
      const page   = document.getElementById(pageId);
      if (page) page.classList.add("active");
    });
  });
}

/* ── Signal Processor UI ─────────────────────────────────────────────────────── */
function initProcessor() {
  let currentMode = "text";

  document.querySelectorAll(".mode-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".mode-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      const astroCtrl = document.getElementById("astro-controls");
      const inp       = document.getElementById("signal-input");
      if (currentMode === "text") {
        astroCtrl.classList.add("hidden");
        inp.placeholder = "Paste any text, book excerpt, article…";
      } else {
        astroCtrl.classList.remove("hidden");
        document.getElementById("astro-source").value =
          currentMode === "planet" ? "planet" : "star";
        inp.placeholder = "Optional: paste raw signal data or leave blank for simulated scan…";
      }
    });
  });

  document.getElementById("astro-freq").addEventListener("input", function (e) {
    document.getElementById("astro-freq-val").textContent = e.target.value + " Hz";
  });

  document.getElementById("scan-btn").addEventListener("click", function () {
    const btn    = document.getElementById("scan-btn");
    const report = document.getElementById("signal-report");
    const text   = document.getElementById("signal-input").value;
    btn.disabled = true;
    btn.textContent = "SCANNING…";
    R2D2Bot.setScanning(true);
    Waveform.setMode("scanning");
    try { SignalEngine.playScan(); } catch (e) {}

    setTimeout(function () {
      let html = "";
      if (currentMode === "text") {
        const res = SignalProcessor.processText(text || "R2D2 signal processor — no input provided.");
        if (res) {
          const barMax = 120;
          html = [
            "<div><span class='report-key'>LANGUAGE   </span> <span class='report-val'>" + res.lang + "</span></div>",
            "<div><span class='report-key'>CHARS      </span> <span class='report-val'>" + res.chars + "</span></div>",
            "<div><span class='report-key'>WORDS      </span> <span class='report-val'>" + res.words + "</span></div>",
            "<div><span class='report-key'>ENTROPY    </span> <span class='report-val'>" + res.entropy + " bits/char</span></div>",
            "<div><span class='report-key'>SIGNAL EQ  </span> <span class='report-val'>" + res.signal + "</span></div>",
            "<div><span class='report-key'>TOP CHARS  </span> <span class='report-val'>" + res.topChars.join("  ") + "</span></div>",
            "<div style='margin-top:.5rem;color:var(--muted);font-size:.75rem'>FREQUENCY BANDS</div>",
          ].join("\n");
          html += res.bands.map(function (v, i) {
            const w = Math.round(v * barMax);
            return "<div><span class='report-val' style='display:inline-block;width:20px'>" + i + "</span>" +
              " <span class='report-bar' style='width:" + w + "px'></span>" +
              " <span style='color:var(--muted);font-size:.7rem'> " + (v * 100).toFixed(0) + "%</span></div>";
          }).join("\n");
          Waveform.setMode("signal", res.bands);
        }
      } else {
        const src  = document.getElementById("astro-source").value;
        const freq = parseFloat(document.getElementById("astro-freq").value);
        const res  = SignalProcessor.processAstro(src, freq);
        html = [
          "<div><span class='report-key'>SOURCE     </span> <span class='report-val'>" + res.name + "</span></div>",
          "<div><span class='report-key'>SCAN FREQ  </span> <span class='report-val'>" + freq + " Hz</span></div>",
          "<div><span class='report-key'>DESCRIPTION</span></div>",
          "<div style='color:var(--muted);margin:.3rem 0 .6rem'>" + res.desc + "</div>",
          "<div style='color:var(--muted);font-size:.75rem'>SPECTRAL / SIGNAL BANDS</div>",
        ].join("\n");
        html += res.bands.map(function (band, i) {
          const v = res.profile[i];
          const w = Math.round(v * 120);
          return "<div><span class='report-key' style='display:inline-block;min-width:80px'>" + band + "</span>" +
            " <span class='report-bar' style='width:" + w + "px'></span>" +
            " <span style='color:var(--muted);font-size:.7rem'> " + (v * 100).toFixed(0) + "%</span></div>";
        }).join("\n");
        Waveform.setMode("signal", res.profile);
      }

      report.innerHTML = html;
      btn.disabled    = false;
      btn.textContent = "📡 SCAN";
      R2D2Bot.setScanning(false);
      Waveform.setMode("idle");
      GameHub.recordScan();
    }, 1800);
  });
}

/* ── Your Number ─────────────────────────────────────────────────────────────── */
function initYourNumber() {
  const fp  = collectFingerprint();
  const pn  = buildPhoneNumber(fp);
  const dev = document.getElementById("number-blocks");
  const met = document.getElementById("number-meta");
  const ftl = document.getElementById("footer-number");

  if (dev) {
    dev.innerHTML = pn.blocks.map(function (b) {
      return '<span class="num-block">' + b + '</span>';
    }).join("");
  }
  if (met) {
    met.innerHTML =
      '<span id="number-device-id">Device: ' + pn.deviceId + '</span>' +
      '<span id="number-created">Registered: ' + formatRelative(pn.createdAt) + '</span>';
  }
  if (ftl) ftl.textContent = pn.raw;

  document.getElementById("copy-number").addEventListener("click", function () {
    navigator.clipboard.writeText(pn.raw).then(function () {
      _toast("📋 Signal number copied!");
    }).catch(function () {
      _toast("Number: " + pn.raw);
    });
  });

  document.getElementById("share-number").addEventListener("click", function () {
    const url = window.location.href + "?signal=" + encodeURIComponent(pn.raw);
    if (navigator.share) {
      navigator.share({ title:"My R2D2 Signal Number", text:"Signal me: " + pn.raw, url });
    } else {
      navigator.clipboard.writeText(url).then(function () { _toast("🔗 Share link copied!"); });
    }
  });

  document.getElementById("play-number").addEventListener("click", function () {
    try { SignalEngine.playPhoneNumber(pn); } catch (e) {}
    _toast("🔊 Playing your signal number…");
  });
}

/* ── Smooth scroll helper ────────────────────────────────────────────────────── */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:"smooth" });
}

/* ── Toast ───────────────────────────────────────────────────────────────────── */
function _toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.classList.add("hidden"); }, 3500);
}

/* ── Boot ────────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function () {
  /* canvases */
  R2D2Bot.init(document.getElementById("r2d2-canvas"));
  Waveform.init(document.getElementById("signal-canvas"));

  /* modules */
  initYourNumber();
  initProcessor();
  Directory.init();
  initLevelTabs();
  GameHub.init();

  /* nav logo scrolls to top */
  document.querySelector(".nav-logo").addEventListener("click", function () {
    window.scrollTo({ top:0, behavior:"smooth" });
  });

  /* first-run earn */
  if (GameHub.wallet.totalEarned === 0) {
    setTimeout(function () { GameHub.earn(5, "welcome"); _toast("🎉 Welcome! Here are 5 🟡 starter tokens."); }, 800);
  }
});
