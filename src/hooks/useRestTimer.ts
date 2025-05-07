import { useState, useEffect, useRef, useCallback } from "react";
import { formatDuration } from "@/utils/formatters"; // Assuming you have this

const REST_ADJUST_INCREMENT = 15;
export const DEFAULT_REST_DURATION = 60;

interface UseRestTimerProps {
  pauseMainTimer: () => void;
  resumeMainTimer: () => void;
  onRecordRest: (setIndex: number, restTakenSeconds: number) => void;
}

export function useRestTimer({
  pauseMainTimer,
  resumeMainTimer,
  onRecordRest,
}: UseRestTimerProps) {
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0); // Countdown value
  const [restTimerDuration, setRestTimerDuration] = useState(0); // Target duration for current rest
  const [nextRestDuration, setNextRestDuration] = useState(
    DEFAULT_REST_DURATION
  ); // Configurable duration for the *next* rest
  const [currentSetIndexForRest, setCurrentSetIndexForRest] = useState<
    number | null
  >(null); // Which set index triggered the current rest UI
  const [overtickSeconds, setOvertickSeconds] = useState(0);

  const restTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actualRestTrackerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actualRestTakenRef = useRef(0);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (restTimerIntervalRef.current)
        clearInterval(restTimerIntervalRef.current);
      if (actualRestTrackerIntervalRef.current)
        clearInterval(actualRestTrackerIntervalRef.current);
    };
  }, []);

  // Countdown/Overtick Timer Logic
  useEffect(() => {
    if (isRestTimerRunning) {
      restTimerIntervalRef.current = setInterval(() => {
        setRestTimerSeconds(prev => {
          if (prev > 0) {
            return prev - 1; // Countdown
          } else {
            // Start over ticking
            setOvertickSeconds(o => o + 1);
            return 0; // Keep timer seconds at 0 while over ticking
          }
        });
      }, 1000);
    } else {
      if (restTimerIntervalRef.current) {
        clearInterval(restTimerIntervalRef.current);
        restTimerIntervalRef.current = null;
      }
    }
    return () => {
      if (restTimerIntervalRef.current)
        clearInterval(restTimerIntervalRef.current);
    };
  }, [isRestTimerRunning]);

  // Actual Rest Time Tracker Logic
  useEffect(() => {
    if (isRestTimerRunning) {
      actualRestTakenRef.current = 0; // Reset tracker
      actualRestTrackerIntervalRef.current = setInterval(() => {
        actualRestTakenRef.current += 1;
      }, 1000);
    } else {
      if (actualRestTrackerIntervalRef.current) {
        clearInterval(actualRestTrackerIntervalRef.current);
        actualRestTrackerIntervalRef.current = null;
      }
    }
    return () => {
      if (actualRestTrackerIntervalRef.current)
        clearInterval(actualRestTrackerIntervalRef.current);
    };
  }, [isRestTimerRunning]);

  const clearRestState = useCallback(() => {
    setIsRestTimerRunning(false);
    setCurrentSetIndexForRest(null);
    setRestTimerSeconds(0);
    setOvertickSeconds(0);
    if (restTimerIntervalRef.current)
      clearInterval(restTimerIntervalRef.current);
    if (actualRestTrackerIntervalRef.current)
      clearInterval(actualRestTrackerIntervalRef.current);
    actualRestTakenRef.current = 0;
  }, []);

  // Prepare the rest timer UI after a set is completed
  const prepareRest = useCallback(
    (setIndex: number, defaultDuration: number) => {
      clearRestState(); // Ensure clean state before preparing
      pauseMainTimer(); // Pause main timer when rest prompt appears
      setCurrentSetIndexForRest(setIndex);
      setNextRestDuration(defaultDuration);
      // Don't start the timer yet, just show the prompt
    },
    [clearRestState, pauseMainTimer]
  );

  // Start the actual rest countdown
  const startRest = useCallback(() => {
    if (currentSetIndexForRest !== null) {
      setRestTimerDuration(nextRestDuration); // Set the target duration
      setRestTimerSeconds(nextRestDuration); // Start countdown from target
      setOvertickSeconds(0);
      setIsRestTimerRunning(true);
      // Main timer should already be paused by prepareRest
    }
  }, [currentSetIndexForRest, nextRestDuration]);

  // Stop the rest timer (e.g., user clicks "Start Next Set")
  const stopRest = useCallback(() => {
    if (isRestTimerRunning && currentSetIndexForRest !== null) {
      onRecordRest(currentSetIndexForRest, actualRestTakenRef.current);
    }
    clearRestState();
    resumeMainTimer(); // Resume main timer when rest ends
  }, [
    isRestTimerRunning,
    currentSetIndexForRest,
    onRecordRest,
    clearRestState,
    resumeMainTimer,
  ]);

  const adjustRestDuration = useCallback((increment: number) => {
    setNextRestDuration(prev => Math.max(0, prev + increment));
  }, []);

  const isRestPromptVisible =
    currentSetIndexForRest !== null && !isRestTimerRunning;

  return {
    isResting: isRestTimerRunning, // Is the countdown/overtick active?
    isRestPromptVisible, // Is the "Start Rest" prompt visible?
    displaySeconds: restTimerSeconds, // Value for countdown display
    overtickSeconds,
    nextRestDuration, // Duration for the upcoming rest
    restTimerDuration, // Target duration for the *current* active rest
    restingSetIndex: currentSetIndexForRest, // Which set index is resting/pending rest
    prepareRest,
    startRest,
    stopRest, // Renamed from handleStartNextSet
    adjustRestDuration,
    clearRestState,
    setNextRestDuration, // Allow external setting (e.g., on exercise change)
    formattedNextRestDuration: formatDuration(nextRestDuration),
    formattedDisplayTime: formatDuration(
      overtickSeconds > 0 ? restTimerDuration : restTimerSeconds
    ),
  };
}
