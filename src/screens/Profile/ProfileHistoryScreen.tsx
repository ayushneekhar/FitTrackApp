// src/screens/Profile/ProfileHistoryScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
// Import navigation types if needed

const ProfileHistoryScreen: React.FC = () => {
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

  // Dummy data
  const history = [
    { id: "h1", name: "Upper Body", date: "Yesterday", duration: "45 min" },
    { id: "h2", name: "Leg Day", date: "3 days ago", duration: "60 min" },
    { id: "h3", name: "Full Body", date: "5 days ago", duration: "75 min" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Workout History</Text>
      {history.length > 0 ? (
        <Card style={{ padding: 0 }}>
          {history.map((item, index) => (
            <WorkoutListItem
              key={item.id}
              title={item.name}
              details={`${item.date} • ${item.duration}`}
              actionText="View"
              onPress={() => console.log("View history item:", item.name)}
              iconName="history"
              style={{
                borderBottomWidth:
                  index === history.length - 1 ? 0 : StyleSheet.hairlineWidth,
                paddingHorizontal: 16,
              }}
            />
          ))}
        </Card>
      ) : (
        <Text style={styles.placeholderText}>No workout history yet.</Text>
      )}
    </ScrollView>
  );
};

export default ProfileHistoryScreen;
