import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState<{ text: string, type: string | null }>({ text: '', type: null });
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const usernameCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedUsername = useRef('');

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && !loading && user) {
      isInitialMount.current = false;
      navigate('/dashboard');
    }
    if (!loading) {
      isInitialMount.current = false;
    }
  }, [loading, user, navigate]);

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setErrorMsg('');
  };

  const validateUsername = (val: string) => /^[a-zA-Z0-9_ ]{3,24}$/.test(val);
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val: string) => typeof val === 'string' && val.length >= 6;

  const checkUsernameAvailability = async (val: string) => {
    if (!validateUsername(val)) {
      setIsUsernameAvailable(false);
      if (val.length > 0 && val.length < 3) {
        setUsernameStatus({ text: 'Username must be at least 3 characters.', type: 'error' });
      } else if (val.length >= 3) {
        setUsernameStatus({ text: 'Only letters, numbers, spaces, or _ allowed.', type: 'error' });
      } else {
        setUsernameStatus({ text: '', type: null });
      }
      return;
    }

    const lower = val.toLowerCase();
    if (lower === lastCheckedUsername.current) return;
    lastCheckedUsername.current = lower;

    setUsernameStatus({ text: 'Checking…', type: 'checking' });

    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`, { credentials: 'include' });
      const data = await res.json();

      if (val.toLowerCase() !== lastCheckedUsername.current) return;

      if (data.available) {
        setIsUsernameAvailable(true);
        setUsernameStatus({ text: '✓ Username available', type: 'available' });
      } else {
        setIsUsernameAvailable(false);
        setUsernameStatus({ text: '✗ Username already taken', type: 'taken' });
      }
    } catch {
      setUsernameStatus({ text: 'Could not check. Try again.', type: 'error' });
      setIsUsernameAvailable(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    
    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    setIsUsernameAvailable(false);

    if (!val.trim()) {
      setUsernameStatus({ text: '', type: null });
      lastCheckedUsername.current = '';
      return;
    }

    usernameCheckTimer.current = setTimeout(() => checkUsernameAvailability(val.trim()), 400);
  };

  const callApi = async (path: string, payload: any) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  };

  const mapFirebaseError = (error: any) => {
    const code = error?.code || '';
    const fallback = error?.message || 'Authentication failed.';
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered. Try logging in.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Register first.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return map[code] || fallback;
  };

  const runEmailAuthFlow = async () => {
    setErrorMsg('');
    const mail = email.trim();

    if (!validateEmail(mail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      const uname = username.trim();
      if (!validateUsername(uname)) {
        setErrorMsg('Username must be 3-24 chars and use letters, numbers, spaces, or _.');
        return;
      }
      if (!isUsernameAvailable) {
        setErrorMsg('Please choose a username that is available.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, mail, password);
        const idToken = await userCred.user.getIdToken();
        await callApi('/api/auth/register', { idToken, username: username.trim() });
        sessionStorage.clear();
        await refreshUser();
        navigate('/dashboard?new=1');
      } else {
        const userCred = await signInWithEmailAndPassword(auth, mail, password);
        const idToken = await userCred.user.getIdToken();
        await callApi('/api/auth/login', { idToken });
        sessionStorage.clear();
        await refreshUser();
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(mapFirebaseError(error));
    } finally {
      setBusy(false);
    }
  };

  const runGoogleAuthFlow = async () => {
    setErrorMsg('');

    if (mode === 'register') {
      const uname = username.trim();
      if (!validateUsername(uname)) {
        setErrorMsg('Please set a username first (3-24 chars, letters, numbers, spaces, or _).');
        return;
      }
      if (!isUsernameAvailable) {
        setErrorMsg('Please choose a username that is available.');
        return;
      }
    }

    setBusy(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();

      if (mode === 'register') {
        await callApi('/api/auth/register', { idToken, username: username.trim() });
        sessionStorage.clear();
        await refreshUser();
        navigate('/dashboard?new=1');
      } else {
        await callApi('/api/auth/login', { idToken });
        sessionStorage.clear();
        await refreshUser();
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(mapFirebaseError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runEmailAuthFlow();
    }
  };

  if (loading) {
    return (
      <div className="page auth-page">
        <div className="city-bg"></div>
        <div className="auth-loading">
          <div className="auth-loading-spinner"></div>
          <p className="auth-loading-text">Establishing secure link&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <div className="city-bg"></div>
      
      <main className="auth-card is-visible">
        <h1 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to continue your mission.' : 'Set your username and create a password to get started.'}
        </p>

        {mode === 'register' && (
          <>
            <label className="auth-label">Username</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Enter username"
              maxLength={24}
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleEnter}
            />
            {usernameStatus.text && (
              <div className={`username-status username-status--${usernameStatus.type}`}>
                {usernameStatus.text}
              </div>
            )}
          </>
        )}

        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleEnter}
        />

        <label className="auth-label">Password</label>
        <div className="auth-password-wrap">
          <input
            className="auth-input auth-input-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 6 characters"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleEnter}
          />
          <button 
            className={`auth-eye-btn ${showPassword ? 'is-visible' : ''}`} 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
          >
            <svg className="auth-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        {mode === 'register' && (
          <>
            <label className="auth-label">Confirm Password</label>
            <div className="auth-password-wrap">
              <input
                className="auth-input auth-input-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleEnter}
              />
            </div>
          </>
        )}

        <button 
          className="chat-next-btn auth-main-btn" 
          type="button"
          onClick={runEmailAuthFlow}
          disabled={busy}
        >
          {busy ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>

        <div className="auth-divider">
          <span className="auth-divider-line"></span>
          <span className="auth-divider-text">or</span>
          <span className="auth-divider-line"></span>
        </div>

        <button 
          className="auth-google-btn" 
          type="button"
          onClick={runGoogleAuthFlow}
          disabled={busy}
        >
          <svg className="auth-google-icon" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-error" role="alert">{errorMsg}</p>

        <p className="auth-toggle">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <a className="auth-toggle-link" href="#" onClick={toggleMode}>
            {mode === 'login' ? 'Register' : 'Log in'}
          </a>
        </p>
      </main>
    </div>
  );
};

export default Auth;
