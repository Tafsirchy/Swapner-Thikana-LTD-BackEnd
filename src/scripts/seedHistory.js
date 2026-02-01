require('dotenv').config();
const { connectDB, closeDB } = require('../config/db');
const { History } = require('../models/History');

const milestones = [
  {
    year: "2015",
    title: "Architectural Origins",
    description: "Shwapner Thikana was established as a boutique consultancy with a mission to bring world-class architectural standards to Bangladesh's premium residential market.",
    icon: "Building",
    status: "Published",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    year: "2017",
    title: "The Golden Portfolio",
    description: "Surpassed 100 curated luxury listings across Dhaka's most prestigious zones, from Gulshan to Baridhara.",
    icon: "Award",
    status: "Published",
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    year: "2019",
    title: "Eco-Luxury Initiative",
    description: "Launched our first 'Sustainable Living' project series, integrating energy-efficient technologies with high-end design.",
    icon: "ShieldCheck",
    status: "Published",
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    year: "2021",
    title: "Next-Gen Discovery",
    description: "Revolutionized the viewing experience with our proprietary AI-matching platform and 360-degree virtual penthouse tours.",
    icon: "History",
    status: "Published",
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    year: "2023",
    title: "Premier Global Partner",
    description: "Formed strategic alliances with top-tier international architectural firms in London and Dubai to bring global expertise to our clients.",
    icon: "Users",
    status: "Published",
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    year: "2025",
    title: "Defining the Future",
    description: "Commencing our flagship 'Infinity Tower' project, aimed at becoming the most technologically advanced residential landmark in Southeast Asia.",
    icon: "Building",
    status: "Published",
    order: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const seedHistory = async () => {
  try {
    await connectDB();
    console.log('Connected to database...');

    // Clear existing history
    await History().deleteMany({});
    console.log('Cleared existing history milestones.');

    // Insert new data
    const result = await History().insertMany(milestones);
    console.log(`Successfully seeded ${result.insertedCount} milestones.`);

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedHistory();
