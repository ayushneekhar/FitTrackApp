// src/components/WorkoutListItem.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Icon from "@expo/vector-icons/MaterialCommunityIcons"; // Example icon

interface WorkoutListItemProps {
  title: string;
  details: string;
  actionText?: string;
  onPress?: () => void;
  iconName?: React.ComponentProps<typeof Icon>["name"]; // Optional icon
  style?: StyleProp<ViewStyle>;
}

const WorkoutListItem: React.FC<WorkoutListItemProps> = ({
  title,
  details,
  actionText,
  onPress,
  iconName,
  style,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14, // Increased padding
      borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
      borderBottomColor: colors.border,
    },
    leftContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1, // Allow text to wrap if needed
      marginRight: 10,
    },
    iconContainer: {
      marginRight: 12,
      width: 24, // Fixed width for alignment
      alignItems: "center",
    },
    infoContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "500", // Medium weight
      color: colors.text,
      marginBottom: 2, // Spacing between title and details
    },
    details: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionText: {
      fontSize: 14,
      color: colors.primary, // Use primary theme color for action
      fontWeight: "500",
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, style]}
    >
      <View style={styles.leftContainer}>
        {iconName && (
          <View style={styles.iconContainer}>
            <Icon name={iconName} size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.details}>{details}</Text>
        </View>
      </View>
      {actionText && onPress && (
        // Use TouchableOpacity for the action text if it's interactive
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default WorkoutListItem;
