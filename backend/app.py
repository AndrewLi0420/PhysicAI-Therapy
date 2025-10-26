#!/usr/bin/env python3
"""
Physical Therapy Exercise Recommendation Backend
Provides intelligent exercise recommendations based on user profile and external exercise database
"""

import json
import requests
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@dataclass
class Exercise:
    id: str
    name: str
    force: Optional[str]
    level: str
    mechanic: Optional[str]
    equipment: Optional[str]
    primaryMuscles: List[str]
    secondaryMuscles: List[str]
    instructions: List[str]
    category: str
    images: List[str]

@dataclass
class UserProfile:
    pain_level: int  # 1-10
    mobility_level: int  # 1-10
    condition: str
    goals: List[str]

@dataclass
class RecommendationScore:
    exercise: Exercise
    score: float
    reasons: List[str]
    warnings: List[str]
    suitability: str

class ExerciseRecommendationEngine:
    def __init__(self):
        self.exercises: List[Exercise] = []
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.exercise_vectors = None
        self.load_exercises()
    
    def load_exercises(self):
        """Load exercises from external API"""
        try:
            logger.info("Loading exercises from external API...")
            response = requests.get('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')
            response.raise_for_status()
            
            raw_exercises = response.json()
            logger.info(f"Loaded {len(raw_exercises)} exercises from API")
            
            # Convert to our Exercise dataclass
            self.exercises = []
            for ex in raw_exercises:
                try:
                    exercise = Exercise(
                        id=str(ex['id']),
                        name=ex['name'],
                        force=ex.get('force'),
                        level=ex.get('level', 'beginner'),
                        mechanic=ex.get('mechanic'),
                        equipment=ex.get('equipment'),
                        primaryMuscles=ex.get('primaryMuscles', []),
                        secondaryMuscles=ex.get('secondaryMuscles', []),
                        instructions=ex.get('instructions', []),
                        category=ex.get('category', 'general'),
                        images=ex.get('images', [])
                    )
                    self.exercises.append(exercise)
                except Exception as e:
                    logger.warning(f"Failed to parse exercise {ex.get('id', 'unknown')}: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(self.exercises)} exercises")
            self._prepare_vectors()
            
        except Exception as e:
            logger.error(f"Failed to load exercises: {e}")
            raise
    
    def _prepare_vectors(self):
        """Prepare TF-IDF vectors for similarity matching"""
        try:
            # Create text representations of exercises
            exercise_texts = []
            for ex in self.exercises:
                text_parts = [
                    ex.name,
                    ex.category or '',
                    ex.equipment or '',
                    ' '.join(ex.primaryMuscles),
                    ' '.join(ex.secondaryMuscles),
                    ' '.join(ex.instructions)
                ]
                exercise_texts.append(' '.join(text_parts).lower())
            
            self.exercise_vectors = self.vectorizer.fit_transform(exercise_texts)
            logger.info("Prepared TF-IDF vectors for exercise matching")
            
        except Exception as e:
            logger.error(f"Failed to prepare vectors: {e}")
            raise
    
    def filter_pt_relevant(self) -> List[Exercise]:
        """Filter exercises for physical therapy relevance"""
        pt_categories = {
            'strength', 'stretching', 'cardio', 'plyometrics', 
            'strongman', 'olympic weightlifting', 'powerlifting'
        }
        
        pt_equipment = {
            'body only', 'dumbbell', 'resistance band', 'foam roll',
            'stability ball', 'medicine ball', 'kettlebell', 'barbell',
            'cable', 'e-z curl bar', 'other'
        }
        
        excluded_equipment = {
            'machine', 'leverage machine', 'sled machine', 'stepmill machine'
        }
        
        filtered = []
        for ex in self.exercises:
            # Check category
            if ex.category and ex.category.lower() not in pt_categories:
                continue
            
            # Check equipment
            if ex.equipment:
                if ex.equipment.lower() in excluded_equipment:
                    continue
                if ex.equipment.lower() not in pt_equipment:
                    continue
            
            filtered.append(ex)
        
        logger.info(f"Filtered to {len(filtered)} PT-relevant exercises from {len(self.exercises)} total")
        return filtered
    
    def calculate_intensity(self, exercise: Exercise) -> str:
        """Calculate exercise intensity based on characteristics"""
        name_lower = exercise.name.lower()
        category_lower = exercise.category.lower() if exercise.category else ''
        
        # Very high intensity
        if any(word in name_lower for word in ['jump', 'explosive', 'plyometric', 'sprint', 'burpee']):
            return 'very-high'
        
        # High intensity
        if any(word in name_lower for word in ['squat', 'deadlift', 'press', 'pull', 'push', 'weight', 'heavy']):
            return 'high'
        if category_lower in ['strength', 'powerlifting']:
            return 'high'
        
        # Moderate intensity
        if any(word in name_lower for word in ['bridge', 'plank', 'lunge', 'step', 'walk']):
            return 'moderate'
        if category_lower in ['cardio', 'olympic weightlifting']:
            return 'moderate'
        
        # Low intensity
        if any(word in name_lower for word in ['stretch', 'gentle', 'slow', 'breathing']):
            return 'low'
        if category_lower in ['stretching', 'flexibility', 'mobility']:
            return 'low'
        
        # Very low intensity
        if any(word in name_lower for word in ['passive', 'rest', 'meditation', 'mindfulness']):
            return 'very-low'
        
        # Default based on level
        level_map = {
            'beginner': 'low',
            'intermediate': 'moderate', 
            'advanced': 'high',
            'expert': 'very-high'
        }
        return level_map.get(exercise.level, 'moderate')
    
    def get_pain_suitability(self, exercise: Exercise, user_pain: int) -> Dict[str, Any]:
        """Determine pain level suitability"""
        intensity = self.calculate_intensity(exercise)
        
        intensity_ranges = {
            'very-low': {'min': 8, 'max': 10, 'optimal': [9, 10]},
            'low': {'min': 5, 'max': 10, 'optimal': [6, 7, 8]},
            'moderate': {'min': 2, 'max': 7, 'optimal': [3, 4, 5]},
            'high': {'min': 1, 'max': 4, 'optimal': [1, 2, 3]},
            'very-high': {'min': 1, 'max': 2, 'optimal': [1]}
        }
        
        return intensity_ranges.get(intensity, {'min': 1, 'max': 10, 'optimal': [5]})
    
    def get_mobility_suitability(self, exercise: Exercise, user_mobility: int) -> Dict[str, Any]:
        """Determine mobility level suitability"""
        intensity = self.calculate_intensity(exercise)
        category = exercise.category.lower() if exercise.category else ''
        
        # Special cases for mobility-focused exercises
        if category in ['stretching', 'mobility', 'flexibility']:
            return {'min': 1, 'max': 10, 'optimal': [2, 3, 4, 5]}
        
        if category == 'balance':
            return {'min': 3, 'max': 10, 'optimal': [4, 5, 6, 7]}
        
        if category == 'strength':
            return {'min': 4, 'max': 10, 'optimal': [5, 6, 7, 8]}
        
        if category == 'cardio':
            return {'min': 6, 'max': 10, 'optimal': [7, 8, 9, 10]}
        
        # Default based on intensity
        intensity_ranges = {
            'very-low': {'min': 1, 'max': 10, 'optimal': [2, 3, 4]},
            'low': {'min': 2, 'max': 10, 'optimal': [3, 4, 5]},
            'moderate': {'min': 4, 'max': 10, 'optimal': [5, 6, 7]},
            'high': {'min': 6, 'max': 10, 'optimal': [7, 8, 9]},
            'very-high': {'min': 8, 'max': 10, 'optimal': [9, 10]}
        }
        
        return intensity_ranges.get(intensity, {'min': 1, 'max': 10, 'optimal': [5]})
    
    def calculate_recommendation_score(self, exercise: Exercise, user: UserProfile) -> RecommendationScore:
        """Calculate comprehensive recommendation score"""
        reasons = []
        warnings = []
        score = 0.0
        
        # Pain level scoring (40% weight)
        pain_suitability = self.get_pain_suitability(exercise, user.pain_level)
        if pain_suitability['min'] <= user.pain_level <= pain_suitability['max']:
            pain_score = 0.8
            reasons.append(f"Suitable for your pain level ({user.pain_level}/10)")
            
            if user.pain_level in pain_suitability['optimal']:
                pain_score = 1.0
                reasons.append("Optimal for your current pain level")
        else:
            pain_score = 0.1
            warnings.append(f"May not be suitable for your pain level ({user.pain_level}/10)")
        
        score += pain_score * 0.4
        
        # Mobility level scoring (30% weight)
        mobility_suitability = self.get_mobility_suitability(exercise, user.mobility_level)
        if mobility_suitability['min'] <= user.mobility_level <= mobility_suitability['max']:
            mobility_score = 0.8
            reasons.append(f"Appropriate for your mobility level ({user.mobility_level}/10)")
            
            if user.mobility_level in mobility_suitability['optimal']:
                mobility_score = 1.0
                reasons.append("Perfect match for your mobility level")
        else:
            mobility_score = 0.1
            warnings.append(f"May be too challenging for your mobility level ({user.mobility_level}/10)")
        
        score += mobility_score * 0.3
        
        # Condition matching (20% weight)
        condition_lower = user.condition.lower()
        all_muscles = exercise.primaryMuscles + exercise.secondaryMuscles
        condition_score = 0.5  # Default neutral score
        
        for muscle in all_muscles:
            if condition_lower in muscle.lower() or muscle.lower() in condition_lower:
                condition_score = 1.0
                reasons.append(f"Specifically targets your {user.condition} condition")
                break
        
        score += condition_score * 0.2
        
        # Therapeutic benefits (10% weight)
        benefits = self.get_therapeutic_benefits(exercise)
        benefit_score = min(len(benefits) * 0.2, 1.0)
        if benefits:
            reasons.append(f"Provides {len(benefits)} therapeutic benefit{'s' if len(benefits) > 1 else ''}")
        
        score += benefit_score * 0.1
        
        # Determine suitability
        if score >= 0.9:
            suitability = 'excellent'
        elif score >= 0.7:
            suitability = 'good'
        elif score >= 0.5:
            suitability = 'moderate'
        elif score >= 0.3:
            suitability = 'poor'
        else:
            suitability = 'contraindicated'
        
        return RecommendationScore(
            exercise=exercise,
            score=round(score, 2),
            reasons=reasons,
            warnings=warnings,
            suitability=suitability
        )
    
    def get_therapeutic_benefits(self, exercise: Exercise) -> List[str]:
        """Get therapeutic benefits for an exercise"""
        benefits = []
        name_lower = exercise.name.lower()
        category = exercise.category.lower() if exercise.category else ''
        
        if category == 'stretching' or 'stretch' in name_lower:
            benefits.extend(['improves flexibility', 'reduces muscle tension', 'increases range of motion'])
        
        if category == 'mobility' or 'mobility' in name_lower:
            benefits.extend(['enhances joint mobility', 'improves movement quality', 'reduces stiffness'])
        
        if category == 'strength' or 'strength' in name_lower:
            benefits.extend(['builds muscle strength', 'improves stability', 'supports joint health'])
        
        if category == 'balance' or 'balance' in name_lower:
            benefits.extend(['improves balance', 'enhances proprioception', 'reduces fall risk'])
        
        if category == 'cardio' or 'cardio' in name_lower:
            benefits.extend(['improves cardiovascular health', 'increases endurance', 'boosts energy'])
        
        if 'gentle' in name_lower or 'soft' in name_lower:
            benefits.extend(['pain relief', 'muscle relaxation', 'stress reduction'])
        
        return benefits
    
    def get_recommendations(self, user: UserProfile, limit: int = 10) -> List[RecommendationScore]:
        """Get personalized exercise recommendations"""
        logger.info(f"Getting recommendations for user: pain={user.pain_level}, mobility={user.mobility_level}, condition={user.condition}")
        
        # Filter for PT-relevant exercises
        pt_exercises = self.filter_pt_relevant()
        logger.info(f"Using {len(pt_exercises)} PT-relevant exercises for recommendations")
        
        # Calculate scores for all exercises
        scored_exercises = []
        for exercise in pt_exercises:
            score = self.calculate_recommendation_score(exercise, user)
            scored_exercises.append(score)
        
        # Filter out contraindicated exercises
        safe_exercises = [s for s in scored_exercises if s.suitability != 'contraindicated']
        logger.info(f"Filtered to {len(safe_exercises)} safe exercises")
        
        # Sort by score (highest first)
        safe_exercises.sort(key=lambda x: x.score, reverse=True)
        
        # Return top recommendations
        recommendations = safe_exercises[:limit]
        logger.info(f"Returning {len(recommendations)} top recommendations")
        
        return recommendations
    
    def get_stretching_recommendations(self, user: UserProfile, limit: int = 8) -> List[RecommendationScore]:
        """Get stretching-specific recommendations"""
        pt_exercises = self.filter_pt_relevant()
        
        # Filter for stretching exercises
        stretching_exercises = []
        for ex in pt_exercises:
            category = ex.category.lower() if ex.category else ''
            name_lower = ex.name.lower()
            
            if category in ['stretching', 'flexibility', 'mobility'] or 'stretch' in name_lower:
                stretching_exercises.append(ex)
        
        logger.info(f"Found {len(stretching_exercises)} stretching exercises")
        
        # Calculate scores
        scored_exercises = []
        for exercise in stretching_exercises:
            score = self.calculate_recommendation_score(exercise, user)
            scored_exercises.append(score)
        
        # Filter and sort
        safe_exercises = [s for s in scored_exercises if s.suitability != 'contraindicated']
        safe_exercises.sort(key=lambda x: x.score, reverse=True)
        
        return safe_exercises[:limit]

# Initialize the recommendation engine
engine = ExerciseRecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'exercises_loaded': len(engine.exercises),
        'pt_exercises': len(engine.filter_pt_relevant())
    })

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get personalized exercise recommendations"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['pain_level', 'mobility_level', 'condition']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create user profile
        user = UserProfile(
            pain_level=int(data['pain_level']),
            mobility_level=int(data['mobility_level']),
            condition=data['condition'],
            goals=data.get('goals', [])
        )
        
        # Validate ranges
        if not (1 <= user.pain_level <= 10):
            return jsonify({'error': 'Pain level must be between 1 and 10'}), 400
        
        if not (1 <= user.mobility_level <= 10):
            return jsonify({'error': 'Mobility level must be between 1 and 10'}), 400
        
        # Get recommendations
        limit = data.get('limit', 10)
        recommendations = engine.get_recommendations(user, limit)
        
        # Convert to JSON-serializable format
        result = []
        for rec in recommendations:
            result.append({
                'exercise': asdict(rec.exercise),
                'score': rec.score,
                'reasons': rec.reasons,
                'warnings': rec.warnings,
                'suitability': rec.suitability
            })
        
        return jsonify({
            'recommendations': result,
            'total_exercises': len(engine.exercises),
            'pt_exercises': len(engine.filter_pt_relevant())
        })
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/stretching', methods=['POST'])
def get_stretching_recommendations():
    """Get stretching-specific recommendations"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['pain_level', 'mobility_level', 'condition']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create user profile
        user = UserProfile(
            pain_level=int(data['pain_level']),
            mobility_level=int(data['mobility_level']),
            condition=data['condition'],
            goals=data.get('goals', [])
        )
        
        # Get stretching recommendations
        limit = data.get('limit', 8)
        recommendations = engine.get_stretching_recommendations(user, limit)
        
        # Convert to JSON-serializable format
        result = []
        for rec in recommendations:
            result.append({
                'exercise': asdict(rec.exercise),
                'score': rec.score,
                'reasons': rec.reasons,
                'warnings': rec.warnings,
                'suitability': rec.suitability
            })
        
        return jsonify({
            'recommendations': result,
            'total_stretching_exercises': len([ex for ex in engine.filter_pt_relevant() 
                                             if ex.category and ex.category.lower() in ['stretching', 'flexibility', 'mobility']])
        })
        
    except Exception as e:
        logger.error(f"Error getting stretching recommendations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/exercises', methods=['GET'])
def get_all_exercises():
    """Get all PT-relevant exercises"""
    try:
        pt_exercises = engine.filter_pt_relevant()
        
        # Convert to JSON-serializable format
        exercises = [asdict(ex) for ex in pt_exercises]
        
        return jsonify({
            'exercises': exercises,
            'total': len(exercises)
        })
        
    except Exception as e:
        logger.error(f"Error getting exercises: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Physical Therapy Exercise Recommendation Backend...")
    app.run(debug=True, host='0.0.0.0', port=5001)
