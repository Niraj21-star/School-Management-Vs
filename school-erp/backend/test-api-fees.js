const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

async function run() {
  const token = jwt.sign({ id: 'dummy', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  try {
    const res = await axios.get('http://localhost:5000/api/fees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(err) {
    console.error(err.message);
  }
}
run();
