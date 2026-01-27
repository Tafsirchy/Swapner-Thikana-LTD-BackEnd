const { SavedSearches } = require('../models/SavedSearch');
const { getDB } = require('../config/db');
const { sendNewMatchEmail } = require('./emailSender');
const { ObjectId } = require('mongodb');

/**
 * Check if a property matches a saved search's criteria
 */
const matchesSavedSearch = (property, savedSearch) => {
  const { filters } = savedSearch;
  
  // 1. Core filters
  if (filters.listingType && property.listingType !== filters.listingType) return false;
  if (filters.propertyType && property.propertyType !== filters.propertyType) return false;
  if (filters.city && property.location?.city !== filters.city) return false;
  
  // 2. Specifications
  if (filters.bedrooms && property.bedrooms < Number(filters.bedrooms)) return false;
  if (filters.bathrooms && property.bathrooms < Number(filters.bathrooms)) return false;
  
  // 3. Price Range
  if (filters.minPrice && property.price < Number(filters.minPrice)) return false;
  if (filters.maxPrice && property.price > Number(filters.maxPrice)) return false;
  
  // 4. Area Range
  if (filters.minArea && property.size < Number(filters.minArea)) return false;
  if (filters.maxArea && property.size > Number(filters.maxArea)) return false;
  
  // 5. Search keyword (Title or Area)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const titleMatch = property.title?.toLowerCase().includes(searchLower);
    const areaMatch = property.location?.area?.toLowerCase().includes(searchLower);
    if (!titleMatch && !areaMatch) return false;
  }
  
  // 6. Amenities (Must have all requested amenities)
  if (filters.amenities && filters.amenities.length > 0) {
    const propertyAmenities = property.amenities || [];
    const hasAll = filters.amenities.every(a => propertyAmenities.includes(a));
    if (!hasAll) return false;
  }
  
  return true;
};

/**
 * Handle instant alerts for a newly created property
 */
const handleNewProperty = async (property) => {
  try {
    // Find all active saved searches with 'instant' alerts
    const activeSearches = await SavedSearches()
      .find({ isActive: true, alertFrequency: 'instant' })
      .toArray();
    
    console.log(`🔍 Checking ${activeSearches.length} instant searches for property: ${property.title}`);
    
    for (const search of activeSearches) {
      if (matchesSavedSearch(property, search)) {
        // Find the user
        const user = await getDB().collection('users').findOne({ _id: search.user });
        if (user && user.email) {
          console.log(`✉️ Sending instant match alert to: ${user.email} for search: ${search.name}`);
          await sendNewMatchEmail(user, property, search);
          
          // Update lastAlertSent
          await SavedSearches().updateOne(
            { _id: search._id },
            { $set: { lastAlertSent: new Date() } }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error handling instant alerts:', error);
  }
};

/**
 * Process scheduled alerts (Daily/Weekly)
 */
const processScheduledAlerts = async (frequency) => {
  try {
    console.log(`🕒 Processing ${frequency} scheduled alerts...`);
    
    const searches = await SavedSearches()
      .find({ isActive: true, alertFrequency: frequency })
      .toArray();
    
    for (const search of searches) {
      // Find properties created since last alert sent (or last 1 day for daily, 7 for weekly)
      const lastSent = search.lastAlertSent || new Date(Date.now() - (frequency === 'daily' ? 24 : 168) * 60 * 60 * 1000);
      
      const newProperties = await getDB().collection('properties')
        .find({ 
          createdAt: { $gt: lastSent },
          status: 'published' 
        })
        .toArray();
      
      const matches = newProperties.filter(p => matchesSavedSearch(p, search));
      
      if (matches.length > 0) {
        const user = await getDB().collection('users').findOne({ _id: search.user });
        if (user && user.email) {
          // For digest, we might want to send multiple, but for now we'll notify about the most recent one 
          // or modify the template to handle multiple. 
          // To keep it simple, we'll send the latest one.
          console.log(`✉️ Sending ${frequency} digest alert to: ${user.email} (Found ${matches.length} matches)`);
          await sendNewMatchEmail(user, matches[0], search);
          
          await SavedSearches().updateOne(
            { _id: search._id },
            { $set: { lastAlertSent: new Date() } }
          );
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${frequency} alerts:`, error);
  }
};

module.exports = {
  handleNewProperty,
  processScheduledAlerts
};
