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
  ActiveWorkoutSession, // Import type
  getActiveWorkoutSession, // Import get function
} from "@/services/storage";
import { formatDuration, formatRelativeDate } from "@/utils/formatters";
import { calculateWeeklyStats } from "@/utils/calculations";

type Props = NativeStackScreenProps<RootStackParamList, "Main">;

const DashboardOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({ count: 0, totalSeconds: 0 });
  // State for active session
  const [activeSession, setActiveSession] =
    useState<ActiveWorkoutSession | null>(null);

  // --- Fetch Data (History & Active Session) ---
  const loadDashboardData = useCallback(() => {
    setIsLoading(true);
    setActiveSession(null); // Reset active session before fetching
    try {
      // Fetch History
      const history = getWorkoutHistory();
      setRecentWorkouts(history.slice(0, 3));

      // Calculate Stats
      const stats = calculateWeeklyStats(history);
      setWeeklyStats(stats);

      // Fetch Active Session
      const session = getActiveWorkoutSession();
      setActiveSession(session);
      if (session) {
        console.log("Found active session on dashboard load:", session);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(loadDashboardData);

  // --- Navigation Handlers ---
  const handleViewWorkout = (workoutId: string) => {
    console.log("Navigate to view completed workout:", workoutId);
    Alert.alert(
      "Not Implemented",
      "Viewing completed workout details is not yet implemented."
    );
  };

  // --- Resume Handler ---
  const handleResumeWorkout = () => {
    if (activeSession) {
      console.log("Resuming workout:", activeSession);
      // Navigate to ActiveWorkoutScreen, passing the resumeData
      navigation.navigate("ActiveWorkout", { resumeData: activeSession });
    }
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    // ... (keep existing styles)
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
    },
    // Styles for Resume Card
    resumeCard: {
      backgroundColor: colors.primary, // Use primary color for emphasis
      marginHorizontal: 16, // Match other cards
      marginBottom: 8, // Space below
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
      color: colors.buttonText, // Use button text color on primary bg
      marginBottom: 2,
    },
    resumeSubtitle: {
      fontSize: 14,
      color: colors.buttonText, // Use button text color
      opacity: 0.9,
    },
    resumeButton: {
      backgroundColor: colors.background, // Background color button
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
    },
    resumeButtonText: {
      color: colors.primary, // Primary color text
      fontWeight: "bold",
      fontSize: 14,
    },
  });

  // --- Render Loading ---
  if (isLoading && !activeSession && recentWorkouts.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // --- Render Dashboard ---
  const weeklyGoal = 5;
  const weeklyProgress = weeklyGoal > 0 ? weeklyStats.count / weeklyGoal : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* --- Resume Workout Card --- */}
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
          </View>
        </Card>
      )}

      {/* Weekly Workouts Card */}
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
          {weeklyStats.count}/{weeklyGoal}
        </Text>
        <Text style={styles.statComparison}>Current week goal</Text>
        <ProgressBar progress={weeklyProgress} style={styles.progressBar} />
      </Card>

      {/* Total Workout Time Card */}
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

      {/* Personal Records Card (Placeholder) */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Records</Text>
          <Icon name="trophy-outline" size={20} style={styles.iconStyle} />
        </View>
        <Text style={styles.largeStat}>-</Text>
        <Text style={styles.statComparison}>PR tracking coming soon!</Text>
      </Card>

      {/* Recent Workouts */}
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
