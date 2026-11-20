require('dotenv').config({ quiet: true });
const dns = require('dns');
const mongoose = require('mongoose');
const app = require('./app');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

async function connect() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (e) {
    // Some resolvers refuse the SRV lookups needed by mongodb+srv:// URIs; retry via public DNS.
    if (!/querySrv|ECONNREFUSED|ETIMEOUT/.test(e.message)) throw e;
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
}

connect().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Connected to MongoDB. API on http://localhost:${port}`));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
