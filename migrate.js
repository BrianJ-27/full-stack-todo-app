const { MongoClient } = require('mongodb');

const localUri = 'mongodb://localhost:27017';
const atlasUri = 'mongodb+srv://johnson_8727:7j1kE7fumQWXjrol@cluster0.klmuljj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    // Connect to both local and Atlas
    await localClient.connect();
    await atlasClient.connect();

    console.log('✅ Connected to both local and Atlas databases');

    const localDb = localClient.db('todoApp');
    const atlasDb = atlasClient.db('todoApp');

    // Read all documents from local.items
    const items = await localDb.collection('items').find().toArray();
    console.log(`📦 Found ${items.length} items in local DB.`);

    if (items.length) {
      // Clear the target collection first (optional)
      await atlasDb.collection('items').deleteMany({});

      // Insert into Atlas
      await atlasDb.collection('items').insertMany(items);
      console.log('✅ Migration complete.');
    } else {
      console.log('⚠️ No documents found to migrate.');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
