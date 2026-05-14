import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { X as XIcon } from 'lucide-react';


const Multiplayer = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchHint, setSearchHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [matchFormat, setMatchFormat] = useState(1);

  const [invites, setInvites] = useState<any[]>([]);
  const [outgoingInvites, setOutgoingInvites] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);

  const [answer, setAnswer] = useState('');
  const [roundFeedback, setRoundFeedback] = useState<{winner: string|null, correct: string|null}|null>(null);
  const [localRound, setLocalRound] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roundSplash, setRoundSplash] = useState<{show: boolean, num: number}>({show: false, num: 0});
  const [showFinalResults, setShowFinalResults] = useState(false);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => setErrorMsg(msg);

  const api = async (path: string, options: any = {}) => {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  const runSearch = async (q: string) => {
    showError('');
    if (q.length < 2) {
      setSearchHint('Type at least 2 characters.');
      setSearchResults([]);
      return;
    }
    try {
      const data = await api(`/api/multiplayer/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.users || []);
      if (!data.users || data.users.length === 0) {
        setSearchHint('No operatives match that callsign.');
      } else {
        setSearchHint('Select invite to send a duel signal.');
      }
    } catch (e: any) {
      showError(e.message);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      if (val.trim().length >= 2) runSearch(val.trim());
    }, 350);
  };

  const sendInvite = async (toUid: string) => {
    showError('');
    try {
      await api('/api/multiplayer/invite', {
        method: 'POST',
        body: JSON.stringify({ toUid, matchFormat }),
      });
      setSearchHint('Invite sent. Waiting for them to accept.');
    } catch (e: any) {
      showError(e.message);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    showError('');
    try {
      const data = await api(`/api/multiplayer/invite/${encodeURIComponent(inviteId)}/accept`, {
        method: 'POST',
      });
      if (data.match) setMatch(data.match);
      refreshMatch();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const declineInvite = async (inviteId: string) => {
    showError('');
    // Optimistic UI: remove from local state immediately
    setInvites(prev => prev.filter(inv => inv.inviteId !== inviteId));
    try {
      await api(`/api/multiplayer/invite/${encodeURIComponent(inviteId)}/decline`, {
        method: 'POST',
      });
      // Backend update is handled, local state already updated
    } catch (e: any) {
      showError(e.message);
      refreshInvites(); // Revert on error
    }
  };

  const clearInvite = async (inviteId: string) => {
    // Optimistic UI: remove from local state immediately
    setOutgoingInvites(prev => prev.filter(inv => inv.inviteId !== inviteId));
    try {
      await api(`/api/multiplayer/invite/${encodeURIComponent(inviteId)}/clear`, {
        method: 'POST',
      });
    } catch {
      refreshInvites(); // Revert on error
    }
  };

  const submitAnswer = async () => {
    if (!match || !match.matchId) return;
    showError('');
    try {
      const data = await api(`/api/multiplayer/match/${encodeURIComponent(match.matchId)}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });
      if (data.match) {
        setMatch(data.match);
        if (data.match.status === 'done') refreshUser();
      }
    } catch (e: any) {
      showError(e.message);
    }
  };

  const ackMatch = async () => {
    if (!match || !match.matchId) return;
    showError('');
    try {
      await api(`/api/multiplayer/match/${encodeURIComponent(match.matchId)}/ack`, {
        method: 'POST',
      });
      setMatch(null);
      setLocalRound(0);
      setAnswer('');
      setShowFinalResults(false);
      refreshUser();
      refreshMatch();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const forfeitMatch = async () => {
    if (!match || !match.matchId) return;
    if (!window.confirm("Are you sure you want to abort this mission? You will forfeit the duel.")) return;
    showError('');
    try {
      await api(`/api/multiplayer/match/${encodeURIComponent(match.matchId)}/forfeit`, {
        method: 'POST',
      });
      refreshMatch();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const refreshInvites = async () => {
    try {
      const incoming = await api('/api/multiplayer/invites/incoming');
      setInvites(incoming.invites || []);
      const outgoing = await api('/api/multiplayer/invites/outgoing');
      // Filter out 'accepted' since they are now matches
      setOutgoingInvites(outgoing.invites?.filter((i: any) => i.status !== 'accepted') || []);
    } catch {}
  };

  const refreshMatch = async () => {
    try {
      const data = await api('/api/multiplayer/active-match');
      setMatch(data.match);
    } catch {}
  };

  useEffect(() => {
    setSearchQuery('');
    setSearchHint('');
    refreshInvites();
    refreshMatch();
    // Reduce polling lag by checking more frequently or using focus events
    const invInterval = setInterval(refreshInvites, 5000);
    const matchInterval = setInterval(refreshMatch, 3000);
    
    // Add visibility change listener to refresh immediately when returning to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshInvites();
        refreshMatch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(invInterval);
      clearInterval(matchInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Clear answer textbox when round advances and show feedback
  useEffect(() => {
    setAnswer('');
    if (match?.lastRoundCorrectAnswer) {
      const winnerName = match.lastRoundWinner ? (match.usernames[match.lastRoundWinner] || 'Operative') : 'None (Draw)';
      setRoundFeedback({ winner: winnerName, correct: match.lastRoundCorrectAnswer });
      // Keep results visible for a while
      const timer = setTimeout(() => setRoundFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [match?.currentRound, match?.status]);

  // Round Transition Flow Logic
  useEffect(() => {
    if (!match) return;

    // Trigger flow if backend round is ahead of displayed round
    if (match.status === 'open' && match.currentRound > localRound && !isTransitioning) {
      const runRoundFlow = async () => {
        setIsTransitioning(true);
        
        // 1. If not the first round, allow time for round results to be viewed
        if (localRound > 0) {
          await new Promise(r => setTimeout(r, 4500));
          setRoundFeedback(null);
        }

        // 2. Show Round Start Splash
        setRoundSplash({ show: true, num: match.currentRound });
        await new Promise(r => setTimeout(r, 2000));
        setRoundSplash({ show: false, num: 0 });

        // 3. Finally show the new round's question
        setLocalRound(match.currentRound);
        setIsTransitioning(false);
      };
      runRoundFlow();
    } else if (match.status === 'done' && !showFinalResults && !isTransitioning) {
      const finishMatch = async () => {
        setIsTransitioning(true);
        // If the match ended normally (not forfeit), pause to show last round results
        if (match.lastRoundCorrectAnswer && match.resultReason !== 'forfeit') {
          await new Promise(r => setTimeout(r, 6000));
          setRoundFeedback(null);
        }
        setShowFinalResults(true);
        setIsTransitioning(false);
      };
      finishMatch();
    } else if (match.status === 'open' && localRound === 0) {
        // Catch-up for initial match load
        setLocalRound(0); // Ensure flow triggers
    }
  }, [match?.currentRound, match?.status, localRound, isTransitioning, showFinalResults]);

  let duelStatus = '';
  if (match && match.status === 'open') {
    if (match.myAnswered) {
      duelStatus = match.opponentAnswered ? "Both answers locked. Resolving…" : "Answer locked in. Waiting for opponent…";
    } else {
      duelStatus = match.opponentAnswered ? "⚡ Your opponent has already answered! Hurry up!" : "Decrypt and enter the original message below.";
    }
  }

  let resultTitle = '';
  let resultSub = '';
  let resultXp = '';
  let resultClass = '';

  if (match && match.status === 'done') {
    const reason = match.resultReason;
    const w = match.winnerUid;
    const xpReward = match.xpReward || 0;
    
    if (reason === "none_correct") {
      resultClass = "mp-result-line--tie";
      resultTitle = "No winner";
      resultSub = "Neither operative submitted the correct decode.";
    } else if (w === user?.uid) {
      resultClass = "mp-result-line--win";
      resultTitle = "You win!";
      const myRow = match.answers && match.answers[user?.uid];
      if (myRow && myRow.correct) {
        resultSub = "You decoded it first! Well done, operative.";
      } else {
        resultSub = "Correct decode — you take the round.";
      }
      resultXp = `+${xpReward} XP earned`;
    } else if (w) {
      resultClass = "mp-result-line--lose";
      resultTitle = "You lose";
      const names = match.usernames || {};
      const name = names[w] || "Opponent";
      const myRow = match.answers && match.answers[user?.uid || ''];
      if (myRow && !myRow.correct) {
        resultSub = `Wrong decode. ${name} had the correct answer.`;
      } else {
        resultSub = `${name} decoded it first.`;
      }
      resultXp = "0 XP";
    } else {
      resultClass = "mp-result-line--tie";
      resultTitle = "Draw";
      resultSub = "Outcome could not be determined.";
    }
  }

  return (
    <div className="mp-page">
      <div className="vignette" aria-hidden="true"></div>
      <div className="mp-bg"></div>
      <div className="mp-grid" aria-hidden="true"></div>
      <div className="mp-glow mp-glow--tl" aria-hidden="true"></div>
      <div className="mp-glow mp-glow--br" aria-hidden="true"></div>

      <header className="mp-header">
        <a className="mp-back" href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>← HQ</a>
        <div className="mp-title-block">
          <h1 className="mp-title">Multiplayer duel</h1>
        </div>
        <div className="mp-user">{user?.username || '…'}</div>
      </header>

      <main className="mp-main">
        <section className="mp-panel" hidden={!!match}>
          <h2 className="mp-panel-title">Challenge friend</h2>
          <p className="mp-panel-desc">
            Enter a callsign to find your friend. Send a duel invite and wait for them to accept.
          </p>
          <div className="mp-search-row">
            <input
              type="text"
              className="mp-input"
              placeholder="Username…"
              autoComplete="off"
              maxLength={24}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(searchQuery)}
            />
            <button type="button" className="mp-btn mp-btn--ghost" onClick={() => runSearch(searchQuery)}>Search</button>
          </div>
          <div className="mp-format-picker">
            <span className="mp-label">Match Format:</span>
            <button type="button" className={`mp-btn mp-btn--small ${matchFormat === 1 ? 'mp-btn--active' : 'mp-btn--ghost'}`} onClick={() => setMatchFormat(1)}>Single</button>
            <button type="button" className={`mp-btn mp-btn--small ${matchFormat === 3 ? 'mp-btn--active' : 'mp-btn--ghost'}`} onClick={() => setMatchFormat(3)}>Best of 3</button>
            <button type="button" className={`mp-btn mp-btn--small ${matchFormat === 5 ? 'mp-btn--active' : 'mp-btn--ghost'}`} onClick={() => setMatchFormat(5)}>Best of 5</button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mp-results">
              {searchResults.map((u) => (
                <li key={u.uid} className="mp-result-item">
                  <span className="mp-result-name">{u.username}</span>
                  <button type="button" className="mp-btn mp-btn--ghost" onClick={() => sendInvite(u.uid)}>Invite</button>
                </li>
              ))}
            </ul>
          )}
          <p className="mp-hint">{searchHint}</p>
        </section>

        {outgoingInvites.length > 0 && (
          <section className="mp-panel">
            <h2 className="mp-panel-title">Sent signals</h2>
            <ul className="mp-invite-list">
              {outgoingInvites.map((inv) => (
                <li key={inv.inviteId} className="mp-invite">
                  <span>To <strong>{inv.toUsername}</strong>: {inv.status === 'declined' ? <span className="text-red-500">DECLINED</span> : 'Pending...'}</span>
                  <div className="mp-invite-actions">
                    <button type="button" className="mp-btn mp-btn--ghost" onClick={() => clearInvite(inv.inviteId)}>
                      {inv.status === 'declined' ? 'Clear' : 'Cancel'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {invites.length > 0 && !match && (
          <section className="mp-panel mp-panel--accent">
            <h2 className="mp-panel-title">Incoming signal</h2>
            <ul className="mp-invite-list">
              {invites.map((inv) => (
                <li key={inv.inviteId} className="mp-invite">
                  <span><strong>{inv.fromUsername || 'Operative'}</strong> challenges you.</span>
                  <div className="mp-invite-actions">
                    <button type="button" className="mp-btn" onClick={() => acceptInvite(inv.inviteId)}>Accept</button>
                    <button type="button" className="mp-btn mp-btn--ghost" onClick={() => declineInvite(inv.inviteId)}>Decline</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {roundFeedback && (
          <div className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4">
            <div className="tactical-panel bg-[#0a0a0f]/98 border-[color:var(--current-theme-color)] p-6 shadow-[0_0_50px_rgba(0,229,255,0.3)] animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--current-theme-color)]">Round Transmission Intercepted</span>
                <button onClick={() => setRoundFeedback(null)} className="text-white/20 hover:text-white"><XIcon size={16}/></button>
              </div>
              <div className="space-y-4 text-center">
                <div>
                  <p className="font-mono text-[10px] text-white/40 uppercase mb-1">Round Winner</p>
                  <p className="font-sans text-xl text-[color:var(--current-theme-color)] font-bold">
                    {roundFeedback.winner === 'None (Draw)' ? 'NO WINNER (DRAW)' : roundFeedback.winner}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded border border-white/5">
                  <p className="font-mono text-[10px] text-white/40 uppercase mb-1">Decrypted Solution</p>
                  <p className="font-mono text-lg tracking-wider text-white">{roundFeedback.correct}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {roundSplash.show && (
          <div className="mp-splash">
            <div className="mp-splash-label">Initializing Round</div>
            <div className="mp-splash-title">ROUND {roundSplash.num}</div>
            <div className="mp-splash-line"></div>
          </div>
        )}

        {match && match.status === 'open' && localRound === match.currentRound && !roundSplash.show && (
          <section className="mp-panel mp-panel--duel">
            <div className="mp-duel-header">
              <div className="flex flex-col gap-1">
                <h2 className="mp-panel-title">Active duel</h2>
                <button 
                  onClick={forfeitMatch}
                  className="text-[10px] text-red-400/60 hover:text-red-400 font-mono uppercase tracking-tighter text-left transition-colors"
                >
                  [ Abort Mission ]
                </button>
              </div>
              <div className="mp-scoreboard">
                {match.uids.map((uid: string) => (
                  <div key={uid} className={`mp-score-item ${uid === user?.uid ? 'mp-score-item--me' : ''}`}>
                    <span className="mp-score-name">{match.usernames[uid]}</span>
                    <span className="mp-score-val">{match.scores[uid] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mp-round-info">Round {match.currentRound} (First to {match.targetScore})</div>
            <p className="mp-question">{match.question}</p>
            {match.cipherType && (
              <p className="mp-cipher-hint">Encryption: {match.cipherType} — {match.cipherHint}</p>
            )}
            <div>
              <label className="mp-label">Your answer</label>
              <div className="mp-search-row">
                <input 
                  type="text" 
                  className="mp-input" 
                  placeholder="Decrypted message…" 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={match.myAnswered}
                  onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                />
                <button 
                  type="button" 
                  className="mp-btn" 
                  onClick={submitAnswer}
                  disabled={match.myAnswered}
                >Submit</button>
              </div>
            </div>
            <p className="mp-status">{duelStatus}</p>
          </section>
        )}

        {match && match.status === 'done' && showFinalResults && (
          <section className="mp-panel mp-panel--result">
            <p className={`mp-result-line ${resultClass}`}>{resultTitle}</p>
            <p className="mp-result-sub">{resultSub}</p>
            <p className={`mp-result-xp ${resultXp.includes('+') ? 'mp-result-xp--gain' : ''}`}>{resultXp}</p>
            <button type="button" className="mp-btn" onClick={ackMatch}>Return to lobby</button>
          </section>
        )}

        {errorMsg && <p className="mp-error">{errorMsg}</p>}
      </main>
    </div>
  );
};

export default Multiplayer;
