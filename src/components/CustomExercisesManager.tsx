import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import { useExercises } from "@/hooks/useExercises";
import { CustomExercise } from "@/services/storage";

interface CustomExercisesManagerProps {
  onClose?: () => void;
}

const CustomExercisesManager: React.FC<CustomExercisesManagerProps> = ({
  onClose,
}) => {
  const { colors } = useTheme();
  const { customExercises, deleteCustomExercise } = useExercises();

  const handleDeleteExercise = useCallback(
    (exercise: CustomExercise) => {
      Alert.alert(
        "Delete Custom Exercise",
        `Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteCustomExercise(exercise.id),
          },
        ]
      );
    },
    [deleteCustomExercise]
  );

  const renderExerciseItem = ({ item }: { item: CustomExercise }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetails}>
          {item.category} • {item.type}
        </Text>
        <Text style={styles.exerciseDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExercise(item)}
      >
        <Icon name="delete" size={20} color={colors.destructive || "#ff4444"} />
      </TouchableOpacity>
    </View>
  );

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Custom Exercises</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {customExercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="dumbbell" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Custom Exercises</Text>
          <Text style={styles.emptySubtitle}>
            Create your first custom exercise using the "Create Custom Exercise"
            button.
          </Text>
        </View>
      ) : (
        <FlatList
          data={customExercises}
          renderItem={renderExerciseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    listContent: {
      padding: 16,
    },
    exerciseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseContent: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    exerciseDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    exerciseDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    deleteButton: {
      padding: 8,
      marginLeft: 16,
    },
    separator: {
      height: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });

export default CustomExercisesManager;
