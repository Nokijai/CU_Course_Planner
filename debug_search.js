const fs = require('fs');
const path = require('path');

// Debug script to test search functionality
async function debugSearch() {
  try {
    console.log('=== Debugging Search Issue ===');
    
    // Test 1: Check if there's an issue with the data processing
    const coursesDir = path.join(__dirname, 'Data', 'courses');
    const courseFiles = fs.readdirSync(coursesDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${courseFiles.length} course files`);
    
    // Test 2: Process all course files to see if subject field is set correctly
    const allCourses = [];
    
    for (const file of courseFiles) {
      const subjectCode = file.replace('.json', '');
      const filePath = path.join(coursesDir, file);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const courses = JSON.parse(fileData);
      
      if (Array.isArray(courses)) {
        const processedCourses = courses.map(course => ({
          ...course,
          subject: subjectCode,
          fullCode: `${subjectCode}${course.code}`,
          code: course.code
        }));
        allCourses.push(...processedCourses);
      }
    }
    
    console.log(`\nTotal courses processed: ${allCourses.length}`);
    
    // Test 3: Test the new "starts with" search functionality
    console.log('\n=== Testing "Starts With" Search ===');
    
    // Test with 'm'
    const testSearch1 = 'm';
    console.log(`\nTesting search for courses starting with: "${testSearch1}"`);
    
    const startsWithM = allCourses.filter(course => {
      // Check if subject starts with search term
      if (course.subject && course.subject.toLowerCase().startsWith(testSearch1)) {
        return true;
      }
      
      // Check if course code starts with search term
      const fullCode = `${course.subject}${course.code}`.toLowerCase();
      if (fullCode.startsWith(testSearch1)) {
        return true;
      }
      
      // Check if title starts with search term
      if (course.title && course.title.toLowerCase().startsWith(testSearch1)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${startsWithM.length} courses starting with "${testSearch1}":`);
    startsWithM.slice(0, 5).forEach(course => {
      console.log(`  ${course.subject}${course.code} - ${course.title}`);
    });
    
    // Test with 'ma'
    const testSearch2 = 'ma';
    console.log(`\nTesting search for courses starting with: "${testSearch2}"`);
    
    const startsWithMa = allCourses.filter(course => {
      // Check if subject starts with search term
      if (course.subject && course.subject.toLowerCase().startsWith(testSearch2)) {
        return true;
      }
      
      // Check if course code starts with search term
      const fullCode = `${course.subject}${course.code}`.toLowerCase();
      if (fullCode.startsWith(testSearch2)) {
        return true;
      }
      
      // Check if title starts with search term
      if (course.title && course.title.toLowerCase().startsWith(testSearch2)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${startsWithMa.length} courses starting with "${testSearch2}":`);
    startsWithMa.slice(0, 5).forEach(course => {
      console.log(`  ${course.subject}${course.code} - ${course.title}`);
    });
    
    // Test with 'math'
    const testSearch3 = 'math';
    console.log(`\nTesting search for courses starting with: "${testSearch3}"`);
    
    const startsWithMath = allCourses.filter(course => {
      // Check if subject starts with search term
      if (course.subject && course.subject.toLowerCase().startsWith(testSearch3)) {
        return true;
      }
      
      // Check if course code starts with search term
      const fullCode = `${course.subject}${course.code}`.toLowerCase();
      if (fullCode.startsWith(testSearch3)) {
        return true;
      }
      
      // Check if title starts with search term
      if (course.title && course.title.toLowerCase().startsWith(testSearch3)) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Found ${startsWithMath.length} courses starting with "${testSearch3}":`);
    startsWithMath.slice(0, 5).forEach(course => {
      console.log(`  ${course.subject}${course.code} - ${course.title}`);
    });
    
    // Test exact course code search (should still work)
    console.log(`\n=== Testing Exact Course Code Search ===`);
    const testCode = 'math1510';
    console.log(`\nTesting exact course code search for: "${testCode}"`);
    
    const exactCodeMatches = allCourses.filter(course => {
      const fullCode = `${course.subject}${course.code}`.toLowerCase();
      return fullCode === testCode;
    });
    
    console.log(`Found ${exactCodeMatches.length} exact course code matches:`);
    exactCodeMatches.forEach(course => {
      console.log(`  ${course.subject}${course.code} - ${course.title}`);
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugSearch(); 