import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Filter, Calendar, Heart, BookOpen, Users, Clock, X, Plus, Check } from 'lucide-react';
import { getSchedule, saveSchedule, getFavorites, saveFavorites } from '../utils/localStorage';

function CourseSearchPage() {
  const location = useLocation();
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
  
  // Section selection modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentTerm, setCurrentTerm] = useState('');

  // Save search state to browser history
  const saveSearchState = () => {
    const searchState = {
      query,
      selectedSubjects,
      selectedAcademicGroups,
      selectedCareers,
      selectedUnits,
      currentPage,
      pageSize,
      showFilters,
      subjectSearchTerm,
      academicGroupSearchTerm,
      unitSearchTerm
    };
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (selectedSubjects.length > 0) params.append('subjects', selectedSubjects.join(','));
    if (selectedAcademicGroups.length > 0) params.append('academic_groups', selectedAcademicGroups.join(','));
    if (selectedCareers.length > 0) params.append('careers', selectedCareers.join(','));
    if (selectedUnits.length > 0) params.append('units', selectedUnits.join(','));
    if (currentPage > 1) params.append('page', currentPage.toString());
    if (pageSize !== 25) params.append('limit', pageSize.toString());
    if (showFilters) params.append('filters', 'true');
    
    const newUrl = params.toString() ? `${location.pathname}?${params.toString()}` : location.pathname;
    window.history.replaceState(searchState, '', newUrl);
  };

  // Restore search state from browser history or URL parameters
  const restoreSearchState = () => {
    // First try to restore from browser history state
    if (location.state) {
      const state = location.state;
      setQuery(state.query || '');
      setSelectedSubjects(state.selectedSubjects || []);
      setSelectedAcademicGroups(state.selectedAcademicGroups || []);
      setSelectedCareers(state.selectedCareers || []);
      setSelectedUnits(state.selectedUnits || []);
      setCurrentPage(state.currentPage || 1);
      setPageSize(state.pageSize || 25);
      setShowFilters(state.showFilters || false);
      setSubjectSearchTerm(state.subjectSearchTerm || '');
      setAcademicGroupSearchTerm(state.academicGroupSearchTerm || '');
      setUnitSearchTerm(state.unitSearchTerm || '');
      return;
    }

    // Fallback to URL parameters
    const urlParams = new URLSearchParams(location.search);
    const urlQuery = urlParams.get('q');
    const urlSubjects = urlParams.get('subjects');
    const urlAcademicGroups = urlParams.get('academic_groups');
    const urlCareers = urlParams.get('careers');
    const urlUnits = urlParams.get('units');
    const urlPage = urlParams.get('page');
    const urlLimit = urlParams.get('limit');
    const urlFilters = urlParams.get('filters');

    if (urlQuery) setQuery(urlQuery);
    if (urlSubjects) setSelectedSubjects(urlSubjects.split(','));
    if (urlAcademicGroups) setSelectedAcademicGroups(urlAcademicGroups.split(','));
    if (urlCareers) setSelectedCareers(urlCareers.split(','));
    if (urlUnits) setSelectedUnits(urlUnits.split(','));
    if (urlPage) setCurrentPage(parseInt(urlPage));
    if (urlLimit) setPageSize(parseInt(urlLimit));
    if (urlFilters === 'true') setShowFilters(true);
  };

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

  // Restore search state when component mounts
  useEffect(() => {
    restoreSearchState();
  }, []);

  // Save search state whenever search parameters change
  useEffect(() => {
    saveSearchState();
  }, [query, selectedSubjects, selectedAcademicGroups, selectedCareers, selectedUnits, currentPage, pageSize, showFilters, subjectSearchTerm, academicGroupSearchTerm, unitSearchTerm]);

  // Auto-search when filters change
  useEffect(() => {
    const performAutoSearch = async () => {
      // Always search if there are filters selected, regardless of query
      if (selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0) {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          // Only add query if there are no subject filters (to avoid conflicts)
          if (query.trim() && selectedSubjects.length === 0) {
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
          
          // Add pagination parameters
          params.append('page', currentPage.toString());
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
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (query.trim()) {
        // Only search by query if no filters are selected
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          params.append('q', query.trim());
          
          // Add pagination parameters
          params.append('page', currentPage.toString());
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
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear results when no filters are selected and no query
        setResults([]);
        setError(null);
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

    // Add a small delay to avoid too many API calls
    const timeoutId = setTimeout(performAutoSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedSubjects, selectedAcademicGroups, selectedCareers, selectedUnits, query, currentPage, pageSize]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() && selectedSubjects.length === 0 && selectedAcademicGroups.length === 0 && selectedCareers.length === 0 && selectedUnits.length === 0) return;
    
    // Trigger the auto-search effect by updating the query
    setQuery(query.trim());
  };

  const addToSchedule = (course) => {
    const schedule = getSchedule() || [];
    const newSchedule = [...schedule, course];
    saveSchedule(newSchedule);
    // Force re-render to update button states
    setResults(prevResults => [...prevResults]);
  };

  const addToFavorites = (course) => {
    const favorites = getFavorites() || [];
    const newFavorites = [...favorites, course];
    saveFavorites(newFavorites);
    // Force re-render to update button states
    setResults(prevResults => [...prevResults]);
  };

  const removeFromSchedule = (course) => {
    const schedule = getSchedule() || [];
    const newSchedule = schedule.filter(c => c.subject !== course.subject || c.code !== course.code);
    saveSchedule(newSchedule);
    // Force re-render to update button states
    setResults(prevResults => [...prevResults]);
  };

  const removeFromFavorites = (course) => {
    const favorites = getFavorites() || [];
    const newFavorites = favorites.filter(c => c.subject !== course.subject || c.code !== course.code);
    saveFavorites(newFavorites);
    // Force re-render to update button states
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

  // Filter subjects based on search term (starts with)
  const filteredSubjects = subjects.filter(subject =>
    subject.toLowerCase().startsWith(subjectSearchTerm.toLowerCase())
  );

  // Filter academic groups based on search term (starts with)
  const filteredAcademicGroups = academicGroups.filter(group =>
    group.toLowerCase().startsWith(academicGroupSearchTerm.toLowerCase())
  );

  // Filter units based on search term (starts with)
  const filteredUnits = units.filter(unit =>
    unit.toLowerCase().startsWith(unitSearchTerm.toLowerCase())
  );

  // Helper function to check if a section has subsections
  const hasSubsections = (sectionName, sections) => {
    // Extract the section prefix (e.g., "A" from "A-LEC", "--" from "--LEC")
    const sectionPrefix = sectionName.split('-')[0];
    
    console.log(`Checking if ${sectionName} has subsections. Prefix: "${sectionPrefix}"`);
    
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
      
      if (isRelated) {
        console.log(`  Found related section: ${name} (prefix: "${otherPrefix}")`);
      }
      return isRelated;
    });
    
    console.log(`  Result: ${sectionName} hasSubs = ${hasSubs}`);
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
  const openSectionModal = async (course) => {
    console.log('Opening modal for course:', course.subject, course.code);
    
    // Fetch the full course data to get sections
    try {
      const res = await fetch(`/api/courses/${course.subject}/${course.code}`);
      if (!res.ok) throw new Error('Course not found');
      const data = await res.json();
      const fullCourse = data.data;
      
      setCurrentCourse(fullCourse);
      
      // Get the first term (or you could let user choose)
      const firstTerm = Object.keys(fullCourse.terms)[0];
      setCurrentTerm(firstTerm);
      
      // Pre-select sections that are already in schedule
      const schedule = getSchedule() || [];
      const scheduleCourse = schedule.find(c => c.subject === course.subject && c.code === course.code);
      if (scheduleCourse && scheduleCourse.selectedSections) {
        setSelectedSections(new Set(scheduleCourse.selectedSections));
      } else {
        setSelectedSections(new Set());
      }
      
      setShowSectionModal(true);
    } catch (err) {
      console.error('Failed to fetch course details:', err);
      // Fallback to simple add to schedule
      addToSchedule(course);
    }
  };

  // Close section selection modal
  const closeSectionModal = () => {
    setShowSectionModal(false);
    setSelectedSections(new Set());
    setCurrentCourse(null);
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
    if (!currentCourse || selectedSections.size === 0) return;
    
    console.log('Adding sections to schedule:', Array.from(selectedSections));
    console.log('Current course:', currentCourse.subject, currentCourse.code);
    
    const schedule = getSchedule() || [];
    const existingCourseIndex = schedule.findIndex(c => c.subject === currentCourse.subject && c.code === currentCourse.code);
    
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
        ...currentCourse,
        selectedSections: Array.from(selectedSections)
      };
      schedule.push(newCourse);
      console.log('Added new course with sections:', newCourse.selectedSections);
    }
    
    saveSchedule(schedule);
    closeSectionModal();
    // Force re-render to update button states
    setResults(prevResults => [...prevResults]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Search</h1>
        <p className="text-gray-600">Find courses by course code, keyword, subject, or instructor</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by course code (e.g., CSCI1020), keyword, subject, or instructor..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || (!query.trim() && selectedSubjects.length === 0 && selectedAcademicGroups.length === 0 && selectedCareers.length === 0 && selectedUnits.length === 0)}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Subjects */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Subjects</h4>
                    {filteredSubjects.length > 0 && (
                      <button
                        onClick={selectAllSubjects}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    )}
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map(subject => (
                        <label key={subject} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => handleSubjectChange(subject)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No subjects found</p>
                    )}
                    {filteredSubjects.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing {filteredSubjects.length} of {subjects.length} subjects
                      </p>
                    )}
                  </div>
                </div>

                {/* Academic Groups */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Academic Groups</h4>
                    {filteredAcademicGroups.length > 0 && (
                      <button
                        onClick={selectAllAcademicGroups}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    )}
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search academic groups..."
                      value={academicGroupSearchTerm}
                      onChange={(e) => setAcademicGroupSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredAcademicGroups.length > 0 ? (
                      filteredAcademicGroups.map(group => (
                        <label key={group} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedAcademicGroups.includes(group)}
                            onChange={() => handleAcademicGroupChange(group)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{group}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No academic groups found</p>
                    )}
                    {filteredAcademicGroups.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing {filteredAcademicGroups.length} of {academicGroups.length} groups
                      </p>
                    )}
                  </div>
                </div>

                {/* Careers */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Career Level</h4>
                    {careers.length > 0 && (
                      <button
                        onClick={selectAllCareers}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {careers.map(career => (
                      <label key={career} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedCareers.includes(career)}
                          onChange={() => handleCareerChange(career)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{career}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Units</h4>
                    {filteredUnits.length > 0 && (
                      <button
                        onClick={selectAllUnits}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                    )}
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search units..."
                      value={unitSearchTerm}
                      onChange={(e) => setUnitSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredUnits.length > 0 ? (
                      filteredUnits.map(unit => (
                        <label key={unit} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(unit)}
                            onChange={() => handleUnitChange(unit)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{unit} units</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No units found</p>
                    )}
                    {filteredUnits.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing {filteredUnits.length} of {units.length} units
                      </p>
                    )}
                  </div>
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
              {results.length} course{results.length !== 1 ? 's' : ''} found (of {pagination.totalCourses} total)
            </h2>
            <div className="flex items-center gap-4">
              {/* Pagination Controls - Top */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  
                  
                  <div className="flex items-center gap-2">
                    {/* Previous button with arrow */}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        pagination.hasPrevPage
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    {/* Page numbers with smart navigation */}
                    <div className="flex items-center gap-1">
                      {/* First page (1) - show when not on first few pages */}
                      {pagination.currentPage > 3 && pagination.totalPages > 5 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            1
                          </button>
                          {pagination.currentPage > 4 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                        </>
                      )}
                      
                      {/* Page numbers around current page */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              pageNum === pagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {/* Last page - show when not on last few pages */}
                      {pagination.currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                        <>
                          {pagination.currentPage < pagination.totalPages - 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Next button with arrow */}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        pagination.hasNextPage
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600">Show:</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4">
            {results.map(course => (
              <div key={`${course.subject}-${course.code}`} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <Link
                      to={`/course/${course.subject}/${course.code}`}
                      state={{
                        query,
                        selectedSubjects,
                        selectedAcademicGroups,
                        selectedCareers,
                        selectedUnits,
                        currentPage,
                        pageSize,
                        showFilters,
                        subjectSearchTerm,
                        academicGroupSearchTerm,
                        unitSearchTerm
                      }}
                      className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {course.subject} {course.code}
                    </Link>
                    <h3 className="text-lg text-gray-900 mt-1">{course.title}</h3>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => isInSchedule(course) ? removeFromSchedule(course) : openSectionModal(course)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isInSchedule(course)
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      {isInSchedule(course) ? 'Remove from Schedule' : 'Add to Schedule'}
                    </button>
                    <button
                      onClick={() => isInFavorites(course) ? removeFromFavorites(course) : addToFavorites(course)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isInFavorites(course)
                          ? 'bg-pink-100 text-red-700 hover:bg-pink-200'
                          : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInFavorites(course) ? 'fill-current' : ''}`} />
                      {isInFavorites(course) ? 'Remove from Favorites' : 'Favorite'}
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
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCourses)} of{' '}
                {pagination.totalCourses} results
              </div>
              
              <div className="flex items-center gap-2">
                {/* Previous button with arrow */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pagination.hasPrevPage
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ← Previous
                </button>
                
                {/* Page numbers with smart navigation */}
                <div className="flex items-center gap-1">
                  {/* First page (1) - show when not on first few pages */}
                  {pagination.currentPage > 3 && pagination.totalPages > 5 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        1
                      </button>
                      {pagination.currentPage > 4 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                    </>
                  )}
                  
                  {/* Page numbers around current page */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Last page - show when not on last few pages */}
                  {pagination.currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                    <>
                      {pagination.currentPage < pagination.totalPages - 3 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Next button with arrow */}
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pagination.hasNextPage
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && results.length === 0 && (query || selectedSubjects.length > 0 || selectedAcademicGroups.length > 0 || selectedCareers.length > 0 || selectedUnits.length > 0) && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* Section Selection Modal */}
      {showSectionModal && currentCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Select Sections for {currentCourse.subject} {currentCourse.code}
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
              {Object.entries(currentCourse.terms[currentTerm]).map(([sectionName, section]) => {
                const isSelected = selectedSections.has(sectionName);
                const hasSubs = hasSubsections(sectionName, currentCourse.terms[currentTerm]);
                const relatedSubsections = hasSubs ? getRelatedSubsections(sectionName, currentCourse.terms[currentTerm]) : [];
                
                console.log(`Section ${sectionName}: hasSubs=${hasSubs}, related=${relatedSubsections.map(([name]) => name).join(', ')}`);
                
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

export default CourseSearchPage; 