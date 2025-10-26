// Exercise service for fetching from free-exercise-db API
import { Exercise } from '../App';
import { exerciseRecommendationService, RecommendationScore, PainLevel, MobilityLevel } from './exerciseRecommendationService';

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

export interface ExerciseFilters {
  category?: string;
  level?: string;
  equipment?: string;
  primaryMuscles?: string[];
  searchTerm?: string;
}

class ExerciseService {
  private baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';
  private exercisesCache: ExternalExercise[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async getAllExercises(): Promise<ExternalExercise[]> {
    // Force fresh API call - ignore cache for testing
    // if (this.exercisesCache && this.cacheTimestamp && 
    //     Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
    //   return this.exercisesCache;
    // }

    try {
      console.log('🔄 Fetching exercises from API...', `${this.baseUrl}/dist/exercises.json`);
      const response = await fetch(`${this.baseUrl}/dist/exercises.json`);
      console.log('📡 API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.statusText}`);
      }
      
      const exercises = await response.json();
      console.log('✅ Successfully parsed exercises:', exercises.length, 'total');
      console.log('📋 First exercise sample:', exercises[0]);
      
      this.exercisesCache = exercises;
      this.cacheTimestamp = Date.now();
      
      console.log(`🎉 Successfully fetched ${exercises.length} exercises from API`);
      
      // Store in localStorage as backup
      localStorage.setItem('externalExercises', JSON.stringify(exercises));
      localStorage.setItem('externalExercisesTimestamp', this.cacheTimestamp.toString());
      
      return exercises;
    } catch (error) {
      console.error('Error fetching exercises from API:', error);
      
      // Try to load from localStorage as fallback
      const cachedExercises = localStorage.getItem('externalExercises');
      const cachedTimestamp = localStorage.getItem('externalExercisesTimestamp');
      
      if (cachedExercises && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          this.exercisesCache = JSON.parse(cachedExercises);
          this.cacheTimestamp = timestamp;
          return this.exercisesCache!;
        }
      }
      
      throw error;
    }
  }

  async getPhysicalTherapyExercises(): Promise<ExternalExercise[]> {
    console.log('🔍 Starting PT exercise filtering...');
    const allExercises = await this.getAllExercises();
    console.log('📊 Total exercises to filter:', allExercises.length);
    
    // Filter for physical therapy relevant exercises
    const ptRelevantCategories = [
      'strength',
      'stretching',
      'cardio',
      'plyometrics',
      'strongman',
      'olympic weightlifting',
      'powerlifting'
    ];

    const ptRelevantEquipment = [
      'body only',
      'dumbbell',
      'resistance band',
      'foam roll',
      'stability ball',
      'medicine ball',
      'kettlebell',
      'barbell',
      'cable',
      'e-z curl bar',
      'other'
    ];

    console.log('🎯 PT relevant categories:', ptRelevantCategories);
    console.log('🏋️ PT relevant equipment:', ptRelevantEquipment);

    const filteredExercises = allExercises.filter(exercise => {
      // Filter by category
      const hasRelevantCategory = ptRelevantCategories.includes(exercise.category?.toLowerCase() || '');
      
      // Filter by equipment (exclude heavy gym equipment)
      const hasRelevantEquipment = !exercise.equipment || 
        ptRelevantEquipment.includes(exercise.equipment.toLowerCase());
      
      // Filter out exercises that require heavy equipment
      const excludesHeavyEquipment = !exercise.equipment || 
        !['machine', 'leverage machine', 'sled machine', 'stepmill machine'].includes(exercise.equipment.toLowerCase());
      
      return hasRelevantCategory && hasRelevantEquipment && excludesHeavyEquipment;
    });
    
    console.log(`✅ Filtered ${filteredExercises.length} PT-relevant exercises from ${allExercises.length} total`);
    console.log('📋 Sample PT exercises:', filteredExercises.slice(0, 3).map(e => e.name));
    
    return filteredExercises;
  }

  async searchExercises(filters: ExerciseFilters): Promise<ExternalExercise[]> {
    const exercises = await this.getPhysicalTherapyExercises();
    
    return exercises.filter(exercise => {
      // Category filter
      if (filters.category && exercise.category?.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
      
      // Level filter
      if (filters.level && exercise.level !== filters.level) {
        return false;
      }
      
      // Equipment filter
      if (filters.equipment && exercise.equipment?.toLowerCase() !== filters.equipment.toLowerCase()) {
        return false;
      }
      
      // Primary muscles filter
      if (filters.primaryMuscles && filters.primaryMuscles.length > 0) {
        const hasMatchingMuscle = filters.primaryMuscles.some(muscle => 
          exercise.primaryMuscles.some(primaryMuscle => 
            primaryMuscle.toLowerCase().includes(muscle.toLowerCase())
          )
        );
        if (!hasMatchingMuscle) return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = exercise.name.toLowerCase().includes(searchLower);
        const matchesInstructions = exercise.instructions.some(instruction => 
          instruction.toLowerCase().includes(searchLower)
        );
        const matchesMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles]
          .some(muscle => muscle.toLowerCase().includes(searchLower));
        
        if (!matchesName && !matchesInstructions && !matchesMuscles) {
          return false;
        }
      }
      
      return true;
    });
  }

  getImageUrl(imagePath: string): string {
    return `${this.baseUrl}/exercises/${imagePath}`;
  }

  // Clear all cached data to force fresh API calls
  clearCache(): void {
    this.exercisesCache = null;
    this.cacheTimestamp = null;
    localStorage.removeItem('externalExercises');
    localStorage.removeItem('externalExercisesTimestamp');
    console.log('Cache cleared - next API call will be fresh');
  }

  getUniqueCategories(exercises: ExternalExercise[]): string[] {
    const categories = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.category) {
        categories.add(exercise.category);
      }
    });
    return Array.from(categories).sort();
  }

  getUniqueEquipment(exercises: ExternalExercise[]): string[] {
    const equipment = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.equipment) {
        equipment.add(exercise.equipment);
      }
    });
    return Array.from(equipment).sort();
  }

  getUniqueMuscles(exercises: ExternalExercise[]): string[] {
    const muscles = new Set<string>();
    exercises.forEach(exercise => {
      exercise.primaryMuscles.forEach(muscle => muscles.add(muscle));
      exercise.secondaryMuscles.forEach(muscle => muscles.add(muscle));
    });
    return Array.from(muscles).sort();
  }

  // Get personalized recommendations based on user profile
  async getPersonalizedRecommendations(
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string,
    builtInExercises: Exercise[] = [],
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    console.log('🎯 Starting personalized recommendations...');
    console.log('👤 User profile:', { userPainLevel, userMobilityLevel, userCondition });
    
    const allExercises = await this.getAllExercises();
    const ptExercises = await this.getPhysicalTherapyExercises();
    
    // Use ONLY external exercises from API (ignore built-in exercises)
    const combinedExercises = [
      ...ptExercises,
    ];
    
    console.log(`🔄 Using ONLY external exercises: ${combinedExercises.length} total (${builtInExercises.length} built-in ignored, ${ptExercises.length} external used)`);
    console.log('📋 Sample exercises for recommendations:', combinedExercises.slice(0, 3).map(e => e.name));
    
    const recommendations = await exerciseRecommendationService.getRecommendations(
      combinedExercises,
      userPainLevel,
      userMobilityLevel,
      userCondition,
      limit
    );
    
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    console.log('🏆 Top recommendations:', recommendations.slice(0, 3).map(r => ({ name: r.exercise.name, score: r.score })));
    
    return recommendations;
  }

  // Get stretching recommendations based on mobility
  async getStretchingRecommendations(
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string,
    limit: number = 15
  ): Promise<RecommendationScore[]> {
    const allExercises = await this.getAllExercises();
    
    return exerciseRecommendationService.getStretchingRecommendations(
      allExercises,
      userPainLevel,
      userMobilityLevel,
      userCondition
    );
  }

  // Get exercises by category with personalization
  async getExercisesByCategory(
    category: string,
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    const allExercises = await this.getAllExercises();
    
    return exerciseRecommendationService.getExercisesByCategory(
      allExercises,
      category as any, // Type assertion for category
      userPainLevel,
      userMobilityLevel,
      userCondition
    );
  }

  // Get exercise recommendations for specific body part
  async getBodyPartRecommendations(
    bodyPart: string,
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string,
    limit: number = 15
  ): Promise<RecommendationScore[]> {
    const allExercises = await this.getAllExercises();
    
    // Filter exercises that target the specific body part
    const bodyPartExercises = allExercises.filter(exercise => {
      const allMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
      return allMuscles.some(muscle => 
        muscle.toLowerCase().includes(bodyPart.toLowerCase()) ||
        bodyPart.toLowerCase().includes(muscle.toLowerCase())
      );
    });
    
    return exerciseRecommendationService.getRecommendations(
      bodyPartExercises,
      userPainLevel,
      userMobilityLevel,
      userCondition,
      limit
    );
  }
}

export const exerciseService = new ExerciseService();
