require('dotenv').config();
const axios = require('axios');
axios.get('http://localhost:5000/api/students?limit=1000&status=all&isRTE=true').then(res => {
  console.log(res.data);
}).catch(err => {
  console.log(err.response ? err.response.data : err.message);
});
