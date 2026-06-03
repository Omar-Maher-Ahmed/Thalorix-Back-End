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
  
  // Find the last created order
  const lastOrder = await mongoose.connection.db.collection('orders')
    .find()
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
    
  console.log('Raw Order from DB:', lastOrder);

  // Let's define the schemas and compile the models to test Mongoose populating
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Template = mongoose.models.Template || mongoose.model('Template', new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' }
  }, { strict: false }));

  if (lastOrder) {
    try {
      const populated = await Order.findById(lastOrder._id)
        .populate('template')
        .populate('buyer', '-password')
        .populate('seller', '-password');
        
      console.log('Populated Order:', populated);
      console.log('buyer ID:', populated.buyer ? populated.buyer._id : 'null');
      console.log('seller ID:', populated.seller ? populated.seller._id : 'null');
      console.log('template ID:', populated.template ? populated.template._id : 'null');
    } catch (err) {
      console.error('Mongoose Populate Error:', err);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
