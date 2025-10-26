import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { exerciseService, ExternalExercise, ExerciseFilters } from '../services/exerciseService';
import { Exercise } from '../App';

interface ExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

export function ExerciseLibrary({ onSelectExercise, onBack }: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<ExternalExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExternalExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExerciseFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const exercisesPerPage = 12;
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const startIndex = (currentPage - 1) * exercisesPerPage;
  const endIndex = startIndex + exercisesPerPage;
  const currentExercises = filteredExercises.slice(startIndex, endIndex);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exercises, filters]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const ptExercises = await exerciseService.getPhysicalTherapyExercises();
      setExercises(ptExercises);
    } catch (err) {
      setError('Failed to load exercises. Please try again later.');
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await exerciseService.searchExercises(filters);
      setFilteredExercises(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (err) {
      console.error('Error applying filters:', err);
    }
  };

  const handleFilterChange = (key: keyof ExerciseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const convertToAppExercise = (externalExercise: ExternalExercise): Exercise => {
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
  };

  const handleSelectExercise = (exercise: ExternalExercise) => {
    const appExercise = convertToAppExercise(exercise);
    onSelectExercise(appExercise);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipmentColor = (equipment: string | null) => {
    if (!equipment) return 'bg-gray-100 text-gray-800';
    if (equipment === 'body only') return 'bg-blue-100 text-blue-800';
    if (equipment === 'dumbbell') return 'bg-green-100 text-green-800';
    if (equipment === 'resistance band') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading exercise library...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadExercises}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
          
          <p className="text-gray-600">
            Browse {filteredExercises.length} physical therapy exercises from our comprehensive library
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search exercises, muscles, or instructions..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="h-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Select
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {exerciseService.getUniqueCategories(exercises).map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <Select
                    value={filters.level || ''}
                    onValueChange={(value) => handleFilterChange('level', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                  <Select
                    value={filters.equipment || ''}
                    onValueChange={(value) => handleFilterChange('equipment', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All equipment</SelectItem>
                      {exerciseService.getUniqueEquipment(exercises).map(equipment => (
                        <SelectItem key={equipment} value={equipment}>
                          {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {currentExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">{exercise.name}</CardTitle>
                  <Badge className={getDifficultyColor(exercise.level)}>
                    {exercise.level}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {exercise.category?.charAt(0).toUpperCase() + exercise.category?.slice(1)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Equipment */}
                  {exercise.equipment && (
                    <Badge variant="outline" className={getEquipmentColor(exercise.equipment)}>
                      {exercise.equipment}
                    </Badge>
                  )}
                  
                  {/* Primary Muscles */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Primary Muscles</p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                      {exercise.primaryMuscles.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{exercise.primaryMuscles.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Instructions Preview */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {exercise.instructions[0] || 'No instructions available'}
                  </p>
                  
                  <Button 
                    onClick={() => handleSelectExercise(exercise)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
