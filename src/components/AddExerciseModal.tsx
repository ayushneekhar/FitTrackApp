// src/components/AddExerciseModal.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import Checkbox from "expo-checkbox"; // Assuming expo-checkbox is installed or use a custom one

// Define the structure of an exercise
export interface Exercise {
  id: string;
  name: string;
  category: string; // e.g., 'Chest', 'Back', 'Legs'
  type: string; // e.g., 'Barbell', 'Dumbbell', 'Bodyweight'
}

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises: (selectedExercises: Exercise[]) => void;
  allExercises: Exercise[]; // Pass the full list of available exercises
}

const categories = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Cardio",
  "Other", // Add more as needed
];

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  visible,
  onClose,
  onAddExercises,
  allExercises,
}) => {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories[0]
  );
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set()
  );

  const filteredExercises = useMemo(() => {
    return allExercises.filter(
      ex =>
        ex.category === selectedCategory &&
        ex.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [allExercises, selectedCategory, searchText]);

  const toggleExerciseSelection = (id: string) => {
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    const selected = allExercises.filter(ex => selectedExerciseIds.has(ex.id));
    onAddExercises(selected);
    handleClose(); // Close modal after adding
  };

  const handleClose = () => {
    // Reset state on close
    setSearchText("");
    setSelectedCategory(categories[0]);
    setSelectedExerciseIds(new Set());
    onClose();
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => toggleExerciseSelection(item.id)}
      activeOpacity={0.7}
    >
      <Checkbox
        style={styles.checkbox}
        value={selectedExerciseIds.has(item.id)}
        onValueChange={() => toggleExerciseSelection(item.id)}
        color={
          selectedExerciseIds.has(item.id)
            ? colors.primary
            : colors.textSecondary
        }
      />
      <View style={styles.exerciseTextContainer}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetail}>
          {item.type} • {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30, // Extra padding at bottom
      maxHeight: Dimensions.get("window").height * 0.8, // Limit height
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 5,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background, // Slightly different bg for input
      borderRadius: 8,
      paddingHorizontal: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    categoryScrollView: {
      marginBottom: 15,
    },
    categoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginRight: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    categoryTextSelected: {
      color: colors.buttonText,
      fontWeight: "bold",
    },
    exerciseList: {
      // Max height for the list itself if needed
      // maxHeight: Dimensions.get('window').height * 0.4,
    },
    exerciseItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    checkbox: {
      marginRight: 15,
      width: 20,
      height: 20,
      borderRadius: 4,
    },
    exerciseTextContainer: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    exerciseDetail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    footerButton: {
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
      alignItems: "center",
      flex: 1, // Make buttons take equal space
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
    },
    addButton: {
      backgroundColor: colors.primary,
      marginLeft: 10,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    cancelButtonText: {
      color: colors.text,
    },
    addButtonText: {
      color: colors.buttonText,
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercises</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat && styles.categoryButtonSelected,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.id}
            style={styles.exerciseList}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  color: colors.textSecondary,
                  padding: 20,
                }}
              >
                No exercises found for "{selectedCategory}"
                {searchText ? ` matching "${searchText}"` : ""}.
              </Text>
            }
          />

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.addButton]}
              onPress={handleAddSelected}
              disabled={selectedExerciseIds.size === 0} // Disable if none selected
            >
              <Text style={[styles.buttonText, styles.addButtonText]}>
                Add Selected ({selectedExerciseIds.size})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddExerciseModal;
