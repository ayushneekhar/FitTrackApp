// src/screens/NewWorkoutScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import { getAllWorkoutTemplates, WorkoutTemplate } from "@/services/storage";
import { useFocusEffect } from "@react-navigation/native";
import { formatDuration } from "@/utils/formatters"; // Import formatter

type Props = NativeStackScreenProps<RootStackParamList, "NewWorkout">;

const NewWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Templates (remains the same) ---
  const loadTemplates = useCallback(() => {
    setIsLoading(true);
    try {
      const fetchedTemplates = getAllWorkoutTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error loading workout templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(loadTemplates);

  // --- Navigation Handlers ---
  const startEmptyWorkout = () => {
    navigation.navigate("ActiveWorkout", { template: null });
  };

  const startFromTemplate = (template: WorkoutTemplate) => {
    navigation.navigate("ActiveWorkout", { template: template });
  };

  const navigateToCreateWorkout = () => {
    navigation.navigate("CreateWorkout");
  };

  // --- NEW: Navigate to Edit Screen ---
  const navigateToEditWorkout = (templateId: string) => {
    console.log("Navigating to edit template:", templateId);
    navigation.navigate("EditWorkout", { templateId: templateId });
  };

  // --- Helper to format details (remains the same) ---
  const formatTemplateDetails = (template: WorkoutTemplate): string => {
    const exerciseCount = template.exercises?.length || 0;
    let details = `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`;
    if (template.durationEstimate) {
      details += ` • ~${template.durationEstimate} min`;
    }
    // Add type if available
    if (template.type) {
      details += ` • ${template.type}`;
    }
    return details;
  };

  // --- Styles (remain the same) ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      flexGrow: 1,
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
      marginTop: 20,
      marginBottom: 10,
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
      marginBottom: 15,
    },
    createButton: {
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

  // --- Render Loading State (remains the same) ---
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
          {templates.map((template, index) => (
            <WorkoutListItem
              key={template.id}
              title={template.name}
              details={formatTemplateDetails(template)}
              actionText="Start"
              onPress={() => startFromTemplate(template)}
              iconName="clipboard-text-play-outline"
              // --- Pass edit handler ---
              onEditPress={() => navigateToEditWorkout(template.id)}
              editIconName="pencil-outline" // Or your preferred icon
              // --- Style adjustments ---
              style={{
                borderBottomWidth:
                  index === templates.length - 1 ? 0 : StyleSheet.hairlineWidth,
                // paddingHorizontal is now handled within WorkoutListItem
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
