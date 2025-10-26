import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AssessmentFlow } from './components/AssessmentFlow';
import { ExerciseDetail } from './components/ExerciseDetail';
import { Toaster } from './components/ui/sonner';

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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Initialize mock data
  useEffect(() => {
    // Check if user has completed assessment
    const savedProfile = localStorage.getItem('userProfile');
    const savedLogs = localStorage.getItem('workoutLogs');
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    
    if (savedLogs) {
      setWorkoutLogs(JSON.parse(savedLogs));
    }

    // Initialize exercises
    initializeExercises();
  }, []);

  const initializeExercises = () => {
    const exerciseLibrary: Exercise[] = [
      {
        id: '1',
        name: 'Gentle Neck Rotations',
        description: 'Improve neck mobility and reduce tension',
        difficulty: 'beginner',
        duration: 5,
        sets: 2,
        reps: 10,
        category: 'Mobility',
        targetArea: 'Neck',
        bodyParts: ['Neck', 'Upper Back'],
        instructions: [
          'Sit or stand with your back straight',
          'Slowly turn your head to the right, hold for 2 seconds',
          'Return to center, then turn to the left',
          'Repeat slowly and controlled',
          'Stop if you feel any sharp pain'
        ]
      },
      {
        id: '2',
        name: 'Shoulder Blade Squeeze',
        description: 'Strengthen upper back and improve posture',
        difficulty: 'beginner',
        duration: 5,
        sets: 3,
        reps: 12,
        category: 'Strength',
        targetArea: 'Upper Back',
        bodyParts: ['Upper Back', 'Shoulder', 'Neck'],
        instructions: [
          'Sit upright with arms at your sides',
          'Pull your shoulder blades back and together',
          'Hold for 5 seconds',
          'Release slowly',
          'Keep your neck relaxed throughout'
        ]
      },
      {
        id: '3',
        name: 'Wall Push-ups',
        description: 'Build upper body strength safely',
        difficulty: 'beginner',
        duration: 8,
        sets: 3,
        reps: 10,
        category: 'Strength',
        targetArea: 'Chest & Arms',
        bodyParts: ['Shoulder', 'Elbow', 'Wrist', 'Upper Back'],
        instructions: [
          'Stand arm\'s length from a wall',
          'Place palms flat on the wall at shoulder height',
          'Bend elbows to bring chest toward wall',
          'Push back to starting position',
          'Keep your body straight throughout'
        ]
      },
      {
        id: '4',
        name: 'Seated Hamstring Stretch',
        description: 'Improve lower body flexibility',
        difficulty: 'beginner',
        duration: 6,
        sets: 2,
        reps: 5,
        category: 'Flexibility',
        targetArea: 'Legs',
        bodyParts: ['Knee', 'Hip', 'Lower Back'],
        instructions: [
          'Sit on the edge of a chair',
          'Extend one leg straight out',
          'Keep your back straight and lean forward slightly',
          'Hold the stretch for 20-30 seconds',
          'Switch legs and repeat'
        ]
      },
      {
        id: '5',
        name: 'Standing Hip Flexor Stretch',
        description: 'Release hip tension and improve mobility',
        difficulty: 'intermediate',
        duration: 6,
        sets: 2,
        reps: 4,
        category: 'Flexibility',
        targetArea: 'Hips',
        bodyParts: ['Hip', 'Lower Back', 'Knee'],
        instructions: [
          'Stand in a lunge position',
          'Keep your back knee slightly bent',
          'Shift weight forward to feel stretch in front of hip',
          'Hold for 30 seconds',
          'Switch sides'
        ]
      },
      {
        id: '6',
        name: 'Glute Bridge',
        description: 'Strengthen lower back and glutes',
        difficulty: 'intermediate',
        duration: 7,
        sets: 3,
        reps: 12,
        category: 'Strength',
        targetArea: 'Lower Back & Glutes',
        bodyParts: ['Lower Back', 'Hip', 'Knee'],
        instructions: [
          'Lie on your back with knees bent',
          'Feet flat on the floor, hip-width apart',
          'Lift hips toward ceiling',
          'Squeeze glutes at the top',
          'Lower slowly and repeat'
        ]
      },
      {
        id: '7',
        name: 'Bird Dog Exercise',
        description: 'Improve core stability and balance',
        difficulty: 'intermediate',
        duration: 8,
        sets: 3,
        reps: 10,
        category: 'Balance',
        targetArea: 'Core',
        bodyParts: ['Lower Back', 'Upper Back', 'Shoulder', 'Hip'],
        instructions: [
          'Start on hands and knees',
          'Extend right arm forward and left leg back',
          'Hold for 5 seconds',
          'Return to start and switch sides',
          'Keep your core engaged throughout'
        ]
      },
      {
        id: '8',
        name: 'Single Leg Balance',
        description: 'Enhance stability and proprioception',
        difficulty: 'intermediate',
        duration: 5,
        sets: 3,
        reps: 30,
        category: 'Balance',
        targetArea: 'Full Body',
        bodyParts: ['Ankle', 'Knee', 'Hip', 'Full Body'],
        instructions: [
          'Stand near a wall for support',
          'Lift one foot off the ground',
          'Balance for 30 seconds',
          'Switch legs',
          'Progress to closing your eyes when ready'
        ]
      },
      {
        id: '9',
        name: 'Wrist Circles',
        description: 'Improve wrist mobility and reduce stiffness',
        difficulty: 'beginner',
        duration: 3,
        sets: 2,
        reps: 10,
        category: 'Mobility',
        targetArea: 'Wrist',
        bodyParts: ['Wrist', 'Hand', 'Elbow'],
        instructions: [
          'Extend your arm in front of you',
          'Make slow circles with your wrist',
          'Circle 10 times clockwise',
          'Then 10 times counter-clockwise',
          'Repeat with the other wrist'
        ]
      },
      {
        id: '10',
        name: 'Ankle Pumps',
        description: 'Improve ankle mobility and circulation',
        difficulty: 'beginner',
        duration: 4,
        sets: 3,
        reps: 15,
        category: 'Mobility',
        targetArea: 'Ankle',
        bodyParts: ['Ankle', 'Foot', 'Knee'],
        instructions: [
          'Sit or lie down comfortably',
          'Point your toes away from you',
          'Then flex your foot back toward you',
          'Repeat in a smooth pumping motion',
          'Do both feet together or one at a time'
        ]
      },
      {
        id: '11',
        name: 'Shoulder Rolls',
        description: 'Release shoulder tension and improve mobility',
        difficulty: 'beginner',
        duration: 4,
        sets: 2,
        reps: 10,
        category: 'Mobility',
        targetArea: 'Shoulder',
        bodyParts: ['Shoulder', 'Upper Back', 'Neck'],
        instructions: [
          'Stand or sit with good posture',
          'Roll shoulders up toward ears',
          'Then back and down in a circular motion',
          'Repeat 10 times backward',
          'Then reverse direction for 10 times forward'
        ]
      },
      {
        id: '12',
        name: 'Cat-Cow Stretch',
        description: 'Mobilize spine and relieve back tension',
        difficulty: 'beginner',
        duration: 5,
        sets: 2,
        reps: 10,
        category: 'Mobility',
        targetArea: 'Back',
        bodyParts: ['Lower Back', 'Upper Back', 'Neck'],
        instructions: [
          'Start on hands and knees',
          'Arch your back, dropping belly toward floor (Cow)',
          'Then round your back, tucking chin to chest (Cat)',
          'Move slowly between positions',
          'Breathe deeply with each movement'
        ]
      }
    ];

    setExercises(exerciseLibrary);
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

  const handleResetAssessment = () => {
    setUserProfile(null);
    localStorage.removeItem('userProfile');
  };

  if (!userProfile || !userProfile.completedAssessment) {
    return (
      <>
        <AssessmentFlow onComplete={handleAssessmentComplete} />
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
        exercises={exercises}
        workoutLogs={workoutLogs}
        onSelectExercise={setSelectedExercise}
        onResetAssessment={handleResetAssessment}
      />
      <Toaster />
    </>
  );
}
