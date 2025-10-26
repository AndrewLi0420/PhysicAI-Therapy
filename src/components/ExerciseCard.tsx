import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, Target, CheckCircle2 } from 'lucide-react';
import { Exercise, WorkoutLog } from '../App';

type ExerciseCardProps = {
  exercise: Exercise;
  onSelect: () => void;
  logs: WorkoutLog[];
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  isAdded?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
};

export function ExerciseCard({ 
  exercise, 
  onSelect, 
  logs, 
  showAddButton = false, 
  showRemoveButton = false, 
  isAdded = false, 
  onAdd, 
  onRemove 
}: ExerciseCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = logs.some(log => log.date === today && log.completed);
  const totalCompleted = logs.filter(log => log.completed).length;

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer relative" onClick={onSelect}>
      {completedToday && (
        <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-1.5">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start gap-2 mb-2">
          <CardTitle className="text-lg">{exercise.name}</CardTitle>
          <Badge className={difficultyColors[exercise.difficulty]}>
            {exercise.difficulty}
          </Badge>
        </div>
        <CardDescription>{exercise.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{exercise.duration} mins</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{exercise.sets} sets × {exercise.reps} reps</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Completed {totalCompleted}x
          </span>
          {showAddButton && (
            <Button 
              size="sm" 
              variant={isAdded ? "secondary" : "default"}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onAdd) onAdd(); 
              }}
              disabled={isAdded}
            >
              {isAdded ? "Added" : "Add"}
            </Button>
          )}
          {showRemoveButton && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onRemove) onRemove(); 
              }}
            >
              Remove
            </Button>
          )}
          {!showAddButton && !showRemoveButton && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
