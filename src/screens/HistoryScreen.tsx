// src/screens/HistoryScreen.tsx (Main Tab)
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert, // Import Alert
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import { useFocusEffect } from "@react-navigation/native";
import { getWorkoutHistory, CompletedWorkout } from "@/services/storage";
import { formatDuration, formatRelativeDate } from "@/utils/formatters";

const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    try {
      const fetchedHistory = getWorkoutHistory();
      setHistory(fetchedHistory);
    } catch (error) {
      console.error("Error loading workout history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(loadHistory);

  const handleViewWorkout = (workoutId: string) => {
    console.log("Navigate to view completed workout:", workoutId);
    Alert.alert(
      "Not Implemented",
      "Viewing completed workout details is not yet implemented."
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingTop: 20, // Adjust padding if needed
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 50,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Completed Workouts</Text>
      {history.length > 0 ? (
        <Card style={{ padding: 0, marginHorizontal: 0 }}>
          {history.map((item, index) => (
            <WorkoutListItem
              key={item.id}
              title={item.name}
              details={`${formatRelativeDate(item.startTime)} • ${formatDuration(item.durationSeconds)}`}
              actionText="View"
              onPress={() => handleViewWorkout(item.id)}
              iconName="check-circle-outline"
              style={{
                borderBottomWidth:
                  index === history.length - 1 ? 0 : StyleSheet.hairlineWidth,
                paddingHorizontal: 16,
              }}
            />
          ))}
        </Card>
      ) : (
        <Text style={styles.placeholderText}>
          Your completed workouts will appear here.
        </Text>
      )}
    </ScrollView>
  );
};

export default HistoryScreen;
