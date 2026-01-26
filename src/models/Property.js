const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide property title'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide property description'],
    },
    
    // Property Details
    propertyType: {
      type: String,
      required: true,
      enum: ['apartment', 'house', 'land', 'commercial', 'villa'],
    },
    listingType: {
      type: String,
      required: true,
      enum: ['sale', 'rent'],
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'rented', 'pending'],
      default: 'available',
    },
    
    // Pricing
    price: {
      type: Number,
      required: [true, 'Please provide price'],
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    pricePerSqft: Number,
    negotiable: {
      type: Boolean,
      default: false,
    },
    
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
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Bangladesh',
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    
    // Specifications
    specs: {
      bedrooms: Number,
      bathrooms: Number,
      totalArea: {
        type: Number,
        required: true,
      },
      builtArea: Number,
      floors: Number,
      yearBuilt: Number,
      parking: Number,
      facing: {
        type: String,
        enum: ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'],
      },
    },
    
    // Features & Amenities
    amenities: [String], // ['gym', 'pool', 'garden', 'security', 'playground', 'elevator', 'generator', 'gas']
    
    // Media
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    videos: [
      {
        url: String,
        type: {
          type: String,
          enum: ['youtube', 'vimeo', 'upload'],
        },
      },
    ],
    floorPlans: [
      {
        url: String,
        title: String,
      },
    ],
    virtualTour: String,
    
    // Ownership
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    
    // SEO & Marketing
    featured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: Date,
    tags: [String],
    metaTitle: String,
    metaDescription: String,
    
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
propertySchema.index({ slug: 1 }, { unique: true });
propertySchema.index({ 'location.city': 1, 'location.area': 1 });
propertySchema.index({ propertyType: 1, listingType: 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ featured: 1, createdAt: -1 });
propertySchema.index({ agent: 1 });

// Generate slug before saving
propertySchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
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

// Calculate price per sqft before saving
propertySchema.pre('save', function (next) {
  if (this.price && this.specs && this.specs.totalArea) {
    this.pricePerSqft = Math.round(this.price / this.specs.totalArea);
  }
  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
