import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AssessmentFlow } from './components/AssessmentFlow';
import { ExerciseDetail } from './components/ExerciseDetail';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { Toaster } from './components/ui/sonner';
import { pythonBackendService } from './services/pythonBackendService';

export type UserProfile = {
  name: string;
  condition: string;
  painLevel: number;
  mobilityLevel: number;
  goals: string[];
  completedAssessment: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  sets: number;
  reps: number;
  category: string;
  targetArea: string;
  bodyParts: string[]; // Body parts this exercise helps with
  instructions: string[];
};

export type WorkoutLog = {
  exerciseId: string;
  date: string;
  completed: boolean;
  painLevel: number;
  difficultyRating: number;
  notes: string;
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [userSelectedExercises, setUserSelectedExercises] = useState<Exercise[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize mock data
  useEffect(() => {
    const initializeData = async () => {
      // Check if user has completed assessment
      const savedProfile = localStorage.getItem('userProfile');
      const savedLogs = localStorage.getItem('workoutLogs');
      const savedUserExercises = localStorage.getItem('userSelectedExercises');
      
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
      
      if (savedLogs) {
        setWorkoutLogs(JSON.parse(savedLogs));
      }

      if (savedUserExercises) {
        setUserSelectedExercises(JSON.parse(savedUserExercises));
      }

      // Initialize exercise library from API
      await initializeExerciseLibrary();
    };

    initializeData();
  }, []);

  const initializeExerciseLibrary = async () => {
    try {
      setApiError(null);
      // Load exercises from the API database
      const externalExercises = await pythonBackendService.getAllExercises();
      const appExercises = externalExercises.map(exercise => 
        pythonBackendService.convertToAppExercise(exercise)
      );
      setExerciseLibrary(appExercises);
      console.log(`✅ Loaded ${appExercises.length} exercises from API`);
    } catch (error) {
      console.error('Failed to load exercises from API:', error);
      setApiError('Failed to connect to exercise database. Please check your internet connection and try again.');
      // Initialize empty library if API fails
      setExerciseLibrary([]);
    }
  };

  const handleAssessmentComplete = (profile: UserProfile) => {
    const updatedProfile = { ...profile, completedAssessment: true };
    setUserProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  };

  const handleLogWorkout = (log: WorkoutLog) => {
    const updatedLogs = [...workoutLogs, log];
    setWorkoutLogs(updatedLogs);
    localStorage.setItem('workoutLogs', JSON.stringify(updatedLogs));
  };

  const handleAddExerciseToUserSelection = (exercise: Exercise) => {
    if (!userSelectedExercises.find(e => e.id === exercise.id)) {
      const updatedExercises = [...userSelectedExercises, exercise];
      setUserSelectedExercises(updatedExercises);
      localStorage.setItem('userSelectedExercises', JSON.stringify(updatedExercises));
    }
  };

  const handleRemoveExerciseFromUserSelection = (exerciseId: string) => {
    const updatedExercises = userSelectedExercises.filter(e => e.id !== exerciseId);
    setUserSelectedExercises(updatedExercises);
    localStorage.setItem('userSelectedExercises', JSON.stringify(updatedExercises));
  };

  const handleResetAssessment = () => {
    setUserProfile(null);
    setUserSelectedExercises([]);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userSelectedExercises');
  };

  if (!userProfile || !userProfile.completedAssessment) {
    return (
      <>
        <AssessmentFlow onComplete={handleAssessmentComplete} />
        <Toaster />
      </>
    );
  }

  if (showExerciseLibrary) {
    return (
      <>
        <ExerciseLibrary
          onSelectExercise={setSelectedExercise}
          onBack={() => setShowExerciseLibrary(false)}
        />
        <Toaster />
      </>
    );
  }

  if (selectedExercise) {
    return (
      <>
        <ExerciseDetail
          exercise={selectedExercise}
          onBack={() => setSelectedExercise(null)}
          onLogWorkout={handleLogWorkout}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Dashboard
        userProfile={userProfile}
        exerciseLibrary={exerciseLibrary}
        userSelectedExercises={userSelectedExercises}
        workoutLogs={workoutLogs}
        onSelectExercise={setSelectedExercise}
        onAddExerciseToUserSelection={handleAddExerciseToUserSelection}
        onRemoveExerciseFromUserSelection={handleRemoveExerciseFromUserSelection}
        onResetAssessment={handleResetAssessment}
        onOpenExerciseLibrary={() => setShowExerciseLibrary(true)}
        apiError={apiError}
        onRetryApi={initializeExerciseLibrary}
      />
      <Toaster />
    </>
  );
}
