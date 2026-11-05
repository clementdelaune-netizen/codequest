/* CodeQuest v9 — LOGIQUE de l'app (un seul script fusionné). Les données sont dans data.js, chargé avant. */
const APP_VERSION = '9.0';
/* Helper DOM global garanti pour les scripts et les attributs onclick inline */
window.$ = id => document.getElementById(id);
const $ = window.$;

/* thème sombre (avant le rendu) */
(function(){try{if((localStorage.getItem('cq_t')||'light').replace(/"/g,'')==='dark')document.documentElement.classList.add('dk-init')}catch(e){}})();
/* ---------- LOCALHOST & ENV CHECK ---------- */
const isLocalhost = () => ['localhost', '127.0.0.1', '0.0.0.0', '::1', ''].includes(location.hostname) ||
  location.hostname.startsWith('192.168.') ||
  location.hostname.startsWith('10.') ||
  location.hostname.startsWith('172.') ||
  location.hostname.endsWith('.local') ||
  location.protocol === 'file:';

/* ---------- MODE INVITÉ (sans compte Google) ---------- */
function guestLogin(name) {
  try {
    const n = (name || '').trim();
    if (!P) {
      P = { cd: 0, xp: 0, st: 0, ls: 0, lc: 0, u: null, a: 'bot_silver_code', av: ['bot_silver_code'], hn: 1, dn: {}, sy: { snake: [0, 0, 0] }, bd: [], hi: [], q: null, sb: 0, ta: 0, tc: 0, tl: 0 };
    }
    if (n) P.u = n; else if (!P.u) P.u = 'Codeur';
    if (!P.a) P.a = 'bot_silver_code';
    if (!P.uid) P.uid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'cq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);

    setCookie('cq_session', P.u, 365);
    setCookie('cq_auth', 'local', 365);
    SS('cq_session', P.u);
    SS('cq_auth', 'local');
    try {
      localStorage.setItem('cq_session', JSON.stringify(P.u));
      localStorage.setItem('cq_user', P.u);
      localStorage.setItem('cq_auth', 'local');
    } catch(e) {}
    deleteCookie('cq_google_user');
    window.GU = null;
    save();

    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    try { cl('m-gauth'); } catch (e) {}
    if (typeof hideCookieBanner === 'function') hideCookieBanner();
    hideGate();
    if (typeof go === 'function') go('home');
    if (typeof rHome === 'function') rHome();
    if (typeof rAcc === 'function') rAcc();
    if (typeof gUI === 'function') gUI();
    toast('Session active : Bienvenue ' + P.u + ' ! 🎉', 's', 'i-check');
  } catch (err) {
    console.error('guestLogin error:', err);
    hideGate();
    if (typeof go === 'function') go('home');
  }
}
window.guestLogin = guestLogin;
window.devBypassGoogle = guestLogin;

/* Sauvegarde manuelle (fichier) — fonctionne pour tous les modes */
function exportSave() {
  try {
    const blob = new Blob([JSON.stringify({ app: 'codequest', v: 9, date: new Date().toISOString(), data: P })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'codequest-sauvegarde-' + (P.u || 'invite').replace(/[^\w-]+/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Sauvegarde téléchargée 💾', 's', 'i-check');
  } catch (e) { toast('Export impossible : ' + e.message, 'e', 'i-warn'); }
}
function importSave() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result), d = o && o.data ? o.data : o;
        if (!d || typeof d !== 'object' || typeof d.xp !== 'number') throw new Error('fichier invalide');
        if (!confirm('Remplacer ta progression actuelle (' + (P.xp || 0) + ' XP) par la sauvegarde (' + d.xp + ' XP) ?')) return;
        P = d; save(); rHome(); rAcc(); gUI();
        toast('Progression restaurée ✅', 's', 'i-check');
      } catch (e) { toast('Sauvegarde illisible : ' + e.message, 'e', 'i-warn'); }
    };
    rd.readAsText(f);
  };
  inp.click();
}

/* ---------- AUDIO SYNTHESIZER & CONFETTI ENGINE ---------- */
let ACTX = null;
function getAudio() {
  if (typeof SND !== 'undefined' && !SND) return null;
  try {
    if (!ACTX) ACTX = new (window.AudioContext || window.webkitAudioContext)();
    if (ACTX.state === 'suspended') ACTX.resume();
    return ACTX;
  } catch(e) { return null; }
}

function sfx(type) {
  const ctx = getAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    if (type === 'click') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(450, now);
      o.frequency.exponentialRampToValueAtTime(160, now + 0.05);
      g.gain.setValueAtTime(0.1, now); g.gain.linearRampToValueAtTime(0.01, now + 0.05);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.05);
    }
    else if (type === 'correct') {
      [523.25, 659.25].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0.14, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.18);
      });
    }
    else if (type === 'wrong') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(170, now);
      o.frequency.linearRampToValueAtTime(100, now + 0.2);
      g.gain.setValueAtTime(0.12, now);
      g.gain.linearRampToValueAtTime(0.01, now + 0.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.2);
    }
    else if (type === 'coin') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(987.77, now);
      o.frequency.setValueAtTime(1318.51, now + 0.08);
      g.gain.setValueAtTime(0.16, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.35);
    }
    else if (type === 'fanfare') {
      [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + (i === 3 ? 0.45 : 0.18));
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + (i === 3 ? 0.45 : 0.18));
      });
    }
    else if (type === 'eat') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(320, now);
      o.frequency.exponentialRampToValueAtTime(750, now + 0.08);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0.01, now + 0.08);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.08);
    }
    else if (type === 'pop') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(600, now);
      o.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0.001, now + 0.04);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.04);
    }
    else if (type === 'gameover') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(260, now);
      o.frequency.linearRampToValueAtTime(60, now + 0.35);
      g.gain.setValueAtTime(0.18, now);
      g.gain.linearRampToValueAtTime(0.01, now + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.35);
    }
  } catch(e) {}
}

// Moteur de confettis festifs
function triggerConfetti() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const colors = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#8b5cf6', '#ff86d0'];
  const particles = Array.from({ length: 65 }, () => ({
    x: c.width / 2,
    y: c.height * 0.4,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.7) * 16,
    r: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 10,
    alpha: 1
  }));
  let start = Date.now();
  function loop() {
    const elapsed = Date.now() - start;
    if (elapsed > 2800) { c.remove(); return; }
    ctx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rot += p.vr;
      p.alpha = Math.max(0, 1 - (elapsed / 2800));
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx.restore();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- storage ---------- */
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}};
const SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const today=()=>new Date().toISOString().slice(0,10);
const dayN=()=>Math.floor(Date.now()/864e5);
const STARTER_BOTS=['bot_green_code','bot_silver_code','bot_silver_joie','bot_silver_clin_oeil_u','bot_silver_malicieux','bot_silver_determine'];
let P=LS('cq',null);
if(!P)P={cd:0,xp:0,st:0,ls:0,lc:0,u:null,a:'bot_green_code',av:[...STARTER_BOTS],hn:1,dn:{},sy:{snake:[0,0,0]},bd:[],hi:[],q:null,sb:0,ta:0,tc:0,tl:0};
P.dn=P.dn||{};P.sy=P.sy||{snake:[0,0,0]};P.bd=P.bd||[];P.hi=P.hi||[];
if(typeof P.tl!=='number'){
  const dnCount=Object.values(P.dn||{}).flat().filter(v=>v>0).length;
  P.tl=Math.max(0,dnCount*120+(P.hi?P.hi.length*90:0));
}
if(!P.av||!P.av.length||(P.av[0]&&P.av[0].startsWith('a'))){
  const leg={'a0':'bot_silver_code','a1':'bot_silver_joie','a2':'bot_silver_clin_oeil_u','a3':'bot_silver_malicieux','a4':'bot_silver_determine'};
  P.av=(P.av||[]).map(x=>leg[x]||x).filter(x=>x&&!x.startsWith('a'));
  STARTER_BOTS.forEach(b=>{if(!P.av.includes(b))P.av.push(b)});
  if(!P.a||P.a.startsWith('a'))P.a=leg[P.a]||'bot_silver_code';
}
if(!P.a)P.a='bot_green_code';
if(!P.uid){
  P.uid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'cq_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
}
const save=()=>{SS('cq',P);if(window.gSave)window.gSave(P)};

/* ---------- CHRONOMÈTRE DE LEÇON & TEMPS D'APPRENTISSAGE ---------- */
let LES_START = null;
let LES_TICK_IV = null;

function fmtLessonTime(sec){
  sec=Math.max(0,Math.floor(sec||0));
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  if(h>0)return `${h}h ${m.toString().padStart(2,'0')}m`;
  if(m>0)return `${m} min`;
  return `${s}s`;
}

function trackLessonTime(){
  if(LES_START){
    const now=Date.now();
    const diff=Math.min(300,Math.max(0,Math.round((now-LES_START)/1000)));
    if(diff>0){
      P.tl=(P.tl||0)+diff;
      save();
    }
    LES_START=now;
  }
}

function startLessonTimer(){
  trackLessonTime();
  LES_START=Date.now();
  if(LES_TICK_IV)clearInterval(LES_TICK_IV);
  LES_TICK_IV=setInterval(()=>{trackLessonTime()},10000);
}

function stopLessonTimer(){
  trackLessonTime();
  if(LES_TICK_IV){clearInterval(LES_TICK_IV);LES_TICK_IV=null}
  LES_START=null;
}

window.addEventListener('beforeunload',()=>stopLessonTimer());
/* ---------- pub récompensée (VRAIE PUB GOOGLE ADSENSE H5 GAMES) ---------- */
let AD_LOADING = false;
let ADS_AVAILABLE = false; // Masqué par défaut tant que la vraie pub n'est pas confirmée disponible

function hideAdElements() {
  ADS_AVAILABLE = false;
  document.querySelectorAll('.ad-wrap, .ad-hb-btn, .ad-shop-card').forEach(el => {
    el.style.display = 'none';
  });
}

function showAdElements() {
  ADS_AVAILABLE = true;
  document.querySelectorAll('.ad-wrap, .ad-hb-btn, .ad-shop-card').forEach(el => {
    el.style.display = '';
  });
}

function checkAdAvailability() {
  if (typeof isLocalhost === 'function' && isLocalhost()) {
    hideAdElements();
    return;
  }
  if (typeof window.adsbygoogle === 'undefined') {
    hideAdElements();
    return;
  }
  
  const hasAdBreak = (typeof window.adBreak === 'function') || (window.adsbygoogle && typeof window.adsbygoogle.getAdBreak === 'function');
  if (hasAdBreak) {
    showAdElements();
  } else {
    // Si AdSense met 1.5s à charger l'API H5 Games
    setTimeout(() => {
      const ready = (typeof window.adBreak === 'function') || (window.adsbygoogle && typeof window.adsbygoogle.getAdBreak === 'function') || (window.adsbygoogle && window.adsbygoogle.loaded);
      if (ready) {
        showAdElements();
      } else {
        hideAdElements();
      }
    }, 1500);
  }
}

addEventListener('load', () => setTimeout(checkAdAvailability, 500));

function rewardPreview() {
  return { k: 'cd', amt: 100, lbl: '100 Codes' };
}

function grantReward(r) {
  if (r.k === 'hn') {
    P.hn += r.amt;
    toast('Publicité terminée : +' + r.lbl, 's', 'i-bulb');
  } else {
    const amt = r.amt || 100;
    P.cd += amt;
    P.tc = (P.tc || 0) + amt;
    try { sfx('fanfare'); triggerConfetti(); } catch(e) {}
    toast('🎉 +' + amt + ' Codes gratuits crédités !', 's', 'i-coin');
  }
  save();
  if (typeof rHome === 'function' && $('home')?.classList.contains('on')) rHome();
  if (typeof rShop === 'function' && $('shop')?.classList.contains('on')) rShop();
  if (typeof paintStep === 'function' && $('les')?.classList.contains('on')) {
    const b = $('hb');
    if (b) { b.innerHTML = ic('i-bulb') + 'Indice (' + P.hn + ')'; b.disabled = !P.hn; }
  }
}

function watchAd(btnEl, forceKind) {
  if (AD_LOADING) return;

  if (typeof isLocalhost === 'function' && isLocalhost()) {
    hideAdElements();
    toast('Publicités réelles indisponibles en local.', 'i', 'i-info');
    return;
  }

  const r = forceKind === 'hn' ? { k: 'hn', amt: 2, lbl: '2 Indices' } :
            { k: 'cd', amt: 100, lbl: '100 Codes' };

  AD_LOADING = true;
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.dataset.old = btnEl.innerHTML;
    btnEl.innerHTML = ic('i-play') + 'Chargement…';
  }

  const restoreBtn = () => {
    AD_LOADING = false;
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = btnEl.dataset.old || btnEl.innerHTML;
    }
  };

  let adShown = false;
  const timeoutId = setTimeout(() => {
    if (!adShown) {
      restoreBtn();
      hideAdElements();
      toast('Aucune pub disponible actuellement. Option masquée.', 'i', 'i-info');
    }
  }, 5000);

  // 1. API officielle Google AdSense for Games (adBreak)
  const adBreakFn = window.adBreak || (window.adsbygoogle && window.adsbygoogle.getAdBreak);

  if (typeof adBreakFn === 'function') {
    try {
      adBreakFn({
        type: 'reward',
        name: 'reward_' + Date.now(),
        beforeReward: (showAdFn) => {
          adShown = true;
          clearTimeout(timeoutId);
          showAdFn();
        },
        adViewed: () => {
          grantReward(r);
        },
        adDismissed: () => {
          toast('Publicité fermée avant la fin : aucune récompense', 'e', 'i-warn');
        },
        adBreakDone: (placementInfo) => {
          clearTimeout(timeoutId);
          restoreBtn();
          const st = placementInfo && placementInfo.breakStatus;
          if (st === 'viewed') {
            // Déjà crédité dans adViewed
          } else if (st === 'dismissed') {
            // Fermé avant la fin
          } else {
            // Impossible de diffuser la pub -> disparaît !
            hideAdElements();
            toast('Aucune publicité disponible pour le moment.', 'i', 'i-info');
          }
        }
      });
      return;
    } catch(e) {
      console.warn('AdSense adBreak error:', e);
    }
  }

  // 2. Si AdSense standard push
  try {
    if (window.adsbygoogle && window.adsbygoogle.push) {
      window.adsbygoogle.push({
        type: 'reward',
        name: 'reward_' + Date.now(),
        beforeReward: (show) => {
          adShown = true;
          clearTimeout(timeoutId);
          show();
        },
        adBreakDone: (info) => {
          clearTimeout(timeoutId);
          restoreBtn();
          if (info && info.breakStatus === 'viewed') {
            grantReward(r);
          } else if (info && info.breakStatus === 'dismissed') {
            toast('Pub quittée avant la fin : aucune récompense', 'e', 'i-warn');
          } else {
            hideAdElements();
            toast('Aucune publicité disponible pour le moment.', 'i', 'i-info');
          }
        }
      });
      return;
    }
  } catch(e) {}

  // Si impossible de lancer une vraie pub AdSense : masquage immédiat
  clearTimeout(timeoutId);
  restoreBtn();
  hideAdElements();
  toast('Aucune publicité disponible actuellement.', 'i', 'i-info');
}

function adBtn(extraStyle, forceKind) {
  if (!ADS_AVAILABLE) return '';
  const k = forceKind || 'cd';
  const lbl = k === 'hn' ? '+2 Indices gratuits' : '+100 Codes gratuits';
  return `<div class="ad-wrap" style="${extraStyle ? extraStyle : ''}"><button class="btn p w" style="background:linear-gradient(135deg,var(--yl),var(--or));border-color:var(--or-d);color:#fff;font-weight:900" onclick="watchAd(this, '${k}')">${ic('i-play')}Regarder une pub · ${lbl}</button></div>`;
}
/* ---------- avatars ---------- */
const RAR = {
  f: { n: 'Départ', c: 'r-f', p: 0, w: 0 },
  c: { n: 'Commune', c: 'r-c', p: 150, w: 60 },
  r: { n: 'Rare', c: 'r-r', p: 400, w: 25 },
  e: { n: 'Épique', c: 'r-e', p: 800, w: 12 },
  l: { n: 'Légendaire', c: 'r-l', p: 1500, w: 3 }
};

const EXPR_LABELS = {
  code: 'Codeur',
  clin_oeil_u: 'Espiègle',
  triste: 'Désolé',
  colere: 'Enragé',
  clin_oeil_o: 'Étonné',
  joie: 'Joyeux',
  sueur: 'Stressé',
  malicieux: 'Malicieux',
  determine: 'Déterminé',
  fatigue: 'Fatigué',
  langue: 'Gourmand',
  doute: 'Sceptique'
};

const COLORS = [
  { id: 'silver', n: 'Argent', rar: 'c' },
  { id: 'bronze', n: 'Cuivre', rar: 'c' },
  { id: 'pink', n: 'Rose', rar: 'r' },
  { id: 'red', n: 'Rubis', rar: 'e' },
  { id: 'gold', n: 'Or', rar: 'l' }
];

const STARTER_KEYS = ['code', 'joie', 'clin_oeil_u', 'malicieux', 'determine'];

const AV = [{
  id: 'bot_green_code',
  n: 'Robot Vert · Classique',
  r: 'f',
  pr: 0,
  img: 'assets/avatars/robot_green_code.png'
}];
COLORS.forEach(col => {
  Object.keys(EXPR_LABELS).forEach(k => {
    const isStarter = col.id === 'silver' && STARTER_KEYS.includes(k);
    const r = isStarter ? 'f' : col.rar;
    AV.push({
      id: `bot_${col.id}_${k}`,
      n: `${col.n} · ${EXPR_LABELS[k]}`,
      r: r,
      pr: RAR[r].p,
      img: `assets/avatars/robot_${col.id}_${k}.png`
    });
  });
});

const avById = id => {
  const leg = {
    'a0': 'bot_silver_code',
    'a1': 'bot_silver_joie',
    'a2': 'bot_silver_clin_oeil_u',
    'a3': 'bot_silver_malicieux',
    'a4': 'bot_silver_determine'
  };
  const targetId = leg[id] || id;
  return AV.find(a => a.id === targetId) || AV[0];
};

function avSVG(id, sz) {
  const a = avById(id);
  const s = sz ? ` width="${sz}" height="${sz}"` : '';
  return `<img class="av-img" src="${a.img}" alt="${a.n}"${s} loading="lazy" onerror="this.onerror=null;this.src='icon-192.png'">`;
}
const myAv = () => avSVG(P.a || 'bot_silver_code');
/* ---------- rarity pools + daily shop ---------- */
const POOL={c:AV.filter(a=>a.r==='c'),r:AV.filter(a=>a.r==='r'),e:AV.filter(a=>a.r==='e'),l:AV.filter(a=>a.r==='l')};
function rnd(s){const x=Math.sin(s*12.9898)*43758.5453;return x-Math.floor(x)}
function pickTier(v){let a=0;for(const k of['c','r','e','l']){a+=RAR[k].w;if(v*100<a)return k}return 'c'}
function dailyShop(){const d=dayN(),out=[],used=new Set();
for(let i=0;i<4;i++){let t=pickTier(rnd(d*7+i*31)),p=POOL[t];let j=Math.floor(rnd(d*13+i*57)*p.length),k=0;
while(used.has(p[j].id)&&k<p.length){j=(j+1)%p.length;k++}
if(used.has(p[j].id)){p=POOL.c;j=Math.floor(rnd(d*17+i)*p.length)}
used.add(p[j].id);out.push(p[j])}return out}
/* ---------- syntax highlight ---------- */
const HLR={};
function mk(l,ps){HLR[l]={c:ps.map(p=>p[0]),re:new RegExp(ps.map(p=>'('+p[1]+')').join('|'),'g')}}
const STR='"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'';
mk('python',[['cmt','#[^\\n]*'],['str',STR],['kw','\\b(?:def|class|if|elif|else|for|while|in|return|import|from|with|as|True|False|None|not|and|or|yield|break|continue|lambda|pass|self)\\b'],['fn','\\b(?:print|len|str|int|float|type|input|range|open|sum|abs|__init__|read)\\b'],['num','\\b\\d+\\.?\\d*\\b']]);
mk('javascript',[['cmt','//[^\\n]*'],['str',STR+'|`(?:[^`\\\\]|\\\\.)*`'],['kw','\\b(?:let|const|var|function|class|extends|if|else|for|while|return|new|await|async|import|export|from|true|false|null|undefined|yield|this|try|catch|of|in)\\b'],['fn','\\b(?:console|log|fetch|json|getElementById|querySelector|addEventListener|Math|floor|random|unshift|pop|push|some|setInterval|clearInterval|getContext|fillRect|alert|constructor|next|Set|Map)\\b'],['num','\\b\\d+\\.?\\d*\\b']]);
mk('julia',[['cmt','#[^\\n]*'],['str',STR],['kw','\\b(?:function|end|if|elseif|else|for|while|in|return|using|struct|mutable|true|false|nothing|do)\\b'],['fn','\\b(?:println|print|sum|rand|plot|uppercase|DataFrame|length|push!)\\b'],['num','\\b\\d+\\.?\\d*\\b']]);
mk('powershell',[['cmt','#[^\\n]*'],['str',STR],['var','\\$[A-Za-z_][\\w:]*'],['kw','\\b(?:if|else|elseif|foreach|for|while|function|param|return|try|catch|finally|in|switch)\\b|-(?:eq|ne|gt|lt|ge|le|and|or|not|match|Recurse|Descending|First|ItemType|Mandatory)\\b'],['fn','\\b(?:Write-Host|Read-Host|Get-ChildItem|Where-Object|Select-Object|Sort-Object|Get-Content|Set-Content|Add-Content|Test-Path|New-Item|Invoke-WebRequest|ConvertTo-Json|ConvertFrom-Json|Parameter)\\b'],['num','\\b\\d+(?:\\.\\d+)?(?:MB|KB|GB)?\\b']]);
mk('html',[['cmt','&lt;!--[\\s\\S]*?--&gt;|//[^\\n]*'],['str',STR],['tg','&lt;/?[a-zA-Z][\\w-]*|/?&gt;'],['at','\\b[a-z-]+(?==)'],['num','\\b\\d+\\b']]);
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function hl(code,lang){const r=HLR[lang]||HLR.python;const src=lang==='html'?esc(code):code;let out='',last=0,m;r.re.lastIndex=0;
while((m=r.re.exec(src))){out+=lang==='html'?src.slice(last,m.index):esc(src.slice(last,m.index));
for(let g=1;g<m.length;g++)if(m[g]!==undefined){out+='<span class="'+r.c[g-1]+'">'+(lang==='html'?m[g]:esc(m[g]))+'</span>';break}
last=r.re.lastIndex;if(m[0]==='')r.re.lastIndex++}
out+=lang==='html'?src.slice(last):esc(src.slice(last));return out}
/* ---------- langs ---------- */
const LANGS = [{"id":"python","n":"Python","m":"Py","c":"#3776ab","d":"Afficher, calculer"},{"id":"html","n":"HTML","m":"\u003c\u003e","c":"#e34f26","d":"Pages web"},{"id":"javascript","n":"JavaScript","m":"JS","c":"#c9a227","d":"Interactions"},{"id":"julia","n":"Julia","m":"Jl","c":"#9558b2","d":"Calcul scientifique"},{"id":"powershell","n":"PowerShell","m":"PS","c":"#2f6fd0","d":"Automatisation"},{"id":"swift","n":"Swift","m":"Sw","c":"#f05138","d":"iOS & Apple"},{"id":"c","n":"Langage C","m":"C","c":"#00599c","d":"Système & pointeurs"},{"id":"php","n":"PHP","m":"PHP","c":"#777bb4","d":"Web backend"},{"id":"cpp","n":"C++","m":"C++","c":"#004482","d":"Haute performance"},{"id":"csharp","n":"C#","m":"C#","c":"#68217a","d":".NET & Unity"},{"id":"rust","n":"Rust","m":"Rs","c":"#dea584","d":"Mémoire & sûreté"},{"id":"java","n":"Java","m":"Jv","c":"#ea2d2e","d":"Entreprise & JVM"},{"id":"kotlin","n":"Kotlin","m":"Kt","c":"#7f52ff","d":"Android & JVM moderne"},{"id":"dart","n":"Dart","m":"Dart","c":"#0175c2","d":"Flutter & Cross-platform"},{"id":"ruby","n":"Ruby","m":"Rb","c":"#cc342d","d":"Élégance & Ruby on Rails"},{"id":"css","n":"CSS3","m":"CSS","c":"#1572b6","d":"Styles & Animations web"},{"id":"json","n":"JSON","m":"{}","c":"#f5c518","d":"Format d'échange de données"}];
const LG=id=>LANGS.find(l=>l.id===id)||LANGS[0];
const NLV=id=>(CUR[id]?CUR[id].length:6);
const TOTLV=()=>LANGS.reduce((s,l)=>s+NLV(l.id),0);
const monoT=(l,cls)=>`<div class="mono${cls?' '+cls:''}"><svg viewBox="0 0 48 48"><use href="#l-${l.id}"/></svg></div>`;
/* ---------- titles / badges / quests ---------- */
const TITLES=[[0,'Novice'],[150,'Curieux'],[400,'Apprenti'],[800,'Codeur'],[1400,'Développeur'],[2200,'Expert'],[3200,'Architecte'],[4500,'Maître'],[6000,'Virtuose'],[8000,'Légende']];
function rankOf(xp){let i=0;for(let k=0;k<TITLES.length;k++)if(xp>=TITLES[k][0])i=k;
const cur=TITLES[i],nx=TITLES[i+1];return{lvl:i+1,name:cur[1],cur:xp-cur[0],need:nx?nx[0]-cur[0]:0,next:nx?nx[1]:null,pct:nx?Math.min(100,Math.round((xp-cur[0])/(nx[0]-cur[0])*100)):100}}
const BADGES=[
{id:'b1',n:'Premier pas',i:'i-play',t:p=>done(p)>=1},
{id:'b2',n:'5 niveaux',i:'i-check',t:p=>done(p)>=5},
{id:'b3',n:'15 niveaux',i:'i-medal',t:p=>done(p)>=15},
{id:'b4',n:'Tout Python',i:'i-term',t:p=>(p.dn.python||[]).filter(v=>v>0).length>=6},
{id:'b5',n:'Polyglotte',i:'i-globe',t:p=>Object.values(p.dn).filter(a=>a.some(v=>v>0)).length>=3},
{id:'b6',n:'1000 Codes',i:'i-coin',t:p=>p.tc>=1000},
{id:'b7',n:'Série de 7',i:'i-flame',t:p=>p.st>=7},
{id:'b8',n:'Sans faute',i:'i-star',t:p=>Object.values(p.dn).flat().some(v=>v===100)},
{id:'b9',n:'Snake 15',i:'i-snake',t:p=>p.sb>=15},
{id:'b10',n:'Combo x8',i:'i-bolt',t:p=>(p.mc||0)>=8},
{id:'b11',n:'Conteur',i:'i-book',t:p=>(p.sy.snake||[]).every(v=>v)},
{id:'b12',n:'Collection 10',i:'i-img',t:p=>p.av.length>=10}];
const done=p=>Object.values(p.dn).flat().filter(v=>v>0).length;
function checkBadges(){let got=[];BADGES.forEach(b=>{if(!P.bd.includes(b.id)&&b.t(P)){P.bd.push(b.id);got.push(b.n)}});
if(got.length){save();got.forEach((n,i)=>setTimeout(()=>toast('Badge débloqué : '+n,'s','i-medal'),400+i*1600))}}
const QP=[{id:'q1',n:'Termine 1 niveau',g:1,r:120,k:'lvl'},{id:'q2',n:'Réponds juste 12 fois',g:12,r:100,k:'ok'},{id:'q3',n:'Gagne 150 Codes',g:150,r:90,k:'cd'},{id:'q4',n:'Joue 2 langages',g:2,r:130,k:'lang'},{id:'q5',n:'Atteins un combo de 5',g:5,r:110,k:'cmb'},{id:'q6',n:'Termine 1 mission Histoire',g:1,r:150,k:'sty'}];
function quests(){const d=today();
if(!P.q||P.q.d!==d){const s=dayN(),ids=[];let i=0;while(ids.length<3&&i<30){const q=QP[Math.floor(rnd(s*3+i*11)*QP.length)];if(!ids.includes(q.id))ids.push(q.id);i++}
P.q={d,it:ids.map(id=>({id,v:0,c:0})),lg:[]};save()}
return P.q}
function bumpQuest(k,n){const q=quests();let ch=false;
q.it.forEach(it=>{const def=QP.find(x=>x.id===it.id);if(def.k!==k||it.c)return;
if(k==='cmb')it.v=Math.max(it.v,n);else it.v+=n;
if(it.v>=def.g){it.c=1;ch=true;P.cd+=def.r;P.tc+=def.r;toast('Quête terminée +'+def.r,'s','i-target')}});
if(ch||n)save();if(ch)paintNav()}
function chestReady(){return P.lc!==today()}
function claimChest(){if(!chestReady())return;const d=today(),y=new Date(Date.now()-864e5).toISOString().slice(0,10);
P.st=(P.ls===y||P.ls===d)?(P.ls===d?P.st:P.st+1):1;if(!P.ls)P.st=1;P.ls=d;P.lc=d;
const amt=60+Math.min(P.st,10)*20;P.cd+=amt;P.tc+=amt;save();checkBadges();
sfx('fanfare');triggerConfetti();
toast('Coffre : +'+amt+' Codes · série '+P.st+' j','s','i-chest');rHome()}
function touchStreak(){const d=today(),y=new Date(Date.now()-864e5).toISOString().slice(0,10);
if(P.ls===d)return;P.st=P.ls===y?P.st+1:1;P.ls=d;save()}
/* ---------- ui helpers ---------- */
// $ est déjà défini au début du fichier
const NAVS=['home','lv','set','stats','acc','shop','story','rec'];
function go(s){if(s!=='les')stopLessonTimer();document.querySelectorAll('.scr').forEach(e=>e.classList.remove('on'));const t=$(s);if(t)t.classList.add('on');window.scrollTo(0,0);
$('nav').style.display=NAVS.includes(s)?'flex':'none';
document.querySelectorAll('.nb').forEach(b=>b.classList.toggle('on',b.dataset.s===s));
if(s==='home')rHome()}
function cl(id){$(id).classList.remove('on')}
function ic(n,c){return `<svg class="ic${c?' '+c:''}"><use href="#${n}"/></svg>`}
function toast(m,t,i){const e=document.createElement('div');e.className='tst '+(t||'i');e.innerHTML=(i?ic(i):'')+'<span>'+m+'</span>';document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
function coinPop(x,y,n){const e=document.createElement('div');e.className='pop';e.innerHTML=ic('i-coin')+'+'+n;e.style.left=x+'px';e.style.top=y+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),950)}
function paintNav(){const q=quests(),pend=q.it.some(i=>!i.c)||chestReady();
document.querySelectorAll('.nb').forEach(b=>{const old=b.querySelector('.dot');if(old)old.remove();
if((b.dataset.s==='rec'&&pend)||(b.dataset.s==='shop'&&false)){const d=document.createElement('i');d.className='dot';b.appendChild(d)}})}
/* ---------- HOME ---------- */
function rHome(){$('h-cd').textContent=P.cd;
const stc=$('h-st');stc.style.cursor='pointer';stc.title='Voir le classement des séries de jours';stc.onclick=()=>{setLbCat('streak');setRecView('lb');go('rec');rRec();};stc.innerHTML=ic('i-flame')+'<b>'+P.st+'</b> jours';
const r=rankOf(P.xp),C=2*Math.PI*19;
const rkEl=$('h-rank');rkEl.style.cursor='pointer';rkEl.title='Voir le classement XP';rkEl.onclick=()=>{setLbCat('xp');setRecView('lb');go('rec');rRec();};
rkEl.innerHTML=`<div class="ring"><svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="19" fill="none" stroke="var(--bd)" stroke-width="4"/><circle cx="23" cy="23" r="19" fill="none" stroke="var(--nn)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-r.pct/100)}"/></svg><b>${r.lvl}</b></div>
<div style="flex:1;min-width:0"><div class="rk-t">${r.name}</div><div class="rk-s">${r.next?r.cur+' / '+r.need+' XP → '+r.next:'Rang maximum atteint'}</div></div>
<div style="text-align:right"><div class="rk-t" style="color:var(--nn)">${P.xp}</div><div class="rk-s">XP</div></div>`;
$('h-chest').innerHTML=chestReady()
?`<button class="btn p w" onclick="claimChest()" style="margin-bottom:.4rem">${ic('i-chest')} Ouvrir le coffre du jour</button>`
:`<div class="tgr" style="margin-bottom:.4rem"><span class="mut">${ic('i-check')} Coffre récupéré — reviens demain</span></div>`;
$('h-chest').innerHTML+=adBtn('margin-bottom:.4rem');
$('h-langs').innerHTML=LANGS.map(l=>{const d=(P.dn[l.id]||[]).filter(v=>v>0).length;
return `<div class="lg" onclick="pickLang('${l.id}')">${monoT(l)}<div class="lg-n">${l.n}</div><div class="lg-p">${d}/${NLV(l.id)} niveaux</div><button class="btn-lh-badge" onclick="event.stopPropagation();openLangHistory('${l.id}')" title="Histoire et anecdotes de ${l.n}">${ic('i-book')} Histoire</button></div>`}).join('');
renderSponsoredAds();
paintNav()}
/* ---------- LEVELS ---------- */
const locked=(l,i)=>i>0&&!(P.dn[l]||[])[i-1];
function pickLang(id){window.CL=id;rLevels()}
function rLevels(){const l=LG(CL),sc=P.dn[CL]||[],d=sc.filter(v=>v>0).length;
const h=LANG_HISTORY[CL]||{name:l.n,year:'1990+',creator:'Pionniers',subtitle:'Langage de programmation',genesis:'Langage moderne.'};
$('lv-body').innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:.8rem;margin-bottom:.4rem">
  <div style="display:flex;align-items:center;gap:.8rem">${monoT(l)}<div><h2>${l.n}</h2><span class="badge" style="margin-top:.2rem">Créé en ${h.year} · ${esc(h.creator.split('(')[0].trim())}</span></div></div>
  <button class="btn p" style="padding:.35rem .8rem;font-size:.8rem" onclick="openLangHistory('${CL}')">${ic('i-book')} Lire l'Histoire</button>
</div>

<!-- BANNIÈRE HISTOIRE DU LANGAGE -->
<div class="lang-hist-banner card" onclick="openLangHistory('${CL}')" style="margin:1rem 0">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem">
    <span style="display:inline-flex;align-items:center;gap:.4rem;font-weight:800;font-size:.82rem;color:var(--nn);text-transform:uppercase;letter-spacing:.05em">${ic('i-book')} Histoire & Genèse du langage</span>
    <span class="badge" style="background:var(--nn);color:#000;font-weight:800">Découvrir l'Histoire →</span>
  </div>
  <div style="font-weight:800;font-size:.96rem;margin-bottom:.25rem;color:var(--tx)">${esc(h.subtitle)}</div>
  <p class="mut" style="font-size:.82rem;margin:0;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(h.genesis)}</p>
</div>

<p class="mut" style="margin-bottom:1.1rem">Termine un niveau pour débloquer le suivant</p>
${Array.from({length:NLV(CL)},(_,i)=>i).map(i=>{const lk=locked(CL,i),s=sc[i]||0;
return `<div class="lvl${lk?' lk':s?' dn':''}" onclick="${lk?`toast('Termine le niveau '+${i}+' d\'abord','e','i-lock')`:`openIntro(${i})`}">
<div class="lnum d${i%6}">${lk?ic('i-lock'):i+1}</div>
<div style="flex:1;min-width:0"><div class="li-t">${THEME[CL][i]}</div><div class="li-d">${DESC[CL][i]}</div></div>
<div class="li-r">${s?`<div style="color:var(--gr);font-weight:800;font-size:.85rem">${s}%</div>`:`<span class="badge">Niv ${i+1}</span>`}</div></div>`}).join('')}
<div class="tgr" style="margin-top:.8rem;flex-direction:column;align-items:stretch;gap:.5rem"><div style="display:flex;justify-content:space-between"><span class="mut">Progression</span><b>${d}/${NLV(CL)}</b></div><div class="pbar"><i style="width:${d/NLV(CL)*100}%"></i></div></div>`;
go('lv')}
/* ---------- INTRO ---------- */
function openIntro(i){window.CI=i;const l=LG(CL),d=(INTRO[CL]&&INTRO[CL][i])||{o:[(DESC[CL][i]||'Nouvelles notions').split(', ').map(s=>'Découvrir '+s).join('|')].join('|').split('|'),e:[]},difL=['Débutant','Intermédiaire','Avancé','Expert','Maître','Légendaire','Confirmé','Chevronné','Vétéran','Élite','Champion','Sage','Héros','Mythique','Grand Maître','Virtuose','Prodige','Architecte','Visionnaire','Transcendant'],dif=difL[i]||('Niveau '+(i+1));
$('intro-body').innerHTML=`<div class="card" style="animation:fu .35s both">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem">${monoT(l)}<span class="badge">${l.n} · ${dif}</span></div>
<h2 style="font-size:1.4rem">${THEME[CL][i]}</h2><p class="mut" style="margin:.35rem 0 1.4rem">${DESC[CL][i]}</p>
<div class="sec"><div class="lbl">Ce que tu vas apprendre</div><ul class="obj">${d.o.map(o=>`<li>${ic('i-next')}<span>${o}</span></li>`).join('')}</ul></div>
<div class="sec"><div class="lbl">Exemples à retenir</div>${d.e.map(e=>`<div class="ex"><div class="ex-l">${e[0]}</div><div class="ex-c">${hl(e[1],CL)}</div></div>`).join('')}</div>
<div class="warn">${ic('i-warn')}<span>Les exemples aident à comprendre, mais les réponses ne sont pas données — à toi de jouer.</span></div>
<div class="row" style="margin-top:1.3rem"><button class="btn g" onclick="rLevels()">${ic('i-back')}Retour</button><button class="btn p" onclick="startLesson()">${ic('i-play')}C'est parti</button></div></div>`;
go('intro')}
/* ---------- LESSON ---------- */
let ST=[],SI=0,SC=0,AN=false,CB=0,MB=0,EC=0,MODE='lvl';
/* --- Sauvegarde de progression (session) --- */
const LSKEY = () => 'cq_les_' + (CL||'') + '_' + (CI||0);
function saveLessonProgress() {
  try { sessionStorage.setItem(LSKEY(), JSON.stringify({SI,SC,CB,MB,EC,ST_len:ST.length})); } catch(e) {}
}
function clearLessonProgress() {
  try { sessionStorage.removeItem(LSKEY()); } catch(e) {}
}
function startLesson(){
  MODE='lvl';
  startLessonTimer();
  const base = CUR[CL][CI]||[];
  // Tenter de reprendre là où on était
  try {
    const saved = JSON.parse(sessionStorage.getItem(LSKEY()));
    if (saved && saved.SI > 0 && saved.SI < saved.ST_len && saved.ST_len === base.length) {
      // Reprise : on repart des questions restantes (pas les retries ajoutées)
      ST = [...base]; SI = saved.SI; SC = saved.SC;
      CB = saved.CB; MB = saved.MB; EC = saved.EC;
      touchStreak();
      window.LT = LG(CL).n + ' · ' + THEME[CL][CI];
      toast('Reprise là où tu t\'étais — question ' + (SI+1), 'i', 'i-next');
      paintStep(); go('les'); return;
    }
  } catch(e) {}
  // Départ normal
  ST=[...base];SI=0;SC=0;CB=0;MB=0;EC=0;touchStreak();
  window.LT=LG(CL).n+' · '+THEME[CL][CI];paintStep();go('les');
}
function startMission(mi){
  MODE = 'sty';
  startLessonTimer();
  window.MI = mi;
  const w = SW;
  ST = w.ms[mi].st;
  SI = 0; SC = 0; CB = 0; MB = 0; EC = 0;
  touchStreak();
  window.LT = w.n + ' · ' + w.ms[mi].n;
  initTermForMission(w, mi);
  paintStep();
  go('les');
}
function quitLesson(){stopLessonTimer();clearInterval(window.STORY_CHRONO_IV);MODE==='sty'?(go('story'),rStory()):rLevels()}
function paintHdr(){$('l-s').textContent=(window.LT?window.LT+' — ':'')+'Question '+(SI+1)+' / '+ST.length;$('l-p').style.width=(SI/ST.length*100)+'%';
const c=$('l-cb');if(CB>=2){c.style.display='inline-flex';c.querySelector('span').textContent='Combo x'+mult()+' ('+CB+')'}else c.style.display='none'}
const mult=()=>CB>=7?3:CB>=5?2.5:CB>=3?2:CB>=2?1.5:1;
function paintStep(){
  if(SI>=ST.length){clearInterval(window.STORY_CHRONO_IV);return finish();}
  AN=false;
  // Reset and launch Chrono Hardcore if active
  clearInterval(window.STORY_CHRONO_IV);
  if (MODE === 'sty' && window.HARDCORE_STORY) {
    window.STORY_CHRONO_LEFT = 35;
    const bar = $('chrono-fill');
    if (bar) bar.style.width = '100%';
    window.STORY_CHRONO_IV = setInterval(() => {
      window.STORY_CHRONO_LEFT--;
      const b = $('chrono-fill');
      if (b) b.style.width = (window.STORY_CHRONO_LEFT / 35 * 100) + '%';
      if (window.STORY_CHRONO_LEFT <= 0) {
        clearInterval(window.STORY_CHRONO_IV);
        sfx('wrong');
        termLog('[ALERTE] Temps écoulé ! Échec de la réponse sous chrono.', 'err');
        toast('Temps écoulé ! Question manquée.', 'e', 'i-warn');
        if (!AN) {
          AN = true;
          setTimeout(() => { SI++; paintStep(); }, 1600);
        }
      }
    }, 1000);
  }

  const s=ST[SI],lang=MODE==='sty'?SW.lang:CL;
  // Mélanger chaque QCM une seule fois, en gardant chaque réponse liée à son statut correct.
  // Le marqueur évite un nouveau mélange lors d'un rafraîchissement ou d'une reprise.
  if (s.k === 'm' && Array.isArray(s.o) && !s._cqChoicesShuffled) {
    const choices = s.o.map((text, index) => ({ text, correct: index === Number(s.a) }));
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    s.o = choices.map(choice => choice.text);
    s.a = choices.findIndex(choice => choice.correct);
    s._cqChoicesShuffled = true;
  }
  paintHdr();

  if (MODE === 'sty') {
    // Dedicated Cyber-Terminal UI for Mode Histoire
    termLog('--- ÉTAPE ' + (SI+1) + '/' + ST.length + ' : ' + s.t + ' ---', 'cyan');
    termLog('[THEORIE] ' + s.th, 'info');

    let h = '<div class="term-box">' +
      '<div class="term-hdr">' +
        '<div class="term-dots"><span class="term-dot r"></span><span class="term-dot y"></span><span class="term-dot g"></span></div>' +
        '<div class="term-title">cq@cybercore:~/' + SW.id + '/mission_' + ((window.MI||0)+1) + '$ ./diagnostic.sh</div>' +
        '<div class="term-badge">' + (window.HARDCORE_STORY ? '<span style="color:#ef4444">⚡ CHRONO HARDCORE</span>' : '● TERMINAL ACTIF') + '</div>' +
        (window.HARDCORE_STORY ? '<div class="chrono-bar-wrap"><div id="chrono-fill" class="chrono-bar-fill"></div></div>' : '') +
      '</div>' +
      '<div id="term-screen" class="term-body-screen"></div>' +
      '<div class="term-prompt-line">' +
        '<span class="term-ps">root@cybercore:~$</span>' +
        '<input id="term-cmd-inp" class="term-input" placeholder="Tape ta commande (help, ls, cat, status, hint) ou ta réponse..." autocomplete="off" spellcheck="false" onkeydown="if(event.key===\'Enter\')handleTermSubmit()">' +
        '<button class="btn p" style="min-height:34px;padding:.2rem .8rem;font-size:.78rem;border-radius:10px" onclick="handleTermSubmit()">' + ic('i-play') + 'Exécuter</button>' +
      '</div>' +
    '</div>' +
    '<div class="q" style="margin-bottom:1rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">' +
        '<span class="tag2">' + ic('i-book') + 'Module : ' + s.t + '</span>' +
        '<button class="hb" id="hb" onclick="executeTermCommand(\'hint\')">' + ic('i-bulb') + 'Indice</button>' +
      '</div>' +
      '<div class="th" style="margin-bottom:.6rem">' + s.th + '</div>' +
      '<div class="cb">' + hl(s.c, lang) + '</div>' +
    '</div>' +
    '<div class="q">' +
      '<span class="tag2">' + ic('i-target') + (s.k === 'm' ? 'Options de Diagnostic' : 'Code à Insérer') + '</span>' +
      '<div class="qt" style="margin:.4rem 0 .8rem">' + s.q + '</div>';

    if (s.k === 'm') {
      h += s.o.map((o, i) => {
        return '<div class="opt" id="o' + i + '" onclick="typeIntoTermAndRun(\'' + esc(o).replace(/'/g, "\\'") + '\')">' +
          '<span class="ol">' + String.fromCharCode(65 + i) + '</span>' +
          '<span>' + esc(o) + '</span>' +
        '</div>';
      }).join('');
    } else {
      h += '<div class="row" style="margin-top:.6rem">' +
        '<input class="inp" id="f-ans" placeholder="' + (s.p || 'Code…') + '" style="flex:1" onkeydown="if(event.key===\'Enter\')typeIntoTermAndRun(this.value)">' +
        '<button class="btn p" onclick="typeIntoTermAndRun($(\'f-ans\').value)">' + ic('i-check') + 'Injecter</button>' +
      '</div>';
    }

    h += '<div class="term-quick-row">' +
      '<button class="term-qbtn" onclick="executeTermCommand(\'help\')">help</button>' +
      '<button class="term-qbtn" onclick="executeTermCommand(\'ls\')">ls</button>' +
      '<button class="term-qbtn" onclick="executeTermCommand(\'cat engine.js\')">cat code</button>' +
      '<button class="term-qbtn" onclick="executeTermCommand(\'status\')">status</button>' +
      '<button class="term-qbtn" onclick="executeTermCommand(\'clear\')">clear</button>' +
    '</div></div>';

    $('l-body').innerHTML = h;
    renderTermScreen();
    setTimeout(() => { const inp = $('term-cmd-inp'); if (inp) inp.focus(); }, 100);
    return;
  }

let h=`<div class="q"><span class="tag2">${ic('i-book')}Théorie</span><div class="th"><b>${s.t}</b><br>${s.th}</div><div class="cb">${hl(s.c,lang)}</div></div>
<div class="q"><div class="hr"><button class="hb" id="hb" ${P.hn?'':'disabled'} onclick="useHint()">${ic('i-bulb')}Indice (${P.hn})</button>${(!P.hn && ADS_AVAILABLE)?`<button class="hb ad-hb-btn" style="background:linear-gradient(135deg,var(--yl),var(--or));color:#fff" onclick="watchAd(this,'hn')">${ic('i-play')}Pub pour indices</button>`:''}</div>
<span class="tag2">${ic('i-target')}${s.k==='m'?'QCM':'Compléter'}</span><div class="qt">${s.q}</div>`;
if(s.k==='m')h+=s.o.map((o,i)=>`<div class="opt" id="o${i}" onclick="ansM(${i})"><span class="ol">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></div>`).join('');
else h+=`<input class="inp" id="fi" placeholder="${s.p||'Ta réponse…'}" autocomplete="off" onkeydown="if(event.key==='Enter')ansF()"><button class="btn p w" id="vb" onclick="ansF()">${ic('i-check')}Vérifier</button>`;
h+=`<div class="fb" id="fb"></div><div class="row" id="nx" style="display:none;margin-top:.8rem"><button class="btn p w" onclick="SI++;saveLessonProgress();paintStep()">${SI+1>=ST.length?'Voir les résultats':'Suivant'} ${ic('i-next')}</button></div></div>`;
$('l-body').innerHTML=h;if(s.k==='f')setTimeout(()=>$('fi')?.focus(),80)}
function useHint(){if(!P.hn||AN)return;P.hn--;save();const s=ST[SI];
if(s.k==='m'){const bad=s.o.map((_,i)=>i).filter(i=>i!==s.a&&!$('o'+i).classList.contains('el'));
if(bad.length>1){$('o'+bad[Math.floor(Math.random()*bad.length)]).classList.add('el');toast('Une mauvaise réponse éliminée','i','i-bulb')}}
else{const i=$('fi');i.value=String(s.a).slice(0,Math.ceil(String(s.a).length/2));i.focus();toast('Début de la réponse révélé','i','i-bulb')}
const b=$('hb');b.innerHTML=ic('i-bulb')+'Indice ('+P.hn+')';b.disabled=!P.hn}
function reward(el){CB++;MB=Math.max(MB,CB);SC++;const g=Math.round(6*mult());EC+=g;P.cd+=g;P.tc+=g;P.ta++;
const r=el.getBoundingClientRect();coinPop(r.left+r.width/2-18,r.top-6,g);
sfx('coin');
bumpQuest('ok',1);bumpQuest('cd',g);bumpQuest('cmb',CB);
if(CB===3||CB===5||CB===7)toast('Combo x'+mult()+' !','s','i-flame');save()}
function ansM(i){if(AN)return;trackLessonTime();AN=true;const s=ST[SI],ok=i===s.a;
document.querySelectorAll('.opt').forEach(o=>o.classList.add('ko'));
$('o'+i).classList.add(ok?'ok':'no');if(!ok)$('o'+s.a).classList.add('ok');
const f=$('fb');f.className='fb on '+(ok?'ok':'no');
if(!ok){
  // Ajouter la question à la fin pour la refaire
  ST.push(s);
  f.innerHTML='Pas tout à fait. '+s.x+' <span style="font-size:.78rem;opacity:.7">↩ Question ajoutée à la fin du niveau</span>';
} else { f.innerHTML=s.x; }
sfx(ok ? 'correct' : 'wrong');
ok?reward($('o'+i)):CB=0;paintHdr();$('nx').style.display='flex';
saveLessonProgress();}
/* Comparaison intelligente des réponses texte */
function normalizeAns(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');  // espaces multiples → un seul
}
function checkAnswer(typed, expected) {
  const t = normalizeAns(typed);
  // Supporte plusieurs réponses valides séparées par |
  const variants = String(expected).split('|').map(normalizeAns);
  for (const v of variants) {
    if (t === v) return true;
    // Accepte avec ou sans () à la fin : "pop" === "pop()"
    if (t === v.replace(/\(\)$/, '')) return true;
    if (t.replace(/\(\)$/, '') === v) return true;
  }
  return false;
}
function ansF(){if(AN)return;trackLessonTime();const s=ST[SI],i=$('fi'),v=(i.value||'').trim();
if(!v)return;const ok=checkAnswer(v, s.a);AN=true;i.classList.add(ok?'ok':'no');$('vb').disabled=true;
const f=$('fb');
if(!ok){
  // Ajouter la question à la fin pour la refaire
  ST.push(s);
  f.className='fb on no';
  f.innerHTML='La bonne réponse est <code>'+esc(String(s.a))+'</code>. '+s.x+' <span style="font-size:.78rem;opacity:.7">↩ Question ajoutée à la fin du niveau</span>';
} else {
  f.className='fb on ok';
  f.innerHTML=s.x;
}
sfx(ok ? 'correct' : 'wrong');
ok?reward(i):CB=0;paintHdr();$('nx').style.display='flex';
saveLessonProgress();}
function resButtons(pct,mode){
  const ad=`<div style="width:100%;margin-top:.6rem">${adBtn()}</div>`;
  if(mode==='sty') return `<button class="btn g" onclick="go('story');rStory()">${ic('i-redo')}Rejouer</button><button class="btn p" onclick="go('story');rStory()">Continuer ${ic('i-next')}</button>`+ad;
  if(pct<80) return `<button class="btn p w" onclick="openIntro(CI)" style="background:#ff4b4b;border-color:#c93b3b;width:100%">${ic('i-redo')} Recommencer — score insuffisant</button>`+ad;
  return `<button class="btn g" onclick="openIntro(CI)">${ic('i-redo')}Rejouer</button><button class="btn p" onclick="rLevels()">Continuer ${ic('i-next')}</button>`+ad;
}
function finish(){stopLessonTimer();clearLessonProgress();const t=ST.length,pct=Math.round(SC/t*100),xp=Math.round(pct)+25;
let bonus=pct===100?150:pct>=80?70:pct>=60?25:0;
P.cd+=bonus;P.tc+=bonus;P.xp+=xp;P.mc=Math.max(P.mc||0,MB);
if(MODE==='lvl'){P.dn[CL]=P.dn[CL]||[];P.dn[CL][CI]=Math.max(P.dn[CL][CI]||0,pct);
P.hi.unshift({l:CL,i:CI,s:SC,t,p:pct,d:Date.now()});if(P.hi.length>10)P.hi.pop();
bumpQuest('lvl',1);const q=quests();if(!q.lg.includes(CL)){q.lg.push(CL);bumpQuest('lang',1)}}
else{P.sy[SW.id] = P.sy[SW.id] || Array(SW.ms.length).fill(0);
P.sy[SW.id][MI] = 1;
bumpQuest('sty', 1);
if (P.sy[SW.id].length >= SW.ms.length && P.sy[SW.id].every(v => v)) {
  P.cd += SW.rw;
  P.tc += SW.rw;
}}
save();checkBadges();
try { syncOnlineLeaderboard(); } catch(e) {}
if (pct >= 80) { sfx('fanfare'); triggerConfetti(); } else { sfx(pct >= 50 ? 'correct' : 'wrong'); }
const st=pct>=90?3:pct>=65?2:pct>=35?1:0;
$('res-body').innerHTML=`<div class="em">${ic(pct>=80?'i-trophy':pct>=50?'i-medal':'i-trend')}</div>
<h2>${pct>=80?'Excellent !':pct>=50?'Bien joué':'Continue !'}</h2>
<div class="sc">${SC}/${t}</div>
<div class="stars">${[0,1,2].map(i=>`<svg class="ic f${i<st?'':' off'}"><use href="#i-star"/></svg>`).join('')}</div>
<div><span class="pill c">${ic('i-coin')}+${EC+bonus} Codes</span><span class="pill x">${ic('i-up')}+${xp} XP</span></div>
${MB>=3?`<p class="mut" style="margin-top:.6rem">Meilleur combo : x${MB>=7?3:MB>=5?2.5:2} (${MB} d'affilée)</p>`:''}
<p class="mut" style="margin:1rem 0 1.3rem">${MODE==='sty'?'Mission terminée — retourne au mode Histoire.':pct>=80?'Tu maîtrises ce niveau. Le suivant est débloqué.':'Refais le niveau pour améliorer ton score.'}</p>
<div class="row">${resButtons(pct,MODE)}</div>`;
go('res')}

/* ---------- COOKIE SESSION & AUTH ENGINE ---------- */
function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const ca = (document.cookie || '').split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
  } catch(e) {}
  return null;
}
function setCookie(name, value, days = 365) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
  } catch(e) {}
}
function deleteCookie(name) {
  try {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax";
  } catch(e) {}
}

let GATE_SELECTED_AVATAR = 'bot_green_code';

function renderGateAvatars() {
  const c = $('gate-avatars');
  if (!c) return;
  c.innerHTML = STARTER_BOTS.map(b => {
    return '<div class="gate-av-chip ' + (b === GATE_SELECTED_AVATAR ? 'on' : '') + '" onclick="selectGateAvatar(\'' + b + '\')">' +
      '<img src="' + avById(b).img + '" alt="' + b + '" onerror="this.src=\'favicon.png\'">' +
    '</div>';
  }).join('');
}

function selectGateAvatar(bot) {
  GATE_SELECTED_AVATAR = bot;
  renderGateAvatars();
}

function loginWithCookie() {
  const inp = $('gate-user-inp');
  const val = (inp ? inp.value : '').trim();
  if (!val) {
    toast('Entre un pseudo pour te connecter', 'e', 'i-warn');
    if (inp) inp.focus();
    return;
  }
  const remember = $('gate-cookie-chk') ? $('gate-cookie-chk').checked : true;
  if (remember) {
    setCookie('cq_session', val, 365);
    setCookie('cq_av', GATE_SELECTED_AVATAR, 365);
  }
  P.u = val;
  P.a = GATE_SELECTED_AVATAR || 'bot_green_code';
  if (!P.av.includes(P.a)) P.av.push(P.a);
  save();
  hideGate();
  rHome();
  rAcc();
  toast('Bienvenue ' + val + ' ! Session active via Cookie', 's', 'i-check');
}

function logoutUser() {
  if (GT && typeof google !== 'undefined' && google.accounts) {
    google.accounts.oauth2.revoke(GT, () => {});
  }
  GT = null;
  window.GU = null;
  sessionStorage.removeItem('gt');
  deleteCookie('cq_session');
  deleteCookie('cq_av');
  deleteCookie('cq_auth');
  deleteCookie('cq_google_user');
  deleteCookie('cq_user');
  P.u = null;
  save();
  location.reload();
}

function showGate() {
  if (typeof isLocalhost === 'function' && isLocalhost()) {
    hideGate();
    return;
  }
  const g = document.getElementById('gate');
  if (g) {
    g.style.display = 'flex';
    g.style.pointerEvents = 'auto';
    g.classList.remove('off');
  }
  const nav = document.getElementById('nav');
  if (nav) nav.style.display = 'none';
}

function hideGate() {
  const g = document.getElementById('gate');
  if (g) {
    g.classList.add('off');
    g.style.display = 'none';
    g.style.pointerEvents = 'none';
  }
  const nav = document.getElementById('nav');
  if (nav) nav.style.display = 'flex';
  if (typeof go === 'function') go('home');
}
window.showGate = showGate;
window.hideGate = hideGate;



/* ---------- REAL COOKIE CONSENT CMP ENGINE (RGPD & ADSENSE) ---------- */
function getCookieConsent() {
  try {
    const c = getCookie('cq_cookie_consent');
    if (c) return JSON.parse(c);
  } catch(e) {}
  return null;
}

function saveCookieConsent(consent) {
  consent.date = Date.now();
  setCookie('cq_cookie_consent', JSON.stringify(consent), 365);
  applyCookieConsent(consent);
  hideCookieBanner();
}

function acceptAllCookies() {
  saveCookieConsent({ essential: true, ads: true, analytics: true });
  toast('Tous les cookies et annonces acceptés', 's', 'i-check');
}

function refuseAllCookies() {
  saveCookieConsent({ essential: true, ads: false, analytics: false });
  toast('Cookies publicitaires et analytiques refusés', 'i', 'i-info');
}

function saveCustomCookiePreferences() {
  const ads = $('chk-cookie-ads') ? $('chk-cookie-ads').checked : true;
  const analytics = $('chk-cookie-analytics') ? $('chk-cookie-analytics').checked : true;
  saveCookieConsent({ essential: true, ads, analytics });
  cl('m-cookie-settings');
  toast('Préférences de cookies enregistrées', 's', 'i-check');
}

function openCookieSettingsModal() {
  const consent = getCookieConsent() || { essential: true, ads: true, analytics: true };
  if ($('chk-cookie-ads')) $('chk-cookie-ads').checked = !!consent.ads;
  if ($('chk-cookie-analytics')) $('chk-cookie-analytics').checked = !!consent.analytics;
  $('m-cookie-settings').classList.add('on');
}

function applyCookieConsent(consent) {
  if (!consent) return;
  if (consent.ads) {
    window.ADS_AVAILABLE = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 0;
    } catch(e) {}
  } else {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
    } catch(e) {}
  }
  if (typeof updateAdButtons === 'function') updateAdButtons();
}

function showCookieBanner() {
  const b = $('cookie-banner');
  if (b) b.classList.remove('off');
}

function hideCookieBanner() {
  const b = $('cookie-banner');
  if (b) b.classList.add('off');
}

function openLegalModal(type) {
  const icon = $('m-legal-icon');
  const title = $('m-legal-title');
  const body = $('m-legal-body');
  if (!body) return;

  if (type === 'privacy') {
    if (icon) icon.textContent = '🔒';
    if (title) title.textContent = 'Politique de Confidentialité';
    body.innerHTML = `
      <p style="margin-bottom:.8rem"><b>Dernière mise à jour : 27 octobre 2026</b></p>
      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">1. Données personnelles collectées</h4>
      <p style="margin-bottom:.6rem">CodeQuest respecte la vie privée de ses utilisateurs conformément au RGPD. Les données de progression (XP, leçons, Codes) sont enregistrées localement dans votre navigateur ou sur votre Google Drive personnel si vous choisissez la synchronisation Google.</p>
      
      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">2. Mesure d'audience & Google Analytics</h4>
      <p style="margin-bottom:.6rem">Nous utilisons Google Analytics (ID : G-RHR7ZZW0G2) pour mesurer l'utilisation des cours de manière anonyme afin d'optimiser les parcours d'apprentissage.</p>

      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">3. Publicités & Partenaires (Google AdSense)</h4>
      <p style="margin-bottom:.6rem">Les annonces sont diffusées par Google AdSense (ca-pub-6944459801487481). Vous pouvez refuser la personnalisation des annonces à tout moment via le gestionnaire de cookies.</p>

      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">4. Gestion de vos données</h4>
      <p style="margin-bottom:.6rem">Vous pouvez exporter votre sauvegarde ou supprimer vos données de jeu en un clic dans la rubrique « Compte ».</p>
    `;
  } else {
    if (icon) icon.textContent = '📜';
    if (title) title.textContent = 'Mentions Légales';
    body.innerHTML = `
      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">1. Éditeur de la plateforme</h4>
      <p style="margin-bottom:.6rem">CodeQuest Studio — Projet éducatif interactif pour l'apprentissage du code et de l'informatique.</p>
      
      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">2. Hébergeur</h4>
      <p style="margin-bottom:.6rem">La plateforme est hébergée par <b>Netlify, Inc.</b>, 44 Montgomery St, Suite 300, San Francisco, CA 94104, USA.</p>

      <h4 style="margin:.8rem 0 .3rem;color:var(--ink)">3. Propriété intellectuelle</h4>
      <p style="margin-bottom:.6rem">Les cours, quiz et systèmes interactifs sont conçus par CodeQuest. Les marques et logos de langages (Python, Google, JavaScript, Rust...) appartiennent à leurs détenteurs respectifs.</p>
    `;
  }
  const m = $('m-legal');
  if (m) m.classList.add('on');
}
window.openLegalModal = openLegalModal;

/* ---------- CYBER-TERMINAL SIMULATOR (MODE HISTOIRE) ---------- */
let TERM_LOGS = [];
let TERM_INPUT_VAL = '';

function termLog(msg, type = 'info') {
  const time = new Date().toTimeString().split(' ')[0];
  TERM_LOGS.push({ time, msg, type });
  if (TERM_LOGS.length > 50) TERM_LOGS.shift();
  renderTermScreen();
}

function clearTerm() {
  TERM_LOGS = [];
  renderTermScreen();
}

function renderTermScreen() {
  const s = $('term-screen');
  if (!s) return;
  s.innerHTML = TERM_LOGS.map(l => {
    let col = '#c9d1d9';
    if (l.type === 'err') col = '#ff5f56';
    else if (l.type === 'succ') col = '#38ef7d';
    else if (l.type === 'warn') col = '#ffbd2e';
    else if (l.type === 'cyan') col = '#22d3ee';
    else if (l.type === 'cmd') col = '#58a6ff';
    return '<div style="color:' + col + ';margin-bottom:.2rem"><span style="color:#6e7681">[' + l.time + ']</span> ' + esc(l.msg) + '</div>';
  }).join('');
  s.scrollTop = s.scrollHeight;
}

function initTermForMission(w, mi) {
  TERM_LOGS = [
    { time: 'BOOT', msg: 'CodeQuest Cyber-Kernel v4.19 (x86_64) initialisé.', type: 'cyan' },
    { time: 'INIT', msg: 'Connexion au nœud : ' + w.n + ' (Mission ' + (mi+1) + ' : ' + w.ms[mi].n + ')', type: 'info' },
    { time: 'SCAN', msg: 'Corruption détectée dans le sous-système. Résolution requise.', type: 'warn' },
    { time: 'HELP', msg: 'Commandes utiles : "help", "ls", "cat", "status", "hint", "clear". Tape ta réponse ci-dessous.', type: 'info' }
  ];
}

function handleTermSubmit() {
  const inp = $('term-cmd-inp');
  if (!inp) return;
  const cmd = inp.value.trim();
  if (!cmd) return;
  inp.value = '';
  executeTermCommand(cmd);
}

function executeTermCommand(raw) {
  const cmd = raw.trim();
  termLog('user@cybercore:~$ ' + cmd, 'cmd');
  const lower = cmd.toLowerCase();

  if (lower === 'help') {
    termLog('--- COMMANDES CYBER-TERMINAL ---', 'cyan');
    termLog('  ls             : Lister les fichiers du sous-système', 'info');
    termLog('  cat <fichier>  : Inspecter le code source du fichier', 'info');
    termLog('  status         : Afficher l\'intégrité du système et le combo', 'info');
    termLog('  hint           : Afficher l\'indice de l\'IA CodeQuest', 'info');
    termLog('  clear          : Nettoyer l\'écran du terminal', 'info');
    termLog('  <réponse/code> : Injecter directement la solution au diagnostic', 'info');
    return;
  }
  if (lower === 'clear' || lower === 'cls') {
    clearTerm();
    return;
  }
  if (lower === 'ls' || lower === 'dir') {
    const w = SW, mi = window.MI || 0;
    termLog('~/engine/' + w.id + '/ : [canvas_engine.js]  [' + w.id + '_core.js]  [diagnostics.sys]  [tests.sh]', 'cyan');
    return;
  }
  if (lower.startsWith('cat ')) {
    const file = cmd.slice(4).trim();
    const s = ST[SI];
    termLog('Affichage du fichier ' + file + ' :', 'cyan');
    termLog(s.c || '// Fichier vide', 'info');
    return;
  }
  if (lower === 'status') {
    termLog('Intégrité système : ' + Math.round(SC/ST.length*100) + '% | Combo : x' + mult() + ' | Étape : ' + (SI+1) + '/' + ST.length, 'cyan');
    return;
  }
  if (lower === 'hint') {
    useHint();
    const s = ST[SI];
    termLog('IA-DIAGNOSTIC : ' + (s.x || 'Relis attentivement le code source et la théorie.'), 'warn');
    return;
  }

  // Check if answer matches current step
  const s = ST[SI];
  if (!s) return;

  if (s.k === 'f') {
    // Fill in the blank: compare with s.a
    if (cleanAnswer(cmd) === cleanAnswer(s.a)) {
      termLog('[+] Diagnostic validé ! Injection du correctif réussie.', 'succ');
      sfx('correct');
      nextStepAfterTerm(true);
    } else {
      termLog('[-] Échec d\'assertion : "' + cmd + '" n\'est pas la réponse attendue.', 'err');
      termLog('[-] Tape "hint" pour obtenir de l\'aide.', 'warn');
      sfx('wrong');
    }
    return;
  }

  if (s.k === 'm') {
    // Check if user typed option letter ('A', 'B', 'C', 'D') or full text of correct option
    const letters = ['a', 'b', 'c', 'd'];
    const idxLetter = letters.indexOf(lower);
    if (idxLetter !== -1 && idxLetter < s.o.length) {
      ansM(idxLetter);
      return;
    }
    // Check if user typed the text of the correct option
    const correctText = cleanAnswer(s.o[s.a] || '');
    if (cleanAnswer(cmd) === correctText) {
      ansM(s.a);
      return;
    }
    // Check if user typed any option
    let chosen = -1;
    for (let i = 0; i < s.o.length; i++) {
      if (cleanAnswer(cmd) === cleanAnswer(s.o[i])) { chosen = i; break; }
    }
    if (chosen !== -1) {
      ansM(chosen);
      return;
    }

    termLog('[-] Commande ou réponse non reconnue : "' + cmd + '"', 'err');
    termLog('[-] Choisis une option ci-dessous ou tape "help".', 'warn');
  }
}

function cleanAnswer(str) {
  return String(str || '').toLowerCase().replace(/['"\s\(\);]/g, '');
}

function typeIntoTermAndRun(val) {
  const inp = $('term-cmd-inp');
  if (inp) inp.value = val;
  executeTermCommand(val);
}

function nextStepAfterTerm(isCorrect) {
  if (isCorrect) {
    SC++; CB++; if (CB > MB) MB = CB;
    touchStreak();
  } else {
    CB = 0;
  }
  SI++;
  setTimeout(() => { paintStep(); }, 400);
}

/* ---------- ACCOUNT ---------- */
function rAcc(){const b=$('acc-body');
if(!P.u){window.SA='bot_green_code';
b.innerHTML=`<div class="card"><h2 style="text-align:center">Crée ton profil</h2>
<p class="mut" style="text-align:center;margin:.4rem 0 1.4rem">Un pseudo et une icône pour débloquer la boutique et les records</p>
<div class="lbl">Pseudo</div><input class="inp" id="nu" placeholder="Ex : SuperDev42" maxlength="20" style="font-family:var(--fh)">
<p class="mut" style="font-size:.72rem;margin:-.4rem 0 1rem">3 à 20 caractères · lettres, chiffres, _ et -</p>
<div class="lbl">Icône de départ · 5 offertes</div>
<div class="avg" id="sg">${AV.filter(a=>a.r==='f').map(a=>`<button class="avi${a.id==='a0'?' on':''}" title="${a.n}" onclick="pickSA(this,'${a.id}')">${avSVG(a.id)}</button>`).join('')}</div>
<button class="btn p w" style="margin-top:1.2rem" onclick="mkProfile()">${ic('i-check')}Créer mon compte</button>
<p class="mut" style="text-align:center;margin:1rem 0 .7rem">ou</p>
<button class="btn g w" onclick="gIn()">${ic('i-google')}Continuer avec Google</button></div>`;return}
const r=rankOf(P.xp);
b.innerHTML=`<div class="card"><div class="avb" onclick="openAv()">${myAv()}</div>
<div class="un">${esc(P.u)}</div><p class="mut" style="text-align:center">${r.name} · niveau ${r.lvl}</p>
<div style="text-align:center;margin:1rem 0"><span class="pill c">${ic('i-coin')}${P.cd} Codes</span></div>
<div class="hero3"><div class="h3i"><div class="h3n">${P.xp}</div><div class="h3l">XP</div></div>
<div class="h3i"><div class="h3n">${done(P)}</div><div class="h3l">Niveaux</div></div>
<div class="h3i"><div class="h3n">${P.av.length}</div><div class="h3l">Icônes</div></div></div>
<div class="row c">
<button class="btn g w" onclick="openAv()">${ic('i-img')}Changer d'icône</button>
<button class="btn g w" onclick="renameUser()">${ic('i-edit')}Changer de pseudo · 350 Codes</button>
<button class="btn p w" onclick="go('shop');rShop()">${ic('i-cart')}Boutique</button>
<button class="btn g w" style="margin-top:.6rem;color:var(--rd);border-color:var(--rd)" onclick="logoutUser()">${ic('i-close')}Se déconnecter (Purger Cookie)</button></div>
<div style="margin-top:1.2rem;padding-top:1.1rem;border-top:1px solid var(--bd)">
<button class="btn g w" id="gset" onclick="!window.GU&&gIn()" style="${window.GU?'opacity:.5;pointer-events:none;cursor:default':''}"> ${ic('i-google')}${window.GU?'✓ Connecté via Google':'Synchroniser avec Google'}</button>
<p class="mut" style="font-size:.74rem;margin:.7rem 0 .4rem">${window.GU?'Sauvegarde en ligne Google active.':'Mode Invité : progression gardée sur cet appareil.'} Tu peux aussi l\'enregistrer dans un fichier.</p>
<div class="row c"><button class="btn g w" onclick="exportSave()">${ic('i-check')}Exporter ma sauvegarde</button><button class="btn g w" onclick="importSave()">${ic('i-play')}Importer une sauvegarde</button></div></div></div>`}
function pickSA(el,id){document.querySelectorAll('#sg .avi').forEach(e=>e.classList.remove('on'));el.classList.add('on');window.SA=id}
function mkProfile(){const v=($('nu').value||'').trim();
if(v.length<3||v.length>20)return toast('Pseudo : 3 à 20 caractères','e','i-warn');
if(!/^[\w-]+$/.test(v))return toast('Lettres, chiffres, _ et - seulement','e','i-warn');
P.u=v;P.a=window.SA||'a0';save();toast('Bienvenue '+v,'s','i-check');rAcc();rHome()}
function renameUser(){if(P.cd<350)return toast('Il te faut 350 Codes','e','i-coin');
const v=(prompt('Nouveau pseudo (3 à 20 caractères) :')||'').trim();if(!v)return;
if(v.length<3||v.length>20||!/^[\w-]+$/.test(v))return toast('Pseudo invalide','e','i-warn');
P.cd-=350;P.u=v;save();toast('Pseudo changé · -350 Codes','s','i-check');rAcc()}
function openAv(filterColor){
window.AV_FILTER = filterColor || 'all';
const filters = [
  { k: 'all', l: 'Tous' },
  { k: 'green', l: '🟢 Vert' },
  { k: 'silver', l: '⚪ Argent' },
  { k: 'bronze', l: '🟤 Cuivre' },
  { k: 'pink', l: '🌸 Rose' },
  { k: 'red', l: '🔴 Rubis' },
  { k: 'gold', l: '⭐ Or' }
];
const fBar = `<div style="display:flex;gap:.3rem;margin-bottom:.9rem;flex-wrap:wrap;justify-content:center">` +
  filters.map(f => `<button class="badge" style="cursor:pointer;padding:.3rem .6rem;background:${window.AV_FILTER===f.k?'var(--nn)':'var(--bg)'};color:${window.AV_FILTER===f.k?'#fff':'var(--mu)'}" onclick="openAv('${f.k}')">${f.l}</button>`).join('') +
  `</div>`;
const filtered = P.av.filter(id => {
  if (window.AV_FILTER === 'all') return true;
  return id.includes('_' + window.AV_FILTER + '_');
});
$('m-av-g').innerHTML = fBar + (filtered.length ? `<div class="avg">` + filtered.map(id=>{const a=avById(id);
return `<button class="avi${id===P.a?' on':''}" title="${a.n} · ${RAR[a.r].n}" onclick="pickAv(this,'${id}')">${avSVG(id)}</button>`}).join('') + `</div>` : `<p class="mut" style="text-align:center;padding:1.5rem">Aucun robot de cette série débloqué.<br>Rends-toi dans la <b>Boutique</b> !</p>`);
window.PA=P.a;$('m-av').classList.add('on')}
function pickAv(el,id){document.querySelectorAll('#m-av-g .avi').forEach(e=>e.classList.remove('on'));el.classList.add('on');window.PA=id;sfx('click')}
function setAv(){if(window.PA){P.a=window.PA;save();sfx('fanfare');rAcc();rHome();toast('Robot équipé !','s','i-check')}cl('m-av')}
/* Publicités vidéo payées et approuvées */
let CQ_ADS_CACHE = [], CQ_ADS_FETCHED_AT = 0;
async function renderSponsoredAds(force = false) {
  const host = $('h-langs');
  if (!host) return;
  let slot = $('cq-sponsored-slot');
  if (!slot) { slot = document.createElement('div'); slot.id = 'cq-sponsored-slot'; host.parentNode.insertBefore(slot, host); }
  if (force || Date.now() - CQ_ADS_FETCHED_AT > 60000) {
    try {
      const res = await fetch('/api/active-ads', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.ads)) CQ_ADS_CACHE = data.ads;
      CQ_ADS_FETCHED_AT = Date.now();
    } catch (e) {}
  }
  const valid = CQ_ADS_CACHE.filter(a => a && /^[A-Za-z0-9_-]{11}$/.test(a.videoId));
  slot.innerHTML = valid.map(a => `<article class="card" style="margin:0 0 1rem;border:1px solid var(--nn)">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.6rem"><b>${esc(a.title || 'Vidéo')}</b><span class="badge" style="background:var(--nn);color:#06121a">Sponsorisé</span></div>
    <div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#05070e">
      <iframe src="https://www.youtube-nocookie.com/embed/${a.videoId}" title="${esc(a.title || 'Vidéo sponsorisée')}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
  </article>`).join('');
}
/* ---------- SHOP ---------- */
function rShop(){const d=dailyShop(),tm=new Date(Date.now()+864e5).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
$('shop-body').innerHTML=`<div class="hd"><h2>Boutique</h2><span class="pill c">${ic('i-coin')}${P.cd}</span></div>

<!-- CODES GRATUITS (PUB) -->
<div class="card ad-shop-card" style="${ADS_AVAILABLE?'':'display:none;'}margin-bottom:1.2rem;background:linear-gradient(135deg,rgba(255,200,0,.09),rgba(255,150,0,.09));border:2px solid var(--yl);border-radius:18px;padding:1.15rem">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.65rem">
    <div style="display:flex;align-items:center;gap:.65rem">
      <div style="width:42px;height:42px;border-radius:12px;background:rgba(255,200,0,.2);display:flex;align-items:center;justify-content:center;font-size:1.45rem">🎬</div>
      <div>
        <div style="font-weight:900;font-size:1rem;color:var(--ink)">Codes Gratuits</div>
        <div class="mut" style="font-size:.76rem">Regarde une courte vidéo pour gagner des Codes !</div>
      </div>
    </div>
    <span class="badge" style="background:var(--yl);color:#000;font-weight:900">+100 CODES</span>
  </div>
  <button class="btn p w" style="background:linear-gradient(135deg,var(--yl),var(--or));border-color:var(--or-d);color:#fff;font-weight:900" onclick="watchAd(this, 'cd')">
    ${ic('i-play')} Regarder une pub · +100 Codes gratuits
  </button>
</div>

<div class="lbl" style="display:flex;justify-content:space-between;align-items:center"><span>Icônes du jour</span>
<button class="sr-b" style="font-size:.68rem;padding:.25rem .55rem;min-height:0" onclick="showRar()">${ic('i-info')}Chances</button></div>
<p class="mut" style="font-size:.72rem;margin:-.3rem 0 .6rem">Renouvelées le ${tm} · tirage pondéré par rareté</p>
<div class="dgr">${d.map(a=>{const own=P.av.includes(a.id),R=RAR[a.r];
return `<div class="dc"><i class="tp"></i>${avSVG(a.id,56)}
<div class="dc-n">${a.n}</div><span class="rar ${R.c}">${R.n}</span>
<div class="pct">${R.w}% de chance d'apparaître</div>
<div class="dc-p">${ic('i-coin')}${a.pr}</div>
<button class="btn ${own?'g':'p'} w" style="min-height:38px;font-size:.8rem" ${own||P.cd<a.pr?'disabled':''} onclick="buyAv('${a.id}')">${own?ic('i-check')+'Possédée':P.cd<a.pr?'Trop cher':'Acheter'}</button></div>`}).join('')}</div>
<div class="lbl" style="margin-top:1.3rem">Objets</div>
<div class="sr">${ic('i-bulb')}<div class="sr-i"><div class="sr-n">Pack de 3 indices</div><div class="sr-d">Tu en as ${P.hn}</div></div>
<button class="sr-b" ${P.cd<200?'disabled':''} onclick="buyHints()">${ic('i-coin')}200</button></div>
<div class="sr">${ic('i-edit')}<div class="sr-i"><div class="sr-n">Changer de pseudo</div><div class="sr-d">Nouveau nom d'utilisateur</div></div>
<button class="sr-b" ${P.cd<350?'disabled':''} onclick="renameUser()">${ic('i-coin')}350</button></div>
<div class="lbl" style="margin-top:1.3rem">Code promo ou cadeau 🎁</div>
<div style="display:flex;gap:.5rem;margin-top:.4rem">
  <input class="inp" id="promo-code-in" placeholder="Ex: CODEQUEST, DEV2026..." style="text-transform:uppercase;font-family:var(--fh);flex:1" onkeydown="if(event.key==='Enter')redeemPromoCode()">
  <button class="btn p" style="white-space:nowrap" onclick="redeemPromoCode()">${ic('i-check')}Valider</button>
</div>
<div class="lbl" style="margin-top:1.3rem">Recharger</div>
<p class="mut" style="font-size:.74rem;margin:-.3rem 0 .6rem">Tu gagnes aussi des Codes en jouant, chaque jour et à chaque bonne réponse.</p>
<div class="pg">${[
  {id:'pack_500',   codes:500,   prix:'0,99 €', best:false},
  {id:'pack_1500',  codes:1500,  prix:'2,49 €', best:false},
  {id:'pack_3000',  codes:3000,  prix:'4,99 €', best:true },
  {id:'pack_7000',  codes:7000,  prix:'9,99 €', best:false},
  {id:'pack_15000', codes:15000, prix:'19,99 €', best:false},
  {id:'pack_30000', codes:30000, prix:'34,99 €', best:false},
  {id:'pack_50000', codes:50000, prix:'49,99 €', best:false}
].map(pk=>`<div class="pc${pk.best?' bst':''}">
  ${pk.best?'<div class="bst-lbl">⭐ Meilleur rapport</div>':''}
  <div class="pc-c">${ic('i-coin')}${pk.codes.toLocaleString('fr-FR')}</div>
  <div class="pc-p">${pk.prix}</div>
  <button class="btn p w" data-pack="${pk.id}" onclick="buyPack('${pk.id}')"
    style="margin-top:.5rem;min-height:36px;font-size:.82rem">Acheter</button>
</div>`).join('')}</div>
<p class="mut" style="font-size:.7rem;text-align:center;margin-top:.7rem">
  Paiement sécurisé par Stripe · codes promo acceptés directement lors du paiement.<br>
  ${STRIPE_ENABLED?'':'<b>Mode démo</b> — active Stripe dans la config pour encaisser.'}
</p>
<div class="card" style="margin-top:1.2rem;border:1px solid var(--nn);background:linear-gradient(145deg,rgba(34,211,238,.08),rgba(124,58,237,.08))">
  <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.45rem"><div style="font-size:1.7rem">📺</div><div><b style="font-size:1rem">Faire connaître ta vidéo</b><div class="mut" style="font-size:.74rem">Ta vidéo YouTube peut apparaître sur l'accueil de CodeQuest.</div></div></div>
  <label class="lbl" for="cq-ad-title">Titre de la publicité</label>
  <input class="inp" id="cq-ad-title" maxlength="60" placeholder="Ex : Découvre ma chaîne !">
  <label class="lbl" for="cq-ad-url" style="margin-top:.6rem">Lien de ta vidéo YouTube</label>
  <input class="inp" id="cq-ad-url" type="url" placeholder="https://youtu.be/xxxxxxxxxxx">
  <label class="lbl" for="cq-ad-plan" style="margin-top:.6rem">Durée et prix</label>
  <select class="inp" id="cq-ad-plan"><option value="ad_1">1 jour — 2,99 €</option><option value="ad_7">7 jours — 9,99 €</option><option value="ad_30">30 jours — 24,99 €</option></select>
  <button class="btn p w" style="margin-top:.8rem" onclick="buyVideoAd()">▶ Payer et proposer ma vidéo</button>
  <p class="mut" style="font-size:.68rem;margin:.6rem 0 0">Paiement sécurisé. La vidéo est vérifiée avant d'être affichée. Seuls les liens YouTube sont acceptés pour le moment.</p>
</div>
`}
const PROMO_CODES = {
  'CODEQUEST': { codes: 500, desc: 'Pack découverte CodeQuest' },
  'DEV2026':   { codes: 300, desc: 'Bonus développeur 2026' },
  'PYTHON':    { codes: 250, desc: 'Bonus serpent d\'or' },
  'WELCOME':   { codes: 200, desc: 'Cadeau de bienvenue' },
  'CHAMPION':  { codes: 400, desc: 'Bonus Hacker Pro' }
};
function redeemPromoCode(){
  const inp=$('promo-code-in');if(!inp)return;
  const raw=(inp.value||'').trim().toUpperCase();
  if(!raw)return toast('Tape un code promo','w','i-warn');
  P.rc=P.rc||[];
  if(P.rc.includes(raw))return toast('Code déjà utilisé sur ce compte','e','i-warn');
  const gift=PROMO_CODES[raw];
  if(!gift)return toast('Code invalide ou expiré','e','i-close');
  P.rc.push(raw);P.cd+=gift.codes;P.tc=(P.tc||0)+gift.codes;save();
  inp.value='';sfx('fanfare');triggerConfetti();
  toast('+'+gift.codes+' Codes reçus ! ('+gift.desc+') 🎉','s','i-coin');
  rShop();rHome();
}
function showRar(){$('m-rar-b').innerHTML=`<p class="mut" style="margin-bottom:.9rem">Chaque jour, 2 icônes sont tirées au sort. La rareté détermine la probabilité d'apparition :</p>
${['c','r','e','l'].map(k=>{const R=RAR[k],n=POOL[k].length,own=POOL[k].filter(a=>P.av.includes(a.id)).length;
return `<div class="rec"><span class="rar ${R.c}">${R.n}</span><span class="mut">${n} icônes · ${own} obtenues</span><b style="color:var(--nn)">${R.w}%</b></div>`}).join('')}
<div class="rtab" style="margin-top:.9rem">${['c','r','e','l'].map(k=>`<div><b style="color:var(--nn)">${RAR[k].p}</b><span class="mut">${RAR[k].n}</span></div>`).join('')}</div>
<p class="mut" style="font-size:.72rem;margin-top:.8rem">Prix en Codes. Les 5 icônes de départ ne sont jamais vendues.</p>`;
$('m-rar').classList.add('on')}
function buyAv(id){if(!P.u){toast('Crée ton compte d\'abord','e','i-user');go('acc');return rAcc()}
const a=avById(id);if(P.av.includes(id))return;if(P.cd<a.pr)return toast('Pas assez de Codes','e','i-coin');
P.cd-=a.pr;P.av.push(id);save();checkBadges();
sfx('fanfare');triggerConfetti();
toast(a.n+' débloqué avec succès ! 🎉','s','i-check');rShop()}
function buyHints(){if(!P.u){toast('Crée ton compte d\'abord','e','i-user');go('acc');return rAcc()}
if(P.cd<200)return toast('Pas assez de Codes','e','i-coin');P.cd-=200;P.hn+=3;save();toast('+3 indices','s','i-bulb');rShop()}
/* ---------- STORY ---------- */

function getStoryTier(wIdx) {
  if (wIdx < 7) return { label: "Niveau I · Fondations", col: "#22c55e", bg: "rgba(34,197,94,.12)" };
  if (wIdx < 15) return { label: "Niveau II · Systèmes & Crypto", col: "#38bdf8", bg: "rgba(56,189,248,.12)" };
  if (wIdx < 23) return { label: "Niveau III · Réseaux & Algorithmes", col: "#a855f7", bg: "rgba(168,85,247,.12)" };
  if (wIdx < 30) return { label: "Niveau IV · Moteurs & Bas-Niveau", col: "#f59e0b", bg: "rgba(245,158,11,.12)" };
  return { label: "Niveau V · Hardcore Cyber & IA", col: "#ef4444", bg: "rgba(239,68,68,.15)" };
}

function rStory(){
  if(window.SW) return rMissions();
  const totalCompleted = WORLDS.filter(w => {
    const pr = (P.sy && P.sy[w.id]) || [];
    return pr.length >= w.ms.length && pr.every(Boolean);
  }).length;

  $('story-body').innerHTML = `<h2>Mode Histoire (${WORLDS.length} Mondes)</h2>
  <p class="mut" style="margin:.3rem 0 1.1rem">Résous les missions sur le Cyber-Terminal pour restaurer chaque système, puis lance les programmes réels.</p>

  <!-- BANNIÈRE DÉFI HARDCORE -->
  <div class="hardcore-banner">
    <div style="display:flex;align-items:center;gap:.7rem">
      <span style="font-size:1.4rem">⚡</span>
      <div>
        <b style="color:var(--tx);font-size:.95rem">Défi Chrono Cyber-Hardcore</b>
        <div class="mut" style="font-size:.76rem">35s par question · +50% XP et récompenses en Codes accrues</div>
      </div>
    </div>
    <label class="switch">
      <input type="checkbox" id="chk-hardcore" ${window.HARDCORE_STORY ? 'checked' : ''} onchange="toggleHardcoreStory(this.checked)">
      <span class="slider round"></span>
    </label>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem;font-size:.82rem">
    <span class="mut">Progression des Mondes : <b>${totalCompleted}/${WORLDS.length}</b> terminés</span>
    <span class="badge" style="background:rgba(56,189,248,.12);color:var(--nn)">${Math.round(totalCompleted/WORLDS.length*100)}%</span>
  </div>` +

  WORLDS.map((w, wIdx) => {
    const pr = (P.sy && P.sy[w.id]) || Array(w.ms.length).fill(0);
    const d = pr.filter(Boolean).length;
    const prevW = wIdx > 0 ? WORLDS[wIdx - 1] : null;
    const prevPr = prevW ? (P.sy && P.sy[prevW.id]) : null;
    const isUnlocked = wIdx === 0 || (
      Array.isArray(prevPr) &&
      prevPr.length >= prevW.ms.length &&
      prevPr.every(Boolean)
    );
    const tier = getStoryTier(wIdx);
    return `<div class="wc${isUnlocked ? '' : ' lk'}" onclick="${isUnlocked ? `SW=WORLDS[${wIdx}];rMissions()` : `toast('Termine le monde précédent d\'abord','e','i-lock')`}">
      <div class="wb" style="background:linear-gradient(135deg,${tier.bg},rgba(139,92,246,.1))">${ic(wIdx === 0 ? 'i-snake' : wIdx === 1 ? 'i-grid' : wIdx % 3 === 0 ? 'i-lock' : wIdx % 3 === 1 ? 'i-code' : 'i-target')}</div>
      <div class="wi">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="story-tier-badge" style="color:${tier.col};background:${tier.bg};border:1px solid ${tier.col}44">${tier.label}</span>
          <span class="mut" style="font-size:.72rem">Monde ${wIdx + 1}</span>
        </div>
        <h3 style="font-size:1.02rem;margin-bottom:.2rem">${w.n}</h3>
        <p class="mut" style="margin:.2rem 0 .7rem;font-size:.82rem;line-height:1.4">${w.d}</p>
        <div style="display:flex;justify-content:space-between;margin-bottom:.45rem;font-size:.74rem">
          <span class="mut">${d}/${w.ms.length} missions · prime ${w.rw} Codes</span>
          ${d === w.ms.length ? '<b style="color:var(--gr)">Terminé ✓</b>' : isUnlocked ? '<b style="color:var(--nn)">Débloqué</b>' : '<b style="color:var(--mu)">Verrouillé 🔒</b>'}
        </div>
        <div class="pbar"><i style="width:${d / w.ms.length * 100}%"></i></div>
      </div>
    </div>`;
  }).join('');
}

function rMissions(){
  const w = SW, pr = (P.sy && P.sy[w.id]) || Array(w.ms.length).fill(0), all = pr.length >= w.ms.length && pr.every(Boolean);
  const tier = getStoryTier(WORLDS.indexOf(w));
  $('story-body').innerHTML = `<button class="bk" onclick="SW=null;rStory()">${ic('i-back')} Tous les Mondes</button>
  <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
    <span class="story-tier-badge" style="color:${tier.col};background:${tier.bg};border:1px solid ${tier.col}44">${tier.label}</span>
    <span class="badge" style="font-size:.72rem">Langage : ${w.lang.toUpperCase()}</span>
  </div>
  <h2 style="margin-bottom:.4rem">${w.n}</h2>
  <p class="mut" style="margin-bottom:1.2rem;line-height:1.5">${w.d}</p>
  ${w.ms.map((m, i) => {
    const dn = pr[i];
    const lk = i > 0 && !pr[i - 1];
    return `<div class="ms${dn ? ' dn' : lk ? ' lk' : ''}" onclick="${lk ? `toast('Termine la mission précédente d\'abord','e','i-lock')` : `startMission(${i})`}">
      ${ic(lk ? 'i-lock' : m.i)}
      <div style="flex:1;min-width:0"><div class="li-t">${m.n}</div><div class="li-d">${m.d} · ${m.st.length} étapes</div></div>
      <span class="ms-s">${ic(dn ? 'i-check' : lk ? 'i-lock' : 'i-play')}</span>
    </div>`;
  }).join('')}
  ${all ? `<div class="rw">
    <h3 style="color:var(--nn)">Système restauré et optimisé avec succès !</h3>
    <p class="mut" style="margin:.35rem 0 .9rem">Toutes les missions de ce monde sont résolues. Prime de ${w.rw} Codes débloquée.</p>
    <button class="btn p w" onclick="${w.id==='snake'?'openSnake()':w.id==='breaker'?'openBreaker()':w.id==='space'?'openSpace()':w.id==='flappy'?'openFlappy()':w.id==='memory'?'openMemory()':w.id==='pong'?'openPong()':w.id==='runner'?'openRunner()':`toast('Simulation système validée ! ${w.rw} Codes accordés.','s','i-trophy')`}">${ic('i-play')} Lancer ${w.n}</button>
  </div>` : ''}`;
  go('story');
}

/* ---------- CLASSEMENTS & RECORDS EN LIGNE (100% VRAIS JOUEURS) ---------- */
let REC_VIEW = 'lb'; // 'lb' (classements) ou 'rec' (records & quêtes)
let LB_CAT = 'xp';   // 'xp', 'coins', 'time', 'streak'
// STRICTEMENT AUCUN BOT : filtrage immédiat et nettoyage du stockage local
let REAL_PLAYERS = (LS('cq_real_players', []) || []).filter(p => p && p.isReal === true && !p.isBot && p.uid && p.uid !== P.uid);
SS('cq_real_players', REAL_PLAYERS);
let IS_SYNCING_LB = false;
let LAST_LB_SYNC = 0;

function setRecView(v){REC_VIEW=v;sfx('click');rRec()}
function setLbCat(c){LB_CAT=c;sfx('click');rRec()}

async function syncOnlineLeaderboard(force = false) {
  if (IS_SYNCING_LB) return;
  const now = Date.now();
  if (!force && now - LAST_LB_SYNC < 10000) return;
  IS_SYNCING_LB = true;

  try {
    const payload = {
      uid: P.uid,
      u: P.u || 'Invité',
      a: P.a || 'bot_silver_code',
      xp: P.xp || 0,
      cd: P.cd || 0,
      tl: P.tl || 0,
      st: P.st || 0,
      isReal: true
    };

    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.players)) {
        // Uniquement les vrais joueurs humains sans aucun bot
        REAL_PLAYERS = data.players.filter(p => p && p.isReal === true && !p.isBot && p.uid && p.uid !== P.uid);
        SS('cq_real_players', REAL_PLAYERS);
        LAST_LB_SYNC = Date.now();
        if (typeof rRec === 'function' && REC_VIEW === 'lb') rRec();
      }
    }
  } catch (err) {
    // Mode hors-ligne / PWA
  } finally {
    IS_SYNCING_LB = false;
  }
}

function shareMyProfileLink() {
  const base = window.location.origin + window.location.pathname;
  const url = `${base}?cqu=${encodeURIComponent(P.u || 'Codeur')}&cqxp=${P.xp}&cqcd=${P.cd}&cqst=${P.st}&cqtl=${P.tl || 0}&cqa=${encodeURIComponent(P.a)}&cquid=${encodeURIComponent(P.uid)}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => toast('Lien de défi copié ! Envoie-le à tes amis pour les affronter en direct 🎮', 's', 'i-check'))
      .catch(() => prompt('Copie ce lien pour inviter un vrai joueur :', url));
  } else {
    prompt('Copie ce lien pour inviter un vrai joueur :', url);
  }
}

// Détection d'un défi partagé par un ami via l'URL
(function checkRivalUrl(){
  try {
    const params = new URLSearchParams(window.location.search);
    const rU = params.get('cqu');
    if (rU) {
      const rXp = parseInt(params.get('cqxp'), 10) || 0;
      const rCd = parseInt(params.get('cqcd'), 10) || 0;
      const rSt = parseInt(params.get('cqst'), 10) || 0;
      const rTl = parseInt(params.get('cqtl'), 10) || 0;
      const rA = params.get('cqa') || 'bot_green_code';
      const rUid = params.get('cquid') || ('rival_' + rU.toLowerCase().replace(/\s+/g, '_'));

      if (rUid !== P.uid) {
        const rival = {
          uid: rUid,
          u: rU.trim().slice(0, 25),
          a: rA,
          xp: rXp,
          cd: rCd,
          tl: rTl,
          st: rSt,
          isReal: true,
          updatedAt: Date.now()
        };
        const idx = REAL_PLAYERS.findIndex(p => p.uid === rUid);
        if (idx >= 0) REAL_PLAYERS[idx] = rival;
        else REAL_PLAYERS.unshift(rival);
        SS('cq_real_players', REAL_PLAYERS);

        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rival)
        }).catch(() => {});

        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          toast(`🎮 Vrai joueur ajouté au classement : ${rival.u} (${rival.xp} XP) !`, 's', 'i-trophy');
          syncOnlineLeaderboard(true);
        }, 1000);
      }
    }
  } catch(e) {}
})();

// Démarrer la synchro initiale
setTimeout(() => syncOnlineLeaderboard(), 1200);

const LB_CATEGORIES = {
  xp: {
    id: 'xp',
    name: 'XP',
    full: 'Classement Général XP',
    desc: 'Expérience réelle accumulée par les joueurs en validant des niveaux.',
    icon: 'i-bolt',
    col: 'var(--nn)',
    key: 'xp',
    fmt: v => (v || 0).toLocaleString('fr-FR') + ' XP'
  },
  coins: {
    id: 'coins',
    name: 'Pièces',
    full: 'Classement des Pièces (Codes)',
    desc: 'Codes réels récoltés dans les coffres, cours et quêtes.',
    icon: 'i-coin',
    col: 'var(--yl)',
    key: 'cd',
    fmt: v => (v || 0).toLocaleString('fr-FR') + ' Codes'
  },
  time: {
    id: 'time',
    name: 'Temps',
    full: 'Temps Passé à Faire des Leçons',
    desc: 'Temps réel chronométré passé activement à apprendre et coder.',
    icon: 'i-clock',
    col: 'var(--gr)',
    key: 'tl',
    fmt: v => fmtLessonTime(v || 0)
  },
  streak: {
    id: 'streak',
    name: 'Série',
    full: 'Classement de Série de Jours',
    desc: 'Jours consécutifs réels d\'apprentissage sans interruption.',
    icon: 'i-flame',
    col: 'var(--or)',
    key: 'st',
    fmt: v => (v || 0) + ' jour' + ((v || 0) > 1 ? 's' : '')
  }
};

function getLeague(xp){
  if(xp>=3500)return{name:'Ligue Diamant',badge:'💎',col:'#00e5ff'};
  if(xp>=2000)return{name:'Ligue Saphir',badge:'🔷',col:'#1cb0f6'};
  if(xp>=1000)return{name:'Ligue Or',badge:'🥇',col:'#ffc800'};
  if(xp>=400)return{name:'Ligue Argent',badge:'🥈',col:'#cbd5e1'};
  return{name:'Ligue Bronze',badge:'🥉',col:'#d97706'};
}

function rRec(){
  const q=quests(),r=rankOf(P.xp),league=getLeague(P.xp);
  const cat=LB_CATEGORIES[LB_CAT]||LB_CATEGORIES.xp;

  // Synchronisation en direct
  syncOnlineLeaderboard();

  const me={
    id:'me',
    uid:P.uid,
    isMe:true,
    isReal:true,
    u:P.u||'Toi (Invité)',
    a:P.a||'bot_green_code',
    xp:P.xp||0,
    cd:P.cd||0,
    tl:P.tl||0,
    st:P.st||0,
    title:r.name
  };

  // Liste des VRAIS joueurs exclusivement (aucun bot)
  const realList = REAL_PLAYERS.map(p => ({
    ...p,
    isMe: false,
    isReal: true,
    title: rankOf(p.xp || 0).name
  }));

  const allPlayers = [...realList, me];

  allPlayers.sort((a,b)=>{
    const diff=(b[cat.key]||0)-(a[cat.key]||0);
    if(diff!==0)return diff;
    return a.isMe?-1:1;
  });

  const myRank=allPlayers.findIndex(p=>p.isMe)+1;
  const top3=allPlayers.slice(0,3);
  const rest=allPlayers.slice(3);
  const totalReal = allPlayers.length;

  let html=`<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.3rem">
    <h2>Classement en Direct</h2>
    <span class="badge" style="background:var(--sf);border-color:${league.col};color:var(--ink);font-weight:900">${league.badge} ${league.name}</span>
  </div>
  <p class="mut" style="margin-bottom:.7rem">Classement 100% réel avec les vrais joueurs connectés.</p>

  <!-- BARRE EN DIRECT & ACTIONS -->
  <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;background:var(--cd);border:2px solid var(--bd);border-radius:14px;padding:.55rem .85rem;margin-bottom:1rem;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:.45rem;font-size:.78rem;font-weight:900;color:var(--gr)">
      <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e"></span>
      <span>${totalReal} vrai${totalReal>1?'s':''} joueur${totalReal>1?'s':''} en ligne</span>
    </div>
    <div style="display:flex;gap:.4rem">
      <button class="btn g" style="padding:.3rem .65rem;font-size:.74rem;min-height:30px;border-radius:10px" onclick="syncOnlineLeaderboard(true);toast('Classement actualisé en direct 🌐','s','i-check')" title="Actualiser le classement en ligne">${ic('i-redo')} Actualiser</button>
      <button class="btn b" style="padding:.3rem .65rem;font-size:.74rem;min-height:30px;border-radius:10px" onclick="shareMyProfileLink()" title="Inviter un ami">${ic('i-globe')} Défier un ami</button>
    </div>
  </div>

  <div class="lb-subtabs">
    <button class="lb-subtab${REC_VIEW==='lb'?' on':''}" onclick="setRecView('lb')">${ic('i-trophy')} Classements</button>
    <button class="lb-subtab${REC_VIEW==='rec'?' on':''}" onclick="setRecView('rec')">${ic('i-target')} Records & Quêtes</button>
  </div>`;

  if(REC_VIEW==='lb'){
    html+=`
    <!-- 4 CATÉGORIES -->
    <div class="lb-cat-grid">
      <button class="lb-cat-btn${LB_CAT==='xp'?' on':''}" onclick="setLbCat('xp')">
        <span class="lb-cat-ico" style="color:var(--nn)">${ic('i-bolt')}</span>
        <span class="lb-cat-txt">XP</span>
        <span class="lb-cat-val">${(P.xp||0).toLocaleString('fr-FR')}</span>
      </button>
      <button class="lb-cat-btn${LB_CAT==='coins'?' on':''}" onclick="setLbCat('coins')">
        <span class="lb-cat-ico" style="color:var(--yl)">${ic('i-coin')}</span>
        <span class="lb-cat-txt">Pièces</span>
        <span class="lb-cat-val">${(P.cd||0).toLocaleString('fr-FR')}</span>
      </button>
      <button class="lb-cat-btn${LB_CAT==='time'?' on':''}" onclick="setLbCat('time')">
        <span class="lb-cat-ico" style="color:var(--gr)">${ic('i-clock')}</span>
        <span class="lb-cat-txt">Temps</span>
        <span class="lb-cat-val">${fmtLessonTime(P.tl||0)}</span>
      </button>
      <button class="lb-cat-btn${LB_CAT==='streak'?' on':''}" onclick="setLbCat('streak')">
        <span class="lb-cat-ico" style="color:var(--or)">${ic('i-flame')}</span>
        <span class="lb-cat-txt">Série</span>
        <span class="lb-cat-val">${P.st||0} j</span>
      </button>
    </div>

    <div class="card" style="margin-bottom:1rem;background:linear-gradient(135deg,var(--cd),var(--sf));padding:1rem 1.15rem">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:900;font-size:.95rem;color:var(--ink)">${cat.full}</div>
          <div class="mut" style="font-size:.76rem;margin-top:.15rem">${cat.desc}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.15rem;font-weight:900;color:${cat.col}">${cat.fmt(me[cat.key])}</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--mu)">Rang #${myRank} / ${totalReal}</div>
        </div>
      </div>
    </div>

    <!-- PODIUM 100% VRAIS JOUEURS -->
    ${totalReal === 1 ? `
    <div style="background:var(--cd);border:2px solid var(--bd);border-radius:20px;padding:1.4rem;text-align:center;margin-bottom:1.1rem;box-shadow:0 8px 24px rgba(0,0,0,.04)">
      <div style="font-size:1.8rem;color:var(--yl);margin-bottom:.3rem">${ic('i-crown')}</div>
      <div style="display:inline-block;position:relative;margin-bottom:.6rem">
        <span class="lb-pod-medal m1" style="position:absolute;top:-6px;right:-6px;z-index:2">1</span>
        <div class="lb-pod-av" style="width:68px;height:68px;margin:0 auto;border:3px solid var(--yl)">${avSVG(top3[0].a, 64)}</div>
      </div>
      <div style="font-size:1.15rem;font-weight:900;color:var(--ink)">${esc(top3[0].u)}${top3[0].isMe?' <b class="me-tag">Toi</b>':''}</div>
      <div style="font-size:1.3rem;font-weight:900;color:var(--yl);margin:.3rem 0">${cat.fmt(top3[0][cat.key])}</div>
      <div style="display:inline-flex;align-items:center;gap:.35rem;background:rgba(34,197,94,.12);color:var(--gr);padding:.35rem .8rem;border-radius:99px;font-size:.78rem;font-weight:900">
        <span style="width:7px;height:7px;border-radius:50%;background:#22c55e"></span> Seul joueur en ligne actuellement
      </div>
    </div>
    ` : totalReal === 2 ? `
    <div class="lb-podium" style="grid-template-columns:1fr 1fr;max-width:320px;margin:0 auto 1.2rem">
      <!-- 2ème Place -->
      <div class="lb-pod-item p2${top3[1].isMe?' me':''}">
        <div class="lb-pod-avatar-wrap">
          <span class="lb-pod-medal m2">2</span>
          <div class="lb-pod-av">${avSVG(top3[1].a, 48)}</div>
        </div>
        <div class="lb-pod-name">${esc(top3[1].u)}${top3[1].isMe?' <b class="me-tag">Toi</b>':''}</div>
        <div class="lb-pod-score">${cat.fmt(top3[1][cat.key])}</div>
        <div class="lb-pod-bar bar-2"><span class="lb-pod-rank">2</span></div>
      </div>

      <!-- 1ère Place -->
      <div class="lb-pod-item p1${top3[0].isMe?' me':''}">
        <div class="lb-pod-crown">${ic('i-crown')}</div>
        <div class="lb-pod-avatar-wrap">
          <span class="lb-pod-medal m1">1</span>
          <div class="lb-pod-av">${avSVG(top3[0].a, 56)}</div>
        </div>
        <div class="lb-pod-name">${esc(top3[0].u)}${top3[0].isMe?' <b class="me-tag">Toi</b>':''}</div>
        <div class="lb-pod-score" style="color:var(--yl);font-weight:900">${cat.fmt(top3[0][cat.key])}</div>
        <div class="lb-pod-bar bar-1"><span class="lb-pod-rank">1</span></div>
      </div>
    </div>
    ` : `
    <div class="lb-podium">
      <!-- 2ème Place -->
      <div class="lb-pod-item p2${top3[1].isMe?' me':''}">
        <div class="lb-pod-avatar-wrap">
          <span class="lb-pod-medal m2">2</span>
          <div class="lb-pod-av">${avSVG(top3[1].a, 48)}</div>
        </div>
        <div class="lb-pod-name">${esc(top3[1].u)}${top3[1].isMe?' <b class="me-tag">Toi</b>':''}</div>
        <div class="lb-pod-score">${cat.fmt(top3[1][cat.key])}</div>
        <div class="lb-pod-bar bar-2"><span class="lb-pod-rank">2</span></div>
      </div>

      <!-- 1ère Place -->
      <div class="lb-pod-item p1${top3[0].isMe?' me':''}">
        <div class="lb-pod-crown">${ic('i-crown')}</div>
        <div class="lb-pod-avatar-wrap">
          <span class="lb-pod-medal m1">1</span>
          <div class="lb-pod-av">${avSVG(top3[0].a, 56)}</div>
        </div>
        <div class="lb-pod-name">${esc(top3[0].u)}${top3[0].isMe?' <b class="me-tag">Toi</b>':''}</div>
        <div class="lb-pod-score" style="color:var(--yl);font-weight:900">${cat.fmt(top3[0][cat.key])}</div>
        <div class="lb-pod-bar bar-1"><span class="lb-pod-rank">1</span></div>
      </div>

      <!-- 3ème Place -->
      <div class="lb-pod-item p3${top3[2].isMe?' me':''}">
        <div class="lb-pod-avatar-wrap">
          <span class="lb-pod-medal m3">3</span>
          <div class="lb-pod-av">${avSVG(top3[2].a, 44)}</div>
        </div>
        <div class="lb-pod-name">${esc(top3[2].u)}${top3[2].isMe?' <b class="me-tag">Toi</b>':''}</div>
        <div class="lb-pod-score">${cat.fmt(top3[2][cat.key])}</div>
        <div class="lb-pod-bar bar-3"><span class="lb-pod-rank">3</span></div>
      </div>
    </div>`}

    <!-- Si moins de 3 joueurs connectés, afficher le bouton d'invitation -->
    ${totalReal < 3 ? `
    <div class="card" style="margin-top:1rem;margin-bottom:1.2rem;text-align:center;padding:1.3rem;background:linear-gradient(135deg,rgba(88,204,2,.07),rgba(28,176,246,.07));border:2px dashed var(--nn)">
      <div style="font-size:2.2rem;margin-bottom:.3rem">👥</div>
      <h3 style="font-size:1.02rem;margin-bottom:.3rem">Classement 100% Vrais Joueurs</h3>
      <p class="mut" style="font-size:.82rem;margin-bottom:1rem;line-height:1.45">
        Aucun robot ni fausse donnée ! Ce classement réunit uniquement de vrais humains. Envoie ton lien de défi à tes amis pour qu'ils rejoignent le classement en un clic avec leurs vrais scores.
      </p>
      <button class="btn b w" onclick="shareMyProfileLink()">
        ${ic('i-globe')} Défier un ami (Lien direct)
      </button>
    </div>` : ''}`;

    // LISTE DU CLASSEMENT (si plus de 3 joueurs)
    if (rest.length > 0) {
      html += `
      <div class="lb-list">
        ${rest.map((p, idx) => {
          const rk = idx + 4;
          return `<div class="lb-row${p.isMe ? ' me' : ''}">
            <span class="lb-rank">#${rk}</span>
            <div class="lb-av">${avSVG(p.a, 38)}</div>
            <div class="lb-info">
              <div class="lb-name">
                <span>${esc(p.u)}</span>
                ${p.isMe ? '<b class="me-tag">Toi</b>' : ''}
              </div>
              <div class="lb-title">${esc(p.title || 'Développeur')}</div>
            </div>
            <div class="lb-score">${cat.fmt(p[cat.key])}</div>
          </div>`;
        }).join('')}
      </div>`;
    }

    if (myRank > 3) {
      const prev = allPlayers[myRank - 2];
      const gap = prev ? Math.max(1, (prev[cat.key] || 0) - (me[cat.key] || 0)) : 0;
      const gapText = cat.id === 'time' ? fmtLessonTime(gap) : gap.toLocaleString('fr-FR') + ' ' + (cat.id === 'xp' ? 'XP' : cat.id === 'coins' ? 'Codes' : 'j');
      html += `<div class="lb-sticky">
        <div class="lb-sticky-r">#${myRank}</div>
        <div class="lb-av" style="width:34px;height:34px">${myAv()}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.82rem;font-weight:900;color:var(--ink)">Ta position : <b>#${myRank}</b></div>
          <div class="mut" style="font-size:.72rem">Plus que <b>${gapText}</b> pour dépasser #${myRank - 1} !</div>
        </div>
        <div class="lb-score" style="color:var(--gr);font-size:.9rem">${cat.fmt(me[cat.key])}</div>
      </div>`;
    }
  } else {
    html += `<div class="card" style="margin-bottom:1rem"><div style="display:flex;align-items:center;gap:.85rem">
    <div style="width:52px;height:52px;flex:0 0 auto">${myAv()}</div>
    <div style="flex:1;min-width:0"><div class="li-t">${esc(P.u||'Invité')}</div><div class="li-d">${r.name} · niveau ${r.lvl}</div></div>
    <div style="text-align:right"><div style="color:var(--nn);font-weight:800">${P.xp}</div><div class="li-d">XP</div></div></div></div>
    <div class="lbl">Quêtes du jour</div>
    ${q.it.map(it=>{const d=QP.find(x=>x.id===it.id),v=Math.min(it.v,d.g);
    return `<div class="qst${it.c?' dn':''}">${ic(it.c?'i-check':'i-target')}<div class="qst-i"><div class="qst-n">${d.n}</div>
    <div class="qbar"><i style="width:${v/d.g*100}%"></i></div></div>
    <span class="qst-r">${ic('i-coin')}${d.r}</span></div>`}).join('')}
    <div class="lbl" style="margin-top:1.2rem">Meilleurs scores</div>
    ${LANGS.map(l=>{const sc=P.dn[l.id]||[],b=Math.max(0,...sc),d=sc.filter(v=>v>0).length;
    return `<div class="lrow">${monoT(l,'sm')}<span class="lrow-n">${l.n}</span><div class="lrow-b"><i style="width:${d/NLV(l.id)*100}%"></i></div><span class="lrow-v">${b?b+'%':'—'}</span></div>`}).join('')}
    <div class="lbl" style="margin-top:1.2rem">Personnels</div>
    <div class="rec"><span>Série la plus longue</span><b style="color:var(--or)">${P.st} jours</b></div>
    <div class="rec"><span>Temps passé à faire des leçons</span><b style="color:var(--nn)">${fmtLessonTime(P.tl||0)}</b></div>
    <div class="rec"><span>Meilleur combo</span><b style="color:var(--nn)">${P.mc||0} d'affilée</b></div>
    <div class="rec"><span>Record Snake</span><b style="color:var(--yl)">${P.sb||0}</b></div>
    <div class="rec"><span>Codes gagnés au total</span><b style="color:var(--nn)">${P.tc||0}</b></div>
    <div class="rec"><span>Bonnes réponses</span><b style="color:var(--gr)">${P.ta||0}</b></div>
    <div class="lbl" style="margin-top:1.2rem">Badges · ${P.bd.length}/${BADGES.length}</div>
    <div class="bg-g">${BADGES.map(b=>`<div class="bg${P.bd.includes(b.id)?' on':''}">${ic(b.i)}<div class="bg-n">${b.n}</div></div>`).join('')}</div>`;
  }

  $('rec-body').innerHTML=html;
  paintNav();
}
/* ---------- STATS ---------- */
function rStats(){const dn=done(P),all=Object.values(P.dn).flat(),best=all.length?Math.max(0,...all):0;
$('stats-body').innerHTML=`<div class="hd"><h2>Statistiques</h2><button class="x" style="position:static" onclick="go('home')">${ic('i-close')}</button></div>
<div class="hero3" style="grid-template-columns:repeat(4,1fr)"><div class="h3i"><div class="h3n">${P.xp}</div><div class="h3l">XP total</div></div>
<div class="h3i"><div class="h3n">${dn}</div><div class="h3l">Niveaux</div></div>
<div class="h3i"><div class="h3n">${fmtLessonTime(P.tl||0)}</div><div class="h3l">Temps</div></div>
<div class="h3i"><div class="h3n">${best?best+'%':'—'}</div><div class="h3l">Meilleur</div></div></div>
<div class="sec"><div class="lbl">Progression globale</div><div class="pbar"><i style="width:${dn/TOTLV()*100}%"></i></div>
<p class="mut" style="font-size:.75rem;margin-top:.35rem">${dn} / ${TOTLV()} niveaux terminés</p></div>
<div class="sec"><div class="lbl">Par langage</div>
${LANGS.map(l=>{const sc=P.dn[l.id]||[],d=sc.filter(v=>v>0).length;
return `<div class="lrow">${monoT(l,'sm')}<span class="lrow-n">${l.n}</span><div class="lrow-b"><i style="width:${d/NLV(l.id)*100}%"></i></div><span class="lrow-v">${d}/${NLV(l.id)}</span></div>`}).join('')}</div>
<div class="sec"><div class="lbl">Dernières parties</div>
${P.hi.length?P.hi.map(h=>{const l=LG(h.l),st=h.p>=90?3:h.p>=65?2:1;
return `<div class="hist"><div style="display:flex;align-items:center;gap:.55rem;min-width:0">${monoT(l,'sm')}
<div style="min-width:0"><div>${l.n} · niveau ${h.i+1}</div><div class="li-d">${new Date(h.d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div></div>
<div style="text-align:right;flex:0 0 auto"><b style="color:var(--nn)">${h.s}/${h.t}</b><div class="stars" style="justify-content:flex-end;gap:.1rem;margin:0">${[0,1,2].map(i=>`<svg class="ic f${i<st?'':' off'}" style="width:12px;height:12px"><use href="#i-star"/></svg>`).join('')}</div></div></div>`}).join(''):'<p class="emp">Aucune partie encore.</p>'}</div>`}
/* ---------- SETTINGS ---------- */
let TH=LS('cq_t','light'),FS=LS('cq_f','f2'),SND=LS('cq_s',true),ANI=LS('cq_a',true),NOT=LS('cq_n',true);
function rSet(){$('set-body').innerHTML=`<div class="hd"><h2>Paramètres</h2><button class="x" style="position:static" onclick="go('home')">${ic('i-close')}</button></div>
<div class="sec"><div class="lbl">Gestion des Cookies & Pubs 🍪</div>
<p class="mut" style="margin-bottom:.6rem">Personnalisez votre consentement pour les cookies Google AdSense et de mesure d'audience.</p>
<button class="btn g w" onclick="openCookieSettingsModal()">${ic('i-gear')} Gérer mes choix de cookies</button></div>
<div class="sec"><div class="lbl">Compte Google</div><p class="mut" id="gtxt" style="margin-bottom:.6rem">Non connecté — progression enregistrée sur cet appareil.</p>
<button class="btn g w" id="gset2" onclick="!window.GU&&gIn()" style="${window.GU?'opacity:.5;pointer-events:none;cursor:default':''}"> ${ic('i-google')}${window.GU?'✓ Connecté via Google':'Se connecter avec Google'}</button></div>
<div class="sec"><div class="lbl">Thème</div><div class="grid2">
<button class="opt2${TH==='dark'?' on':''}" onclick="setTh('dark')">Sombre</button>
<button class="opt2${TH==='light'?' on':''}" onclick="setTh('light')">Clair</button></div></div>
<div class="sec"><div class="lbl">Taille du texte</div><div class="grid3">
<button class="opt2 fs1${FS==='f1'?' on':''}" onclick="setFs('f1')">Petit</button>
<button class="opt2 fs2${FS==='f2'?' on':''}" onclick="setFs('f2')">Moyen</button>
<button class="opt2 fs3${FS==='f3'?' on':''}" onclick="setFs('f3')">Grand</button></div></div>
<div class="sec"><div class="lbl">Sons</div><div class="tgr"><span>Effets sonores</span><button class="sw${SND?' on':''}" onclick="tg('s',this)"><i></i></button></div></div>
<div class="sec"><div class="lbl">Notifications</div><div class="tgr"><span>Rappels quotidiens</span><button class="sw${NOT?' on':''}" onclick="tg('n',this)"><i></i></button></div><p class="mut" style="font-size:.72rem;margin-top:.5rem">Un rappel pour ne pas casser ta série de jours.</p></div>
<div class="sec"><div class="lbl">Animations</div><div class="tgr"><span>Activer les animations</span><button class="sw${ANI?' on':''}" onclick="tg('a',this)"><i></i></button></div></div>
<div class="sec"><div class="lbl">Application</div><button class="btn g w" id="ib" onclick="doInstall()">${ic('i-install')}Ajouter à l'écran d'accueil</button>
<p class="mut" id="inote" style="font-size:.73rem;text-align:center;margin-top:.5rem">Installe CodeQuest comme une vraie appli.</p></div>
<p class="mut" style="font-size:.72rem;text-align:center">Préférences enregistrées automatiquement.</p>`;
setTimeout(iUI,30)}
function setTh(t){TH=t;SS('cq_t',t);document.body.classList.toggle('dk',t==='dark');rSet()}
function setFs(f){FS=f;SS('cq_f',f);document.body.className=document.body.className.replace(/\bf[123]\b/g,'').trim()+' '+f;rSet()}
function tg(k,el){if(k==='s'){SND=!SND;SS('cq_s',SND);el.classList.toggle('on',SND)}else if(k==='n'){NOT=!NOT;SS('cq_n',NOT);el.classList.toggle('on',NOT);if(NOT&&'Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}else{ANI=!ANI;SS('cq_a',ANI);document.body.classList.toggle('na',!ANI);el.classList.toggle('on',ANI)}}
/* ---------- SNAKE TERMINAL & NIVEAUX DE DIFFICULTÉ ---------- */
const SNN = 15, SNC = 20; // Grille 15x15 cellules de 20px = 300x300
const SN_DIFFS = [
  { id: 0, name: "Stagiaire", speed: 180, wrap: true, obstacles: 0, mult: 1.0, label: "🟢 Stagiaire (Murs libres)" },
  { id: 1, name: "Développeur", speed: 135, wrap: false, obstacles: 0, mult: 1.5, label: "🔵 Dév (Normal)" },
  { id: 2, name: "Senior", speed: 105, wrap: false, obstacles: 4, mult: 2.0, label: "🟠 Senior (Bugs)" },
  { id: 3, name: "Lead Tech", speed: 80, wrap: false, obstacles: 7, mult: 3.0, label: "🔴 Lead Tech (Rapide)" },
  { id: 4, name: "Cyber-Hacker", speed: 55, wrap: false, obstacles: 11, mult: 5.0, label: "⚡ Cyber-Hacker (Matrix)" }
];

let SN_CUR_DIFF = 1;
let SN_MATRIX_MODE = false;
let SN_LOGS = [];
let SN_EARNED_CODES = 0;

let SN = {
  s: [],
  d: { x: 1, y: 0 },
  nd: { x: 1, y: 0 },
  ap: { x: 0, y: 0, type: 0 }, // 0: standard, 1: gold bonus, 2: slow freeze
  obs: [], // obstacles de bugs
  sc: 0,
  run: false,
  paused: false,
  iv: null,
  freezeTimer: 0
};

// Logs interactifs dans la console terminal
function snLog(msg, type) {
  const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
  const cls = type === 's' ? 'log-s' : type === 'w' ? 'log-w' : type === 'e' ? 'log-e' : 'log-i';
  const prefix = type === 's' ? '[OK]' : type === 'w' ? '[WARN]' : type === 'e' ? '[ERR]' : '[SYS]';
  SN_LOGS.push(`<div class="${cls}"><b>${time} ${prefix}</b> ${msg}</div>`);
  if (SN_LOGS.length > 50) SN_LOGS.shift();
  
  const box = $('sn-log-box');
  const count = $('sn-log-count');
  if (count) count.textContent = SN_LOGS.length;
  if (box) {
    box.innerHTML = SN_LOGS.join('');
    box.scrollTop = box.scrollHeight;
  }
}

function setSnakeTab(tab) {
  const gTab = $('sn-tab-game');
  const lTab = $('sn-tab-logs');
  const gView = $('sn-view-game');
  const lView = $('sn-view-logs');
  if (gTab) gTab.classList.toggle('on', tab === 'game');
  if (lTab) lTab.classList.toggle('on', tab === 'logs');
  if (gView) gView.style.display = tab === 'game' ? 'block' : 'none';
  if (lView) lView.style.display = tab === 'logs' ? 'block' : 'none';
  if (tab === 'logs') setTimeout(() => $('sn-cmd-in')?.focus(), 50);
}

function setSnakeDiff(lvl) {
  SN_CUR_DIFF = Math.max(0, Math.min(4, lvl));
  for (let i = 0; i <= 4; i++) {
    const b = $('snb-' + i);
    if (b) b.classList.toggle('on', i === SN_CUR_DIFF);
  }
  const d = SN_DIFFS[SN_CUR_DIFF];
  $('sn-spd').textContent = d.speed + 'ms';
  snLog(`Niveau de difficulté changé pour: ${d.name} (${d.speed}ms, wrap: ${d.wrap}, obstacles: ${d.obstacles})`, 'i');
  snReset();
}

function snReset() {
  clearInterval(SN.iv);
  const diff = SN_DIFFS[SN_CUR_DIFF];
  SN.s = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
  SN.d = { x: 1, y: 0 };
  SN.nd = { x: 1, y: 0 };
  SN.sc = 0;
  SN.freezeTimer = 0;
  SN_EARNED_CODES = 0;
  SN.paused = false;

  // Placer les obstacles pour cette difficulté
  SN.obs = [];
  if (diff.obstacles > 0) {
    for (let i = 0; i < diff.obstacles; i++) {
      let ox, oy, tries = 0;
      do {
        ox = Math.floor(Math.random() * SNN);
        oy = Math.floor(Math.random() * SNN);
        tries++;
      } while (tries < 100 && ((ox >= 4 && ox <= 9 && oy === 7) || SN.obs.some(o => o.x === ox && o.y === oy)));
      SN.obs.push({ x: ox, y: oy });
    }
  }

  SN.ap = snApple();
  $('sn-s').textContent = 0;
  $('sn-b').textContent = P.sb || 0;
  $('sn-rew').textContent = '+0';
  $('sn-spd').textContent = diff.speed + 'ms';
  
  snLog(`Partie lancée : mode ${diff.name} · Multiplicateur x${diff.mult}`, 's');
  SN.run = true;
  SN.iv = setInterval(snTick, diff.speed);
  snDraw();
}

function snApple() {
  let x, y, type = 0;
  const randType = Math.random();
  if (randType < 0.20) type = 1; // Pomme dorée bonus
  else if (randType < 0.35) type = 2; // Pomme freeze cyan

  let tries = 0;
  do {
    x = Math.floor(Math.random() * SNN);
    y = Math.floor(Math.random() * SNN);
    tries++;
  } while (tries < 150 && (SN.s.some(s => s.x === x && s.y === y) || SN.obs.some(o => o.x === x && o.y === y)));
  return { x, y, type };
}

function snDir(x, y) {
  if (SN.paused) toggleSnakePause();
  if (x && SN.d.x) return; // Pas de demi-tour immédiat
  if (y && SN.d.y) return;
  SN.nd = { x, y };
}

function toggleSnakePause() {
  if (!SN.run) { snReset(); return; }
  SN.paused = !SN.paused;
  const diff = SN_DIFFS[SN_CUR_DIFF];
  if (SN.paused) {
    clearInterval(SN.iv);
    snLog('Jeu mis en pause (Espace ou P pour reprendre)', 'w');
  } else {
    SN.iv = setInterval(snTick, SN.freezeTimer > 0 ? diff.speed * 1.35 : diff.speed);
    snLog('Reprise du jeu', 'i');
  }
  snDraw();
}

function snTick() {
  if (SN.paused) return;
  SN.d = SN.nd;
  const h = SN.s[0];
  let nx = h.x + SN.d.x;
  let ny = h.y + SN.d.y;
  const diff = SN_DIFFS[SN_CUR_DIFF];

  // Gestion des murs traversants (mode Stagiaire)
  if (diff.wrap) {
    if (nx < 0) nx = SNN - 1;
    if (nx >= SNN) nx = 0;
    if (ny < 0) ny = SNN - 1;
    if (ny >= SNN) ny = 0;
  } else {
    if (nx < 0 || nx >= SNN || ny < 0 || ny >= SNN) {
      return snGameOver('Collision avec les limites du système (Mur fatal)');
    }
  }

  // Collision avec le propre corps du serpent
  if (SN.s.some(s => s.x === nx && s.y === ny)) {
    return snGameOver('Erreur de segmentation : auto-collision corporelle');
  }

  // Collision avec les obstacles de bugs
  if (SN.obs.some(o => o.x === nx && o.y === ny)) {
    return snGameOver('Erreur fatale : collision avec un bloc de code corrompu (Bug)');
  }

  const newHead = { x: nx, y: ny };
  SN.s.unshift(newHead);

  // Manger la pomme / token
  if (nx === SN.ap.x && ny === SN.ap.y) {
    const pts = SN.ap.type === 1 ? 3 : SN.ap.type === 2 ? 2 : 1;
    SN.sc += pts;
    $('sn-s').textContent = SN.sc;

    // Récompense en Codes CodeQuest selon la difficulté et le type de pomme !
    let codeEarn = Math.round(pts * diff.mult * 2);
    if (SN.ap.type === 1) codeEarn += 10; // Bonus d'or
    SN_EARNED_CODES += codeEarn;
    P.cd += codeEarn;
    P.tc = (P.tc || 0) + codeEarn;
    save();
    $('sn-rew').textContent = '+' + SN_EARNED_CODES;

    if (SN.ap.type === 1) {
      snLog(`★ Token Doré consommé ! +3 pts & +${codeEarn} Codes [Solde: ${P.cd}]`, 's');
    } else if (SN.ap.type === 2) {
      SN.freezeTimer = 15; // Ralentissement
      snLog(`❄️ Token Freeze activé ! Vitesse ralentie temporairement`, 'i');
    } else {
      snLog(`Token mémoire collecté à [${nx}, ${ny}]. Longueur: ${SN.s.length}`, 'i');
    }

    SN.ap = snApple();
  } else {
    SN.s.pop();
  }

  if (SN.freezeTimer > 0) SN.freezeTimer--;
  snDraw();
}

function snGameOver(reason) {
  clearInterval(SN.iv);
  SN.run = false;
  snLog(reason, 'e');
  snLog(`FIN DE SESSION · Score: ${SN.sc} · Codes crédités: +${SN_EARNED_CODES}`, 'w');

  if (SN.sc > (P.sb || 0)) {
    P.sb = SN.sc;
    save();
    checkBadges();
    snLog(`NOUVEAU RECORD PERSONNEL ENREGISTRÉ : ${SN.sc} pts !`, 's');
    toast('Nouveau record Snake : ' + SN.sc, 's', 'i-trophy');
  }
  $('sn-b').textContent = P.sb || 0;
  snDraw();
}

function snDraw() {
  const c = $('sn-c');
  if (!c) return;
  const g = c.getContext('2d');
  const w = c.width, h = c.height;

  // Fond du terminal
  g.fillStyle = SN_MATRIX_MODE ? '#020d04' : '#0a0d14';
  g.fillRect(0, 0, w, h);

  // Grille subtile
  g.strokeStyle = SN_MATRIX_MODE ? 'rgba(0,255,100,0.08)' : 'rgba(28,176,246,0.07)';
  g.lineWidth = 1;
  for (let i = 0; i <= SNN; i++) {
    g.beginPath();
    g.moveTo(i * SNC, 0); g.lineTo(i * SNC, h);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * SNC); g.lineTo(w, i * SNC);
    g.stroke();
  }

  // Obstacles de bugs
  SN.obs.forEach(o => {
    g.fillStyle = '#b91c1c';
    g.fillRect(o.x * SNC + 2, o.y * SNC + 2, SNC - 4, SNC - 4);
    g.strokeStyle = '#ef4444';
    g.strokeRect(o.x * SNC + 2, o.y * SNC + 2, SNC - 4, SNC - 4);
    // Croix bug
    g.beginPath();
    g.moveTo(o.x * SNC + 5, o.y * SNC + 5); g.lineTo(o.x * SNC + SNC - 5, o.y * SNC + SNC - 5);
    g.moveTo(o.x * SNC + SNC - 5, o.y * SNC + 5); g.lineTo(o.x * SNC + 5, o.y * SNC + SNC - 5);
    g.stroke();
  });

  // Pomme / Token
  const ap = SN.ap;
  const ax = ap.x * SNC + SNC / 2;
  const ay = ap.y * SNC + SNC / 2;

  if (ap.type === 1) {
    // Pomme dorée
    g.fillStyle = '#ffc800';
    g.shadowColor = '#ffc800';
    g.shadowBlur = 10;
    g.beginPath();
    g.arc(ax, ay, SNC / 2 - 3, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  } else if (ap.type === 2) {
    // Pomme freeze cyan
    g.fillStyle = '#22d3ee';
    g.shadowColor = '#22d3ee';
    g.shadowBlur = 8;
    g.beginPath();
    g.arc(ax, ay, SNC / 2 - 3, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  } else {
    // Pomme rouge standard
    g.fillStyle = '#ef4444';
    g.beginPath();
    g.arc(ax, ay, SNC / 2 - 3, 0, Math.PI * 2);
    g.fill();
  }

  // Serpent
  SN.s.forEach((seg, i) => {
    const isHead = i === 0;
    if (isHead) {
      g.fillStyle = SN_MATRIX_MODE ? '#00ff66' : '#58cc02';
      g.shadowColor = g.fillStyle;
      g.shadowBlur = 8;
    } else {
      g.shadowBlur = 0;
      const opacity = Math.max(0.35, 0.95 - (i / SN.s.length) * 0.6);
      g.fillStyle = SN_MATRIX_MODE ? `rgba(0, 255, 100, ${opacity})` : `rgba(28, 176, 246, ${opacity})`;
    }
    g.fillRect(seg.x * SNC + 2, seg.y * SNC + 2, SNC - 4, SNC - 4);

    // Yeux sur la tête
    if (isHead) {
      g.shadowBlur = 0;
      g.fillStyle = '#ffffff';
      const eyeOffset = 4;
      g.fillRect(seg.x * SNC + 5, seg.y * SNC + 5, 3, 3);
      g.fillRect(seg.x * SNC + SNC - 8, seg.y * SNC + 5, 3, 3);
    }
  });
  g.shadowBlur = 0;

  // Overlay Pause
  if (SN.paused) {
    g.fillStyle = 'rgba(10, 13, 20, 0.82)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffbd2e';
    g.font = '900 20px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    g.fillText('⏸ PAUSE TERMINAL', w / 2, h / 2 - 8);
    g.fillStyle = '#8b949e';
    g.font = '12px "JetBrains Mono", monospace';
    g.fillText('Appuie sur Espace pour reprendre', w / 2, h / 2 + 18);
  }

  // Overlay Game Over
  if (!SN.run && SN.s.length) {
    g.fillStyle = 'rgba(10, 13, 20, 0.88)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff5f56';
    g.font = '900 22px "JetBrains Mono", monospace';
    g.textAlign = 'center';
    g.fillText('CRASH SYSTEM (404)', w / 2, h / 2 - 20);
    g.fillStyle = '#58cc02';
    g.font = '700 14px "JetBrains Mono", monospace';
    g.fillText(`Score: ${SN.sc} pts · Gain: +${SN_EARNED_CODES} Codes`, w / 2, h / 2 + 6);
    g.fillStyle = '#8b949e';
    g.font = '11px "JetBrains Mono", monospace';
    g.fillText('Tape "reset" ou clique ↺ pour relancer', w / 2, h / 2 + 30);
  }
}

function runSnakeCmd() {
  const inp = $('sn-cmd-in');
  if (!inp) return;
  const raw = (inp.value || '').trim();
  inp.value = '';
  if (!raw) return;

  const parts = raw.split(' ');
  const cmd = parts[0].toLowerCase();
  const arg = parts[1] ? parts[1].toLowerCase() : '';

  snLog(`> ${raw}`, 's');

  switch (cmd) {
    case 'help':
      snLog('Commandes disponibles : diff [0-4], speed [ms], wrap [on/off], matrix [on/off], cls, reset, pause', 'i');
      break;
    case 'diff':
      const dLvl = parseInt(arg, 10);
      if (!isNaN(dLvl) && dLvl >= 0 && dLvl <= 4) {
        setSnakeDiff(dLvl);
      } else {
        snLog('Usage: diff [0-4] (0:Stagiaire, 1:Dév, 2:Senior, 3:Lead, 4:Hacker)', 'w');
      }
      break;
    case 'speed':
      const sp = parseInt(arg, 10);
      if (!isNaN(sp) && sp >= 20 && sp <= 400) {
        clearInterval(SN.iv);
        SN_DIFFS[SN_CUR_DIFF].speed = sp;
        $('sn-spd').textContent = sp + 'ms';
        if (SN.run && !SN.paused) SN.iv = setInterval(snTick, sp);
        snLog(`Vitesse modifiée à ${sp}ms`, 's');
      } else {
        snLog('Usage: speed [20-400]', 'w');
      }
      break;
    case 'wrap':
      if (arg === 'on') { SN_DIFFS[SN_CUR_DIFF].wrap = true; snLog('Murs traversants ACTIVÉS', 's'); }
      else if (arg === 'off') { SN_DIFFS[SN_CUR_DIFF].wrap = false; snLog('Murs mortels ACTIVÉS', 'w'); }
      else { snLog('Usage: wrap on/off', 'w'); }
      break;
    case 'matrix':
      SN_MATRIX_MODE = (arg === 'on' || !SN_MATRIX_MODE);
      snLog('Mode Matrix ' + (SN_MATRIX_MODE ? 'ACTIVÉ' : 'DÉSACTIVÉ'), 's');
      snDraw();
      break;
    case 'cls':
    case 'clear':
      SN_LOGS = [];
      const box = $('sn-log-box');
      if (box) box.innerHTML = '';
      $('sn-log-count').textContent = '0';
      break;
    case 'reset':
      snReset();
      setSnakeTab('game');
      break;
    case 'pause':
      toggleSnakePause();
      break;
    case 'give':
      P.cd += 100;
      save();
      rHome();
      snLog('★ Code de triche dév : +100 Codes ajoutés !', 's');
      break;
    default:
      snLog(`Commande inconnue: "${cmd}". Tape "help" pour la liste des commandes.`, 'e');
  }
}

function openSnake() {
  $('m-sn').classList.add('on');
  setSnakeTab('game');
  snLog('Session Snake Developer Terminal initialisée.', 's');
  setTimeout(snReset, 80);
}

function closeSnake() {
  clearInterval(SN.iv);
  SN.run = false;
  cl('m-sn');
}

// Contrôles au clavier (Flèches, ZQSD, WASD, Espace/P pour Pause, Échap)
addEventListener('keydown', e => {
  if ($('m-bb')?.classList.contains('on')) {
    if (e.key === 'Escape') { closeBreaker(); return; }
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') { e.preventDefault(); toggleBreakerPause(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q' || e.key === 'a' || e.key === 'A') { e.preventDefault(); bbMove(-24); return; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); bbMove(24); return; }
    return;
  }

  if (!$('m-sn')?.classList.contains('on')) return;

  // Si on est en train de taper dans l'input de commande, ne pas intercepter les touches normales
  if (document.activeElement === $('sn-cmd-in')) {
    if (e.key === 'Escape') closeSnake();
    return;
  }

  if (e.key === 'Escape') { closeSnake(); return; }
  if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    toggleSnakePause();
    return;
  }

  const moves = {
    ArrowUp: [0, -1], z: [0, -1], Z: [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], q: [-1, 0], Q: [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight: [1, 0], d: [1, 0], D: [1, 0]
  };

  const m = moves[e.key];
  if (m) {
    e.preventDefault();
    snDir(m[0], m[1]);
  }
});
/* ---------- PWA + Google ---------- */
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{}));
let DIP=null;const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const iOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();DIP=e;iUI()});
function iUI(){const b=$('ib'),n=$('inote');if(!b)return;
if(standalone()){b.disabled=true;b.innerHTML=ic('i-check')+'Déjà installée'}
else if(DIP){b.innerHTML=ic('i-install')+"Ajouter à l'écran d'accueil"}
else{b.innerHTML=ic('i-info')+'Comment installer ?';n.textContent=iOS()?"Safari → Partager → Sur l'écran d'accueil.":"Menu du navigateur → Installer l'application."}}
async function doInstall(){if(standalone())return;
if(DIP){DIP.prompt();await DIP.userChoice;DIP=null;return iUI()}
alert(iOS()?"iPhone / iPad :\n1. Bouton Partager\n2. Sur l'écran d'accueil\n3. Ajouter":"Menu du navigateur → Installer l'application")}
const GCID='243518426014-ncq8kd397spjf5nu4e9hfr8pac51dj7q.apps.googleusercontent.com',GF='codequest.json';
/* ===== CONFIG STRIPE — remplace par ta vraie clé publiable ===== */
/* Va sur dashboard.stripe.com → Developers → API keys → Publishable key */
const STRIPE_PK = 'pk_live_51U8JmjI27IpUuwOn8niiN1R8VRsKIkzewnaj7zxOkuL7VjO7aBSNULymu8WO4odIM4SzpH9viMpETuAWhckNkaIi00EJp2iZTL';
/* Passe à true une fois la clé et les fonctions Netlify configurées */
const STRIPE_ENABLED = true;
/* Acheter un pack de Codes */
function cqUid() {
  let u = null;
  try {
    u = localStorage.getItem('cq_uid');
    if (!u) {
      u = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem('cq_uid', u);
    }
  } catch (e) { u = u || 'anon-' + Date.now(); }
  return u;
}
async function apiJson(url, opts) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  let data = null;
  try { data = JSON.parse(txt); } catch (e) {}
  if (!data) {
    throw new Error(res.status === 404
      ? 'fonction de paiement introuvable (site non déployé avec netlify/functions)'
      : 'réponse serveur invalide (' + res.status + ')');
  }
  if (!res.ok && !data.error) data.error = 'erreur ' + res.status;
  return data;
}
/* Acheter un pack de Codes */
async function buyPack(packId) {
  if (!STRIPE_ENABLED) { toast('Paiements bientôt disponibles', 'i', 'i-info'); return; }
  const btn = document.querySelector(`[data-pack="${packId}"]`);
  try {
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    const email = (window.GU && window.GU.email) || null;
    const data = await apiJson('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId, uid: cqUid(), email }),
    });
    if (!data.url) throw new Error(data.error || 'erreur inconnue');
    location.href = data.url;
  } catch (err) {
    toast('Erreur paiement : ' + err.message, 'e', 'i-warn');
    if (btn) { btn.disabled = false; btn.textContent = 'Acheter'; }
  }
}
/* Proposer une vidéo YouTube pour une mise en avant payante */
async function buyVideoAd() {
  const title = ($('cq-ad-title')?.value || '').trim();
  const videoUrl = ($('cq-ad-url')?.value || '').trim();
  const planId = $('cq-ad-plan')?.value || 'ad_1';
  if (!P.u) { toast("Crée ton profil avant de proposer une publicité.", 'e', 'i-user'); go('acc'); rAcc(); return; }
  if (!title || !videoUrl) { toast("Ajoute un titre et le lien YouTube.", 'w', 'i-warn'); return; }
  try {
    const btn = document.querySelector('button[onclick="buyVideoAd()"]');
    if (btn) { btn.disabled = true; btn.textContent = "Préparation…"; }
    const data = await apiJson('/api/create-ad-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, videoUrl, planId, uid: cqUid(), email: (window.GU && window.GU.email) || null })
    });
    if (!data.url) throw new Error(data.error || "paiement indisponible");
    location.href = data.url;
  } catch (err) {
    toast("Erreur : " + err.message, 'e', 'i-warn');
    const btn = document.querySelector('button[onclick="buyVideoAd()"]');
    if (btn) { btn.disabled = false; btn.textContent = "▶ Payer et proposer ma vidéo"; }
  }
}
/* Vérifier un paiement Stripe au retour sur l'app (avec reprise si le réseau a coupé) */
async function checkStripeReturn() {
  const params = new URLSearchParams(location.search);
  const status = params.get('payment');
  const urlSid = params.get('session_id');
  if (status) history.replaceState({}, '', location.pathname);
  if (status === 'cancel') { toast('Paiement annulé', 'i', 'i-info'); return; }
  try {
    if (status === 'success' && urlSid) localStorage.setItem('cq_pending_sid', urlSid);
  } catch (e) {}
  let sid = null;
  try { sid = localStorage.getItem('cq_pending_sid'); } catch (e) {}
  if (!sid) return;
  try {
    const data = await apiJson('/api/verify-payment?session_id=' + encodeURIComponent(sid) + '&uid=' + encodeURIComponent(cqUid()));
    if (data.paid && data.adSubmitted) {
      toast(data.message || "Vidéo reçue : elle attend la modération.", 's', 'i-check');
      localStorage.removeItem('cq_pending_sid');
      if (typeof renderSponsoredAds === 'function') renderSponsoredAds(true);
    } else if (data.paid && data.codes > 0) {
      const done = JSON.parse(localStorage.getItem('cq_paid_sessions') || '[]');
      if (!done.includes(sid)) {
        done.push(sid);
        if (done.length > 20) done.shift();
        localStorage.setItem('cq_paid_sessions', JSON.stringify(done));
        P.cd += data.codes;
        P.tc = (P.tc || 0) + data.codes;
        save();
        toast('+' + data.codes.toLocaleString('fr-FR') + ' Codes crédités ! 🎉', 's', 'i-coin');
        rHome();
      } else {
        toast('Ce paiement a déjà été crédité', 'i', 'i-info');
      }
      localStorage.removeItem('cq_pending_sid');
    } else if (data.paid === false) {
      toast('Paiement non confirmé par Stripe', 'e', 'i-warn');
      localStorage.removeItem('cq_pending_sid');
    } else {
      toast(data.error || 'Paiement non confirmé — contacte le support', 'e', 'i-warn');
      localStorage.removeItem('cq_pending_sid');
    }
  } catch (e) {
    // réseau/serveur : on garde la session en attente, nouvel essai au prochain chargement
    toast('Impossible de vérifier le paiement pour l\'instant, réessaie en rouvrant l\'app', 'e', 'i-warn');
  }
}
let GT = null, GTC = null; window.GU = null;

function gUI() {
  const b = $('gset'), b2 = $('gset2'), txt = $('gtxt'), gbtn = $('gbtn');
  const isGoogle = !!window.GU;
  const isLocal = !!(P && P.u && P.u !== 'null');

  if (gbtn) {
    if (isGoogle) {
      gbtn.innerHTML = `<img src="${(window.GU && window.GU.picture) || (typeof avById==='function'?avById(P.a||'bot_green_code').img:'favicon.png')}" onerror="this.src='favicon.png'" style="width:26px;height:26px;border-radius:50%;border:2px solid var(--gr)">`;
      gbtn.title = 'Connecté via Google : ' + (window.GU.name || window.GU.email || P.u);
    } else if (isLocal) {
      const avImg = (typeof avById === 'function') ? avById(P.a || 'bot_green_code').img : 'favicon.png';
      gbtn.innerHTML = `<img src="${avImg}" onerror="this.src='favicon.png'" style="width:26px;height:26px;border-radius:50%;border:2px solid var(--nn)">`;
      gbtn.title = 'Profil connecté : ' + P.u;
    } else {
      gbtn.innerHTML = ic('i-google');
      gbtn.title = 'Connexion';
    }
  }

  if (isGoogle) {
    if (b) { b.innerHTML = ic('i-google') + '✓ Connecté : ' + esc(window.GU.name || window.GU.email || 'Google'); b.style.opacity = '.7'; }
    if (b2) { b2.innerHTML = ic('i-google') + '✓ Connecté : ' + esc(window.GU.name || window.GU.email || 'Google'); b2.style.opacity = '.7'; }
    if (txt) txt.innerHTML = 'Connecté avec <b>' + esc(window.GU.email || window.GU.name || '') + '</b> — synchronisation Google active.';
  } else if (isLocal) {
    if (b) { b.innerHTML = ic('i-google') + 'Lier un compte Google (Optionnel)'; b.style.opacity = '1'; }
    if (b2) { b2.innerHTML = ic('i-google') + 'Lier un compte Google (Optionnel)'; b2.style.opacity = '1'; }
    if (txt) txt.innerHTML = 'Connecté en tant que <b>' + esc(P.u) + '</b> — progression sauvegardée sur cet appareil.';
  } else {
    if (b) { b.innerHTML = ic('i-google') + 'Se connecter avec Google'; b.style.opacity = '1'; }
    if (b2) { b2.innerHTML = ic('i-google') + 'Se connecter avec Google'; b2.style.opacity = '1'; }
    if (txt) txt.textContent = 'Non connecté — progression enregistrée sur cet appareil.';
  }
}

function initGoogleClient(onReady) {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    try {
      GTC = google.accounts.oauth2.initTokenClient({
        client_id: GCID,
        scope: 'openid profile email https://www.googleapis.com/auth/drive.appdata',
        callback: onTok,
        error_callback: (err) => {
          console.warn('Google Auth Error:', err);
          showGoogleErrorModal(err);
        }
      });
      if (onReady) onReady();
      return;
    } catch(e) {
      console.warn('initTokenClient error:', e);
    }
  }

  // Si le script est déjà présent mais pas encore exécuté, on s'y attache
  let s = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (!s) {
    s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  s.onload = () => {
    try {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        GTC = google.accounts.oauth2.initTokenClient({
          client_id: GCID,
          scope: 'openid profile email https://www.googleapis.com/auth/drive.appdata',
          callback: onTok,
          error_callback: (err) => {
            console.warn('Google Auth Error callback:', err);
            showGoogleErrorModal(err);
          }
        });
        if (onReady) onReady();
      }
    } catch(e) { console.warn('Delayed init error:', e); }
  };
  s.onerror = () => {
    showGoogleErrorModal({ type: 'network_error' });
  };
}

addEventListener('load', () => {
  initGoogleClient();
  const c = sessionStorage.getItem('gt');
  if (c) { GT = c; gProf(); }
});

async function onTok(r) {
  if (!r || r.error) {
    console.warn('Token response error:', r);
    if (r && r.error === 'popup_closed_by_user') {
      toast('Connexion Google annulée', 'i', 'i-info');
    } else {
      showGoogleErrorModal(r);
    }
    return;
  }
  GT = r.access_token;
  sessionStorage.setItem('gt', GT);
  setCookie('cq_auth', 'google', 365);
  SS('cq_auth', 'google');
  window.GU = null;
  await gProf();

  // Fallback résilient si userinfo Google n'a pas répondu
  if (!window.GU) {
    window.GU = { name: (P && P.u && P.u !== 'Invité') ? P.u : 'Joueur Google', email: 'compte.google@codequest.app', picture: '' };
  }

  if (!P.u || /^(Codeur|Dev \(Localhost\)|Codeur Dev|Invité)$/.test(P.u)) {
    P.u = GU.name || (GU.email ? GU.email.split('@')[0] : 'GoogleCodeur');
  }
  setCookie('cq_session', P.u, 365);
  SS('cq_session', P.u);
  setCookie('cq_google_user', JSON.stringify({ name: GU.name, email: GU.email, picture: GU.picture }), 365);
  SS('cq_google_user', JSON.stringify({ name: GU.name, email: GU.email, picture: GU.picture }));

  const rm = await gLoad().catch(() => null);
  if (rm && (rm.xp || 0) > (P.xp || 0)) { P = { ...P, ...rm }; save(); }
  else if (window.gSave) window.gSave(P);

  hideGate();
  if (typeof hideCookieBanner === 'function') hideCookieBanner();
  if (typeof go === 'function') go('home');
  rHome();
  rAcc();
  gUI();
  toast('Connecté avec succès via Google ! 🚀', 's', 'i-check');
}

async function gProf() {
  if (!GT) return;
  try {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + GT }
    });
    if (!r.ok) {
      GT = null;
      sessionStorage.removeItem('gt');
      return;
    }
    const u = await r.json();
    if (u && (u.email || u.sub)) { window.GU = u; gUI(); }
  } catch (e) {
    console.warn('gProf error:', e);
  }
}


function openAuthModal() {
  const b = $('m-gauth-body');
  if (!b) return;
  const currentName = esc(P.u || 'Codeur');
  const isLoc = typeof isLocalhost === 'function' && isLocalhost();
  b.innerHTML = `
    <p class="mut" style="font-size:.85rem;line-height:1.5;margin-bottom:1.1rem">
      Choisis ton mode de connexion :
    </p>

    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.2rem">
      <!-- 1. CONNEXION LOCALE RAPIDE -->
      <div class="card" style="padding:1rem;text-align:left;background:var(--bg);border:1px solid var(--bd);border-radius:12px">
        <div class="lbl" style="margin-bottom:.3rem;font-weight:800;color:var(--ink)">⚡ Connexion Directe (Mode Local)</div>
        <p class="mut" style="font-size:.75rem;line-height:1.4;margin-bottom:.7rem">Joue immédiatement avec sauvegarde automatique dans ton navigateur. Zéro mot de passe requis.</p>
        <div style="display:flex;gap:.5rem;margin-bottom:.4rem">
          <input class="inp" id="g-alt-name" placeholder="Ton pseudo (ex: Codeur)" style="flex:1" value="${currentName}" onkeydown="if(event.key==='Enter')quickLocalLogin()">
          <button class="btn p" onclick="quickLocalLogin()" style="white-space:nowrap">${ic('i-check')} Valider</button>
        </div>
      </div>

      <!-- 2. AVEC GOOGLE -->
      <button class="gbtn" onclick="gIn()" style="width:100%;justify-content:center;min-height:48px;font-size:.9rem">
        <svg style="width:22px;height:22px;margin-right:.6rem"><use href="#i-google"/></svg>
        <span>${isLoc ? 'Se connecter via Google (Mode Local)' : 'Se connecter avec Google'}</span>
      </button>
    </div>

    <button class="btn g w" onclick="cl('m-gauth')">Fermer</button>
  `;
  $('m-gauth').classList.add('on');
}

function showGoogleErrorModal(err) {
  const errStr = String(err ? (err.message || err.error || err.type || '') : '');
  const isOrigMismatch = (err && (err.type === 'origin_mismatch' || errStr.includes('origin') || errStr.includes('redirect_uri_mismatch') || errStr.includes('400')));
  const isNotReady = (err && (err.type === 'not_ready' || err.type === 'network_error'));
  const b = $('m-gauth-body');
  if (!b) return;

  b.innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      <div style="font-size:2.4rem;margin-bottom:.4rem">🔐</div>
      <h3 style="font-size:1.15rem">Connexion Google Cloud</h3>
    </div>

    <p class="mut" style="font-size:.85rem;line-height:1.5;margin-bottom:1.1rem;text-align:left">
      ${isOrigMismatch ?
        'Google Cloud exige d\'enregistrer l\'adresse de redirection (<b>' + esc(location.origin) + '</b>) dans la Google Cloud Console (Erreur OAuth 400). Aucun problème : utilise ton profil local ci-dessous pour jouer immédiatement !' :
        isNotReady ?
        'Le service Google Sign-In est temporairement bloqué ou inaccessible. Tu peux continuer directement en un clic ci-dessous :' :
        'La fenêtre Google Sign-In a été fermée ou bloquée par le navigateur. Tu peux jouer directement ci-dessous :'}
    </p>

    <!-- BOUTON DE SECOURS DIRECT -->
    <div style="background:var(--bg);border:1px solid var(--nn);padding:.9rem;border-radius:12px;margin-bottom:1.1rem;text-align:left">
      <div style="font-size:.82rem;font-weight:800;color:var(--nn);margin-bottom:.3rem">🚀 Continuer sans blocage :</div>
      <p class="mut" style="font-size:.74rem;line-height:1.4;margin-bottom:.65rem">Accède directement à tous les cours et jeux :</p>
      <div style="display:flex;gap:.5rem;margin-bottom:.55rem">
        <input class="inp" id="err-pseudo-inp" placeholder="Ton pseudo (ex: Codeur)" value="${esc(P.u || 'Codeur')}" style="flex:1" onkeydown="if(event.key==='Enter')quickLocalLogin((document.getElementById('err-pseudo-inp')||{}).value)">
        <button class="btn p" onclick="quickLocalLogin((document.getElementById('err-pseudo-inp')||{}).value)" style="white-space:nowrap">${ic('i-check')} Jouer</button>
      </div>
      <button class="btn s w" onclick="guestLogin(P.u || 'Codeur')" style="font-size:.8rem;padding:.5rem">${ic('i-play')} Entrer en mode Invité immédiat</button>
    </div>

    <div style="display:flex;gap:.6rem;flex-direction:column">
      <button class="btn g w" onclick="cl('m-gauth');gIn()">${ic('i-google')} Réessayer la connexion Google</button>
      <button class="btn g w" onclick="cl('m-gauth')">Fermer</button>
    </div>
  `;

  const m = document.getElementById('m-gauth');
  if (m) m.classList.add('on');
}

function devSimulateGoogleLogin(customName) {
  if (!(typeof isLocalhost === 'function' && isLocalhost())) { toast('Disponible uniquement en local', 'i', 'i-info'); return; }
  cl('m-gauth');
  const name = customName || P.u || 'Codeur Dev';
  P.u = name;
  if (!P.a) P.a = 'bot_silver_code';
  save();
  setCookie('cq_session', P.u, 365);
  setCookie('cq_auth', 'mock_google_token_dev', 365);
  SS('cq_session', P.u);
  SS('cq_auth', 'mock_google_token_dev');
  window.GU = { name: P.u, email: P.u.toLowerCase().replace(/\s+/g, '.') + '@codequest.local', picture: '' };
  setCookie('cq_google_user', JSON.stringify(window.GU), 365);
  SS('cq_google_user', JSON.stringify(window.GU));
  hideGate();
  if (typeof go === 'function') go('home');
  rHome();
  rAcc();
  gUI();
  toast('Session connectée : ' + P.u, 's', 'i-check');
}

function quickLocalLogin(name) {
  let val = '';
  if (typeof name === 'string' && name.trim()) {
    val = name.trim();
  } else {
    const el = document.getElementById('gate-pseudo-inp') || document.getElementById('g-alt-name') || document.getElementById('err-pseudo-inp');
    val = (el ? el.value : '').trim();
  }
  guestLogin(val || (P && P.u) || 'Codeur');
}
window.quickLocalLogin = quickLocalLogin;

function gIn() {
  if (typeof isLocalhost === 'function' && isLocalhost()) {
    devSimulateGoogleLogin();
    return;
  }
  
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    console.warn('Google GSI SDK non disponible ou bloqué');
    showGoogleErrorModal({ type: 'not_ready' });
    return;
  }

  try {
    if (!GTC) {
      GTC = google.accounts.oauth2.initTokenClient({
        client_id: GCID,
        scope: 'openid profile email https://www.googleapis.com/auth/drive.appdata',
        callback: onTok,
        error_callback: (err) => {
          console.warn('Google Auth Error callback:', err);
          showGoogleErrorModal(err);
        }
      });
    }
    GTC.requestAccessToken({ prompt: GT ? '' : 'select_account' });
  } catch(err) {
    console.warn('gIn launch error:', err);
    showGoogleErrorModal(err);
  }
}
window.gIn = gIn;

function gOut() {
  if (GT && typeof google !== 'undefined' && google.accounts) {
    google.accounts.oauth2.revoke(GT, () => {});
  }
  GT = null;
  window.GU = null;
  sessionStorage.removeItem('gt');
  deleteCookie('cq_auth');
  deleteCookie('cq_google_user');
  gUI();
  toast('Déconnecté', 'i', 'i-info');
}

async function gFind(){const r=await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${GF}'&fields=files(id)`,{headers:{Authorization:'Bearer '+GT}}).then(r=>r.json()).catch(()=>null);return r&&r.files&&r.files[0]&&r.files[0].id}
window.gSave=async o=>{if(!GT)return;const bd='cqb',mt=JSON.stringify({name:GF,parents:['appDataFolder']}),id=await gFind();
const body=`--${bd}\r\nContent-Type: application/json\r\n\r\n${mt}\r\n--${bd}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(o)}\r\n--${bd}--`;
fetch(id?`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
{method:id?'PATCH':'POST',headers:{Authorization:'Bearer '+GT,'Content-Type':`multipart/related; boundary=${bd}`},body}).catch(()=>{})};
async function gLoad(){if(!GT)return null;const id=await gFind();if(!id)return null;
const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`,{headers:{Authorization:'Bearer '+GT}});return r.ok?r.json().catch(()=>null):null}
/* ---------- INTRO ---------- */
const INTRO={python:[
{o:["Afficher du texte avec <code>print()</code>","Faire des opérations mathématiques","Créer des variables","Distinguer nombre et texte"],e:[["Afficher",`print("Bonjour !")\nprint("Je m'appelle Alice")`],["Variable",`age = 20\nprint(age + 5)  # 25`]]},
{o:["Conditions <code>if / elif / else</code>","Comparer avec ==, >, <, !=","Combiner avec <code>and</code>, <code>or</code>, <code>not</code>"],e:[["if / else",`note = 15\nif note >= 10:\n    print("Reçu")\nelse:\n    print("Raté")`]]},
{o:["Répéter avec <code>for</code> et <code>while</code>","Créer et parcourir des listes","Définir des fonctions avec <code>def</code>"],e:[["Liste + boucle",`fruits = ["pomme", "banane"]\nfor f in fruits:\n    print(f)`],["Fonction",`def saluer(nom):\n    print("Salut " + nom)`]]},
{o:["Lire un fichier avec <code>open()</code>","Importer des modules","Utiliser <code>with</code>"],e:[["Fichier",`with open("data.txt") as f:\n    texte = f.read()`],["Module",`import math\nprint(math.sqrt(16))  # 4.0`]]},
{o:["Créer une classe avec <code>class</code>","Le constructeur <code>__init__</code> et <code>self</code>","Hériter d'une classe"],e:[["Classe",`class Chien:\n    def __init__(self, nom):\n        self.nom = nom\n    def aboyer(self):\n        print(self.nom + " : Ouaf")`]]},
{o:["Listes en compréhension","Générateurs avec <code>yield</code>","Décorateurs avec <code>@</code>"],e:[["Compréhension",`carres = [x**2 for x in range(5)]\n# [0, 1, 4, 9, 16]`]]}],
html:[
{o:["Structurer avec html, head, body","Titres <code>h1</code> à <code>h6</code>","Paragraphes et attributs"],e:[["Structure",`<!DOCTYPE html>\n<html>\n  <head><title>Ma page</title></head>\n  <body><h1>Bonjour</h1></body>\n</html>`]]},
{o:["Listes <code>ul</code>, <code>ol</code>, <code>li</code>","Champs <code>input</code>","Formulaires et boutons"],e:[["Formulaire",`<form>\n  <input type="text" placeholder="Nom">\n  <button>Envoyer</button>\n</form>`]]},
{o:["Tableaux <code>table</code>, <code>tr</code>, <code>td</code>","Balises sémantiques HTML5","Balises <code>meta</code>"],e:[["Sémantique",`<header>...</header>\n<nav>Menu</nav>\n<main>...</main>\n<footer>...</footer>`]]},
{o:["Texte alternatif <code>alt</code>","Attributs ARIA","Contraste et navigation clavier"],e:[["Accessible",`<img src="logo.png" alt="Logo du site">\n<button aria-label="Menu principal">=</button>`]]},
{o:["Balise <code>description</code> pour le SEO","Open Graph pour le partage","Titre et URL propres"],e:[["SEO",`<title>Mon site</title>\n<meta name="description" content="Description">\n<meta property="og:title" content="Mon site">`]]},
{o:["Dessiner avec <code>canvas</code>","Modales natives <code>dialog</code>","Attributs <code>data-*</code>"],e:[["Canvas",`<canvas id="jeu" width="300" height="200"></canvas>`]]}],
javascript:[
{o:["Variables <code>let</code> et <code>const</code>","Afficher avec <code>console.log()</code>","Fonctions classiques et fléchées"],e:[["Variables",`let prenom = "Alice";\nconst AGE = 20;\nconsole.log(prenom);`],["Fonction",`const add = (a, b) => a + b;`]]},
{o:["Sélectionner un élément du DOM","Réagir aux clics","Modifier le contenu d'une page"],e:[["Clic",`const b = document.getElementById("btn");\nb.addEventListener("click", () => {\n  console.log("Cliqué");\n});`]]},
{o:["Requêtes avec <code>fetch()</code>","Traiter du JSON","<code>async</code> et <code>await</code>"],e:[["Fetch",`async function load() {\n  const r = await fetch("data.json");\n  const data = await r.json();\n}`]]},
{o:["Portée des variables","Closures","Différence <code>var</code> / <code>let</code>"],e:[["Closure",`function compteur() {\n  let n = 0;\n  return () => ++n;\n}`]]},
{o:["Classes ES6 et <code>extends</code>","Déstructuration","Modules import / export"],e:[["Classe",`class Animal {\n  constructor(nom) { this.nom = nom; }\n}\nclass Chien extends Animal {}`]]},
{o:["Optional chaining <code>?.</code>","Nullish coalescing <code>??</code>","<code>Map</code>, <code>Set</code>, générateurs"],e:[["Moderne",`const u = null;\nconsole.log(u?.nom);   // undefined\nconsole.log(0 ?? 10);  // 0`]]}],
julia:[
{o:["Afficher avec <code>println()</code>","Variables et types Julia","Opérations de base"],e:[["Bases",`x = 42\nnom = "Alice"\nprintln(nom)`]]},
{o:["Boucles <code>for</code> avec <code>1:n</code>","Tableaux indexés à partir de 1","Conditions"],e:[["Boucle",`for i in 1:3\n  println(i)\nend`],["Tableau",`arr = [10, 20, 30]\nprintln(arr[1])  # 10`]]},
{o:["Annoter les types avec <code>::</code>","Multiple dispatch","Fonctions courtes"],e:[["Dispatch",`process(x::Int) = x * 2\nprocess(x::String) = uppercase(x)`]]},
{o:["Installer des packages","Tracer avec Plots.jl","Tables avec DataFrames.jl"],e:[["Plots",`using Plots\nx = 1:10\ny = x .^ 2\nplot(x, y)`]]},
{o:["Macros <code>@time</code>, <code>@assert</code>","Broadcasting avec le point","Opérateur ternaire"],e:[["Macro",`@time sum(1:1000000)\n@assert 1 + 1 == 2 "Erreur"`]]},
{o:["Structures <code>struct</code>","Types paramétriques","Mutabilité"],e:[["Struct",`struct Boite{T}\n  contenu::T\nend`]]}],
powershell:[
{o:["Afficher avec <code>Write-Host</code>","Variables préfixées par <code>$</code>","Interpolation dans les guillemets doubles"],e:[["Bases",`$prenom = "Alice"\nWrite-Host "Bonjour $prenom"`],["Calcul",`$a = 10\nWrite-Host ($a + 3)  # 13`]]},
{o:["Opérateurs <code>-eq</code>, <code>-gt</code>, <code>-lt</code>","Conditions if / else","Boucles foreach, for, while"],e:[["Condition",`$age = 20\nif ($age -ge 18) {\n  Write-Host "Majeur"\n} else {\n  Write-Host "Mineur"\n}`]]},
{o:["Le pipeline <code>|</code>","Where-Object et $_","Select-Object et Sort-Object"],e:[["Pipeline",`Get-ChildItem | Where-Object { $_.Length -gt 1MB }\nGet-ChildItem | Sort-Object Length -Descending`]]},
{o:["Créer une fonction","Paramètres avec <code>param()</code>","Valeurs par défaut et Mandatory"],e:[["Fonction",`function Additionner {\n  param($a, $b)\n  return $a + $b\n}\nAdditionner -a 5 -b 3`]]},
{o:["Lire un fichier avec Get-Content","Tester un chemin avec Test-Path","Variables d'environnement"],e:[["Fichier",`if (Test-Path "config.json") {\n  $data = Get-Content "config.json"\n}`],["Env",`Write-Host $env:USERNAME`]]},
{o:["Gérer les erreurs try / catch","Requêtes web","Hashtables et JSON"],e:[["Erreur",`try {\n  Get-Content "absent.txt"\n} catch {\n  Write-Host "Erreur : $_"\n}`]]}]};
/* ---------- CURRICULUM ---------- */

/* ===== CASSE-BRIQUES DU BUG ENGINE (BB) ===== */
const BUG_NAMES = ['NullPtr', 'SyntaxErr', 'TypeErr', 'StackOver', 'MemLeak', 'IndexOut', 'Bug#404', 'ZeroDiv'];
const BRICK_COLORS = ['#ff5f56', '#ffbd2e', '#27c93f', '#22d3ee'];
let BB = {
  run: false,
  paused: false,
  score: 0,
  lives: 3,
  iv: null,
  paddle: { x: 110, y: 292, w: 80, h: 12, speed: 28 },
  ball: { x: 150, y: 260, r: 6, vx: 3.2, vy: -3.2 },
  bricks: [],
  earnedCodes: 0
};

function bbReset() {
  BB.score = 0;
  BB.lives = 3;
  BB.paused = false;
  BB.earnedCodes = 0;
  BB.paddle = { x: 110, y: 292, w: 80, h: 12, speed: 28 };
  BB.ball = { x: 150, y: 260, r: 6, vx: 3.2 * (Math.random() > 0.5 ? 1 : -1), vy: -3.2 };
  
  BB.bricks = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      BB.bricks.push({
        x: c * 47 + 10,
        y: r * 22 + 35,
        w: 43,
        h: 16,
        status: 1,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        label: BUG_NAMES[(r * 6 + c) % BUG_NAMES.length]
      });
    }
  }

  const sEl = $('bb-s'); if (sEl) sEl.textContent = '0';
  const cEl = $('bb-cnt'); if (cEl) cEl.textContent = '24';
  const lEl = $('bb-liv'); if (lEl) lEl.textContent = '❤️❤️❤️';

  clearInterval(BB.iv);
  BB.run = true;
  BB.iv = setInterval(bbTick, 16);
  bbDraw();
}

function bbMove(dx) {
  if (!BB.run || BB.paused) return;
  BB.paddle.x += dx;
  if (BB.paddle.x < 0) BB.paddle.x = 0;
  if (BB.paddle.x + BB.paddle.w > 300) BB.paddle.x = 300 - BB.paddle.w;
  bbDraw();
}

function toggleBreakerPause() {
  if (!BB.run) { bbReset(); return; }
  BB.paused = !BB.paused;
  sfx('click');
  bbDraw();
}

function bbTick() {
  if (!BB.run || BB.paused) return;
  const b = BB.ball;
  const p = BB.paddle;

  b.x += b.vx;
  b.y += b.vy;

  if (b.x - b.r <= 0) {
    b.x = b.r;
    b.vx = -b.vx;
    sfx('pop');
  } else if (b.x + b.r >= 300) {
    b.x = 300 - b.r;
    b.vx = -b.vx;
    sfx('pop');
  }

  if (b.y - b.r <= 0) {
    b.y = b.r;
    b.vy = -b.vy;
    sfx('pop');
  }

  if (b.y + b.r >= p.y && b.y - b.r <= p.y + p.h) {
    if (b.x >= p.x && b.x <= p.x + p.w && b.vy > 0) {
      const hitPoint = (b.x - (p.x + p.w / 2)) / (p.w / 2);
      b.vx = hitPoint * 4.5;
      if (Math.abs(b.vx) < 1.2) b.vx = b.vx >= 0 ? 1.5 : -1.5;
      b.vy = -Math.abs(b.vy);
      sfx('click');
    }
  }

  let aliveBricks = 0;
  for (let i = 0; i < BB.bricks.length; i++) {
    const br = BB.bricks[i];
    if (br.status === 1) {
      aliveBricks++;
      if (b.x + b.r >= br.x && b.x - b.r <= br.x + br.w &&
          b.y + b.r >= br.y && b.y - b.r <= br.y + br.h) {
        br.status = 0;
        b.vy = -b.vy;
        BB.score += 15;
        aliveBricks--;
        const sEl = $('bb-s'); if (sEl) sEl.textContent = BB.score;
        const cEl = $('bb-cnt'); if (cEl) cEl.textContent = aliveBricks;

        BB.earnedCodes += 5;
        P.cd += 5;
        P.tc = (P.tc || 0) + 5;
        save();

        sfx('correct');
        break;
      }
    }
  }

  if (aliveBricks === 0) {
    clearInterval(BB.iv);
    BB.run = false;
    sfx('fanfare');
    triggerConfetti();
    const bonus = 100;
    P.cd += bonus;
    P.tc = (P.tc || 0) + bonus;
    save();
    toast(`VICTOIRE ! Tous les bugs écrasés ! +${BB.earnedCodes + bonus} Codes`, 's', 'i-trophy');
    bbDraw(true, 'VICTOIRE ! CODE SAUVÉ');
    return;
  }

  if (b.y - b.r >= 320) {
    BB.lives--;
    sfx('wrong');
    const lEl = $('bb-liv');
    if (lEl) lEl.textContent = '❤️'.repeat(Math.max(0, BB.lives)) || '💀';

    if (BB.lives <= 0) {
      clearInterval(BB.iv);
      BB.run = false;
      toast('GAME OVER — Les bugs ont submergé le serveur', 'e', 'i-warn');
      bbDraw(true, 'GAME OVER');
      return;
    } else {
      b.x = p.x + p.w / 2;
      b.y = p.y - 15;
      b.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
      b.vy = -3.2;
    }
  }

  bbDraw();
}

function bbDraw(gameOver, msg) {
  const c = $('bb-c');
  if (!c) return;
  const g = c.getContext('2d');
  const w = c.width, h = c.height;

  g.fillStyle = '#070a10';
  g.fillRect(0, 0, w, h);

  g.strokeStyle = 'rgba(34, 211, 238, 0.06)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }

  BB.bricks.forEach(br => {
    if (br.status === 1) {
      g.fillStyle = br.color;
      g.fillRect(br.x, br.y, br.w, br.h);
      g.strokeStyle = 'rgba(255,255,255,0.4)';
      g.strokeRect(br.x, br.y, br.w, br.h);

      g.fillStyle = '#0f172a';
      g.font = 'bold 7px monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(br.label, br.x + br.w / 2, br.y + br.h / 2);
    }
  });

  const p = BB.paddle;
  g.fillStyle = '#22d3ee';
  g.shadowColor = '#22d3ee';
  g.shadowBlur = 10;
  g.fillRect(p.x, p.y, p.w, p.h);
  g.shadowBlur = 0;
  g.fillStyle = '#ffffff';
  g.fillRect(p.x + 4, p.y + 3, p.w - 8, 2);

  const b = BB.ball;
  g.fillStyle = '#f43f5e';
  g.shadowColor = '#f43f5e';
  g.shadowBlur = 12;
  g.beginPath();
  g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  g.fill();
  g.shadowBlur = 0;

  if (BB.paused) {
    g.fillStyle = 'rgba(7, 10, 16, 0.75)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#22d3ee';
    g.font = 'bold 16px monospace';
    g.textAlign = 'center';
    g.fillText('PAUSE', w / 2, h / 2);
    g.font = '11px sans-serif';
    g.fillStyle = '#94a3b8';
    g.fillText('Appuie sur Espace pour reprendre', w / 2, h / 2 + 25);
  } else if (gameOver) {
    g.fillStyle = 'rgba(7, 10, 16, 0.85)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = msg.includes('VICTOIRE') ? '#27c93f' : '#ff5f56';
    g.font = 'bold 16px monospace';
    g.textAlign = 'center';
    g.fillText(msg, w / 2, h / 2 - 10);
    g.font = '11px sans-serif';
    g.fillStyle = '#cbd5e1';
    g.fillText(`Score: ${BB.score} · Codes: +${BB.earnedCodes}`, w / 2, h / 2 + 15);
    g.fillStyle = '#22d3ee';
    g.fillText('Clique sur la puce orange pour rejouer', w / 2, h / 2 + 38);
  }
}

function openBreaker() {
  $('m-bb').classList.add('on');
  setTimeout(() => {
    bbReset();
    const c = $('bb-c');
    if (c && !c._touchBound) {
      c._touchBound = true;
      let dragging = false;
      const getX = e => {
        const rect = c.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return (clientX - rect.left) * (c.width / rect.width);
      };
      c.addEventListener('touchstart', e => { dragging = true; const x = getX(e); BB.paddle.x = Math.max(0, Math.min(300 - BB.paddle.w, x - BB.paddle.w / 2)); bbDraw(); e.preventDefault(); }, { passive: false });
      c.addEventListener('touchmove', e => { if (dragging) { const x = getX(e); BB.paddle.x = Math.max(0, Math.min(300 - BB.paddle.w, x - BB.paddle.w / 2)); bbDraw(); } e.preventDefault(); }, { passive: false });
      c.addEventListener('touchend', () => { dragging = false; });
      c.addEventListener('mousemove', e => {
        if (BB.run && !BB.paused) {
          const x = getX(e);
          BB.paddle.x = Math.max(0, Math.min(300 - BB.paddle.w, x - BB.paddle.w / 2));
          bbDraw();
        }
      });
    }
  }, 100);
}

function closeBreaker() {
  clearInterval(BB.iv);
  BB.run = false;
  cl('m-bb');
}

/* ===== SPACE INVADERS ENGINE ===== */
let SP = { run: false, score: 0, player: { x: 138, y: 270, w: 24, h: 12 }, lasers: [], aliens: [], dir: 1, iv: null };
function spaceReset() {
  SP.score = 0; SP.player.x = 138; SP.lasers = []; SP.dir = 1;
  SP.aliens = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      SP.aliens.push({ x: c * 42 + 25, y: r * 28 + 35, w: 24, h: 16, alive: true });
    }
  }
  const sEl = $('sp-s'), cEl = $('sp-cnt');
  if (sEl) sEl.textContent = '0';
  if (cEl) cEl.textContent = '18';
  clearInterval(SP.iv);
  SP.run = true;
  SP.iv = setInterval(spaceTick, 24);
  spaceDraw();
}
function spMove(dx) {
  if (!SP.run) return;
  SP.player.x = Math.max(10, Math.min(266, SP.player.x + dx));
  spaceDraw();
}
function spFire() {
  if (!SP.run) return;
  SP.lasers.push({ x: SP.player.x + 11, y: SP.player.y - 4, vy: -7 });
  sfx('click');
}
function spaceTick() {
  if (!SP.run) return;
  SP.lasers.forEach(l => l.y += l.vy);
  SP.lasers = SP.lasers.filter(l => l.y > 0);
  
  let changeDir = false;
  SP.aliens.forEach(a => {
    if (a.alive) {
      a.x += SP.dir * 1.5;
      if (a.x <= 10 || a.x + a.w >= 290) changeDir = true;
    }
  });
  if (changeDir) {
    SP.dir = -SP.dir;
    SP.aliens.forEach(a => a.y += 10);
  }

  let aliveCount = 0;
  SP.aliens.forEach(a => {
    if (a.alive) {
      aliveCount++;
      SP.lasers.forEach((l, lIdx) => {
        if (l.x >= a.x && l.x <= a.x + a.w && l.y >= a.y && l.y <= a.y + a.h) {
          a.alive = false;
          SP.lasers.splice(lIdx, 1);
          SP.score += 20;
          P.cd += 5; save();
          sfx('pop');
          const sEl = $('sp-s'); if (sEl) sEl.textContent = SP.score;
        }
      });
      if (a.y + a.h >= SP.player.y) {
        clearInterval(SP.iv); SP.run = false;
        sfx('wrong');
        toast('Invasion réussie — La Terre a été envahie !', 'e', 'i-warn');
      }
    }
  });
  const cEl = $('sp-cnt'); if (cEl) cEl.textContent = aliveCount;
  if (aliveCount === 0) {
    clearInterval(SP.iv); SP.run = false;
    sfx('fanfare'); triggerConfetti();
    P.cd += 80; save();
    toast('VICTOIRE ! Flotte ennemie anéantie ! +80 Codes', 's', 'i-trophy');
  }
  spaceDraw();
}
function spaceDraw() {
  const c = $('sp-c'); if (!c) return;
  const g = c.getContext('2d');
  g.fillStyle = '#05070e'; g.fillRect(0, 0, 300, 300);
  g.fillStyle = '#22c55e';
  g.fillRect(SP.player.x, SP.player.y, SP.player.w, SP.player.h);
  g.fillRect(SP.player.x + 9, SP.player.y - 4, 6, 4);

  g.fillStyle = '#f43f5e';
  SP.lasers.forEach(l => g.fillRect(l.x, l.y, 3, 7));

  SP.aliens.forEach(a => {
    if (a.alive) {
      g.fillStyle = '#a855f7';
      g.fillRect(a.x, a.y, a.w, a.h);
      g.fillStyle = '#ffffff';
      g.fillRect(a.x + 4, a.y + 4, 4, 4);
      g.fillRect(a.x + 16, a.y + 4, 4, 4);
    }
  });
}
function openSpace() { $('m-space').classList.add('on'); setTimeout(spaceReset, 80); }
function closeSpace() { clearInterval(SP.iv); SP.run = false; cl('m-space'); }

/* ===== FLAPPY DRONE ENGINE ===== */
let FL = { run: false, score: 0, drone: { y: 140, vy: 0, r: 10 }, pipes: [], iv: null };
function flappyReset() {
  FL.score = 0; FL.drone = { y: 140, vy: 0, r: 10 };
  FL.pipes = [{ x: 260, topH: 90, gap: 95, passed: false }];
  const sEl = $('fl-s'); if (sEl) sEl.textContent = '0';
  clearInterval(FL.iv);
  FL.run = true;
  FL.iv = setInterval(flappyTick, 24);
  flappyDraw();
}
function flappyFlap() {
  if (!FL.run) { flappyReset(); return; }
  FL.drone.vy = -5.8;
  sfx('click');
}
function flappyTick() {
  if (!FL.run) return;
  const d = FL.drone;
  d.vy += 0.38; d.y += d.vy;
  if (d.y - d.r <= 0 || d.y + d.r >= 300) {
    clearInterval(FL.iv); FL.run = false; sfx('wrong');
    toast('Le drone a percuté le bord !', 'e', 'i-warn');
    return;
  }
  FL.pipes.forEach(p => {
    p.x -= 2.6;
    if (!p.passed && p.x + 40 < 60) {
      p.passed = true; FL.score++;
      P.cd += 3; save(); sfx('correct');
      const sEl = $('fl-s'); if (sEl) sEl.textContent = FL.score;
    }
    if (60 + d.r > p.x && 60 - d.r < p.x + 40) {
      if (d.y - d.r < p.topH || d.y + d.r > p.topH + p.gap) {
        clearInterval(FL.iv); FL.run = false; sfx('wrong');
        toast('Collision avec un serveur !', 'e', 'i-warn');
      }
    }
  });
  if (FL.pipes.length && FL.pipes[FL.pipes.length - 1].x < 170) {
    const topH = Math.floor(Math.random() * 110) + 40;
    FL.pipes.push({ x: 310, topH, gap: 95, passed: false });
  }
  FL.pipes = FL.pipes.filter(p => p.x > -50);
  flappyDraw();
}
function flappyDraw() {
  const c = $('fl-c'); if (!c) return;
  const g = c.getContext('2d');
  g.fillStyle = '#080c14'; g.fillRect(0, 0, 300, 300);
  FL.pipes.forEach(p => {
    g.fillStyle = '#0284c7';
    g.fillRect(p.x, 0, 40, p.topH);
    g.fillRect(p.x, p.topH + p.gap, 40, 300 - (p.topH + p.gap));
  });
  const d = FL.drone;
  g.fillStyle = '#eab308';
  g.beginPath(); g.arc(60, d.y, d.r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#000';
  g.fillRect(52, d.y - 3, 16, 2);
}
function openFlappy() { $('m-flappy').classList.add('on'); setTimeout(flappyReset, 80); }
function closeFlappy() { clearInterval(FL.iv); FL.run = false; cl('m-flappy'); }

/* ===== MEMORY CACHE ENGINE ===== */
let MEM = { cards: [], flipped: [], lock: false, pairs: 0, attempts: 0 };
const MEM_SYMS = ['⚡','🐍','💻','🔒','⚙️','🚀','📦','🎯'];
function memoryReset() {
  MEM.pairs = 0; MEM.attempts = 0; MEM.flipped = []; MEM.lock = false;
  const deck = [...MEM_SYMS, ...MEM_SYMS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  MEM.cards = deck.map((sym, idx) => ({ id: idx, sym, visible: false, solved: false }));
  renderMemoryGrid();
}
function renderMemoryGrid() {
  const b = $('mem-grid'); if (!b) return;
  b.innerHTML = MEM.cards.map((c, i) => `
    <button class="pk" style="width:60px;height:60px;font-size:1.5rem;background:${c.solved?'#10b981':c.visible?'#3b82f6':'var(--sf)'}" onclick="memoryClick(${i})">
      ${c.visible || c.solved ? c.sym : '❓'}
    </button>
  `).join('');
  const pEl = $('mem-p'), eEl = $('mem-e');
  if (pEl) pEl.textContent = MEM.pairs + ' / 8';
  if (eEl) eEl.textContent = MEM.attempts;
}
function memoryClick(idx) {
  if (MEM.lock) return;
  const c = MEM.cards[idx];
  if (c.visible || c.solved) return;
  c.visible = true;
  MEM.flipped.push(c);
  sfx('click');
  renderMemoryGrid();
  if (MEM.flipped.length === 2) {
    MEM.attempts++;
    MEM.lock = true;
    const [c1, c2] = MEM.flipped;
    if (c1.sym === c2.sym) {
      c1.solved = true; c2.solved = true;
      MEM.pairs++;
      MEM.flipped = [];
      MEM.lock = false;
      sfx('correct');
      P.cd += 8; save();
      renderMemoryGrid();
      if (MEM.pairs === 8) {
        sfx('fanfare'); triggerConfetti();
        P.cd += 60; save();
        toast('Cache 100% synchronisé ! +60 Codes', 's', 'i-trophy');
      }
    } else {
      setTimeout(() => {
        c1.visible = false; c2.visible = false;
        MEM.flipped = [];
        MEM.lock = false;
        renderMemoryGrid();
      }, 700);
    }
  }
}
function openMemory() { $('m-memory').classList.add('on'); memoryReset(); }
function closeMemory() { cl('m-memory'); }

/* ===== PONG ENGINE ===== */
let PO = { run: false, j1: 120, j2: 120, b: { x: 150, y: 150, vx: 3.2, vy: 2 }, s1: 0, s2: 0, iv: null };
function pongReset() {
  PO.s1 = 0; PO.s2 = 0; PO.j1 = 120; PO.j2 = 120;
  PO.b = { x: 150, y: 150, vx: 3.5 * (Math.random() > 0.5 ? 1 : -1), vy: 2.2 };
  const j1El = $('po-j1'), j2El = $('po-j2');
  if (j1El) j1El.textContent = '0';
  if (j2El) j2El.textContent = '0';
  clearInterval(PO.iv);
  PO.run = true;
  PO.iv = setInterval(pongTick, 20);
  pongDraw();
}
function pongMove(dy) {
  PO.j1 = Math.max(0, Math.min(245, PO.j1 + dy));
  pongDraw();
}
function pongTick() {
  if (!PO.run) return;
  const b = PO.b;
  b.x += b.vx; b.y += b.vy;
  if (b.y <= 0 || b.y >= 295) { b.vy = -b.vy; sfx('pop'); }
  const cIA = PO.j2 + 27;
  if (cIA < b.y - 5) PO.j2 = Math.min(245, PO.j2 + 2.8);
  else if (cIA > b.y + 5) PO.j2 = Math.max(0, PO.j2 - 2.8);

  if (b.x <= 20 && b.y >= PO.j1 && b.y <= PO.j1 + 55 && b.vx < 0) {
    b.vx = -b.vx * 1.05; b.vy = (b.y - (PO.j1 + 27)) / 8; sfx('click');
  }
  if (b.x >= 275 && b.y >= PO.j2 && b.y <= PO.j2 + 55 && b.vx > 0) {
    b.vx = -b.vx * 1.05; b.vy = (b.y - (PO.j2 + 27)) / 8; sfx('click');
  }
  if (b.x < 0) {
    PO.s2++; sfx('wrong');
    const j2El = $('po-j2'); if (j2El) j2El.textContent = PO.s2;
    b.x = 150; b.y = 150; b.vx = 3.2; b.vy = 2;
  } else if (b.x > 300) {
    PO.s1++; sfx('correct');
    const j1El = $('po-j1'); if (j1El) j1El.textContent = PO.s1;
    b.x = 150; b.y = 150; b.vx = -3.2; b.vy = -2;
  }
  if (PO.s1 >= 5) {
    clearInterval(PO.iv); PO.run = false;
    sfx('fanfare'); triggerConfetti();
    P.cd += 75; save();
    toast('VICTOIRE PONG ! Tu as battu l\'IA ! +75 Codes', 's', 'i-trophy');
  } else if (PO.s2 >= 5) {
    clearInterval(PO.iv); PO.run = false;
    toast('Défaite face à l\'IA !', 'e', 'i-warn');
  }
  pongDraw();
}
function pongDraw() {
  const c = $('po-c'); if (!c) return;
  const g = c.getContext('2d');
  g.fillStyle = '#030712'; g.fillRect(0, 0, 300, 300);
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.setLineDash([5, 5]);
  g.beginPath(); g.moveTo(150, 0); g.lineTo(150, 300); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#22d3ee'; g.fillRect(10, PO.j1, 10, 55);
  g.fillStyle = '#ff5f56'; g.fillRect(280, PO.j2, 10, 55);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(PO.b.x, PO.b.y, 5, 0, Math.PI * 2); g.fill();
}
function openPong() { $('m-pong').classList.add('on'); setTimeout(pongReset, 80); }
function closePong() { clearInterval(PO.iv); PO.run = false; cl('m-pong'); }

/* ===== RUNNER ENGINE ===== */
let RU = { run: false, dist: 0, codes: 0, runner: { y: 240, vy: 0, onGround: true }, obstacles: [], iv: null };
function runnerReset() {
  RU.dist = 0; RU.codes = 0; RU.runner = { y: 240, vy: 0, onGround: true };
  RU.obstacles = [{ x: 300, w: 18, h: 26 }];
  const dEl = $('ru-d'), cEl = $('ru-c');
  if (dEl) dEl.textContent = '0 m';
  if (cEl) cEl.textContent = '+0';
  clearInterval(RU.iv);
  RU.run = true;
  RU.iv = setInterval(runnerTick, 24);
  runnerDraw();
}
function runnerJump() {
  if (!RU.run) { runnerReset(); return; }
  if (RU.runner.onGround) {
    RU.runner.vy = -8.5;
    RU.runner.onGround = false;
    sfx('click');
  }
}
function runnerTick() {
  if (!RU.run) return;
  RU.dist += 2;
  const dEl = $('ru-d'); if (dEl) dEl.textContent = RU.dist + ' m';
  const r = RU.runner;
  r.vy += 0.46; r.y += r.vy;
  if (r.y >= 240) { r.y = 240; r.vy = 0; r.onGround = true; }
  RU.obstacles.forEach(o => {
    o.x -= 3.8;
    if (o.x < 60 && o.x + o.w > 40 && r.y + 24 > 240) {
      clearInterval(RU.iv); RU.run = false; sfx('wrong');
      toast('Incident en production ! Course arrêtée', 'e', 'i-warn');
    }
  });
  if (RU.obstacles.length && RU.obstacles[RU.obstacles.length - 1].x < 160) {
    RU.obstacles.push({ x: 320 + Math.random() * 50, w: 18, h: 26 });
    RU.codes += 5; P.cd += 5; save();
    const cEl = $('ru-c'); if (cEl) cEl.textContent = '+' + RU.codes;
  }
  RU.obstacles = RU.obstacles.filter(o => o.x > -30);
  runnerDraw();
}
function runnerDraw() {
  const c = $('ru-c'); if (!c) return;
  const g = c.getContext('2d');
  g.fillStyle = '#040711'; g.fillRect(0, 0, 300, 300);
  g.fillStyle = '#334155'; g.fillRect(0, 268, 300, 32);
  g.fillStyle = '#10b981'; g.fillRect(40, RU.runner.y, 20, 28);
  g.fillStyle = '#ef4444';
  RU.obstacles.forEach(o => g.fillRect(o.x, 268 - o.h, o.w, o.h));
}
function openRunner() { $('m-runner').classList.add('on'); setTimeout(runnerReset, 80); }
function closeRunner() { clearInterval(RU.iv); RU.run = false; cl('m-runner'); }


/* ---------- HISTOIRE DES LANGAGES & MODE HARDCORE ---------- */
window.HARDCORE_STORY = false;
window.STORY_CHRONO_IV = null;
window.STORY_CHRONO_LEFT = 35;

function openLangHistory(id) {
  const l = LG(id);
  const h = LANG_HISTORY[id] || {
    name: l.n, year: 'Inconnue', creator: 'Pionniers du code', subtitle: 'Langage de programmation',
    genesis: 'Créé pour résoudre des défis informatiques majeurs.', story: '', milestones: [], philosophy: '', anecdote: '', impact: ''
  };
  $('m-lh-title').textContent = "Histoire de " + l.n;
  $('m-lh-meta').innerHTML = `${monoT(l, 'sm')} <div><b style="font-size:1.15rem;color:var(--tx)">${l.n}</b><div class="mut" style="font-size:.8rem">Créé en ${h.year} par ${esc(h.creator)}</div></div>`;
  $('m-lh-sub').textContent = h.subtitle;
  $('m-lh-genesis').innerHTML = `<div class="lbl" style="color:var(--nn);display:flex;align-items:center;gap:.4rem">${ic('i-bulb')} <span>La Genèse & Contexte Historique</span></div><p style="line-height:1.6;font-size:.88rem;color:var(--tx);margin:.3rem 0">${esc(h.genesis)}</p>`;
  $('m-lh-story').innerHTML = `<div class="lbl" style="color:var(--nn);display:flex;align-items:center;gap:.4rem">${ic('i-book')} <span>L'Histoire & Moments Charnières</span></div><p style="line-height:1.6;font-size:.88rem;color:var(--tx);margin:.3rem 0">${esc(h.story)}</p>`;
  $('m-lh-milestones').innerHTML = `<div class="lbl" style="color:var(--nn);display:flex;align-items:center;gap:.4rem">${ic('i-trend')} <span>Jalons Historiques Majeurs</span></div><ul style="padding-left:1.2rem;margin:.4rem 0">${(h.milestones||[]).map(m=>`<li style="margin-bottom:.4rem;font-size:.82rem;line-height:1.4"><b>${esc(m.split(' : ')[0])}</b> : ${esc(m.split(' : ').slice(1).join(' : '))}</li>`).join('')}</ul>`;
  $('m-lh-philo').innerHTML = `<div style="border-left:3px solid var(--nn);padding:.6rem .9rem;margin:.8rem 0;background:rgba(56,189,248,.07);border-radius:0 8px 8px 0;font-style:italic;font-size:.85rem"><b style="color:var(--nn);font-style:normal;display:block;margin-bottom:.2rem">Philosophie & Mantra :</b> "${esc(h.philosophy)}"</div>`;
  $('m-lh-anecdote').innerHTML = `<div style="background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.25);border-radius:10px;padding:.7rem .9rem;margin:.8rem 0;font-size:.84rem"><b style="color:#eab308;display:block;margin-bottom:.3rem">💡 Le savais-tu ?</b> ${esc(h.anecdote)}</div>`;
  $('m-lh-impact').innerHTML = `<div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.25);border-radius:10px;padding:.7rem .9rem;margin:.8rem 0;font-size:.84rem"><b style="color:#a855f7;display:block;margin-bottom:.3rem">🚀 Dans le monde aujourd'hui :</b> ${esc(h.impact)}</div>`;
  $('m-lh-btn').onclick = () => { cl('m-lang-hist'); pickLang(id); };
  $('m-lang-hist').classList.add('on');
}

function toggleHardcoreStory(checked) {
  window.HARDCORE_STORY = checked;
  sfx('click');
  toast(checked ? '⚡ Mode Chrono Hardcore activé ! (+50% XP)' : 'Mode normal restauré', 's', 'i-play');
  rStory();
}

window.SW=null;window.CL='python';window.CI=0;

document.body.classList.add(FS);
if(TH==='dark')document.body.classList.add('dk');
if(!ANI)document.body.classList.add('na');
quests();rSet();rHome();gUI();
(function checkCookieAuthOnBoot() {
  if (typeof isLocalhost === 'function' && isLocalhost()) {
    // EN LOCALHOST : AUCUN BESOIN DE GOOGLE
    hideGate();
    if (!P.u) {
      P.u = 'Dev (Localhost)';
      save();
    }
    if (!getCookieConsent()) {
      saveCookieConsent({ essential: true, ads: false, analytics: false });
      hideCookieBanner();
    }
    if (typeof go === 'function') go('home');
    rHome();
    return;
  }

  // Check cookie consent first
  const consent = getCookieConsent();
  if (!consent) {
    setTimeout(() => { showCookieBanner(); }, 800);
  } else {
    applyCookieConsent(consent);
  }

  // Session existante (vérification multi-niveaux : Cookie, LocalStorage brut, JSON parsé, et joueur P)
  let rawLsUser = null;
  try {
    const raw = localStorage.getItem('cq_session') || localStorage.getItem('cq_user');
    rawLsUser = raw ? (raw.startsWith('"') ? JSON.parse(raw) : raw) : null;
  } catch(e) {}

  const sessionUser = rawLsUser || getCookie('cq_session') || getCookie('cq_auth') || LS('cq_session', null) || LS('cq_auth', null) || (P && P.u && P.u !== 'null' ? P.u : null);
  const googleUserRaw = getCookie('cq_google_user') || LS('cq_google_user', null) || (function(){ try { return localStorage.getItem('cq_google_user'); }catch(e){ return null; } })();

  if (sessionUser || (P && P.u && P.u !== 'null')) {
    if (!P.u && sessionUser && !/^(guest|google|local_token|local_dev_token|local)$/.test(sessionUser)) {
      P.u = sessionUser;
    }
    if (googleUserRaw) {
      try { window.GU = typeof googleUserRaw === 'string' ? JSON.parse(googleUserRaw) : googleUserRaw; } catch(e) {}
    }
    hideGate();
    if (typeof go === 'function') go('home');
    rHome();
    gUI();
  } else {
    // Entrée directe par défaut : le contenu éducatif est immédiatement visible pour les visiteurs et les robots Google
    if (!P || !P.u) {
      if (!P) P = { cd: 0, xp: 0, st: 0, ls: 0, lc: 0, u: 'Codeur', a: 'bot_silver_code', av: ['bot_silver_code'], hn: 1, dn: {}, sy: { snake: [0, 0, 0] }, bd: [], hi: [], q: null, sb: 0, ta: 0, tc: 0, tl: 0 };
      else P.u = 'Codeur';
      save();
    }
    hideGate();
    if (typeof go === 'function') go('home');
    rHome();
    gUI();
  }
})();
checkStripeReturn();
