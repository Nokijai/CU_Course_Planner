import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, Plus, Check } from 'lucide-react';
import { getSchedule, saveSchedule, getFavorites, saveFavorites } from '../utils/localStorage';

function CourseSearchBox({ onCourseSelect, compact = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [academicGroups, setAcademicGroups] = useState([]);
  const [careers, setCareers] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedAcademicGroups, setSelectedAcademicGroups] = useState([]);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [academicGroupSearchTerm, setAcademicGroupSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 25,
    totalCourses: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Section selection state - inline instead of modal
  const [expandedCourses, setExpandedCourses] = useState(new Set());
  const [courseDetails, setCourseDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Load filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [subjectsRes, academicGroupsRes, careersRes, unitsRes] = await Promise.all([
          fetch('/api/courses/subjects'),
          fetch('/api/courses/academic-groups'),
          fetch('/api/courses/careers'),
          fetch('/api/courses/units')
        ]);

        if (subjectsRes.ok) {
          const data = await subjectsRes.json();
          setSubjects(data.data || []);
        }
        if (academicGroupsRes.ok) {
          const data = await academicGroupsRes.json();
          setAcademicGroups(data.data || []);
        }
        if (careersRes.ok) {
          const data = await careersRes.json();
          setCareers(data.data || []);
        }
        if (unitsRes.ok) {
          const data = await unitsRes.json();
          setUnits(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Debounced search for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    const performAutoSearch = async () => {
        // Search on any query length for incremental autocomplete
        const hasFilters = selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0;
        const hasQuery = query.trim().length > 0;
        
        if (hasFilters || hasQuery) {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
            if (hasQuery) {
            params.append('q', query.trim());
          }
          if (selectedSubjects.length > 0) {
            params.append('subjects', selectedSubjects.join(','));
          }
          if (selectedAcademicGroups.length > 0) {
            params.append('academic_groups', selectedAcademicGroups.join(','));
          }
          if (selectedCareers.length > 0) {
            params.append('careers', selectedCareers.join(','));
          }
          if (selectedUnits.length > 0) {
            params.append('units', selectedUnits.join(','));
          }
          
            // Reset to first page when query changes
            const searchPage = hasQuery ? 1 : currentPage;
            params.append('page', searchPage.toString());
          params.append('limit', pageSize.toString());
          
          const res = await fetch(`/api/courses?${params.toString()}`);
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          setResults(data.data?.courses || []);
          setPagination(data.data?.pagination || {
            currentPage: 1,
            pageSize: 25,
            totalCourses: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          });
            
            // Reset to first page when query changes
            if (hasQuery && currentPage !== 1) {
              setCurrentPage(1);
            }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setPagination({
          currentPage: 1,
          pageSize: 25,
          totalCourses: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    };
    performAutoSearch();
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [selectedSubjects, selectedAcademicGroups, selectedCareers, selectedUnits, query, currentPage, pageSize]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() && selectedSubjects.length === 0 && selectedAcademicGroups.length === 0 && selectedCareers.length === 0 && selectedUnits.length === 0) return;
    setQuery(query.trim());
  };

  const addToFavorites = (course) => {
    const favorites = getFavorites() || [];
    const newFavorites = [...favorites, course];
    saveFavorites(newFavorites);
    setResults(prevResults => [...prevResults]);
  };

  const removeFromSchedule = (course) => {
    const schedule = getSchedule() || [];
    const newSchedule = schedule.filter(c => c.subject !== course.subject || c.code !== course.code);
    saveSchedule(newSchedule);
    setResults(prevResults => [...prevResults]);
    
    if (onCourseSelect) {
      onCourseSelect(null);
    }
  };

  const removeFromFavorites = (course) => {
    const favorites = getFavorites() || [];
    const newFavorites = favorites.filter(c => c.subject !== course.subject || c.code !== course.code);
    saveFavorites(newFavorites);
    setResults(prevResults => [...prevResults]);
  };

  const isInSchedule = (course) => {
    const schedule = getSchedule() || [];
    return schedule.some(c => c.subject === course.subject && c.code === course.code);
  };

  const isInFavorites = (course) => {
    const favorites = getFavorites() || [];
    return favorites.some(c => c.subject === course.subject && c.code === course.code);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleAcademicGroupChange = (group) => {
    setSelectedAcademicGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleCareerChange = (career) => {
    setSelectedCareers(prev => 
      prev.includes(career) 
        ? prev.filter(c => c !== career)
        : [...prev, career]
    );
  };

  const handleUnitChange = (unit) => {
    setSelectedUnits(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit)
        : [...prev, unit]
    );
  };

  const clearAllFilters = () => {
    setSelectedSubjects([]);
    setSelectedAcademicGroups([]);
    setSelectedCareers([]);
    setSelectedUnits([]);
    setSubjectSearchTerm('');
    setAcademicGroupSearchTerm('');
    setUnitSearchTerm('');
    setQuery('');
    setResults([]);
    setCurrentPage(1);
  };

  const selectAllSubjects = () => {
    setSelectedSubjects(filteredSubjects);
  };

  const selectAllAcademicGroups = () => {
    setSelectedAcademicGroups(filteredAcademicGroups);
  };

  const selectAllCareers = () => {
    setSelectedCareers(careers);
  };

  const selectAllUnits = () => {
    setSelectedUnits(filteredUnits);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.toLowerCase().startsWith(subjectSearchTerm.toLowerCase())
  );

  const filteredAcademicGroups = academicGroups.filter(group =>
    group.toLowerCase().startsWith(academicGroupSearchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(unit =>
    unit.toLowerCase().startsWith(unitSearchTerm.toLowerCase())
  );



  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const addCourseDirectly = (course) => {
    const schedule = getSchedule() || [];
    const newSchedule = [...schedule, course];
    saveSchedule(newSchedule);
    setResults(prevResults => [...prevResults]);
    
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };



  const fetchCourseDetails = async (course) => {
    const courseId = `${course.subject}-${course.code}`;
    
    // Don't fetch if already loaded or loading
    if (courseDetails[courseId] || loadingDetails[courseId]) {
      return;
    }

    setLoadingDetails(prev => ({ ...prev, [courseId]: true }));
    
    try {
      const response = await fetch(`/api/courses/${course.subject}/${course.code}/details`);
      if (response.ok) {
        const data = await response.json();
        setCourseDetails(prev => ({ ...prev, [courseId]: data.data }));
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const formatSectionTime = (section) => {
    if (!section.startTimes || !section.endTimes || !section.days) {
      return 'Time TBA';
    }

    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const times = [];
    
    for (let i = 0; i < section.startTimes.length; i++) {
      const day = dayNames[section.days[i]] || 'Unknown';
      const startTime = section.startTimes[i];
      const endTime = section.endTimes[i];
      times.push(`${day} ${startTime}-${endTime}`);
    }
    
    return times.join(', ');
  };

    const addSectionToSchedule = (course, termName, sectionName, section) => {
        const courseWithSection = {
          ...course,
          selectedSection: sectionName,
      selectedTerm: termName,
      schedule: section.startTimes.map((startTime, index) => ({
        day: section.days[index],
        startTime: startTime,
        endTime: section.endTimes[index],
        location: section.locations ? section.locations[index] : 'TBA',
        instructor: section.instructors ? section.instructors[index] : 'TBA'
      }))
    };

    const schedule = getSchedule() || [];
    const newSchedule = [...schedule, courseWithSection];
    saveSchedule(newSchedule);
    setResults(prevResults => [...prevResults]);
    
    if (onCourseSelect) {
          onCourseSelect(courseWithSection);
    }
  };

  const removeSectionFromSchedule = (course, termName, sectionName) => {
    const schedule = getSchedule() || [];
    const newSchedule = schedule.filter(item => 
      !(item.subject === course.subject && 
        item.code === course.code && 
        item.selectedSection === sectionName && 
        item.selectedTerm === termName)
    );
    saveSchedule(newSchedule);
    setResults(prevResults => [...prevResults]);
    
    if (onCourseSelect) {
      onCourseSelect(null);
    }
  };

  const isSectionInSchedule = (course, termName, sectionName) => {
    const schedule = getSchedule() || [];
    return schedule.some(item => 
      item.subject === course.subject && 
      item.code === course.code && 
      item.selectedSection === sectionName && 
      item.selectedTerm === termName
    );
  };

  return (
    <div className={`${compact ? 'w-full' : 'max-w-6xl mx-auto'}`}>
      {/* Search Input and Filter Toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type course code (e.g., C → CS → CS1 → CS101)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
          />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            } flex items-center gap-1`}
            >
              <Filter className="h-4 w-4" />
              Filters
            {(selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0) && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {(selectedSubjects.length + selectedAcademicGroups.length + selectedCareers.length + selectedUnits.length)}
              </span>
            )}
            </button>
          </div>
        

        
        {/* Search progress indicator */}
        {query && query.length === 1 && (
          <div className="mt-2 text-xs text-blue-600">
            🔍 Searching for courses starting with "{query.toUpperCase()}"...
          </div>
        )}

          {/* Filters */}
          {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                <X className="h-3 w-3" />
                  Clear All
                </button>
              </div>
              
              {/* Filter Summary */}
              {(selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0) && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <div className="font-medium mb-1">Active Filters:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSubjects.slice(0, 3).map(subject => (
                      <span key={subject} className="bg-blue-100 px-1 rounded">{subject}</span>
                    ))}
                    {selectedSubjects.length > 3 && (
                      <span className="text-blue-600">+{selectedSubjects.length - 3} more</span>
                    )}
                    {selectedAcademicGroups.slice(0, 2).map(group => (
                      <span key={group} className="bg-blue-100 px-1 rounded">{group}</span>
                    ))}
                    {selectedAcademicGroups.length > 2 && (
                      <span className="text-blue-600">+{selectedAcademicGroups.length - 2} more</span>
                    )}
                    {selectedCareers.slice(0, 2).map(career => (
                      <span key={career} className="bg-blue-100 px-1 rounded">{career}</span>
                    ))}
                    {selectedUnits.slice(0, 2).map(unit => (
                      <span key={unit} className="bg-blue-100 px-1 rounded">{unit}</span>
                    ))}
                  </div>
                </div>
              )}
              
            <div className="grid grid-cols-2 gap-4">
                {/* Subjects */}
                <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Subjects</h4>
                  <button
                    onClick={selectAllSubjects}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filteredSubjects.map(subject => (
                    <label key={subject} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => handleSubjectChange(subject)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                      <span className="text-gray-700">{subject}</span>
                        </label>
                  ))}
                  </div>
                </div>

                {/* Academic Groups */}
                <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Academic Groups</h4>
                  <button
                    onClick={selectAllAcademicGroups}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={academicGroupSearchTerm}
                  onChange={(e) => setAcademicGroupSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filteredAcademicGroups.map(group => (
                    <label key={group} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedAcademicGroups.includes(group)}
                            onChange={() => handleAcademicGroupChange(group)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                      <span className="text-gray-700">{group}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Second row of filters */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Careers */}
                <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Careers</h4>
                  <button
                    onClick={selectAllCareers}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {careers.map(career => (
                    <label key={career} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedCareers.includes(career)}
                            onChange={() => handleCareerChange(career)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                      <span className="text-gray-700">{career}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Units</h4>
                  <button
                    onClick={selectAllUnits}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search units..."
                  value={unitSearchTerm}
                  onChange={(e) => setUnitSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filteredUnits.map(unit => (
                    <label key={unit} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(unit)}
                            onChange={() => handleUnitChange(unit)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                      <span className="text-gray-700">{unit}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Loading State */}
      {loading && (
          <div className="flex justify-center items-center py-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

        {/* Error State */}
      {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-4 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

        {/* Results */}
      {results.length > 0 && (
          <div className="flex-1 flex flex-col">
            {/* Results Header with Pagination */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="text-center sm:text-left">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {pagination.totalCourses} course{pagination.totalCourses !== 1 ? 's' : ''} found
            </h2>
                  {(query || selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0) && (
                    <p className="text-xs text-gray-600 mt-1">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCourses)} of {pagination.totalCourses}
                    </p>
                  )}
                </div>
                
                {/* Compact Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center sm:justify-end items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!pagination.hasPrevPage}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ‹
                    </button>
                    <span className="text-xs text-gray-600 px-2">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={!pagination.hasNextPage}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
          </div>
          
          {/* Course Results */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
            {results.map(course => {
              const courseId = `${course.subject}-${course.code}`;
              const isExpanded = expandedCourses.has(courseId);
              const courseDetail = courseDetails[courseId];
              const isLoadingDetails = loadingDetails[courseId];
              
              return (
                    <div key={courseId} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                      {/* Course Title */}
                          <div className="block hover:bg-gray-50 -m-2 p-2 rounded transition-colors cursor-pointer" onClick={() => toggleCourseExpansion(courseId)}>
                            <h3 className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors break-words whitespace-normal">
                          <span className="font-bold">{course.subject}{course.code}</span> - {course.title}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">{course.units} units • {course.academicGroup}</p>
                          </div>
                    </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 flex-shrink-0">
                      {isInSchedule(course) ? (
                        <button
                          onClick={() => removeFromSchedule(course)}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                          title="Remove from schedule"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleCourseExpansion(courseId)}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors flex items-center gap-1"
                          title={isExpanded ? "Hide details" : "View details & select sections"}
                        >
                          {isExpanded ? (
                            <>
                              <span className="text-xs">−</span>
                              Details
                            </>
                          ) : (
                            <>
                          <Plus className="h-3 w-3" />
                              Details
                            </>
                          )}
                        </button>
                      )}
                          
                      {isInFavorites(course) ? (
                        <button
                          onClick={() => removeFromFavorites(course)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          title="Remove from favorites"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => addToFavorites(course)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          title="Add to favorites"
                        >
                          ♡
                        </button>
                      )}
                    </div>
                  </div>
                  
                                            {/* Course Details and Section Selection */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                      {/* Course Prerequisites and Credit */}
                          <div className="mb-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Credit:</span>
                              <span className="text-xs text-gray-900">{course.units}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">Prerequisites:</span>
                              <span className="text-xs text-gray-900">{course.requirements ? course.requirements : 'None'}</span>
                            </div>
                          </div>
                          
                      {/* Section Information */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-medium text-gray-700">Available Sections:</h4>
                          {!courseDetail && !isLoadingDetails && (
                                  <button
                              onClick={() => fetchCourseDetails(course)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                  >
                              Load Sections
                                  </button>
                                )}
                              </div>
                        
                        {isLoadingDetails && (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span className="text-xs text-gray-600">Loading sections...</span>
                                                      </div>
                                                  </div>
                                                )}
                        
                        {courseDetail && courseDetail.terms && (
                          <div className="space-y-3">
                            {Object.entries(courseDetail.terms).map(([termName, sections]) => (
                              <div key={termName}>
                                <h5 className="text-xs font-medium text-gray-600 mb-2">{termName}</h5>
                                <div className="grid grid-cols-1 gap-2">
                                  {Object.entries(sections).map(([sectionName, section]) => (
                                    <div key={sectionName} className="border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="text-xs font-medium text-gray-900 mb-1">{sectionName}</div>
                                          <div className="text-xs text-gray-600 mb-1">
                                            {formatSectionTime(section)}
                                          </div>
                                          {section.locations && section.locations[0] && section.locations[0] !== 'TBA' && (
                                            <div className="text-xs text-gray-500 mb-1">
                                              Location: {section.locations[0]}
                                                  </div>
                                                )}
                                          {section.instructors && section.instructors[0] && (
                                            <div className="text-xs text-gray-500">
                                              Instructor: {section.instructors[0]}
                                                  </div>
                                                )}
                                              </div>
                                        {isSectionInSchedule(course, termName, sectionName) ? (
                                          <button
                                            onClick={() => removeSectionFromSchedule(course, termName, sectionName)}
                                            className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex items-center gap-1"
                                            title="Remove this section from schedule"
                                          >
                                            <span className="text-xs">×</span>
                                            Added
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => addSectionToSchedule(course, termName, sectionName, section)}
                                            className="ml-2 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                                            title="Add this section to schedule"
                                          >
                                            <Plus className="h-3 w-3" />
                                            Add
                                          </button>
                                        )}
                                          </div>
                                    </div>
                                  ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                        )}
                        
                        {courseDetail && !courseDetail.terms && (
                          <div className="text-xs text-gray-500 py-2">
                            No section information available for this course.
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {query ? (
                <div>
                  <p className="text-sm text-gray-600 mb-1">No courses found for "{query}"</p>
                  <p className="text-xs text-gray-500">Try typing more characters or different course codes</p>
                </div>
              ) : (
              <p className="text-sm text-gray-600">Search for courses to get started</p>
              )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default CourseSearchBox; 