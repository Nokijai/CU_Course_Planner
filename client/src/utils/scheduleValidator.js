// Time conflict detection utilities
export const parseTime = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const hasTimeConflict = (start1, end1, start2, end2) => {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  return (s1 < e2 && s2 < e1);
};

export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getDayName = (dayNumber) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber - 1] || 'Unknown';
};

export const getDayShortName = (dayNumber) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayNumber - 1] || 'Unknown';
};

// Schedule validation
export const validateSchedule = (courses) => {
  const conflicts = [];
  const schedule = new Map(); // day -> array of time slots with course info
  
  for (const course of courses) {
    if (!course.terms) continue;
    
    for (const [termName, sections] of Object.entries(course.terms)) {
      for (const [sectionName, section] of Object.entries(sections)) {
        if (!section.days || !section.startTimes || !section.endTimes) continue;
        
        for (let i = 0; i < section.days.length; i++) {
          const day = section.days[i];
          const startTime = section.startTimes[i];
          const endTime = section.endTimes[i];
          
          if (!schedule.has(day)) {
            schedule.set(day, []);
          }
          
          const daySchedule = schedule.get(day);
          const timeSlot = {
            start: startTime,
            end: endTime,
            course: course.code,
            title: course.title,
            section: sectionName,
            term: termName
          };
          
          // Check for conflicts with existing time slots
          for (const existingSlot of daySchedule) {
            if (hasTimeConflict(startTime, endTime, existingSlot.start, existingSlot.end)) {
              conflicts.push({
                course1: {
                  code: course.code,
                  title: course.title,
                  section: sectionName,
                  term: termName,
                  day: getDayName(day),
                  time: `${formatTime(startTime)} - ${formatTime(endTime)}`
                },
                course2: {
                  code: existingSlot.course,
                  title: existingSlot.title,
                  section: existingSlot.section,
                  term: existingSlot.term,
                  day: getDayName(day),
                  time: `${formatTime(existingSlot.start)} - ${formatTime(existingSlot.end)}`
                }
              });
            }
          }
          
          daySchedule.push(timeSlot);
        }
      }
    }
  }
  
  return {
    isValid: conflicts.length === 0,
    conflicts,
    schedule: Object.fromEntries(schedule)
  };
};

// Course prerequisite checking
export const checkPrerequisites = (course, completedCourses) => {
  if (!course.requirements) return { satisfied: true, missing: [] };
  
  const requirements = course.requirements.toLowerCase();
  const completedCodes = completedCourses.map(c => c.code.toLowerCase());
  
  // Simple prerequisite checking - can be enhanced with more sophisticated parsing
  const missing = [];
  
  // Check for common prerequisite patterns
  const patterns = [
    /prerequisite:\s*([^.]+)/i,
    /pre-requisite:\s*([^.]+)/i,
    /prerequisites:\s*([^.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = requirements.match(pattern);
    if (match) {
      const prereqText = match[1];
      // This is a simplified check - in a real implementation, you'd want more sophisticated parsing
      const prereqCodes = prereqText.match(/[A-Z]{4}\d{4}/g) || [];
      
      for (const code of prereqCodes) {
        if (!completedCodes.includes(code.toLowerCase())) {
          missing.push(code);
        }
      }
    }
  }
  
  return {
    satisfied: missing.length === 0,
    missing
  };
};

// Credit limit checking
export const checkCreditLimit = (courses, maxCredits = 21) => {
  const totalCredits = courses.reduce((sum, course) => {
    const credits = parseFloat(course.units) || 0;
    return sum + credits;
  }, 0);
  
  return {
    withinLimit: totalCredits <= maxCredits,
    totalCredits,
    maxCredits,
    remaining: maxCredits - totalCredits
  };
};

// Generate schedule summary
export const generateScheduleSummary = (courses) => {
  const summary = {
    totalCourses: courses.length,
    totalCredits: 0,
    terms: new Set(),
    academicGroups: new Set(),
    scheduleByDay: {},
    conflicts: []
  };
  
  for (const course of courses) {
    // Add credits
    const credits = parseFloat(course.units) || 0;
    summary.totalCredits += credits;
    
    // Add academic group
    if (course.academic_group) {
      summary.academicGroups.add(course.academic_group);
    }
    
    // Process schedule
    if (course.terms) {
      for (const [termName, sections] of Object.entries(course.terms)) {
        summary.terms.add(termName);
        
        for (const [sectionName, section] of Object.entries(sections)) {
          if (section.days && section.startTimes && section.endTimes) {
            for (let i = 0; i < section.days.length; i++) {
              const day = section.days[i];
              const startTime = section.startTimes[i];
              const endTime = section.endTimes[i];
              
              if (!summary.scheduleByDay[day]) {
                summary.scheduleByDay[day] = [];
              }
              
              summary.scheduleByDay[day].push({
                course: course.code,
                title: course.title,
                section: sectionName,
                term: termName,
                startTime,
                endTime,
                location: section.locations?.[i] || 'TBA',
                instructor: section.instructors?.[i] || 'TBA'
              });
            }
          }
        }
      }
    }
  }
  
  // Convert sets to arrays
  summary.terms = Array.from(summary.terms);
  summary.academicGroups = Array.from(summary.academicGroups);
  
  // Sort schedule by time
  for (const day in summary.scheduleByDay) {
    summary.scheduleByDay[day].sort((a, b) => 
      parseTime(a.startTime) - parseTime(b.startTime)
    );
  }
  
  return summary;
};

// Export schedule to different formats
export const exportScheduleToText = (courses) => {
  const summary = generateScheduleSummary(courses);
  let text = 'CUHK Course Schedule\n';
  text += '====================\n\n';
  
  text += `Total Courses: ${summary.totalCourses}\n`;
  text += `Total Credits: ${summary.totalCredits}\n`;
  text += `Terms: ${summary.terms.join(', ')}\n\n`;
  
  text += 'Schedule by Day:\n';
  text += '================\n\n';
  
  const dayOrder = [1, 2, 3, 4, 5, 6, 7]; // Monday to Sunday
  
  for (const day of dayOrder) {
    if (summary.scheduleByDay[day] && summary.scheduleByDay[day].length > 0) {
      text += `${getDayName(day)}:\n`;
      text += '--------\n';
      
      for (const slot of summary.scheduleByDay[day]) {
        text += `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}\n`;
        text += `${slot.course} - ${slot.title}\n`;
        text += `Section: ${slot.section} (${slot.term})\n`;
        text += `Location: ${slot.location}\n`;
        text += `Instructor: ${slot.instructor}\n\n`;
      }
    }
  }
  
  return text;
};

export const exportScheduleToCSV = (courses) => {
  const headers = ['Course Code', 'Title', 'Units', 'Academic Group', 'Term', 'Section', 'Day', 'Start Time', 'End Time', 'Location', 'Instructor'];
  const rows = [headers];
  
  for (const course of courses) {
    if (course.terms) {
      for (const [termName, sections] of Object.entries(course.terms)) {
        for (const [sectionName, section] of Object.entries(sections)) {
          if (section.days && section.startTimes && section.endTimes) {
            for (let i = 0; i < section.days.length; i++) {
              const day = section.days[i];
              const startTime = section.startTimes[i];
              const endTime = section.endTimes[i];
              const location = section.locations?.[i] || 'TBA';
              const instructor = section.instructors?.[i] || 'TBA';
              
              rows.push([
                course.code,
                course.title,
                course.units,
                course.academic_group,
                termName,
                sectionName,
                getDayName(day),
                startTime,
                endTime,
                location,
                instructor
              ]);
            }
          }
        }
      }
    }
  }
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}; 