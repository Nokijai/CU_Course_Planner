import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, Heart, BookOpen, Users, Clock } from 'lucide-react';
import { getSchedule, saveSchedule, getFavorites, saveFavorites } from '../utils/localStorage';

function CourseSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/courses/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      let url = `/api/courses?q=${encodeURIComponent(query)}`;
      if (selectedSubject) {
        url += `&academic_group=${encodeURIComponent(selectedSubject)}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.data?.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToSchedule = (course) => {
    const schedule = getSchedule() || [];
    const newSchedule = [...schedule, course];
    saveSchedule(newSchedule);
  };

  const addToFavorites = (course) => {
    const favorites = getFavorites() || [];
    const newFavorites = [...favorites, course];
    saveFavorites(newFavorites);
  };

  const isInSchedule = (course) => {
    const schedule = getSchedule() || [];
    return schedule.some(c => c.subject === course.subject && c.code === course.code);
  };

  const isInFavorites = (course) => {
    const favorites = getFavorites() || [];
    return favorites.some(c => c.subject === course.subject && c.code === course.code);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Search</h1>
        <p className="text-gray-600">Find courses by keyword, subject, or instructor</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by keyword, subject, or instructor..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {results.length} course{results.length !== 1 ? 's' : ''} found
            </h2>
          </div>
          
          <div className="grid gap-4">
            {results.map(course => (
              <div key={`${course.subject}-${course.code}`} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Link
                      to={`/course/${course.subject}/${course.code}`}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {course.subject} {course.code}
                    </Link>
                    <h3 className="text-lg text-gray-900 mt-1">{course.title}</h3>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => addToSchedule(course)}
                      disabled={isInSchedule(course)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isInSchedule(course)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      {isInSchedule(course) ? 'In Schedule' : 'Add to Schedule'}
                    </button>
                    <button
                      onClick={() => addToFavorites(course)}
                      disabled={isInFavorites(course)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isInFavorites(course)
                          ? 'bg-pink-100 text-pink-700 cursor-not-allowed'
                          : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInFavorites(course) ? 'fill-current' : ''}`} />
                      {isInFavorites(course) ? 'Favorited' : 'Favorite'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{course.career || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.units || 'N/A'} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.campus || 'N/A'}</span>
                  </div>
                </div>
                
                {course.description && (
                  <p className="text-gray-700 mt-3 line-clamp-2">{course.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
}

export default CourseSearchPage; 