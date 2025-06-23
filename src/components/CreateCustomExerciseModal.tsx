import React, { useState, useMemo, useCallback, forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import { Categories } from "@/components/AddExerciseModal";

import { CustomExercise } from "@/services/storage";

interface CreateCustomExerciseModalProps {
  onClose: () => void;
  onCreateExercise: (
    exercise: Omit<CustomExercise, "id" | "isCustom" | "createdAt">
  ) => void;
}

const exerciseTypes = [
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Plate",
  "Equipment",
  "Activity",
  "Other",
];

const CreateCustomExerciseModal = forwardRef<
  BottomSheetModal,
  CreateCustomExerciseModalProps
>(({ onClose, onCreateExercise }, ref) => {
  const { colors } = useTheme();
  const [exerciseName, setExerciseName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Categories>(
    Categories.Other
  );
  const [selectedType, setSelectedType] = useState("Other");

  const snapPoints = useMemo(() => ["75%"], []);

  const validateForm = useCallback(() => {
    if (!exerciseName.trim()) {
      Alert.alert("Validation Error", "Please enter an exercise name.");
      return false;
    }
    return true;
  }, [exerciseName]);

  const handleCreate = useCallback(() => {
    if (!validateForm()) return;

    const newExercise = {
      name: exerciseName.trim(),
      category: selectedCategory,
      type: selectedType,
    };

    onCreateExercise(newExercise);

    // Reset form
    setExerciseName("");
    setSelectedCategory(Categories.Other);
    setSelectedType("Other");

    // Close modal
    if (typeof ref === "function" || !ref?.current) return;
    ref.current.dismiss();
  }, [
    exerciseName,
    selectedCategory,
    selectedType,
    onCreateExercise,
    validateForm,
    ref,
  ]);

  const handleClose = useCallback(() => {
    if (typeof ref === "function" || !ref?.current) return;
    ref.current.dismiss();
  }, [ref]);

  const handleSheetDismiss = useCallback(() => {
    // Reset form when dismissed
    setExerciseName("");
    setSelectedCategory(Categories.Other);
    setSelectedType("Other");
    onClose?.();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const styles = getStyles(colors);

  const categories = Object.values(Categories);

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={false}
      snapPoints={snapPoints}
      maxDynamicContentSize={Dimensions.get("window").height * 0.8}
      onDismiss={handleSheetDismiss}
      enablePanDownToClose={false}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetScrollView style={styles.container}>
        <BottomSheetView style={styles.header}>
          <Text style={styles.title}>Create Custom Exercise</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </BottomSheetView>

        <BottomSheetView style={styles.content}>
          {/* Exercise Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise Name *</Text>
            <BottomSheetTextInput
              style={styles.textInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="Enter exercise name..."
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.optionsGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.optionButton,
                    selectedCategory === category &&
                      styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCategory === category &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Type</Text>
            <View style={styles.optionsGrid}>
              {exerciseTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    selectedType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              !exerciseName.trim() && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!exerciseName.trim()}
          >
            <Icon
              name="plus"
              size={20}
              color={
                !exerciseName.trim() ? colors.textSecondary : colors.surface
              }
            />
            <Text
              style={[
                styles.createButtonText,
                !exerciseName.trim() && styles.createButtonTextDisabled,
              ]}
            >
              Create Exercise
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
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
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.surface,
      fontWeight: "500",
    },
    createButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      marginTop: 20,
      gap: 8,
    },
    createButtonDisabled: {
      backgroundColor: colors.border,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.surface,
    },
    createButtonTextDisabled: {
      color: colors.textSecondary,
    },
  });

export default CreateCustomExerciseModal;
