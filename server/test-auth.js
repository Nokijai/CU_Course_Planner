const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/auth';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let verificationToken = null;
let authToken = null;

async function testAuthSystem() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('📧 Check console for verification email preview URL\n');

    // Test 2: Try to login before email verification (should fail)
    console.log('2. Testing login before email verification...');
    try {
      await axios.post(`${BASE_URL}/login`, testUser);
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Login correctly blocked before email verification');
      } else {
        console.log('❌ Unexpected error:', error.response.data);
      }
    }
    console.log('');

    // Test 3: Try to register with same email (should fail)
    console.log('3. Testing duplicate email registration...');
    try {
      await axios.post(`${BASE_URL}/register`, testUser);
    } catch (error) {
      if (error.response.status === 409) {
        console.log('✅ Duplicate email correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response.data);
      }
    }
    console.log('');

    // Test 4: Test invalid login credentials
    console.log('4. Testing invalid login credentials...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: testUser.email,
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Invalid credentials correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response.data);
      }
    }
    console.log('');

    // Test 5: Test resend verification
    console.log('5. Testing resend verification...');
    const resendResponse = await axios.post(`${BASE_URL}/resend-verification`, {
      email: testUser.email
    });
    console.log('✅ Resend verification successful:', resendResponse.data.message);
    console.log('📧 Check console for new verification email preview URL\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Check the console for Ethereal Email preview URLs');
    console.log('2. Click the verification link in the email');
    console.log('3. Then try logging in with the test credentials');
    console.log('4. Use the returned JWT token for authenticated requests');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthSystem();
}

module.exports = { testAuthSystem }; 