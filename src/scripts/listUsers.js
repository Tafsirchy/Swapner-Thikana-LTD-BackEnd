const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const listUsers = async () => {
    let client;
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        client = new MongoClient(mongoUri);
        await client.connect();
        const users = await client.db().collection('users').find({}, { projection: { email: 1, role: 1, isActive: 1 } }).toArray();
        console.log(users);
    } catch (err) {
        console.error(err);
    } finally {
        if (client) await client.close();
    }
};

listUsers();
