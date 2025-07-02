const express = require('express');
const dataFetcher = require('../services/dataFetcher');

const router = express.Router();

// GET /api/courses - Get all courses with optional search and filters
router.get('/', async (req, res) => {
  try {
    const { q: query, academic_group, career, units, limit = 50, offset = 0 } = req.query;
    
    const filters = {};
    if (academic_group) filters.academic_group = academic_group;
    if (career) filters.career = career;
    if (units) filters.units = units;

    const courses = await dataFetcher.searchCourses(query, filters);
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCourses = courses.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        courses: paginatedCourses,
        total: courses.length,
        limit: parseInt(limit),
        offset: startIndex,
        hasMore: endIndex < courses.length
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    });
  }
});

// GET /api/courses/subjects - Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await dataFetcher.getSubjects();
    
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects'
    });
  }
});

// GET /api/courses/subjects/:subject - Get courses by subject code
router.get('/subjects/:subject', async (req, res) => {
  try {
    const subject = req.params.subject.toUpperCase();
    const courses = await dataFetcher.getCourseListBySubject(subject);
    
    res.json({
      success: true,
      data: {
        subject,
        courses
      }
    });
  } catch (error) {
    console.error('Error fetching subject courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject courses'
    });
  }
});

// GET /api/courses/academic-groups - Get all academic groups
router.get('/academic-groups', async (req, res) => {
  try {
    const groups = await dataFetcher.getAcademicGroups();
    
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching academic groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch academic groups'
    });
  }
});

// GET /api/courses/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const courses = await dataFetcher.searchCourses(query);
    const suggestions = courses.slice(0, 10).map(course => ({
      id: course.code,
      title: course.title,
      academic_group: course.academic_group
    }));
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions'
    });
  }
});

// GET /api/courses/:subject/:code - Get course by subject and code
router.get('/:subject/:code', async (req, res) => {
  try {
    const subject = req.params.subject.toUpperCase();
    const code = req.params.code;
    const course = await dataFetcher.getCourseBySubjectAndCode(subject, code);
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course by subject and code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    });
  }
});

// GET /api/courses/:id - Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await dataFetcher.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    });
  }
});

// POST /api/courses/validate-schedule - Validate course schedule for conflicts
router.post('/validate-schedule', async (req, res) => {
  try {
    const { courses } = req.body;
    
    if (!Array.isArray(courses)) {
      return res.status(400).json({
        success: false,
        error: 'Courses must be an array'
      });
    }
    
    const conflicts = [];
    const schedule = new Map(); // day -> time slots
    
    for (const courseId of courses) {
      const course = await dataFetcher.getCourseById(courseId);
      if (!course || !course.terms) continue;
      
      // Check each term's sections for time conflicts
      for (const [termName, sections] of Object.entries(course.terms)) {
        for (const [sectionName, section] of Object.entries(sections)) {
          if (!section.days || !section.startTimes || !section.endTimes) continue;
          
          for (let i = 0; i < section.days.length; i++) {
            const day = section.days[i];
            const startTime = section.startTimes[i];
            const endTime = section.endTimes[i];
            
            const timeSlot = `${startTime}-${endTime}`;
            
            if (!schedule.has(day)) {
              schedule.set(day, new Set());
            }
            
            const daySchedule = schedule.get(day);
            
            // Check for conflicts
            for (const existingSlot of daySchedule) {
              const [existingStart, existingEnd] = existingSlot.split('-');
              
              if (hasTimeConflict(startTime, endTime, existingStart, existingEnd)) {
                conflicts.push({
                  course1: courseId,
                  course2: 'conflicting course', // Would need to track which course
                  day,
                  time1: timeSlot,
                  time2: existingSlot
                });
              }
            }
            
            daySchedule.add(timeSlot);
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts
      }
    });
  } catch (error) {
    console.error('Error validating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate schedule'
    });
  }
});

// Helper method to check time conflicts
function hasTimeConflict(start1, end1, start2, end2) {
  const parseTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  return (s1 < e2 && s2 < e1);
}

module.exports = router; 