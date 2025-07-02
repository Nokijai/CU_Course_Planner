const STORAGE_KEYS = {
  SCHEDULE: 'cuhk_schedule',
  FAVORITES: 'cuhk_favorites',
  SETTINGS: 'cuhk_settings',
  SEARCH_HISTORY: 'cuhk_search_history'
};

// Schedule management
export const saveSchedule = (schedule) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
    return true;
  } catch (error) {
    console.error('Error saving schedule:', error);
    return false;
  }
};

export const loadSchedule = () => {
  try {
    const schedule = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    return schedule ? JSON.parse(schedule) : [];
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
    const dataStr = JSON.stringify(schedule, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuhk-schedule-${new Date().toISOString().split('T')[0]}.json`;
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
        const schedule = JSON.parse(e.target.result);
        if (Array.isArray(schedule)) {
          saveSchedule(schedule);
          resolve(true);
        } else {
          reject(new Error('Invalid schedule format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}; 