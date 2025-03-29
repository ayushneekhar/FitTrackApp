// src/screens/SettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Button, Switch } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Card from "@/components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, toggleTheme, isDarkMode, setScheme } = useTheme();

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
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Card>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
        </View>
        {/* Add more settings rows here */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Account</Text>
          {/* Add navigation or action */}
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          {/* Add navigation or action */}
        </View>
      </Card>

      {/* Example buttons to force theme */}
      {/* <Button title="Set Light" onPress={() => setScheme('light')} />
      <Button title="Set Dark" onPress={() => setScheme('dark')} /> */}
    </View>
  );
};

export default SettingsScreen;
