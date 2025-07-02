import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSchedule, saveSchedule, getFavorites, saveFavorites } from '../utils/localStorage';
import { Calendar, Heart, Clock, BookOpen, Users, Award } from 'lucide-react';

function CourseDetailPage() {
  const { subject, code } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInSchedule, setIsInSchedule] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);

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
              onClick={isInSchedule ? removeFromSchedule : addToSchedule}
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
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
              }`}
            >
              <Heart className={`h-4 w-4 ${isInFavorites ? 'fill-current' : ''}`} />
              {isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>

        {/* Course Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Instructor</div>
              <div className="font-medium">{course.instructor || 'TBA'}</div>
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

        {/* Description */}
        {course.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>
        )}

        {/* Learning Outcomes */}
        {course.outcome && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Outcomes</h3>
            <p className="text-gray-700 leading-relaxed">{course.outcome}</p>
          </div>
        )}

        {/* Syllabus */}
        {course.syllabus && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Syllabus</h3>
            <p className="text-gray-700 leading-relaxed">{course.syllabus}</p>
          </div>
        )}

        {/* Requirements */}
        {course.requirements && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
            <p className="text-gray-700">{course.requirements}</p>
          </div>
        )}

        {/* Assessments */}
        {course.assessments && Object.keys(course.assessments).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessments</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {Object.entries(course.assessments).map(([type, percentage]) => (
                <div key={type} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-medium text-gray-900">{percentage}%</span>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}

export default CourseDetailPage; 