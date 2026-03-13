/* ── R2D2 Game Engine — Token Economy + Trending Intel ──────────────────────── */

const GameHub = (function () {
  const STORAGE_KEY   = "r2d2_wallet_v2";
  const BOOST_MS      = 30 * 60 * 1000;   /* 30-minute boosts */
  const WATCH_TICK_MS = 10000;             /* earn 1 token every 10 s   */

  /* ── Trending topic database (⭐ Star boost surfaces these) ───────────── */
  const TREND_TOPICS = [
    { topic:"AI-Generated Websites",   score:97, action:"Add an AI chatbot widget — conversion lifts 34% average." },
    { topic:"Micro-Animations",        score:91, action:"Subtle hover & scroll effects — bounce rate drops 22%." },
    { topic:"Dark Mode First Design",  score:88, action:"Ship a dark-mode toggle — 61% of visitors prefer it." },
    { topic:"Video Hero Sections",     score:85, action:"Replace static hero with looping 4 s clip — +19% dwell." },
    { topic:"One-Click Signup",        score:83, action:"Remove all form fields except email — 3× sign-up rate." },
    { topic:"Signal-Based Identity",   score:80, action:"Show users a unique emoji ID — instant personalisation." },
    { topic:"WebGL Backgrounds",       score:78, action:"Particle / wave canvas hero — seen as premium by 74%." },
    { topic:"Speed < 1 s Load",        score:76, action:"Compress assets + CDN edge — Google ranks you +2 pages." },
    { topic:"Gamified Loyalty",        score:74, action:"Tokens + levels keep users 4× longer than static sites." },
    { topic:"Hydrogen Hosting",        score:71, action:"Edge-cached hydrogen routing — 0 ms TTFB globally." },
    { topic:"Voice / Signal Search",   score:68, action:"Signal search endpoint — +17% discovery from voice apps." },
    { topic:"Token-Gated Content",     score:65, action:"Lock premium pages behind token balance — earns 2.8× more." },
  ];

  /* ── Mini-game question bank ────────────────────────────────────────────── */
  const QUESTIONS = [
    { q:"Which emoji block has the highest frequency?",
      opts:["🟥 220 Hz","🏇 1976 Hz","🟦 246 Hz","🌿 1047 Hz"], ans:1, reward:5 },
    { q:"What does a ⭐ Star boost do?",
      opts:["Doubles tokens","Trends + 50% all earnings","Free call","Skips a level"], ans:1, reward:5 },
    { q:"How many blocks in a base signal number?",
      opts:["4","6","8","12"], ans:2, reward:5 },
    { q:"What does 🍄 Mushroom boost affect?",
      opts:["All earnings","Scan / research only","Call quality","Level speed"], ans:1, reward:5 },
    { q:"What does a Warp ⚪ represent?",
      opts:["Earn tokens","Spend — clone left behind","Make a call","Level up"], ans:1, reward:5 },
    { q:"Which is the max level?",
      opts:["♣️ Club","♦️ Diamond","♥️ Heart","♠️ Spade"], ans:3, reward:10 },
    { q:"How does R2D2 identify your device?",
      opts:["Your name","Browser fingerprint → emoji blocks","IP address","Cookie"], ans:1, reward:5 },
    { q:"What is the token cost to reach ⚙️ Development?",
      opts:["25","50","100","250"], ans:2, reward:8 },
    { q:"Trending Intel is unlocked by which boost?",
      opts:["🍄 Mushroom","⚪ Warp","⭐ Star","🟡 Token"], ans:2, reward:6 },
    { q:"What happens to number length as more users join?",
      opts:["Stays at 8","Gets shorter","Grows longer","Resets"], ans:2, reward:5 },
  ];

  /* ── State ──────────────────────────────────────────────────────────────── */
  let wallet      = _load();
  let watchTimer  = null;
  let currentQ    = null;

  /* ── Persistence ────────────────────────────────────────────────────────── */
  function _save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet)); } catch (e) {} }

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const w = JSON.parse(raw);
        /* fill any missing keys from older saves */
        w.activeBoosts = w.activeBoosts || [];
        w.earnLog      = w.earnLog      || [];
        w.chainStep    = w.chainStep    || 0;
        w.scansDone    = w.scansDone    || 0;
        w.bugsStomped  = w.bugsStomped  || 0;
        w.warpsUsed    = w.warpsUsed    || 0;
        return w;
      }
    } catch (e) {}
    return {
      balance:0, totalEarned:0, level:"♣️", levelProgress:0,
      activeBoosts:[], warpsUsed:0, bugsStomped:0, scansDone:0,
      chainStep:0, earnLog:[],
    };
  }

  /* ── Level helpers ──────────────────────────────────────────────────────── */
  function _levelFor(total) {
    let lv = "♣️";
    for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
      if (total >= LEVEL_THRESHOLDS[LEVEL_ORDER[i]]) { lv = LEVEL_ORDER[i]; break; }
    }
    return lv;
  }

  function _progress(total, lv) {
    const idx  = LEVEL_ORDER.indexOf(lv);
    if (idx === LEVEL_ORDER.length - 1) return 100;
    const cur  = LEVEL_THRESHOLDS[lv];
    const next = LEVEL_THRESHOLDS[LEVEL_ORDER[idx + 1]];
    return Math.min(100, Math.round(((total - cur) / (next - cur)) * 100));
  }

  function _nextLevel(lv) {
    const idx = LEVEL_ORDER.indexOf(lv);
    if (idx >= LEVEL_ORDER.length - 1) return null;
    const k = LEVEL_ORDER[idx + 1];
    return { emoji:k, name:LEVEL_NAMES[k], threshold:LEVEL_THRESHOLDS[k] };
  }

  /* ── Boost helpers ──────────────────────────────────────────────────────── */
  function _pruneBoosts() {
    const now = Date.now();
    wallet.activeBoosts = wallet.activeBoosts.filter(
      function (b) { return new Date(b.expiresAt).getTime() > now; }
    );
  }

  function _hasBoost(type) {
    _pruneBoosts();
    return wallet.activeBoosts.some(function (b) { return b.type === type; });
  }

  /* ── Earn ───────────────────────────────────────────────────────────────── */
  function earn(amount, reason) {
    _pruneBoosts();
    let a = amount;
    if (_hasBoost("mushroom") && reason && reason.indexOf("scan") !== -1) a *= 2;
    if (_hasBoost("star"))                                                  a = Math.ceil(a * 1.5);

    wallet.balance      += a;
    wallet.totalEarned  += a;

    const prevLevel  = wallet.level;
    wallet.level     = _levelFor(wallet.totalEarned);
    wallet.levelProgress = _progress(wallet.totalEarned, wallet.level);

    wallet.earnLog.unshift({ id:Date.now().toString(), amount:a, reason:reason||"earned", ts:new Date().toISOString() });
    if (wallet.earnLog.length > 60) wallet.earnLog.pop();

    _save();
    _updateUI();

    if (wallet.level !== prevLevel) _levelUp(wallet.level);
    try { SignalEngine.playEarn(); } catch (e) {}
    return a;
  }

  /* ── Spend ──────────────────────────────────────────────────────────────── */
  function spend(amount, reason) {
    if (wallet.balance < amount) return false;
    wallet.balance  -= amount;
    wallet.warpsUsed++;
    _save();
    _updateUI();
    return true;
  }

  /* ── Level up ───────────────────────────────────────────────────────────── */
  function _levelUp(newLevel) {
    wallet.bugsStomped++;
    _save();
    try { SignalEngine.playLevelUp(); } catch (e) {}
    _toast("🎉 LEVEL UP → " + newLevel + " " + LEVEL_NAMES[newLevel] + "!");
    _renderLevelPages();
    _updateUI();
  }

  /* ── Boosts ─────────────────────────────────────────────────────────────── */
  function activateBoost(type) {
    const cost = type === "star" ? 25 : 15;
    if (!spend(cost, "boost:" + type)) {
      _toast("❌ Need " + cost + " 🟡 for this boost.");
      return;
    }
    wallet.activeBoosts = wallet.activeBoosts.filter(function (b) { return b.type !== type; });
    wallet.activeBoosts.push({
      type,
      expiresAt: new Date(Date.now() + BOOST_MS).toISOString(),
      emoji: type === "star" ? "⭐" : "🍄",
      label: type === "star" ? "Trending +50%" : "Research ×2",
    });
    _save();
    _updateUI();

    if (type === "star") {
      _renderTrending();
      try { SignalEngine.playTrending(); } catch (e) {}
      _toast("⭐ Star Boost! Trending Intel unlocked for 30 min.");
    } else {
      _toast("🍄 Mushroom Boost! Research tokens doubled for 30 min.");
    }
  }

  /* ── Trending Intel ─────────────────────────────────────────────────────── */
  function _renderTrending() {
    const panel = document.getElementById("trending-panel");
    if (!panel) return;

    /* rotate the pool slightly each call so "refresh" feels live */
    const offset  = Math.floor(Date.now() / 60000) % TREND_TOPICS.length;
    const visible = TREND_TOPICS.slice(offset).concat(TREND_TOPICS.slice(0, offset)).slice(0, 8);

    const grid = panel.querySelector(".trending-grid");
    if (!grid) return;

    grid.innerHTML = visible.map(function (t, i) {
      const barW = t.score + "%";
      return [
        '<div class="trend-card">',
        '  <div class="trend-rank">#' + (i + 1) + ' TRENDING</div>',
        '  <div class="trend-topic">' + t.topic + '</div>',
        '  <div class="trend-score">',
        '    <div class="trend-bar-bg"><div class="trend-bar-fg" style="width:' + barW + '"></div></div>',
        '    <span class="trend-pct">' + t.score + '</span>',
        '  </div>',
        '  <div class="trend-action">→ ' + t.action + '</div>',
        '</div>',
      ].join("\n");
    }).join("\n");

    const ts = panel.querySelector("#trending-ts");
    if (ts) ts.textContent = "Updated " + new Date().toLocaleTimeString();

    panel.classList.remove("hidden");
  }

  function refreshTrending() {
    if (!_hasBoost("star")) {
      _toast("⭐ Activate Star Boost to unlock Trending Intel!");
      return;
    }
    _renderTrending();
    try { SignalEngine.playTrending(); } catch (e) {}
  }

  /* ── Watch & Earn ───────────────────────────────────────────────────────── */
  function _startWatch() {
    if (watchTimer) return;
    watchTimer = setInterval(function () {
      _pruneBoosts();
      earn(1, "watch");
      const el = document.getElementById("watch-timer");
      if (el) el.textContent = "+1 🟡 at " + new Date().toLocaleTimeString();
      /* hide trending panel when star boost expires */
      if (!_hasBoost("star")) {
        const p = document.getElementById("trending-panel");
        if (p) p.classList.add("hidden");
      }
    }, WATCH_TICK_MS);
  }

  /* ── Mini game ──────────────────────────────────────────────────────────── */
  function playGame() {
    const overlay = document.getElementById("game-overlay");
    if (!overlay) return;
    currentQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    document.getElementById("game-prompt").textContent = currentQ.q;
    const opts = document.getElementById("game-options");
    opts.innerHTML = "";
    currentQ.opts.forEach(function (opt, i) {
      const btn = document.createElement("button");
      btn.className   = "game-option";
      btn.textContent = opt;
      btn.onclick     = function () { _answer(i, btn); };
      opts.appendChild(btn);
    });
    document.getElementById("game-feedback").textContent = "";
    overlay.classList.remove("hidden");
  }

  function _answer(idx, btn) {
    if (!currentQ) return;
    document.querySelectorAll(".game-option").forEach(function (b) { b.onclick = null; });
    if (idx === currentQ.ans) {
      btn.classList.add("correct");
      document.getElementById("game-feedback").textContent = "✅ Correct! +" + currentQ.reward + " 🟡";
      earn(currentQ.reward, "game");
      wallet.bugsStomped++;
      _save();
      _updateUI();
    } else {
      btn.classList.add("wrong");
      document.querySelectorAll(".game-option")[currentQ.ans].classList.add("correct");
      document.getElementById("game-feedback").textContent = "❌ Wrong. Answer: " + currentQ.opts[currentQ.ans];
    }
    currentQ = null;
  }

  function closeGame() {
    const o = document.getElementById("game-overlay");
    if (o) o.classList.add("hidden");
  }

  /* ── Chain advancement ──────────────────────────────────────────────────── */
  function selectChainStep(i) {
    const step   = VALUE_CHAIN[i];
    const detail = document.getElementById("chain-detail");
    const cont   = document.getElementById("chain-detail-content");
    const advBtn = document.getElementById("chain-advance");
    if (!detail || !cont) return;

    const unlocked = i <= wallet.chainStep;
    cont.innerHTML =
      '<div style="font-size:2rem;margin-bottom:.4rem">' + step.emoji + '</div>' +
      '<strong style="font-size:1.2rem">' + step.label + '</strong>' +
      '<p style="color:var(--muted);margin:.5rem 0">' + step.description + '</p>' +
      (unlocked
        ? '<span style="color:var(--green);font-weight:700">✅ Unlocked</span>'
        : '<span style="color:var(--yellow);font-weight:700">Cost: ' + step.tokenCost + ' 🟡</span>');

    detail.classList.remove("hidden");

    if (advBtn) {
      const canAdv = i === wallet.chainStep + 1;
      if (canAdv) {
        advBtn.textContent = "Unlock " + step.emoji + " " + step.label + " (" + step.tokenCost + " 🟡) →";
        advBtn.style.display = "inline-block";
        advBtn.onclick = function () { _advance(i); };
      } else if (i === wallet.chainStep && i < VALUE_CHAIN.length - 1) {
        const nxt = VALUE_CHAIN[i + 1];
        advBtn.textContent = "Next: " + nxt.emoji + " " + nxt.label + " (" + nxt.tokenCost + " 🟡) →";
        advBtn.style.display = "inline-block";
        advBtn.onclick = function () { _advance(i + 1); };
      } else {
        advBtn.style.display = "none";
      }
    }
  }

  function _advance(i) {
    const step = VALUE_CHAIN[i];
    if (!step || i <= wallet.chainStep) return;
    if (wallet.balance < step.tokenCost) {
      _toast("Need " + step.tokenCost + " 🟡 to unlock " + step.emoji + " " + step.label);
      return;
    }
    wallet.balance -= step.tokenCost;
    wallet.warpsUsed++;
    wallet.chainStep = i;
    _save();
    _renderChain();
    _updateUI();
    _toast("✅ Unlocked " + step.emoji + " " + step.label + "!");
    try { if (typeof R2D2Bot !== "undefined") { R2D2Bot.setScanning(true); setTimeout(function () { R2D2Bot.setScanning(false); }, 3000); } } catch (e) {}
  }

  function advanceChain() { _advance(wallet.chainStep + 1); }

  /* ── Record a signal scan ───────────────────────────────────────────────── */
  function recordScan() {
    wallet.scansDone = (wallet.scansDone || 0) + 1;
    _save();
    earn(3, "scan");
  }

  /* ── Warp ───────────────────────────────────────────────────────────────── */
  function warp() {
    const cost = 50 + wallet.warpsUsed * 10;
    if (wallet.balance < cost) { _toast("Need " + cost + " 🟡 to Warp ⚪"); return; }
    wallet.balance  -= cost;
    wallet.warpsUsed++;
    _save();
    _updateUI();
    _toast("⚪ Warped! Clone left behind. Research bonus incoming…");
    setTimeout(function () { earn(Math.floor(cost * 0.2), "warp:research"); }, 2200);
  }

  /* ── Chain render ───────────────────────────────────────────────────────── */
  function _renderChain() {
    const container = document.getElementById("chain-flow");
    if (!container) return;
    container.innerHTML = "";

    VALUE_CHAIN.forEach(function (step, i) {
      const unlocked = i <= wallet.chainStep;
      const isCur    = i === wallet.chainStep;

      const wrap = document.createElement("div");
      wrap.className = "chain-step";

      const btn = document.createElement("button");
      btn.className = "chain-step-btn" +
        (unlocked ? " unlocked" : " locked") +
        (isCur    ? " selected" : "");
      btn.innerHTML =
        '<span class="chain-emoji">' + step.emoji + '</span>' +
        '<span class="chain-label">' + step.label + '</span>' +
        '<span class="chain-cost">'  + (step.tokenCost > 0 ? step.tokenCost + " 🟡" : "FREE") + '</span>';
      btn.onclick = function () { selectChainStep(i); };
      wrap.appendChild(btn);
      container.appendChild(wrap);

      if (i < VALUE_CHAIN.length - 1) {
        const arrow = document.createElement("div");
        arrow.className   = "chain-arrow";
        arrow.textContent = "→";
        container.appendChild(arrow);
      }
    });
  }

  /* ── Level page render ──────────────────────────────────────────────────── */
  function _renderLevelPages() {
    const container = document.getElementById("level-pages");
    if (!container) return;

    const pages = {
      "♣️": {
        title:"Club — Your Signal Origin", req:"0 🟡",
        desc:"Every signal starts here. Claim your device number, earn your first tokens, and begin building. The foundation of your entire chain.",
        features:[
          { icon:"📡", name:"Signal Number",    desc:"Your 8-block emoji phone number, device-fingerprinted and unique." },
          { icon:"🟡", name:"Token Earning",    desc:"Watch & Earn — 1 token every 10 seconds just for being here." },
          { icon:"🎮", name:"Signal Challenge", desc:"Play the mini-game to earn bonus tokens and stomp bugs." },
          { icon:"📖", name:"Signal Processor", desc:"Scan any text or astronomical data and earn research tokens." },
          { icon:"📞", name:"Directory",        desc:"Browse and call other signal numbers in the network." },
        ],
      },
      "♦️": {
        title:"Diamond — Builder Mode", req:"100 🟡 total earned",
        desc:"You've earned your builder badge. The ⭐ Star Boost is now available, surfacing trending topics that make your website outperform the competition.",
        features:[
          { icon:"⭐", name:"Trending Intel",   desc:"Star Boost reveals live trending topics — use them to fly past other sites." },
          { icon:"👑", name:"Website Claim",    desc:"Lock in your site on the Hydrogen network." },
          { icon:"🤓", name:"Research Access",  desc:"Unlock deep research topics via the signal processor." },
          { icon:"🔊", name:"Signal Melodies",  desc:"Your number plays as a unique audio signature." },
          { icon:"📈", name:"Boost Combos",     desc:"Stack Star + Mushroom for maximum token velocity." },
        ],
      },
      "♥️": {
        title:"Heart — Signal Master", req:"500 🟡 total earned",
        desc:"You've mastered the signals. Your number now auto-extends as new users join. Tools and development are unlocked — start shipping.",
        features:[
          { icon:"🦾", name:"Builder Tools",     desc:"Signal generators, pattern editors, and deploy utilities." },
          { icon:"⚙️", name:"Development Suite", desc:"Feature flags, CI hooks, and automated deployment." },
          { icon:"🌐", name:"Extended Number",   desc:"Your block count grows automatically as the network expands." },
          { icon:"📡", name:"Priority Scan",     desc:"Signal scans run faster and return deeper data." },
          { icon:"🍄", name:"Research Doubles",  desc:"Mushroom boost now triples instead of doubles research." },
        ],
      },
      "♠️": {
        title:"Spade — Apex Signal", req:"2000 🟡 total earned",
        desc:"The apex of the chain. Your signal has real value and your platform has converted to assets. You're running at full hydrogen capacity.",
        features:[
          { icon:"💰", name:"Value Engine",    desc:"Platform weight accumulates compound signal value daily." },
          { icon:"💲", name:"Asset Conversion",desc:"Convert signal equity to real-world value at any time." },
          { icon:"⚪", name:"Warp Protocol",   desc:"Warp spending leaves clones — research bounties return 40%." },
          { icon:"♾️", name:"Infinite Chain",  desc:"Your chain never ends — each asset generates a new token seed." },
          { icon:"🏇", name:"Max Frequency",   desc:"Your signal number can include ultra-rare 🏇 1976 Hz blocks." },
        ],
      },
    };

    container.innerHTML = Object.keys(pages).map(function (key) {
      const p          = pages[key];
      const threshold  = LEVEL_THRESHOLDS[key];
      const unlocked   = wallet.totalEarned >= threshold;
      const id         = { "♣️":"club","♦️":"diamond","♥️":"heart","♠️":"spade" }[key];

      if (!unlocked && key !== "♣️") {
        return [
          '<div class="level-page" id="page-' + id + '">',
          '  <div class="level-lock">',
          '    <div class="level-lock-icon">🔒</div>',
          '    <div class="level-lock-text">' + key + ' ' + p.title + '</div>',
          '    <div class="level-lock-need">Earn ' + p.req + ' to unlock</div>',
          '  </div>',
          '</div>',
        ].join("\n");
      }

      const feats = p.features.map(function (f) {
        return [
          '<div class="level-feature">',
          '  <div class="level-feature-icon">' + f.icon + '</div>',
          '  <div class="level-feature-name">' + f.name + '</div>',
          '  <div class="level-feature-desc">' + f.desc + '</div>',
          '</div>',
        ].join("\n");
      }).join("\n");

      return [
        '<div class="level-page" id="page-' + id + '">',
        '  <div class="level-page-header">',
        '    <div class="level-page-badge">' + key + '</div>',
        '    <div>',
        '      <div class="level-page-title">' + p.title + '</div>',
        '      <div class="level-page-req">Requires ' + p.req + '</div>',
        '    </div>',
        '  </div>',
        '  <div class="level-page-desc">' + p.desc + '</div>',
        '  <div class="level-features">' + feats + '</div>',
        '</div>',
      ].join("\n");
    }).join("\n");

    /* activate first tab */
    const first = container.querySelector(".level-page");
    if (first) first.classList.add("active");
  }

  /* ── UI sync ────────────────────────────────────────────────────────────── */
  function _set(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

  function _updateUI() {
    _pruneBoosts();
    _set("token-big",           wallet.balance);
    _set("nav-tokens",          "🟡 " + wallet.balance);
    _set("level-display",       wallet.level + " " + LEVEL_NAMES[wallet.level]);
    _set("nav-level",           wallet.level + " " + LEVEL_NAMES[wallet.level]);
    _set("bugs-stomped",        wallet.bugsStomped);
    _set("warps-used",          wallet.warpsUsed);
    _set("total-earned",        wallet.totalEarned);
    _set("scans-done",          wallet.scansDone || 0);

    const bar = document.getElementById("level-bar");
    if (bar) bar.style.width = wallet.levelProgress + "%";

    const nxt = _nextLevel(wallet.level);
    _set("level-progress-label",
      nxt ? wallet.totalEarned + " / " + nxt.threshold + " to " + nxt.emoji + " " + nxt.name
          : "♠️ MAX LEVEL REACHED");

    /* boosts badge list */
    const bl = document.getElementById("active-boosts");
    if (bl) {
      if (!wallet.activeBoosts.length) {
        bl.innerHTML = '<div class="no-boosts">No active boosts</div>';
      } else {
        bl.innerHTML = wallet.activeBoosts.map(function (b) {
          const rem = Math.max(0, Math.round((new Date(b.expiresAt).getTime() - Date.now()) / 60000));
          return '<div class="boost-badge">' + b.emoji + ' ' + b.label + ' · ' + rem + 'm</div>';
        }).join("");
      }
    }

    /* trending panel visibility */
    const tp = document.getElementById("trending-panel");
    if (tp) {
      if (_hasBoost("star")) {
        _renderTrending();
      } else {
        tp.classList.add("hidden");
      }
    }

    /* level tab lock states */
    document.querySelectorAll(".level-tab").forEach(function (tab) {
      const key  = { club:"♣️", diamond:"♦️", heart:"♥️", spade:"♠️" }[tab.dataset.level];
      const thr  = LEVEL_THRESHOLDS[key];
      const unlk = wallet.totalEarned >= thr;
      tab.classList.toggle("locked-tab", !unlk);
    });
  }

  /* ── Toast ──────────────────────────────────────────────────────────────── */
  function _toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.add("hidden"); }, 3600);
  }

  /* ── Init ───────────────────────────────────────────────────────────────── */
  function init() {
    _renderChain();
    _renderLevelPages();
    _updateUI();
    _startWatch();

    const warpBtn = document.getElementById("nav-warp");
    if (warpBtn) warpBtn.onclick = warp;
  }

  return {
    init,
    earn,
    spend,
    activateBoost,
    playGame,
    closeGame,
    advanceChain,
    recordScan,
    refreshTrending,
    warp,
    get wallet() { return wallet; },
  };
}());
