// src/screens/Dashboard/DashboardWorkoutsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import { getAllWorkoutTemplates } from "@/services/storage";
import { useNavigation } from "@react-navigation/native";
// Import navigation types if needed
// import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
// import { DashboardTopTabParamList } from '@/navigation/DashboardTopTabNavigator';

// type Props = MaterialTopTabScreenProps<DashboardTopTabParamList, 'Workouts'>;

const DashboardWorkoutsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    title: {
      margin: 16,
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
    },
  });

  const workouts = getAllWorkoutTemplates();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Workout Templates</Text>
      {workouts.length > 0 ? (
        <Card style={{ padding: 0 }}>
          {/* Remove card padding if list items have their own */}
          {workouts.map((workout, index) => (
            <WorkoutListItem
              key={workout.id}
              title={workout.name}
              details={`${workout.exercises.length} exercises • ${workout.date}`}
              actionText="Start"
              onPress={() => navigation.navigate("ActiveWorkoyut")}
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
