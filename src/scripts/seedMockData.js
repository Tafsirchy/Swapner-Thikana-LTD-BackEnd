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

    // Curated Architecture & Real Estate Image IDs (Verified & Fresh)
    const PROJECT_IMAGE_IDS = [
        '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1613545325278-f24b0cae1224', 
        '1600566753086-00f18fb6b3ea', '1600585154526-990dced4db0d', '1600607687644-c7171b42498f', 
        '1600566753190-17f0baa2a6c3', '1600585152209-648318547f66', '1613977257363-707ba9348227', 
        '1600566753376-12c8ab7802b7', '1600585154363-67eb9e2bab87', '1600566752355-35792bedfe56'
    ]; 

    const PROPERTY_IMAGE_IDS = [
        '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1613545325278-f24b0cae1224', 
        '1600566753086-00f18fb6b3ea', '1600585154526-990dced4db0d', '1600607687644-c7171b42498f', 
        '1600566753190-17f0baa2a6c3', '1600585152209-648318547f66', '1613977257363-707ba9348227', 
        '1600566753376-12c8ab7802b7', '1600585154363-67eb9e2bab87', '1600566752355-35792bedfe56'
    ];

    const getUniqueImg = (pool, index, type, size = 1200) => {
        const id = pool[index % pool.length];
        const baseUrl = 'https://images.unsplash.com/photo-';
        return `${baseUrl}${id}?q=80&w=${size}&auto=format&fit=crop`;
    };

    const NAMES = ['Rahim', 'Nusrat', 'Tanvir', 'Fatima', 'Arif', 'Selina', 'Kamal', 'Maya', 'Sohan', 'Liza', 'Imran', 'Zoya', 'Bashar', 'Nadia', 'Hasib', 'Tania'];
    const SURNAMES = ['Ahmed', 'Jahan', 'Hasan', 'Islam', 'Chowdhury', 'Khan', 'Rahman', 'Uddin', 'Sarker', 'Bhuiyan', 'Talukder', 'Akter'];
    const PROJECT_PREFIXES = ['Skyline', 'Emerald', 'Royal', 'Golden', 'Heritage', 'Modern', 'Elite', 'Serene', 'Vista', 'Imperial', 'Crystal', 'Lakeside', 'Urban', 'Harmony', 'Pinnacle', 'Radiant'];
    const PROJECT_SUFFIXES = ['Towers', 'Gardens', 'Haven', 'Palace', 'Heights', 'Villas', 'Residency', 'Manor', 'Plaza', 'Point', 'View', 'Park', 'Square', 'Crest', 'Terrace', 'Enclave'];

    const BLOG_IMAGE_IDS = [
        '1600585154340-be6161a56a0c', '1600596542815-ffad4c1539a9', '1613545325278-f24b0cae1224', 
        '1600566753086-00f18fb6b3ea', '1600585154526-990dced4db0d', '1600607687644-c7171b42498f', 
        '1600566753190-17f0baa2a6c3', '1600585152209-648318547f66', '1613977257363-707ba9348227', 
        '1600566753376-12c8ab7802b7', '1600585154363-67eb9e2bab87', '1600566752355-35792bedfe56'
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

    for (let i = 0; i < 14; i++) { // 1 admin + 14 others = 15 total
        let role;
        if (i < 3) role = 'admin';
        else if (i < 9) role = 'agent';
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
    const adminIds = userIds.slice(0, 4);
    const agentIds = userIds.slice(4, 10);
    const regularUserIds = userIds.slice(10, 15);
    console.log(`Inserted 15 users`);

    // 2. Projects
    const projects = [];
    for (let i = 0; i < 15; i++) {
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
            images: [img, getUniqueImg(PROJECT_IMAGE_IDS, i + 1, 'project-alt')],
            thumbnail: getUniqueImg(PROJECT_IMAGE_IDS, i, 'project-thumb', 400),
            completionDate: new Date(2026 + getRandomInt(0, 3), getRandomInt(0, 11), getRandomInt(1, 28)).toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const projectResult = await collections.projects.insertMany(projects);
    const projectIds = Object.values(projectResult.insertedIds);
    console.log(`Pushed to projects array: ${projects.length}`);
    console.log(`Inserted to DB: ${projectIds.length} projects`);


    // 3. Properties
    const properties = [];
    const PROP_ADJECTIVES = ['Spacious', 'Cozy', 'Elegant', 'Bright', 'Charming', 'Sophisticated', 'Lavish', 'Minimalist', 'Scenic', 'Grand'];
    for (let i = 0; i < 15; i++) {
        const pType = getRandom(PROPERTY_TYPES);
        const title = `${getRandom(PROP_ADJECTIVES)} ${pType.charAt(0).toUpperCase() + pType.slice(1)} ${i + 1}`;
        const city = getRandom(CITIES);
        const img = getUniqueImg(PROPERTY_IMAGE_IDS, i, 'property');
        
        // All published for pagination testing as per user request
        let status = 'published';


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
            size: getRandomInt(800, 5000), 
            yearBuilt: getRandomInt(2010, 2024),
            amenities: [getRandom(TAGS), 'Balcony', 'Gas Supply', 'Generator', 'Parking', 'Fire Safety'],
            images: [img, getUniqueImg(PROPERTY_IMAGE_IDS, i + 1, 'prop-alt')],
            thumbnail: getUniqueImg(PROPERTY_IMAGE_IDS, i, 'prop-thumb', 400),
            agent: new ObjectId(getRandom(agentIds)),
            status: status,
            isVerified: i % 4 !== 0,
            views: getRandomInt(10, 2000),
            featured: i % 3 === 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    const propertyResult = await collections.properties.insertMany(properties);
    const propertyIds = Object.values(propertyResult.insertedIds);
    console.log(`Inserted 15 properties`);

    // 4. Magazines
    const MAGAZINE_COVERS = [
        '1541963463532-d68292c34b19', '1524995943678-bd4fe3b94d00', '1540206395-688085723adb', 
        '1600607687939-ce8a6c25118c', '1491955470617-fe379d844569', '1491308056681-7104e762925a'
    ];
    
    const magazines = [];
    for (let i = 0; i < 6; i++) {
        const title = `Luxe Living Vol. ${i + 1}`;
        magazines.push({
            title: title,
            slug: slugify(title),
            coverImage: getUniqueImg(MAGAZINE_COVERS, i, 'magazine', 800),
            pdfUrl: 'https://example.com/magazine.pdf',
            publicationDate: new Date(new Date().setMonth(new Date().getMonth() - i)),
            description: 'Exclusive interviews with top architects and a look into the future of urban living.',
            publisher: 'STLTD Media',
            isPublished: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    await db.collection('magazines').deleteMany({});
    await db.collection('magazines').insertMany(magazines);
    console.log(`Inserted 6 magazines`);

    // 5. Agencies
    const AGENCY_LOGOS = [
         '1560179707-f14e90ef3623', '1599305445671-ac291c95dd9f', '1556740758-90de6902f798'
    ];
    
    const agencies = [];
    const AGENCY_NAMES = ['Elite Spaces', 'Urban Architects', 'Global Estates'];
    for (let i = 0; i < 3; i++) {
        agencies.push({
            name: AGENCY_NAMES[i],
            slug: slugify(AGENCY_NAMES[i]),
            logo: getUniqueImg(AGENCY_LOGOS, i, 'agency', 400),
            description: 'Premier partner in luxury real estate development and sales.',
            contactInfo: {
                phone: '+8801700000000',
                email: `contact@${slugify(AGENCY_NAMES[i])}.com`,
                address: 'Gulshan 2, Dhaka'
            },
            website: `https://${slugify(AGENCY_NAMES[i])}.com`,
            foundedYear: 2010 + i,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    await db.collection('agencies').deleteMany({});
    await db.collection('agencies').insertMany(agencies);
    console.log(`Inserted 3 agencies`);

    // Management Team (Update Users)
    const managementUsers = [
        {
            name: 'Tafsir Ahmed',
            email: 'ceo@stltd.com',
            role: 'management',
            designation: 'Chief Executive Officer',
            bio: 'Visionary leader with 15 years in luxury real estate formulation.',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400',
            password: hashedPassword
        },
        {
            name: 'Sarah Khan',
            email: 'coo@stltd.com',
            role: 'management',
            designation: 'Chief Operations Officer',
            bio: 'Operational excellence expert ensuring seamless project delivery.',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400',
            password: hashedPassword
        },
        {
            name: 'James Wilson',
            email: 'cfo@stltd.com',
            role: 'management',
            designation: 'Chief Financial Officer',
            bio: 'Strategic financial planning for sustainable growth.',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
            password: hashedPassword
        }
    ];

    for (const user of managementUsers) {
        // Upsert management users
        await db.collection('users').updateOne(
            { email: user.email },
            { 
               $set: { 
                   ...user, 
                   status: 'active', 
                   createdAt: new Date(), 
                   updatedAt: new Date() 
               } 
            },
            { upsert: true }
        );
    }
    console.log('Inserted/Updated 3 management profiles');

    // 4. Blogs (Renumbered from original file, but keeping sequential logic here)
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
    for (let i = 0; i < 15; i++) {
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
    console.log(`Inserted 15 diversified blogs`);

    // 5. Leads
    const leads = [];
    for (let i = 0; i < 15; i++) {
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
    console.log(`Inserted 15 leads`);

    // 6. Notifications
    const notifications = []; 
    for (let i = 0; i < 15; i++) {
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
    console.log(`Inserted 15 notifications`);

    // 7. Saved Searches
    const savedSearches = [];
    for (let i = 0; i < 15; i++) {
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
    console.log(`Inserted 15 saved-searches`);

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

    for (let i = 0; i < 15; i++) {
        // Safe check for reviewer index
        const reviewerIndex = getRandomInt(10, 14); // Regular users are 10-14
        const reviewer = users[reviewerIndex] || users[users.length - 1]; 
        
        const property = i % 2 === 0 ? propertyIds[getRandomInt(0, 14)] : null;
        const agent = i % 2 !== 0 ? agentIds[getRandomInt(0, 5)] : null;
        
        reviews.push({
            userId: reviewer._id || new ObjectId(regularUserIds[getRandomInt(0, regularUserIds.length-1)]),
            userName: reviewer.name,
            userPhoto: reviewer.avatar,
            propertyId: property ? new ObjectId(property) : null,
            agentId: agent ? new ObjectId(agent) : null,
            rating: getRandomInt(3, 5),
            comment: getRandom(REVIEW_COMMENTS),
            status: getRandom(['published', 'pending', 'rejected']),
            createdAt: new Date(Date.now() - getRandomInt(0, 7776000000)), 
            updatedAt: new Date()
        });
    }
    await collections.reviews.insertMany(reviews);
    console.log(`Inserted 15 reviews`);

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
