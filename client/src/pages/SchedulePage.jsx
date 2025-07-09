import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, BookOpen, Trash2, AlertTriangle, CheckCircle, Download, Upload, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSchedule, saveSchedule, exportSchedule, importSchedule } from '../utils/localStorage';
import { validateSchedule } from '../utils/scheduleValidator';
import CourseSearchBox from '../components/CourseSearchBox';
import TimetableToolbar from '../components/TimetableToolbar';

function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [selectedConflictSlots, setSelectedConflictSlots] = useState({});
  const [visibleCourses, setVisibleCourses] = useState(new Set()); // Track which courses are visible in timetable
  const [visibleSections, setVisibleSections] = useState(new Set()); // Track which sections are visible in timetable
  const [currentTimetableId, setCurrentTimetableId] = useState(''); // Track current timetable

  useEffect(() => {
    loadCurrentTimetable();
  }, [currentTimetableId]);

  const loadCurrentTimetable = () => {
    const savedSchedule = getSchedule() || [];
    setSchedule(savedSchedule);
    
    // Initialize all courses and sections as visible by default
    const initialVisibleCourses = new Set();
    const initialVisibleSections = new Set();
    
    savedSchedule.forEach(course => {
      const courseKey = `${course.subject}-${course.code}`;
      initialVisibleCourses.add(courseKey);
      
      // Add all sections as visible by default
      if (course.selectedSections && course.selectedSections.length > 0) {
        course.selectedSections.forEach(sectionName => {
          const sectionKey = `${courseKey}-${sectionName}`;
          initialVisibleSections.add(sectionKey);
        });
      }
    });
    
    setVisibleCourses(initialVisibleCourses);
    setVisibleSections(initialVisibleSections);
    
    // Calculate total units (count once per unique course, not per section)
    const uniqueCourses = new Map();
    savedSchedule.forEach(course => {
      const courseKey = `${course.subject}-${course.code}`;
      if (!uniqueCourses.has(courseKey)) {
        uniqueCourses.set(courseKey, course);
      }
    });
    const units = Array.from(uniqueCourses.values()).reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    // Check for conflicts
    const scheduleConflicts = validateSchedule(savedSchedule);
    setConflicts(scheduleConflicts.conflicts || []);
  };

  const handleTimetableChange = (newTimetableId) => {
    setCurrentTimetableId(newTimetableId);
  };

  const removeCourse = (subject, code) => {
    const updated = schedule.filter(c => c.subject !== subject || c.code !== code);
    setSchedule(updated);
    saveSchedule(updated);
    
    // Remove course from visible set
    setVisibleCourses(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${subject}-${code}`);
      return newSet;
    });
    
    // Recalculate units and conflicts (count once per unique course, not per section)
    const uniqueCourses = new Map();
    updated.forEach(course => {
      const courseKey = `${course.subject}-${course.code}`;
      if (!uniqueCourses.has(courseKey)) {
        uniqueCourses.set(courseKey, course);
      }
    });
    const units = Array.from(uniqueCourses.values()).reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    const scheduleConflicts = validateSchedule(updated);
    setConflicts(scheduleConflicts.conflicts || []);
  };

  const removeSectionFromCourse = (subject, code, sectionName) => {
    const updated = schedule.map(course => {
      if (course.subject === subject && course.code === code) {
        // Remove the specific section from selectedSections
        const updatedSelectedSections = course.selectedSections.filter(section => section !== sectionName);
        
        // If no sections remain, remove the entire course
        if (updatedSelectedSections.length === 0) {
          return null; // This will be filtered out
        }
        
        // Update the schedule data to remove the specific section
        const updatedSchedule = course.schedule.filter(item => item.section !== sectionName);
        
        return {
          ...course,
          selectedSections: updatedSelectedSections,
          schedule: updatedSchedule
        };
      }
      return course;
    }).filter(course => course !== null); // Remove null entries
    
    setSchedule(updated);
    saveSchedule(updated);
    
    // Update visible courses and sections if needed
    setVisibleCourses(prev => {
      const newSet = new Set(prev);
      // Only remove from visible if the course is completely removed
      if (!updated.some(c => c.subject === subject && c.code === code)) {
        newSet.delete(`${subject}-${code}`);
      }
      return newSet;
    });
    
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      // Remove the specific section from visible sections
      newSet.delete(`${subject}-${code}-${sectionName}`);
      return newSet;
    });
    
    // Recalculate units and conflicts (count once per unique course, not per section)
    const uniqueCourses = new Map();
    updated.forEach(course => {
      const courseKey = `${course.subject}-${course.code}`;
      if (!uniqueCourses.has(courseKey)) {
        uniqueCourses.set(courseKey, course);
      }
    });
    const units = Array.from(uniqueCourses.values()).reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    const scheduleConflicts = validateSchedule(updated);
    setConflicts(scheduleConflicts.conflicts || []);
  };

  const handleExport = () => {
    exportSchedule();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      importSchedule(file).then(() => {
        // Reload the current timetable after import
        loadCurrentTimetable();
      }).catch((error) => {
        console.error('Error importing schedule:', error);
        alert('Error importing schedule. Please check the file format.');
      });
    }
  };

  const clearSchedule = () => {
    if (window.confirm('Are you sure you want to clear your entire schedule?')) {
      setSchedule([]);
      saveSchedule([]);
      setTotalCredits(0);
      setConflicts([]);
      setVisibleCourses(new Set());
    }
  };

  const handleCourseAdded = (course) => {
    // Refresh schedule data after a course is added or removed
    const savedSchedule = getSchedule() || [];
    setSchedule(savedSchedule);
    
    // Add new courses and sections to visible sets
    setVisibleCourses(prev => {
      const newSet = new Set(prev);
      savedSchedule.forEach(c => {
        newSet.add(`${c.subject}-${c.code}`);
      });
      return newSet;
    });
    
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      savedSchedule.forEach(course => {
        if (course.selectedSections && course.selectedSections.length > 0) {
          course.selectedSections.forEach(sectionName => {
            newSet.add(`${course.subject}-${course.code}-${sectionName}`);
          });
        }
      });
      return newSet;
    });
    
    // Recalculate units and conflicts (count once per unique course, not per section)
    const uniqueCourses = new Map();
    savedSchedule.forEach(course => {
      const courseKey = `${course.subject}-${course.code}`;
      if (!uniqueCourses.has(courseKey)) {
        uniqueCourses.set(courseKey, course);
      }
    });
    const units = Array.from(uniqueCourses.values()).reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    const scheduleConflicts = validateSchedule(savedSchedule);
    setConflicts(scheduleConflicts.conflicts || []);
  };

  // Time slots from 9:00 to 21:00
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
  ];

  // Color palette for different course types
  const courseColors = [
    'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100',
    'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
    'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
    'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100'
  ];

  // Days of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Helper function to parse time to minutes for comparison
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'TBA') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to get day name from day number
  const getDayName = (dayNumber) => {
    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return dayNames[dayNumber] || '';
  };

  // Helper function to calculate time slot position
  const getTimeSlotPosition = (timeStr) => {
    const minutes = parseTime(timeStr);
    if (minutes === 0) return 0;
    // Find the closest time slot
    for (let i = 0; i < timeSlots.length; i++) {
      const slotMinutes = parseTime(timeSlots[i]);
      if (minutes <= slotMinutes) return i;
    }
    return timeSlots.length - 1;
  };

  // Helper function to calculate duration in time slots
  const getDurationInSlots = (startTime, endTime) => {
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    if (startMinutes === 0 || endMinutes === 0) return 1;
    const durationMinutes = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(durationMinutes / 60));
  };

  // Helper function to check if a slot has conflicts
  const hasConflict = (slot) => {
    if (!Array.isArray(conflicts)) return false;
    
    return conflicts.some(conflict => {
      const conflict1 = conflict.course1;
      const conflict2 = conflict.course2;
      
      // Check if this slot matches either course in the conflict
      const slotMatchesConflict1 = 
        conflict1.code === `${slot.course.subject}${slot.course.code}` &&
        conflict1.section === slot.section &&
        conflict1.day === slot.dayName;
        
      const slotMatchesConflict2 = 
        conflict2.code === `${slot.course.subject}${slot.course.code}` &&
        conflict2.section === slot.section &&
        conflict2.day === slot.dayName;
        
      return slotMatchesConflict1 || slotMatchesConflict2;
    });
  };

  // Helper function to check if two slots overlap in time
  const slotsOverlap = (slot1, slot2) => {
    if (slot1.dayName !== slot2.dayName) return false;
    
    const start1 = parseTime(slot1.startTime);
    const end1 = parseTime(slot1.endTime);
    const start2 = parseTime(slot2.startTime);
    const end2 = parseTime(slot2.endTime);
    
    return (start1 < end2 && start2 < end1);
  };

  // Helper function to get all conflicting slots for a specific time/day position
  const getConflictingSlots = (day, timeIndex) => {
    const slotsAtPosition = courseTimeSlots.filter(slot => 
      slot.dayName === day && slot.timeSlotPosition === timeIndex
    );
    
    if (slotsAtPosition.length <= 1) return [];
    
    // Check for overlapping slots at this position
    const overlappingSlots = [];
    
    for (let i = 0; i < slotsAtPosition.length; i++) {
      const slot1 = slotsAtPosition[i];
      let hasOverlap = false;
      
      for (let j = 0; j < slotsAtPosition.length; j++) {
        if (i !== j) {
          const slot2 = slotsAtPosition[j];
          if (slotsOverlap(slot1, slot2)) {
            hasOverlap = true;
            break;
          }
        }
      }
      
      if (hasOverlap) {
        overlappingSlots.push(slot1);
      }
    }
    
    return overlappingSlots;
  };

  // Helper function to get non-conflicting slots for a specific time/day position
  const getNonConflictingSlots = (day, timeIndex) => {
    const slotsAtPosition = courseTimeSlots.filter(slot => 
      slot.dayName === day && slot.timeSlotPosition === timeIndex
    );
    
    return slotsAtPosition.filter(slot => {
      // Check if this slot overlaps with any other slot at this position
      for (let i = 0; i < slotsAtPosition.length; i++) {
        const otherSlot = slotsAtPosition[i];
        if (slot !== otherSlot && slotsOverlap(slot, otherSlot)) {
          return false;
        }
      }
      return true;
    });
  };

  // Function to toggle course visibility
  const toggleCourseVisibility = (subject, code) => {
    const courseKey = `${subject}-${code}`;
    setVisibleCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseKey)) {
        newSet.delete(courseKey);
      } else {
        newSet.add(courseKey);
      }
      return newSet;
    });
  };

  const toggleSectionVisibility = (subject, code, sectionName) => {
    const sectionKey = `${subject}-${code}-${sectionName}`;
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  // Function to check if a course is visible
  const isCourseVisible = (subject, code) => {
    return visibleCourses.has(`${subject}-${code}`);
  };

  // Function to check if a section is visible
  const isSectionVisible = (subject, code, sectionName) => {
    const sectionKey = `${subject}-${code}-${sectionName}`;
    return visibleSections.has(sectionKey);
  };

  // Get course time slots for the timetable
  const courseTimeSlots = (() => {
    const slots = [];
    let slotIdCounter = 0; // Global counter for unique slot IDs
    
    schedule.forEach((course, courseIndex) => {
      // Only include courses that are visible
      if (!isCourseVisible(course.subject, course.code)) {
        return;
      }
      
      // Handle courses with sections (from course detail view)
      if (course.sections) {
        Object.entries(course.sections).forEach(([term, termSections]) => {
          Object.entries(termSections).forEach(([sectionName, section]) => {
            if (section.schedule && Array.isArray(section.schedule)) {
              section.schedule.forEach(scheduleItem => {
                if (scheduleItem.day && scheduleItem.startTime && scheduleItem.endTime) {
                  const dayName = getDayName(scheduleItem.day);
                  const timeSlotPosition = getTimeSlotPosition(scheduleItem.startTime);
                  const duration = getDurationInSlots(scheduleItem.startTime, scheduleItem.endTime);
                  
                  slots.push({
                    id: `slot-${++slotIdCounter}`, // Unique identifier
                    course,
                    section: sectionName,
                    dayName,
                    startTime: scheduleItem.startTime,
                    endTime: scheduleItem.endTime,
                    location: scheduleItem.location || 'TBA',
                    term: term,
                    timeSlotPosition,
                    duration,
                    colorIndex: courseIndex % courseColors.length
                  });
                }
              });
            }
          });
        });
      }
      
      // Handle courses with direct schedule data (from section selection)
      if (course.schedule && Array.isArray(course.schedule)) {
        course.schedule.forEach(scheduleItem => {
          if (scheduleItem.day && scheduleItem.startTime && scheduleItem.endTime) {
            // Check if this specific section is visible
            const sectionName = scheduleItem.section || course.selectedSection || 'Unknown';
            if (!isSectionVisible(course.subject, course.code, sectionName)) {
              return; // Skip this section if it's not visible
            }
            
            const dayName = getDayName(scheduleItem.day);
            const timeSlotPosition = getTimeSlotPosition(scheduleItem.startTime);
            const duration = getDurationInSlots(scheduleItem.startTime, scheduleItem.endTime);
            
            slots.push({
              id: `slot-${++slotIdCounter}`, // Unique identifier
              course,
              section: sectionName,
              dayName,
              startTime: scheduleItem.startTime,
              endTime: scheduleItem.endTime,
              location: scheduleItem.location || 'TBA',
              term: course.selectedTerm || 'Unknown',
              timeSlotPosition,
              duration,
              colorIndex: courseIndex % courseColors.length
            });
          }
        });
      }
    });
    return slots;
  })();

  // Helper function to get selected conflict index for a specific day/time
  const getSelectedConflictIndex = (day, timeIndex) => {
    const key = `${day}-${timeIndex}`;
    return selectedConflictSlots[key] || 0;
  };

  // Helper function to set selected conflict index for a specific day/time
  const setSelectedConflictIndex = (day, timeIndex, index) => {
    const key = `${day}-${timeIndex}`;
    setSelectedConflictSlots(prev => ({
      ...prev,
      [key]: index
    }));
  };

  // Helper function to cycle through conflict slots
  const cycleConflictSlot = (day, timeIndex, direction = 'next') => {
    const conflictingSlots = getConflictingSlots(day, timeIndex);
    if (conflictingSlots.length <= 1) return;
    
    const currentIndex = getSelectedConflictIndex(day, timeIndex);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % conflictingSlots.length;
    } else {
      newIndex = currentIndex === 0 ? conflictingSlots.length - 1 : currentIndex - 1;
    }
    
    setSelectedConflictIndex(day, timeIndex, newIndex);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Builder</h1>
        <p className="text-gray-600">Manage your course schedule and check for conflicts</p>
      </div>

      {/* Timetable Toolbar */}
      <TimetableToolbar onTimetableChange={handleTimetableChange} />

      {/* Main Layout - Three Column Layout */}
      <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Section - Course Search */}
        <div className="lg:w-[400px] lg:flex-shrink-0 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Search Courses</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CourseSearchBox onCourseSelect={handleCourseAdded} compact={true} disableExpansion={false} />
          </div>
        </div>

        {/* Middle Section - Timetable */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col min-w-0 max-w-2xl mx-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span>Units: <span className="font-semibold">{totalCredits}</span></span>
                <span>Courses: <span className="font-semibold">{visibleCourses.size}/{schedule.length}</span></span>
              </div>
            </div>
          </div>
          
          {/* Timetable Content */}
          <div className="flex-1 overflow-auto">
            {schedule.length > 0 ? (
              <div className="timetable-container h-full">
              {/* Day Headers */}
                <div className="grid grid-cols-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="p-2 bg-gray-50"></div> {/* Empty corner */}
                {days.map((day, index) => {
                  const daySlots = courseTimeSlots.filter(slot => slot.dayName === day);
                  const totalHours = daySlots.reduce((sum, slot) => {
                    const startMinutes = parseTime(slot.startTime);
                    const endMinutes = parseTime(slot.endTime);
                    return sum + (endMinutes - startMinutes) / 60;
                  }, 0);
                  
                  return (
                    <div key={day} className="p-2 bg-gray-50 border-l border-gray-200">
                      <div className="text-center">
                        <span className="font-semibold text-gray-900 text-xs">{day}</span>
                        <div className="text-xs text-gray-500">
                          ({totalHours.toFixed(1)}h)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
                {/* Time Grid */}
              <div className="grid grid-cols-6">
                {/* Time Labels */}
                <div className="border-r border-gray-200">
                  {timeSlots.map((time, index) => (
                    <div key={time} className="h-12 border-b border-gray-100 flex items-center justify-center text-xs text-gray-600 bg-gray-50">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day Columns */}
                {days.map((day, dayIndex) => (
                  <div key={day} className="relative border-r border-gray-200 last:border-r-0">
                    {timeSlots.map((time, timeIndex) => {
                      const conflictingSlots = getConflictingSlots(day, timeIndex);
                      const nonConflictingSlots = getNonConflictingSlots(day, timeIndex);
                      
                      return (
                        <div key={time} className="h-12 border-b border-gray-100 relative">
                          {/* Simple border for visual separation */}
                          <div className="absolute inset-0 border border-gray-100 opacity-50"></div>
                          
                          {/* Non-conflicting slots */}
                          {nonConflictingSlots.map((slot, slotIndex) => {
                            const uniqueKey = slot.id; // Use the unique slot ID
                            const isHovered = hoveredSlot === uniqueKey;
                            const colorClass = courseColors[slot.colorIndex];
                            const [bgColor, borderColor, textColor, hoverBgColor] = colorClass.split(' ');
                            
                            return (
                              <div
                                key={uniqueKey}
                                className={`absolute inset-1 ${isHovered ? hoverBgColor : bgColor} ${borderColor} rounded cursor-pointer transition-all duration-300 ease-in-out transform ${
                                  isHovered ? 'shadow-xl scale-110 z-50' : 'hover:shadow-lg hover:scale-105 z-10'
                                }`}
                                style={{
                                  height: isHovered ? 'auto' : `${Math.max(48, slot.duration * 48)}px`,
                                  minHeight: isHovered ? '150px' : `${Math.max(48, slot.duration * 48)}px`,
                                  width: 'calc(100% - 8px)',
                                  maxWidth: 'calc(100% - 8px)',
                                  whiteSpace: isHovered ? 'normal' : 'nowrap',
                                  padding: isHovered ? '10px 8px' : '6px',
                                  display: 'block',
                                  wordWrap: isHovered ? 'break-word' : 'normal',
                                  overflowWrap: isHovered ? 'break-word' : 'normal',
                                  transform: isHovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
                                  boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={() => setHoveredSlot(uniqueKey)}
                                onMouseLeave={() => setHoveredSlot(null)}
                              >
                                {isHovered ? (
                                  // Expanded view on hover
                                  <div className="break-words h-full flex flex-col justify-start space-y-1">
                                    <div className={`font-semibold ${textColor} text-xs leading-tight break-words`}>
                                      {slot.course.subject}{slot.course.code}
                                    </div>
                                    <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                      {slot.startTime}-{slot.endTime}
                                    </div>
                                    <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                      {slot.section}
                                    </div>
                                    {slot.location !== 'TBA' && (
                                      <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                        {slot.location}
                                      </div>
                                    )}
                                    <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                      {slot.term}
                                    </div>
                                  </div>
                                ) : (
                                  // Compact view when not hovering
                                  <div className="h-full flex flex-col justify-center">
                                    <div className={`font-semibold ${textColor} text-xs leading-tight truncate`}>
                                      {slot.course.subject}{slot.course.code}
                                    </div>
                                    <div className={`${textColor.replace('800', '600')} text-xs leading-tight truncate`}>
                                      {slot.startTime}-{slot.endTime}
                                    </div>
                                    <div className={`${textColor.replace('800', '600')} text-xs leading-tight truncate`}>
                                      {slot.section} {slot.location !== 'TBA' ? `• ${slot.location}` : ''}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Conflicting slots - Carousel Stack Style */}
                          {conflictingSlots.length > 0 && (
                            <div className="absolute inset-1 group">
                              {/* Navigation controls - only show on hover */}
                              {conflictingSlots.length > 1 && (
                                <div className="absolute -top-8 left-0 right-0 flex justify-center gap-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cycleConflictSlot(day, timeIndex, 'prev');
                                    }}
                                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md"
                                    title="Previous conflict"
                                  >
                                    ‹
                                  </button>
                                  <div className="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-bold shadow-md">
                                    {getSelectedConflictIndex(day, timeIndex) + 1}/{conflictingSlots.length}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cycleConflictSlot(day, timeIndex, 'next');
                                    }}
                                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md"
                                    title="Next conflict"
                                  >
                                    ›
                                  </button>
                                </div>
                              )}
                              
                              {conflictingSlots.map((slot, stackIndex) => {
                                const uniqueKey = `conflict-${slot.id}`; // Use the unique slot ID with conflict prefix
                                const isHovered = hoveredSlot === uniqueKey;
                                const colorClass = courseColors[slot.colorIndex];
                                const [bgColor, borderColor, textColor, hoverBgColor] = colorClass.split(' ');
                                const selectedIndex = getSelectedConflictIndex(day, timeIndex);
                                const isSelected = stackIndex === selectedIndex;
                                
                                // Enhanced stack positioning with better visual separation
                                const baseZIndex = 20;
                                const stackOffset = stackIndex * 3; // Increased offset for better separation
                                let zIndex, transform, opacity, pointerEvents;
                                
                                if (isSelected) {
                                  // Selected slot is fully visible and interactive
                                  zIndex = baseZIndex + conflictingSlots.length + 10;
                                  transform = isHovered 
                                    ? 'scale(1.3) translateY(-10px) translateX(-6px)' 
                                    : 'scale(1)';
                                  opacity = 1;
                                  pointerEvents = 'auto';
                                } else {
                                  // Non-selected slots are more hidden but still accessible via navigation
                                  zIndex = baseZIndex + stackIndex;
                                  transform = `scale(${0.7 - stackIndex * 0.15})`;
                                  opacity = 0.2;
                                  pointerEvents = 'none';
                                }
                                
                                return (
                                  <div
                                    key={uniqueKey}
                                    className={`absolute ${isHovered ? hoverBgColor : bgColor} ${borderColor} rounded cursor-pointer transition-all duration-300 ease-in-out transform ${
                                      isHovered ? 'shadow-2xl scale-125 z-50' : 'hover:shadow-lg hover:scale-105'
                                    }`}
                                    style={{
                                      height: isHovered ? 'auto' : `${Math.max(48, slot.duration * 48)}px`,
                                      minHeight: isHovered ? '160px' : `${Math.max(48, slot.duration * 48)}px`,
                                      maxWidth: 'calc(100% - 8px)',
                                      whiteSpace: isHovered ? 'normal' : 'nowrap',
                                      padding: isHovered ? '14px 12px' : '6px',
                                      display: 'block',
                                      wordWrap: isHovered ? 'break-word' : 'normal',
                                      overflowWrap: isHovered ? 'break-word' : 'normal',
                                      zIndex: zIndex,
                                      left: `${stackOffset}px`,
                                      top: `${stackOffset}px`,
                                      width: `calc(100% - ${stackOffset + 8}px)`,
                                      transform: transform,
                                      opacity: opacity,
                                      pointerEvents: pointerEvents,
                                      boxShadow: isHovered 
                                        ? '0 30px 60px -12px rgba(0, 0, 0, 0.3)' 
                                        : `0 ${6 + stackIndex * 3}px ${8 + stackIndex * 3}px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)`,
                                      overflow: 'hidden'
                                    }}
                                    onMouseEnter={() => setHoveredSlot(uniqueKey)}
                                    onMouseLeave={() => setHoveredSlot(null)}
                                  >
                                    {/* Conflict indicator */}
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                                      <AlertCircle className="w-2 h-2" />
                                    </div>
                                    
                                    {isHovered ? (
                                      // Enhanced expanded view on hover
                                      <div className="break-words h-full flex flex-col justify-start space-y-2">
                                        <div className={`font-bold ${textColor} text-sm leading-tight break-words`}>
                                          {slot.course.subject}{slot.course.code}
                                        </div>
                                        <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                          {slot.startTime}-{slot.endTime}
                                        </div>
                                        <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                          {slot.section}
                                        </div>
                                        {slot.location !== 'TBA' && (
                                          <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                            {slot.location}
                                          </div>
                                        )}
                                        <div className={`${textColor.replace('800', '600')} text-xs leading-tight break-words`}>
                                          {slot.term}
                                        </div>
                                        <div className="text-red-600 text-xs font-bold flex items-center gap-1 mt-auto bg-red-50 px-2 py-1 rounded">
                                          <AlertCircle className="w-3 h-3" />
                                          Conflict #{stackIndex + 1} of {conflictingSlots.length}
                                        </div>
                                      </div>
                                    ) : (
                                      // Enhanced compact view when not hovering
                                      <div className="h-full flex flex-col justify-center">
                                        <div className={`font-bold ${textColor} text-xs leading-tight truncate`}>
                                          {slot.course.subject}{slot.course.code}
                                        </div>
                                        <div className={`${textColor.replace('800', '600')} text-xs leading-tight truncate`}>
                                          {slot.startTime}-{slot.endTime}
                                        </div>
                                        <div className={`${textColor.replace('800', '600')} text-xs leading-tight truncate`}>
                                          {slot.section} {slot.location !== 'TBA' ? `• ${slot.location}` : ''}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            ) : (
              // Empty state
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses in your schedule</h3>
                  <p className="text-gray-600">Start building your schedule by searching for courses</p>
          </div>
        </div>
      )}
          </div>
        </div>

        {/* Right Section - Course List */}
        <div className="lg:w-80 lg:flex-shrink-0 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Selected Courses</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Export Schedule"
                >
                  <Download className="h-4 w-4" />
                </button>
                <label className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" title="Import Schedule">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                {schedule.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const allCourses = new Set(schedule.map(c => `${c.subject}-${c.code}`));
                        const allSections = new Set();
                        schedule.forEach(course => {
                          if (course.selectedSections && course.selectedSections.length > 0) {
                            course.selectedSections.forEach(sectionName => {
                              allSections.add(`${course.subject}-${course.code}-${sectionName}`);
                            });
                          }
                        });
                        setVisibleCourses(allCourses);
                        setVisibleSections(allSections);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Show All Courses and Sections"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setVisibleCourses(new Set());
                        setVisibleSections(new Set());
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title="Hide All Courses and Sections"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                    <button
                      onClick={clearSchedule}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Clear All"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Course List Content */}
          <div className="flex-1 overflow-y-auto">
            {schedule.length > 0 ? (
              <div className="p-4 space-y-3">
                {schedule.map(course => {
                  const courseKey = `${course.subject}-${course.code}`;
                  const isVisible = isCourseVisible(course.subject, course.code);
                  
                  // If course has selected sections, display each section separately
                  if (course.selectedSections && course.selectedSections.length > 0) {
                    return course.selectedSections.map((sectionName, sectionIndex) => {
                      const sectionKey = `${courseKey}-${sectionName}`;
                      const isSectionVisibleState = isSectionVisible(course.subject, course.code, sectionName);
                      
                      return (
                        <div key={sectionKey} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {/* Visibility Toggle Checkbox */}
                              <button
                                onClick={() => toggleSectionVisibility(course.subject, course.code, sectionName)}
                                className={`mt-0.5 p-1 rounded transition-colors flex-shrink-0 ${
                                  isSectionVisibleState 
                                    ? 'text-blue-600 hover:bg-blue-50' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={isSectionVisibleState ? 'Hide from timetable' : 'Show in timetable'}
                              >
                                {isSectionVisibleState ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={`/course/${course.subject}/${course.code}`}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm block truncate"
                                >
                                  {course.subject}{course.code}
                                </Link>
                                <div className="text-xs text-gray-600 mt-1">
                                  <div className="truncate">{course.title}</div>
                                  <div className="text-gray-500">{course.units} units</div>
                                  <div className="text-gray-500 mt-1">
                                    <span className="font-medium">Section:</span> {sectionName}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeSectionFromCourse(course.subject, course.code, sectionName)}
                              className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              title="Remove this section from schedule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  } else {
                    // Fallback for courses without selected sections (legacy format)
                    return (
                      <div key={courseKey} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {/* Visibility Toggle Checkbox */}
                            <button
                              onClick={() => toggleCourseVisibility(course.subject, course.code)}
                              className={`mt-0.5 p-1 rounded transition-colors flex-shrink-0 ${
                                isVisible 
                                  ? 'text-blue-600 hover:bg-blue-50' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={isVisible ? 'Hide from timetable' : 'Show in timetable'}
                            >
                              {isVisible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/course/${course.subject}/${course.code}`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm block truncate"
                              >
                                {course.subject}{course.code}
                              </Link>
                              <div className="text-xs text-gray-600 mt-1">
                                <div className="truncate">{course.title}</div>
                                <div className="text-gray-500">{course.units} units</div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeCourse(course.subject, course.code)}
                            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            title="Remove from schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No courses selected</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchedulePage; 