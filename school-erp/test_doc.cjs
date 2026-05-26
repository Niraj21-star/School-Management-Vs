const fs = require('fs');
const documentService = require('./backend/src/services/documentService');
async function run() {
  const student = { name: 'Test', surname: 'Student', studentId: '123' };
  const tcHtmlStr = documentService.generateTCHtml ? documentService.generateTCHtml(student) : 'no method';
  fs.writeFileSync('test_tc.html', tcHtmlStr);
  console.log('HTML saved.');
}
run();
