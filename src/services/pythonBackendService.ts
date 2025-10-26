// Enhanced exercise recommendation service using Python backend
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

export interface BackendResponse {
  recommendations: RecommendationScore[];
  total_exercises: number;
  pt_exercises: number;
}

class PythonBackendService {
  private baseUrl = 'http://localhost:5001';
  private isBackendAvailable = false;

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is healthy:', data);
        this.isBackendAvailable = true;
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Backend not available:', error);
      this.isBackendAvailable = false;
    }
    return false;
  }

  async getPersonalizedRecommendations(
    userPainLevel: number,
    userMobilityLevel: number,
    userCondition: string,
    goals: string[] = [],
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    if (!this.isBackendAvailable) {
      await this.checkBackendHealth();
    }

    if (!this.isBackendAvailable) {
      throw new Error('Python backend is not available. Please start the backend server.');
    }

    try {
      const userProfile: UserProfile = {
        pain_level: userPainLevel,
        mobility_level: userMobilityLevel,
        condition: userCondition,
        goals
      };

      console.log('🎯 Requesting recommendations from Python backend...', userProfile);

      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userProfile,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data: BackendResponse = await response.json();
      console.log(`✅ Received ${data.recommendations.length} recommendations from backend`);
      console.log(`📊 Using ${data.pt_exercises} PT exercises from ${data.total_exercises} total`);

      return data.recommendations;
    } catch (error) {
      console.error('❌ Error getting recommendations from backend:', error);
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
    if (!this.isBackendAvailable) {
      await this.checkBackendHealth();
    }

    if (!this.isBackendAvailable) {
      throw new Error('Python backend is not available. Please start the backend server.');
    }

    try {
      const userProfile: UserProfile = {
        pain_level: userPainLevel,
        mobility_level: userMobilityLevel,
        condition: userCondition,
        goals
      };

      console.log('🧘 Requesting stretching recommendations from Python backend...', userProfile);

      const response = await fetch(`${this.baseUrl}/stretching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userProfile,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data: BackendResponse = await response.json();
      console.log(`✅ Received ${data.recommendations.length} stretching recommendations from backend`);

      return data.recommendations;
    } catch (error) {
      console.error('❌ Error getting stretching recommendations from backend:', error);
      throw error;
    }
  }

  async getAllExercises(): Promise<ExternalExercise[]> {
    if (!this.isBackendAvailable) {
      await this.checkBackendHealth();
    }

    if (!this.isBackendAvailable) {
      throw new Error('Python backend is not available. Please start the backend server.');
    }

    try {
      console.log('📚 Fetching all exercises from Python backend...');

      const response = await fetch(`${this.baseUrl}/exercises`);
      
      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Received ${data.exercises.length} exercises from backend`);

      return data.exercises;
    } catch (error) {
      console.error('❌ Error getting exercises from backend:', error);
      throw error;
    }
  }

  // Convert external exercise to app exercise format
  convertToAppExercise(externalExercise: ExternalExercise): Exercise {
    return {
      id: `ext_${externalExercise.id}`,
      name: externalExercise.name,
      description: externalExercise.instructions[0] || 'No description available',
      difficulty: externalExercise.level === 'expert' ? 'advanced' : externalExercise.level,
      duration: 10, // Default duration
      sets: 3, // Default sets
      reps: 10, // Default reps
      category: externalExercise.category || 'General',
      targetArea: externalExercise.primaryMuscles.join(', '),
      bodyParts: [...externalExercise.primaryMuscles, ...externalExercise.secondaryMuscles],
      instructions: externalExercise.instructions
    };
  }

  // Get backend status
  getBackendStatus(): boolean {
    return this.isBackendAvailable;
  }

  // Set backend URL (for development)
  setBackendUrl(url: string): void {
    this.baseUrl = url;
    this.isBackendAvailable = false; // Reset status
  }
}

export const pythonBackendService = new PythonBackendService();
