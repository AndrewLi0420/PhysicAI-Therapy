import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Target, 
  Activity, 
  Move, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { exerciseService } from '../services/exerciseService';
import { RecommendationScore, PainLevel, MobilityLevel } from '../services/exerciseRecommendationService';
import { Exercise } from '../App';

interface PersonalizedRecommendationsProps {
  userPainLevel: PainLevel;
  userMobilityLevel: MobilityLevel;
  userCondition: string;
  builtInExercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
}

export function PersonalizedRecommendations({ 
  userPainLevel, 
  userMobilityLevel, 
  userCondition, 
  builtInExercises,
  onSelectExercise 
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [stretchingRecommendations, setStretchingRecommendations] = useState<RecommendationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personalized');
  const [exerciseCount, setExerciseCount] = useState<number>(0);

  useEffect(() => {
    loadRecommendations();
  }, [userPainLevel, userMobilityLevel, userCondition]);

  const clearCache = async () => {
    exerciseService.clearCache();
    alert('Cache cleared! Refreshing recommendations...');
    await loadRecommendations();
  };

  const testAPI = async () => {
    try {
      console.log('Testing API connection...');
      const allExercises = await exerciseService.getAllExercises();
      const ptExercises = await exerciseService.getPhysicalTherapyExercises();
      console.log(`API Test: Successfully fetched ${allExercises.length} total exercises, ${ptExercises.length} PT-relevant`);
      alert(`API Test: Successfully fetched ${allExercises.length} total exercises from external database!\n${ptExercises.length} are PT-relevant and will be used for recommendations.`);
      setExerciseCount(ptExercises.length);
    } catch (error) {
      console.error('API Test failed:', error);
      alert(`API Test failed: ${error}`);
    }
  };

  const loadRecommendations = async () => {
    try {
      console.log('🚀 Loading personalized recommendations...');
      setLoading(true);
      setError(null);

      console.log('📊 User profile:', { userPainLevel, userMobilityLevel, userCondition });
      console.log('🏠 Built-in exercises count:', builtInExercises.length);

      const [personalized, stretching] = await Promise.all([
        exerciseService.getPersonalizedRecommendations(
          userPainLevel,
          userMobilityLevel,
          userCondition,
          builtInExercises,
          12
        ),
        exerciseService.getStretchingRecommendations(
          userPainLevel,
          userMobilityLevel,
          userCondition,
          8
        )
      ]);

      console.log('✅ Received recommendations:', personalized.length, 'personalized,', stretching.length, 'stretching');
      console.log('🏆 Top personalized recommendations:', personalized.slice(0, 3).map(r => r.exercise.name));

      setRecommendations(personalized);
      setStretchingRecommendations(stretching);
      
      // Get exercise count for display
      const ptExercises = await exerciseService.getPhysicalTherapyExercises();
      setExerciseCount(ptExercises.length);
      
      console.log('📈 Final exercise count for display:', ptExercises.length);
    } catch (err) {
      console.error('❌ Error loading recommendations:', err);
      setError('Failed to load personalized recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertToAppExercise = (recommendation: RecommendationScore): Exercise => {
    const exercise = recommendation.exercise;
    return {
      id: `rec_${exercise.id}`,
      name: exercise.name,
      description: exercise.description,
      difficulty: exercise.difficulty,
      duration: exercise.duration,
      sets: exercise.sets,
      reps: exercise.reps,
      category: exercise.category,
      targetArea: exercise.targetArea,
      bodyParts: exercise.bodyParts,
      instructions: exercise.instructions
    };
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <Target className="h-4 w-4" />;
      case 'moderate': return <Activity className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'very-low': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'very-high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing exercises for your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI-Powered Exercise Recommendations
        </h2>
        <p className="text-gray-600">
          Carefully selected from 800+ exercises based on your pain level ({userPainLevel}/10), 
          mobility ({userMobilityLevel}/10), and {userCondition} condition
        </p>
        <Button onClick={testAPI} variant="outline" className="mt-4 mr-2">
          Test API Connection
        </Button>
        <Button onClick={clearCache} variant="destructive" className="mt-4">
          Clear Cache & Refresh
        </Button>
        {exerciseCount > 0 && (
          <div className="mt-2 text-sm text-green-600">
            ✅ Using {exerciseCount} exercises from external database
          </div>
        )}
      </div>

      {/* Recommendation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personalized" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Best Matches</span>
          </TabsTrigger>
          <TabsTrigger value="stretching" className="flex items-center space-x-2">
            <Move className="h-4 w-4" />
            <span>Stretching</span>
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Progression</span>
          </TabsTrigger>
        </TabsList>

        {/* Personalized Recommendations */}
        <TabsContent value="personalized" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <Card key={rec.exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{rec.exercise.name}</CardTitle>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getSuitabilityColor(rec.suitability)}>
                        {getSuitabilityIcon(rec.suitability)}
                        <span className="ml-1 capitalize">{rec.suitability}</span>
                      </Badge>
                      <Badge variant="outline" className={getIntensityColor(rec.exercise.intensity)}>
                        {rec.exercise.intensity.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {rec.exercise.category} • {rec.exercise.targetArea}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Match Score:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.round(rec.score * 100)}%
                      </span>
                    </div>
                    
                    {/* Reasons */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Why this exercise:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.reasons.slice(0, 2).map((reason, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Warnings */}
                    {rec.warnings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-orange-600 mb-1">Important:</p>
                        <ul className="text-xs text-orange-600 space-y-1">
                          {rec.warnings.slice(0, 1).map((warning, i) => (
                            <li key={i} className="flex items-start">
                              <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Benefits */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Benefits:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.exercise.therapeuticBenefits.slice(0, 2).map((benefit, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => onSelectExercise(convertToAppExercise(rec))}
                      className="w-full"
                      size="sm"
                    >
                      Select Exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stretching Recommendations */}
        <TabsContent value="stretching" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Mobility-Based Stretching</h3>
            <p className="text-sm text-blue-700">
              These stretches are specifically selected based on your mobility level ({userMobilityLevel}/10) 
              and will help improve flexibility and reduce stiffness.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stretchingRecommendations.map((rec) => (
              <Card key={rec.exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{rec.exercise.name}</CardTitle>
                    <Badge className={getSuitabilityColor(rec.suitability)}>
                      {getSuitabilityIcon(rec.suitability)}
                      <span className="ml-1 capitalize">{rec.suitability}</span>
                    </Badge>
                  </div>
                  <CardDescription>
                    {rec.exercise.category} • {rec.exercise.targetArea}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mobility Match:</span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(rec.score * 100)}%
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Stretching benefits:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.exercise.therapeuticBenefits.map((benefit, i) => (
                          <li key={i} className="flex items-start">
                            <Move className="h-3 w-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={() => onSelectExercise(convertToAppExercise(rec))}
                      className="w-full"
                      size="sm"
                    >
                      Start Stretching
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Progression Plan */}
        <TabsContent value="progression" className="space-y-4">
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Exercise Progression Plan</h3>
            <p className="text-sm text-green-700">
              Start with lower intensity exercises and gradually progress as your pain decreases 
              and mobility improves. Follow this recommended sequence.
            </p>
          </div>
          
          <div className="space-y-4">
            {['very-low', 'low', 'moderate', 'high'].map((intensity, index) => {
              const intensityExercises = recommendations.filter(
                rec => rec.exercise.intensity === intensity
              ).slice(0, 2);
              
              if (intensityExercises.length === 0) return null;
              
              return (
                <Card key={intensity} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                        Phase {index + 1}
                      </span>
                      <span className="capitalize">{intensity.replace('-', ' ')} Intensity</span>
                    </CardTitle>
                    <CardDescription>
                      {index === 0 && "Start here if you have high pain or low mobility"}
                      {index === 1 && "Progress to these when pain is moderate"}
                      {index === 2 && "Move to these as you improve"}
                      {index === 3 && "Advanced exercises for when you're feeling better"}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {intensityExercises.map((rec) => (
                        <div key={rec.exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{rec.exercise.name}</p>
                            <p className="text-sm text-gray-600">{rec.exercise.targetArea}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onSelectExercise(convertToAppExercise(rec))}
                          >
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
