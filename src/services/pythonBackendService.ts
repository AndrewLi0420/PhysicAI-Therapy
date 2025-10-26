// Simple service to communicate with Python backend
import { Exercise } from '../App';

export interface ExternalExercise {
  id: string;
  name: string;
  force: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface RecommendationScore {
  exercise: ExternalExercise;
  score: number;
  reasons: string[];
  warnings: string[];
  suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'contraindicated';
}

export interface UserProfile {
  pain_level: number;
  mobility_level: number;
  condition: string;
  goals: string[];
}

export interface ExerciseFilters {
  category?: string;
  level?: string;
  equipment?: string;
  primaryMuscles?: string[];
  searchTerm?: string;
}

class PythonBackendService {
  private baseUrl = 'http://localhost:5001';

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  async getPersonalizedRecommendations(
    userPainLevel: number,
    userMobilityLevel: number,
    userCondition: string,
    goals: string[] = [],
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pain_level: userPainLevel,
          mobility_level: userMobilityLevel,
          condition: userCondition,
          goals: goals,
          limit: limit
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data: BackendResponse = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  async getStretchingRecommendations(
    userPainLevel: number,
    userMobilityLevel: number,
    userCondition: string,
    goals: string[] = [],
    limit: number = 8
  ): Promise<RecommendationScore[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stretching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pain_level: userPainLevel,
          mobility_level: userMobilityLevel,
          condition: userCondition,
          goals: goals,
          limit: limit
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data: BackendResponse = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('Failed to get stretching recommendations:', error);
      throw error;
    }
  }

  async getAllExercises(): Promise<ExternalExercise[]> {
    try {
      const response = await fetch(`${this.baseUrl}/exercises`);
      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.statusText}`);
      }
      const data = await response.json();
      return data.exercises;
    } catch (error) {
      console.error('Failed to get all exercises:', error);
      throw error;
    }
  }

  convertToAppExercise(externalExercise: ExternalExercise): Exercise {
    return {
      id: externalExercise.id,
      name: externalExercise.name,
      description: externalExercise.instructions[0] || 'No description available',
      difficulty: externalExercise.level as 'beginner' | 'intermediate' | 'advanced',
      duration: 5, // Default duration
      sets: 3, // Default sets
      reps: 10, // Default reps
      category: externalExercise.category,
      targetArea: externalExercise.primaryMuscles[0] || 'General',
      bodyParts: [...externalExercise.primaryMuscles, ...externalExercise.secondaryMuscles],
      instructions: externalExercise.instructions
    };
  }
}

export const pythonBackendService = new PythonBackendService();
