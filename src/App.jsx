import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';

// ── SOUND ENGINE ──────────────────────────────────────────────────────────────
const SFX = {
  ctx: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  play(type, enabled = true) {
    if (!enabled) return;
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const plays = {
        complete: () => {
          [523, 659, 784, 1047].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = f;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.25, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
            o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.55);
          });
        },
        levelup: () => {
          [392,494,587,784,987,1174,1568].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = i % 2 === 0 ? 'square' : 'sine'; o.frequency.value = f;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.18, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.55);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.6);
          });
        },
        fail: () => {
          [280, 240, 190].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sawtooth';
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(f, now + i * 0.13);
            o.frequency.linearRampToValueAtTime(f * 0.55, now + i * 0.13 + 0.22);
            g.gain.setValueAtTime(0.22, now + i * 0.13);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.13 + 0.32);
            o.start(now + i * 0.13); o.stop(now + i * 0.13 + 0.35);
          });
        },
        click: () => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 880;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          o.start(now); o.stop(now + 0.08);
        },
        add: () => {
          [440, 550, 660].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.12, now + i * 0.09);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.28);
            o.start(now + i * 0.09); o.stop(now + i * 0.09 + 0.3);
          });
        },
        login: () => {
          [330, 440, 550, 660].forEach((f, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.15, now + i * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);
            o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.45);
          });
        },
        hover: () => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 660;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.03, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          o.start(now); o.stop(now + 0.05);
        }
      };
      plays[type]?.();
    } catch(e) {}
  }
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ZONES = {
  work:     { label:'The Iron Forge',       color:'#4a8fff', emoji:'⚒️' },
  personal: { label:'The Mystic Grove',     color:'#c060ff', emoji:'🌿' },
  health:   { label:'The Vitality Temple',  color:'#2ecc71', emoji:'💚' },
  learning: { label:"The Scholar's Tower",  color:'#ff9020', emoji:'📚' },
  social:   { label:'The Grand Tavern',     color:'#f0c040', emoji:'🍺' },
};
const DIFF_STARS = { trivial:'★☆☆☆☆', easy:'★★☆☆☆', medium:'★★★☆☆', hard:'★★★★☆', legendary:'★★★★★' };
const CLASS_ICONS = ['🧙','⚔️','🏹','🛡️','🔮','🗡️','👑','🦸','🧝','🧟'];
const TITLES = [
  'The Beginner','The Apprentice','The Wanderer','The Fighter',
  'The Brave','The Skilled','The Expert','The Veteran',
  'The Champion','The Legend','The Mythic','The Immortal'
];

// ── AXIOS INSTANCE ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: '/api' });

// ── PARTICLES ─────────────────────────────────────────────────────────────────
function ParticleField() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${9 + Math.random() * 14}s`,
    delay: `-${Math.random() * 15}s`,
    size: Math.random() > 0.8 ? '3px' : '2px',
    drift: `${(Math.random() - 0.5) * 100}px`,
  })), []);
  return (
    <div className="particle-field">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          animationDuration: p.duration, animationDelay: p.delay,
          '--drift': p.drift,
        }} />
      ))}
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{t.icon}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── LEVEL UP OVERLAY ──────────────────────────────────────────────────────────
function LevelUpOverlay({ level, title, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="levelup-overlay" onClick={onDone}>
      <div className="levelup-card">
        <div className="levelup-rays" />
        <div className="levelup-title">⚔️ LEVEL UP ⚔️</div>
        <div className="levelup-num">{level}</div>
        <div className="levelup-title-text">{TITLES[Math.min(level-1, TITLES.length-1)]}</div>
        <div className="levelup-sub">A new power awakens within you</div>
        <div className="levelup-hint">Click to continue your journey</div>
      </div>
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]     = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({ username:'', email:'', password:'' });
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setError(''); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const url  = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const { data } = await axios.post(url, body);
      SFX.play('login', true);
      onAuth(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Check your connection.');
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-page">
      <ParticleField />
      <div className="auth-card">
        <div className="auth-logo">⚔️ QuestHub</div>
        <div className="auth-sub">Real-Life RPG Productivity</div>

        <div className="auth-toggle">
          <button className={`auth-toggle-btn ${mode==='login'?'active':''}`}
            onClick={() => { setMode('login'); setError(''); }}>
            ⚔️ Login
          </button>
          <button className={`auth-toggle-btn ${mode==='register'?'active':''}`}
            onClick={() => { setMode('register'); setError(''); }}>
            🌟 Register
          </button>
        </div>

        {error && <div className="auth-error">⚠️ &nbsp;{error}</div>}

        {mode === 'register' && (
          <div className="form-group">
            <label className="form-label">Hero Name</label>
            <input className="form-input" value={form.username}
              onChange={e => set('username', e.target.value)}
              onKeyDown={handleKey}
              placeholder="YourHeroName" autoFocus />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email}
            onChange={e => set('email', e.target.value)}
            onKeyDown={handleKey}
            placeholder="hero@realm.com"
            autoFocus={mode === 'login'} />
        </div>
        <div className="form-group">
          <label className="form-label">Password {mode==='register' && <span style={{color:'var(--text-muted)',fontWeight:'normal'}}>(min 6 chars)</span>}</label>
          <input className="form-input" type="password" value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={handleKey}
            placeholder="••••••••" />
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading
            ? '⏳ Loading...'
            : mode === 'login' ? '⚔️  Enter the Realm' : '🌟  Begin Your Legend'}
        </button>

        <div style={{textAlign:'center',marginTop:'1rem',fontSize:'0.72rem',color:'var(--text-muted)',fontFamily:'var(--font-heading)'}}>
          {mode === 'login'
            ? <>No account? <span className="auth-link" onClick={() => setMode('register')}>Register here</span></>
            : <>Have an account? <span className="auth-link" onClick={() => setMode('login')}>Login here</span></>}
        </div>
      </div>
    </div>
  );
}

// ── ADD QUEST MODAL ───────────────────────────────────────────────────────────
function AddQuestModal({ onClose, onAdd, initialZone }) {
  const [form, setForm] = useState({
    title:'', description:'',
    zone: initialZone !== 'all' ? initialZone : 'personal',
    difficulty:'medium', dueDate:''
  });
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">⚔️ &nbsp;Issue New Quest</div>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="form-group">
          <label className="form-label">Quest Title *</label>
          <input className="form-input" value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Vanquish the Morning Report..." autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Details of the quest..." />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Zone</label>
            <select className="form-select" value={form.zone} onChange={e => set('zone', e.target.value)}>
              {Object.entries(ZONES).map(([k, z]) =>
                <option key={k} value={k}>{z.emoji} {k.charAt(0).toUpperCase()+k.slice(1)}</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select className="form-select" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              <option value="trivial">Trivial ★</option>
              <option value="easy">Easy ★★</option>
              <option value="medium">Medium ★★★</option>
              <option value="hard">Hard ★★★★</option>
              <option value="legendary">Legendary ★★★★★</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date (optional)</label>
          <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>

        <button className="submit-btn"
          onClick={() => { if (!form.title.trim()) return; onAdd(form); onClose(); }}>
          ⚔️ &nbsp;Accept Quest
        </button>
      </div>
    </div>
  );
}

// ── QUEST CARD ────────────────────────────────────────────────────────────────
function QuestCard({ quest, onComplete, onFail, onDelete, sfx }) {
  const z       = ZONES[quest.zone] || ZONES.personal;
  const isActive = quest.status === 'active';
  return (
    <div
      className={`quest-card ${quest.zone} ${quest.status}`}
      style={{ borderColor: isActive ? `${z.color}30` : undefined }}
      onMouseEnter={() => sfx('hover')}
    >
      <div className="quest-card-top">
        <div className="quest-card-title">{quest.title}</div>
        <div className={`difficulty-badge diff-${quest.difficulty}`}>{DIFF_STARS[quest.difficulty]}</div>
      </div>
      {quest.description && <div className="quest-desc">{quest.description}</div>}
      <div className="quest-rewards">
        <div className="reward-item reward-xp">✨ {quest.xpReward} XP</div>
        <div className="reward-item reward-gold">💰 {quest.goldReward} Gold</div>
        <div className="reward-item" style={{color: z.color}}>{z.emoji} {quest.zone}</div>
      </div>
      {quest.dueDate && (
        <div className="quest-due">📅 {new Date(quest.dueDate).toLocaleDateString()}</div>
      )}
      {isActive && (
        <div className="quest-actions">
          <button className="quest-btn quest-btn-complete" onClick={() => onComplete(quest._id)}>✓ Complete</button>
          <button className="quest-btn quest-btn-fail"     onClick={() => onFail(quest._id)}>✗ Abandon</button>
          <button className="quest-btn quest-btn-delete"   onClick={() => onDelete(quest._id)}>🗑</button>
        </div>
      )}
      {quest.status === 'completed' && (
        <div className="quest-stamp stamp-done">✓ DONE</div>
      )}
      {quest.status === 'failed' && (
        <div className="quest-stamp stamp-fail">✗ FAILED</div>
      )}
    </div>
  );
}

// ── CHARACTER SIDEBAR ─────────────────────────────────────────────────────────
function CharSidebar({ char, username, stats, onUpdate, onLogout, sfx }) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState('');
  const [classIdx,    setClassIdx]    = useState(0);

  useEffect(() => { if (char) setNameVal(char.name); }, [char]);

  const saveName = () => {
    if (nameVal.trim()) onUpdate({ name: nameVal.trim() });
    setEditingName(false);
  };

  const xpPct = char ? Math.min(100, Math.round((char.xp / char.xpToNext) * 100)) : 0;
  const hpPct = char ? Math.round((char.hp / char.maxHp) * 100) : 0;
  const hpColor = hpPct > 60 ? 'var(--emerald-bright)' : hpPct > 30 ? 'var(--amber-bright)' : 'var(--crimson-bright)';

  if (!char) return (
    <div className="sidebar">
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{height:'60px',marginBottom:'0.7rem'}}/>)}
    </div>
  );

  return (
    <div className="sidebar">
      {/* ─ Character Card ─ */}
      <div className="char-card">
        <div className="char-avatar" onClick={() => { sfx('click'); setClassIdx(i => (i+1) % CLASS_ICONS.length); }} title="Click to change class">
          <div className="char-avatar-ring" />
          {CLASS_ICONS[classIdx]}
        </div>

        {editingName ? (
          <input className="char-edit-input" value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            autoFocus />
        ) : (
          <div className="char-name" onClick={() => setEditingName(true)} title="Click to rename">
            {char.name}
          </div>
        )}

        <div className="char-title">{char.title}</div>
        <div className="char-level-badge">⚔️ LVL {char.level}</div>

        {/* XP Bar */}
        <div className="bar-wrap">
          <div className="bar-label"><span>EXP</span><span>{char.xp}/{char.xpToNext}</span></div>
          <div className="bar-track xp-track">
            <div className="bar-fill xp-fill" style={{width:`${xpPct}%`}} />
          </div>
        </div>

        {/* HP Bar */}
        <div className="bar-wrap">
          <div className="bar-label" style={{color:hpColor}}><span>HP</span><span>{char.hp}/{char.maxHp}</span></div>
          <div className="bar-track hp-track">
            <div className="bar-fill hp-fill" style={{width:`${hpPct}%`, background:hpColor}} />
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[['⚔️','STR',char.strength],['📖','INT',char.intelligence],['🌀','AGI',char.agility],['🎭','CHA',char.charisma]].map(([icon,name,val]) => (
            <div key={name} className="stat-item">
              <span className="stat-icon">{icon}</span>
              <div className="stat-info">
                <span className="stat-name">{name}</span>
                <span className="stat-val">{val}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="char-footer">
          <span>💰 {char.gold} Gold</span>
          <span>✅ {char.totalCompleted}</span>
          <span>💀 {char.totalFailed}</span>
        </div>
      </div>

      {/* ─ Zone Legend ─ */}
      <div className="zone-legend">
        <div className="zone-legend-title">⚔️ Realm Zones</div>
        {Object.entries(ZONES).map(([k, z]) => {
          const zs  = stats?.byZone?.find(b => b._id === k);
          const cnt = zs?.count || 0;
          const don = zs?.completed || 0;
          return (
            <div key={k} className="zone-item">
              <div className="zone-dot" style={{background: z.color}} />
              <span>{z.emoji} {k.charAt(0).toUpperCase()+k.slice(1)}</span>
              {cnt > 0 && <span className="zone-count">{don}/{cnt}</span>}
            </div>
          );
        })}
      </div>

      {/* ─ Quest Summary ─ */}
      <div className="sidebar-box">
        <div className="sidebar-box-title">📜 Quest Log</div>
        <div className="sidebar-stat-row"><span>🔥 Active</span><span style={{color:'var(--amber-bright)'}}>{stats?.active || 0}</span></div>
        <div className="sidebar-stat-row"><span>✅ Completed</span><span style={{color:'var(--emerald-bright)'}}>{stats?.completed || 0}</span></div>
        <div className="sidebar-stat-row"><span>💀 Failed</span><span style={{color:'var(--crimson-bright)'}}>{(stats?.total||0)-(stats?.active||0)-(stats?.completed||0)}</span></div>
      </div>

      {/* ─ Logout ─ */}
      <button className="logout-btn" onClick={onLogout}>🚪 &nbsp;Logout ({username})</button>
    </div>
  );
}

// ── WORLD MAP ─────────────────────────────────────────────────────────────────
function WorldMap({ quests, stats, onZoneClick }) {
  const activeByZone = {};
  quests.filter(q => q.status === 'active').forEach(q => {
    activeByZone[q.zone] = (activeByZone[q.zone] || 0) + 1;
  });

  const nodes = [
    { id:'work',     x:300, y:165, rx:82, ry:52 },
    { id:'personal', x:525, y:305, rx:72, ry:46 },
    { id:'health',   x:175, y:345, rx:76, ry:49 },
    { id:'learning', x:415, y:460, rx:74, ry:47 },
    { id:'social',   x:645, y:185, rx:70, ry:45 },
  ];
  const paths = [
    [nodes[0], nodes[1]], [nodes[0], nodes[2]],
    [nodes[1], nodes[4]], [nodes[1], nodes[3]],
    [nodes[2], nodes[3]],
  ];

  return (
    <div className="map-view">
      <div className="board-header">
        <div className="board-title">🗺️ &nbsp;The Realm Map</div>
        <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontFamily:'var(--font-heading)'}}>Click a zone to filter quests</div>
      </div>
      <div className="map-container">
        <svg viewBox="0 0 820 560" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a1526" />
              <stop offset="100%" stopColor="#050408" />
            </radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow2"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            {Object.entries(ZONES).map(([k,z]) => (
              <radialGradient key={k} id={`zg-${k}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={z.color} stopOpacity="0.45"/>
                <stop offset="100%" stopColor={z.color} stopOpacity="0.03"/>
              </radialGradient>
            ))}
          </defs>

          <rect width="820" height="560" fill="url(#mapBg)" />
          {/* Grid */}
          {Array.from({length:12}).map((_,i) => <line key={`h${i}`} x1="0" y1={i*50} x2="820" y2={i*50} stroke="rgba(201,151,42,0.04)" strokeWidth="1"/>)}
          {Array.from({length:17}).map((_,i) => <line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="560" stroke="rgba(201,151,42,0.04)" strokeWidth="1"/>)}

          {/* Continent */}
          <ellipse cx="405" cy="285" rx="375" ry="245" fill="rgba(18,14,26,0.55)" stroke="rgba(201,151,42,0.07)" strokeWidth="1"/>
          <ellipse cx="405" cy="285" rx="305" ry="195" fill="rgba(24,19,36,0.4)"/>

          {/* Paths */}
          {paths.map(([a, b], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(201,151,42,0.18)" strokeWidth="1.5" strokeDasharray="6 4"
              style={{animation:`path-march 25s linear infinite`}} />
          ))}

          {/* Zones */}
          {nodes.map(node => {
            const z   = ZONES[node.id];
            const cnt = activeByZone[node.id] || 0;
            const zs  = stats?.byZone?.find(b => b._id === node.id);
            const total = zs?.count || 0;
            const done  = zs?.completed || 0;
            const pct   = total > 0 ? Math.round((done/total)*100) : 0;
            return (
              <g key={node.id} style={{cursor:'pointer'}}
                onClick={() => onZoneClick(node.id)}
                transform={`translate(${node.x},${node.y})`}>
                {/* Aura */}
                <ellipse rx={node.rx+22} ry={node.ry+16} fill={`url(#zg-${node.id})`}>
                  <animate attributeName="rx" values={`${node.rx+16};${node.rx+26};${node.rx+16}`} dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="ry" values={`${node.ry+12};${node.ry+20};${node.ry+12}`} dur="3s" repeatCount="indefinite"/>
                </ellipse>
                {/* Body */}
                <ellipse rx={node.rx} ry={node.ry} fill={`${z.color}15`} stroke={z.color} strokeWidth="1.5" filter="url(#glow)"/>
                <ellipse rx={node.rx-16} ry={node.ry-11} fill={`${z.color}08`} stroke={`${z.color}50`} strokeWidth="0.5"/>
                {/* Labels */}
                <text textAnchor="middle" y="-9" fill={z.color} fontSize="11.5" fontFamily="Cinzel,serif" fontWeight="700" filter="url(#glow)">{z.label}</text>
                <text textAnchor="middle" y="8" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="Cinzel,serif">{z.emoji} {cnt > 0 ? `${cnt} Active` : 'Peaceful'}</text>
                {total > 0 && <text textAnchor="middle" y="22" fill={z.color} fontSize="9" fontFamily="Cinzel,serif" opacity="0.65">{pct}% Complete</text>}
                {/* Pulse dot */}
                <circle r="5" fill={z.color} filter="url(#glow2)">
                  <animate attributeName="r" values="4;8;4" dur="2.2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.2s" repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })}

          {/* Compass */}
          <g transform="translate(762,58)">
            {[['N',0,-20],['S',0,26],['E',24,6],['W',-24,6]].map(([l,x,y]) => (
              <text key={l} x={x} y={y} textAnchor="middle" fill="rgba(201,151,42,0.45)" fontSize="9" fontFamily="Cinzel,serif">{l}</text>
            ))}
            <circle r="16" fill="none" stroke="rgba(201,151,42,0.2)" strokeWidth="1"/>
            <line x1="0" y1="-13" x2="0" y2="13" stroke="rgba(201,151,42,0.35)" strokeWidth="1"/>
            <line x1="-13" y1="0" x2="13" y2="0" stroke="rgba(201,151,42,0.35)" strokeWidth="1"/>
          </g>

          {/* Legend */}
          <g transform="translate(16,16)">
            <rect width="165" height="116" rx="3" fill="rgba(4,3,8,0.85)" stroke="rgba(201,151,42,0.18)" strokeWidth="1"/>
            <text x="10" y="22" fill="rgba(201,151,42,0.75)" fontSize="9" fontFamily="Cinzel,serif" fontWeight="700" letterSpacing="2">THE REALM</text>
            {Object.entries(ZONES).map(([k,z],i) => (
              <g key={k} transform={`translate(10,${38+i*15})`}>
                <circle cx="4" r="4" fill={z.color} opacity="0.8"/>
                <text x="13" fill="rgba(232,217,176,0.65)" fontSize="9" fontFamily="Cinzel,serif" dominantBaseline="middle">{z.label.replace('The ','')}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ char, stats, quests }) {
  if (!char || !stats) return <div className="dashboard-view">{[1,2,3].map(i=><div key={i} className="shimmer" style={{height:'80px',marginBottom:'1rem'}}/>)}</div>;

  const recent = quests.filter(q => q.status === 'completed')
    .sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 6);

  return (
    <div className="dashboard-view">
      <div className="board-header">
        <div className="board-title">📊 &nbsp;Kingdom Ledger</div>
      </div>

      {/* Stat cards */}
      <div className="stats-row">
        {[
          { icon:'⚔️', val:stats.active,          label:'Active Quests',  color:'var(--amber-bright)' },
          { icon:'✅', val:stats.completed,         label:'Quests Slain',   color:'var(--emerald-bright)' },
          { icon:'💰', val:char.gold,              label:'Gold Earned',    color:'var(--gold-bright)' },
          { icon:'⭐', val:char.level,             label:'Hero Level',     color:'var(--gold)' },
          { icon:'✨', val:char.xp,               label:'Current XP',     color:'var(--sapphire-bright)' },
          { icon:'💀', val:char.totalFailed,       label:'Quests Failed',  color:'var(--crimson-bright)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-val" style={{color:s.color}}>{s.val}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Zone progress */}
      <div className="section-title">⚔️ Zone Progress</div>
      <div className="zone-progress-grid">
        {Object.entries(ZONES).map(([k, z]) => {
          const zs    = stats.byZone?.find(b => b._id === k);
          const total = zs?.count || 0;
          const done  = zs?.completed || 0;
          const pct   = total > 0 ? Math.round((done/total)*100) : 0;
          return (
            <div key={k} className="zone-progress-card">
              <div className="zone-progress-header">
                <span style={{fontSize:'1.3rem'}}>{z.emoji}</span>
                <div>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'0.82rem',color:'var(--text-bright)'}}>{z.label}</div>
                  <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontFamily:'var(--font-heading)'}}>{done}/{total} complete</div>
                </div>
                <div style={{marginLeft:'auto',fontFamily:'var(--font-heading)',fontSize:'0.85rem',color:z.color}}>{pct}%</div>
              </div>
              <div className="zone-progress-bar">
                <div className="zone-progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${z.color}66,${z.color})`}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent victories */}
      {recent.length > 0 && (
        <>
          <div className="section-title" style={{marginTop:'1.5rem'}}>🏆 Recent Victories</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {recent.map(q => (
              <div key={q._id} className="recent-row">
                <div>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'0.85rem',color:'var(--text-bright)'}}>{q.title}</div>
                  <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontStyle:'italic'}}>{ZONES[q.zone]?.label} · {DIFF_STARS[q.difficulty]}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'var(--gold)',fontSize:'0.75rem',fontFamily:'var(--font-heading)'}}>+{q.xpReward} XP</div>
                  <div style={{color:'var(--gold-dim)',fontSize:'0.68rem',fontFamily:'var(--font-heading)'}}>+{q.goldReward} 💰</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [token,    setToken]    = useState(() => localStorage.getItem('qh_token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('qh_user')  || '');

  const [tab,          setTab]          = useState('quests');
  const [quests,       setQuests]       = useState([]);
  const [char,         setChar]         = useState(null);
  const [stats,        setStats]        = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [filterZone,   setFilterZone]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [toasts,       setToasts]       = useState([]);
  const [levelUp,      setLevelUp]      = useState(null);
  const [soundOn,      setSoundOn]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const toastId = useRef(0);

  // Set auth token on every api request
  useEffect(() => {
    api.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
  }, [token]);

  const sfx   = useCallback((type) => SFX.play(type, soundOn), [soundOn]);
  const toast = useCallback((msg, type='info', icon='⚔️') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, msg, type, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [q, c, s] = await Promise.all([
        api.get('/quests'), api.get('/character'), api.get('/stats')
      ]);
      setQuests(q.data); setChar(c.data); setStats(s.data);
    } catch (e) {
      if (e.response?.status === 401) {
        handleLogout();
      } else {
        toast('Server unreachable. Is node server.js running?', 'warning', '⚠️');
      }
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) fetchAll(); else setLoading(false); }, [fetchAll]);

  // ── AUTH ──
  const handleAuth = ({ token: t, username: u }) => {
    localStorage.setItem('qh_token', t);
    localStorage.setItem('qh_user',  u);
    setToken(t); setUsername(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('qh_token');
    localStorage.removeItem('qh_user');
    setToken(''); setUsername('');
    setChar(null); setQuests([]); setStats(null);
  };

  // ── QUEST ACTIONS ──
  const handleAdd = async (form) => {
    sfx('add');
    try {
      const { data } = await api.post('/quests', form);
      setQuests(q => [data, ...q]);
      await fetchAll();
      toast(`Quest issued: "${data.title}"`, 'info', '📜');
    } catch(e) { toast('Failed to create quest', 'warning', '⚠️'); }
  };

  const handleComplete = async (id) => {
    sfx('complete');
    try {
      const { data } = await api.put(`/quests/${id}/complete`);
      setChar(data.character);
      await fetchAll();
      toast(`+${data.quest.xpReward} XP  +${data.quest.goldReward} Gold — Quest Complete!`, 'success', '✅');
      if (data.leveledUp) { sfx('levelup'); setLevelUp(data.character.level); }
    } catch(e) { toast('Could not complete quest', 'warning', '⚠️'); }
  };

  const handleFail = async (id) => {
    sfx('fail');
    try {
      const { data } = await api.put(`/quests/${id}/fail`);
      setChar(data.character);
      await fetchAll();
      toast('Quest abandoned. -10 HP. Press on, adventurer.', 'warning', '💔');
    } catch(e) {}
  };

  const handleDelete = async (id) => {
    sfx('click');
    await api.delete(`/quests/${id}`);
    setQuests(q => q.filter(x => x._id !== id));
    await fetchAll();
  };

  const handleUpdate = async (upd) => {
    const { data } = await api.put('/character', upd);
    setChar(data);
  };

  const handleZoneClick = (zone) => {
    sfx('click'); setFilterZone(zone); setTab('quests');
  };

  const filtered = quests.filter(q => {
    const zOk = filterZone   === 'all' || q.zone   === filterZone;
    const sOk = filterStatus === 'all' || q.status === filterStatus;
    return zOk && sOk;
  });

  // ── GATE: show auth if no token ──
  if (!token) return <AuthPage onAuth={handleAuth} />;

  return (
    <>
      <ParticleField />
      <div className="app-shell">

        {/* ─ Header ─ */}
        <header className="header">
          <div className="header-logo"><span>⚔️</span>QuestHub</div>
          <nav className="header-nav">
            {[
              { id:'quests',    label:'📜 Quest Board' },
              { id:'map',       label:'🗺️ World Map' },
              { id:'dashboard', label:'📊 Ledger' },
            ].map(t => (
              <button key={t.id} className={`nav-btn ${tab===t.id?'active':''}`}
                onClick={() => { sfx('click'); setTab(t.id); }}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="header-right">
            {char && <div className="header-gold">💰 {char.gold}</div>}
            {char && <div className="header-level">⭐ Lv.{char.level}</div>}
            <button className="sound-btn" onClick={() => setSoundOn(s=>!s)} title="Toggle Sound">
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </header>

        {/* ─ Sidebar ─ */}
        <CharSidebar
          char={char} username={username} stats={stats}
          onUpdate={handleUpdate} onLogout={handleLogout} sfx={sfx}
        />

        {/* ─ Main ─ */}
        <main className="main-content">

          {tab === 'quests' && (
            <div className="board-view">
              <div className="board-header">
                <div className="board-title">📜 &nbsp;Quest Board</div>
                <button className="add-quest-btn" onClick={() => { sfx('click'); setShowAdd(true); }}>
                  + Issue Quest
                </button>
              </div>

              {/* Zone filter */}
              <div className="filter-bar">
                <span className="filter-label">Zone:</span>
                {[['all','🌍 All'], ...Object.entries(ZONES).map(([k,z]) => [k, `${z.emoji} ${k.charAt(0).toUpperCase()+k.slice(1)}`])].map(([k,l]) => (
                  <button key={k} className={`filter-chip ${filterZone===k?'active':''}`}
                    onClick={() => { sfx('click'); setFilterZone(k); }}>{l}</button>
                ))}
              </div>

              {/* Status filter */}
              <div className="filter-bar">
                <span className="filter-label">Status:</span>
                {[['active','⚔️ Active'],['completed','✅ Completed'],['failed','💀 Failed'],['all','All']].map(([k,l]) => (
                  <button key={k} className={`filter-chip ${filterStatus===k?'active':''}`}
                    onClick={() => { sfx('click'); setFilterStatus(k); }}>{l}</button>
                ))}
              </div>

              {loading ? (
                <div>{[1,2,3].map(i=><div key={i} className="shimmer" style={{height:'90px',marginBottom:'0.7rem'}}/>)}</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚔️</div>
                  <div style={{fontFamily:'var(--font-heading)',color:'var(--gold-dim)',marginBottom:'0.4rem'}}>No Quests Found</div>
                  <p>Issue your first quest to begin your legend.</p>
                </div>
              ) : (
                <div className="quest-columns">
                  {['active','completed','failed'].map(status => {
                    if (filterStatus !== 'all' && filterStatus !== status) return null;
                    const col = filtered.filter(q => q.status === status);
                    const icons = { active:'⚔️', completed:'✅', failed:'💀' };
                    return (
                      <div key={status}>
                        <div className="quest-column-header">
                          {icons[status]} {status.charAt(0).toUpperCase()+status.slice(1)} ({col.length})
                        </div>
                        {col.map(q => (
                          <QuestCard key={q._id} quest={q}
                            onComplete={handleComplete} onFail={handleFail}
                            onDelete={handleDelete} sfx={sfx} />
                        ))}
                        {col.length === 0 && (
                          <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontStyle:'italic',fontFamily:'var(--font-heading)',padding:'0.8rem 0'}}>None yet</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'map' && (
            <WorldMap quests={quests} stats={stats} onZoneClick={handleZoneClick} />
          )}

          {tab === 'dashboard' && (
            <Dashboard char={char} stats={stats} quests={quests} />
          )}
        </main>
      </div>

      {showAdd  && <AddQuestModal onClose={() => setShowAdd(false)} onAdd={handleAdd} initialZone={filterZone} />}
      {levelUp  && <LevelUpOverlay level={levelUp} onDone={() => setLevelUp(null)} />}
      <Toast toasts={toasts} />
    </>
  );
}
