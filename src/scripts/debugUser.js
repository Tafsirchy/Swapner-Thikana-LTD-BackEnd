const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkUser = async () => {
    let client;
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db();
        const user = await db.collection('users').findOne({ email: 'tafsirchy1000@gmail.com' });
        
        if (user) {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            const isMatch = await bcrypt.compare('password123', user.password);
            console.log('Password "password123" matches:', isMatch);
        } else {
            console.log('User NOT found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (client) await client.close();
    }
};

checkUser();
