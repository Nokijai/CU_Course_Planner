const STORAGE_KEYS = {
  SCHEDULE: 'cuhk_schedule',
  TIMETABLES: 'cuhk_timetables',
  CURRENT_TIMETABLE: 'cuhk_current_timetable',
  FAVORITES: 'cuhk_favorites',
  SETTINGS: 'cuhk_settings',
  SEARCH_HISTORY: 'cuhk_search_history'
};

// Timetable management
export const saveTimetables = (timetables) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(timetables));
    return true;
  } catch (error) {
    console.error('Error saving timetables:', error);
    return false;
  }
};

export const loadTimetables = () => {
  try {
    const timetables = localStorage.getItem(STORAGE_KEYS.TIMETABLES);
    return timetables ? JSON.parse(timetables) : [];
  } catch (error) {
    console.error('Error loading timetables:', error);
    return [];
  }
};

export const getCurrentTimetableId = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TIMETABLE) || 'default';
  } catch (error) {
    console.error('Error getting current timetable ID:', error);
    return 'default';
  }
};

export const setCurrentTimetableId = (id) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TIMETABLE, id);
    return true;
  } catch (error) {
    console.error('Error setting current timetable ID:', error);
    return false;
  }
};

export const createTimetable = (name) => {
  try {
    const timetables = loadTimetables();
    const newId = `timetable_${Date.now()}`;
    const newTimetable = {
      id: newId,
      name: name,
      courses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    timetables.push(newTimetable);
    saveTimetables(timetables);
    setCurrentTimetableId(newId);
    return newId;
  } catch (error) {
    console.error('Error creating timetable:', error);
    return null;
  }
};

export const renameTimetable = (id, newName) => {
  try {
    const timetables = loadTimetables();
    const timetableIndex = timetables.findIndex(t => t.id === id);
    
    if (timetableIndex !== -1) {
      timetables[timetableIndex].name = newName;
      timetables[timetableIndex].updatedAt = new Date().toISOString();
      saveTimetables(timetables);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error renaming timetable:', error);
    return false;
  }
};

export const deleteTimetable = (id) => {
  try {
    const timetables = loadTimetables();
    const filteredTimetables = timetables.filter(t => t.id !== id);
    
    if (filteredTimetables.length === 0) {
      // If no timetables left, create a default one
      const defaultTimetable = {
        id: 'default',
        name: 'Default Timetable',
        courses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      filteredTimetables.push(defaultTimetable);
      setCurrentTimetableId('default');
    } else if (getCurrentTimetableId() === id) {
      // If deleting current timetable, switch to the first available one
      setCurrentTimetableId(filteredTimetables[0].id);
    }
    
    saveTimetables(filteredTimetables);
    return true;
  } catch (error) {
    console.error('Error deleting timetable:', error);
    return false;
  }
};

export const getCurrentTimetable = () => {
  try {
    const timetables = loadTimetables();
    const currentId = getCurrentTimetableId();
    
    // If no timetables exist, create a default one
    if (timetables.length === 0) {
      const defaultTimetable = {
        id: 'default',
        name: 'Default Timetable',
        courses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      timetables.push(defaultTimetable);
      saveTimetables(timetables);
      return defaultTimetable;
    }
    
    // Find current timetable
    let currentTimetable = timetables.find(t => t.id === currentId);
    
    // If current timetable doesn't exist, use the first one
    if (!currentTimetable) {
      currentTimetable = timetables[0];
      setCurrentTimetableId(currentTimetable.id);
    }
    
    return currentTimetable;
  } catch (error) {
    console.error('Error getting current timetable:', error);
    return {
      id: 'default',
      name: 'Default Timetable',
      courses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};

export const saveCurrentTimetable = (courses) => {
  try {
    const timetables = loadTimetables();
    const currentId = getCurrentTimetableId();
    const timetableIndex = timetables.findIndex(t => t.id === currentId);
    
    if (timetableIndex !== -1) {
      timetables[timetableIndex].courses = courses;
      timetables[timetableIndex].updatedAt = new Date().toISOString();
      saveTimetables(timetables);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving current timetable:', error);
    return false;
  }
};

// Schedule management (now uses current timetable)
export const saveSchedule = (schedule) => {
  try {
    // For backward compatibility, also save to old storage key
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    // Save to current timetable
    return saveCurrentTimetable(schedule);
  } catch (error) {
    console.error('Error saving schedule:', error);
    return false;
  }
};

export const loadSchedule = () => {
  try {
    const currentTimetable = getCurrentTimetable();
    return currentTimetable.courses || [];
  } catch (error) {
    console.error('Error loading schedule:', error);
    return [];
  }
};

// Alias for compatibility
export const getSchedule = loadSchedule;

export const addCourseToSchedule = (course) => {
  try {
    const schedule = loadSchedule();
    const existingIndex = schedule.findIndex(c => c.code === course.code);
    
    if (existingIndex >= 0) {
      schedule[existingIndex] = course;
    } else {
      schedule.push(course);
    }
    
    saveSchedule(schedule);
    return true;
  } catch (error) {
    console.error('Error adding course to schedule:', error);
    return false;
  }
};

export const removeCourseFromSchedule = (courseCode) => {
  try {
    const schedule = loadSchedule();
    const filteredSchedule = schedule.filter(c => c.code !== courseCode);
    saveSchedule(filteredSchedule);
    return true;
  } catch (error) {
    console.error('Error removing course from schedule:', error);
    return false;
  }
};

export const clearSchedule = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    return true;
  } catch (error) {
    console.error('Error clearing schedule:', error);
    return false;
  }
};

// Favorites management
export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Error saving favorites:', error);
    return false;
  }
};

export const loadFavorites = () => {
  try {
    const favorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// Alias for compatibility
export const getFavorites = loadFavorites;

export const addToFavorites = (course) => {
  try {
    const favorites = loadFavorites();
    const existingIndex = favorites.findIndex(c => c.code === course.code);
    
    if (existingIndex === -1) {
      favorites.push(course);
      saveFavorites(favorites);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

export const removeFromFavorites = (courseCode) => {
  try {
    const favorites = loadFavorites();
    const filteredFavorites = favorites.filter(c => c.code !== courseCode);
    saveFavorites(filteredFavorites);
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

export const isFavorite = (courseCode) => {
  try {
    const favorites = loadFavorites();
    return favorites.some(c => c.code === courseCode);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// Settings management
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

export const loadSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : {
      theme: 'light',
      language: 'en',
      notifications: true,
      autoSave: true
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      theme: 'light',
      language: 'en',
      notifications: true,
      autoSave: true
    };
  }
};

// Search history management
export const saveSearchHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving search history:', error);
    return false;
  }
};

export const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error loading search history:', error);
    return [];
  }
};

export const addToSearchHistory = (query) => {
  try {
    const history = loadSearchHistory();
    const filteredHistory = history.filter(q => q !== query);
    const newHistory = [query, ...filteredHistory].slice(0, 10); // Keep last 10 searches
    saveSearchHistory(newHistory);
    return true;
  } catch (error) {
    console.error('Error adding to search history:', error);
    return false;
  }
};

export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    return true;
  } catch (error) {
    console.error('Error clearing search history:', error);
    return false;
  }
};

// Utility functions
export const exportSchedule = () => {
  try {
    const schedule = loadSchedule();
    const currentTimetable = getCurrentTimetable();
    const exportData = {
      timetable: {
        name: currentTimetable.name,
        id: currentTimetable.id,
        exportedAt: new Date().toISOString()
      },
      schedule: schedule
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuhk-schedule-${currentTimetable.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting schedule:', error);
    return false;
  }
};

export const importSchedule = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let schedule;
        
        // Handle both old format (array) and new format (object with timetable info)
        if (Array.isArray(data)) {
          schedule = data;
        } else if (data.schedule && Array.isArray(data.schedule)) {
          schedule = data.schedule;
        } else {
          reject(new Error('Invalid schedule format'));
          return;
        }
        
        saveSchedule(schedule);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}; 