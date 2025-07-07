const express = require('express');
const dataFetcher = require('../services/dataFetcher');

const router = express.Router();

// GET /api/courses - Get all courses with optional search and filters
router.get('/', async (req, res) => {
  try {
    const { q: query, subjects, academic_groups, careers, units, page = 1, limit = 25 } = req.query;
    
    const filters = {};
    if (subjects) filters.subjects = subjects.split(',');
    if (academic_groups) filters.academic_groups = academic_groups.split(',');
    if (careers) filters.careers = careers.split(',');
    if (units) filters.units = units.split(',');

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await dataFetcher.searchCourses(query, filters, pagination);
    
    res.json({
      success: true,
      data: result
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

// GET /api/courses/careers - Get all career options
router.get('/careers', async (req, res) => {
  try {
    const careers = await dataFetcher.getCareers();
    
    res.json({
      success: true,
      data: careers
    });
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch careers'
    });
  }
});

// GET /api/courses/units - Get all unit options
router.get('/units', async (req, res) => {
  try {
    const units = await dataFetcher.getUnits();
    
    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch units'
    });
  }
});

// GET /api/courses/debug/subjects - Debug endpoint to check available subjects
router.get('/debug/subjects', async (req, res) => {
  try {
    const data = await dataFetcher.getCourseData();
    const { courses } = data;
    
    const subjects = new Set();
    courses.forEach(course => {
      if (course.subject) {
        subjects.add(course.subject);
      }
    });
    
    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        subjects: Array.from(subjects).sort(),
        sampleCourses: courses.slice(0, 5).map(c => ({
          fullCode: c.fullCode,
          subject: c.subject,
          title: c.title
        }))
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get debug info'
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

// GET /api/courses/:subject/:code/details - Get course details with sections
router.get('/:subject/:code/details', async (req, res) => {
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
    console.error('Error fetching course details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course details'
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

// POST /api/courses/clear-cache - Clear the data cache
router.post('/clear-cache', async (req, res) => {
  try {
    dataFetcher.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
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