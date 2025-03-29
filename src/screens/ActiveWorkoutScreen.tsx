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
  TextInput, // Import TextInput
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
  WorkoutSet, // Import WorkoutSet if needed separately
} from "@/services/storage";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import uuid from "react-native-uuid";
import { formatDuration } from "@/utils/formatters";
import Card from "@/components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveWorkout">;

interface ActiveWorkoutSet extends WorkoutSet {
  completed: boolean;
}

interface ActiveWorkoutExercise {
  id: string;
  name: string;
  sets: ActiveWorkoutSet[];
}

const ActiveWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { template: initialTemplate, resumeData } = route.params;

  // --- State ---
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<number>(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // State to hold the actual workout progress
  const [workoutExercises, setWorkoutExercises] = useState<
    ActiveWorkoutExercise[]
  >([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false); // For explicit timer control

  // --- Refs ---
  const startTimeRef = useRef(startTime);
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const isFinishedRef = useRef(false);
  const elapsedSecondsRef = useRef(0);
  // Ref for workoutExercises to use in save function
  const workoutExercisesRef = useRef(workoutExercises);

  // Update refs
  useEffect(() => {
    startTimeRef.current = startTime;
    accumulatedSecondsRef.current = accumulatedSeconds;
    workoutExercisesRef.current = workoutExercises; // Update exercises ref
  }, [startTime, accumulatedSeconds, workoutExercises]);

  // --- Initialization ---
  useEffect(() => {
    let initialExercises: ActiveWorkoutExercise[] = [];
    let startAccumulated = 0;
    let startTimestamp = 0;
    let startResumeTime = 0;

    if (resumeData) {
      console.log("Resuming workout session:", resumeData);
      // TODO: Need to properly restore workoutExercises state from resumeData
      // For now, we just restore the template and time
      startAccumulated = resumeData.accumulatedSeconds;
      startTimestamp = resumeData.startTime;
      startResumeTime = Date.now();
      initialExercises =
        resumeData.template?.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => ({ ...set, completed: false })), // Assume sets aren't completed on resume for now
        })) || [];
      isFinishedRef.current = false;
      clearActiveWorkoutSession();
    } else if (initialTemplate) {
      console.log("Starting new workout from template.");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = initialTemplate.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: set.reps,
          weight: set.weight,
          completed: false, // Initialize sets as not completed
        })),
      }));
      isFinishedRef.current = false;
    } else {
      // Handle starting an empty workout (allow adding exercises dynamically - future enhancement)
      console.log("Starting empty workout (basic setup).");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = []; // Start with no exercises
      isFinishedRef.current = false;
    }

    setStartTime(startTimestamp);
    setAccumulatedSeconds(startAccumulated);
    setLastResumeTime(startResumeTime);
    setWorkoutExercises(initialExercises);
    setCurrentExerciseIndex(0); // Start at the first exercise
    setIsTimerRunning(true); // Start timer automatically
  }, [resumeData, initialTemplate]);

  const currentExercise = workoutExercises[currentExerciseIndex];
  const workoutName = initialTemplate?.name || "New Workout"; // Get name from template

  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && lastResumeTime > 0) {
      const updateTimer = () => {
        const secondsSinceLastResume = Math.round(
          (Date.now() - lastResumeTime) / 1000
        );
        const currentTotalElapsed = accumulatedSeconds + secondsSinceLastResume;
        setElapsedSeconds(currentTotalElapsed);
        elapsedSecondsRef.current = currentTotalElapsed;
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, lastResumeTime, accumulatedSeconds]);

  // --- Timer Controls ---
  const handleToggleTimer = () => {
    if (isTimerRunning) {
      // Pause timer
      setAccumulatedSeconds(elapsedSecondsRef.current); // Store current elapsed time
      setLastResumeTime(0); // Stop timer interval by resetting resume time
    } else {
      // Start/Resume timer
      setLastResumeTime(Date.now()); // Record resume time
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    Alert.alert("Reset Timer?", "Are you sure you want to reset the timer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setAccumulatedSeconds(0);
          setElapsedSeconds(0);
          elapsedSecondsRef.current = 0;
          setLastResumeTime(isTimerRunning ? Date.now() : 0); // Reset resume time based on running state
        },
      },
    ]);
  };

  // --- Save Session Function ---
  const saveCurrentSession = useCallback(() => {
    if (!isFinishedRef.current && startTimeRef.current > 0) {
      // TODO: Save the actual state of workoutExercisesRef.current
      const sessionToSave: ActiveWorkoutSession = {
        startTime: startTimeRef.current,
        accumulatedSeconds: elapsedSecondsRef.current,
        // For now, saving the initial template. Ideally save workoutExercisesRef.current state
        template: initialTemplate || null,
        // Add currentExerciseIndex, etc. if needed for full resume
      };
      console.log("Saving session state...", sessionToSave);
      saveActiveWorkoutSession(sessionToSave);
    } else {
      console.log("Not saving session (finished or invalid).");
    }
  }, [initialTemplate]); // Dependency on initialTemplate for now

  // --- Prevent Back Navigation Hook ---
  usePreventRemove(startTime > 0 && !isFinishedRef.current, ({ data }) => {
    Alert.alert(
      "Pause Workout?",
      "Do you want to pause this workout and leave? Your progress will be saved.",
      [
        { text: "Stay", style: "cancel", onPress: () => {} },
        {
          text: "Pause & Leave",
          style: "destructive",
          onPress: () => {
            setIsTimerRunning(false); // Explicitly pause timer
            setAccumulatedSeconds(elapsedSecondsRef.current); // Update accumulated time before saving
            saveCurrentSession();
            navigation.dispatch(data.action);
          },
        },
      ]
    );
  });

  // --- Set Data Handling ---
  const handleRepsChange = (setIndex: number, value: string) => {
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

  const handleToggleSetComplete = (setIndex: number) => {
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, completed: !set.completed };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
    // Optional: Auto-advance to next set/exercise or start rest timer here
  };

  // --- Exercise Navigation ---
  const handleNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Optionally show "Last Exercise" message or offer to finish
      Alert.alert("Last Exercise", "You've reached the last exercise.");
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
  };

  // --- Finish Workout Logic ---
  const handleFinishWorkout = useCallback(() => {
    if (!startTime) return;
    isFinishedRef.current = true;
    const endTime = Date.now();
    const finalDurationSeconds = elapsedSecondsRef.current;

    // Use the *actual* state from workoutExercisesRef
    const finalExercises = workoutExercisesRef.current.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map(set => ({
        reps: Number(set.reps) || 0,
        weight: Number(set.weight) || 0,
        completed: set.completed, // Save completion status
      })),
    }));

    const completedWorkoutData: CompletedWorkout = {
      id: uuid.v4() as string,
      templateId: initialTemplate?.id, // Use initial template ID
      name: workoutName,
      startTime: startTime,
      endTime: endTime,
      durationSeconds: finalDurationSeconds,
      exercises: finalExercises, // Save the actual performed data
    };

    try {
      saveCompletedWorkout(completedWorkoutData);
      clearActiveWorkoutSession();
      console.log("Workout Saved:", completedWorkoutData);
      Alert.alert(
        "Workout Complete!",
        `Duration: ${formatDuration(finalDurationSeconds)}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      console.error("Failed to save workout:", error);
      Alert.alert("Error", "Could not save workout session.");
      isFinishedRef.current = false;
    }
  }, [startTime, initialTemplate, workoutName, navigation]); // Dependencies

  // --- Header ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: workoutName, // Use workout name from template/state
      headerTitleAlign: "left", // Align title left like screenshot
      headerLeft: () => (
        // Custom back button if needed
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 5, marginLeft: 10 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={styles.finishButton}
        >
          <Icon
            name="content-save-check-outline" // Different icon?
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      ),
      gestureEnabled: false, // Keep disabled
    });
  }, [navigation, handleFinishWorkout, workoutName, colors]);

  // --- Styles ---
  const styles = StyleSheet.create({
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
    timerDisplay: {
      fontSize: 48, // Large timer display
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      fontVariant: ["tabular-nums"], // Keep numbers aligned
    },
    timerControls: {
      flexDirection: "row",
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
      padding: 16,
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
      paddingHorizontal: 5, // Align with set row padding
    },
    setHeaderText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textAlign: "center",
    },
    setCol: { width: 40 }, // Set number column
    repsCol: { flex: 1, marginHorizontal: 5 }, // Reps column
    weightCol: { flex: 1, marginHorizontal: 5 }, // Weight column
    doneCol: { width: 50 }, // Done column
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      paddingVertical: 5,
    },
    setNumberText: {
      width: 40, // Match header col width
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    setInputContainer: {
      flex: 1, // Take space in flex columns
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8, // Inner padding
      marginHorizontal: 5, // Space between inputs
      minHeight: 40, // Ensure touchable area
      justifyContent: "center", // Center text vertically
    },
    setInput: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8, // Adjust vertical padding
    },
    setDoneButton: {
      width: 50, // Match header col width
      height: 40, // Match input height
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 5, // Space before button
    },
    setDoneButtonCompleted: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    setRowCompleted: {
      opacity: 0.6, // Dim completed row slightly
    },
    // All Exercises Section
    allExercisesSection: {
      paddingTop: 16, // No top padding needed if header has border
      rowGap: 8,
    },
    allExercisesTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      paddingHorizontal: 16, // Add padding to title
    },
    exerciseListItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    exerciseListItemActive: {
      backgroundColor: colors.progressBarBackground, // Highlight active item
    },
    exerciseListName: {
      fontSize: 16,
      color: colors.text,
    },
    exerciseListSets: {
      fontSize: 14,
      color: colors.textSecondary,
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
    decreaseReps: { left: 148, zIndex: 2, position: "absolute" },
    increaseReps: { left: 56, zIndex: 2, position: "absolute" },
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
        <Text style={styles.timerLabel}>Workout Timer</Text>
        <Text style={styles.timerDisplay}>
          {formatDuration(elapsedSeconds)}
        </Text>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={[
              styles.timerButton,
              isTimerRunning
                ? styles.timerButtonSecondary // Show Pause style if running
                : styles.timerButtonPrimary, // Show Start style if paused
            ]}
            onPress={handleToggleTimer}
          >
            <Icon
              name={isTimerRunning ? "pause" : "play"}
              size={18}
              color={isTimerRunning ? colors.text : colors.buttonText}
            />
            <Text
              style={[
                styles.timerButtonText,
                isTimerRunning
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
          >
            <Icon name="backup-restore" size={18} color={colors.text} />
            <Text
              style={[styles.timerButtonText, styles.timerButtonTextSecondary]}
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
          disabled={currentExerciseIndex === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentExerciseIndex >= workoutExercises.length - 1 &&
              styles.navButtonDisabled,
          ]}
          onPress={handleNextExercise}
          disabled={currentExerciseIndex >= workoutExercises.length - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Current Exercise Details */}
      {currentExercise ? (
        <View style={styles.currentExerciseSection}>
          <Text style={styles.currentExerciseTitle}>
            {currentExercise.name}
          </Text>
          {/* Set Table Header */}
          <View style={styles.setTableHeader}>
            <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
            <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
            <Text style={[styles.setHeaderText, styles.weightCol]}>
              Weight ({/* Add unit preference later */}kg)
            </Text>
            <Text style={[styles.setHeaderText, styles.doneCol]}>Done</Text>
          </View>
          {/* Sets List */}
          {currentExercise.sets.map((set, index) => (
            <View
              key={set.id}
              style={[
                styles.setRow,
                set.completed && styles.setRowCompleted, // Apply style if completed
              ]}
            >
              <Text style={styles.setNumberText}>{index + 1}</Text>
              {/* Reps Input */}
              <TouchableOpacity
                onPress={() =>
                  handleRepsChange(index, (set.reps + 1).toString())
                }
                style={styles.decreaseReps}
              >
                <Icon
                  name="chevron-up"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <View style={styles.setInputContainer}>
                <TextInput
                  style={styles.setInput}
                  value={set.reps.toString()}
                  onChangeText={value => handleRepsChange(index, value)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  editable={!set.completed} // Disable editing if completed
                />
              </View>

              <TouchableOpacity
                onPress={() =>
                  handleRepsChange(index, (set.reps - 1).toString())
                }
                style={styles.increaseReps}
              >
                <Icon
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {/* Weight Input */}
              <View style={styles.setInputContainer}>
                <TextInput
                  style={styles.setInput}
                  value={set.weight.toString()}
                  onChangeText={value => handleWeightChange(index, value)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  editable={!set.completed} // Disable editing if completed
                />
              </View>
              {/* Done Button */}
              <TouchableOpacity
                style={[
                  styles.setDoneButton,
                  set.completed && styles.setDoneButtonCompleted,
                ]}
                onPress={() => handleToggleSetComplete(index)}
              >
                <Icon
                  name={set.completed ? "check" : "close"} // Show check when done
                  size={20}
                  color={
                    set.completed ? colors.buttonText : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary }}>
            {workoutExercises.length === 0
              ? "No exercises in this workout."
              : "Select an exercise."}
          </Text>
          {/* Add button to add exercises if workout is empty? */}
        </View>
      )}

      {/* All Exercises List */}
      <View style={styles.allExercisesSection}>
        <Text style={styles.allExercisesTitle}>All Exercises</Text>
        {workoutExercises.map((exercise, index) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseListItem,
              index === currentExerciseIndex && styles.exerciseListItemActive, // Highlight current
            ]}
            onPress={() => handleSelectExercise(index)}
          >
            <Text style={styles.exerciseListName}>{exercise.name}</Text>
            <Text style={styles.exerciseListSets}>
              {exercise.sets.length} sets
            </Text>
          </TouchableOpacity>
        ))}
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
