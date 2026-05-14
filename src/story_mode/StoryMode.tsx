import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAPTERS, AVATAR_VARIANTS, AvatarVariant, Chapter } from './lib/game-data';
import { fetchMission, fetchHint } from './lib/api';
import { StoryModeProvider, useStoryMode } from './lib/StoryModeContext';
import { generateCertificate } from './lib/certificate';
import { Download, FileText, X as XIcon, ChevronRight, Settings, Lock, Shield, Radar, CheckCircle2, AlertCircle, MoveHorizontal, Terminal, Lightbulb, Unlock, Verified } from 'lucide-react';
import confetti from 'canvas-confetti';

const Dashboard = () => {
  const { operatorName, selectedAvatar, completedMissions, earnedBadges, setAvatar, progress, xp, completedChapters } = useStoryMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showBadges, setShowBadges] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [selectedCert, setSelectedCert] = useState<number | null>(null);
  const navigate = useNavigate();

  const cycleAvatar = () => {
    const idx = AVATAR_VARIANTS.findIndex(v => v.id === selectedAvatar.id);
    const nextIdx = (idx + 1) % AVATAR_VARIANTS.length;
    setAvatar(AVATAR_VARIANTS[nextIdx]);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => setIsDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY * 2;
    }
  };

  const getChapterProgress = (chapterId: number) => {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return 0;
    const completed = chapter.missions.filter(m => completedMissions.has(m.id)).length;
    return Math.round((completed / chapter.missions.length) * 100);
  };

  const isChapterLocked = (chapterId: number) => {
    if (chapterId === 1) return false;
    const prevChapter = CHAPTERS.find(c => c.id === chapterId - 1);
    if (!prevChapter) return false;
    return !prevChapter.missions.every(m => completedMissions.has(m.id));
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#020205] text-white font-sans selection:bg-[color:var(--current-theme-color)]/30">
      {/* Dynamic Background with Noise and Tactical Glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 grid-bg opacity-[0.1] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_90%)] pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full opacity-30 pointer-events-none blur-[120px] bg-[color:var(--current-theme-color)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3BaseFilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-[0.03] pointer-events-none"></div>
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 tactical-panel px-4 py-2 text-white/50 hover:text-white transition-all hover:border-[color:var(--current-theme-color)] group">
             <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={16} /> 
             <span className="font-mono uppercase tracking-widest text-[10px]">Return_to_HQ</span>
          </button>
          
          <div className="tactical-panel px-6 py-2 flex flex-col items-start border-white/5">
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Neural_XP</span>
              <span className="text-xl font-display font-bold text-white glow-text-theme">{xp.toLocaleString()}</span>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setShowCertificates(true); }}
            className="flex items-center gap-3 tactical-panel px-6 py-2 text-[color:var(--current-theme-color)] border-[color:var(--current-theme-color)]/30 hover:bg-[color:var(--current-theme-color)]/10 transition-all group pointer-events-auto"
          >
             <FileText size={16} /> 
             <span className="font-mono uppercase tracking-widest text-[10px]">Show_Certificates</span>
          </button>

        </div>
        
        <div className="pointer-events-auto flex items-center gap-4">
           <div className="tactical-panel px-6 py-2 flex flex-col items-end">
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Global_Progression</span>
              <span className="text-xl font-display font-bold text-[color:var(--current-theme-color)] glow-text-theme">{progress}%</span>
           </div>
           <button onClick={cycleAvatar} className="w-12 h-12 tactical-panel flex items-center justify-center hover:bg-white/5 transition-colors">
            <Settings className="h-5 w-5 text-[color:var(--current-theme-color)]" />
          </button>
        </div>
      </div>

      {/* Node Map Layout */}
      <div 
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onWheel={onWheel}
        className="absolute inset-0 flex items-center overflow-x-auto overflow-y-hidden gap-x-24 px-[10vw] hide-scrollbar z-10 pt-12 pb-24 cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-[50%] left-0 right-0 min-w-max h-[1px] bg-gradient-to-r from-transparent via-[color:var(--current-theme-color)]/20 to-transparent -translate-y-1/2 z-0 pointer-events-none"></div>

        {CHAPTERS.map((chapter) => {
          const locked = isChapterLocked(chapter.id);
          
          return (
            <div key={chapter.id} className={`relative flex items-center flex-shrink-0 min-w-[70vw] lg:min-w-[55vw] ${locked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="grid grid-cols-[auto_1fr] gap-16 w-full h-full">
                
                {/* Chapter Header Module */}
                <div className="relative z-20 flex flex-col justify-center h-[500px] w-[340px]">
                  <div className="absolute -top-12 -left-12 font-display text-[220px] font-bold text-[color:var(--current-theme-color)] opacity-[0.03] leading-none select-none z-0 pointer-events-none">
                     0{chapter.id}
                  </div>
                  <div className="tactical-panel p-10 relative overflow-hidden group transition-all duration-700 z-10 w-full h-[360px] flex flex-col justify-between border-white/5 shadow-2xl">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center rounded-sm">
                        {locked ? <Lock className="text-white/20" size={24} /> : <Shield className={getChapterProgress(chapter.id) === 100 ? 'text-[var(--current-theme-color)]' : 'text-white/20'} size={24} />}
                      </div>
                      <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[color:var(--current-theme-color)]/60">
                        {locked ? 'SEC_LOCKED' : `SEC_ID: 0${chapter.id}`}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display text-5xl font-bold tracking-tighter text-white mb-2 leading-[0.85] uppercase">
                        {chapter.title.split(':')[0]}<br/>
                        <span className="text-[color:var(--current-theme-color)]/40 text-3xl">{chapter.title.split(':')[1]}</span>
                      </h2>
                      <div className="mt-8">
                        <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] mb-3 text-white/30">
                           <span>Neutralization_Rate</span>
                           <span className="text-[color:var(--current-theme-color)]">{getChapterProgress(chapter.id)}%</span>
                        </div>
                        <div className="w-full h-[2px] bg-white/5 overflow-hidden rounded-full">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${getChapterProgress(chapter.id)}%` }}
                            className="h-full bg-[color:var(--current-theme-color)] shadow-[0_0_15px_var(--current-theme-color)]"
                           />
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[color:var(--current-theme-color)]/30 to-transparent" />
                  </div>
                </div>

                {/* Mission Gallery */}
                <div className="relative z-10 flex items-center gap-8 overflow-visible h-[500px] w-max pr-12">
                  {chapter.missions.map((mission, i) => (
                    <Link key={mission.id} to={locked ? '#' : `mission/${mission.id}`} onClick={(e) => locked && e.preventDefault()}>
                      <div className={`relative group cursor-pointer outline-none w-[280px] h-[380px] flex-shrink-0 transition-transform duration-500 hover:scale-[1.02] ${['translate-y-4', 'translate-y-[-8px]', 'translate-y-12', 'translate-y-0', 'translate-y-[-4px]'][i % 5]}`}>
                        <div className={`absolute inset-0 tactical-panel bg-[#0a0a0f]/95 border-white/5 flex flex-col group-hover:border-[color:var(--current-theme-color)]/40 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all ${completedMissions.has(mission.id) ? 'border-[color:var(--current-theme-color)]/20' : ''}`}>
                          <div className="h-40 bg-white/5 relative overflow-hidden flex items-center justify-center p-8 border-b border-white/5">
                             {completedMissions.has(mission.id) && (
                               <div className="absolute top-4 right-4 text-[color:var(--current-theme-color)] z-20 flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase">Verified</span>
                                  <CheckCircle2 size={14} />
                               </div>
                             )}
                             <Radar className={`h-20 w-20 text-white/5 group-hover:text-[color:var(--current-theme-color)]/20 transition-all duration-700 ${completedMissions.has(mission.id) ? 'text-[color:var(--current-theme-color)]/20' : ''}`} />
                          </div>
                          <div className="flex-1 p-8 flex flex-col justify-between">
                            <div className="space-y-3">
                               <div className="flex items-center gap-2">
                                 <div className="w-1 h-1 bg-[color:var(--current-theme-color)] rounded-full animate-pulse" />
                                 <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[color:var(--current-theme-color)]">
                                   Mission_Protocol
                                 </span>
                               </div>
                               <h3 className="font-display text-2xl font-bold uppercase leading-[0.9] text-white/90 group-hover:text-white group-hover:glow-text-theme transition-all">{mission.name}</h3>
                               <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest line-clamp-2">{mission.description}</p>
                            </div>
                            <div className="pt-6 flex items-center justify-between border-t border-white/5">
                               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
                                 {completedMissions.has(mission.id) ? 'Re-Intercept' : 'Begin_Breach'}
                               </span>
                               <ChevronRight className="text-white/20 group-hover:text-[color:var(--current-theme-color)] group-hover:translate-x-1 transition-all" size={16} />
                            </div>
                          </div>
                          {/* Dynamic Scanning Border */}
                          <div className="absolute top-0 left-0 w-0 h-[1px] bg-[color:var(--current-theme-color)] group-hover:w-full transition-all duration-500" />
                          <div className="absolute bottom-0 right-0 w-0 h-[1px] bg-[color:var(--current-theme-color)] group-hover:w-full transition-all duration-500" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        
        {/* Capstone Ascent */}
        <div className="flex-shrink-0 ml-12 pr-40 z-20 flex items-center h-[500px]">
          <div 
            onClick={() => progress === 100 && navigate('quantum-ascent')}
            className={`tactical-panel w-[420px] h-[360px] flex flex-col justify-center items-center relative overflow-hidden group transition-all duration-1000 ${progress === 100 ? 'cursor-pointer hover:border-[color:var(--current-theme-color)] shadow-2xl' : 'opacity-40 grayscale'}`}
          >
             <div className="absolute w-[300px] h-[300px] border border-white/5 rounded-full group-hover:animate-spin-slow group-hover:border-[color:var(--current-theme-color)]/20"></div>
             <div className="z-10 flex flex-col items-center text-center p-12">
                {progress === 100 ? <Unlock className="mb-6 text-[color:var(--current-theme-color)] glow-theme" size={72} /> : <Lock className="mb-6 text-white/10" size={72} />}
                <h3 className="font-display text-5xl font-bold uppercase leading-none text-white tracking-widest mb-3">Quantum<br/><span className="text-[color:var(--current-theme-color)]">Ascent</span></h3>
                <p className={`font-mono text-[10px] tracking-[0.3em] uppercase ${progress === 100 ? 'text-[color:var(--current-theme-color)] animate-pulse' : 'text-white/20'}`}>
                  {progress === 100 ? 'Protocol_Authorized' : 'Sector_Clearance_Required'}
                </p>
             </div>
             <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-white/10 group-hover:border-[color:var(--current-theme-color)] transition-colors" />
             <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-white/10 group-hover:border-[color:var(--current-theme-color)] transition-colors" />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-32 flex items-end px-12 pb-8 z-50 pointer-events-none">
        <div className="w-full flex justify-between items-end">
          <div className="flex flex-col gap-2 items-start pointer-events-auto">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">Global Completion</span>
            <div className="flex items-center gap-6 bg-surface-dark/90 backdrop-blur-md border border-white/10 px-8 py-4 rounded-full">
              <div className="flex items-baseline gap-1">
                 <span className="font-display text-4xl font-bold text-white">{progress}</span>
                 <span className="font-display text-xl text-white/50">%</span>
              </div>
              <div className="w-64 h-1.5 bg-surface-highlight rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white" 
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pointer-events-auto">
             <div className="font-sans text-xs text-white/40 tracking-wider uppercase">Drag or scroll to explore sectors</div>
             <MoveHorizontal className="text-white/20 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Certificate Gallery Modal */}
      <AnimatePresence>
        {showCertificates && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
          >
            <div className="w-full max-w-6xl h-full flex flex-col">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-white">Neural_Clearance_Archive</h2>
                  <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.4em] mt-2">Authenticated_As: {operatorName}</p>
                </div>
                <button onClick={() => { setShowCertificates(false); setSelectedCert(null); }} className="w-12 h-12 tactical-panel flex items-center justify-center hover:bg-white/5 transition-colors">
                  <XIcon size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pr-4 custom-scrollbar">
                {progress === 100 && (
                  <div className="tactical-panel p-6 bg-[#0a0a0f] border-[#59f2ff]/30 group hover:border-[#59f2ff] transition-all flex flex-col gap-6">
                    <div className="aspect-video bg-black/40 border border-[#59f2ff]/20 flex items-center justify-center overflow-hidden relative">
                       <img 
                         src={generateCertificate(null, operatorName, '#ffffff')} 
                         alt="Master Certificate"
                         className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-90" />
                       <div className="absolute bottom-4 left-6">
                         <div className="flex items-center gap-2 mb-1">
                            <Verified size={12} className="text-[#59f2ff]" />
                            <span className="text-[9px] font-mono text-[#59f2ff] uppercase tracking-widest font-bold">Global_Mastery</span>
                         </div>
                         <h3 className="text-xl font-display font-bold text-white uppercase">STORY_MODE_COMPLETE</h3>
                       </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setSelectedCert(999)}
                        className="flex-1 h-12 tactical-panel flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all"
                      >
                        View_Master
                      </button>
                      <a 
                        href={generateCertificate(null, operatorName, '#ffffff')}
                        download={`CipherQuest_Master_Certificate.png`}
                        className="w-12 h-12 tactical-panel flex items-center justify-center text-[#59f2ff] hover:bg-[#59f2ff]/10 transition-all"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                )}
                {completedChapters.length > 0 ? (
                  CHAPTERS.filter(c => completedChapters.includes(c.id)).map(chap => (
                    <div 
                      key={chap.id} 
                      className="tactical-panel p-6 bg-[#0a0a0f] border-white/5 group hover:border-[color:var(--current-theme-color)] transition-all flex flex-col gap-6"
                    >
                      <div className="aspect-video bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative">
                         <img 
                           src={generateCertificate(chap, operatorName, selectedAvatar.colorHex)} 
                           alt={`Chapter ${chap.id} Certificate`}
                           className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80" />
                         <div className="absolute bottom-4 left-6">
                           <span className="text-[9px] font-mono text-[color:var(--current-theme-color)] uppercase tracking-widest font-bold">Sector_Cleared</span>
                           <h3 className="text-xl font-display font-bold text-white uppercase">{chap.title.split(':')[0]}</h3>
                         </div>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedCert(chap.id)}
                          className="flex-1 h-12 tactical-panel flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                          View_Full
                        </button>
                        <a 
                          href={generateCertificate(chap, operatorName, selectedAvatar.colorHex)}
                          download={`CipherQuest_Certificate_Sector_${chap.id}.png`}
                          className="w-12 h-12 tactical-panel flex items-center justify-center text-[color:var(--current-theme-color)] hover:bg-[color:var(--current-theme-color)]/10 transition-all"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full h-full flex flex-col items-center justify-center text-white/20 py-20">
                    <AlertCircle size={48} className="mb-4 opacity-10" />
                    <span className="font-mono text-xs uppercase tracking-[0.4em]">No_Certificates_Earned</span>
                    <p className="mt-2 text-[10px] text-white/10 uppercase tracking-widest">Complete sectors to generate neural clearance certificates</p>
                  </div>
                )}

              </div>
            </div>

            {/* Fullscreen Certificate View */}
            <AnimatePresence>
              {selectedCert && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-24 bg-black/95"
                  onClick={() => setSelectedCert(null)}
                >
                  <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                    <img 
                      src={generateCertificate(selectedCert === 999 ? null : CHAPTERS.find(c => c.id === selectedCert)!, operatorName, selectedAvatar.colorHex)} 
                      alt="Full Certificate"
                      className="w-full h-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10"
                    />
                    <div className="absolute -top-16 right-0 flex gap-4">
                      <a 
                        href={generateCertificate(selectedCert === 999 ? null : CHAPTERS.find(c => c.id === selectedCert)!, operatorName, selectedAvatar.colorHex)}
                        download={selectedCert === 999 ? 'CipherQuest_Master_Certificate.png' : `CipherQuest_Certificate_Sector_${selectedCert}.png`}
                        className="h-12 tactical-panel bg-[#0a0a0f] border-white/10 px-8 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest hover:text-[color:var(--current-theme-color)] transition-all"
                      >
                        <Download size={18} /> Download_PNG
                      </a>
                      <button onClick={() => setSelectedCert(null)} className="w-12 h-12 tactical-panel bg-[#0a0a0f] border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
                        <XIcon size={24} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MissionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { completeMission, operatorName, xp, selectedAvatar } = useStoryMode();
  
  const [missionState, setMissionState] = useState<'intercept' | 'story' | 'cipher' | 'failed'>('intercept');
  const [mission, setMission] = useState<any>(null);
  const [input, setInput] = useState('');
  const [integrity, setIntegrity] = useState(100);
  const [error, setError] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedChapterId, setCompletedChapterId] = useState<number | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const missionData = useMemo(() => {
    for (const chapter of CHAPTERS) {
      const found = chapter.missions.find(m => m.id === id);
      if (found) return found;
    }
    return null;
  }, [id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    loadMission();
  }, [id]);

  const loadMission = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setLoading(true);
    setMissionState('intercept');
    setInput('');
    setIntegrity(100);
    setHints([]);
    setCurrentHintIndex(-1);
    setError(false);
    setIsSuccess(false);
    setCompletedChapterId(null);
    
    try {
      const data = await fetchMission(id!);
      setMission(data);
      setLoading(false);
      
      timeoutRef.current = setTimeout(() => {
        setMissionState('cipher');
      }, 1500);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const engageCipher = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMissionState('cipher');
  };

  const checkAnswer = async () => {
    if (!mission) return;
    if (input.toUpperCase() === mission.expectedCiphertext.toUpperCase()) {
      setIsSuccess(true);
      confetti({ particleCount: 150, spread: 70, colors: ['#00e5ff', '#ff00ff', '#ffffff'] });
      
      const result = await completeMission(id!);
      if (result?.chapterComplete) {
         const chapId = parseInt(id!.split('-')[0]);
         setCompletedChapterId(chapId);
      } else {
         setTimeout(() => navigate('/story'), 2500);
      }
    } else {
      setError(true);
      const nextIntegrity = Math.max(0, integrity - 34);
      setIntegrity(nextIntegrity);
      setInput('');
      
      if (nextIntegrity === 0) {
        setMissionState('failed');
      } else {
        setTimeout(() => setError(false), 800);
        if (hints.length === 0) requestHint();
      }
    }
  };

  const requestHint = async () => {
    if (!mission) return;
    if (hints.length === 0) {
      try {
        const data = await fetchHint({
          plaintext: mission.plaintext,
          expectedCiphertext: mission.expectedCiphertext,
          rule: mission.rule,
          userInput: input
        });
        if (data.hints?.length) {
          setHints(data.hints);
          setCurrentHintIndex(0);
        }
      } catch (e) {
        console.error('Hint fetch error', e);
      }
    } else {
      setCurrentHintIndex((prev) => (prev + 1) % hints.length);
    }
  };

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center font-mono text-[color:var(--current-theme-color)] animate-pulse tracking-widest uppercase">Initializing_Secure_Link...</div>;

  return (
    <div className="h-screen w-screen bg-[#020205] flex flex-col font-sans text-white relative overflow-hidden">
      {/* Tactical HUD Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_95%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3BaseFilter id=%27noiseFilter%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noiseFilter)%27/%3E%3C/svg%3E')] opacity-[0.02] pointer-events-none"></div>
      </div>

      {/* Top HUD Header */}
      <header className="h-20 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl flex justify-between items-center px-10 z-20 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/story')} className="flex items-center gap-4 group tactical-panel px-4 py-2 border-white/10 hover:border-[color:var(--current-theme-color)] transition-all">
            <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={18} />
            <span className="font-bold tracking-[0.2em] text-[10px] uppercase text-white/50 group-hover:text-white">Abort_Op</span>
          </button>
          
          <div className="tactical-panel px-6 py-2 flex flex-col items-start border-white/5">
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Neural_XP</span>
              <span className="text-xl font-display font-bold text-white glow-text-theme">{xp.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end">
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${integrity < 50 ? 'text-accent-magenta animate-pulse' : 'text-[color:var(--current-theme-color)]/60'}`}>Link_Integrity</span>
            <div className="h-[2px] w-64 bg-white/5 overflow-hidden mt-2 rounded-full">
              <motion.div 
                animate={{ width: `${integrity}%` }}
                className={`h-full ${integrity < 50 ? 'bg-accent-magenta shadow-[0_0_15px_#ff3e3e]' : 'bg-[color:var(--current-theme-color)] shadow-[0_0_15px_var(--current-theme-color)]'}`} 
              />
            </div>
          </div>
          <div className={`w-12 h-12 flex items-center justify-center tactical-panel ${integrity < 50 ? 'border-accent-magenta animate-pulse text-accent-magenta' : 'border-white/10 text-[color:var(--current-theme-color)]'}`}>
            <Shield size={20} />
          </div>
        </div>
      </header>

      <div className="flex-1 z-10 flex flex-col items-center py-10 relative overflow-y-auto hide-scrollbar">
        <div className="w-full max-w-[1400px] px-8 flex flex-col xl:flex-row gap-12 items-stretch min-h-full">
          
          {/* Left Panel: Cipher Interface */}
          <div className="flex-1 flex flex-col gap-8">
             <AnimatePresence mode="wait">
               {missionState === 'intercept' && (
                 <motion.div 
                  key="intercept"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center tactical-panel bg-[#0a0a0f]/95 p-12 border-white/5"
                 >
                    <Radar className="text-[color:var(--current-theme-color)] animate-ping mb-12" size={80} />
                    <h2 className="text-4xl font-display font-black uppercase tracking-tighter mb-4">Establishing_Link</h2>
                    <p className="font-mono text-xs text-white/30 tracking-[0.4em] uppercase">Scanning_Neural_Frequencies...</p>
                 </motion.div>
               )}



               {missionState === 'cipher' && (
                 <motion.div 
                  key="cipher"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col gap-8"
                 >
                   <div className="tactical-panel p-12 bg-[#0a0a0f]/90 border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[color:var(--current-theme-color)]/40 to-transparent"></div>
                      <div className="flex justify-between items-start mb-12">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] mb-2 font-bold">Signal_Intercepted</span>
                            <h3 className="text-4xl font-display font-black uppercase text-white group-hover:glow-text-theme transition-all">Encrypted_Packet</h3>
                         </div>
                         <Terminal className="text-[color:var(--current-theme-color)] opacity-40" size={32} />
                      </div>
                      
                      <div className="bg-black/50 border border-white/5 p-12 relative mb-12 group-hover:border-[color:var(--current-theme-color)]/20 transition-all">
                        <div className="absolute top-4 left-6 font-mono text-[9px] uppercase tracking-widest text-white/20">Source_Plaintext</div>
                        <div className="font-mono text-5xl md:text-6xl leading-[1.1] text-white tracking-widest break-all uppercase font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                          <span className="text-[color:var(--current-theme-color)]/20 mr-4 font-mono select-none">&gt;</span>{mission.plaintext}
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center -my-8 z-20 h-24 relative">
                         <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[color:var(--current-theme-color)]/40 to-transparent absolute"></div>
                         <div className="px-8 py-3 bg-[#0a0a0f] border border-white/10 rounded-sm relative z-20 flex items-center gap-4 shadow-xl">
                            <div className="w-2 h-2 bg-[color:var(--current-theme-color)] rounded-full animate-ping" />
                            <span className="font-mono text-[9px] text-white/60 uppercase tracking-[0.4em] font-bold">Processing_Bypass_Matrix</span>
                         </div>
                      </div>

                      {mission.fullMapping && (
                        <div className="mb-12 tactical-panel p-8 bg-white/[0.02] border-white/10">
                          <div className="flex items-center gap-3 mb-6">
                            <Verified size={16} className="text-[color:var(--current-theme-color)]" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">Decryption_Matrix_Alpha_Intercept</span>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-2">
                             {Object.entries(mission.fullMapping).map(([k, v]: [any, any]) => (
                               <div key={k} className="flex flex-col items-center p-2 border border-white/5 bg-black/40 rounded-sm">
                                 <span className="text-[9px] font-mono text-white/30 mb-1">{k}</span>
                                 <span className="text-sm font-mono font-bold text-[color:var(--current-theme-color)]">{v}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}

                      <div className={`tactical-panel p-12 relative shadow-2xl transition-all bg-[#0a0a0f]/95 border-2 ${error ? 'border-accent-magenta/50' : 'border-white/5'}`}>
                        <div className="font-mono font-bold text-[9px] uppercase tracking-[0.4em] mb-10 flex justify-between text-white/30">
                          <span>Neural_Breach_Terminal</span>
                          <span className="animate-pulse text-[color:var(--current-theme-color)]">[AWAIT_INPUT]</span>
                        </div>

                        <div className="relative flex items-center bg-white/[0.03] border border-white/5 p-8 group focus-within:border-[color:var(--current-theme-color)]/40 transition-all shadow-inner">
                          <span className="font-mono text-4xl text-white/10 select-none mr-6">&gt;</span>
                          <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                            className="w-full bg-transparent text-white font-mono text-5xl tracking-widest outline-none uppercase placeholder:text-white/5 font-bold"
                            placeholder="BREACH_KEY..."
                            autoFocus
                          />
                        </div>

                        <div className="h-12 mt-8">
                           <AnimatePresence>
                             {error && (
                               <motion.p 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="font-mono text-[11px] font-bold text-accent-magenta tracking-[0.2em] flex items-center gap-3 px-4 py-3 bg-accent-magenta/10 border border-accent-magenta/20 rounded-sm"
                               >
                                 <AlertCircle size={16} />
                                 BREACH_FAILED: DECRYPTION_MISMATCH_RECORDED.
                               </motion.p>
                             )}
                           </AnimatePresence>
                        </div>

                        <div className="mt-10 flex justify-end">
                           {!isSuccess ? (
                            <button onClick={checkAnswer} className="cyber-button px-16 h-16 text-lg">
                              EXECUTE_BREACH
                            </button>
                          ) : (
                            <button onClick={() => navigate('/story')} className="cyber-button px-16 h-16 text-lg bg-white text-black hover:shadow-[0_0_30px_white]">
                              SECURE_EXIT
                            </button>
                          )}
                        </div>
                      </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Right Panel: Hints & Intel */}
          <div className="w-full xl:w-[400px] flex flex-col gap-8">
             <div className="tactical-panel p-8 bg-[#0a0a0f]/80 border-white/5 flex flex-col gap-6">
                 {mission?.fullMapping && (
                    <div className="mb-6 p-4 bg-[color:var(--current-theme-color)]/5 border border-[color:var(--current-theme-color)]/20 rounded-sm">
                       <span className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--current-theme-color)] mb-3 block font-bold">:: Full_Decryption_Key ::</span>
                       <div className="grid grid-cols-4 gap-1">
                          {Object.entries(mission.fullMapping).map(([k, v]: [any, any]) => (
                            <div key={k} className="flex gap-2 items-center bg-black/40 px-2 py-1 border border-white/5">
                               <span className="text-[8px] font-mono text-white/30">{k}</span>
                               <span className="text-[10px] font-mono font-bold text-[color:var(--current-theme-color)]">→{v}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 )}
                 <div className="flex items-center gap-3 mb-2">
                    <Lightbulb size={18} className="text-yellow-400" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] font-bold text-white/40">Neural_Intel_Link</span>
                 </div>
                
                <div className="bg-white/[0.02] p-6 border border-white/5">
                   <p className="text-[10px] font-mono leading-relaxed text-white/60 italic break-words whitespace-pre-wrap">
                     {mission?.rule}
                   </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   {hints.length > 0 && (
                     <div className="p-6 bg-yellow-400/5 border border-yellow-400/20 rounded-sm">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-yellow-400/60 mb-2 block">AI_Suggestion ::</span>
                        <p className="text-sm font-medium text-white/80 leading-relaxed italic">"{hints[currentHintIndex]}"</p>
                     </div>
                   )}
                   <button 
                    onClick={requestHint}
                    className="w-full h-12 tactical-panel flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5 transition-all"
                   >
                     {hints.length === 0 ? 'REQUEST_AI_INTEL' : 'NEXT_INTEL_PHASE'}
                   </button>
                </div>
             </div>

             <div className="flex-1 tactical-panel p-8 bg-black/40 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-white/10 uppercase tracking-widest">Sys_Log_Live</div>
                <div className="space-y-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
                   <div className="flex gap-4">
                      <span className="text-[color:var(--current-theme-color)]">[OK]</span>
                      <span>Link_Stability_Nominal</span>
                   </div>
                   <div className="flex gap-4 animate-pulse">
                      <span className="text-yellow-500">[!]</span>
                      <span>Monitoring_Syndicate_Response</span>
                   </div>
                   <div className="flex gap-4 opacity-50">
                      <span>[..]</span>
                      <span>Awaiting_Encryption_Bypass</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Chapter Complete Popup */}
      <AnimatePresence>
        {completedChapterId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl flex flex-col items-center gap-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-display font-black uppercase tracking-tighter text-white">Sector_Secured</h2>
                <p className="font-mono text-sm text-[color:var(--current-theme-color)] uppercase tracking-[0.5em] animate-pulse">Authentication_Clearance_Generated</p>
              </div>

              <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                <img 
                  src={generateCertificate(CHAPTERS.find(c => c.id === completedChapterId)!, operatorName, selectedAvatar.colorHex)} 
                  alt="Chapter Completion Certificate"
                  className="max-w-full h-auto"
                />
              </div>

              <div className="flex gap-8">
                <a 
                  href={generateCertificate(CHAPTERS.find(c => c.id === completedChapterId)!, operatorName, selectedAvatar.colorHex)}
                  download={`CipherQuest_Certificate_Sector_${completedChapterId}.png`}
                  className="cyber-button px-16 h-16 text-lg bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-4"
                >
                  <Download size={24} /> DOWNLOAD_CLEARANCE
                </a>
                <button 
                  onClick={() => navigate('/story')}
                  className="cyber-button px-16 h-16 text-lg border-white/10 hover:bg-white/5"
                >
                  RETURN_TO_HQ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Quantum Ascent Component ──────────────────────────────────── */
const KNOX_DIALOGUES = [
  "KNOX: Operator, the Syndicate mainframe is shielded by RSA-2048 asymmetric encryption.",
  "KNOX: Conventional decryption would take approximately 300 million years.",
  "KNOX: ...Wait. I am detecting an experimental quantum co-processor attached to your terminal.",
  "KNOX: If you can manually align its qubits into harmonic resonance, I can execute Shor's Algorithm.",
  "KNOX: Probability of cryptographic collapse: 100%. Awaiting qubit alignment.",
];

const QuantumAscent = () => {
  const navigate = useNavigate();
  const { operatorName, selectedAvatar, progress, completedChapters } = useStoryMode();
  
  const [dialoguePhase, setDialoguePhase] = useState(true);
  const [dialogueIndex, setDialogueIndex] = useState(-1);
  const [quantumGrid, setQuantumGrid] = useState<boolean[]>(Array(9).fill(true));
  const [quantumSolved, setQuantumSolved] = useState(false);
  const [hintText, setHintText] = useState('');
  const [fetchingHint, setFetchingHint] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Initialize puzzle
  useEffect(() => {
    if (progress < 100) {
      navigate('/story');
      return;
    }

    // Start Knox dialogue sequence
    let idx = 0;
    setDialogueIndex(0);
    const interval = setInterval(() => {
      idx++;
      if (idx < KNOX_DIALOGUES.length) {
        setDialogueIndex(idx);
      } else {
        clearInterval(interval);
        setTimeout(() => setDialoguePhase(false), 1500);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Shuffle puzzle when dialogue ends
  useEffect(() => {
    if (!dialoguePhase) {
      const grid = Array(9).fill(true);
      const click = (idx: number, g: boolean[]) => {
        const x = idx % 3;
        const y = Math.floor(idx / 3);
        const targets: [number, number][] = [[x, y], [x-1, y], [x+1, y], [x, y-1], [x, y+1]];
        targets.forEach(([tx, ty]) => {
          if (tx >= 0 && tx < 3 && ty >= 0 && ty < 3) {
            const tidx = ty * 3 + tx;
            g[tidx] = !g[tidx];
          }
        });
      };
      for (let i = 0; i < 7; i++) {
        click(Math.floor(Math.random() * 9), grid);
      }
      if (grid.every(v => v)) click(4, grid);
      setQuantumGrid([...grid]);
    }
  }, [dialoguePhase]);

  const toggleNode = (idx: number) => {
    if (quantumSolved) return;
    const grid = [...quantumGrid];
    const x = idx % 3;
    const y = Math.floor(idx / 3);
    const targets: [number, number][] = [[x, y], [x-1, y], [x+1, y], [x, y-1], [x, y+1]];
    targets.forEach(([tx, ty]) => {
      if (tx >= 0 && tx < 3 && ty >= 0 && ty < 3) {
        const tidx = ty * 3 + tx;
        grid[tidx] = !grid[tidx];
      }
    });
    setQuantumGrid(grid);

    if (grid.every(v => v)) {
      setQuantumSolved(true);
      setTimeout(() => {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: [selectedAvatar.colorHex, '#ffffff', '#00e5ff'] });
        setTimeout(() => setShowCompletion(true), 1000);
      }, 200);
    }
  };

  const requestHint = async () => {
    if (fetchingHint) return;
    setFetchingHint(true);
    try {
      const gridState = quantumGrid.map(b => b ? '1' : '0').join('');
      const res = await fetch('/api/quantum-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gridState })
      });
      const data = await res.json();
      setHintText(data.hint || 'Realignment is complex. Trial and error often reveals the pattern.');
    } catch {
      setHintText('Try focusing on the corners first to clear the center.');
    } finally {
      setFetchingHint(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020205] flex flex-col font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_95%)] pointer-events-none"></div>
      </div>

      <header className="h-20 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl flex justify-between items-center px-10 z-20 relative">
        <button onClick={() => navigate('/story')} className="flex items-center gap-4 group tactical-panel px-4 py-2 border-white/10 hover:border-[color:var(--current-theme-color)] transition-all">
          <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={18} />
          <span className="font-bold tracking-[0.2em] text-[10px] uppercase text-white/50 group-hover:text-white">Return_to_HQ</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[color:var(--current-theme-color)] rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-[color:var(--current-theme-color)] uppercase tracking-[0.4em] font-bold">Quantum_Protocol_Active</span>
        </div>
      </header>

      <div className="flex-1 z-10 flex flex-col items-center justify-center relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {dialoguePhase ? (
            <motion.div key="dialogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl px-8">
              <div className="tactical-panel p-12 bg-[#0a0a0f]/95 border-[color:var(--current-theme-color)]/20">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 bg-[color:var(--current-theme-color)] rounded-full animate-ping" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--current-theme-color)] font-bold">KNOX_SYSTEM_LINK</span>
                </div>
                <div className="space-y-4 font-mono text-sm leading-relaxed">
                  {KNOX_DIALOGUES.map((line, i) => (
                    <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= dialogueIndex ? 1 : 0.1, x: 0 }} transition={{ delay: 0.1 }}
                      className={`${i <= dialogueIndex ? 'text-[color:var(--current-theme-color)]' : 'text-white/10'}`}
                    >{line}</motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="puzzle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-10">
              <div className="text-center">
                <h2 className="font-display text-5xl font-black uppercase tracking-tighter text-white mb-3">Qubit_Alignment</h2>
                <p className="font-mono text-[10px] text-[color:var(--current-theme-color)] uppercase tracking-[0.4em]">Toggle all qubits to ON state</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {quantumGrid.map((on, idx) => (
                  <motion.button key={idx} whileTap={{ scale: 0.9 }}
                    onClick={() => toggleNode(idx)}
                    className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-bold transition-all duration-300 ${
                      on ? 'bg-[color:var(--current-theme-color)] border-[color:var(--current-theme-color)] text-black shadow-[0_0_25px_var(--current-theme-color)]' : 'bg-white/5 border-white/10 text-white/30'
                    }`}
                  >
                    {on ? '|1⟩' : '|0⟩'}
                  </motion.button>
                ))}
              </div>

              {!quantumSolved && (
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <button onClick={requestHint} disabled={fetchingHint}
                    className="tactical-panel px-8 py-3 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-[color:var(--current-theme-color)] hover:border-[color:var(--current-theme-color)] transition-all"
                  >{fetchingHint ? 'Analyzing...' : 'Request_KNOX_Intel'}</button>
                  {hintText && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="tactical-panel p-6 bg-[color:var(--current-theme-color)]/5 border-[color:var(--current-theme-color)]/20 w-full"
                    >
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--current-theme-color)] mb-2 block font-bold">KNOX_INTEL::</span>
                      <p className="font-mono text-xs text-white/70 leading-relaxed">{hintText}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {quantumSolved && !showCompletion && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <p className="font-mono text-[color:var(--current-theme-color)] uppercase tracking-[0.4em] text-sm animate-pulse">
                    Shor's Algorithm Executing...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Story Mode Completion Popup */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-4xl flex flex-col items-center gap-10">
              <div className="text-center space-y-4">
                <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-7xl font-display font-black uppercase tracking-tighter text-white"
                >STORY_MODE<br/><span className="text-[color:var(--current-theme-color)]">COMPLETE</span></motion.h2>
                <p className="font-mono text-sm text-[color:var(--current-theme-color)] uppercase tracking-[0.5em] animate-pulse">
                  All Sectors Neutralized • Quantum Ascent Achieved
                </p>
              </div>

              <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-[color:var(--current-theme-color)]/30">
                <img 
                  src={generateCertificate({ id: 5, title: 'FINAL: QUANTUM ASCENT', missions: [] }, operatorName, selectedAvatar.colorHex)}
                  alt="Story Mode Completion Certificate"
                  className="max-w-full h-auto"
                />
              </div>

              <div className="flex gap-8">
                <a 
                  href={generateCertificate({ id: 5, title: 'FINAL: QUANTUM ASCENT', missions: [] }, operatorName, selectedAvatar.colorHex)}
                  download="CipherQuest_Story_Mode_Complete.png"
                  className="cyber-button px-16 h-16 text-lg bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-4"
                >
                  <Download size={24} /> DOWNLOAD_CERTIFICATE
                </a>
                <button onClick={() => navigate('/story')}
                  className="cyber-button px-16 h-16 text-lg border-white/10 hover:bg-white/5"
                >RETURN_TO_HQ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function StoryMode() {
  return (
    <StoryModeProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="mission/:id" element={<MissionView />} />
        <Route path="quantum-ascent" element={<QuantumAscent />} />
      </Routes>
    </StoryModeProvider>
  );
}

export default StoryMode;

