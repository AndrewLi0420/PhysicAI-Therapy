import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ExerciseCard } from './ExerciseCard';
import { ProgressChart } from './ProgressChart';
import { pythonBackendService } from '../services/pythonBackendService';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  Calendar,
  Settings,
  Award,
  Flame,
  Library
} from 'lucide-react';
import { UserProfile, Exercise, WorkoutLog } from '../App';

type DashboardProps = {
  userProfile: UserProfile;
  exerciseLibrary: Exercise[];
  userSelectedExercises: Exercise[];
  workoutLogs: WorkoutLog[];
  onSelectExercise: (exercise: Exercise) => void;
  onAddExerciseToUserSelection: (exercise: Exercise) => void;
  onRemoveExerciseFromUserSelection: (exerciseId: string) => void;
  onResetAssessment: () => void;
  onOpenExerciseLibrary: () => void;
  apiError: string | null;
  onRetryApi: () => Promise<void>;
};

export function Dashboard({ 
  userProfile, 
  exerciseLibrary,
  userSelectedExercises,
  workoutLogs, 
  onSelectExercise,
  onAddExerciseToUserSelection,
  onRemoveExerciseFromUserSelection,
  onResetAssessment,
  onOpenExerciseLibrary,
  apiError,
  onRetryApi
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('today');
  const [aiRecommendedExercises, setAiRecommendedExercises] = useState<Exercise[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Generate AI recommendations using the API
  const generateAIRecommendations = async (profile: UserProfile): Promise<Exercise[]> => {
    try {
      const recommendations = await pythonBackendService.getPersonalizedRecommendations(
        profile.painLevel,
        profile.mobilityLevel,
        profile.condition,
        profile.goals,
        30 // Get top 30 recommendations
      );
      
      // Convert API recommendations to app exercises
      return recommendations.map(rec => pythonBackendService.convertToAppExercise(rec.exercise));
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      return [];
    }
  };

  // Initialize AI recommendations when user profile changes
  useEffect(() => {
    const loadRecommendations = async () => {
      if (userProfile) {
        setLoadingRecommendations(true);
        try {
          const recommendations = await generateAIRecommendations(userProfile);
          setAiRecommendedExercises(recommendations);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
          setAiRecommendedExercises([]);
        } finally {
          setLoadingRecommendations(false);
        }
      }
    };

    loadRecommendations();
  }, [userProfile]);

  // Today's recommended exercises (randomly selected from user's exercises)
  const todaysExercises = useMemo(() => {
    if (userSelectedExercises.length === 0) return [];
    
    // Shuffle array and take first 4
    const shuffled = [...userSelectedExercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [userSelectedExercises]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });

    const completedToday = workoutLogs.filter(
      log => log.date === today && log.completed
    ).length;

    const streak = calculateStreak(workoutLogs);
    const weeklyProgress = (thisWeek.filter(l => l.completed).length / (userSelectedExercises.length * 7)) * 100;

    return {
      completedToday,
      totalToday: todaysExercises.length,
      streak,
      weeklyProgress: Math.min(weeklyProgress, 100)
    };
  }, [workoutLogs, todaysExercises, userSelectedExercises]);

  function calculateStreak(logs: WorkoutLog[]): number {
    if (logs.length === 0) return 0;

    const sortedLogs = [...logs]
      .filter(l => l.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasLog = sortedLogs.some(log => log.date === dateStr);

      if (hasLog) {
        streak++;
      } else if (i > 0) {
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1>Welcome back, {userProfile.name}!</h1>
              <p className="text-muted-foreground">
                {userProfile.condition}
              </p>
            </div>
            <Button variant="outline" onClick={onResetAssessment}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Today's Progress</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-2xl">{stats.completedToday}</span>
                <span className="text-muted-foreground">/{stats.totalToday}</span>
              </div>
              <Progress value={(stats.completedToday / stats.totalToday) * 100} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-2xl">{stats.streak}</span>
                <span className="text-muted-foreground ml-1">days</span>
              </div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Weekly Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-2xl">{Math.round(stats.weeklyProgress)}</span>
                <span className="text-muted-foreground">%</span>
              </div>
              <Progress value={stats.weeklyProgress} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-2xl">{userProfile.goals.length}</span>
                <span className="text-muted-foreground ml-1">goals</span>
              </div>
              <p className="text-xs text-muted-foreground">Stay focused</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="today">
            <Calendar className="h-4 w-4 mr-2" />
            Today's Plan
          </TabsTrigger>
          <TabsTrigger value="your-exercises">
            <Activity className="h-4 w-4 mr-2" />
            Your Exercises
          </TabsTrigger>
          <TabsTrigger value="ai-recommended">
            <Target className="h-4 w-4 mr-2" />
            AI Recommended
          </TabsTrigger>
          <TabsTrigger value="library">
            <Library className="h-4 w-4 mr-2" />
            Exercise Library
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Recommended Exercises</CardTitle>
                <CardDescription>
                  {userSelectedExercises.length > 0 
                    ? `Randomly selected from your ${userSelectedExercises.length} chosen exercises`
                    : "Add exercises from AI Recommended tab to get your daily plan"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todaysExercises.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todaysExercises.map(exercise => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onSelect={() => onSelectExercise(exercise)}
                        logs={workoutLogs.filter(log => log.exerciseId === exercise.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No exercises selected yet</h3>
                    <p className="text-gray-600 mb-4">
                      Go to the AI Recommended tab to find exercises that match your condition, 
                      then add them to Your Exercises to get your daily plan.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('ai-recommended')}
                      variant="outline"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Browse AI Recommendations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userProfile.goals.map(goal => (
                    <Badge key={goal} variant="secondary">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="your-exercises" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Selected Exercises</CardTitle>
                <CardDescription>
                  Exercises you've chosen from AI recommendations. These will be used for your daily plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userSelectedExercises.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userSelectedExercises.map(exercise => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onSelect={() => onSelectExercise(exercise)}
                        logs={workoutLogs.filter(log => log.exerciseId === exercise.id)}
                        showRemoveButton={true}
                        onRemove={() => onRemoveExerciseFromUserSelection(exercise.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No exercises selected yet</h3>
                    <p className="text-gray-600 mb-4">
                      Browse AI recommendations and add exercises that interest you.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('ai-recommended')}
                      variant="outline"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Browse AI Recommendations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-recommended" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommended Exercises</CardTitle>
                <CardDescription>
                  {loadingRecommendations ? (
                    <div className="flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Analyzing your profile and generating recommendations...
                    </div>
                  ) : (
                    `Top ${aiRecommendedExercises.length} exercises tailored for your ${userProfile.condition.toLowerCase()} condition using AI analysis`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRecommendations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold mb-2">Generating AI Recommendations</h3>
                    <p className="text-gray-600">
                      Analyzing your pain level, mobility, and condition using our AI recommendation engine to find the best exercises for you.
                    </p>
                  </div>
                ) : aiRecommendedExercises.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiRecommendedExercises.map(exercise => {
                      const isSelected = userSelectedExercises.some(e => e.id === exercise.id);
                      return (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          onSelect={() => onSelectExercise(exercise)}
                          logs={workoutLogs.filter(log => log.exerciseId === exercise.id)}
                          showAddButton={true}
                          isAdded={isSelected}
                          onAdd={() => onAddExerciseToUserSelection(exercise)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {apiError ? 'Connection Error' : 'Unable to load recommendations'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {apiError || 'There was an issue connecting to our AI recommendation service. Please check your internet connection and try again.'}
                    </p>
                    <Button 
                      onClick={onRetryApi}
                      variant="outline"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Library</CardTitle>
                <CardDescription>
                  Access our comprehensive library of 700+ physical therapy exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Library className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Explore Exercise Library</h3>
                  <p className="text-gray-600 mb-6">
                    Browse through hundreds of exercises from our curated database, 
                    filtered specifically for physical therapy and rehabilitation.
                  </p>
                  <Button onClick={onOpenExerciseLibrary} size="lg" className="px-8">
                    <Library className="h-5 w-5 mr-2" />
                    Open Exercise Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressChart workoutLogs={workoutLogs} exercises={exerciseLibrary} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}