import React, {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  // Remove Modal, ScrollView, FlatList
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import Checkbox from "expo-checkbox";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";

export interface Exercise {
  id: string;
  name: string;
  category: Categories;
  type: string;
}

export const enum Categories {
  Chest = "Chest",
  Back = "Back",
  Legs = "Legs",
  Shoulders = "Shoulders",
  Arms = "Arms",
  Core = "Core",
  Cardio = "Cardio",
  Other = "Other",
}

// Update Props: remove 'visible', ref is handled by forwardRef
interface AddExerciseModalProps {
  onClose: () => void; // Called when the sheet is dismissed
  onAddExercises: (selectedExercises: Exercise[]) => void;
  allExercises: Exercise[];
}

// Use forwardRef to pass the ref from the parent
const AddExerciseModal = forwardRef<BottomSheetModal, AddExerciseModalProps>(
  ({ onClose, onAddExercises, allExercises }, ref) => {
    const { colors } = useTheme();
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>(
      Categories.Chest
    );
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
      new Set()
    );

    // Define snap points for the bottom sheet
    const snapPoints = useMemo(() => ["85%"], []); // Adjust as needed, e.g., ['50%', '85%']

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

    // --- Internal dismiss function ---
    const handleDismiss = () => {
      if (typeof ref === "function" || !ref?.current) return;
      ref.current.dismiss();
    };

    // --- Modified handleClose to dismiss sheet ---
    const handleClose = () => {
      handleDismiss(); // Dismiss the sheet first
      // State reset will happen via onDismiss -> onClose prop
    };

    // --- Modified handleAddSelected to dismiss sheet ---
    const handleAddSelected = () => {
      const selected: Exercise[] = [];
      selectedExerciseIds.forEach(id => {
        const exercise = allExercises.find(ex => ex.id === id);
        if (exercise) {
          selected.push(exercise);
        }
      });
      onAddExercises(selected);
      handleDismiss();
    };

    // --- Callback when the sheet is fully dismissed ---
    const handleSheetDismiss = useCallback(() => {
      console.log("Bottom sheet dismissed");
      // Reset state when dismissed
      setSearchText("");
      setSelectedCategory(Categories.Chest);
      setSelectedExerciseIds(new Set());
      onClose?.(); // Call the parent's onClose handler
    }, [onClose]);

    // --- Render Exercise Item (remains the same logic) ---
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

    // --- Render Backdrop ---
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1} // Disappears when closed
          appearsOnIndex={0} // Appears when open
          opacity={0.5} // Adjust opacity
          pressBehavior="close" // Close on press
        />
      ),
      []
    );

    const styles = getStyles(colors);

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing={false}
        snapPoints={snapPoints}
        maxDynamicContentSize={Dimensions.get("window").height * 0.8}
        onChange={index => console.log("Sheet index changed:", index)}
        onDismiss={handleSheetDismiss}
        enablePanDownToClose={false}
        android_keyboardInputMode="adjustResize"
        enableBlurKeyboardOnGesture
        enableHandlePanningGesture
        keyboardBehavior="interactive"
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
        backgroundStyle={{ backgroundColor: colors.card }}
      >
        <BottomSheetScrollView
          stickyHeaderIndices={[2]}
          style={styles.contentContainer}
        >
          <BottomSheetView style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercises</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </BottomSheetView>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.textSecondary} />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              onChangeText={setSearchText}
            />
          </View>

          {/* Categories - Use BottomSheetScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView} // Container style
            contentContainerStyle={{ paddingRight: 20 }} // Ensure last item padding
          >
            {(Object.keys(Categories) as Array<keyof typeof Categories>).map(
              cat => (
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
              )
            )}
          </ScrollView>

          {/* Exercise List - Use BottomSheetFlatList */}
          <BottomSheetFlatList
            scrollEnabled={false}
            data={filteredExercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.id}
            style={styles.exerciseList} // Style for the list container
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                No exercises found for "{selectedCategory}"
                {searchText ? ` matching "${searchText}"` : ""}.
              </Text>
            }
          />

          {/* Footer */}
        </BottomSheetScrollView>
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
            disabled={selectedExerciseIds.size === 0}
          >
            <Text style={[styles.buttonText, styles.addButtonText]}>
              Add Selected ({selectedExerciseIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    );
  }
);

export default AddExerciseModal;

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1, // Make content take full height within the sheet
      backgroundColor: colors.card,
      paddingHorizontal: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    categoryScrollView: {
      backgroundColor: colors.background,
      paddingVertical: 8,
    },
    categoryButton: {
      marginRight: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 24,
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
      flex: 1, // Allow list to take remaining space
      // Remove maxHeight, sheet controls height
    },
    exerciseItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    checkbox: {
      marginRight: 16,
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
      marginVertical: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    footerButton: {
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
      alignItems: "center",
      flex: 1,
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
    emptyListText: {
      textAlign: "center",
      color: colors.textSecondary,
      padding: 20,
    },
  });
