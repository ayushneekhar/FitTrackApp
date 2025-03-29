// src/components/WorkoutTypePicker.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback, // To close modal on outside tap
  ViewStyle,
  StyleProp,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";

interface WorkoutTypePickerProps {
  options: string[];
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>; // Style for the main trigger container
}

const WorkoutTypePicker: React.FC<WorkoutTypePickerProps> = ({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select type",
  style,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item: string) => {
    onValueChange(item);
    setModalVisible(false);
  };

  const styles = StyleSheet.create({
    // Styles for the main trigger button
    triggerContainer: {
      backgroundColor: colors.card,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 48, // Ensure consistent height
    },
    triggerText: {
      fontSize: 16,
      color: colors.text,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    iconStyle: {
      color: colors.textSecondary,
    },
    // Styles for the Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)", // Semi-transparent background
      justifyContent: "center", // Center vertically
      alignItems: "center", // Center horizontally
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 0, // Remove padding, items will have it
      width: "80%", // Adjust width as needed
      maxHeight: "60%", // Limit height
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    optionItem: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    optionItemLast: {
      borderBottomWidth: 0,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.primary, // Highlight selected option
      fontWeight: "bold",
    },
  });

  const renderOption = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        index === options.length - 1 && styles.optionItemLast, // No border on last item
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text
        style={[
          styles.optionText,
          item === selectedValue && styles.optionTextSelected, // Style if selected
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.triggerContainer, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={selectedValue ? styles.triggerText : styles.placeholderText}
        >
          {selectedValue ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={20} style={styles.iconStyle} />
      </TouchableOpacity>

      {/* Modal for Options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* Prevent closing when tapping inside the content */}
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <FlatList
                  data={options}
                  renderItem={renderOption}
                  keyExtractor={item => item}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default WorkoutTypePicker;
