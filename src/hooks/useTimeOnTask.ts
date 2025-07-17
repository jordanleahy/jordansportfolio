import { useState, useEffect, useRef } from 'react';

interface TimeData {
  totalTime: number;
  sessionCount: number;
  currentSessionStart: number;
  lastVisit: number;
}

interface SessionData {
  startTime: number;
  currentTime: number;
  isActive: boolean;
}

export const useTimeOnTask = () => {
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isStopped, setIsStopped] = useState(false);
  const [userGuess, setUserGuess] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const lastActiveRef = useRef<number>(Date.now());

  // Load stored data on mount
  useEffect(() => {
    const storedData = localStorage.getItem('timeOnTask');
    const sessionData = sessionStorage.getItem('currentSession');
    
    if (storedData) {
      const data: TimeData = JSON.parse(storedData);
      setTotalTime(data.totalTime || 0);
      setSessionCount(data.sessionCount || 0);
    }

    if (sessionData) {
      const session: SessionData = JSON.parse(sessionData);
      sessionStartRef.current = session.startTime;
      setCurrentSessionTime(Math.floor((Date.now() - session.startTime) / 1000));
    }

    // Start the timer
    startTimer();

    return () => {
      stopTimer();
      saveSession();
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
        pauseTimer();
      } else {
        setIsActive(true);
        resumeTimer();
      }
    };

    const handleBeforeUnload = () => {
      saveSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const startTimer = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartRef.current) / 1000);
      setCurrentSessionTime(elapsed);
      
      // Update session storage every 5 seconds
      if (elapsed % 5 === 0) {
        updateSessionStorage();
      }
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastActiveRef.current = Date.now();
  };

  const resumeTimer = () => {
    if (!intervalRef.current) {
      // Adjust session start time to account for pause
      const pauseDuration = Date.now() - lastActiveRef.current;
      sessionStartRef.current += pauseDuration;
      startTimer();
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateSessionStorage = () => {
    const sessionData: SessionData = {
      startTime: sessionStartRef.current,
      currentTime: Date.now(),
      isActive
    };
    sessionStorage.setItem('currentSession', JSON.stringify(sessionData));
  };

  const saveSession = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    
    // Don't save sessions shorter than 5 seconds
    if (sessionDuration < 5) return;

    const storedData = localStorage.getItem('timeOnTask');
    const currentData: TimeData = storedData ? JSON.parse(storedData) : {
      totalTime: 0,
      sessionCount: 0,
      currentSessionStart: 0,
      lastVisit: 0
    };

    const updatedData: TimeData = {
      totalTime: currentData.totalTime + sessionDuration,
      sessionCount: currentData.sessionCount + 1,
      currentSessionStart: sessionStartRef.current,
      lastVisit: Date.now()
    };

    localStorage.setItem('timeOnTask', JSON.stringify(updatedData));
    sessionStorage.removeItem('currentSession');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAverageSessionTime = (): number => {
    if (sessionCount === 0) return 0;
    return Math.floor(totalTime / sessionCount);
  };

  const stopSession = () => {
    setIsStopped(true);
    setIsActive(false);
    pauseTimer();
  };

  const submitGuess = (guess: number) => {
    setUserGuess(guess);
    saveSession();
    // Reset for next session
    setIsStopped(false);
    setIsActive(true);
    setUserGuess(null);
    sessionStartRef.current = Date.now();
    setCurrentSessionTime(0);
    startTimer();
  };

  const resetData = () => {
    localStorage.removeItem('timeOnTask');
    sessionStorage.removeItem('currentSession');
    setCurrentSessionTime(0);
    setTotalTime(0);
    setSessionCount(0);
    setIsStopped(false);
    setUserGuess(null);
    sessionStartRef.current = Date.now();
  };

  return {
    currentSessionTime,
    totalTime,
    sessionCount,
    isActive,
    isStopped,
    userGuess,
    formatTime,
    getAverageSessionTime,
    resetData,
    stopSession,
    submitGuess
  };
};