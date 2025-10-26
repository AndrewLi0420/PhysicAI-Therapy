import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ExerciseCard } from './ExerciseCard';
import { ProgressChart } from './ProgressChart';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  Calendar,
  Settings,
  Award,
  Flame
} from 'lucide-react';
import { UserProfile, Exercise, WorkoutLog } from '../App';

type DashboardProps = {
  userProfile: UserProfile;
  exercises: Exercise[];
  workoutLogs: WorkoutLog[];
  onSelectExercise: (exercise: Exercise) => void;
  onResetAssessment: () => void;
};

export function Dashboard({ 
  userProfile, 
  exercises, 
  workoutLogs, 
  onSelectExercise,
  onResetAssessment 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('today');

  // Calculate personalized exercises based on user profile
  const personalizedExercises = useMemo(() => {
    let filtered = exercises;

    // Filter by difficulty based on pain and mobility levels
    if (userProfile.painLevel > 6 || userProfile.mobilityLevel < 4) {
      filtered = filtered.filter(e => e.difficulty === 'beginner');
    } else if (userProfile.painLevel > 3 || userProfile.mobilityLevel < 7) {
      filtered = filtered.filter(e => e.difficulty === 'beginner' || e.difficulty === 'intermediate');
    }

    // Sort by relevance to user's selected body part
    const sorted = [...filtered].sort((a, b) => {
      const aMatches = a.bodyParts.includes(userProfile.condition);
      const bMatches = b.bodyParts.includes(userProfile.condition);
      
      // Prioritize exercises that match the user's condition
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      
      // If both match or both don't match, keep original order
      return 0;
    });

    return sorted;
  }, [exercises, userProfile]);

  // Today's recommended exercises (adaptive)
  const todaysExercises = useMemo(() => {
    return personalizedExercises.slice(0, 4);
  }, [personalizedExercises]);

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
    const weeklyProgress = (thisWeek.filter(l => l.completed).length / (personalizedExercises.length * 7)) * 100;

    return {
      completedToday,
      totalToday: todaysExercises.length,
      streak,
      weeklyProgress: Math.min(weeklyProgress, 100)
    };
  }, [workoutLogs, todaysExercises, personalizedExercises]);

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
            <TabsTrigger value="all">
              <Activity className="h-4 w-4 mr-2" />
              All Exercises
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
                  Personalized for your {userProfile.condition.toLowerCase()} recovery
                </CardDescription>
              </CardHeader>
              <CardContent>
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

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Library</CardTitle>
                <CardDescription>
                  All exercises tailored to your ability level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalizedExercises.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onSelect={() => onSelectExercise(exercise)}
                      logs={workoutLogs.filter(log => log.exerciseId === exercise.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <ProgressChart workoutLogs={workoutLogs} exercises={exercises} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
