import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ClipboardList, Activity, Target } from 'lucide-react';
import { UserProfile } from '../App';

type AssessmentFlowProps = {
  onComplete: (profile: UserProfile) => void;
};

export function AssessmentFlow({ onComplete }: AssessmentFlowProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    condition: '',
    painLevel: 3,
    mobilityLevel: 5,
    goals: [] as string[],
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const bodyPartOptions = [
    'Neck',
    'Upper Back',
    'Lower Back',
    'Shoulder',
    'Elbow',
    'Wrist',
    'Hand',
    'Hip',
    'Knee',
    'Ankle',
    'Foot',
    'Full Body'
  ];

  const goalOptions = [
    'Reduce Pain',
    'Improve Mobility',
    'Increase Strength',
    'Enhance Flexibility',
    'Better Balance',
    'Return to Sport',
    'Daily Activities',
    'Prevent Future Injury'
  ];

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      ...formData,
      completedAssessment: true
    };
    onComplete(profile);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.condition.trim() !== '';
      case 4:
        return formData.goals.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2">Welcome to PhysicAI Therapy</h1>
          <p className="text-muted-foreground">Let's personalize your recovery journey</p>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {step === 1 && <ClipboardList className="h-6 w-6 text-primary" />}
              {step === 2 && <Activity className="h-6 w-6 text-primary" />}
              {step === 3 && <Activity className="h-6 w-6 text-primary" />}
              {step === 4 && <Target className="h-6 w-6 text-primary" />}
              <CardTitle>
                {step === 1 && 'Basic Information'}
                {step === 2 && 'Your Condition'}
                {step === 3 && 'Current Status'}
                {step === 4 && 'Your Goals'}
              </CardTitle>
            </div>
            <CardDescription>
              {step === 1 && 'Tell us a bit about yourself'}
              {step === 2 && 'Help us understand your situation'}
              {step === 3 && 'Assess your current levels'}
              {step === 4 && 'What do you want to achieve?'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Which body part needs attention?</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select a body part" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyPartOptions.map((bodyPart) => (
                        <SelectItem key={bodyPart} value={bodyPart}>
                          {bodyPart}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose the primary area you'd like to work on
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Current Pain Level: {formData.painLevel}/10</Label>
                  <Slider
                    value={[formData.painLevel]}
                    onValueChange={(value) => setFormData({ ...formData, painLevel: value[0] })}
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
                  <Label>Mobility Level: {formData.mobilityLevel}/10</Label>
                  <Slider
                    value={[formData.mobilityLevel]}
                    onValueChange={(value) => setFormData({ ...formData, mobilityLevel: value[0] })}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very limited</span>
                    <span>Fully mobile</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Label>Select your goals (choose at least one)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {goalOptions.map((goal) => (
                    <div
                      key={goal}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => handleGoalToggle(goal)}
                    >
                      <Checkbox
                        id={goal}
                        checked={formData.goals.includes(goal)}
                        onCheckedChange={() => handleGoalToggle(goal)}
                      />
                      <Label
                        htmlFor={goal}
                        className="cursor-pointer flex-1"
                      >
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                >
                  Complete Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
