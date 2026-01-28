const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'];
const AREAS = {
  'Dhaka': ['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Bashundhara'],
  'Chittagong': ['Panchlaish', 'Khulshi', 'Agrabad', 'Halishahar'],
  'Sylhet': ['Zindabazar', 'Uposhahar', 'Amberkhana'],
  'Rajshahi': ['Boalia', 'Motihar']
};

const CATEGORIES = ['Lifestyle', 'Investment', 'Tips', 'News', 'Design'];
const TAGS = ['Luxury', 'Modern', 'Cheap', 'Family', 'Investment', 'Real Estate', 'Home'];
const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial', 'office', 'shop', 'warehouse'];
const LISTING_TYPES = ['sale', 'rent'];
const PROJECT_TYPES = ['residential', 'commercial', 'mixed'];
const PROJECT_STATUSES = ['ongoing', 'completed', 'upcoming'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost', 'closed'];
const INTEREST_TYPES = ['property', 'project', 'general'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const seedMockData = async () => {
  let client;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shwapner-thikana';
    console.log('Connecting to MongoDB...');
    
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collections = {
      users: db.collection('users'),
      blogs: db.collection('blogs'),
      projects: db.collection('projects'),
      properties: db.collection('properties'),
      leads: db.collection('leads'),
      notifications: db.collection('notifications'),
      savedSearches: db.collection('saved-searches'),
      reviews: db.collection('reviews')
    };

    // --- CLEAR COLLECTIONS ---
    console.log('Clearing existing data...');
    // Don't clear users if you want to keep your admin account, 
    // but for a full reset we'll clear and recreate.
    await collections.users.deleteMany({});
    await collections.blogs.deleteMany({});
    await collections.projects.deleteMany({});
    await collections.properties.deleteMany({});
    await collections.leads.deleteMany({});
    await collections.notifications.deleteMany({});
    await collections.savedSearches.deleteMany({});
    await collections.reviews.deleteMany({});

    // Helper for hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Enhanced Image Pools with 50+ unique IDs where possible or dynamic sigs
    const PROJECT_IMAGE_IDS = [
        '1486406146926-c627a92ad1ab', '1497366216548-37526070297c', '1464146072230-91cabc70e272', '1523217582562-09d0def993a6',
        '1582408921715-18e7806365c1', '1480714378408-67cf0d13bc1b', '1449844908441-8829872d2607', '1513584684033-524be3fb4ed9',
        '1470770841072-f978cf4d019e', '1501183638710-841dd1904471', '1472851294608-062f824d288b', '1518780664697-55e3ad937233'
    ]; 

    const PROPERTY_IMAGE_IDS = [
        '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1600607687920-4e2a09cf159d', '1570129477492-45c003edd2be',
        '1568605114967-8130f3a36994', '1449156001437-3420af640773', '1430285561322-7808604715df', '1502672260266-1c1ef2d93688',
        '1512917315910-44dee2313934', '1560518883-ce09059eeffa', '1512915920339-38374b6a938c', '1580537659466-0a9bfa74695c'
    ];

    const getUniqueImg = (pool, index, type, size = 1200) => {
        const id = pool[index % pool.length];
        // Ensure image IDs are valid and use a consistent structure
        const baseUrl = 'https://images.unsplash.com/photo-';
        return `${baseUrl}${id}?q=80&w=${size}&auto=format&fit=crop`;
    };

    const NAMES = ['Rahim', 'Nusrat', 'Tanvir', 'Fatima', 'Arif', 'Selina', 'Kamal', 'Maya', 'Sohan', 'Liza', 'Imran', 'Zoya', 'Bashar', 'Nadia', 'Hasib', 'Tania'];
    const SURNAMES = ['Ahmed', 'Jahan', 'Hasan', 'Islam', 'Chowdhury', 'Khan', 'Rahman', 'Uddin', 'Sarker', 'Bhuiyan', 'Talukder', 'Akter'];
    const PROJECT_PREFIXES = ['Skyline', 'Emerald', 'Royal', 'Golden', 'Heritage', 'Modern', 'Elite', 'Serene', 'Vista', 'Imperial', 'Crystal', 'Lakeside', 'Urban', 'Harmony', 'Pinnacle', 'Radiant'];
    const PROJECT_SUFFIXES = ['Towers', 'Gardens', 'Haven', 'Palace', 'Heights', 'Villas', 'Residency', 'Manor', 'Plaza', 'Point', 'View', 'Park', 'Square', 'Crest', 'Terrace', 'Enclave'];

    const BLOG_IMAGE_IDS = [
        '1512149177587-034567298bf2', '1527359393033-99a1f463c3b5', '1501183000213-4c0704040974', '1513584684033-524be3fb4ed9',
        '1499750310117-099d82c10b27', '1454165205770-a896c1766171', '1434031215919-a974b62b013a', '1488190211105-8b0e65b80b4e',
        '1497215728101-856f4ea42174', '1516321318423-f06f85e504b3', '1519389950473-47ba0277781c', '1460925895917-afdab827c52f'
    ];

    console.log('Starting seed process...');

    // 1. Users
    const users = [];
    users.push({
        name: 'Admin User',
        email: 'tafsirchy1000@gmail.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        isActive: true,
        isVerified: true,
        avatar: 'https://i.pravatar.cc/150?u=admin',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    for (let i = 0; i < 49; i++) {
        let role;
        if (i < 9) role = 'admin';
        else if (i < 19) role = 'agent';
        else role = 'user';

        const firstName = getRandom(NAMES);
        const lastName = getRandom(SURNAMES);
        const name = `${firstName} ${lastName} ${i + 1}`;

        users.push({
            name: name,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`,
            password: hashedPassword,
            phone: `+8801${getRandomInt(1, 9)}${getRandomInt(10000000, 99999999)}`,
            role: role,
            status: 'active',
            isActive: true,
            isVerified: true,
            avatar: `https://i.pravatar.cc/150?u=${i}`,
            bio: role === 'agent' ? `Expert in ${getRandom(AREAS['Dhaka'])} real estate with years of experience.` : null,
            specialization: role === 'agent' ? getRandom(PROPERTY_TYPES) : null,
            experience: role === 'agent' ? `${getRandomInt(2, 15)} Years` : null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const userResult = await collections.users.insertMany(users);
    const userIds = Object.values(userResult.insertedIds);
    const adminIds = userIds.slice(0, 10);
    const agentIds = userIds.slice(10, 20);
    const regularUserIds = userIds.slice(20, 50);
    console.log(`Inserted 50 users`);

    // 2. Projects
    const projects = [];
    for (let i = 0; i < 50; i++) {
        const title = `${getRandom(PROJECT_PREFIXES)} ${getRandom(PROJECT_SUFFIXES)} ${i + 1}`;
        const city = getRandom(CITIES);
        const img = getUniqueImg(PROJECT_IMAGE_IDS, i, 'project');
        projects.push({
            title: title,
            slug: slugify(title) + '-' + i,
            description: `Experience the pinnacle of luxury at ${title}. Located in the heart of ${city}, this ${getRandom(PROJECT_TYPES)} development offers state-of-the-art facilities and elegant design for the modern lifestyle. Unique project ID: ${Math.random().toString(36).substring(7)}.`,
            location: {
                city: city,
                address: `${getRandomInt(1, 400)} Road, ${getRandom(AREAS[city])}, ${city}`
            },
            type: getRandom(PROJECT_TYPES),
            status: getRandom(PROJECT_STATUSES),
            features: [getRandom(TAGS), getRandom(TAGS), 'Infinity Pool', 'Gymnasium', '24/7 Concierge', 'Smart Home'],
            images: [img, getUniqueImg(PROJECT_IMAGE_IDS, i + 50, 'project-alt')],
            thumbnail: getUniqueImg(PROJECT_IMAGE_IDS, i, 'project-thumb', 400),
            completionDate: new Date(2026 + getRandomInt(0, 3), getRandomInt(0, 11), getRandomInt(1, 28)).toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const projectResult = await collections.projects.insertMany(projects);
    const projectIds = Object.values(projectResult.insertedIds);
    console.log(`Inserted 50 projects`);

    // 3. Properties
    const properties = [];
    const PROP_ADJECTIVES = ['Spacious', 'Cozy', 'Elegant', 'Bright', 'Charming', 'Sophisticated', 'Lavish', 'Minimalist', 'Scenic', 'Grand'];
    for (let i = 0; i < 50; i++) {
        const pType = getRandom(PROPERTY_TYPES);
        const title = `${getRandom(PROP_ADJECTIVES)} ${pType.charAt(0).toUpperCase() + pType.slice(1)} ${i + 1}`;
        const city = getRandom(CITIES);
        const img = getUniqueImg(PROPERTY_IMAGE_IDS, i, 'property');
        
        // Randomize status for dashboard testing
        let status = 'published';
        if (i < 15) status = 'pending';
        else if (i < 20) status = 'rejected';
        else if (i > 45) status = 'sold';

        // Base coordinates for Dhaka
        const latBase = 23.7104 + (Math.random() - 0.5) * 0.1;
        const lngBase = 90.4074 + (Math.random() - 0.5) * 0.1;

        properties.push({
            title: title,
            slug: slugify(title) + '-' + i,
            description: `Discover this beautiful ${pType} in ${city}. Featuring ${getRandomInt(1, 6)} spacious rooms and premium finishes, it offers a perfect blend of comfort and style. Ideal for ${getRandom(['growing families', 'business professionals', 'investors', 'first-time buyers'])}.`,
            price: getRandomInt(3000000, 100000000),
            area: getRandomInt(800, 6000),
            propertyType: pType,
            listingType: getRandom(LISTING_TYPES),
            location: {
                city: city,
                area: getRandom(AREAS[city]),
                address: `House ${getRandomInt(1, 200)}, Level ${getRandomInt(1, 20)}, Section ${getRandomInt(1, 15)}`
            },
            coordinates: {
              lat: latBase,
              lng: lngBase
            },
            bedrooms: getRandomInt(1, 6),
            bathrooms: getRandomInt(1, 5),
            size: getRandomInt(800, 5000), // Added explicit size field
            yearBuilt: getRandomInt(2010, 2024), // Added yearBuilt
            amenities: [getRandom(TAGS), 'Balcony', 'Gas Supply', 'Generator', 'Parking', 'Fire Safety'],
            images: [img, getUniqueImg(PROPERTY_IMAGE_IDS, i + 50, 'prop-alt')],
            thumbnail: getUniqueImg(PROPERTY_IMAGE_IDS, i, 'prop-thumb', 400),
            agent: new ObjectId(getRandom(agentIds)),
            status: status,
            isVerified: i % 4 !== 0,
            views: getRandomInt(10, 2000),
            featured: i % 10 === 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const propertyResult = await collections.properties.insertMany(properties);
    const propertyIds = Object.values(propertyResult.insertedIds);
    console.log(`Inserted 50 properties`);

    // 4. Blogs
    const BLOG_SAMPLES = [
        {
            title: '10 Essential Tips for First-Time Home Buyers in Dhaka',
            excerpt: 'Navigating the real estate market in Dhaka can be daunting. From verifying land titles to understanding the RAJUK guidelines, here are 10 tips to help you make a safe investment.',
            category: 'Tips',
            imageId: '1560518883-ce09059eeffa'
        },
        {
            title: 'Why Gulshan Remains the Most Coveted Address in Bangladesh',
            excerpt: 'Gulshan isn\'t just a neighborhood; it\'s a lifestyle. Explore why this area continues to lead in luxury real estate value and what makes it the preferred choice for elite living.',
            category: 'Lifestyle',
            imageId: '1582408921715-18e7806365c1'
        },
        {
            title: 'The Rise of Smart Homes: Future-Proofing Your Property',
            excerpt: 'Discover how smart home technology is revolutionizing luxury living in Bangladesh. From automated security to energy-efficient systems, see what\'s trending in 2026.',
            category: 'Design',
            imageId: '1558002274-a0c585547614'
        },
        {
            title: 'Investment Strategies: Residential vs. Commercial Property',
            excerpt: 'Which investment offers better returns in the current market? We break down the pros and cons of residential and commercial real estate in Chittagong and Dhaka.',
            category: 'Investment',
            imageId: '1460925895917-afdab827c52f'
        },
        {
            title: 'Interior Design Tips for Maximizing Small Apartment Spaces',
            excerpt: 'Living in a studio or a 2-bedroom flat? Learn professional design hacks to make your space feel larger, brighter, and more sophisticated without a major renovation.',
            category: 'Design',
            imageId: '1513584684033-524be3fb4ed9'
        },
        {
            title: 'Understanding Property Taxes and VAT in Bangladesh',
            excerpt: 'Stay compliant and avoid surprises. Our comprehensive guide explains the latest updates to property taxes, registration fees, and VAT for real estate transactions.',
            category: 'News',
            imageId: '1450109784172-e12122b7a0c0'
        },
        {
            title: 'How to Choose the Right Real Estate Agency for Your Sale',
            excerpt: 'Not all agencies are created equal. Discover the key qualities to look for in a real estate partner to ensure a fast, transparent, and profitable sale.',
            category: 'Tips',
            imageId: '1454165205770-a896c1766171'
        },
        {
            title: 'The Impact of Metro Rail on Property Value in Dhaka',
            excerpt: 'Infrastructure drives value. We analyze how the completion of the Metro Rail has transformed connectivity and boosted property prices in residential hubs like Mirpur.',
            category: 'News',
            imageId: '1470770841072-f978cf4d019e'
        }
    ];

    const blogs = [];
    for (let i = 0; i < 24; i++) {
        const sample = BLOG_SAMPLES[i % BLOG_SAMPLES.length];
        const title = i >= BLOG_SAMPLES.length ? `${sample.title} (Part 2)` : sample.title;
        const img = getUniqueImg(BLOG_IMAGE_IDS, i, 'blog', 600);
        blogs.push({
            title: title,
            slug: slugify(title) + '-' + i,
            content: `${sample.excerpt} This comprehensive article explores the latest trends and essential insights for our readers. `.repeat(15),
            excerpt: sample.excerpt,
            author: getRandom(adminIds),
            category: sample.category,
            tags: [sample.category, getRandom(TAGS), 'Expert Advice'],
            thumbnail: img,
            views: getRandomInt(100, 5000),
            isPublished: true,
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    await collections.blogs.insertMany(blogs);
    console.log(`Inserted 24 diversified blogs`);

    // 5. Leads
    const leads = [];
    for (let i = 0; i < 50; i++) {
        const leadUser = `${getRandom(NAMES)} ${getRandom(SURNAMES)}`;
        leads.push({
            name: leadUser,
            email: `${leadUser.toLowerCase().replace(' ', '.')}${i}@gmail.com`,
            phone: `+88017${getRandomInt(10000000, 99999999)}`,
            message: `Hi, I am interested in property/project #${i + 1}. Please provide more details regarding price and visiting schedules.`,
            propertyId: i % 2 === 0 ? new ObjectId(getRandom(propertyIds)) : null,
            projectId: i % 2 !== 0 ? new ObjectId(getRandom(projectIds)) : null,
            interestType: getRandom(INTEREST_TYPES),
            status: getRandom(LEAD_STATUSES),
            assignedTo: new ObjectId(getRandom(agentIds)),
            createdAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
        });
    }
    await collections.leads.insertMany(leads);
    console.log(`Inserted 50 leads`);

    // 6. Notifications
    const notifications = []; // Corrected variable name from '通知'
    for (let i = 0; i < 50; i++) {
        notifications.push({
            user: new ObjectId(getRandom(userIds)),
            type: getRandom(['Alert', 'Message', 'System', 'Security']),
            title: `Unique Alert ${i + 1}`,
            message: `Specific notification content for user interaction #${i + 1}. Action required: ${getRandom(['Check Profile', 'View Property', 'Update Password', 'New Inbox'])}.`,
            link: '/dashboard',
            isRead: i % 4 === 0,
            metadata: { eventId: i },
            createdAt: new Date(Date.now() - getRandomInt(0, 1000000000)),
            updatedAt: new Date()
        });
    }
    await collections.notifications.insertMany(notifications);
    console.log(`Inserted 50 notifications`);

    // 7. Saved Searches
    const savedSearches = [];
    for (let i = 0; i < 50; i++) {
        const city = getRandom(CITIES);
        const area = getRandom(AREAS[city]);
        savedSearches.push({
            user: new ObjectId(getRandom(regularUserIds)),
            name: `${city} ${area} ${getRandom(LISTING_TYPES)} Search ${i + 1}`,
            filters: {
                city: city,
                area: area,
                minPrice: getRandomInt(1000000, 5000000),
                maxPrice: getRandomInt(10000000, 100000000),
                listingType: getRandom(LISTING_TYPES),
                propertyType: getRandom(PROPERTY_TYPES)
            },
            alertFrequency: getRandom(['never', 'daily', 'weekly']),
            isActive: true,
            createdAt: new Date(Date.now() - getRandomInt(0, 2592000000)),
            updatedAt: new Date()
        });
    }
    await collections.savedSearches.insertMany(savedSearches);
    console.log(`Inserted 50 saved-searches`);

    // 8. Reviews
    const reviews = [];
    const REVIEW_COMMENTS = [
        "Absolutely stunning property! The view is breathtaking.",
        "Very professional agent. Handled everything with care.",
        "The project location is perfect for families.",
        "Could use better ventilation, but overall a great deal.",
        "Highly recommended! The building quality is top-notch.",
        "Had a smooth experience and the amenities are as promised.",
        "Wait time for the project completion is a bit long.",
        "Best investment I've made this year.",
        "Expert guidance from the agent throughout the process."
    ];

    for (let i = 0; i < 50; i++) {
        const reviewer = users[getRandomInt(20, 49)]; // Pick a regular user
        const property = i % 2 === 0 ? propertyIds[getRandomInt(0, 49)] : null;
        const agent = i % 2 !== 0 ? agentIds[getRandomInt(0, 9)] : null;
        
        reviews.push({
            userId: reviewer._id || new ObjectId(regularUserIds[getRandomInt(0, regularUserIds.length-1)]),
            userName: reviewer.name,
            userPhoto: reviewer.avatar,
            propertyId: property ? new ObjectId(property) : null,
            agentId: agent ? new ObjectId(agent) : null,
            rating: getRandomInt(3, 5),
            comment: getRandom(REVIEW_COMMENTS),
            status: getRandom(['published', 'pending', 'rejected']),
            createdAt: new Date(Date.now() - getRandomInt(0, 7776000000)), // up to 90 days ago
            updatedAt: new Date()
        });
    }
    await collections.reviews.insertMany(reviews);
    console.log(`Inserted 50 reviews`);

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
};

seedMockData();
