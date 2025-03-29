// src/screens/Dashboard/DashboardOverviewScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity, // Ensure TouchableOpacity is imported if used
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import WorkoutListItem from "@/components/WorkoutListItem";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { NativeStackScreenProps } from "@react-navigation/native-stack"; // Import navigation types
import { RootStackParamList } from "@/navigation/AppNavigator"; // Import your RootStackParamList

// Define navigation props type for this screen
type Props = NativeStackScreenProps<RootStackParamList, "Main">; // Assuming 'Main' holds the Bottom Tabs

const DashboardOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme(); // Get theme colors

  const handleViewWorkout = () => {
    navigation.navigate("WorkoutDetails"); // Navigate to details screen
  };

  const handleStartWorkout = (workoutName: string) => {
    console.log("Starting:", workoutName);
    // Potentially navigate to an active workout screen
  };

  // Define styles dynamically or outside if they don't depend heavily on theme initially
  // For simplicity, defining outside and using theme colors inside render
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Use theme background
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
      color: colors.text, // Use theme text color
    },
    largeStat: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text, // Use theme text color
      marginVertical: 4,
    },
    statComparison: {
      fontSize: 14,
      color: colors.textSecondary, // Use theme secondary text color
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
      color: colors.text, // Use theme text color
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary, // Use theme secondary text color
      marginBottom: 15,
    },
    // Add specific styles for icons if needed
    iconStyle: {
      color: colors.textSecondary, // Use theme color for icons
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Weekly Workouts Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Workouts</Text>
          <Icon name="arrow-expand" size={20} style={styles.iconStyle} />
        </View>
        <Text style={styles.largeStat}>3/5</Text>
        <Text style={styles.statComparison}>+1 from last week</Text>
        <ProgressBar progress={3 / 5} style={styles.progressBar} />
      </Card>

      {/* Total Workout Time Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Total Workout Time</Text>
          <Icon name="clock-outline" size={20} style={styles.iconStyle} />
        </View>
        <Text style={styles.largeStat}>4h 32m</Text>
        <Text style={styles.statComparison}>+45m from last week</Text>
      </Card>

      {/* Personal Records Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Records</Text>
          <Icon name="trending-up" size={20} style={styles.iconStyle} />
        </View>
        <Text style={styles.largeStat}>2</Text>
        <Text style={styles.statComparison}>New PRs this week</Text>
      </Card>

      {/* Recent Workouts */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {/* WorkoutListItem needs to be updated to use theme colors too */}
        <WorkoutListItem
          title="Upper Body"
          details="Today • 45 min • 5 exercises"
          actionText="View"
          onPress={handleViewWorkout}
        />
        {/* ... other list items */}
      </View>

      {/* Upcoming Workouts */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Upcoming Workouts</Text>
        <Text style={styles.sectionSubtitle}>
          Your scheduled workouts for the week
        </Text>
        {/* WorkoutListItem needs to be updated to use theme colors too */}
        <WorkoutListItem
          title="Push Day"
          details="Tomorrow at 7:00 AM"
          actionText="Start"
          onPress={() => handleStartWorkout("Push Day")}
        />
        {/* ... other list items */}
      </View>
    </ScrollView>
  );
};

export default DashboardOverviewScreen;
