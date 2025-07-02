import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, BookOpen, Trash2, AlertTriangle, CheckCircle, Download, Upload } from 'lucide-react';
import { getSchedule, saveSchedule, exportSchedule, importSchedule } from '../utils/localStorage';
import { validateSchedule } from '../utils/scheduleValidator';

function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    const savedSchedule = getSchedule() || [];
    setSchedule(savedSchedule);
    
    // Calculate total units
    const units = savedSchedule.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    // Check for conflicts
    const scheduleConflicts = validateSchedule(savedSchedule);
    setConflicts(scheduleConflicts);
  }, []);

  const removeCourse = (subject, code) => {
    const updated = schedule.filter(c => c.subject !== subject || c.code !== code);
    setSchedule(updated);
    saveSchedule(updated);
    
    // Recalculate units and conflicts
    const units = updated.reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
    setTotalCredits(units);
    
    const scheduleConflicts = validateSchedule(updated);
    setConflicts(scheduleConflicts);
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
        setConflicts(scheduleConflicts);
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

        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Schedule Conflicts Detected
            </h3>
            <ul className="space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index} className="text-red-700 text-sm">
                  • {conflict}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {schedule.length > 0 && conflicts.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">No schedule conflicts detected!</span>
            </div>
          </div>
        )}
      </div>

      {/* Course List */}
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
        <div className="grid gap-4">
          {schedule.map(course => (
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
                  onClick={() => removeCourse(course.subject, course.code)}
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
              
              {course.terms && Object.keys(course.terms).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Terms:</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {Object.keys(course.terms).map((termName, index) => (
                      <div key={index} className="text-sm text-gray-700 mb-1">
                        {termName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SchedulePage; 