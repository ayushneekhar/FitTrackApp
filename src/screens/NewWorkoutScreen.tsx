// src/screens/NewWorkoutScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // For loading state
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import { getAllWorkoutTemplates, WorkoutTemplate } from "@/services/storage"; // Import storage functions and type
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

type Props = NativeStackScreenProps<RootStackParamList, "NewWorkout">;

const NewWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Templates ---
  const loadTemplates = useCallback(() => {
    setIsLoading(true);
    try {
      const fetchedTemplates = getAllWorkoutTemplates();
      // console.log("Fetched Templates:", fetchedTemplates); // For debugging
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error loading workout templates:", error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Use useFocusEffect to reload templates when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates])
  );

  // --- Navigation Handlers ---
  const startEmptyWorkout = () => {
    console.log("Starting empty workout...");
    navigation.navigate("ActiveWorkout", { template: null });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    console.log("Starting workout from template:", template.name);
    navigation.navigate("ActiveWorkout", { template: template });
  };

  const navigateToCreateWorkout = () => {
    navigation.navigate("CreateWorkout");
  };

  // --- Helper to format details ---
  const formatTemplateDetails = (template: WorkoutTemplate): string => {
    const exerciseCount = template.exercises?.length || 0;
    let details = `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`;
    if (template.durationEstimate) {
      details += ` • ~${template.durationEstimate} min`;
    }
    return details;
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      flexGrow: 1, // Ensure content can grow to fill space if needed
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20, // Add margin top for spacing
      marginBottom: 10, // Add margin bottom for spacing
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderCard: {
      alignItems: "center",
      paddingVertical: 20,
    },
    placeholderText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 15, // Space before button
    },
    createButton: {
      // Style similar to primary button but maybe outlined or different color
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
    },
    createButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
  });

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Loading Templates...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Start a Workout</Text>

      {/* Start Empty Workout Button */}
      <TouchableOpacity style={styles.button} onPress={startEmptyWorkout}>
        <Text style={styles.buttonText}>Start Empty Workout</Text>
      </TouchableOpacity>

      {/* Templates Section */}
      <Text style={[styles.title, { marginTop: 30 }]}>Or From Template</Text>
      {templates.length > 0 ? (
        <Card style={{ padding: 0, marginHorizontal: 0 }}>
          {/* Remove card padding if list items have their own */}
          {templates.map((template, index) => (
            <WorkoutListItem
              key={template.id} // Use unique template ID as key
              title={template.name}
              details={formatTemplateDetails(template)}
              actionText="Start"
              onPress={() => startFromTemplate(template)}
              iconName="clipboard-text-play-outline" // Updated icon
              style={{
                borderBottomWidth:
                  index === templates.length - 1 ? 0 : StyleSheet.hairlineWidth,
                paddingHorizontal: 16,
              }}
            />
          ))}
        </Card>
      ) : (
        // Placeholder when no templates exist
        <Card style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            You haven't created any workout templates yet.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={navigateToCreateWorkout}
          >
            <Text style={styles.createButtonText}>
              Create Your First Template
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    </ScrollView>
  );
};

export default NewWorkoutScreen;
