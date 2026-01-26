const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const agents = [
  {
    name: 'Rahim Ahmed',
    email: 'rahim.agent@stltd.com',
    password: 'password123',
    phone: '+880 1711 223344',
    role: 'agent',
    status: 'active',
    bio: 'Senior Real Estate Consultant with 10 years of experience in the luxury market. Specializing in Gulshan and Banani properties.',
    specialization: 'Luxury Apartments',
    experience: '10 Years',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat.agent@stltd.com',
    password: 'password123',
    phone: '+880 1911 556677',
    role: 'agent',
    status: 'active',
    bio: 'Passionate about helping families find their dream homes. Expert in residential projects in Dhanmondi and Uttara.',
    specialization: 'Residential Sales',
    experience: '5 Years',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&h=256&auto=format&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Tanvir Hasan',
    email: 'tanvir.agent@stltd.com',
    password: 'password123',
    phone: '+880 1811 889900',
    role: 'agent',
    status: 'active',
    bio: 'Commercial property specialist. Assisting businesses in finding prime office spaces and commercial plots.',
    specialization: 'Commercial Real Estate',
    experience: '8 Years',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const seedAgents = async () => {
  let client;
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/swapner-thikana';
    console.log('Connecting to MongoDB...');
    
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('users');

    // Check if agents already exist to avoid duplicates
    for (const agent of agents) {
      const exists = await collection.findOne({ email: agent.email });
      if (!exists) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        agent.password = await bcrypt.hash(agent.password, salt);
        
        await collection.insertOne(agent);
        console.log(`Agent created: ${agent.name}`);
      } else {
        console.log(`Agent already exists: ${agent.name}`);
      }
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
};

seedAgents();
