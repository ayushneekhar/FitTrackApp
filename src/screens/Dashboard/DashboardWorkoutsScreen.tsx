// src/screens/Dashboard/DashboardWorkoutsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
// Import navigation types if needed
// import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
// import { DashboardTopTabParamList } from '@/navigation/DashboardTopTabNavigator';

// type Props = MaterialTopTabScreenProps<DashboardTopTabParamList, 'Workouts'>;

const DashboardWorkoutsScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
    },
  });

  // Dummy data for example
  const workouts = [
    { id: "1", name: "Morning Push", exercises: 6, date: "Last Monday" },
    { id: "2", name: "Leg Annihilation", exercises: 8, date: "Last Wednesday" },
    { id: "3", name: "Full Body Blast", exercises: 10, date: "Last Friday" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Your Workout Templates</Text>
      {workouts.length > 0 ? (
        <Card style={{ padding: 0 }}>
          {/* Remove card padding if list items have their own */}
          {workouts.map((workout, index) => (
            <WorkoutListItem
              key={workout.id}
              title={workout.name}
              details={`${workout.exercises} exercises • ${workout.date}`}
              actionText="Start"
              onPress={() => console.log("Start workout:", workout.name)}
              iconName="clipboard-play-outline"
              style={{
                borderBottomWidth:
                  index === workouts.length - 1 ? 0 : StyleSheet.hairlineWidth, // No border on last item
                paddingHorizontal: 16, // Add horizontal padding back
              }}
            />
          ))}
        </Card>
      ) : (
        <Text style={styles.placeholderText}>
          Create your first workout template!
        </Text>
      )}

      {/* You could add sections for saved workouts, history etc. */}
    </ScrollView>
  );
};

export default DashboardWorkoutsScreen;
