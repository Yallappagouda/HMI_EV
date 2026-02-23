import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Simple, JS-only cognitive state layer for the EV charging HMI.
// This file intentionally contains no JSX outside the provider return.

const Wt = 0.3;
const We = 0.5;
const Wh = 0.2;

const EXPERT_THRESHOLD_SECONDS = 20;
const SLOW_INTERACTION_THRESHOLD_MS = 6000;

const CognitiveContext = createContext();

export const CognitiveProvider = ({ children }) => {
  const [errorCount, setErrorCount] = useState(0);
  const [helpClickCount, setHelpClickCount] = useState(0);

  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);

  const [interactionSpeed, setInteractionSpeed] = useState('normal'); // "normal" | "slow"
  const [cognitiveLoadScore, setCognitiveLoadScore] = useState(0);
  const [currentMode, setCurrentMode] = useState('STANDARD'); // STANDARD | GUIDED | EXPERT | ELDERLY

  const lastInteractionTimeRef = useRef(null);
  const interactionCountRef = useRef(0);
  const totalGapMsRef = useRef(0);

  const ensureSessionStart = useCallback(() => {
    if (!sessionStartTime) {
      const now = Date.now();
      setSessionStartTime(now);
      lastInteractionTimeRef.current = now;
    }
  }, [sessionStartTime]);

  const registerInteraction = useCallback(() => {
    const now = Date.now();

    if (!sessionStartTime) {
      setSessionStartTime(now);
    }

    if (lastInteractionTimeRef.current != null) {
      const gap = now - lastInteractionTimeRef.current;

      if (gap > 0 && gap < 600000) {
        interactionCountRef.current += 1;
        totalGapMsRef.current += gap;

        const avgGap = totalGapMsRef.current / interactionCountRef.current;

        if (avgGap > SLOW_INTERACTION_THRESHOLD_MS) {
          setInteractionSpeed('slow');
        } else {
          setInteractionSpeed('normal');
        }
      }
    }

    lastInteractionTimeRef.current = now;
  }, [sessionStartTime]);

  const incrementError = useCallback(() => {
    ensureSessionStart();
    setErrorCount((prev) => prev + 1);
  }, [ensureSessionStart]);

  const incrementHelp = useCallback(() => {
    ensureSessionStart();
    setHelpClickCount((prev) => prev + 1);
  }, [ensureSessionStart]);

  const registerTaskCompletion = useCallback(() => {
    ensureSessionStart();

    if (!completionTime && sessionStartTime) {
      setCompletionTime(Date.now());
    }
  }, [completionTime, ensureSessionStart, sessionStartTime]);

  // Cognitive load score
  useEffect(() => {
    if (!sessionStartTime) {
      setCognitiveLoadScore(0);
      return;
    }

    const effectiveCompletionTimeMs =
      completionTime && completionTime >= sessionStartTime
        ? completionTime - sessionStartTime
        : Date.now() - sessionStartTime;

    const completionTimeInSeconds = effectiveCompletionTimeMs / 1000;

    const score =
      Wt * completionTimeInSeconds +
      We * errorCount +
      Wh * helpClickCount;

    setCognitiveLoadScore(score);
  }, [completionTime, errorCount, helpClickCount, sessionStartTime]);

  // Adaptive mode switching
  useEffect(() => {
    if (!sessionStartTime) {
      setCurrentMode('STANDARD');
      return;
    }

    const completionTimeInSeconds =
      completionTime && completionTime >= sessionStartTime
        ? (completionTime - sessionStartTime) / 1000
        : (Date.now() - sessionStartTime) / 1000;

    const isSlowInteraction = interactionSpeed === 'slow';

    const evaluateMode = () => {
      if (errorCount > 3) {
        return 'GUIDED';
      }

      if (completionTimeInSeconds < EXPERT_THRESHOLD_SECONDS && errorCount === 0) {
        return 'EXPERT';
      }

      if (isSlowInteraction) {
        return 'ELDERLY';
      }

      return 'STANDARD';
    };

    const nextMode = evaluateMode();

    setCurrentMode((prev) => (prev === nextMode ? prev : nextMode));
  }, [completionTime, errorCount, interactionSpeed, sessionStartTime]);

  // Align with existing "start" event in the app
  useEffect(() => {
    const onStart = () => {
      const now = Date.now();
      setSessionStartTime(now);
      lastInteractionTimeRef.current = now;
    };

    window.addEventListener('voltcharge-start', onStart);

    return () => {
      window.removeEventListener('voltcharge-start', onStart);
    };
  }, []);

  const logSessionOutcome = useCallback(
    (label = 'session-end') => {
      if (!sessionStartTime) return;

      const endTime = Date.now();

      const completionTimeMs =
        completionTime && completionTime >= sessionStartTime
          ? completionTime - sessionStartTime
          : endTime - sessionStartTime;

      const completionTimeInSeconds = completionTimeMs / 1000;

      const payload = {
        label,
        timestamp: new Date().toISOString(),
        completionTime: completionTimeInSeconds,
        errorCount,
        helpClickCount,
        cognitiveLoadScore,
        finalMode: currentMode,
      };

      try {
        const key = 'voltcharge-cognitive-sessions';
        const existingRaw = localStorage.getItem(key);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const next = Array.isArray(existing) ? [...existing, payload] : [payload];

        localStorage.setItem(key, JSON.stringify(next.slice(-50)));
      } catch {
        // ignore storage failures in production
      }

      // Structured console output for research capture
      // (safe to leave in production; non-blocking)
      // eslint-disable-next-line no-console
      console.log('[VoltCharge][CognitiveSession]', payload);
    },
    [completionTime, cognitiveLoadScore, currentMode, errorCount, helpClickCount, sessionStartTime],
  );

  const value = useMemo(
    () => ({
      errorCount,
      helpClickCount,
      sessionStartTime,
      completionTime,
      interactionSpeed,
      cognitiveLoadScore,
      currentMode,
      incrementError,
      incrementHelp,
      registerInteraction,
      registerTaskCompletion,
      logSessionOutcome,
    }),
    [
      errorCount,
      helpClickCount,
      sessionStartTime,
      completionTime,
      interactionSpeed,
      cognitiveLoadScore,
      currentMode,
      incrementError,
      incrementHelp,
      registerInteraction,
      registerTaskCompletion,
      logSessionOutcome,
    ],
  );

  return (
    <CognitiveContext.Provider value={value}>
      {children}
    </CognitiveContext.Provider>
  );
};

export const useCognitive = () => {
  const context = useContext(CognitiveContext);

  if (!context) {
    return {
      errorCount: 0,
      helpClickCount: 0,
      sessionStartTime: null,
      completionTime: null,
      interactionSpeed: 'normal',
      cognitiveLoadScore: 0,
      currentMode: 'STANDARD',
      incrementError: () => { },
      incrementHelp: () => { },
      registerInteraction: () => { },
      registerTaskCompletion: () => { },
      logSessionOutcome: () => { },
    };
  }

  return context;
};

