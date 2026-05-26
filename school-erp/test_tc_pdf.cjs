const fs = require('fs');
const documentService = require('./backend/src/services/documentService');
async function run() {
  const student = { name: 'Test', surname: 'Student', studentId: '123' };
  const pdfBuffer = await documentService.generateTC(student);
  fs.writeFileSync('test_tc.pdf', pdfBuffer);
  console.log('PDF saved.');
}
run();
