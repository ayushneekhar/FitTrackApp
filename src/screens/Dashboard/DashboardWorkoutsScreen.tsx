// src/screens/Dashboard/DashboardWorkoutsScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import {
  getAllWorkoutTemplates,
  WorkoutTemplate,
  getLastUsedTimestamps, // <-- Import function to get timestamps
} from "@/services/storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatRelativeDate } from "@/utils/formatters"; // <-- Import formatter

// Import navigation types if needed
// import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
// import { DashboardTopTabParamList } from '@/navigation/DashboardTopTabNavigator';

// type Props = MaterialTopTabScreenProps<DashboardTopTabParamList, 'Workouts'>;

const DashboardWorkoutsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>(); // Use any for simplicity or define specific type
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [lastUsedTimestamps, setLastUsedTimestamps] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // --- Load Data ---
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const fetchedTemplates = getAllWorkoutTemplates();
      const fetchedTimestamps = getLastUsedTimestamps();
      setTemplates(fetchedTemplates);
      setLastUsedTimestamps(fetchedTimestamps);
    } catch (error) {
      console.error("Error loading workout screen data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload data when the screen comes into focus
  useFocusEffect(loadData);

  // --- Format Details String ---
  const formatTemplateDetails = (
    template: WorkoutTemplate,
    timestamp?: number
  ): string => {
    const exerciseCount = template.exercises?.length || 0;
    let details = `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`;
    if (template.type) {
      details += ` • ${template.type}`;
    }
    if (timestamp) {
      details += ` • Last used: ${formatRelativeDate(timestamp)}`; // Add last used date
    } else {
      details += ` • Never used`;
    }
    return details;
  };

  // --- Navigation Handlers ---
  const startFromTemplate = (template: WorkoutTemplate) => {
    // Need to save timestamp here too if starting from this screen
    // saveLastUsedTimestamp(template.id, Date.now()); // Consider if needed
    navigation.navigate("ActiveWorkout", { template: template });
  };

  const navigateToEditWorkout = (templateId: string) => {
    navigation.navigate("EditWorkout", { templateId: templateId });
  };

  const navigateToCreateWorkout = () => {
    navigation.navigate("CreateWorkout");
  };

  const navigateToTemplateManagement = () => {
    navigation.navigate("TemplateManagement");
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingVertical: 8, // Add padding for scrollview content
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      paddingHorizontal: 20,
    },
    createButton: {
      marginTop: 16,
      marginHorizontal: 16,
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
    actionRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 16,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
    },
    actionButtonSecondary: {
      borderColor: colors.textSecondary,
    },
    actionButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    actionButtonTextSecondary: {
      color: colors.textSecondary,
    },
  });

  // --- Render Loading ---
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.createButton}
        onPress={navigateToCreateWorkout}
      >
        <Text style={styles.createButtonText}>Create New Template</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={navigateToTemplateManagement}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextSecondary]}
          >
            Import/Export
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {templates.length > 0 ? (
          <Card style={{ padding: 0, marginHorizontal: 16 }}>
            {templates.map((template, index) => {
              const lastUsed = lastUsedTimestamps[template.id];
              return (
                <WorkoutListItem
                  key={template.id}
                  title={template.name}
                  details={formatTemplateDetails(template, lastUsed)}
                  actionText="Start"
                  onPress={() => startFromTemplate(template)}
                  iconName="clipboard-play-outline"
                  onEditPress={() => navigateToEditWorkout(template.id)}
                  editIconName="pencil-outline"
                  style={{
                    borderBottomWidth:
                      index === templates.length - 1
                        ? 0
                        : StyleSheet.hairlineWidth,
                    paddingHorizontal: 16,
                  }}
                />
              );
            })}
          </Card>
        ) : (
          <Text style={styles.placeholderText}>
            You haven't created any workout templates yet!
          </Text>
        )}
      </ScrollView>
    </>
  );
};

export default DashboardWorkoutsScreen;
