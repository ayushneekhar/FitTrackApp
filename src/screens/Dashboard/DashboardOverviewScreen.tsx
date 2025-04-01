// src/screens/Dashboard/DashboardOverviewScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import WorkoutListItem from "@/components/WorkoutListItem";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import { useFocusEffect } from "@react-navigation/native";
import {
  getWorkoutHistory,
  CompletedWorkout,
  ActiveWorkoutSession,
  getActiveWorkoutSession,
  WeightUnit,
  clearActiveWorkoutSession,
} from "@/services/storage";
import { formatDuration, formatRelativeDate } from "@/utils/formatters";
import { calculateWeeklyStats } from "@/utils/calculations"; // Keep this

type Props = NativeStackScreenProps<RootStackParamList, "Main">;

// --- Define PR Interface and Tracked Exercises ---
interface PersonalRecord {
  exerciseName: string;
  weight: number;
  unit: WeightUnit; // Use WeightUnit type
  date: number;
}

const PR_EXERCISES_TO_TRACK = [
  "Barbell Bench Press",
  "Barbell Squats",
  "Deadlifts",
];
// ---

const DashboardOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    count: 0,
    totalSeconds: 0,
    activeDaysCount: 0, // Added from previous step
    totalVolumeKg: 0, // Added from previous step
  });
  const [activeSession, setActiveSession] =
    useState<ActiveWorkoutSession | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]); // <-- New state for PRs

  // --- Fetch Data (History, Active Session, Stats, PRs) ---
  const loadDashboardData = useCallback(() => {
    setIsLoading(true);
    setActiveSession(null);
    try {
      // Fetch Full History
      const history = getWorkoutHistory();

      // Set Recent Workouts
      setRecentWorkouts(history.slice(0, 3));

      // Calculate Weekly Stats
      const stats = calculateWeeklyStats(history); // This now includes active days & volume
      setWeeklyStats(stats);

      // Fetch Active Session
      const session = getActiveWorkoutSession();
      setActiveSession(session);
      if (session) {
        console.log("Found active session on dashboard load:", session);
      }

      // --- Calculate Personal Records ---
      const calculatedPRs: Record<string, PersonalRecord> = {};
      history.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (PR_EXERCISES_TO_TRACK.includes(exercise.name)) {
            exercise.sets.forEach(set => {
              if (set.weight > 0) {
                const currentPR = calculatedPRs[exercise.name];
                if (!currentPR || set.weight > currentPR.weight) {
                  calculatedPRs[exercise.name] = {
                    exerciseName: exercise.name,
                    weight: set.weight,
                    unit: set.unit,
                    date: workout.startTime,
                  };
                }
              }
            });
          }
        });
      });
      setPersonalRecords(Object.values(calculatedPRs)); // <-- Update PR state
      // --- End PR Calculation ---
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(loadDashboardData);

  // --- Navigation Handlers (Keep existing) ---
  const handleViewWorkout = (workoutId: string) => {
    navigation.navigate("WorkoutDetails", { workoutId: workoutId }); // Navigate correctly
  };

  const handleResumeWorkout = () => {
    if (activeSession) {
      navigation.navigate("ActiveWorkout", { resumeData: activeSession });
    }
  };

  const handleDeleteActiveWorkout = () => {
    if (activeSession) {
      clearActiveWorkoutSession();
      setActiveSession(null);
    }
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    // ... (keep existing styles for container, cards, headers, stats, progress, resume etc.) ...
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingVertical: 8,
      paddingBottom: 20,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    largeStat: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginVertical: 4,
    },
    statComparison: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    progressBar: {
      marginTop: 5,
    },
    sectionContainer: {
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colors.text,
    },
    iconStyle: {
      color: colors.textSecondary,
    },
    loadingContainer: {
      marginTop: 20,
      alignItems: "center",
    },
    placeholderText: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: 10,
      fontSize: 14, // Consistent placeholder size
      paddingVertical: 10, // Add padding for placeholder text
    },
    resumeCard: {
      backgroundColor: colors.primary,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    resumeContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    resumeTextContainer: {
      flex: 1,
      marginRight: 15,
    },
    resumeTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.buttonText,
      marginBottom: 2,
    },
    resumeSubtitle: {
      fontSize: 14,
      color: colors.buttonText,
      opacity: 0.9,
    },
    resumeButton: {
      backgroundColor: colors.background,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
    },
    deleteButton: {
      backgroundColor: colors.destructive,
      padding: 8,
      borderRadius: 6,
      marginLeft: 8,
    },
    resumeButtonText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: 14,
    },
    // --- NEW/Copied PR Styles ---
    prItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10, // Adjusted padding
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    prItemLast: {
      borderBottomWidth: 0,
    },
    prInfo: {
      flex: 1, // Allow text to wrap if needed
      marginRight: 10,
    },
    prExercise: {
      fontSize: 15, // Slightly smaller for dashboard card
      fontWeight: "500",
      color: colors.text,
    },
    prDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    prWeight: {
      fontSize: 15, // Slightly smaller for dashboard card
      fontWeight: "bold",
      color: colors.text,
    },
    // --- End PR Styles ---
  });

  // --- Render Loading ---
  if (isLoading && !activeSession && recentWorkouts.length === 0) {
    // Show loading only if truly nothing is loaded yet
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // --- Render Dashboard ---
  const weeklyGoal = 5; // Replace with goals from storage/context if available
  const weeklyProgress = weeklyGoal > 0 ? weeklyStats.count / weeklyGoal : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Resume Workout Card (Keep existing) */}
      {activeSession && (
        <Card style={styles.resumeCard}>
          <View style={styles.resumeContent}>
            <Icon
              name="play-circle-outline"
              size={30}
              color={colors.buttonText}
              style={{ marginRight: 15 }}
            />
            <View style={styles.resumeTextContainer}>
              <Text style={styles.resumeTitle}>Workout in Progress</Text>
              <Text style={styles.resumeSubtitle}>
                {activeSession.template?.name || "Empty Workout"} (
                {formatDuration(activeSession.accumulatedSeconds)})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={handleResumeWorkout}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteActiveWorkout}
            >
              <Icon name="delete" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Weekly Workouts Card (Keep existing) */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Workouts</Text>
          <Icon
            name="calendar-check-outline"
            size={20}
            style={styles.iconStyle}
          />
        </View>
        <Text style={styles.largeStat}>
          {weeklyStats.count}/{weeklyGoal} {/* Use dynamic goal later */}
        </Text>
        <Text style={styles.statComparison}>Current week goal</Text>
        <ProgressBar progress={weeklyProgress} style={styles.progressBar} />
      </Card>

      {/* Total Workout Time Card (Keep existing) */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Workout Time</Text>
          <Icon name="clock-outline" size={20} style={styles.iconStyle} />
        </View>
        <Text style={styles.largeStat}>
          {formatDuration(weeklyStats.totalSeconds)}
        </Text>
        <Text style={styles.statComparison}>Total time this week</Text>
      </Card>

      {/* --- Personal Records Card (UPDATED) --- */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Records</Text>
          <Icon name="trophy-outline" size={20} style={styles.iconStyle} />
        </View>
        {isLoading && personalRecords.length === 0 ? (
          // Show loading indicator specifically for PRs if main loading is done
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 10 }}
          />
        ) : personalRecords.length > 0 ? (
          // Display found PRs
          personalRecords.map((pr, index) => (
            <View
              key={pr.exerciseName}
              style={[
                styles.prItem,
                index === personalRecords.length - 1 && styles.prItemLast,
              ]}
            >
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                <Text style={styles.prDate}>{formatRelativeDate(pr.date)}</Text>
              </View>
              <Text style={styles.prWeight}>
                {pr.weight} {pr.unit}
              </Text>
            </View>
          ))
        ) : (
          // Show placeholder if no PRs found after loading
          <Text style={styles.placeholderText}>No PRs recorded yet.</Text>
        )}
      </Card>
      {/* --- End Personal Records Card --- */}

      {/* Recent Workouts (Keep existing) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {isLoading && recentWorkouts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : recentWorkouts.length > 0 ? (
          <Card style={{ padding: 0, marginHorizontal: 0 }}>
            {recentWorkouts.map((workout, index) => (
              <WorkoutListItem
                key={workout.id}
                title={workout.name}
                details={`${formatRelativeDate(workout.startTime)} • ${formatDuration(workout.durationSeconds)}`}
                actionText="View"
                onPress={() => handleViewWorkout(workout.id)}
                iconName="history"
                style={{
                  borderBottomWidth:
                    index === recentWorkouts.length - 1
                      ? 0
                      : StyleSheet.hairlineWidth,
                  paddingHorizontal: 16,
                }}
              />
            ))}
          </Card>
        ) : (
          <Card style={{ padding: 15 }}>
            <Text style={styles.placeholderText}>
              No completed workouts yet. Go lift something!
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

export default DashboardOverviewScreen;
