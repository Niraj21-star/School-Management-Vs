const fs = require('fs');
const documentService = require('./backend/src/services/documentService');
async function run() {
  const student = { name: 'Test', surname: 'Student', studentId: '123' };
  const tcHtmlStr = documentService.generateBonafideHtml ? await documentService.generateBonafideHtml(student) : 'no bonafide';
  fs.writeFileSync('test_bonafide.html', tcHtmlStr);
  console.log('HTML saved.');
}
run();
