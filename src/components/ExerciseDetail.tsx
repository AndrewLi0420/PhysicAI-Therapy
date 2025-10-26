import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { Exercise, WorkoutLog } from '../App';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

type ExerciseDetailProps = {
  exercise: Exercise;
  onBack: () => void;
  onLogWorkout: (log: WorkoutLog) => void;
};

export function ExerciseDetail({ exercise, onBack, onLogWorkout }: ExerciseDetailProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(5);
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    const log: WorkoutLog = {
      exerciseId: exercise.id,
      date: new Date().toISOString().split('T')[0],
      completed: true,
      painLevel,
      difficultyRating,
      notes,
    };

    onLogWorkout(log);
    
    toast.success('Exercise completed!', {
      description: 'Great work! Your progress has been logged.',
    });

    // Adaptive feedback
    if (painLevel > 6) {
      toast.warning('High pain level detected', {
        description: 'Consider reducing intensity or consulting your therapist.',
      });
    } else if (difficultyRating < 3) {
      toast.success('You\'re making great progress!', {
        description: 'We may increase difficulty in your next session.',
      });
    }

    setTimeout(() => {
      onBack();
    }, 1500);
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Exercise Image */}
          <div className="relative h-96 rounded-lg overflow-hidden bg-muted">
            <ImageWithFallback
              src={exercise.imageUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Exercise Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1>{exercise.name}</h1>
                <Badge className={difficultyColors[exercise.difficulty]}>
                  {exercise.difficulty}
                </Badge>
              </div>
              <p className="text-muted-foreground">{exercise.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">Duration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{exercise.duration} minutes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm">Sets & Reps</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{exercise.sets} × {exercise.reps}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Target Area</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{exercise.targetArea}</Badge>
                <Badge variant="secondary" className="ml-2">{exercise.category}</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Follow these steps carefully</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Safety Notice */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="mb-1">Safety First</h4>
                <p className="text-sm text-muted-foreground">
                  Stop immediately if you experience sharp pain, dizziness, or unusual discomfort. 
                  Listen to your body and never push through pain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Exercise Section */}
        {!isCompleting ? (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={() => setIsCompleting(true)} className="w-full" size="lg">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Mark as Complete
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Log Your Session</CardTitle>
              <CardDescription>
                Help us personalize your future workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Pain Level During Exercise: {painLevel}/10</Label>
                <Slider
                  value={[painLevel]}
                  onValueChange={(value) => setPainLevel(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>No pain</span>
                  <span>Severe pain</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>How difficult was this exercise? {difficultyRating}/10</Label>
                <Slider
                  value={[difficultyRating]}
                  onValueChange={(value) => setDifficultyRating(value[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Too easy</span>
                  <span>Too hard</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How did you feel? Any observations?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCompleting(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
