require('dotenv').config(); // Load environment variables
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function testConnection() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully!');

        // Check the database and collection
        const db = client.db('all_db'); // Ensure the database name is correct
        const users = await db.collection('Users').find({}).toArray();
        console.log('Users found:', users);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        await client.close();
    }
}

testConnection();