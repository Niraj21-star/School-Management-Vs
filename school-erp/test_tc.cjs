const fs = require('fs');
const path = require('path');
const documentService = require('./backend/src/services/documentService');

async function run() {
  const student = { name: 'Test', surname: 'Student', studentId: '123' };
  const tcHtmlStr = documentService.generateTCHtml ? documentService.generateTCHtml(student) : 'no method';
  fs.writeFileSync('test_tc.html', tcHtmlStr);
  console.log('HTML saved. Watermark class found:', tcHtmlStr.includes('watermark-overlay'));
  console.log('Base64 string injected:', tcHtmlStr.includes('data:image/png;base64'));
}
run();
