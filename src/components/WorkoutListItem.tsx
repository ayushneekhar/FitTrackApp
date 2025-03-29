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
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

interface WorkoutListItemProps {
  title: string;
  details: string;
  actionText?: string;
  onPress?: () => void;
  iconName?: React.ComponentProps<typeof Icon>["name"];
  style?: StyleProp<ViewStyle>;
  onEditPress?: () => void; // <-- New prop for edit action
  editIconName?: React.ComponentProps<typeof Icon>["name"]; // <-- Optional custom edit icon
}

const WorkoutListItem: React.FC<WorkoutListItemProps> = ({
  title,
  details,
  actionText,
  onPress,
  iconName,
  style,
  onEditPress, // <-- Destructure new prop
  editIconName = "pencil-outline", // <-- Default edit icon
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: 16, // Ensure horizontal padding is consistent
    },
    leftContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 10,
    },
    iconContainer: {
      marginRight: 12,
      width: 24,
      alignItems: "center",
    },
    infoContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 2,
    },
    details: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    // Container for right-side actions
    actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      // Keep padding for touch area, adjust as needed
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    actionText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
    },
    editButton: {
      marginLeft: 8, // Space between action text and edit icon
      padding: 6, // Touch area for edit icon
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, style]}
      activeOpacity={onPress ? 0.7 : 1.0}
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

      {/* Right side (Actions) */}
      <View style={styles.actionsContainer}>
        {/* Main Action (e.g., Start/View) */}
        {actionText && onPress && (
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}

        {/* Edit Action */}
        {onEditPress && (
          <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <Icon
              name={editIconName}
              size={20}
              color={colors.textSecondary} // Use secondary color for edit icon
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default WorkoutListItem;
