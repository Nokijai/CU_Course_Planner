import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, BookOpen, Trash2, AlertTriangle, CheckCircle, Download, Upload, AlertCircle } from 'lucide-react';
import { getSchedule, saveSchedule, exportSchedule, importSchedule } from '../utils/localStorage';
import { validateSchedule } from '../utils/scheduleValidator';

function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => {
    const savedSchedule = getSchedule() || [];
    setSchedule(savedSchedule);
    
    // Calculate total units
    const units = savedSchedule.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    // Check for conflicts
    const scheduleConflicts = validateSchedule(savedSchedule);
    setConflicts(scheduleConflicts.conflicts || []);
  }, []);

  const removeCourse = (subject, code) => {
    const updated = schedule.filter(c => c.subject !== subject || c.code !== code);
    setSchedule(updated);
    saveSchedule(updated);
    
    // Recalculate units and conflicts
    const units = updated.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
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
      importSchedule(file, (importedSchedule) => {
        setSchedule(importedSchedule);
        saveSchedule(importedSchedule);
        
        const units = importedSchedule.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
        setTotalCredits(units);
        
        const scheduleConflicts = validateSchedule(importedSchedule);
        setConflicts(scheduleConflicts.conflicts || []);
      });
    }
  };

  const clearSchedule = () => {
    if (window.confirm('Are you sure you want to clear your entire schedule?')) {
      setSchedule([]);
      saveSchedule([]);
      setTotalCredits(0);
      setConflicts([]);
    }
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

  // Process schedule to get course time slots
  const getCourseTimeSlots = () => {
    const timeSlots = [];
    let colorIndex = 0;
    
    schedule.forEach(course => {
      if (!course.terms) return;
      
      // Check if course has selectedSections (new format) or use all sections (old format)
      const selectedSections = course.selectedSections || [];
      const hasSelectedSections = selectedSections.length > 0;
      
      Object.entries(course.terms).forEach(([termName, sections]) => {
        Object.entries(sections).forEach(([sectionName, section]) => {
          // Only include sections that were selected, or all sections if no selection was made
          if (hasSelectedSections && !selectedSections.includes(sectionName)) {
            return; // Skip this section if it wasn't selected
          }
          
          if (!section.days || !section.startTimes || !section.endTimes) return;
          
          section.days.forEach((day, index) => {
            const startTime = section.startTimes[index];
            const endTime = section.endTimes[index];
            const location = section.locations?.[index] || 'TBA';
            const instructor = section.instructors?.[index] || 'TBA';
            
            if (startTime && endTime && day >= 1 && day <= 5) {
              timeSlots.push({
                course: course,
                term: termName,
                section: sectionName,
                day: day,
                startTime: startTime,
                endTime: endTime,
                location: location,
                instructor: instructor,
                dayName: getDayName(day),
                timeSlotPosition: getTimeSlotPosition(startTime),
                duration: getDurationInSlots(startTime, endTime),
                colorIndex: colorIndex % courseColors.length
              });
              colorIndex++;
            }
          });
        });
      });
    });
    
    return timeSlots;
  };

  const courseTimeSlots = getCourseTimeSlots();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
        <p className="text-gray-600">Manage your course schedule and check for conflicts</p>
      </div>

      {/* Schedule Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-sm text-gray-500">Total Courses</div>
                <div className="text-2xl font-bold text-gray-900">{schedule.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">Total Units</div>
                <div className="text-2xl font-bold text-gray-900">{totalCredits}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-sm text-gray-500">Conflicts</div>
                <div className="text-2xl font-bold text-gray-900">{conflicts.length}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {schedule.length > 0 && (
              <button
                onClick={clearSchedule}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>


      </div>

      {/* Timetable */}
      {schedule.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses in your schedule</h3>
          <p className="text-gray-600 mb-6">Start building your schedule by searching for courses</p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Search Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timetable Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Weekly Schedule
            </h2>
            <div className="text-sm text-gray-600">
              Total Units: <span className="font-semibold">{totalCredits}</span>
            </div>
          </div>
          
          {/* Timetable Container */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="timetable-container">
              {/* Day Headers */}
              <div className="grid grid-cols-6 border-b border-gray-200">
                <div className="p-4 bg-gray-50"></div> {/* Empty corner */}
                {days.map((day, index) => {
                  const daySlots = courseTimeSlots.filter(slot => slot.dayName === day);
                  const totalHours = daySlots.reduce((sum, slot) => {
                    const startMinutes = parseTime(slot.startTime);
                    const endMinutes = parseTime(slot.endTime);
                    return sum + (endMinutes - startMinutes) / 60;
                  }, 0);
                  
                  return (
                    <div key={day} className="p-4 bg-gray-50 border-l border-gray-200">
                      <div className="text-center">
                        <span className="font-semibold text-gray-900 text-sm">{day}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          ({totalHours.toFixed(1)} hrs)
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
                    <div key={time} className="h-16 border-b border-gray-100 flex items-center justify-center text-sm text-gray-600 bg-gray-50">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day Columns */}
                {days.map((day, dayIndex) => (
                  <div key={day} className="relative border-r border-gray-200 last:border-r-0">
                    {timeSlots.map((time, timeIndex) => (
                      <div key={time} className="h-16 border-b border-gray-100 relative">
                        {/* Simple border for visual separation */}
                        <div className="absolute inset-0 border border-gray-100 opacity-50"></div>
                        
                        {/* Course slots */}
                        {courseTimeSlots
                          .filter(slot => slot.dayName === day && slot.timeSlotPosition === timeIndex)
                          .map((slot, slotIndex) => {
                            const uniqueKey = `${slot.course.subject}-${slot.course.code}-${slot.section}-${slot.day}-${slot.startTime}-${slotIndex}`;
                            const isHovered = hoveredSlot === uniqueKey;
                            const colorClass = courseColors[slot.colorIndex];
                            const [bgColor, borderColor, textColor, hoverBgColor] = colorClass.split(' ');
                            const slotHasConflict = hasConflict(slot);
                            
                            return (
                              <div
                                key={uniqueKey}
                                className={`absolute inset-1 ${isHovered ? hoverBgColor : bgColor} ${borderColor} rounded cursor-pointer transition-all duration-300 ease-in-out transform ${
                                  isHovered ? 'shadow-xl scale-110 z-50' : 'hover:shadow-lg hover:scale-105 z-10'
                                } ${slotHasConflict ? 'border-2 border-red-500' : ''}`}
                                style={{
                                  height: isHovered ? 'auto' : `${Math.max(64, slot.duration * 64)}px`,
                                  minHeight: isHovered ? '120px' : `${Math.max(64, slot.duration * 64)}px`,
                                  width: 'calc(100% - 8px)',
                                  maxWidth: 'calc(100% - 8px)',
                                  whiteSpace: isHovered ? 'normal' : 'nowrap',
                                  padding: isHovered ? '10px 8px' : '8px',
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
                                {/* Conflict indicator */}
                                {slotHasConflict && !isHovered && (
                                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                    <AlertCircle className="w-3 h-3" />
                                  </div>
                                )}
                                
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
                                    {slotHasConflict && (
                                      <div className="text-red-600 text-xs font-medium flex items-center gap-1 mt-auto">
                                        <AlertCircle className="w-3 h-3" />
                                        Conflict
                                      </div>
                                    )}
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
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Course List (Compact) */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Course List</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedule.map(course => (
                <div key={`${course.subject}-${course.code}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Link
                      to={`/course/${course.subject}/${course.code}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {course.subject}{course.code}
                    </Link>
                    <div className="text-sm text-gray-600">
                      {course.title}
                      <br />
                      <span className="text-gray-500">{course.units} units</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCourse(course.subject, course.code)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulePage; 