import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, BookOpen, Users, Clock, Trash2, Search } from 'lucide-react';
import { getFavorites, saveFavorites } from '../utils/localStorage';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFavorites(getFavorites() || []);
  }, []);

  const removeFavorite = (subject, code) => {
    const updated = favorites.filter(c => c.subject !== subject || c.code !== code);
    setFavorites(updated);
    saveFavorites(updated);
  };

  const clearAllFavorites = () => {
    if (window.confirm('Are you sure you want to remove all favorite courses?')) {
      setFavorites([]);
      saveFavorites([]);
    }
  };

  const filteredFavorites = favorites.filter(course =>
    course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Favorite Courses</h1>
        <p className="text-gray-600">Your saved courses for quick access</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={clearAllFavorites}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite courses yet</h3>
          <p className="text-gray-600 mb-6">Start exploring courses and add them to your favorites</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFavorites.length === 0 && searchTerm ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredFavorites.length} favorite course{filteredFavorites.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                </h2>
              </div>
              
              <div className="grid gap-4">
                {filteredFavorites.map(course => (
                  <div key={`${course.subject}-${course.code}`} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Link
                          to={`/course/${course.subject}/${course.code}`}
                          className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {course.subject} {course.code}
                        </Link>
                        <h3 className="text-lg text-gray-900 mt-1">{course.title}</h3>
                      </div>
                      <button
                        onClick={() => removeFavorite(course.subject, course.code)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage; 