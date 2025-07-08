import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, Check, X } from 'lucide-react';
import { 
  loadTimetables, 
  createTimetable, 
  renameTimetable, 
  deleteTimetable, 
  getCurrentTimetableId, 
  setCurrentTimetableId 
} from '../utils/localStorage';

function TimetableToolbar({ onTimetableChange }) {
  const [timetables, setTimetables] = useState([]);
  const [currentTimetableId, setCurrentTimetableIdState] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTimetableName, setNewTimetableName] = useState('');

  useEffect(() => {
    loadTimetablesData();
  }, []);

  const loadTimetablesData = () => {
    const timetablesData = loadTimetables();
    const currentId = getCurrentTimetableId();
    setTimetables(timetablesData);
    setCurrentTimetableIdState(currentId);
  };

  const handleTimetableSwitch = (timetableId) => {
    setCurrentTimetableId(timetableId);
    setCurrentTimetableIdState(timetableId);
    setIsDropdownOpen(false);
    if (onTimetableChange) {
      onTimetableChange(timetableId);
    }
  };

  const handleCreateTimetable = () => {
    if (newTimetableName.trim()) {
      const newId = createTimetable(newTimetableName.trim());
      if (newId) {
        setNewTimetableName('');
        setIsCreating(false);
        loadTimetablesData();
        handleTimetableSwitch(newId);
      }
    }
  };

  const handleRenameTimetable = () => {
    if (editingName.trim() && editingId) {
      if (renameTimetable(editingId, editingName.trim())) {
        setEditingId(null);
        setEditingName('');
        loadTimetablesData();
      }
    }
  };

  const handleDeleteTimetable = (timetableId) => {
    if (window.confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
      if (deleteTimetable(timetableId)) {
        loadTimetablesData();
        if (onTimetableChange) {
          onTimetableChange(getCurrentTimetableId());
        }
      }
    }
  };

  const startEditing = (timetable) => {
    setEditingId(timetable.id);
    setEditingName(timetable.name);
    // Open dropdown if it's not already open
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const currentTimetable = timetables.find(t => t.id === currentTimetableId) || timetables[0];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Timetable Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors min-w-[200px]"
            >
              <span className="font-medium text-gray-900 truncate">
                {currentTimetable?.name || 'Select Timetable'}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  {/* Create New Timetable */}
                  <div className="border-b border-gray-200 pb-2 mb-2">
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newTimetableName}
                          onChange={(e) => setNewTimetableName(e.target.value)}
                          placeholder="Timetable name..."
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateTimetable()}
                          autoFocus
                        />
                        <button
                          onClick={handleCreateTimetable}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Create"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsCreating(false);
                            setNewTimetableName('');
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Timetable</span>
                      </button>
                    )}
                  </div>

                  {/* Timetable List */}
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {timetables.map((timetable) => (
                      <div
                        key={timetable.id}
                        className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                          timetable.id === currentTimetableId
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {editingId === timetable.id ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleRenameTimetable()}
                              autoFocus
                            />
                            <button
                              onClick={handleRenameTimetable}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleTimetableSwitch(timetable.id)}
                              className="flex-1 text-left truncate text-sm"
                            >
                              {timetable.name}
                            </button>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => startEditing(timetable)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Rename"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              {timetables.length > 1 && (
                                <button
                                  onClick={() => handleDeleteTimetable(timetable.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Edit and Delete Buttons - Now right next to the dropdown */}
          {currentTimetable && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => startEditing(currentTimetable)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rename Timetable"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {timetables.length > 1 && (
                <button
                  onClick={() => handleDeleteTimetable(currentTimetable.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Timetable"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Current Timetable Info */}
          <div className="text-sm text-gray-600">
            {currentTimetable && (
              <span>
                {currentTimetable.courses?.length || 0} courses
                {currentTimetable.updatedAt && (
                  <span className="ml-2">
                    • Updated {new Date(currentTimetable.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Spacer to maintain layout */}
        <div></div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default TimetableToolbar; 