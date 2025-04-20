// src/screens/ActiveWorkoutScreen.tsx
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { usePreventRemove } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import {
  WorkoutTemplate,
  CompletedWorkout,
  saveCompletedWorkout,
  ActiveWorkoutSession,
  saveActiveWorkoutSession,
  clearActiveWorkoutSession,
  WorkoutSet as StoredWorkoutSet,
  WeightUnit,
  CompletedWorkoutExercise,
} from "@/services/storage";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import uuid from "react-native-uuid";
import { formatDuration } from "@/utils/formatters";
import Card from "@/components/Card";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  Layout,
  SequencedTransition,
} from "react-native-reanimated";
import AnimatedTimer from "@/components/AnimatedTimer";
import WeightUnitInput from "@/components/WeightUnitInput";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveWorkout">;

// Extend StoredWorkoutSet for active state
interface ActiveWorkoutSet extends StoredWorkoutSet {
  completed: boolean;
  restTakenSeconds?: number; // Store actual rest taken after this set
}

interface ActiveWorkoutExercise {
  id: string; // Exercise definition ID
  instanceId: string; // Unique ID for this instance in the workout
  name: string;
  sets: ActiveWorkoutSet[];
}

type ExerciseStatus = "not-started" | "in-progress" | "completed";

// --- Constants ---
const DEFAULT_REST_DURATION = 60;
const REST_ADJUST_INCREMENT = 15;

const ActiveWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, preferences } = useTheme();
  const { template: initialTemplate, resumeData } = route.params;
  const defaultUnit = preferences.defaultWeightUnit;

  // --- State ---
  // Workout Timer State
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Workout Structure State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<
    ActiveWorkoutExercise[]
  >([]);

  // Rest Timer State
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0); // Countdown value
  const [restTimerDuration, setRestTimerDuration] = useState(0); // Target duration for current rest
  const [nextRestDuration, setNextRestDuration] = useState(
    DEFAULT_REST_DURATION
  ); // Configurable duration for the *next* rest
  const [currentSetIndexForRest, setCurrentSetIndexForRest] = useState<
    number | null
  >(null); // Which set index triggered the current rest UI
  const [overtickSeconds, setOvertickSeconds] = useState(0); // <-- ADDED: Tracks seconds past target

  // --- Refs ---
  const startTimeRef = useRef(startTime);
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const isFinishedRef = useRef(false);
  const elapsedSecondsRef = useRef(0);
  const workoutExercisesRef = useRef(workoutExercises);
  const restTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actualRestTrackerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actualRestTakenRef = useRef(0); // Tracks actual seconds passed during rest

  // Update refs
  useEffect(() => {
    startTimeRef.current = startTime;
    accumulatedSecondsRef.current = accumulatedSeconds;
    workoutExercisesRef.current = workoutExercises;
    elapsedSecondsRef.current = elapsedSeconds; // Keep elapsedSecondsRef updated
  }, [startTime, accumulatedSeconds, workoutExercises, elapsedSeconds]);

  // --- Initialization ---
  useEffect(() => {
    let initialExercises: ActiveWorkoutExercise[] = [];
    let startAccumulated = 0;
    let startTimestamp = 0;
    let startResumeTime = 0;
    let initialNextRest = DEFAULT_REST_DURATION;

    const createSetsWithDefaults = (
      sets: Array<{ id: string; reps: number; weight: number }>
    ): ActiveWorkoutSet[] => {
      return sets.map(set => ({
        ...set,
        unit: defaultUnit,
        completed: false,
        restTakenSeconds: undefined, // Initialize rest time
      }));
    };

    const mapTemplateExercises = (
      templateExercises: WorkoutTemplateExercise[]
    ): ActiveWorkoutExercise[] => {
      return templateExercises.map((ex, index) => {
        // Set initial nextRestDuration based on the *first* exercise's default
        if (index === 0) {
          initialNextRest = ex.defaultRestSeconds ?? DEFAULT_REST_DURATION;
        }
        return {
          id: ex.id,
          instanceId: ex.instanceId || (uuid.v4() as string),
          name: ex.name,
          sets: createSetsWithDefaults(ex.sets),
          defaultRestSeconds: ex.defaultRestSeconds, // <-- Store default rest
        };
      });
    };

    if (resumeData) {
      console.log("Resuming workout session:", resumeData);
      startAccumulated = resumeData.accumulatedSeconds;
      startTimestamp = resumeData.startTime;
      startResumeTime = Date.now();
      initialExercises = mapTemplateExercises(
        resumeData.template?.exercises || []
      );
      isFinishedRef.current = false;
      clearActiveWorkoutSession();
    } else if (initialTemplate) {
      console.log("Starting new workout from template.");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = mapTemplateExercises(initialTemplate.exercises);
      isFinishedRef.current = false;
    } else {
      console.log("Starting empty workout.");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = [];
      isFinishedRef.current = false;
    }

    setStartTime(startTimestamp);
    setAccumulatedSeconds(startAccumulated);
    setLastResumeTime(startResumeTime);
    setWorkoutExercises(initialExercises);
    setCurrentExerciseIndex(0);
    setIsTimerRunning(true); // Start main timer immediately
    setIsRestTimerRunning(false); // Ensure rest timer is initially off
    setCurrentSetIndexForRest(null);
    setNextRestDuration(initialNextRest);
    setOvertickSeconds(0);
  }, [resumeData, initialTemplate, defaultUnit]);

  const currentExercise = workoutExercises[currentExerciseIndex];
  const workoutName = initialTemplate?.name || "New Workout";

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

  // --- Timer Logic & Controls ---
  // Main Workout Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && lastResumeTime > 0) {
      const updateTimer = () => {
        const secondsSinceLastResume = Math.round(
          (Date.now() - lastResumeTime) / 1000
        );
        const currentTotalElapsed = accumulatedSeconds + secondsSinceLastResume;
        setElapsedSeconds(currentTotalElapsed);
        // elapsedSecondsRef is updated in its own useEffect
      };
      updateTimer(); // Update immediately
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, lastResumeTime, accumulatedSeconds]);
  // Only depends on isRestTimerRunning

  // Actual Rest Time Tracker
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

  // --- Timer Control Handlers ---
  const pauseMainTimer = () => {
    if (isTimerRunning) {
      setAccumulatedSeconds(elapsedSecondsRef.current); // Save current progress
      setLastResumeTime(0); // Stop tracking new time
      setIsTimerRunning(false);
    }
  };

  const resumeMainTimer = () => {
    if (!isTimerRunning) {
      setLastResumeTime(Date.now()); // Start tracking new time from now
      setIsTimerRunning(true);
    }
  };

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      pauseMainTimer();
    } else {
      resumeMainTimer();
    }
  };

  const handleResetTimer = () => {
    // ... (reset logic remains the same)
    Alert.alert("Reset Timer?", "Are you sure you want to reset the timer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setAccumulatedSeconds(0);
          setElapsedSeconds(0);
          // elapsedSecondsRef.current = 0; // Ref updated via useEffect
          setLastResumeTime(isTimerRunning ? Date.now() : 0);
        },
      },
    ]);
  };

  // --- Rest Timer Control Handlers ---
  const clearRestTimerState = () => {
    setIsRestTimerRunning(false);
    setCurrentSetIndexForRest(null);
    setRestTimerSeconds(0);
    setOvertickSeconds(0); // <-- Reset overtick
  };

  const recordRestTime = (setIndex: number) => {
    const restTaken = actualRestTakenRef.current;
    console.log(
      `Recording ${restTaken}s rest after exercise ${currentExerciseIndex}, set ${setIndex}`
    );
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, restTakenSeconds: restTaken };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleStartRest = (setIndex: number) => {
    if (currentSetIndexForRest === setIndex) {
      setRestTimerDuration(nextRestDuration);
      setRestTimerSeconds(nextRestDuration);
      setOvertickSeconds(0); // <-- Reset overtick on start
      setIsRestTimerRunning(true);
    }
  };

  const handleStartNextSet = () => {
    if (isRestTimerRunning && currentSetIndexForRest !== null) {
      recordRestTime(currentSetIndexForRest);
    }
    clearRestTimerState();
    resumeMainTimer();
  };

  const handleAdjustRestDuration = (increment: number) => {
    setNextRestDuration(prev => Math.max(0, prev + increment));
  };

  // --- Save Session Function (remains the same) ---
  const saveCurrentSession = useCallback(() => {
    // ... (implementation remains the same)
    if (!isFinishedRef.current && startTimeRef.current > 0) {
      const sessionToSave: ActiveWorkoutSession = {
        startTime: startTimeRef.current,
        accumulatedSeconds: elapsedSecondsRef.current, // Use ref for latest value
        template: initialTemplate || null,
      };
      console.log("Saving session state...", sessionToSave);
      saveActiveWorkoutSession(sessionToSave);
    } else {
      console.log("Not saving session (finished or invalid).");
    }
  }, [initialTemplate]);

  // --- Prevent Back Navigation Hook (remains the same) ---
  usePreventRemove(startTime > 0 && !isFinishedRef.current, ({ data }) => {
    // ... (implementation remains the same)
    Alert.alert(
      "Pause Workout?",
      "Do you want to pause this workout and leave? Your progress will be saved.",
      [
        { text: "Stay", style: "cancel", onPress: () => {} },
        {
          text: "Pause & Leave",
          style: "destructive",
          onPress: () => {
            pauseMainTimer(); // Use pause function
            saveCurrentSession();
            navigation.dispatch(data.action);
          },
        },
      ]
    );
  });

  // --- Set Data Handling (Reps, Weight, Unit - remain the same) ---
  const handleRepsChange = (setIndex: number, value: string) => {
    // ... (implementation remains the same)
    const reps = parseInt(value, 10);
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, reps: isNaN(reps) ? 0 : reps };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleWeightChange = (setIndex: number, value: string) => {
    // ... (implementation remains the same)
    const weight = parseFloat(value);
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, weight: isNaN(weight) ? 0 : weight };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleUnitChange = (setIndex: number, newUnit: WeightUnit) => {
    // ... (implementation remains the same)
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, unit: newUnit };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  // --- Toggle Set Complete & Auto-Advance ---
  const handleToggleSetComplete = (setIndex: number) => {
    // ... (logic to update set completion and check exercise completion remains the same) ...
    let exerciseJustCompleted = false;
    let isCompletingSet = false;

    setWorkoutExercises(prevExercises => {
      const updatedExercises = prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              isCompletingSet = !set.completed;
              return { ...set, completed: !set.completed };
            }
            return set;
          });

          const allSetsCompleted = updatedSets.every(set => set.completed);
          if (allSetsCompleted) {
            exerciseJustCompleted = true;
          }

          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return updatedExercises;
    });

    // Handle Timers
    if (isCompletingSet) {
      pauseMainTimer();
      clearRestTimerState();
      setCurrentSetIndexForRest(setIndex);
      // Use current exercise's default rest if available
      const currentExDefaultRest =
        workoutExercisesRef.current[currentExerciseIndex]?.defaultRestSeconds;
      setNextRestDuration(currentExDefaultRest ?? DEFAULT_REST_DURATION);
    } else {
      clearRestTimerState();
      resumeMainTimer();
    }

    // Auto-Advance (remains the same)
    Promise.resolve().then(() => {
      // ...
      if (
        exerciseJustCompleted &&
        currentExerciseIndex < workoutExercisesRef.current.length - 1
      ) {
        console.log(
          `Exercise ${currentExerciseIndex + 1} completed, advancing.`
        );
        handleNextExercise();
      }
    });
  };

  const updateNextRestForExercise = (index: number) => {
    const exercise = workoutExercisesRef.current[index];
    const defaultRest = exercise?.defaultRestSeconds ?? DEFAULT_REST_DURATION;
    setNextRestDuration(defaultRest);
  };

  // --- Exercise Navigation ---
  const handleNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      clearRestTimerState();
      resumeMainTimer();
      setCurrentExerciseIndex(nextIndex);
      updateNextRestForExercise(nextIndex); // <-- Update rest duration
    } else {
      Alert.alert("Last Exercise", "You've reached the last exercise.");
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      clearRestTimerState();
      resumeMainTimer();
      setCurrentExerciseIndex(prevIndex);
      updateNextRestForExercise(prevIndex); // <-- Update rest duration
    }
  };

  const handleSelectExercise = (index: number) => {
    if (index !== currentExerciseIndex) {
      clearRestTimerState();
      resumeMainTimer();
      setCurrentExerciseIndex(index);
      updateNextRestForExercise(index); // <-- Update rest duration
    }
  };

  // --- Finish Workout Logic ---
  const handleFinishWorkout = useCallback(() => {
    if (!startTime) return;
    isFinishedRef.current = true;
    pauseMainTimer(); // Ensure main timer is paused
    clearRestTimerState(); // Ensure rest timer is stopped

    const endTime = Date.now();
    const finalDurationSeconds = elapsedSecondsRef.current; // Use ref for final value

    // Map state to CompletedWorkout structure, including restTakenSeconds
    const finalExercises: CompletedWorkoutExercise[] =
      workoutExercisesRef.current.map(ex => ({
        instanceId: ex.instanceId,
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
          completed: set.completed,
          unit: set.unit,
          restTakenSeconds: set.restTakenSeconds, // Include saved rest time
        })),
      }));

    const completedWorkoutData: CompletedWorkout = {
      id: uuid.v4() as string,
      templateId: initialTemplate?.id,
      name: workoutName,
      startTime: startTime,
      endTime: endTime,
      durationSeconds: finalDurationSeconds,
      exercises: finalExercises,
      // notes: can be added later if needed
    };

    try {
      saveCompletedWorkout(completedWorkoutData);
      clearActiveWorkoutSession();
      console.log("Workout Saved:", completedWorkoutData);
      Alert.alert(
        "Workout Complete!",
        `Duration: ${formatDuration(finalDurationSeconds)}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }] // Go back to main stack
      );
    } catch (error) {
      console.error("Failed to save workout:", error);
      Alert.alert("Error", "Could not save workout session.");
      isFinishedRef.current = false; // Allow trying again if save failed
      resumeMainTimer(); // Resume timer if save failed? Or leave paused? Let's leave paused.
    }
  }, [startTime, initialTemplate, workoutName, navigation]); // Dependencies

  // --- Header (remains the same) ---
  useLayoutEffect(() => {
    // ... (implementation remains the same)
    navigation.setOptions({
      title: workoutName,
      headerTitleAlign: "left",
      headerLeft: () => (
        <TouchableOpacity
          onPressIn={() => navigation.goBack()} // Default goBack handles the usePreventRemove hook
          style={{ padding: 5, marginLeft: 10 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPressIn={handleFinishWorkout}
          style={styles.finishButton}
        >
          <Icon
            name="content-save-check-outline"
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      ),
      gestureEnabled: false, // Keep gesture disabled
    });
  }, [navigation, handleFinishWorkout, workoutName, colors]);

  // --- Helper to Get Exercise Status (remains the same) ---
  const getExerciseStatus = (
    exercise: ActiveWorkoutExercise
  ): ExerciseStatus => {
    // ... (implementation remains the same)
    if (!exercise || !exercise.sets || exercise.sets.length === 0) {
      return "not-started";
    }
    const totalSets = exercise.sets.length;
    const completedSets = exercise.sets.filter(set => set.completed).length;

    if (completedSets === 0) {
      return "not-started";
    } else if (completedSets === totalSets) {
      return "completed";
    } else {
      return "in-progress";
    }
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    // ... (keep existing styles) ...
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40, // Space at bottom
    },
    // Timer Section
    timerSection: {
      padding: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timerDisplayContainer: {
      flexDirection: "row", // Keep timer digits together
      minHeight: 55, // Prevent layout shift when timer appears/disappears
    },
    timerControls: {
      flexDirection: "row",
      marginTop: 10, // Add margin top
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    timerButtonPrimary: {
      backgroundColor: colors.primary,
    },
    timerButtonSecondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timerButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
    timerButtonTextPrimary: {
      color: colors.buttonText,
    },
    timerButtonTextSecondary: {
      color: colors.text,
    },
    // Navigation Section
    navSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    navButtonDisabled: {
      backgroundColor: colors.background, // Different bg when disabled
      opacity: 0.5,
    },
    // Current Exercise Section
    currentExerciseSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    currentExerciseTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    setTableHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingHorizontal: 5,
    },
    setHeaderText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textAlign: "center",
    },
    // Column widths
    setCol: { width: 40 },
    repsCol: { flex: 1, marginHorizontal: 5 },
    weightCol: { flex: 1.5, marginHorizontal: 5 }, // Make weight col wider
    doneCol: { width: 50 },
    // Set Row
    setRowContainer: {
      // Wrap set row and rest timer UI
      marginBottom: 10,
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
    },
    setNumberText: {
      width: 40,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    repsInputContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5,
      minHeight: 40,
      justifyContent: "center",
      position: "relative",
    },
    setInput: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8,
    },
    setDoneButton: {
      width: 50,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 5,
    },
    setDoneButtonCompleted: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    setRowCompleted: {
      opacity: 0.6, // Dim completed row slightly
    },
    decreaseReps: {
      position: "absolute",
      right: 5,
      top: -5,
      zIndex: 2,
      padding: 5,
    },
    increaseReps: {
      position: "absolute",
      right: 5,
      bottom: -5,
      zIndex: 2,
      padding: 5,
    },
    // --- Rest Timer UI Styles ---
    restTimerContainer: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 5, // Match set row padding
      backgroundColor: colors.progressBarBackground, // Distinct background
      borderRadius: 6,
      alignItems: "center",
    },
    restTimerActiveContainer: {
      paddingBottom: 15,
    },
    restTimerText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 10,
      fontVariant: ["tabular-nums"],
    },
    restTimerTextContainer: {
      // Container for main timer and overtick
      flexDirection: "row",
      alignItems: "baseline", // Align baseline of numbers
      marginBottom: 10,
    },
    restControlsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    restAdjustButton: {
      padding: 8,
      marginHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    restActionButton: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 6,
      marginHorizontal: 5,
      flexDirection: "row",
      alignItems: "center",
    },
    startRestButton: {
      backgroundColor: colors.primary,
    },
    startNextSetButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    restActionButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
    startRestButtonText: {
      color: colors.buttonText,
    },
    startNextSetButtonText: {
      color: colors.text,
    },
    nextRestDurationText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
      minWidth: 60, // Ensure space for text
      textAlign: "center",
    },
    restTimerTextOvertick: {
      color: colors.destructive, // Red when over ticking
    },
    restTimerOvertickValue: {
      fontSize: 14, // Smaller font for overtick value
      fontWeight: "bold",
      color: colors.destructive,
      marginLeft: 5, // Space from main timer
      fontVariant: ["tabular-nums"],
    },
    // --- End Rest Timer UI Styles ---
    // All Exercises Section
    allExercisesSection: {
      paddingTop: 16,
      rowGap: 8,
      paddingBottom: 20,
    },
    allExercisesTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    exerciseListItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    exerciseListItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.progressBarBackground,
    },
    exerciseListItemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    statusIcon: {
      marginRight: 12,
      width: 20,
      textAlign: "center",
    },
    exerciseListItemTextContainer: {
      flex: 1,
    },
    exerciseListName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    exerciseListSets: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    exerciseListItemInProgress: {},
    exerciseListItemCompleted: {
      opacity: 0.6,
    },
    // Finish Button (Header)
    finishButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    finishButtonText: {
      color: colors.buttonText,
      fontWeight: "bold",
      fontSize: 14,
    },
    placeholderText: {
      color: colors.textSecondary,
      textAlign: "center",
      padding: 20,
    },
  });

  // --- Render ---
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Workout Timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>Workout Time</Text>
        <View style={styles.timerDisplayContainer}>
          <AnimatedTimer elapsedSeconds={elapsedSeconds} />
        </View>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={[
              styles.timerButton,
              isTimerRunning
                ? styles.timerButtonSecondary
                : styles.timerButtonPrimary,
            ]}
            onPress={handleToggleTimer}
            disabled={isRestTimerRunning} // Disable main timer controls during rest
          >
            <Icon
              name={isTimerRunning ? "pause" : "play"}
              size={18}
              color={
                isRestTimerRunning
                  ? colors.border
                  : isTimerRunning
                    ? colors.text
                    : colors.buttonText
              }
            />
            <Text
              style={[
                styles.timerButtonText,
                isRestTimerRunning
                  ? { color: colors.border }
                  : isTimerRunning
                    ? styles.timerButtonTextSecondary
                    : styles.timerButtonTextPrimary,
              ]}
            >
              {isTimerRunning ? "Pause" : "Start"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerButton, styles.timerButtonSecondary]}
            onPress={handleResetTimer}
            disabled={isRestTimerRunning} // Disable main timer controls during rest
          >
            <Icon
              name="backup-restore"
              size={18}
              color={isRestTimerRunning ? colors.border : colors.text}
            />
            <Text
              style={[
                styles.timerButtonText,
                styles.timerButtonTextSecondary,
                isRestTimerRunning ? { color: colors.border } : {},
              ]}
            >
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prev/Next Navigation */}
      <View style={styles.navSection}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentExerciseIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePreviousExercise}
          disabled={currentExerciseIndex === 0 || isRestTimerRunning}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            (currentExerciseIndex >= workoutExercises.length - 1 ||
              isRestTimerRunning) &&
              styles.navButtonDisabled,
          ]}
          onPress={handleNextExercise}
          disabled={
            currentExerciseIndex >= workoutExercises.length - 1 ||
            isRestTimerRunning
          }
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Current Exercise Details */}
      {currentExercise ? (
        <Animated.View
          layout={SequencedTransition.duration(200)} // Animate layout changes
          style={styles.currentExerciseSection}
        >
          <Text style={styles.currentExerciseTitle}>
            {currentExercise.name}
          </Text>
          {/* Set Table Header */}
          <View style={styles.setTableHeader}>
            <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
            <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
            <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
            <Text style={[styles.setHeaderText, styles.doneCol]}>Done</Text>
          </View>
          {/* Sets List */}
          {currentExercise.sets.map((set, index) => (
            <Animated.View
              key={set.id}
              layout={Layout.springify()} // Animate individual set rows
              style={styles.setRowContainer}
            >
              <View
                style={[styles.setRow, set.completed && styles.setRowCompleted]}
              >
                <Text style={styles.setNumberText}>{index + 1}</Text>

                {/* Reps Input */}
                <View style={styles.repsInputContainer}>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps.toString()}
                    onChangeText={value => handleRepsChange(index, value)}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    editable={!set.completed && !isRestTimerRunning}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      !set.completed &&
                      !isRestTimerRunning &&
                      handleRepsChange(index, (set.reps + 1).toString())
                    }
                    style={styles.decreaseReps}
                    disabled={set.completed || isRestTimerRunning}
                  >
                    <Icon
                      name="chevron-up"
                      size={20}
                      color={
                        set.completed || isRestTimerRunning
                          ? colors.border
                          : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      !set.completed &&
                      !isRestTimerRunning &&
                      handleRepsChange(
                        index,
                        Math.max(0, set.reps - 1).toString()
                      )
                    }
                    style={styles.increaseReps}
                    disabled={set.completed || isRestTimerRunning}
                  >
                    <Icon
                      name="chevron-down"
                      size={20}
                      color={
                        set.completed || isRestTimerRunning
                          ? colors.border
                          : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Weight Input & Unit Toggle */}
                <WeightUnitInput
                  weightValue={set.weight.toString()}
                  unitValue={set.unit}
                  onWeightChange={value => handleWeightChange(index, value)}
                  onUnitChange={unit => handleUnitChange(index, unit)}
                  editable={!set.completed && !isRestTimerRunning}
                />

                {/* Done Button */}
                <TouchableOpacity
                  style={[
                    styles.setDoneButton,
                    set.completed && styles.setDoneButtonCompleted,
                  ]}
                  onPress={() => handleToggleSetComplete(index)}
                  disabled={isRestTimerRunning} // Disable during rest
                >
                  <Icon
                    name={set.completed ? "check" : "checkbox-blank-outline"}
                    size={20}
                    color={
                      isRestTimerRunning
                        ? colors.border
                        : set.completed
                          ? colors.buttonText
                          : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* --- Conditional Rest Timer UI --- */}
              {currentSetIndexForRest === index && (
                <Animated.View
                  entering={FadeInDown}
                  exiting={FadeOutUp}
                  style={[
                    styles.restTimerContainer,
                    isRestTimerRunning && styles.restTimerActiveContainer,
                  ]}
                >
                  {isRestTimerRunning ? (
                    // Timer Running View
                    <>
                      <View style={styles.restTimerTextContainer}>
                        <Text
                          style={[
                            styles.restTimerText,
                            overtickSeconds > 0 && styles.restTimerTextOvertick,
                          ]}
                        >
                          {/* Show target duration if over ticking, else countdown */}
                          {formatDuration(
                            overtickSeconds > 0
                              ? restTimerDuration
                              : restTimerSeconds
                          )}
                        </Text>
                        {overtickSeconds > 0 && (
                          <Text style={styles.restTimerOvertickValue}>
                            +{overtickSeconds}s
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.restActionButton,
                          styles.startNextSetButton, // Use new style name
                        ]}
                        onPress={handleStartNextSet} // Use new handler name
                      >
                        <Icon
                          name="play" // Changed icon to play for next set
                          size={18}
                          color={colors.text}
                        />
                        <Text
                          style={[
                            styles.restActionButtonText,
                            styles.startNextSetButtonText, // Use new style name
                          ]}
                        >
                          Start Next Set
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Timer Ready View (Adjust buttons remain the same)
                    <View style={styles.restControlsContainer}>
                      <TouchableOpacity
                        style={styles.restAdjustButton}
                        onPress={() =>
                          handleAdjustRestDuration(-REST_ADJUST_INCREMENT)
                        }
                      >
                        <Icon
                          name="minus"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.restActionButton,
                          styles.startRestButton,
                        ]}
                        onPress={() => handleStartRest(index)}
                      >
                        <Icon
                          name="timer-outline"
                          size={18}
                          color={colors.buttonText}
                        />
                        <Text
                          style={[
                            styles.restActionButtonText,
                            styles.startRestButtonText,
                          ]}
                        >
                          Start Rest
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.nextRestDurationText}>
                        ({formatDuration(nextRestDuration)})
                      </Text>
                      <TouchableOpacity
                        style={styles.restAdjustButton}
                        onPress={() =>
                          handleAdjustRestDuration(REST_ADJUST_INCREMENT)
                        }
                      >
                        <Icon
                          name="plus"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              )}
              {/* --- End Conditional Rest Timer UI --- */}
            </Animated.View>
          ))}
        </Animated.View>
      ) : (
        // Placeholder when no exercise is selected/available
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={styles.placeholderText}>
            {workoutExercises.length === 0
              ? "No exercises in this workout."
              : "Select an exercise."}
          </Text>
        </View>
      )}

      {/* All Exercises List */}
      <View style={styles.allExercisesSection}>
        <Text style={styles.allExercisesTitle}>All Exercises</Text>
        {workoutExercises.map((exercise, index) => {
          // ... (status calculation and styling remains the same)
          const status = getExerciseStatus(exercise);
          let statusIconName: React.ComponentProps<typeof Icon>["name"] =
            "circle-outline";
          let statusIconColor = colors.textSecondary;
          let itemStyle = styles.exerciseListItem;

          if (status === "in-progress") {
            statusIconName = "circle-slice-5";
            statusIconColor = colors.primary;
            itemStyle = {
              ...itemStyle,
              ...styles.exerciseListItemInProgress,
            };
          } else if (status === "completed") {
            statusIconName = "check-circle";
            statusIconColor = colors.primary;
            itemStyle = { ...itemStyle, ...styles.exerciseListItemCompleted };
          }

          if (index === currentExerciseIndex) {
            itemStyle = { ...itemStyle, ...styles.exerciseListItemActive };
          }

          return (
            <TouchableOpacity
              key={exercise.instanceId} // Use instanceId for key
              style={itemStyle}
              onPress={() => handleSelectExercise(index)}
              disabled={isRestTimerRunning} // Disable switching during rest
            >
              <View style={styles.exerciseListItemContent}>
                <Icon
                  name={statusIconName}
                  size={18}
                  color={statusIconColor}
                  style={styles.statusIcon}
                />
                <View style={styles.exerciseListItemTextContainer}>
                  <Text style={styles.exerciseListName}>{exercise.name}</Text>
                  <Text style={styles.exerciseListSets}>
                    {exercise.sets.length} sets
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {workoutExercises.length === 0 && (
          <Text style={[styles.placeholderText, { padding: 15 }]}>
            Add exercises to begin.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default ActiveWorkoutScreen;
