import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSchedule, saveSchedule, getFavorites, saveFavorites } from '../utils/localStorage';
import { Calendar, Heart, Clock, BookOpen, Users, Award, ArrowLeft, Plus, X, Check } from 'lucide-react';

function CourseDetailPage() {
  const { subject, code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInSchedule, setIsInSchedule] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);
  
  // Section selection modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [currentTerm, setCurrentTerm] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${subject}/${code}`);
        if (!res.ok) throw new Error('Course not found');
        const data = await res.json();
        setCourse(data.data);
        
        // Check if course is in schedule or favorites
        const schedule = getSchedule() || [];
        const favorites = getFavorites() || [];
        
        setIsInSchedule(schedule.some(c => c.subject === subject && c.code === code));
        setIsInFavorites(favorites.some(c => c.subject === subject && c.code === code));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [subject, code]);

  const handleBackClick = () => {
    if (location.state) {
      navigate(-1);
    } else {
      navigate('/search');
    }
  };

  const addToSchedule = () => {
    if (!course) return;
    
    const schedule = getSchedule() || [];
    const newSchedule = [...schedule, course];
    saveSchedule(newSchedule);
    setIsInSchedule(true);
  };

  const removeFromSchedule = () => {
    const schedule = getSchedule() || [];
    const newSchedule = schedule.filter(c => c.subject !== subject || c.code !== code);
    saveSchedule(newSchedule);
    setIsInSchedule(false);
  };

  const addToFavorites = () => {
    if (!course) return;
    
    const favorites = getFavorites() || [];
    const newFavorites = [...favorites, course];
    saveFavorites(newFavorites);
    setIsInFavorites(true);
  };

  const removeFromFavorites = () => {
    const favorites = getFavorites() || [];
    const newFavorites = favorites.filter(c => c.subject !== subject || c.code !== code);
    saveFavorites(newFavorites);
    setIsInFavorites(false);
  };

  // Helper function to check if a section has subsections
  const hasSubsections = (sectionName, sections) => {
    // Extract the section prefix (e.g., "A" from "A-LEC", "--" from "--LEC")
    const sectionPrefix = sectionName.split('-')[0];
    
    // Check if there are other sections that are related
    const hasSubs = Object.keys(sections).some(name => {
      if (name === sectionName) return false;
      
      const otherPrefix = name.split('-')[0];
      
      // Check for different relationship patterns:
      // 1. Same prefix (e.g., A-LEC and A-TUT)
      // 2. Main section with tutorial/lab (e.g., A-LEC and AT01-TUT)
      // 3. Main section with tutorial/lab (e.g., B-LEC and BT01-TUT)
      
      let isRelated = false;
      
      // Pattern 1: Same prefix
      if (otherPrefix === sectionPrefix) {
        isRelated = true;
      }
      // Pattern 2: Main section (A-LEC) with tutorial (AT01-TUT)
      else if (sectionPrefix.length === 1 && otherPrefix.startsWith(sectionPrefix) && otherPrefix.length > 1) {
        isRelated = true;
      }
      // Pattern 3: Tutorial (AT01-TUT) with main section (A-LEC)
      else if (otherPrefix.length === 1 && sectionPrefix.startsWith(otherPrefix) && sectionPrefix.length > 1) {
        isRelated = true;
      }
      
      return isRelated;
    });
    
    return hasSubs;
  };

  // Helper function to get related subsections
  const getRelatedSubsections = (sectionName, sections) => {
    // Extract the section prefix (e.g., "A" from "A-LEC", "--" from "--LEC")
    const sectionPrefix = sectionName.split('-')[0];
    
    // Return sections that are related based on the same patterns
    return Object.entries(sections).filter(([name]) => {
      if (name === sectionName) return false;
      
      const otherPrefix = name.split('-')[0];
      
      // Check for different relationship patterns:
      // 1. Same prefix (e.g., A-LEC and A-TUT)
      // 2. Main section with tutorial/lab (e.g., A-LEC and AT01-TUT)
      // 3. Main section with tutorial/lab (e.g., B-LEC and BT01-TUT)
      
      // Pattern 1: Same prefix
      if (otherPrefix === sectionPrefix) {
        return true;
      }
      // Pattern 2: Main section (A-LEC) with tutorial (AT01-TUT)
      else if (sectionPrefix.length === 1 && otherPrefix.startsWith(sectionPrefix) && otherPrefix.length > 1) {
        return true;
      }
      // Pattern 3: Tutorial (AT01-TUT) with main section (A-LEC)
      else if (otherPrefix.length === 1 && sectionPrefix.startsWith(otherPrefix) && sectionPrefix.length > 1) {
        return true;
      }
      
      return false;
    });
  };

  // Open section selection modal
  const openSectionModal = () => {
    console.log('Opening modal for course:', course.subject, course.code);
    
    // Get the first term (or you could let user choose)
    const firstTerm = Object.keys(course.terms)[0];
    setCurrentTerm(firstTerm);
    
    // Pre-select sections that are already in schedule
    const schedule = getSchedule() || [];
    const scheduleCourse = schedule.find(c => c.subject === subject && c.code === code);
    if (scheduleCourse && scheduleCourse.selectedSections) {
      setSelectedSections(new Set(scheduleCourse.selectedSections));
    } else {
      setSelectedSections(new Set());
    }
    
    setShowSectionModal(true);
  };

  // Close section selection modal
  const closeSectionModal = () => {
    setShowSectionModal(false);
    setSelectedSections(new Set());
    setCurrentTerm('');
  };

  // Toggle section selection
  const toggleSectionSelection = (sectionName) => {
    console.log('Toggling section:', sectionName);
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionName)) {
      newSelected.delete(sectionName);
      console.log('Removed section:', sectionName);
    } else {
      newSelected.add(sectionName);
      console.log('Added section:', sectionName);
    }
    console.log('Current selected sections:', Array.from(newSelected));
    setSelectedSections(newSelected);
  };

  // Add selected sections to schedule
  const addSelectedSectionsToSchedule = () => {
    if (!course || selectedSections.size === 0) return;
    
    console.log('Adding sections to schedule:', Array.from(selectedSections));
    console.log('Current course:', course.subject, course.code);
    
    const schedule = getSchedule() || [];
    const existingCourseIndex = schedule.findIndex(c => c.subject === subject && c.code === code);
    
    if (existingCourseIndex >= 0) {
      // Course already exists, update its sections
      const updatedCourse = {
        ...schedule[existingCourseIndex],
        selectedSections: Array.from(selectedSections)
      };
      schedule[existingCourseIndex] = updatedCourse;
      console.log('Updated existing course with sections:', updatedCourse.selectedSections);
    } else {
      // Add new course with selected sections
      const newCourse = {
        ...course,
        selectedSections: Array.from(selectedSections)
      };
      schedule.push(newCourse);
      console.log('Added new course with sections:', newCourse.selectedSections);
    }
    
    saveSchedule(schedule);
    setIsInSchedule(true);
    closeSectionModal();
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-red-800 font-semibold mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );
  
  if (!course) return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
      </div>
      
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.subject} {course.code}
            </h1>
            <h2 className="text-xl text-gray-700 mb-4">{course.title}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={isInSchedule ? removeFromSchedule : openSectionModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isInSchedule
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {isInSchedule ? 'Remove from Schedule' : 'Add to Schedule'}
            </button>
            <button
              onClick={isInFavorites ? removeFromFavorites : addToFavorites}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isInFavorites
                  ? 'bg-pink-100 text-red-700 hover:bg-pink-200'
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              }`}
            >
              <Heart className={`h-4 w-4 ${isInFavorites ? 'fill-current' : ''}`} />
              {isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Academic Group</div>
              <div className="font-medium">{course.academic_group || 'N/A'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Units</div>
              <div className="font-medium">{course.units || 'N/A'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Career</div>
              <div className="font-medium">{course.career || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 leading-relaxed">{course.description}</p>
        </div>
      )}

      {/* Terms and Sections */}
      {course.terms && Object.keys(course.terms).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms and Sections</h3>
          <div className="space-y-4">
            {Object.entries(course.terms).map(([termName, sections]) => (
              <div key={termName} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{termName}</h4>
                <div className="space-y-3">
                  {Object.entries(sections).map(([sectionName, section]) => (
                    <div key={sectionName} className="border-l-4 border-blue-500 pl-4">
                      <div className="font-medium text-gray-800 mb-1">{sectionName}</div>
                      {section.days && section.startTimes && section.endTimes && (
                        <div className="text-sm text-gray-600">
                          {section.days.map((day, index) => {
                            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                            return (
                              <div key={index}>
                                {dayNames[day - 1]} {section.startTimes[index]}-{section.endTimes[index]}
                                {section.locations && section.locations[index] && ` • ${section.locations[index]}`}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {section.instructors && section.instructors.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Instructor: {section.instructors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Selection Modal */}
      {showSectionModal && course && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Select Sections for {course.subject} {course.code}
              </h2>
              <button
                onClick={closeSectionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">{currentTerm}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the sections you want to add to your schedule. Related sections (lectures, tutorials, labs) are grouped together.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {Object.entries(course.terms[currentTerm]).map(([sectionName, section]) => {
                const isSelected = selectedSections.has(sectionName);
                const hasSubs = hasSubsections(sectionName, course.terms[currentTerm]);
                const relatedSubsections = hasSubs ? getRelatedSubsections(sectionName, course.terms[currentTerm]) : [];
                
                return (
                  <div key={sectionName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleSectionSelection(sectionName)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                        <span className="font-medium text-gray-900">{sectionName}</span>
                        {hasSubs && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Main Section
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Section details */}
                    <div className="ml-8 text-sm text-gray-600">
                      {section.days && section.startTimes && section.endTimes && (
                        <div className="mb-2">
                          {section.days.map((day, index) => {
                            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                            return (
                              <div key={index} className="flex items-center space-x-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {dayNames[day - 1]} {section.startTimes[index]}-{section.endTimes[index]}
                                  {section.locations && section.locations[index] && ` • ${section.locations[index]}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {section.instructors && section.instructors.length > 0 && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-3 w-3" />
                          <span>Instructor: {section.instructors.join(', ')}</span>
                        </div>
                      )}
                      
                      {/* Show related subsections */}
                      {hasSubs && relatedSubsections.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 font-medium mb-2">Related Sessions:</div>
                          <div className="space-y-2">
                            {relatedSubsections.map(([subName, subSection]) => (
                              <div key={subName} className="text-xs text-gray-600 ml-2">
                                • {subName}: {subSection.days?.map((day, idx) => {
                                  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                  return `${dayNames[day - 1]} ${subSection.startTimes?.[idx]}-${subSection.endTimes?.[idx]}`;
                                }).join(', ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeSectionModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSelectedSectionsToSchedule}
                disabled={selectedSections.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add {selectedSections.size} Section{selectedSections.size !== 1 ? 's' : ''} to Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetailPage; 