import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import Card from "@/components/Card";
import {
  getAllWorkoutTemplates,
  exportWorkoutTemplates,
  exportSelectedWorkoutTemplates,
  importWorkoutTemplates,
  WorkoutTemplate,
} from "@/services/storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "TemplateManagement">;

interface TemplateItem extends WorkoutTemplate {
  selected: boolean;
}

const TemplateManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Load templates when screen focuses
  const loadTemplates = useCallback(() => {
    const allTemplates = getAllWorkoutTemplates();
    const templatesWithSelection = allTemplates.map(template => ({
      ...template,
      selected: false,
    }));
    setTemplates(templatesWithSelection);
  }, []);

  useFocusEffect(loadTemplates);

  // Toggle template selection
  const toggleTemplateSelection = (templateId: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, selected: !template.selected }
          : template
      )
    );
  };

  // Toggle all templates selection
  const toggleAllSelection = () => {
    const allSelected = templates.every(t => t.selected);
    setTemplates(prev =>
      prev.map(template => ({ ...template, selected: !allSelected }))
    );
  };

  // Exit select mode
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setTemplates(prev =>
      prev.map(template => ({ ...template, selected: false }))
    );
  };

  // Export all templates
  const exportAllTemplates = async () => {
    if (templates.length === 0) {
      Alert.alert("No Templates", "You don't have any templates to export.");
      return;
    }

    try {
      setIsLoading(true);
      const exportData = exportWorkoutTemplates();
      const fileName = `workout-templates-${new Date().toISOString().split("T")[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, exportData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Export Workout Templates",
        });
      } else {
        Alert.alert("Export Complete", `Templates exported to: ${fileName}`);
      }
    } catch (error) {
      Alert.alert(
        "Export Error",
        "Failed to export templates. Please try again."
      );
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Export selected templates
  const exportSelectedTemplates = async () => {
    const selectedTemplates = templates.filter(t => t.selected);

    if (selectedTemplates.length === 0) {
      Alert.alert(
        "No Selection",
        "Please select at least one template to export."
      );
      return;
    }

    try {
      setIsLoading(true);
      const selectedIds = selectedTemplates.map(t => t.id);
      const exportData = exportSelectedWorkoutTemplates(selectedIds);
      const fileName = `selected-templates-${new Date().toISOString().split("T")[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, exportData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Export Selected Templates",
        });
      } else {
        Alert.alert(
          "Export Complete",
          `${selectedTemplates.length} template(s) exported to: ${fileName}`
        );
      }

      exitSelectMode();
    } catch (error) {
      Alert.alert(
        "Export Error",
        "Failed to export selected templates. Please try again."
      );
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Import templates
  const importTemplates = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(
        result.assets[0].uri
      );

      // Show import options
      Alert.alert("Import Options", "How would you like to handle conflicts?", [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsLoading(false),
        },
        {
          text: "Replace Existing",
          onPress: () =>
            performImport(fileContent, { overwriteExisting: true }),
        },
        {
          text: "Keep Both",
          onPress: () => performImport(fileContent, { generateNewIds: true }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Import Error",
        "Failed to read the selected file. Please try again."
      );
      console.error("Import error:", error);
      setIsLoading(false);
    }
  };

  // Perform the actual import
  const performImport = async (
    fileContent: string,
    options: { overwriteExisting?: boolean; generateNewIds?: boolean }
  ) => {
    try {
      const result = importWorkoutTemplates(fileContent, options);

      if (result.success) {
        let message = `Successfully imported ${result.imported} template(s).`;
        if (result.skipped > 0) {
          message += `\n${result.skipped} template(s) were skipped.`;
        }
        if (result.errors.length > 0) {
          message += `\n\nWarnings:\n${result.errors.join("\n")}`;
        }

        Alert.alert("Import Complete", message, [
          {
            text: "OK",
            onPress: () => {
              loadTemplates(); // Refresh the template list
            },
          },
        ]);
      } else {
        Alert.alert(
          "Import Failed",
          `Import failed:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      Alert.alert(
        "Import Error",
        "An unexpected error occurred during import."
      );
      console.error("Import processing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format template details
  const formatTemplateDetails = (template: WorkoutTemplate): string => {
    const exerciseCount = template.exercises?.length || 0;
    let details = `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}`;
    if (template.type) {
      details += ` • ${template.type}`;
    }
    if (template.durationEstimate) {
      details += ` • ~${template.durationEstimate} min`;
    }
    return details;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    actionCard: {
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
    },
    actionButtonSecondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionIcon: {
      marginRight: 12,
    },
    actionText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    actionTextPrimary: {
      color: colors.buttonText,
    },
    actionTextSecondary: {
      color: colors.primary,
    },
    templatesSection: {
      marginTop: 24,
    },
    selectModeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    selectModeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectModeButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    templateItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    templateInfo: {
      flex: 1,
    },
    templateName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    templateDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: 32,
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    bottomActions: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: "row",
      gap: 12,
    },
    bottomActionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    bottomActionButtonSecondary: {
      backgroundColor: colors.destructive,
    },
    bottomActionText: {
      color: colors.buttonText,
      fontWeight: "600",
      marginLeft: 8,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Processing...
        </Text>
      </View>
    );
  }

  const selectedCount = templates.filter(t => t.selected).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>Template Management</Text>

        {/* Action Buttons */}
        <Card style={styles.actionCard}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={importTemplates}
          >
            <Icon
              name="import"
              size={24}
              color={colors.buttonText}
              style={styles.actionIcon}
            />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>
              Import Templates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={exportAllTemplates}
            disabled={templates.length === 0}
          >
            <Icon
              name="export"
              size={24}
              color={colors.primary}
              style={styles.actionIcon}
            />
            <Text style={[styles.actionText, styles.actionTextSecondary]}>
              Export All Templates ({templates.length})
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Templates Section */}
        {templates.length > 0 && (
          <View style={styles.templatesSection}>
            <View style={styles.selectModeHeader}>
              <Text style={styles.sectionTitle}>Your Templates</Text>
              {!isSelectMode ? (
                <TouchableOpacity
                  style={styles.selectModeButton}
                  onPress={() => setIsSelectMode(true)}
                >
                  <Text style={styles.selectModeButtonText}>Select</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={styles.selectModeButton}
                    onPress={toggleAllSelection}
                  >
                    <Text style={styles.selectModeButtonText}>
                      {templates.every(t => t.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectModeButton}
                    onPress={exitSelectMode}
                  >
                    <Text style={styles.selectModeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Card style={{ padding: 0 }}>
              {templates.map((template, index) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateItem,
                    index === templates.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={
                    isSelectMode
                      ? () => toggleTemplateSelection(template.id)
                      : undefined
                  }
                  disabled={!isSelectMode}
                >
                  {isSelectMode && (
                    <View style={styles.checkboxContainer}>
                      <Icon
                        name={
                          template.selected
                            ? "checkbox-marked"
                            : "checkbox-blank-outline"
                        }
                        size={24}
                        color={
                          template.selected
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>
                  )}
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDetails}>
                      {formatTemplateDetails(template)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {templates.length === 0 && (
          <Text style={styles.emptyState}>
            No workout templates found.{"\n"}
            Create some templates first to export them.
          </Text>
        )}
      </ScrollView>

      {/* Bottom Actions for Select Mode */}
      {isSelectMode && selectedCount > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={exportSelectedTemplates}
          >
            <Icon name="export" size={20} color={colors.buttonText} />
            <Text style={styles.bottomActionText}>
              Export Selected ({selectedCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TemplateManagementScreen;
