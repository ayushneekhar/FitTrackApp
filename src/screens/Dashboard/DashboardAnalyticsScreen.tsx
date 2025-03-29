// src/screens/Dashboard/DashboardAnalyticsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
// Import navigation types if needed for actions within this screen
// import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
// import { DashboardTopTabParamList } from '@/navigation/DashboardTopTabNavigator';

// type Props = MaterialTopTabScreenProps<DashboardTopTabParamList, 'Analytics'>;

// const DashboardAnalyticsScreen: React.FC<Props> = ({ navigation }) => {
const DashboardAnalyticsScreen: React.FC = () => {
  // Use React.FC if no props needed
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    chartPlaceholder: {
      height: 200,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card, // Use card color for placeholder bg
      opacity: 0.6, // Make placeholder slightly transparent
    },
    placeholderText: {
      color: colors.textSecondary,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingVertical: 8 }}
    >
      <Card>
        <Text style={styles.title}>Progress Charts</Text>
        <Text style={styles.subtitle}>Track your performance over time</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>
            Progress charts will appear here
          </Text>
        </View>
      </Card>
      {/* Add more analytic cards/charts here */}
      <Card>
        <Text style={styles.title}>Volume Analysis</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>
            Volume charts will appear here
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

export default DashboardAnalyticsScreen;
