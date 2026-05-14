import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Terminal, Settings, Volume2, VolumeX, Plus, Minus, LogOut } from 'lucide-react';

const RANK_NAMES: Record<number, string> = {
  1: "Recruit", 2: "Guard", 3: "Scout", 4: "Soldier",
  5: "Veteran", 6: "Elite", 7: "Captain", 8: "Hero",
};

const ROBOT_SOURCES: Record<string, string> = {
  hi: "/assets/robot_hi.png",
  sad: "/assets/robot_sad.png",
  guide: "/assets/robot.png",
  idle: "/assets/robot.gif",
};

/* ── Tutorial Steps ─────────────────────────────────────────────── */
const STEPS = [
  { type: "intro", robotMood: "hi", title: "Signal acquired.", body: "Welcome to Cipher-Quest. I am your robu, I will walk you through your console before we begin.", note: "" },
  { type: "intro", robotMood: "sad", title: "Signal acquired.", body: "Our world has been overrun by autonomous systems that rewrote their own rules. You are one of the last human operatives still off-grid.", note: "" },
  { type: "intro", robotMood: "guide", title: "Your role.", body: "Your task is to infiltrate the city network, decode hostile signals, and reclaim control one cipher at a time.", note: "Every mission advances the story that has already been set in motion." },
  { type: "tile", robotMood: "guide", tileIndex: 0, title: "Story Mode.", body: "Start the main narrative journey and progress through the resistance storyline.", note: "This is your primary campaign path." },
  { type: "tile", robotMood: "guide", tileIndex: 1, title: "CipherLab.", body: "Solve standalone cipher challenges and sharpen your decoding skills.", note: "Perfect for quick puzzle sessions." },
  { type: "tile", robotMood: "guide", tileIndex: 2, title: "Multiplayer.", body: "Play missions with other operatives and coordinate in real time.", note: "Team strategy and timing matter here." },
  { type: "tile", robotMood: "guide", tileIndex: 3, title: "Training Academy.", body: "Practice core mechanics before entering high-risk missions.", note: "Use it to train safely and improve." },
  { type: "outro", robotMood: "guide", title: "You are ready.", body: "That is the console. When you're ready, begin your first mission or explore the dashboard at your own pace.", note: "" },
];

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLevelUpdate, setShowLevelUpdate] = useState<{show: boolean, type: 'promotion' | 'demotion'}>({show: false, type: 'promotion'});
  
  const level = user?.level || 1;
  const rankName = RANK_NAMES[level] || "Recruit";

  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Tutorial State ────────────────────────────────────────────── */
  const [tutorialMode, setTutorialMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tutorialExiting, setTutorialExiting] = useState(false);
  const [tutorialInitialized, setTutorialInitialized] = useState(false);

  useEffect(() => {
    if (!user || tutorialInitialized) return;
    
    const isNewUser = searchParams.get("new") === "1" || window.location.search.includes("new=1");
    const tutorialFinished = user.gameData?.tutorialFinished;
    const tutorialStepIndex = user.gameData?.tutorialStepIndex || 0;

    if (isNewUser && !tutorialFinished) {
      setTutorialMode(true);
      setStepIndex(tutorialStepIndex);
    } else {
      setTutorialMode(false);
    }
    
    setTutorialInitialized(true);
  }, [user, searchParams, tutorialInitialized]);

  const persistTutorial = async (newIndex: number, finished: boolean) => {
    try {
      const response = await fetch("/api/me/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tutorialStepIndex: newIndex, tutorialFinished: finished }),
      });
      if (!response.ok) throw new Error("Failed to persist tutorial progress");
      await refreshUser();
    } catch (error) {
      console.error("Tutorial persistence error:", error);
      // Still update local state even if API fails
      setStepIndex(newIndex);
      if (finished) finishTutorialUI();
    }
  };

  const nextStep = () => {
    if (stepIndex < STEPS.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      persistTutorial(next, false);
    } else {
      finishTutorial();
    }
  };

  const skipIntro = () => {
    // Skip to the outro step (second to last or last step)
    const outroStep = STEPS.findIndex(s => s.type === "outro");
    const nextStep = outroStep !== -1 ? outroStep : STEPS.length - 1;
    setStepIndex(nextStep);
    persistTutorial(nextStep, false);
  };

  const finishTutorialUI = () => {
    setTutorialMode(false);
    setTutorialExiting(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("new");
    window.history.replaceState({}, "", url);
  };

  const finishTutorial = () => {
    setTutorialExiting(true);
    persistTutorial(STEPS.length - 1, true);
    setTimeout(() => {
      finishTutorialUI();
    }, 1200);
  };

  const currentStep = STEPS[stepIndex] || STEPS[0];

  /* ── Audio: Auto-play on mount ──────────────────────────────── */
  useEffect(() => {
    const audio = new Audio('/assets/background_music.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Try to autoplay immediately
    audio.play().catch(() => {
      // Browser blocked autoplay — add a one-time click listener as fallback
      const playOnInteract = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', playOnInteract);
        document.removeEventListener('keydown', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
      document.addEventListener('keydown', playOnInteract);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    refreshUser();
    [1,2,3,4,5,6,7,8].forEach(n => {
      const img = new Image();
      img.src = `/assets/badge${n}.png`;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const isNewUser = searchParams.get("new") === "1";
    if (isNewUser) {
      sessionStorage.setItem("cq_last_level", String(level));
      return;
    }

    const storedLevelStr = sessionStorage.getItem("cq_last_level");
    if (!storedLevelStr) {
      sessionStorage.setItem("cq_last_level", String(level));
    } else {
      const storedLevel = parseInt(storedLevelStr, 10);
      sessionStorage.setItem("cq_last_level", String(level));
      if (storedLevel > 0 && level !== storedLevel) {
        setShowLevelUpdate({
          show: true,
          type: level > storedLevel ? 'promotion' : 'demotion'
        });
      }
    }
  }, [user, level]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const page = document.querySelector('.page') as HTMLElement;
      if (page) {
        const px = (e.clientX / window.innerWidth) * 100;
        const py = (e.clientY / window.innerHeight) * 100;
        page.style.setProperty("--mx", `${px}%`);
        page.style.setProperty("--my", `${py}%`);
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Keyboard handler for tutorial navigation
  useEffect(() => {
    if (!tutorialMode) return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipIntro();
      }
    };
    
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [tutorialMode, stepIndex]);

  const isTutorialActive = tutorialMode && !tutorialExiting;
  const robotSrc = isTutorialActive 
    ? (ROBOT_SOURCES[currentStep.robotMood] || ROBOT_SOURCES.guide)
    : ROBOT_SOURCES.idle;
  
  const xp = user?.xp || 0;
  const username = user?.username || 'OP_RECRUIT';

  const TILES = [
    { id: 0, name: 'Story Mode', path: '/story', desc: 'Campaign Operations', color: '#00f2ff' },
    { id: 1, name: 'Cipher Lab', path: '/cipherlab', desc: 'Infiltration Training', color: '#ff00ff' },
    { id: 2, name: 'Multiplayer', path: '/multiplayer', desc: 'Active Warzone', color: '#ffaa00' },
    { id: 3, name: 'Training', path: '#', desc: 'Combat Academy', color: '#00ff88' }
  ];

  return (
    <div className="page overflow-hidden bg-[#020205] text-white">
      <div className="vignette" />
      <div className="city-bg opacity-30" />
      <div className="scanline" />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-[#59f2ff] opacity-[0.05] blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-[#ff00ff] opacity-[0.03] blur-[180px] rounded-full" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3BaseFilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-[0.02]" />
      </div>

      <header className="top-bar glass-panel relative z-50 flex justify-between items-center px-10 h-24 border-b border-white/5">
        <div className="logo-group">
          <div className="logo font-display tracking-[0.2em] text-3xl font-black">
            CIPHER<span className="text-[#59f2ff] glow-theme">QUEST</span>
          </div>
          <div className="text-[10px] font-mono uppercase opacity-30 tracking-[0.4em] mt-1">Terminal_v4.0.2_Live</div>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="stats-group hidden lg:flex items-center gap-10 border-r border-white/10 pr-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Operator_Rank</span>
              <span className="text-xl font-display font-bold text-[#59f2ff] uppercase tracking-wider">{rankName} <span className="opacity-40 text-sm ml-1">LV.{level}</span></span>
            </div>
            <div className="flex flex-col items-end min-w-[120px]">
              <span className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Neural_XP</span>
              <span className="text-xl font-display font-bold text-white tabular-nums">{xp.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="user-profile flex items-center gap-5">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono opacity-30 uppercase tracking-widest leading-none mb-1">Authenticated_As</span>
                  <span className="text-sm font-bold uppercase tracking-widest text-white/90">{username}</span>
                </div>
                <div className="w-10 h-10 tactical-panel bg-white/5 p-1">
                  <img src={`/assets/badge${level}.png`} alt={`Level ${level}`} className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)} 
                className={`w-12 h-12 tactical-panel flex items-center justify-center transition-all group ${settingsOpen ? 'border-[#59f2ff] text-[#59f2ff]' : 'text-white/20 hover:text-white'}`}
              >
                <Settings size={20} className={settingsOpen ? 'rotate-90' : 'group-hover:rotate-45'} style={{ transition: 'transform 0.4s' }} />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-64 glass-panel p-6 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[#59f2ff]/20"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Audio_Output</span>
                          <button onClick={() => setIsMuted(!isMuted)} className="text-[#59f2ff]">
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setVolume(Math.max(0, volume - 0.1))}
                            className="w-8 h-8 tactical-panel flex items-center justify-center text-white/40 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#59f2ff] transition-all" 
                              style={{ width: `${volume * 100}%` }}
                            />
                          </div>
                          <button 
                            onClick={() => setVolume(Math.min(1, volume + 0.1))}
                            className="w-8 h-8 tactical-panel flex items-center justify-center text-white/40 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="h-[1px] bg-white/5" />

                      <button 
                        onClick={() => {
                          setSettingsOpen(false);
                          setTutorialMode(true);
                          setStepIndex(0);
                          persistTutorial(0, false);
                        }}
                        className="flex items-center justify-between w-full p-3 tactical-panel bg-[#59f2ff]/5 border-[#59f2ff]/20 text-[#59f2ff] hover:bg-[#59f2ff]/20 transition-all group"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Restart_Tutorial</span>
                        <Shield size={16} className="group-hover:rotate-12 transition-transform" />
                      </button>

                      <div className="h-[1px] bg-white/5" />

                      <button 
                        onClick={logout}
                        className="flex items-center justify-between w-full p-3 tactical-panel bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                      >
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Terminate_Session</span>
                        <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="layout relative z-10 flex flex-col items-center pt-8">
        <section className={`hero-visual relative w-full max-w-7xl pt-0 pb-4 pointer-events-none transition-all duration-500 ${isTutorialActive ? 'mt-0' : 'mt-12'}`}>
          <motion.div 
            key={isTutorialActive ? 'tutorial-robot' : 'idle-robot'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: isTutorialActive ? 40 : 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-[200px] md:w-[240px] mx-auto"
          >
            <img 
              src={robotSrc} 
              alt="Assistant" 
              className="w-full h-auto filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] grayscale-[0.2] contrast-[1.1]" 
            />
          </motion.div>

          {/* Integrated Tutorial Chat Panel */}
          <AnimatePresence>
            {isTutorialActive && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full max-w-6xl z-[170] pointer-events-auto cursor-pointer group/tutorial"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                key={`tutorial-panel-${stepIndex}`}
                onClick={nextStep}
              >
                <div className="tactical-panel bg-[#0a0a0f]/98 border-[#59f2ff]/30 p-12 shadow-[0_0_100px_rgba(0,0,0,0.9)] group-hover/tutorial:border-[#59f2ff]/60 transition-colors">
                  <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/10">
                    <div className="w-2 h-2 bg-[#59f2ff] rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-[#59f2ff] uppercase tracking-[0.4em] font-bold">Cipher Unit-01</span>
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest ml-auto">[{stepIndex + 1}/{STEPS.length}]</span>
                  </div>

                  <div className="min-h-[80px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-4">{currentStep.title}</h3>
                      {currentStep.body && <p className="text-base text-white/70 leading-relaxed mb-4">{currentStep.body}</p>}
                    </div>
                    {currentStep.note && <p className="text-xs text-[#59f2ff]/60 font-mono italic">{currentStep.note}</p>}
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      {STEPS.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-2 rounded-full transition-all ${i <= stepIndex ? 'bg-[#59f2ff] w-8' : 'bg-white/10 w-3'}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-8">
                      {currentStep.type === 'intro' && stepIndex < STEPS.length - 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); skipIntro(); }}
                          className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] hover:text-white/80 transition-colors"
                        >
                          Skip_Intro
                        </button>
                      )}
                      <button 
                        className="px-12 py-4 bg-[#59f2ff] text-black font-mono text-xs uppercase tracking-[0.2em] font-black hover:bg-white hover:shadow-[0_0_40px_rgba(89,242,255,0.6)] transition-all shadow-[0_0_20px_rgba(89,242,255,0.3)] active:scale-95"
                        onClick={(e) => { e.stopPropagation(); nextStep(); }}
                      >
                        {stepIndex === STEPS.length - 1 ? 'TERMINATE' : 'CONTINUE'}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Click to continue hint */}
                <div className="text-center mt-6 animate-pulse">
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.5em]">Click_Anywhere_on_Panel_to_Proceed</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="w-full max-w-7xl px-8 mt-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TILES.map((mode) => {
              const stepData = currentStep as any;
              const isHighlighted = tutorialMode && currentStep.type === 'tile' && stepData.tileIndex !== undefined && stepData.tileIndex === mode.id;
              return (
                <button
                  key={mode.name}
                  onClick={() => !tutorialMode && mode.path !== '#' && navigate(mode.path)}
                  className={`group relative text-left transition-all duration-500 opacity-100 hover:scale-[1.02] ${
                    tutorialMode && !isHighlighted ? 'opacity-30 pointer-events-none' : ''
                  }`}
                >
                  <div 
                    className={`tactical-panel p-8 h-[220px] flex flex-col justify-between transition-all bg-[#0a0a0f]/90 border-white/5 group-hover:border-[color:var(--current-theme-color)] group-hover:bg-black group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${
                      isHighlighted ? 'tile-highlight !overflow-visible' : 'overflow-hidden'
                    }`} 
                    style={{ '--current-theme-color': mode.color } as any}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono opacity-30 uppercase tracking-[0.4em] mb-2 font-bold">Module_0{mode.id + 1}</span>
                        <h3 className="text-3xl font-display font-black uppercase tracking-tight text-white group-hover:text-[color:var(--current-theme-color)] transition-colors">{mode.name}</h3>
                      </div>
                      <Terminal size={24} className="opacity-10 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-4">
                      <p className="text-[11px] font-mono opacity-40 uppercase tracking-widest font-bold">{mode.desc}</p>
                      <div className="h-[1px] w-12 bg-white/10 transition-all duration-700 group-hover:w-full group-hover:bg-[color:var(--current-theme-color)] group-hover:shadow-[0_0_10px_var(--current-theme-color)]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Tutorial Overlay (Now non-blocking or removed) */}
      <AnimatePresence>
        {tutorialMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: tutorialExiting ? 1.2 : 0.5 }}
            className={`fixed inset-0 z-[150] pointer-events-none bg-black/20 ${tutorialExiting ? 'bg-black/0' : ''}`}
          />
        )}
      </AnimatePresence>

      {showLevelUpdate.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500" />
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={`tactical-panel p-16 max-w-xl w-full text-center border-${showLevelUpdate.type === 'promotion' ? '[color:var(--current-theme-color)]' : 'red-500'} relative z-10`}
           >
              <div className={`w-32 h-32 ${showLevelUpdate.type === 'promotion' ? 'bg-[#59f2ff] shadow-[0_0_50px_#59f2ff]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]'} mx-auto rounded-full flex items-center justify-center mb-10 animate-pulse`}>
                 <img src={`/assets/badge${level}.png`} alt="Badge" className="w-24 h-24 object-contain" />
              </div>
              <h2 className="font-display text-7xl font-black uppercase tracking-tighter text-white mb-4">
                {showLevelUpdate.type === 'promotion' ? 'PROMOTION!' : 'DEMOTION!'}
              </h2>
              <p className={`font-mono text-xs uppercase tracking-[0.4em] ${showLevelUpdate.type === 'promotion' ? 'text-[#59f2ff]' : 'text-red-500'} mb-2`}>
                Neural_Clearance_Level: 0{level}
              </p>
              <p className="font-display text-2xl font-bold text-white/60 uppercase tracking-widest mb-12">
                New Rank: {rankName}
              </p>
              <button onClick={() => setShowLevelUpdate({show: false, type: 'promotion'})} className="cyber-button w-full h-16 text-lg">Acknowledge</button>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
