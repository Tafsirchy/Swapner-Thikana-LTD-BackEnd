const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide project name'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    tagline: String,
    description: {
      type: String,
      required: [true, 'Please provide project description'],
    },
    
    // Project Details
    developer: String, // Company name
    projectType: {
 type: String,
      enum: ['residential', 'commercial', 'mixed-use'],
    },
    status: {
      type: String,
      enum: ['planning', 'under-construction', 'completed', 'handover'],
      required: true,
    },
    
    // Timeline
    launchDate: Date,
    estimatedCompletion: Date,
    actualCompletion: Date,
    
    // Location
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    
    // Project Specs
    totalArea: Number, // sq ft
    totalUnits: Number,
    totalFloors: Number,
    totalBlocks: Number,
    
    // Unit Types
    unitTypes: [
      {
        name: String, // e.g., '2 BHK', '3 BHK'
        bedrooms: Number,
        bathrooms: Number,
        area: Number,
        priceRange: {
          min: Number,
          max: Number,
        },
        available: Number,
        total: Number,
      },
    ],
    
    // Amenities
    amenities: [String],
    
    // Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        category: {
          type: String,
          enum: ['exterior', 'interior', 'amenity', 'masterplan', 'progress'],
        },
      },
    ],
    masterPlan: String, // Image URL
    brochure: String, // PDF URL
    videos: [String],
    
    // Associated Properties
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
    
    // Marketing
    featured: {
      type: Boolean,
      default: false,
    },
    highlights: [String], // Key selling points
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ slug: 1 }, { unique: true });
projectSchema.index({ status: 1 });
projectSchema.index({ 'location.city': 1 });

// Generate slug before saving
projectSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    // Add timestamp to ensure uniqueness
    this.slug = `${this.slug}-${Date.now()}`;
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
