// src/screens/SettingsScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity, // Import TouchableOpacity
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Card from "@/components/Card";
import { WeightUnit } from "@/services/storage"; // Import WeightUnit
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  // Get preferences and setter from context
  const { colors, toggleTheme, isDarkMode, preferences, setDefaultWeightUnit } =
    useTheme();

  const handleUnitChange = (unit: WeightUnit) => {
    setDefaultWeightUnit(unit);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
      // Add border bottom for separation within the card
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0, // No border for the last row
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    // Styles for Unit Selection
    unitSelectorContainer: {
      flexDirection: "row",
    },
    unitButton: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    unitButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    unitButtonTextSelected: {
      color: colors.buttonText,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Card style={{ paddingHorizontal: 16 }}>
        {/* Dark Mode Setting */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card} // Or adjust thumb color
          />
        </View>

        {/* Default Weight Unit Setting */}
        <View style={[styles.settingRow, styles.settingRowLast]}>
          <Text style={styles.settingLabel}>Default Weight Unit</Text>
          <View style={styles.unitSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                preferences.defaultWeightUnit === "kg" &&
                  styles.unitButtonSelected,
              ]}
              onPress={() => handleUnitChange("kg")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  preferences.defaultWeightUnit === "kg" &&
                    styles.unitButtonTextSelected,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                preferences.defaultWeightUnit === "lbs" &&
                  styles.unitButtonSelected,
              ]}
              onPress={() => handleUnitChange("lbs")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  preferences.defaultWeightUnit === "lbs" &&
                    styles.unitButtonTextSelected,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Template Management Section */}
      <Card style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <TouchableOpacity
          style={[styles.settingRow, styles.settingRowLast]}
          onPress={() => navigation.navigate("TemplateManagement")}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon
              name="download-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={styles.settingLabel}>Template Management</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>
    </View>
  );
};

export default SettingsScreen;
