const axios = require('axios');

async function test() {
  try {
    const payload = {
      generalRegisterNumber: "GR123",
      aadhaarNumber: "123456789012",
      penNumber: "PEN123",
      name: "Test Aadhaar",
      surname: "User",
      dob: "2010-01-01",
      gender: "male",
      contact: "9999999999",
      address: "Test Addr",
      passportPhoto: "",
      caste: "Test",
      subCaste: "Test",
      placeOfBirth: "Test",
      nationality: "Indian",
      fatherEducation: "Test",
      motherEducation: "Test",
      parent: {
        fatherName: "F",
        motherName: "M",
        parentContact: "9999999999",
      },
      academic: {
        class: "10",
        section: "A",
        rollNumber: "1",
        admissionDate: "2023-06-01"
      },
      status: "active",
      isTcIssued: false
    };

    console.log("Sending payload...");
    const res = await axios.post('http://localhost:5000/api/students', payload);
    console.log("Response:", res.data);

    if (res.data && res.data.data && res.data.data.studentId) {
      console.log("Fetching HTML for studentId:", res.data.data.studentId);
      const htmlRes = await axios.get(`http://localhost:5000/api/documents/admission-form/${res.data.data.studentId}/html`);
      const html = htmlRes.data;
      console.log("Aadhaar found in HTML?", html.includes("123456789012"));
      console.log("PEN found in HTML?", html.includes("PEN123"));
    }
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
