// src/screens/Profile/ProfileStatsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
// Import navigation types if needed
// import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
// import { ProfileTopTabParamList } from '@/navigation/ProfileTopTabNavigator';

// type Props = MaterialTopTabScreenProps<ProfileTopTabParamList, 'Stats'>;

const ProfileStatsScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingVertical: 8, // Add padding for scrollview content
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
      color: colors.text,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    goalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 15,
    },
    goalHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    goalLabel: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
    goalProgressText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressBar: {
      marginTop: 8,
    },
    prItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    prItemLast: {
      borderBottomWidth: 0, // No border for the last item
    },
    prExercise: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    prDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    prWeight: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    iconStyle: {
      color: colors.textSecondary,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Weekly Goals Card */}
      <Card>
        <Text style={styles.cardTitle}>Weekly Goals</Text>
        <Text style={styles.cardSubtitle}>
          Your progress towards this week's goals
        </Text>

        {/* Workouts Goal */}
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Icon name="dumbbell" size={16} style={styles.iconStyle} />
            <Text style={styles.goalLabel}>Workouts</Text>
          </View>
          <Text style={styles.goalProgressText}>3/5</Text>
        </View>
        <ProgressBar progress={3 / 5} style={styles.progressBar} />

        {/* Active Days Goal */}
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Icon name="calendar-check" size={16} style={styles.iconStyle} />
            <Text style={styles.goalLabel}>Active Days</Text>
          </View>
          <Text style={styles.goalProgressText}>3/4</Text>
        </View>
        <ProgressBar progress={3 / 4} style={styles.progressBar} />

        {/* Volume Goal */}
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Icon name="chart-bar" size={16} style={styles.iconStyle} />
            <Text style={styles.goalLabel}>Volume (lbs)</Text>
          </View>
          <Text style={styles.goalProgressText}>12,450/15,000</Text>
        </View>
        <ProgressBar progress={12450 / 15000} style={styles.progressBar} />
      </Card>

      {/* Personal Records Card */}
      <Card>
        <Text style={styles.cardTitle}>Personal Records</Text>
        <View style={styles.prItem}>
          <View>
            <Text style={styles.prExercise}>Bench Press</Text>
            <Text style={styles.prDate}>March 1, 2025</Text>
          </View>
          <Text style={styles.prWeight}>225 lbs</Text>
        </View>
        <View style={styles.prItem}>
          <View>
            <Text style={styles.prExercise}>Squat</Text>
            <Text style={styles.prDate}>February 15, 2025</Text>
          </View>
          <Text style={styles.prWeight}>315 lbs</Text>
        </View>
        <View style={[styles.prItem, styles.prItemLast]}>
          <View>
            <Text style={styles.prExercise}>Deadlift</Text>
            <Text style={styles.prDate}>February 22, 2025</Text>
          </View>
          <Text style={styles.prWeight}>365 lbs</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

export default ProfileStatsScreen;
