import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import WorkoutTypePicker from "@/components/WorkoutTypePicker";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { ColorPalette } from "@/theme/colors";

interface WorkoutDetailsFormProps {
  workoutName: string;
  workoutType: string | null;
  duration: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string | null) => void;
  onDurationChange: (duration: string) => void;
  workoutTypeOptions: string[];
}

export const WorkoutDetailsForm: React.FC<WorkoutDetailsFormProps> = ({
  workoutName,
  workoutType,
  duration,
  onNameChange,
  onTypeChange,
  onDurationChange,
  workoutTypeOptions,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Workout Details</Text>
      <Card style={{ marginHorizontal: 0, padding: 15 }}>
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.inputLabel}>Workout Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Upper Body Strength"
            placeholderTextColor={colors.textSecondary}
            value={workoutName}
            onChangeText={onNameChange}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Workout Type</Text>
            <WorkoutTypePicker
              options={workoutTypeOptions}
              selectedValue={workoutType}
              onValueChange={onTypeChange}
              placeholder="Select type"
            />
          </View>
          <View style={[styles.inputGroup, { marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Est. Duration (min)</Text>
            <View style={styles.durationInputContainer}>
              <TextInput
                style={styles.durationInput}
                placeholder="e.g., 60"
                placeholderTextColor={colors.textSecondary}
                value={duration}
                onChangeText={onDurationChange}
                keyboardType="numeric"
              />
              <Icon
                name="clock-outline"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      marginTop: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.card,
      color: colors.text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputGroup: {
      flex: 1,
    },
    durationInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingRight: 10,
    },
    durationInput: {
      flex: 1,
      color: colors.text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
    },
  });
