// src/navigation/DashboardTopTabNavigator.tsx
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import DashboardOverviewScreen from "@/screens/Dashboard/DashboardOverviewScreen";
import DashboardAnalyticsScreen from "@/screens/Dashboard/DashboardAnalyticsScreen";
import DashboardWorkoutsScreen from "@/screens/Dashboard/DashboardWorkoutsScreen";
import { useTheme } from "@/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Define ParamList if these screens need params
export type DashboardTopTabParamList = {
  Overview: undefined;
  Analytics: undefined;
  Workouts: undefined;
};

const Tab = createMaterialTopTabNavigator<DashboardTopTabParamList>();

const DashboardTopTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarIndicatorStyle: { backgroundColor: colors.tabActive },
        tabBarLabelStyle: {
          fontSize: 14,
          textTransform: "capitalize",
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: colors.card, // Use card color for tab bar bg
          shadowColor: "#000", // Optional: add shadow
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
      }}
    >
      <Tab.Screen name="Overview" component={DashboardOverviewScreen} />
      <Tab.Screen name="Analytics" component={DashboardAnalyticsScreen} />
      <Tab.Screen name="Workouts" component={DashboardWorkoutsScreen} />
    </Tab.Navigator>
  );
};

export default DashboardTopTabNavigator;
