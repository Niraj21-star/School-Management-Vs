const axios = require('axios');

async function testRte() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com', // Assuming default admin
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in successfully');

    // 2. Create an RTE student
    const studentPayload = {
      name: 'Test RTE Student',
      dob: '2015-01-01',
      gender: 'Male',
      contact: '9999999999',
      address: '123 Main St',
      parent: {
        fatherName: 'John Doe',
        motherName: 'Jane Doe',
        parentContact: '9999999999'
      },
      academic: {
        class: '1st',
        section: 'A',
        admissionDate: '2026-05-25',
        rollNumber: '99'
      },
      isRTE: true
    };

    console.log('Sending payload...', studentPayload);
    
    const createRes = await axios.post('http://localhost:5000/api/students', studentPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Created Student:', createRes.data.data);

    // 3. Fetch RTE students
    const fetchRes = await axios.get('http://localhost:5000/api/students?isRTE=true', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('RTE Students count from API:', fetchRes.data.data.students.length);
    console.log('RTE Students list from API:', fetchRes.data.data.students.map(s => s.name));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testRte();
