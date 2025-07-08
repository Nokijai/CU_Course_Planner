const { execSync } = require('child_process');

function testRegistrationFlow() {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  console.log('🧪 Testing Registration Flow');
  console.log('============================');
  
  try {
    // Step 1: Register user
    console.log('\n1️⃣ Registering user...');
    const registerResponse = execSync(`curl -s -X POST http://localhost:3002/api/auth/register -H "Content-Type: application/json" -d '{"email":"${testEmail}","password":"${testPassword}"}'`, { encoding: 'utf8' });
    const registerData = JSON.parse(registerResponse);
    console.log('Register response:', registerData);
    
    if (!registerData.success) {
      throw new Error(`Registration failed: ${registerData.message}`);
    }
    
    console.log('✅ Registration successful!');
    
    // Step 2: Try to login (should fail - email not verified)
    console.log('\n2️⃣ Testing login before verification (should fail)...');
    const loginResponse = execSync(`curl -s -X POST http://localhost:3002/api/auth/login -H "Content-Type: application/json" -d '{"email":"${testEmail}","password":"${testPassword}"}'`, { encoding: 'utf8' });
    const loginData = JSON.parse(loginResponse);
    console.log('Login response:', loginData);
    
    if (loginData.success) {
      console.log('❌ Login should have failed (email not verified)');
    } else {
      console.log('✅ Login correctly failed (email not verified)');
    }
    
    // Step 3: Test frontend proxy
    console.log('\n3️⃣ Testing frontend proxy...');
    const proxyEmail = `proxy${Date.now()}@example.com`;
    const proxyResponse = execSync(`curl -s -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{"email":"${proxyEmail}","password":"${testPassword}"}'`, { encoding: 'utf8' });
    const proxyData = JSON.parse(proxyResponse);
    console.log('Proxy response:', proxyData);
    
    if (proxyData.success) {
      console.log('✅ Frontend proxy working correctly!');
    } else {
      console.log('❌ Frontend proxy failed');
    }
    
    console.log('\n🎉 Registration flow test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Go to the login page');
    console.log('3. Try to register a new account');
    console.log('4. Check the browser console (F12) for debugging logs');
    console.log('5. You should be redirected to the verification page');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistrationFlow(); 