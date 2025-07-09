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
      
      console.log('Fetching local course data from:', coursesDir);
      
      // Read course list with error handling
      let courseList = {};
      try {
        const courseListPath = path.join(resourcesDir, 'course_list.json');
        const courseListData = await fs.readFile(courseListPath, 'utf8');
        courseList = JSON.parse(courseListData);
        this.courseList = courseList;
        console.log('Course list loaded successfully');
      } catch (error) {
        console.error('Error reading course_list.json:', error.message);
        courseList = {};
      }

      // Read course files with better error handling
      const allCourses = [];
      try {
        const courseFiles = await fs.readdir(coursesDir);
        console.log(`Found ${courseFiles.length} course files`);
        
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
                
                // Debug: Log first course from each subject to verify subject field
                if (processedCourses.length > 0) {
                  console.log(`Processed ${processedCourses.length} courses for ${subjectCode}. First course: ${processedCourses[0].subject} ${processedCourses[0].code} - ${processedCourses[0].title}`);
                }
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
                
                // Debug: Log first course from each subject to verify subject field
                if (processedCourses.length > 0) {
                  console.log(`Processed ${processedCourses.length} courses for ${subjectCode}. First course: ${processedCourses[0].subject} ${processedCourses[0].code} - ${processedCourses[0].title}`);
                }
              }
            } catch (fileError) {
              console.error(`Error reading course file ${file}:`, fileError.message);
              continue; // Skip this file and continue with others
            }
          }
        }
        
        console.log(`Successfully loaded ${allCourses.length} total courses`);
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
        console.log('No courses found in data');
        return [];
      }
      
      if (!query && Object.keys(filters).length === 0) {
        return {
          courses: courses.slice(0, 100), // Return first 100 courses if no search
          pagination: {
            currentPage: 1,
            pageSize: 100,
            totalCourses: courses.length,
            totalPages: Math.ceil(courses.length / 100),
            hasNextPage: courses.length > 100,
            hasPrevPage: false
          }
        };
      }

      const searchTerm = query ? query.toLowerCase().trim() : '';
      console.log(`Searching for: "${searchTerm}" with filters:`, filters);
      
      // Priority 1: Exact course code matches (e.g., "MATH1510")
      let exactCodeMatches = [];
      if (searchTerm) {
        exactCodeMatches = courses.filter(course => {
          const fullCode = `${course.subject}${course.code}`.toLowerCase();
          return fullCode === searchTerm;
        });
        console.log(`Found ${exactCodeMatches.length} exact course code matches`);
      }
      
      // If we have exact course code matches, return them (with filters applied)
      if (exactCodeMatches.length > 0) {
        const filteredExactMatches = exactCodeMatches.filter(course => {
          // Apply filters
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
          return true;
        });
        console.log(`Returning ${filteredExactMatches.length} exact course code matches after filtering`);
        // Pagination
        const { page = 1, limit = 25 } = pagination;
        const pageSize = Math.min(Math.max(parseInt(limit), 1), 100);
        const currentPage = Math.max(parseInt(page), 1);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const totalCourses = filteredExactMatches.length;
        const totalPages = Math.ceil(totalCourses / pageSize);
        const paginatedCourses = filteredExactMatches.slice(startIndex, endIndex);
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
      }
      
      // Priority 2: Exact subject matches (e.g., "MATH")
      let exactSubjectMatches = [];
      if (searchTerm) {
        exactSubjectMatches = courses.filter(course => 
          course.subject && course.subject.toLowerCase() === searchTerm
        );
        console.log(`Found ${exactSubjectMatches.length} exact subject matches`);
      }
      // If we have exact subject matches, return them (with filters applied)
      if (exactSubjectMatches.length > 0) {
        const filteredExactMatches = exactSubjectMatches.filter(course => {
          // Apply filters
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
          return true;
        });
        console.log(`Returning ${filteredExactMatches.length} exact subject matches after filtering`);
        // Pagination
        const { page = 1, limit = 25 } = pagination;
        const pageSize = Math.min(Math.max(parseInt(limit), 1), 100);
        const currentPage = Math.max(parseInt(page), 1);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const totalCourses = filteredExactMatches.length;
        const totalPages = Math.ceil(totalCourses / pageSize);
        const paginatedCourses = filteredExactMatches.slice(startIndex, endIndex);
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
      }
      // Priority 3: Course code starts with matches (e.g., typing "m" shows courses with codes starting with "m")
      let startsWithMatches = [];
      if (searchTerm) {
        startsWithMatches = courses.filter(course => {
          // Check if course code starts with search term
          const fullCode = `${course.subject}${course.code}`.toLowerCase();
          if (fullCode.startsWith(searchTerm)) {
            return true;
          }
          // Check if subject starts with search term
          if (course.subject && course.subject.toLowerCase().startsWith(searchTerm)) {
            return true;
          }
          return false;
        });
        console.log(`Found ${startsWithMatches.length} starts with matches`);
      }
      // If we have starts with matches, return them (with filters applied)
      if (startsWithMatches.length > 0) {
        const filteredStartsWithMatches = startsWithMatches.filter(course => {
          // Apply filters
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
          return true;
        });
        console.log(`Returning ${filteredStartsWithMatches.length} starts with matches after filtering`);
        // Pagination
        const { page = 1, limit = 25 } = pagination;
        const pageSize = Math.min(Math.max(parseInt(limit), 1), 100);
        const currentPage = Math.max(parseInt(page), 1);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const totalCourses = filteredStartsWithMatches.length;
        const totalPages = Math.ceil(totalCourses / pageSize);
        const paginatedCourses = filteredStartsWithMatches.slice(startIndex, endIndex);
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
      }
      // Priority 4: If no exact matches, then search in titles and descriptions
      const filteredCourses = courses.filter(course => {
        // Text search - search title and description only if no exact matches
        if (searchTerm) {
          // Search in title and description
          const searchableText = [
            course.title || '',
            course.description || ''
          ].join(' ').toLowerCase();
          if (searchableText.includes(searchTerm)) {
            return true;
          }
          return false;
        }
        // Apply filters
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
        return false;
      });
      // Pagination for fallback search
      const { page = 1, limit = 25 } = pagination;
      const pageSize = Math.min(Math.max(parseInt(limit), 1), 100);
      const currentPage = Math.max(parseInt(page), 1);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const totalCourses = filteredCourses.length;
      const totalPages = Math.ceil(totalCourses / pageSize);
      const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
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
      
      // Find the course with the exact subject and code match
      const course = courses.find(course => course.subject === subject && course.code === code);
      
      if (!course) {
        return null;
      }
      
      // Return the complete course data including terms
      return course;
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