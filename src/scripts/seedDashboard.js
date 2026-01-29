const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const agents = [
  {
    name: 'Rahim Ahmed',
    specialty: 'Luxury Penthouses',
    experience: '12 Years',
    email: 'rahim@stltd.com',
    phone: '+880 1711 223344',
    bio: 'Senior property consultant specializing in Gulshan and Banani luxury markets. With over a decade of experience, Rahim has closed some of the most prestigious deals in the city.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400',
    status: 'Verified',
    rating: 5.0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Nusrat Jahan',
    specialty: 'Residential Sales',
    experience: '7 Years',
    email: 'nusrat@stltd.com',
    phone: '+880 1911 556677',
    bio: 'Passionate about matching families with their perfect homes. Nusrat is known for her exceptional negotiation skills and deep understanding of residential zoning in Uttara.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400',
    status: 'Verified',
    rating: 4.9,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Tanvir Hasan',
    specialty: 'Commercial Strategy',
    experience: '10 Years',
    email: 'tanvir@stltd.com',
    phone: '+880 1811 889900',
    bio: 'Specialist in commercial land acquisition and high-rise commercial space leasing. Tanvir provides strategic consultancy for corporate clients.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
    status: 'Verified',
    rating: 4.8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const management = [
  {
    name: 'Tafsir Chowdhury',
    role: 'Founder & CEO',
    email: 'ceo@stltd.com',
    order: 1,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400',
    linkedin: 'https://linkedin.com/in/tafsir',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Sarah Khan',
    role: 'Chief Operations Officer',
    email: 'coo@stltd.com',
    order: 2,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400',
    linkedin: 'https://linkedin.com/in/sarah',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Michael Chen',
    role: 'Chief Technology Officer',
    email: 'cto@stltd.com',
    order: 3,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
    linkedin: 'https://linkedin.com/in/michael',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    console.log('Clearing existing dashboard data...');
    await db.collection('agents').deleteMany({});
    await db.collection('management').deleteMany({});

    console.log('Seeding agents...');
    await db.collection('agents').insertMany(agents);

    console.log('Seeding management...');
    await db.collection('management').insertMany(management);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seed();
