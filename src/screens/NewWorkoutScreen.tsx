// src/screens/NewWorkoutScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutListItem from "@/components/WorkoutListItem";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "NewWorkout">;

const NewWorkoutScreen: React.FC<Props> = ({ navigation }) => {
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
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: "bold",
    },
  });

  // Dummy data for templates
  const templates = [
    { id: "t1", name: "Quick Upper Body", exercises: 5 },
    { id: "t2", name: "Leg Burner", exercises: 7 },
  ];

  const startEmptyWorkout = () => {
    console.log("Starting empty workout...");
    // Navigate to active workout screen with no prefilled data
    // navigation.navigate('ActiveWorkout', { templateId: null });
  };

  const startFromTemplate = (templateName: string) => {
    console.log("Starting workout from template:", templateName);
    // Navigate to active workout screen with template data
    // navigation.navigate('ActiveWorkout', { templateId: templateId });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Start a Workout</Text>

      <TouchableOpacity style={styles.button} onPress={startEmptyWorkout}>
        <Text style={styles.buttonText}>Start Empty Workout</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { marginTop: 30 }]}>Or From Template</Text>

      {templates.length > 0 ? (
        <Card style={{ padding: 0 }}>
          {templates.map((template, index) => (
            <WorkoutListItem
              key={template.id}
              title={template.name}
              details={`${template.exercises} exercises`}
              actionText="Select"
              onPress={() => startFromTemplate(template.name)}
              iconName="clipboard-text-outline"
              style={{
                borderBottomWidth:
                  index === templates.length - 1 ? 0 : StyleSheet.hairlineWidth,
                paddingHorizontal: 16,
              }}
            />
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            No templates found. Create one in the Workouts tab!
          </Text>
        </Card>
      )}
    </ScrollView>
  );
};

export default NewWorkoutScreen;
