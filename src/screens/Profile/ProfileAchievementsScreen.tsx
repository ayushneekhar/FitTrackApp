// src/screens/Profile/ProfileAchievementsScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
// Import navigation types if needed

const ProfileAchievementsScreen: React.FC = () => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const cardMargin = 8;
  const cardWidth = screenWidth / 2 - cardMargin * 2; // Calculate width for 2 columns

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: cardMargin, // Use margin for outer padding
    },
    title: {
      fontSize: 18, // Adjusted size to match screenshot
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
      paddingHorizontal: cardMargin, // Add horizontal padding to title
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      paddingHorizontal: cardMargin, // Add horizontal padding to subtitle
    },
    // Styles for the achievement card in the grid
    achievementCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 15,
      margin: cardMargin, // Margin around each card
      width: cardWidth,
      alignItems: "center", // Center content
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      marginBottom: 12,
      // Optional: Add background or border to icon container
      // width: 50,
      // height: 50,
      // borderRadius: 25,
      // backgroundColor: colors.background,
      // justifyContent: 'center',
      // alignItems: 'center',
    },
    icon: {
      color: colors.textSecondary, // Icon color matches screenshot
    },
    achievementTitle: {
      fontSize: 15, // Slightly smaller title
      fontWeight: "bold", // Bold title
      color: colors.text,
      textAlign: "center",
      marginBottom: 4,
    },
    achievementDesc: {
      fontSize: 13, // Slightly smaller description
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18, // Improve readability
    },
  });

  // Dummy data matching the new screenshot
  const achievements = [
    {
      id: "1",
      title: "Consistency King",
      desc: "Completed 10 workouts in a row",
      icon: "crown-outline", // Example icon
    },
    {
      id: "2",
      title: "Heavy Lifter",
      desc: "Lifted 10,000+ lbs in a single workout",
      icon: "dumbbell",
    },
    {
      id: "3",
      title: "Early Adopter",
      desc: "One of the first 100 users",
      icon: "account-star-outline",
    },
    {
      id: "4",
      title: "90 Day Challenge",
      desc: "Workout for 90 consecutive days",
      icon: "calendar-check-outline",
    },
    {
      id: "5",
      title: "Million Club",
      desc: "Lift a total of 1,000,000 lbs",
      icon: "chart-bar",
    },
    // Add more achievements...
  ];

  const renderAchievementItem = ({
    item,
  }: {
    item: (typeof achievements)[0];
  }) => (
    <View style={styles.achievementCard}>
      <View style={styles.iconContainer}>
        <Icon name={item.icon as any} size={36} style={styles.icon} />
      </View>
      <Text style={styles.achievementTitle}>{item.title}</Text>
      <Text style={styles.achievementDesc}>{item.desc}</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={achievements}
      renderItem={renderAchievementItem}
      keyExtractor={item => item.id}
      numColumns={2} // Key for grid layout
      ListHeaderComponent={
        // Add title/subtitle as header
        <>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>
            Badges and milestones you've earned
          </Text>
        </>
      }
    />
  );
};

export default ProfileAchievementsScreen;
