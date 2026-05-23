const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const feeController = require('./src/controllers/fee.controller');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const req = {};
  const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { console.log("JSON response:", JSON.stringify(data, null, 2)); return this; }
  };
  
  await feeController.getAllFees(req, res);
  
  process.exit(0);
}

run().catch(console.error);
