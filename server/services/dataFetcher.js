const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const config = require('../config/env');

class DataFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.courseList = null;
    this.courses = [];
  }

  // Check if cache is valid
  isCacheValid(key) {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - timestamp;
    return cacheAge < (config.cacheDuration * 1000);
  }

  // Get data from cache or fetch fresh data
  async getData(key, fetchFunction) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }

    const data = await fetchFunction();
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
    return data;
  }

  // Fetch course data from local files (for development)
  async fetchLocalCourseData() {
    try {
      const coursesDir = path.join(__dirname, config.localDataPath, 'courses');
      const resourcesDir = path.join(__dirname, config.localDataPath, 'resources');
      
      // Read course list with error handling
      let courseList = {};
      try {
        const courseListPath = path.join(resourcesDir, 'course_list.json');
        const courseListData = await fs.readFile(courseListPath, 'utf8');
        courseList = JSON.parse(courseListData);
        this.courseList = courseList;
      } catch (error) {
        console.error('Error reading course_list.json:', error.message);
        courseList = {};
      }

      // Read course files with better error handling
      const allCourses = [];
      try {
        const courseFiles = await fs.readdir(coursesDir);
        
        for (const file of courseFiles) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(coursesDir, file);
              const fileData = await fs.readFile(filePath, 'utf8');
              const courses = JSON.parse(fileData);
              
              // Get the subject code from the filename (remove .json extension)
              const subjectCode = file.replace('.json', '');
              
              // Ensure courses is an array
              if (Array.isArray(courses)) {
                // Add subject prefix to course codes and add subject field
                const processedCourses = courses.map(course => ({
                  ...course,
                  subject: subjectCode,
                  fullCode: `${subjectCode}${course.code}`,
                  // Keep original code for backward compatibility
                  code: course.code
                }));
                allCourses.push(...processedCourses);
              } else if (typeof courses === 'object') {
                // If it's an object, try to extract courses from it
                const courseArray = Object.values(courses).flat().filter(item => 
                  item && typeof item === 'object' && item.code
                );
                // Add subject prefix to course codes and add subject field
                const processedCourses = courseArray.map(course => ({
                  ...course,
                  subject: subjectCode,
                  fullCode: `${subjectCode}${course.code}`,
                  // Keep original code for backward compatibility
                  code: course.code
                }));
                allCourses.push(...processedCourses);
              }
            } catch (fileError) {
              console.error(`Error reading course file ${file}:`, fileError.message);
              continue; // Skip this file and continue with others
            }
          }
        }
        
        this.courses = allCourses;
      } catch (error) {
        console.error('Error reading course files:', error.message);
        // Return empty array if we can't read course files
        this.courses = [];
      }

      return {
        courseList,
        courses: allCourses,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching local course data:', error);
      // Return empty data structure instead of throwing
      return {
        courseList: {},
        courses: [],
        timestamp: Date.now()
      };
    }
  }

  // Fetch course data from external API
  async fetchExternalCourseData() {
    try {
      const response = await axios.get(config.externalDataUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'CUHK-Course-Planner/1.0'
        }
      });
      
      return {
        ...response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching external course data:', error);
      throw new Error('Failed to fetch external course data');
    }
  }

  // Get course data (prefer external, fallback to local)
  async getCourseData() {
    return this.getData('courseData', async () => {
      try {
        return await this.fetchExternalCourseData();
      } catch (error) {
        console.log('Falling back to local data:', error.message);
        return await this.fetchLocalCourseData();
      }
    });
  }

  // Search courses by query with better performance and intelligent scoring
  async searchCourses(query, filters = {}, pagination = {}) {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      
      if (!courses || courses.length === 0) {
        return [];
      }
      
      if (!query && Object.keys(filters).length === 0) {
        return courses.slice(0, 100); // Return first 100 courses if no search
      }

      const searchTerm = query ? query.toLowerCase().trim() : '';
      
      // First, filter courses based on search term and filters
      const filteredCourses = courses.filter(course => {
        // Apply filters first
        if (filters.subjects && filters.subjects.length > 0) {
          if (!filters.subjects.includes(course.subject)) {
            return false;
          }
        }
        
        if (filters.academic_groups && filters.academic_groups.length > 0) {
          if (!filters.academic_groups.includes(course.academic_group)) {
            return false;
          }
        }
        
        if (filters.careers && filters.careers.length > 0) {
          if (!filters.careers.includes(course.career)) {
            return false;
          }
        }
        
        if (filters.units && filters.units.length > 0) {
          if (!filters.units.includes(course.units)) {
            return false;
          }
        }

        // If no search term, return true (filters only)
        if (!searchTerm) {
          return true;
        }

        // Check if course matches search term
        const fullCode = (course.fullCode || '').toLowerCase();
        const subject = (course.subject || '').toLowerCase();
        const code = (course.code || '').toLowerCase();
        const title = (course.title || '').toLowerCase();
        const description = (course.description || '').toLowerCase();

        // Priority 1: Exact full code match (highest priority)
        if (fullCode === searchTerm) {
          return true;
        }

        // Priority 2: Full code starts with search term
        if (fullCode.startsWith(searchTerm)) {
          return true;
        }

        // Priority 3: Subject starts with search term
        if (subject.startsWith(searchTerm)) {
          return true;
        }

        // Priority 4: Code starts with search term
        if (code.startsWith(searchTerm)) {
          return true;
        }

        // Priority 5: Title or description contains search term (lowest priority)
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
          return true;
        }

        return false;
      });

      // Score and sort the filtered courses
      const scoredCourses = filteredCourses.map(course => {
        const fullCode = (course.fullCode || '').toLowerCase();
        const subject = (course.subject || '').toLowerCase();
        const code = (course.code || '').toLowerCase();
        const title = (course.title || '').toLowerCase();
        const description = (course.description || '').toLowerCase();

        let score = 0;

        // Scoring system (higher score = higher priority)
        if (fullCode === searchTerm) {
          score += 1000; // Exact full code match
        } else if (fullCode.startsWith(searchTerm)) {
          score += 500; // Full code starts with search term
        } else if (subject.startsWith(searchTerm)) {
          score += 300; // Subject starts with search term
        } else if (code.startsWith(searchTerm)) {
          score += 200; // Code starts with search term
        } else if (title.includes(searchTerm)) {
          score += 50; // Title contains search term
        } else if (description.includes(searchTerm)) {
          score += 10; // Description contains search term
        }

        // Bonus for shorter matches (more specific)
        if (fullCode.startsWith(searchTerm)) {
          score += (fullCode.length - searchTerm.length) * -1;
        }

        return { ...course, _searchScore: score };
      });

      // Sort by score (highest first), then by course number (ascending), then by subject
      const sortedCourses = scoredCourses
        .sort((a, b) => {
          // First sort by search score (highest first)
          if (b._searchScore !== a._searchScore) {
            return b._searchScore - a._searchScore;
          }
          
          // If same score, sort by subject alphabetically
          if (a.subject !== b.subject) {
            return a.subject.localeCompare(b.subject);
          }
          
          // If same subject, sort by course number numerically
          const aCode = parseInt(a.code) || 0;
          const bCode = parseInt(b.code) || 0;
          return aCode - bCode;
        })
        .map(({ _searchScore, ...course }) => course);

      // Apply pagination
      const { page = 1, limit = 25 } = pagination;
      const pageSize = Math.min(Math.max(parseInt(limit), 1), 100); // Limit max page size to 100
      const currentPage = Math.max(parseInt(page), 1);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const totalCourses = sortedCourses.length;
      const totalPages = Math.ceil(totalCourses / pageSize);
      const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

      return {
        courses: paginatedCourses,
        pagination: {
          currentPage,
          pageSize,
          totalCourses,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1
        }
      };

    } catch (error) {
      console.error('Error searching courses:', error);
      return {
        courses: [],
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalCourses: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }

  // Get course by ID
  async getCourseById(courseId) {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      
      if (!courses || courses.length === 0) {
        return null;
      }
      
      return courses.find(course => course.code === courseId);
    } catch (error) {
      console.error('Error getting course by ID:', error);
      return null;
    }
  }

  // Get academic groups (departments)
  async getAcademicGroups() {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      
      if (!courses || courses.length === 0) {
        return [];
      }
      
      const groups = new Set();
      courses.forEach(course => {
        if (course.academic_group) {
          groups.add(course.academic_group);
        }
      });
      
      return Array.from(groups).sort();
    } catch (error) {
      console.error('Error getting academic groups:', error);
      return [];
    }
  }

  // Get career options
  async getCareers() {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      
      if (!courses || courses.length === 0) {
        return [];
      }
      
      const careers = new Set();
      courses.forEach(course => {
        if (course.career) {
          careers.add(course.career);
        }
      });
      
      return Array.from(careers).sort();
    } catch (error) {
      console.error('Error getting careers:', error);
      return [];
    }
  }

  // Get unit options
  async getUnits() {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      
      if (!courses || courses.length === 0) {
        return [];
      }
      
      const units = new Set();
      courses.forEach(course => {
        if (course.units) {
          units.add(course.units);
        }
      });
      
      return Array.from(units).sort((a, b) => parseFloat(a) - parseFloat(b));
    } catch (error) {
      console.error('Error getting units:', error);
      return [];
    }
  }

  // Get course list by subject
  async getCourseListBySubject(subject) {
    try {
      const data = await this.getCourseData();
      const { courseList } = data;
      
      return courseList[subject] || [];
    } catch (error) {
      console.error('Error getting course list by subject:', error);
      return [];
    }
  }

  // Get subjects list
  async getSubjects() {
    try {
      const data = await this.getCourseData();
      const { courseList } = data;
      
      return Object.keys(courseList || {}).sort();
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }

  // Get course by subject and code
  async getCourseBySubjectAndCode(subject, code) {
    try {
      const data = await this.getCourseData();
      const { courses } = data;
      if (!courses || courses.length === 0) {
        return null;
      }
      return courses.find(course => course.subject === subject && course.code === code);
    } catch (error) {
      console.error('Error getting course by subject and code:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

module.exports = new DataFetcher(); 