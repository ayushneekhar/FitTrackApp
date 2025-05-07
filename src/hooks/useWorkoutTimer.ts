import { useState, useEffect, useRef, useCallback } from "react";

interface UseWorkoutTimerProps {
  initialAccumulatedSeconds?: number;
  autoStart?: boolean;
}

export function useWorkoutTimer({
  initialAccumulatedSeconds = 0,
  autoStart = false,
}: UseWorkoutTimerProps = {}) {
  const [startTime, setStartTime] = useState<number>(0); // Internal start time of the *entire* workout
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(
    initialAccumulatedSeconds
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(
    initialAccumulatedSeconds
  );
  const [lastResumeTime, setLastResumeTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Refs to hold the latest values for callbacks/effects without causing re-renders
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const elapsedSecondsRef = useRef(elapsedSeconds);
  const isTimerRunningRef = useRef(isTimerRunning);

  useEffect(() => {
    accumulatedSecondsRef.current = accumulatedSeconds;
    elapsedSecondsRef.current = elapsedSeconds;
    isTimerRunningRef.current = isTimerRunning;
  }, [accumulatedSeconds, elapsedSeconds, isTimerRunning]);

  // Initialize timer on mount
  useEffect(() => {
    const now = Date.now();
    setStartTime(now); // Set the absolute start time
    if (autoStart) {
      setLastResumeTime(now);
      setIsTimerRunning(true);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Main timer interval logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && lastResumeTime > 0) {
      const updateTimer = () => {
        const secondsSinceLastResume = Math.round(
          (Date.now() - lastResumeTime) / 1000
        );
        const currentTotalElapsed =
          accumulatedSecondsRef.current + secondsSinceLastResume;
        setElapsedSeconds(currentTotalElapsed);
      };
      updateTimer(); // Update immediately
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, lastResumeTime]); // Re-run only when these change

  const pauseTimer = useCallback(() => {
    if (isTimerRunningRef.current) {
      // Use ref here to avoid stale closure issues if called rapidly
      setAccumulatedSeconds(elapsedSecondsRef.current); // Save current progress
      setLastResumeTime(0); // Stop tracking new time
      setIsTimerRunning(false);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isTimerRunningRef.current) {
      setLastResumeTime(Date.now()); // Start tracking new time from now
      setIsTimerRunning(true);
    }
  }, []);

  const toggleTimer = useCallback(() => {
    if (isTimerRunningRef.current) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [pauseTimer, resumeTimer]);

  const resetTimer = useCallback(() => {
    setAccumulatedSeconds(0);
    setElapsedSeconds(0);
    // Keep original startTime, just reset elapsed time
    setLastResumeTime(isTimerRunningRef.current ? Date.now() : 0);
  }, []);

  return {
    startTime, // Expose original start time if needed for saving
    elapsedSeconds,
    isTimerRunning,
    pauseTimer,
    resumeTimer,
    toggleTimer,
    resetTimer,
    // Expose latest ref value for saving session state accurately
    getCurrentElapsedSeconds: () => elapsedSecondsRef.current,
  };
}
