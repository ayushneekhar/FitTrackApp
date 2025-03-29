// src/screens/HistoryScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
// Import navigation types if needed
// import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
// import { BottomTabParamList } from '@/navigation/BottomTabNavigator';

// type Props = BottomTabScreenProps<BottomTabParamList, 'HistoryTab'>;

const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingTop: 40, // Add padding if no header/top tab bar
    },
    title: {
      fontSize: 24, // Larger title for main screen
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 50,
    },
  });

  // Dummy data - same as profile history for example
  const history = [
    { id: "h1", name: "Upper Body", date: "Yesterday", duration: "45 min" },
    { id: "h2", name: "Leg Day", date: "3 days ago", duration: "60 min" },
    { id: "h3", name: "Full Body", date: "5 days ago", duration: "75 min" },
    {
      id: "h4",
      name: "Cardio Express",
      date: "Last Monday",
      duration: "30 min",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Completed Workouts</Text>
      {history.length > 0 ? (
        <Card style={{ padding: 0 }}>
          {history.map((item, index) => (
            <WorkoutListItem
              key={item.id}
              title={item.name}
              details={`${item.date} • ${item.duration}`}
              actionText="View"
              onPress={() => console.log("View history item:", item.name)}
              iconName="check-circle-outline" // Different icon maybe
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
