// src/navigation/ProfileTopTabNavigator.tsx
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import ProfileStatsScreen from "@/screens/Profile/ProfileStatsScreen";
import ProfileAchievementsScreen from "@/screens/Profile/ProfileAchievementsScreen";
import ProfileHistoryScreen from "@/screens/Profile/ProfileHistoryScreen";
import { useTheme } from "@/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ProfileTopTabParamList = {
  Stats: undefined;
  Achievements: undefined;
  History: undefined;
};

const Tab = createMaterialTopTabNavigator<ProfileTopTabParamList>();

const ProfileTopTabNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBarOptions={{
        // Note: tabBarOptions is deprecated in v6, use screenOptions
        activeTintColor: colors.tabActive,
        inactiveTintColor: colors.tabInactive,
        indicatorStyle: { backgroundColor: colors.tabActive },
        labelStyle: {
          fontSize: 14,
          textTransform: "capitalize",
          fontWeight: "500",
        },
        style: {
          backgroundColor: colors.card,
          paddingTop: insets.top, // Adjust based on where it's rendered
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
      }}
    >
      <Tab.Screen name="Stats" component={ProfileStatsScreen} />
      <Tab.Screen name="Achievements" component={ProfileAchievementsScreen} />
      <Tab.Screen name="History" component={ProfileHistoryScreen} />
    </Tab.Navigator>
  );
};

export default ProfileTopTabNavigator;
