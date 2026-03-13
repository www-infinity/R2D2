/* ── R2D2 Phone Utilities — ported from www-infinity/Hydrhost ──────────────── */

const BLOCK_FREQ = {
  "🟥":220,  "🟦":246,  "🟨":277,  "🟩":311,
  "🟪":349,  "⬜":392,  "🟧":440,  "🟫":494,
  "😎":523,  "👌":554,  "🎷":587,  "♣️":622,
  "🛸":659,  "🌻":698,  "💃":740,  "🐴":784,
  "♠️":831,  "♦️":880,  "♥️":932,  "⭐":988,
  "🌿":1047, "🍀":1109, "🌊":1175, "🎵":1245,
  "🎶":1319, "🌙":1397, "⚡":1480, "🌸":1568,
  "🎸":1661, "🦋":1760, "🌲":1865, "🏇":1976,
};

const SIGNAL_BLOCKS = ["🟥","🟦","🟨","🟩","🟪","⬜","🟧","🟫"];
const ACCENT_BLOCKS = [
  "😎","👌","🎷","♣️","🛸","🌻","💃","🐴",
  "♠️","♦️","♥️","⭐","🌿","🍀","🌊","🎵",
  "🎶","🌙","⚡","🌸","🎸","🦋","🌲","🏇",
];
const ALL_BLOCKS = SIGNAL_BLOCKS.concat(ACCENT_BLOCKS);

const LEVEL_THRESHOLDS = { "♣️":0, "♦️":100, "♥️":500, "♠️":2000 };
const LEVEL_NAMES      = { "♣️":"Club", "♦️":"Diamond", "♥️":"Heart", "♠️":"Spade" };
const LEVEL_ORDER      = ["♣️","♦️","♥️","♠️"];

const VALUE_CHAIN = [
  { emoji:"🟡", label:"Token",       description:"Earn tokens by watching & playing. Every second on-site builds your signal.",         tokenCost:0   },
  { emoji:"👑", label:"Website",     description:"Claim your corner of the network. Your signal becomes a destination.",                tokenCost:10  },
  { emoji:"🤓", label:"Research",    description:"Unlock deep research on any topic. R2D2 scans signals to surface hidden data.",       tokenCost:25  },
  { emoji:"🦾", label:"Tools",       description:"Access builder tools & signal generators. Create, remix, and deploy fast.",           tokenCost:50  },
  { emoji:"⚙️", label:"Development", description:"Ship features & grow your platform. Every commit compounds your signal strength.",    tokenCost:100 },
  { emoji:"💰", label:"Value",       description:"Your platform accumulates real value. Hydrogen signal converts to network weight.",   tokenCost:250 },
  { emoji:"💲", label:"Assets",      description:"Convert platform value to real assets. Signal equity becomes tangible output.",       tokenCost:500 },
];

/* ── djb2 hash ──────────────────────────────────────────────────────────────── */
function djb2(input) {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(h, 33) ^ input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/* ── Device fingerprint ─────────────────────────────────────────────────────── */
function collectFingerprint() {
  try {
    return [
      navigator.userAgent,
      navigator.language,
      String(screen.width),
      String(screen.height),
      String(screen.colorDepth),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      String(navigator.hardwareConcurrency || 0),
      String(new Date().getTimezoneOffset()),
      navigator.platform || "",
    ].join("|");
  } catch (e) {
    return "fallback-" + Math.random().toString(36).slice(2, 10);
  }
}

/* ── Block generation ───────────────────────────────────────────────────────── */
function fingerprintToBlocks(fp, length) {
  length = length || 8;
  const blocks = [];
  let seed = djb2(fp);
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    blocks.push(ALL_BLOCKS[seed % ALL_BLOCKS.length]);
  }
  return blocks;
}

function buildPhoneNumber(fp, length) {
  length = length || 8;
  const blocks = fingerprintToBlocks(fp, length);
  return {
    blocks,
    raw:      blocks.join(""),
    deviceId: djb2(fp).toString(16).padStart(8, "0"),
    createdAt: new Date().toISOString(),
  };
}

function buildSignalConfig(pn) {
  const freqA = BLOCK_FREQ[pn.blocks[0]] || 440;
  const freqB = BLOCK_FREQ[pn.blocks[1]] || 550;
  const seed  = parseInt(pn.deviceId, 16) || 12345;
  return {
    freqA,
    freqB,
    pulseOnMs:  200 + (seed % 400),
    pulseOffMs: 150 + ((seed >> 4) % 350),
    gain: 0.08,
  };
}

/* ── Seed contacts ──────────────────────────────────────────────────────────── */
function generateSeedContacts(count) {
  count = count || 12;
  const names = [
    "Alex Rivera","Morgan Chen","Sam Okafor","Jordan Walsh",
    "Taylor Brooks","Casey Kim","Riley Patel","Drew Nguyen",
    "Avery Johnson","Quinn Martinez","Reese Thompson","Blake Davis",
  ];
  const statuses = ["online","offline","busy"];
  const tagPool  = ["nature","music","tech","horses","engineer","local","signal","research"];

  return names.slice(0, count).map(function(name, i) {
    const seed       = djb2("contact:" + name);
    const blockCount = 8 + Math.floor(i / 4);
    const fp         = "seed:" + name.toLowerCase().replace(/\s/g, "-");
    const blocks     = fingerprintToBlocks(fp, blockCount);
    return {
      id:   "c" + (i + 1),
      name,
      phoneNumber: {
        blocks,
        raw:      blocks.join(""),
        deviceId: seed.toString(16).padStart(8, "0"),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      },
      status:   statuses[seed % statuses.length],
      lastSeen: statuses[seed % statuses.length] === "offline"
        ? new Date(Date.now() - (seed % 3600000)).toISOString()
        : undefined,
      favorite: i < 3,
      tags: tagPool.filter(function(_, ti) { return ((seed >> ti) & 1) === 1; }).slice(0, 3),
    };
  });
}

/* ── Formatters ─────────────────────────────────────────────────────────────── */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

function formatRelative(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d + "d ago";
  if (h > 0) return h + "h ago";
  if (m > 0) return m + "m ago";
  return "just now";
}
