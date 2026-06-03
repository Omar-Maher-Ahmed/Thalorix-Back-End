const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env', 'utf8');
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const MONGODB_URI = getEnvVar('MONGODB_URI');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const t = await mongoose.connection.db.collection('templates').findOne({title: 'E-commerce Theme'});
  console.log('Template details:', t);
  await mongoose.disconnect();
}

run().catch(console.error);
