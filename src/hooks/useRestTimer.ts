import { useState, useEffect, useRef, useCallback } from "react";
import { formatDuration } from "@/utils/formatters"; // Assuming you have this

const REST_ADJUST_INCREMENT = 15;
export const DEFAULT_REST_DURATION = 60;

interface UseRestTimerProps {
  onRecordRest: (setIndex: number, restTakenSeconds: number) => void;
}

export function useRestTimer({ onRecordRest }: UseRestTimerProps) {
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
  const [restStartTime, setRestStartTime] = useState<number>(0); // When rest actually started

  const restTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restStartTimeRef = useRef<number>(0);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (restTimerIntervalRef.current)
        clearInterval(restTimerIntervalRef.current);
    };
  }, []);

  // Timestamp-based timer logic (works in background)
  useEffect(() => {
    if (isRestTimerRunning && restStartTime > 0) {
      const updateTimer = () => {
        const elapsedSeconds = Math.floor((Date.now() - restStartTime) / 1000);

        if (elapsedSeconds < restTimerDuration) {
          // Still in countdown phase
          setRestTimerSeconds(restTimerDuration - elapsedSeconds);
          setOvertickSeconds(0);
        } else {
          // In overtick phase
          setRestTimerSeconds(0);
          setOvertickSeconds(elapsedSeconds - restTimerDuration);
        }
      };

      updateTimer(); // Update immediately
      restTimerIntervalRef.current = setInterval(updateTimer, 1000);
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
  }, [isRestTimerRunning, restStartTime, restTimerDuration]);

  const clearRestState = useCallback(() => {
    setIsRestTimerRunning(false);
    setCurrentSetIndexForRest(null);
    setRestTimerSeconds(0);
    setOvertickSeconds(0);
    setRestStartTime(0);
    restStartTimeRef.current = 0;
    if (restTimerIntervalRef.current)
      clearInterval(restTimerIntervalRef.current);
  }, []);

  // Prepare and immediately start the rest timer after a set is completed
  const prepareRest = useCallback(
    (setIndex: number, defaultDuration: number) => {
      clearRestState(); // Ensure clean state before preparing
      setCurrentSetIndexForRest(setIndex);
      setNextRestDuration(defaultDuration);

      // Auto-start the rest immediately
      const now = Date.now();
      setRestTimerDuration(defaultDuration);
      setRestTimerSeconds(defaultDuration);
      setOvertickSeconds(0);
      setRestStartTime(now);
      restStartTimeRef.current = now;
      setIsRestTimerRunning(true);
    },
    [clearRestState]
  );

  // Start the actual rest countdown
  const startRest = useCallback(() => {
    if (currentSetIndexForRest !== null) {
      const now = Date.now();
      setRestTimerDuration(nextRestDuration); // Set the target duration
      setRestTimerSeconds(nextRestDuration); // Start countdown from target
      setOvertickSeconds(0);
      setRestStartTime(now);
      restStartTimeRef.current = now;
      setIsRestTimerRunning(true);
    }
  }, [currentSetIndexForRest, nextRestDuration]);

  // Stop the rest timer (e.g., user clicks "Start Next Set")
  const stopRest = useCallback(() => {
    if (
      isRestTimerRunning &&
      currentSetIndexForRest !== null &&
      restStartTimeRef.current > 0
    ) {
      const actualRestTakenSeconds = Math.floor(
        (Date.now() - restStartTimeRef.current) / 1000
      );
      onRecordRest(currentSetIndexForRest, actualRestTakenSeconds);
    }
    clearRestState();
  }, [
    isRestTimerRunning,
    currentSetIndexForRest,
    onRecordRest,
    clearRestState,
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
