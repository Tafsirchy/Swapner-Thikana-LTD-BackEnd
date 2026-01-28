const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BLOG_POSTS = [
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
    },
    {
        title: 'Sustainable Living: The New Era of Green Apartments',
        excerpt: 'Eco-friendly architecture is more than just a trend. Learn about the sustainable building practices being adopted in the latest residential projects.',
        category: 'Lifestyle',
        imageId: '1518005020286-d074b122822a'
    },
    {
        title: 'Navigating the Home Loan Process: A Step-by-Step Guide',
        excerpt: 'Ready to buy but need financing? We walk you through the home loan application process, required documents, and current interest rates in Bangladesh banks.',
        category: 'Investment',
        imageId: '1554224158-71321269b0eb'
    },
    {
        title: 'Choosing the Perfect Neighborhood: A Guide to Dhaka\'s Areas',
        excerpt: 'From the serenity of Bashundhara to the vibrancy of Dhanmondi, which neighborhood fits your personality? Find your perfect match in our detailed area guide.',
        category: 'Lifestyle',
        imageId: '1480714378408-67cf0d13bc1b'
    },
    {
        title: 'Checklist for Handover: What to Inspect Before Moving In',
        excerpt: 'Congratulations on your new home! Before you sign the final papers, use our checklist to ensure every corner of your property meets the promised standards.',
        category: 'Tips',
        imageId: '1503387762-2bd51cb99475'
    }
];

const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

const getImageUrl = (id) => `https://images.unsplash.com/photo-${id}?q=80&w=1200&auto=format&fit=crop`;

const seedBlogs = async () => {
    let client;
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shwapner-thikana';
        console.log('Connecting to MongoDB...');
        
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('blogs');
        const usersCollection = db.collection('users');

        // Get an admin user to be the author
        const admin = await usersCollection.findOne({ role: 'admin' });
        const authorId = admin ? admin._id : new ObjectId();

        console.log('Clearing existing blog data...');
        await collection.deleteMany({});

        console.log('Inserting new diversified blogs...');
        const blogs = BLOG_POSTS.map((post, i) => ({
            title: post.title,
            slug: slugify(post.title) + '-' + i,
            content: `${post.excerpt}\n\nThis article provides an in-depth look at ${post.title}. \n\n` + 
                     `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. \n\n` +
                     `Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \n\n` +
                     `Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. \n\n` +
                     `Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`.repeat(3),
            excerpt: post.excerpt,
            author: authorId,
            category: post.category,
            tags: [post.category, 'Real Estate', 'Dhaka'],
            thumbnail: getImageUrl(post.imageId),
            views: Math.floor(Math.random() * 5000) + 100,
            isPublished: true,
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await collection.insertMany(blogs);
        console.log(`Successfully inserted ${blogs.length} diversified blogs`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('Database connection closed');
        }
    }
};

seedBlogs();
