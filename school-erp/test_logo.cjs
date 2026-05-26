const fs = require('fs'); const path = require('path');
function getLogoBase64() {
    try {
      const possiblePaths = [
        path.join(__dirname, 'logo.png'),
        path.join(__dirname, 'backend', 'src', 'templates', 'logo.png'),
        path.join(__dirname, 'backend', 'logo.png'),
      ];
      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          return 'FOUND at ' + logoPath;
        }
      }
      return 'NOT FOUND';
    } catch (e) { return e.toString(); }
}
console.log(getLogoBase64());
