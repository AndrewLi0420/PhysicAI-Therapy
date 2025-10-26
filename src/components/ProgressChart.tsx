import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WorkoutLog, Exercise } from '../App';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

type ProgressChartProps = {
  workoutLogs: WorkoutLog[];
  exercises: Exercise[];
};

export function ProgressChart({ workoutLogs, exercises }: ProgressChartProps) {
  const chartData = useMemo(() => {
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = workoutLogs.filter(log => log.date === dateStr && log.completed);
      const avgPain = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + log.painLevel, 0) / dayLogs.length
        : null;
      const avgDifficulty = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + log.difficultyRating, 0) / dayLogs.length
        : null;

      last14Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        exercises: dayLogs.length,
        pain: avgPain !== null ? Number(avgPain.toFixed(1)) : null,
        difficulty: avgDifficulty !== null ? Number(avgDifficulty.toFixed(1)) : null,
      });
    }
    return last14Days;
  }, [workoutLogs]);

  const categoryData = useMemo(() => {
    const categories = ['Mobility', 'Strength', 'Flexibility', 'Balance'];
    return categories.map(category => {
      const categoryExercises = exercises.filter(e => e.category === category);
      const completed = workoutLogs.filter(log => 
        log.completed && categoryExercises.some(e => e.id === log.exerciseId)
      ).length;
      
      return {
        category,
        completed,
      };
    });
  }, [workoutLogs, exercises]);

  const recentPainTrend = useMemo(() => {
    const recentLogs = workoutLogs
      .filter(log => log.completed)
      .slice(-10);
    
    if (recentLogs.length < 2) return 'stable';
    
    const firstHalf = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
    const secondHalf = recentLogs.slice(Math.floor(recentLogs.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, log) => sum + log.painLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.painLevel, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 0.5) return 'improving';
    if (secondAvg > firstAvg + 0.5) return 'worsening';
    return 'stable';
  }, [workoutLogs]);

  return (
    <div className="space-y-6">
      {/* Pain Trend Insight */}
      <Card>
        <CardHeader>
          <CardTitle>Pain Trend Analysis</CardTitle>
          <CardDescription>Based on your recent exercise logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {recentPainTrend === 'improving' && (
              <>
                <TrendingDown className="h-8 w-8 text-green-600" />
                <div>
                  <h3>Pain Levels Decreasing</h3>
                  <p className="text-sm text-muted-foreground">
                    Great progress! Your pain is trending downward.
                  </p>
                </div>
              </>
            )}
            {recentPainTrend === 'stable' && (
              <>
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <h3>Pain Levels Stable</h3>
                  <p className="text-sm text-muted-foreground">
                    Your pain levels are consistent. Keep up the routine!
                  </p>
                </div>
              </>
            )}
            {recentPainTrend === 'worsening' && (
              <>
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <h3>Pain Levels Increasing</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider consulting your therapist for exercise adjustments.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Exercises completed over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="exercises" fill="#3b82f6" name="Exercises Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pain & Difficulty Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Pain & Difficulty Tracking</CardTitle>
          <CardDescription>Monitor your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="pain" 
                stroke="#ef4444" 
                name="Pain Level"
                strokeWidth={2}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="difficulty" 
                stroke="#f59e0b" 
                name="Difficulty Rating"
                strokeWidth={2}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise Categories</CardTitle>
          <CardDescription>Total exercises completed by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" />
              <Tooltip />
              <Bar dataKey="completed" fill="#8b5cf6" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
