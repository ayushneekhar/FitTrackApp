// src/components/ExerciseHeader.tsx
interface ExerciseHeaderProps {
  exercise: WorkoutExercise;
  onRemoveExercise: (instanceId: string) => void;
  onRestChange: (instanceId: string, rest: string) => void;
}

const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exercise,
  onRemoveExercise,
  onRestChange
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.exerciseHeader}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseDetail}>
          {exercise.type} • {exercise.category}
        </Text>
      </View>
      <RestInput
        value={exercise.defaultRestSeconds}
        onChangeText={(text) => onRestChange(exercise.instanceId, text)}
      />
      <RemoveExerciseButton
        onPress={() => onRemoveExercise(exercise.instanceId)}
      />
    </View>
  );
};