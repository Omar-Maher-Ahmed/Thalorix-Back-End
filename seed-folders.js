const mongoose = require('mongoose');
require('dotenv').config();

const FolderSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  path: String,
  allowedFormats: [String],
  maxSizeMB: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Folder = mongoose.model('Folder', FolderSchema);

  const folders = [
    {
      name: 'Templates',
      slug: 'templates',
      path: 'thalorix/templates',
      allowedFormats: ['zip', 'rar', 'html', 'css', 'js'],
      maxSizeMB: 50,
    },
    {
      name: 'Template Images',
      slug: 'template-images',
      path: 'thalorix/template-images',
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      maxSizeMB: 10,
    },
  ];

  for (const f of folders) {
    const result = await Folder.findOneAndUpdate(
      { slug: f.slug },
      f,
      { upsert: true, new: true }
    );
    console.log(`Seeded folder: ${f.slug} → path: ${result.path}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(console.error);
