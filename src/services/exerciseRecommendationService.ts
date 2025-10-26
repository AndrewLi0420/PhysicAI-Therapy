import { Exercise } from '../App';
import { ExternalExercise } from './exerciseService';

// Exercise intensity levels
export type ExerciseIntensity = 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';

// Pain level ranges (1-10 scale)
export type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Mobility level ranges (1-10 scale)
export type MobilityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Exercise categories with intensity mapping
export type ExerciseCategory = 
  | 'stretching' 
  | 'mobility' 
  | 'strength' 
  | 'balance' 
  | 'cardio' 
  | 'flexibility'
  | 'rehabilitation'
  | 'therapeutic';

// Exercise contraindications
export interface ExerciseContraindications {
  painLevels: PainLevel[];
  mobilityLevels: MobilityLevel[];
  conditions: string[];
  bodyParts: string[];
}

// Enhanced exercise interface with recommendation data
export interface EnhancedExercise extends Exercise {
  intensity: ExerciseIntensity;
  category: ExerciseCategory;
  painLevelSuitability: {
    min: PainLevel;
    max: PainLevel;
    optimal: PainLevel[];
  };
  mobilityLevelSuitability: {
    min: MobilityLevel;
    max: MobilityLevel;
    optimal: MobilityLevel[];
  };
  contraindications: ExerciseContraindications;
  therapeuticBenefits: string[];
  progressionLevel: number; // 1-5 scale for exercise progression
  timeToBenefit: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}

// Recommendation scoring system
export interface RecommendationScore {
  exercise: EnhancedExercise;
  score: number;
  reasons: string[];
  warnings: string[];
  suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'contraindicated';
}

class ExerciseRecommendationService {
  // Intensity mapping based on exercise characteristics
  private getExerciseIntensity(exercise: Exercise | ExternalExercise): ExerciseIntensity {
    const name = exercise.name.toLowerCase();
    const description = exercise.description?.toLowerCase() || '';
    const instructions = 'instructions' in exercise ? exercise.instructions.join(' ').toLowerCase() : '';
    const category = 'category' in exercise ? exercise.category?.toLowerCase() : '';
    
    // Very high intensity indicators
    if (name.includes('jump') || name.includes('explosive') || name.includes('plyometric') ||
        name.includes('sprint') || name.includes('burpee') || name.includes('high intensity')) {
      return 'very-high';
    }
    
    // High intensity indicators
    if (name.includes('squat') || name.includes('deadlift') || name.includes('press') ||
        name.includes('pull') || name.includes('push') || name.includes('weight') ||
        name.includes('heavy') || category === 'strength' || category === 'powerlifting') {
      return 'high';
    }
    
    // Moderate intensity indicators
    if (name.includes('bridge') || name.includes('plank') || name.includes('lunge') ||
        name.includes('step') || name.includes('walk') || name.includes('moderate') ||
        category === 'cardio' || category === 'olympic weightlifting') {
      return 'moderate';
    }
    
    // Low intensity indicators
    if (name.includes('stretch') || name.includes('gentle') || name.includes('slow') ||
        name.includes('breathing') || name.includes('relaxation') || category === 'stretching' ||
        category === 'flexibility' || category === 'mobility') {
      return 'low';
    }
    
    // Very low intensity indicators
    if (name.includes('passive') || name.includes('rest') || name.includes('meditation') ||
        name.includes('breathing') || name.includes('mindfulness') || 
        description.includes('gentle') || description.includes('passive')) {
      return 'very-low';
    }
    
    // Default based on difficulty level
    switch (exercise.difficulty) {
      case 'beginner': return 'low';
      case 'intermediate': return 'moderate';
      case 'advanced': return 'high';
      case 'expert': return 'very-high';
      default: return 'moderate';
    }
  }

  // Map exercise categories
  private getExerciseCategory(exercise: Exercise | ExternalExercise): ExerciseCategory {
    const category = 'category' in exercise ? exercise.category?.toLowerCase() : '';
    const name = exercise.name.toLowerCase();
    
    if (category === 'stretching' || name.includes('stretch')) return 'stretching';
    if (category === 'mobility' || name.includes('mobility') || name.includes('range of motion')) return 'mobility';
    if (category === 'strength' || name.includes('strength') || name.includes('strengthen')) return 'strength';
    if (category === 'balance' || name.includes('balance') || name.includes('stability')) return 'balance';
    if (category === 'cardio' || name.includes('cardio') || name.includes('aerobic')) return 'cardio';
    if (category === 'flexibility' || name.includes('flexibility') || name.includes('flexible')) return 'flexibility';
    
    return 'therapeutic';
  }

  // Determine pain level suitability
  private getPainLevelSuitability(exercise: Exercise | ExternalExercise, intensity: ExerciseIntensity) {
    const name = exercise.name.toLowerCase();
    const description = exercise.description?.toLowerCase() || '';
    
    // Very low intensity - suitable for high pain levels
    if (intensity === 'very-low') {
      return {
        min: 8 as PainLevel,
        max: 10 as PainLevel,
        optimal: [9, 10] as PainLevel[]
      };
    }
    
    // Low intensity - suitable for moderate to high pain levels
    if (intensity === 'low') {
      return {
        min: 5 as PainLevel,
        max: 10 as PainLevel,
        optimal: [6, 7, 8] as PainLevel[]
      };
    }
    
    // Moderate intensity - suitable for low to moderate pain levels
    if (intensity === 'moderate') {
      return {
        min: 2 as PainLevel,
        max: 7 as PainLevel,
        optimal: [3, 4, 5] as PainLevel[]
      };
    }
    
    // High intensity - suitable for very low pain levels
    if (intensity === 'high') {
      return {
        min: 1 as PainLevel,
        max: 4 as PainLevel,
        optimal: [1, 2, 3] as PainLevel[]
      };
    }
    
    // Very high intensity - only for minimal pain
    return {
      min: 1 as PainLevel,
      max: 2 as PainLevel,
      optimal: [1] as PainLevel[]
    };
  }

  // Determine mobility level suitability
  private getMobilityLevelSuitability(exercise: Exercise | ExternalExercise, intensity: ExerciseIntensity) {
    const name = exercise.name.toLowerCase();
    const category = this.getExerciseCategory(exercise);
    
    // Stretching and mobility exercises - suitable for low mobility
    if (category === 'stretching' || category === 'mobility' || category === 'flexibility') {
      return {
        min: 1 as MobilityLevel,
        max: 10 as MobilityLevel,
        optimal: [2, 3, 4, 5] as MobilityLevel[]
      };
    }
    
    // Balance exercises - require some mobility
    if (category === 'balance') {
      return {
        min: 3 as MobilityLevel,
        max: 10 as MobilityLevel,
        optimal: [4, 5, 6, 7] as MobilityLevel[]
      };
    }
    
    // Strength exercises - require moderate to high mobility
    if (category === 'strength') {
      return {
        min: 4 as MobilityLevel,
        max: 10 as MobilityLevel,
        optimal: [5, 6, 7, 8] as MobilityLevel[]
      };
    }
    
    // Cardio exercises - require high mobility
    if (category === 'cardio') {
      return {
        min: 6 as MobilityLevel,
        max: 10 as MobilityLevel,
        optimal: [7, 8, 9, 10] as MobilityLevel[]
      };
    }
    
    // Default based on intensity
    switch (intensity) {
      case 'very-low': return { min: 1 as MobilityLevel, max: 10 as MobilityLevel, optimal: [2, 3, 4] as MobilityLevel[] };
      case 'low': return { min: 2 as MobilityLevel, max: 10 as MobilityLevel, optimal: [3, 4, 5] as MobilityLevel[] };
      case 'moderate': return { min: 4 as MobilityLevel, max: 10 as MobilityLevel, optimal: [5, 6, 7] as MobilityLevel[] };
      case 'high': return { min: 6 as MobilityLevel, max: 10 as MobilityLevel, optimal: [7, 8, 9] as MobilityLevel[] };
      case 'very-high': return { min: 8 as MobilityLevel, max: 10 as MobilityLevel, optimal: [9, 10] as MobilityLevel[] };
    }
  }

  // Get contraindications for exercises
  private getContraindications(exercise: Exercise | ExternalExercise): ExerciseContraindications {
    const name = exercise.name.toLowerCase();
    const bodyParts = 'bodyParts' in exercise ? exercise.bodyParts : [];
    
    const contraindications: ExerciseContraindications = {
      painLevels: [],
      mobilityLevels: [],
      conditions: [],
      bodyParts: []
    };
    
    // High impact exercises contraindicated for high pain
    if (name.includes('jump') || name.includes('impact') || name.includes('plyometric')) {
      contraindications.painLevels.push(6, 7, 8, 9, 10);
    }
    
    // Twisting exercises contraindicated for back pain
    if (name.includes('twist') || name.includes('rotation') || name.includes('spinal')) {
      contraindications.conditions.push('back pain', 'spinal injury', 'disc herniation');
    }
    
    // Weight-bearing exercises contraindicated for joint issues
    if (name.includes('squat') || name.includes('lunge') || name.includes('step')) {
      contraindications.conditions.push('knee injury', 'ankle injury', 'joint replacement');
    }
    
    // Overhead exercises contraindicated for shoulder issues
    if (name.includes('overhead') || name.includes('press') || name.includes('raise')) {
      contraindications.conditions.push('shoulder impingement', 'rotator cuff injury', 'frozen shoulder');
    }
    
    return contraindications;
  }

  // Get therapeutic benefits
  private getTherapeuticBenefits(exercise: Exercise | ExternalExercise): string[] {
    const name = exercise.name.toLowerCase();
    const category = this.getExerciseCategory(exercise);
    const benefits: string[] = [];
    
    // Stretching benefits
    if (category === 'stretching' || name.includes('stretch')) {
      benefits.push('improves flexibility', 'reduces muscle tension', 'increases range of motion');
    }
    
    // Mobility benefits
    if (category === 'mobility' || name.includes('mobility')) {
      benefits.push('enhances joint mobility', 'improves movement quality', 'reduces stiffness');
    }
    
    // Strength benefits
    if (category === 'strength' || name.includes('strength')) {
      benefits.push('builds muscle strength', 'improves stability', 'supports joint health');
    }
    
    // Balance benefits
    if (category === 'balance' || name.includes('balance')) {
      benefits.push('improves balance', 'enhances proprioception', 'reduces fall risk');
    }
    
    // Cardio benefits
    if (category === 'cardio' || name.includes('cardio')) {
      benefits.push('improves cardiovascular health', 'increases endurance', 'boosts energy');
    }
    
    // Pain-specific benefits
    if (name.includes('gentle') || name.includes('soft')) {
      benefits.push('pain relief', 'muscle relaxation', 'stress reduction');
    }
    
    return benefits;
  }

  // Convert external exercise to enhanced exercise
  private convertToEnhancedExercise(exercise: Exercise | ExternalExercise): EnhancedExercise {
    const intensity = this.getExerciseIntensity(exercise);
    const category = this.getExerciseCategory(exercise);
    
    return {
      ...exercise,
      intensity,
      category,
      painLevelSuitability: this.getPainLevelSuitability(exercise, intensity),
      mobilityLevelSuitability: this.getMobilityLevelSuitability(exercise, intensity),
      contraindications: this.getContraindications(exercise),
      therapeuticBenefits: this.getTherapeuticBenefits(exercise),
      progressionLevel: this.getProgressionLevel(exercise, intensity),
      timeToBenefit: this.getTimeToBenefit(intensity, category)
    };
  }

  // Get progression level (1-5 scale)
  private getProgressionLevel(exercise: Exercise | ExternalExercise, intensity: ExerciseIntensity): number {
    switch (intensity) {
      case 'very-low': return 1;
      case 'low': return 2;
      case 'moderate': return 3;
      case 'high': return 4;
      case 'very-high': return 5;
    }
  }

  // Get time to benefit
  private getTimeToBenefit(intensity: ExerciseIntensity, category: ExerciseCategory): 'immediate' | 'short-term' | 'medium-term' | 'long-term' {
    if (category === 'stretching' || category === 'mobility') return 'immediate';
    if (intensity === 'very-low' || intensity === 'low') return 'short-term';
    if (intensity === 'moderate') return 'medium-term';
    return 'long-term';
  }

  // Calculate recommendation score
  private calculateScore(
    exercise: EnhancedExercise, 
    userPainLevel: PainLevel, 
    userMobilityLevel: MobilityLevel,
    userCondition: string
  ): RecommendationScore {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    // Pain level scoring (40% of total score)
    const painScore = this.calculatePainScore(exercise, userPainLevel);
    score += painScore.score * 0.4;
    reasons.push(...painScore.reasons);
    warnings.push(...painScore.warnings);
    
    // Mobility level scoring (30% of total score)
    const mobilityScore = this.calculateMobilityScore(exercise, userMobilityLevel);
    score += mobilityScore.score * 0.3;
    reasons.push(...mobilityScore.reasons);
    warnings.push(...mobilityScore.warnings);
    
    // Condition matching scoring (20% of total score)
    const conditionScore = this.calculateConditionScore(exercise, userCondition);
    score += conditionScore.score * 0.2;
    reasons.push(...conditionScore.reasons);
    warnings.push(...conditionScore.warnings);
    
    // Therapeutic benefit scoring (10% of total score)
    const benefitScore = this.calculateBenefitScore(exercise);
    score += benefitScore.score * 0.1;
    reasons.push(...benefitScore.reasons);
    
    // Determine suitability
    let suitability: 'excellent' | 'good' | 'moderate' | 'poor' | 'contraindicated';
    if (score >= 0.9) suitability = 'excellent';
    else if (score >= 0.7) suitability = 'good';
    else if (score >= 0.5) suitability = 'moderate';
    else if (score >= 0.3) suitability = 'poor';
    else suitability = 'contraindicated';
    
    return {
      exercise,
      score: Math.round(score * 100) / 100,
      reasons,
      warnings,
      suitability
    };
  }

  // Calculate pain level score
  private calculatePainScore(exercise: EnhancedExercise, userPainLevel: PainLevel) {
    const { min, max, optimal } = exercise.painLevelSuitability;
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    // Check if within suitable range
    if (userPainLevel >= min && userPainLevel <= max) {
      score = 0.8; // Base score for being in range
      reasons.push(`Suitable for your pain level (${userPainLevel}/10)`);
      
      // Bonus for being in optimal range
      if (optimal.includes(userPainLevel)) {
        score = 1.0;
        reasons.push(`Optimal for your current pain level`);
      }
    } else {
      score = 0.1; // Very low score for being outside range
      warnings.push(`May not be suitable for your current pain level (${userPainLevel}/10)`);
    }
    
    // Check contraindications
    if (exercise.contraindications.painLevels.includes(userPainLevel)) {
      score = 0;
      warnings.push(`Contraindicated for your pain level`);
    }
    
    return { score, reasons, warnings };
  }

  // Calculate mobility level score
  private calculateMobilityScore(exercise: EnhancedExercise, userMobilityLevel: MobilityLevel) {
    const { min, max, optimal } = exercise.mobilityLevelSuitability;
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    // Check if within suitable range
    if (userMobilityLevel >= min && userMobilityLevel <= max) {
      score = 0.8; // Base score for being in range
      reasons.push(`Appropriate for your mobility level (${userMobilityLevel}/10)`);
      
      // Bonus for being in optimal range
      if (optimal.includes(userMobilityLevel)) {
        score = 1.0;
        reasons.push(`Perfect match for your mobility level`);
      }
    } else {
      score = 0.1; // Very low score for being outside range
      warnings.push(`May be too challenging for your mobility level (${userMobilityLevel}/10)`);
    }
    
    return { score, reasons, warnings };
  }

  // Calculate condition matching score
  private calculateConditionScore(exercise: EnhancedExercise, userCondition: string) {
    let score = 0;
    const reasons: string[] = [];
    
    const conditionLower = userCondition.toLowerCase();
    const bodyParts = exercise.bodyParts.map(part => part.toLowerCase());
    
    // Check if exercise targets the user's condition
    if (bodyParts.some(part => part.includes(conditionLower) || conditionLower.includes(part))) {
      score = 1.0;
      reasons.push(`Specifically targets your ${userCondition} condition`);
    } else {
      score = 0.5; // Neutral score for general exercises
      reasons.push(`General therapeutic exercise`);
    }
    
    // Check contraindications
    if (exercise.contraindications.conditions.some(condition => 
        conditionLower.includes(condition.toLowerCase()))) {
      score = 0;
      reasons.push(`Not recommended for your condition`);
    }
    
    return { score, reasons, warnings: [] };
  }

  // Calculate therapeutic benefit score
  private calculateBenefitScore(exercise: EnhancedExercise) {
    const reasons: string[] = [];
    
    // Higher score for more therapeutic benefits
    const benefitCount = exercise.therapeuticBenefits.length;
    const score = Math.min(benefitCount * 0.2, 1.0);
    
    if (benefitCount > 0) {
      reasons.push(`Provides ${benefitCount} therapeutic benefit${benefitCount > 1 ? 's' : ''}`);
    }
    
    return { score, reasons, warnings: [] };
  }

  // Main recommendation method
  public getRecommendations(
    exercises: (Exercise | ExternalExercise)[],
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string,
    limit: number = 10
  ): RecommendationScore[] {
    console.log('🧠 Starting recommendation algorithm...');
    console.log('📊 Input exercises:', exercises.length);
    console.log('👤 User profile:', { userPainLevel, userMobilityLevel, userCondition });
    
    // Convert all exercises to enhanced format
    const enhancedExercises = exercises.map(ex => this.convertToEnhancedExercise(ex));
    console.log('✨ Enhanced exercises:', enhancedExercises.length);
    
    // Calculate scores for all exercises
    const scoredExercises = enhancedExercises.map(exercise => 
      this.calculateScore(exercise, userPainLevel, userMobilityLevel, userCondition)
    );
    console.log('📈 Scored exercises:', scoredExercises.length);
    
    // Filter out contraindicated exercises
    const safeExercises = scoredExercises.filter(rec => rec.suitability !== 'contraindicated');
    console.log('🛡️ Safe exercises after filtering:', safeExercises.length);
    
    // Sort by score (highest first)
    const sortedExercises = safeExercises.sort((a, b) => b.score - a.score);
    console.log('🏆 Top 3 scores:', sortedExercises.slice(0, 3).map(s => ({ name: s.exercise.name, score: s.score })));
    
    // Return top recommendations
    const finalRecommendations = sortedExercises.slice(0, limit);
    console.log('✅ Final recommendations:', finalRecommendations.length);
    
    return finalRecommendations;
  }

  // Get exercises by category with pain/mobility filtering
  public getExercisesByCategory(
    exercises: (Exercise | ExternalExercise)[],
    category: ExerciseCategory,
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string
  ): RecommendationScore[] {
    const enhancedExercises = exercises.map(ex => this.convertToEnhancedExercise(ex));
    const categoryExercises = enhancedExercises.filter(ex => ex.category === category);
    
    return this.getRecommendations(
      categoryExercises,
      userPainLevel,
      userMobilityLevel,
      userCondition,
      20
    );
  }

  // Get stretching recommendations based on mobility
  public getStretchingRecommendations(
    exercises: (Exercise | ExternalExercise)[],
    userPainLevel: PainLevel,
    userMobilityLevel: MobilityLevel,
    userCondition: string
  ): RecommendationScore[] {
    const stretchingExercises = exercises.filter(ex => {
      const category = 'category' in ex ? ex.category?.toLowerCase() : '';
      const name = ex.name.toLowerCase();
      return category === 'stretching' || category === 'flexibility' || 
             category === 'mobility' || name.includes('stretch');
    });
    
    return this.getRecommendations(
      stretchingExercises,
      userPainLevel,
      userMobilityLevel,
      userCondition,
      15
    );
  }
}

export const exerciseRecommendationService = new ExerciseRecommendationService();
