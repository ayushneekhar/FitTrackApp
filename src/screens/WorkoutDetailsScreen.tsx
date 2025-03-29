// src/screens/WorkoutDetailsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Card from "@/components/Card";

// Get route params (workoutId)
type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetails">;

const WorkoutDetailsScreen: React.FC<Props> = ({ route }) => {
  const { colors } = useTheme();
  const { workoutId } = route.params; // Get the workoutId passed during navigation

  // In a real app, you would fetch workout details based on workoutId here
  const workoutDetails = {
    name: "Upper Body Blast",
    date: "Yesterday, 4:30 PM",
    duration: "45 min 12 sec",
    volume: "10,500 lbs",
    exercises: [
      { id: "e1", name: "Bench Press", sets: "3x5 @ 225 lbs" },
      { id: "e2", name: "Overhead Press", sets: "3x8 @ 135 lbs" },
      { id: "e3", name: "Barbell Rows", sets: "3x10 @ 185 lbs" },
      { id: "e4", name: "Pull-ups", sets: "3xAMRAP" },
      { id: "e5", name: "Tricep Pushdowns", sets: "3x12 @ 50 lbs" },
    ],
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    exerciseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    exerciseItemLast: {
      borderBottomWidth: 0,
    },
    exerciseName: {
      fontSize: 16,
      color: colors.text,
      flex: 1, // Allow wrapping
      marginRight: 10,
    },
    exerciseSets: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>{workoutDetails.name}</Text>
      <Text style={styles.subtitle}>
        {workoutDetails.date} • {workoutDetails.duration} •{" "}
        {workoutDetails.volume}
      </Text>

      <Text style={styles.sectionTitle}>Exercises</Text>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 5 }}>
        {workoutDetails.exercises.map((ex, index) => (
          <View
            key={ex.id}
            style={[
              styles.exerciseItem,
              index === workoutDetails.exercises.length - 1 &&
                styles.exerciseItemLast,
            ]}
          >
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseSets}>{ex.sets}</Text>
          </View>
        ))}
      </Card>

      {/* Add sections for notes, PRs achieved, etc. */}
    </ScrollView>
  );
};

export default WorkoutDetailsScreen;
