import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Shield, Zap, History, 
  CheckCircle2, Lightbulb, AlertTriangle, User,
  Globe, ArrowLeft
} from 'lucide-react';
import { generateMission, calculateScore, CipherMission } from '../src/lib/cipherUtils';
import confetti from 'canvas-confetti';
import { useAuth } from '../src/context/AuthContext';

// --- Types ---
interface UserData {
  uid: string;
  callsign: string;
  theme: 'cyan' | 'green' | 'purple' | 'orange' | 'magenta';
  totalPoints: number;
  completedLevelIds: string[];
}

interface LeaderboardEntry {
  uid: string;
  callsign: string;
  points: number;
}

const THEMES: Record<string, string> = {
  cyan: '#00e5ff',
  green: '#00ff88',
  purple: '#b200ff',
  orange: '#ff8800',
  magenta: '#ff00aa'
};

// --- API helpers ---
async function fetchProfile(): Promise<UserData | null> {
  try {
    const res = await fetch('/api/cipherlab/profile', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile;
  } catch { return null; }
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch('/api/cipherlab/leaderboard', { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries || [];
  } catch { return []; }
}

async function submitScore(points: number, missionId: string) {
  try {
    const res = await fetch('/api/cipherlab/complete-mission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ points, missionId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function updateThemeAPI(theme: string) {
  try {
    await fetch('/api/cipherlab/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ theme }),
    });
  } catch {}
}

async function fetchGlobalXp(): Promise<{xp: number, level: number}> {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) return { xp: 0, level: 1 };
    const data = await res.json();
    return { xp: Number(data.profile?.xp || 0), level: Number(data.profile?.level || 1) };
  } catch { return { xp: 0, level: 1 }; }
}

async function updateGlobalXp(delta: number): Promise<{xp: number, level: number}> {
  try {
    const res = await fetch('/api/me/xp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ delta }),
    });
    if (!res.ok) return { xp: 0, level: 1 };
    const data = await res.json();
    return { xp: data.xp || 0, level: data.level || 1 };
  } catch { return { xp: 0, level: 1 }; }
}

// --- Main App ---
export default function App() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dash' | 'lab' | 'leaderboard'>('dash');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalXp, setGlobalXp] = useState(0);

  useEffect(() => {
    (async () => {
      if (!authUser) return;
      const profile = await fetchProfile();
      if (!profile) { window.location.href = '/account?mode=login'; return; }
      setUser(profile);
      setLoading(false);
      setLeaderboard(await fetchLeaderboard());
      setGlobalXp(authUser.xp);
    })();
  }, [authUser]);

  useEffect(() => {
    const id = setInterval(async () => setLeaderboard(await fetchLeaderboard()), 30000); // 30 seconds
    return () => clearInterval(id);
  }, []);

  const handleComplete = async (points: number, missionId: string) => {
    // Optimistic update for local UI
    setGlobalXp(prev => prev + points);
    
    const result = await submitScore(points, missionId);
    if (result && user) {
      setUser(prev => prev ? ({ ...prev, totalPoints: result.totalPoints, completedLevelIds: result.completedLevelIds }) : null);
      setLeaderboard(await fetchLeaderboard());
      // Sync to global AuthContext
      await refreshUser();
    }
  };

  const handleThemeChange = async (theme: UserData['theme']) => {
    if (!user) return;
    setUser(prev => prev ? ({ ...prev, theme }) : null);
    await updateThemeAPI(theme);
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[#00e5ff] font-mono text-xl tracking-[0.3em]"
      >
        BOOTING_SYSTEM...
      </motion.div>
    </div>
  );

  return (
    <div 
      className="relative min-h-screen terminal-grid selection:bg-white selection:text-black"
      style={{ '--current-theme-color': THEMES[user?.theme || 'cyan'] } as any}
    >
      <div className="scanline" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] opacity-20 blur-[120px]" style={{ backgroundColor: THEMES[user?.theme || 'cyan'] }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] opacity-20 blur-[120px]" style={{ backgroundColor: THEMES[user?.theme || 'cyan'] }} />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12">
        <AnimatePresence mode="wait">
          {view === 'dash' && user && (
            <Dashboard user={user} leaderboard={leaderboard} onStartLab={() => setView('lab')} onViewLeaderboard={() => setView('leaderboard')} onThemeChange={handleThemeChange} />
          )}
          {view === 'lab' && user && (
            <CipherLab user={user} globalXp={globalXp} onComplete={handleComplete} onExit={() => setView('dash')} onXpChange={setGlobalXp} />
          )}
          {view === 'leaderboard' && user && (
            <Leaderboard user={user} entries={leaderboard} onExit={() => setView('dash')} />
          )}
        </AnimatePresence>
      </main>

      {user && (
        <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center glass-panel">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-sm hover:bg-white/10 transition-colors" title="Back to CipherQuest">
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </a>
            <div className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-sm" style={{ borderColor: THEMES[user.theme] }}>
              <Shield className="w-5 h-5" style={{ color: THEMES[user.theme] }} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase opacity-50 tracking-widest">Operative</div>
              <div className="font-mono font-bold tracking-tight">{user.callsign}</div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-xs font-mono uppercase opacity-50 tracking-widest">TOTAL_XP</div>
              <div className="font-display text-xl font-bold" style={{ color: THEMES[user.theme] }}>{globalXp.toLocaleString()}</div>
            </div>
            <button onClick={() => setView('dash')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Terminal className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

// --- Dashboard ---
function Dashboard({ user, leaderboard, onStartLab, onViewLeaderboard, onThemeChange }: { 
  user: UserData, leaderboard: LeaderboardEntry[], onStartLab: () => void, onViewLeaderboard: () => void, onThemeChange: (t: UserData['theme']) => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <header className="space-y-2">
          <div className="text-xs font-mono uppercase opacity-50 tracking-[0.4em]">Sector_01 // Missions</div>
          <h1 className="text-5xl font-display font-bold uppercase tracking-tighter">Cipher_Lab</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={onStartLab} className="glass-panel p-8 rounded-sm group cursor-pointer hover:border-current-theme transition-all duration-500" style={{ '--current-theme-color': THEMES[user.theme] } as any}>
            <div className="flex justify-between items-start mb-12">
              <Terminal className="w-10 h-10 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: THEMES[user.theme] }} />
              <div className="text-xs font-mono px-3 py-1 bg-white/10 rounded-full">ACTIVE_LAB</div>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold mb-2 uppercase">Neural Lab</h3>
              <p className="text-white/40 text-sm font-mono leading-relaxed group-hover:text-white/60 transition-colors mb-6">
                EXECUTE DECRYPTION SEQUENCES. CHALLENGE YOUR NEURAL CAPACITY IN REAL-TIME.
              </p>
              <button onClick={(e) => { e.stopPropagation(); onStartLab(); }} className="cyber-button text-xs py-3 w-full group-hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(0,229,255,0.3)]" style={{ backgroundColor: THEMES[user.theme] }}>
                ENTER_LAB
              </button>
            </div>
            <div className="mt-8 h-1 w-0 bg-[var(--current-theme-color)] group-hover:w-full transition-all duration-700" />
          </div>

          <div onClick={onViewLeaderboard} className="glass-panel p-8 rounded-sm overflow-hidden cursor-pointer hover:border-white/40 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-mono uppercase opacity-50 tracking-widest">Global Rankings</h3>
              <Globe className="w-4 h-4 opacity-30" />
            </div>
            <div className="space-y-4">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-sm font-mono border-b border-white/5 pb-2">
                  <div className="flex items-center gap-4">
                    <span className="opacity-20 w-4">{i+1}</span>
                    <span className="truncate max-w-[120px]">{entry.callsign}</span>
                  </div>
                  <span className="font-bold tracking-wider" style={{ color: THEMES[user.theme] }}>{entry.points.toLocaleString()} XP</span>
                </div>
              ))}
              {leaderboard.length === 0 && <div className="text-[10px] opacity-30 text-center py-4">FETCHING_RANKINGS...</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <div className="glass-panel p-6 rounded-sm">
          <h4 className="text-xs font-mono uppercase opacity-50 mb-4 tracking-widest">Operative Logs</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-white/5">
              <span className="text-white/40">COMPLETED_CIPHERS</span>
              <span className="font-mono">{user.completedLevelIds.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-white/40">SYSTEM_STATUS</span>
              <span className="font-mono text-green-500">ONLINE</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-sm">
          <h4 className="text-xs font-mono uppercase opacity-50 mb-4 tracking-widest">UI_Aesthetic</h4>
          <div className="flex gap-3">
            {(Object.keys(THEMES) as UserData['theme'][]).map(t => (
              <button key={t} onClick={() => onThemeChange(t)}
                className={`w-9 h-9 rounded-sm border-2 transition-all ${user.theme === t ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                style={{ backgroundColor: THEMES[t], borderColor: user.theme === t ? 'white' : 'transparent' }}
              />
            ))}
          </div>
        </div>

        <a href="/dashboard" className="w-full flex items-center justify-center gap-2 p-4 text-xs font-mono uppercase text-white/40 hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 transition-all border border-transparent hover:border-[#00e5ff]/20">
          <ArrowLeft className="w-4 h-4" /> Back to CipherQuest
        </a>
      </div>
    </motion.div>
  );
}

// --- CipherLab Gameplay ---
function CipherLab({ user, globalXp, onComplete, onExit, onXpChange }: { user: UserData, globalXp: number, onComplete: (points: number, id: string) => void, onExit: () => void, onXpChange: (xp: number) => void }) {
  const [sessionMission, setSessionMission] = useState<CipherMission | null>(null);
  const [userInput, setUserInput] = useState('');
  const [hintsCount, setHintsCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'success' | 'error'>('none');

  const startNewMission = useCallback(() => {
    const level = user.completedLevelIds.length < 5 ? 1 : user.completedLevelIds.length < 12 ? 2 : 3;
    const mission = generateMission(level, user.completedLevelIds.length);
    setSessionMission(mission);
    setUserInput('');
    setHintsCount(0);
    setTimeLeft(300);
    setIsActive(true);
    setStartTime(Date.now());
    setFeedback('none');
  }, [user.completedLevelIds]);

  useEffect(() => { startNewMission(); }, [startNewMission]);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setFeedback('error');
      setTimeout(() => startNewMission(), 1500);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionMission || !isActive) return;
    if (userInput.toUpperCase().trim() === sessionMission.originalText) {
      const timeSpent = (Date.now() - startTime) / 1000;
      const basePoints = sessionMission.difficulty === 'easy' ? 100 : sessionMission.difficulty === 'medium' ? 250 : 500;
      const points = calculateScore(basePoints, timeSpent, 300, hintsCount);
      setFeedback('success');
      setIsActive(false);
      onComplete(points, sessionMission.id);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [THEMES[user.theme], '#ffffff'] });
    } else {
      setFeedback('error');
      setUserInput('');
      setTimeout(() => setFeedback('none'), 1000);
    }
  };

  const handleSkip = () => { setFeedback('none'); setUserInput(''); setHintsCount(0); startNewMission(); };
  const revealHint = async () => {
    if (!sessionMission || hintsCount >= sessionMission.originalText.length) return;
    if (globalXp <= 0) return; // Can't use hints at 0 XP
    setHintsCount(prev => prev + 1);
    // Deduct 20 XP from global
    const result = await updateGlobalXp(-20);
    onXpChange(result.xp);
  };

  const getRevealedWord = () => {
    if (!sessionMission || hintsCount < 1) return null;
    const revealedCount = hintsCount;
    return sessionMission.originalText.split('').map((char, i) => i < revealedCount ? char : '_').join(' ');
  };

  if (!sessionMission) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-1.5 h-1.5 bg-[color:var(--current-theme-color)] rounded-full animate-ping" />
             <h2 className="text-[10px] font-mono uppercase opacity-40 tracking-[0.4em]">Sector_01 // Neural_Breach</h2>
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-5xl font-display font-bold uppercase tracking-tight text-white glow-text-theme">Cipher_Lab</h1>
            <div className="px-4 py-1.5 tactical-panel border-[color:var(--current-theme-color)]/20 bg-[color:var(--current-theme-color)]/5">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[color:var(--current-theme-color)]">
                RANK_{sessionMission.level} :: {sessionMission.difficulty.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="tactical-panel px-8 py-4 flex flex-col items-end min-w-[180px] bg-black/40">
          <span className="text-[9px] font-mono uppercase opacity-30 tracking-widest mb-1">Time_Stability</span>
          <div className={`text-4xl font-display font-bold ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="tactical-panel p-16 rounded-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] bg-[#0a0a0f]/95 shadow-inner">
            <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[color:var(--current-theme-color)]/30 to-transparent" />
            
            <div className="text-[10px] font-mono uppercase opacity-20 tracking-[0.6em] mb-12">&gt; Encrypted_Package_Intercepted</div>
            <div className="text-6xl md:text-8xl font-display font-bold tracking-widest text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] break-all text-center leading-[0.9]">
              {sessionMission.encryptedText}
            </div>
            
            {hintsCount >= 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 px-10 py-4 tactical-panel border-[color:var(--current-theme-color)]/30 bg-[color:var(--current-theme-color)]/10">
                <span className="text-[9px] font-mono uppercase opacity-40 block mb-2 text-center tracking-widest">Partial_Reconstruction</span>
                <div className="font-mono text-3xl tracking-[0.4em] text-white font-bold">{getRevealedWord()}</div>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[color:var(--current-theme-color)]/20 to-transparent blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
            <div className="relative flex gap-4 bg-[#0a0a0f] p-1 border border-white/10 focus-within:border-[color:var(--current-theme-color)]/40 transition-all">
              <input 
                type="text" 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value.toUpperCase())} 
                disabled={!isActive || feedback === 'success'} 
                autoFocus 
                autoComplete="off"
                className={`flex-1 bg-transparent p-6 font-mono text-4xl tracking-[0.2em] focus:outline-none transition-colors uppercase text-white placeholder:text-white/5 font-bold`}
                placeholder="DECRYPT_KEY..." 
              />
              <button 
                type="submit" 
                disabled={!isActive || feedback === 'success'} 
                className="cyber-button px-16 h-[88px] text-xl"
              >
                BREACH
              </button>
            </div>
          </form>

          <AnimatePresence>
            {feedback === 'success' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tactical-panel border-green-500/50 bg-green-500/10 p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-green-500 border-4 border-green-400/30 rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="text-black" size={32} />
                  </div>
                  <div>
                    <div className="text-green-500 font-display text-2xl font-bold tracking-widest uppercase">Breach_Success</div>
                    <div className="text-[10px] text-green-500/60 font-mono uppercase tracking-widest">System_Authorization_Confirmed</div>
                  </div>
                </div>
                <button onClick={startNewMission} className="cyber-button px-10 h-12 text-sm bg-green-500 hover:bg-white hover:text-black">Next_Node</button>
              </motion.div>
            )}
            {feedback === 'error' && (
               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-4 bg-red-500/10 border border-red-500/40 rounded-sm text-red-500 font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                  <AlertTriangle size={16} /> Encryption_Mismatch: Check_Logic_Matrix
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="tactical-panel p-8 rounded-sm bg-[#0a0a0f]/90">
            <h4 className="flex items-center gap-3 text-[10px] font-mono uppercase opacity-40 mb-8 tracking-[0.3em]">
              <History className="w-4 h-4 text-[color:var(--current-theme-color)]" /> Intelligence_Feed
            </h4>
            
            <div className="space-y-8">
              <div className="bg-white/5 p-5 border border-white/5 rounded-sm">
                <div className="text-[9px] font-mono opacity-30 mb-2 uppercase tracking-widest">Target_Logic</div>
                <div className="text-sm font-mono font-bold text-white/80 leading-relaxed uppercase">{sessionMission.type.replace(/_/g, ' ')}</div>
              </div>

              <div className="space-y-4">
                <button onClick={revealHint} disabled={hintsCount >= sessionMission.originalText.length || !isActive || globalXp <= 0}
                  className="w-full flex items-center justify-center gap-3 py-5 tactical-panel border-[color:var(--current-theme-color)]/20 text-[color:var(--current-theme-color)] hover:border-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)]/5 transition-all text-[11px] font-bold tracking-[0.2em] disabled:opacity-20">
                  <Lightbulb className="w-5 h-5" /> {globalXp <= 0 ? "NO_XP_AVAIL" : `REVEAL_INTEL (-20 XP)`}
                </button>
                <button onClick={handleSkip} disabled={!isActive}
                  className="w-full py-5 text-[10px] font-mono uppercase tracking-[0.3em] border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black transition-all disabled:opacity-20">
                  Skip_Sequence
                </button>
              </div>

              <div className="p-6 bg-[color:var(--current-theme-color)]/[0.03] border border-[color:var(--current-theme-color)]/20 rounded-sm">
                <div className="text-[9px] font-mono opacity-30 mb-3 uppercase tracking-widest text-yellow-500/80">Support_Intel</div>
                <p className="text-[11px] font-mono leading-relaxed text-yellow-500/60 italic">"{sessionMission.schemeHint}"</p>
              </div>

              <button onClick={onExit} className="w-full py-5 text-[9px] font-mono uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors">
                &gt; Return_to_HQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Leaderboard ---
function Leaderboard({ user, entries, onExit }: { user: UserData, entries: LeaderboardEntry[], onExit: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-xs font-mono uppercase opacity-50 tracking-[0.4em] mb-2">Global Operational Standings</h2>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Leaderboard</h1>
        </div>
        <button onClick={onExit} className="cyber-button text-xs py-2">Back to Dash</button>
      </header>

      <div className="glass-panel rounded-lg overflow-hidden">
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-6 text-xs uppercase opacity-50 tracking-widest">Rank</th>
              <th className="p-6 text-xs uppercase opacity-50 tracking-widest">Operative</th>
              <th className="p-6 text-xs uppercase opacity-50 tracking-widest text-right">XP_Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry.uid} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${entry.uid === user.uid ? 'bg-white/10' : ''}`}>
                <td className="p-6">
                  <span className={`text-xl font-display ${idx < 3 ? 'font-bold' : 'opacity-40'}`} style={idx < 3 ? { color: THEMES[user.theme] } : {}}>
                    {idx + 1 < 10 ? '0' : ''}{idx + 1}
                  </span>
                </td>
                <td className="p-6 font-bold tracking-tight">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 opacity-30" />
                    {entry.callsign}
                    {entry.uid === user.uid && <span className="text-[9px] px-1 bg-white/20 rounded">YOU</span>}
                  </div>
                </td>
                <td className="p-6 text-right font-display text-lg" style={idx < 3 ? { color: THEMES[user.theme] } : {}}>
                  {entry.points.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="p-24 text-center text-white/20 font-mono text-sm animate-pulse uppercase tracking-[0.2em]">
            SYNCHRONIZING_GLOBAL_DATA...
          </div>
        )}
      </div>
    </motion.div>
  );
}
