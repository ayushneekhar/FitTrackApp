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
  AppState, // Re-import AppState
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
} from "@/services/storage";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import uuid from "react-native-uuid";
import { formatDuration } from "@/utils/formatters";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveWorkout">;

const ActiveWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { template: initialTemplate, resumeData } = route.params;

  // State and Refs (remain the same)
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [currentTemplate, setCurrentTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<number>(0);

  const startTimeRef = useRef(startTime);
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const currentTemplateRef = useRef(currentTemplate);
  const isFinishedRef = useRef(false);
  const elapsedSecondsRef = useRef(0);

  // Update refs (remain the same)
  useEffect(() => {
    startTimeRef.current = startTime;
    accumulatedSecondsRef.current = accumulatedSeconds;
    currentTemplateRef.current = currentTemplate;
  }, [startTime, accumulatedSeconds, currentTemplate]);

  // Initialize state (remain the same)
  useEffect(() => {
    let resumeTimestamp = 0;
    if (resumeData) {
      console.log("Resuming workout session:", resumeData);
      setStartTime(resumeData.startTime);
      setAccumulatedSeconds(resumeData.accumulatedSeconds);
      setCurrentTemplate(resumeData.template);
      resumeTimestamp = Date.now();
      setLastResumeTime(resumeTimestamp);
      isFinishedRef.current = false;
      clearActiveWorkoutSession();
    } else {
      console.log("Starting new workout session.");
      const now = Date.now();
      setStartTime(now);
      setAccumulatedSeconds(0);
      setCurrentTemplate(initialTemplate || null);
      resumeTimestamp = now;
      setLastResumeTime(resumeTimestamp);
      isFinishedRef.current = false;
    }
  }, [resumeData, initialTemplate]);

  const workoutName = currentTemplate ? currentTemplate.name : "Empty Workout";

  // Timer Logic (remain the same)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lastResumeTime > 0) {
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
  }, [lastResumeTime, accumulatedSeconds]);

  // --- Save Session Function (remain the same) ---
  const saveCurrentSession = useCallback(() => {
    if (!isFinishedRef.current && startTimeRef.current > 0) {
      const sessionToSave: ActiveWorkoutSession = {
        startTime: startTimeRef.current,
        accumulatedSeconds: elapsedSecondsRef.current,
        template: currentTemplateRef.current,
      };
      console.log("Saving session state...", sessionToSave);
      saveActiveWorkoutSession(sessionToSave);
    } else {
      console.log("Not saving session (finished or invalid).");
    }
  }, []); // Uses refs, no dependencies needed

  // --- Prevent Back Navigation Hook (remain the same) ---
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
            saveCurrentSession(); // Save the state
            navigation.dispatch(data.action); // Perform the original navigation
          },
        },
      ]
    );
  });

  // --- NEW: Save state when app goes to background ---
  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      // Save when app becomes inactive or goes to background
      if (
        nextAppState.match(/inactive|background/) &&
        startTime > 0 && // Only save if workout has started
        !isFinishedRef.current // Don't save if already finished
      ) {
        console.log(`App state changed to ${nextAppState}, saving session...`);
        saveCurrentSession();
      }
    });

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, [startTime, saveCurrentSession]); // Add startTime dependency to ensure it runs only after start

  // --- Finish Workout Logic (remain the same) ---
  const handleFinishWorkout = useCallback(() => {
    if (!startTime) {
      Alert.alert("Error", "Workout start time not recorded.");
      return;
    }
    isFinishedRef.current = true; // Mark as finished FIRST
    const endTime = Date.now();
    const finalDurationSeconds = elapsedSecondsRef.current;

    const completedWorkoutData: CompletedWorkout = {
      id: uuid.v4() as string,
      templateId: currentTemplate?.id,
      name: workoutName,
      startTime: startTime,
      endTime: endTime,
      durationSeconds: finalDurationSeconds,
      exercises:
        currentTemplate?.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets.map(set => ({
            reps: set.reps,
            weight: set.weight,
          })),
        })) || [],
    };

    try {
      saveCompletedWorkout(completedWorkoutData);
      clearActiveWorkoutSession(); // Clear paused state
      console.log("Workout Saved:", completedWorkoutData);
      Alert.alert(
        "Workout Complete!",
        `Duration: ${formatDuration(finalDurationSeconds)}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      console.error("Failed to save workout:", error);
      Alert.alert("Error", "Could not save workout session.");
      isFinishedRef.current = false; // Reset flag on error
    }
  }, [startTime, currentTemplate, workoutName, navigation]);

  // --- Header Button (remain the same) ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: workoutName,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={styles.finishButton}
        >
          <Icon
            name="check-circle-outline"
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      ),
      gestureEnabled: false,
      headerLeft: () => null,
    });
  }, [navigation, handleFinishWorkout, workoutName, colors]);

  // --- Styles (remain the same) ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    timerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
      marginTop: 10,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginTop: 30,
    },
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
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>

      {/* Placeholder */}
      <Text style={styles.placeholderText}>
        (Active workout UI - Exercise:{" "}
        {currentTemplate?.exercises[0]?.name || "N/A"}...)
      </Text>
    </ScrollView>
  );
};

export default ActiveWorkoutScreen;
