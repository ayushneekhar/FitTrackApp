// src/theme/colors.ts

// Define interfaces for your color palettes
export interface ColorPalette {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  tabActive: string;
  tabInactive: string;
  progressBarBackground: string;
  progressBarFill: string;
  buttonText: string; // Added for button text color
  destructive: string; // Example for delete actions
  // Add other colors as needed
}

export const lightColors: ColorPalette = {
  primary: "#1F1F1F", // Dark color for primary elements in light mode
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  border: "#EEEEEE",
  tabActive: "#1F1F1F",
  tabInactive: "#CCCCCC",
  progressBarBackground: "#E0E0E0",
  progressBarFill: "#1F1F1F",
  buttonText: "#FFFFFF",
  destructive: "#FF3B30",
};

export const darkColors: ColorPalette = {
  primary: "#3498db", // Example: A brighter primary for dark mode
  background: "#121212", // Common dark background
  card: "#1E1E1E", // Slightly lighter card background
  text: "#EAEAEA", // Light text for dark background
  textSecondary: "#A0A0A0",
  border: "#2C2C2C",
  tabActive: "#3498db", // Match primary or use white
  tabInactive: "#777777",
  progressBarBackground: "#333333",
  progressBarFill: "#3498db",
  buttonText: "#121212", // Dark text on bright primary button
  destructive: "#FF453A",
};

// Combine palettes for easy access if needed, though context is preferred
export const palettes = {
  light: lightColors,
  dark: darkColors,
};
