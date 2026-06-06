const mongoose = require('mongoose');
const { OrderSchema } = require('./src/orders/schema/order.schema');

mongoose.connect('mongodb://localhost:27017/thalorix').then(async () => {
  const Order = mongoose.model('Order', OrderSchema);
  const sample = await Order.findOne();
  console.log(sample);
  process.exit(0);
});
