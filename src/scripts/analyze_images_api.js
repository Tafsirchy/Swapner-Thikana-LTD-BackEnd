const fs = require('fs');
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in Node 18+

const API_BASE = 'http://localhost:5000/api';

async function analyze() {
  console.log('Starting Image Analysis...');
  
  try {
    // 1. Fetch Projects
    console.log('Fetching Projects...');
    const projectsRes = await fetch(`${API_BASE}/projects`);
    const projectsData = await projectsRes.json();
    const projects = projectsData.data?.projects || projectsData.data || []; 

    // 2. Fetch Properties
    console.log('Fetching Properties...');
    const propertiesRes = await fetch(`${API_BASE}/properties`);
    const propertiesData = await propertiesRes.json();
    const properties = propertiesData.data?.properties || propertiesData.data || [];

    let allImages = [];

    // Extract Project Images
    projects.forEach(p => {
      if (p.images) {
        if (Array.isArray(p.images)) {
           p.images.forEach(img => extractImage(img, `Project: ${p.title}`, allImages));
        } else {
           extractImage(p.images, `Project: ${p.title}`, allImages);
        }
      }
      if (p.coverImage) extractImage(p.coverImage, `Project Cover: ${p.title}`, allImages);
    });

    // Extract Property Images
    properties.forEach(p => {
       if (p.images) {
          if (Array.isArray(p.images)) {
             p.images.forEach(img => extractImage(img, `Property: ${p.title}`, allImages));
          } else {
             extractImage(p.images, `Property: ${p.title}`, allImages);
          }
       }
    });

    console.log(`Found ${allImages.length} image references.`);

    // Analyze Unique URLs
    const uniqueUrls = [...new Set(allImages.map(i => i.url))];
    console.log(`Analyzing ${uniqueUrls.length} unique URLs...`);

    const results = [];
    
    // Process in batches
    for (const url of uniqueUrls) {
        if (!url || !url.startsWith('http')) continue;
        
        try {
            const headRes = await fetch(url, { method: 'HEAD' });
            const size = headRes.headers.get('content-length');
            const type = headRes.headers.get('content-type');
            
            results.push({
                url,
                sizeBytes: size ? parseInt(size) : 0,
                type,
                context: allImages.find(i => i.url === url).context
            });
        } catch (e) {
            console.error(`Error analyzing ${url}:`, e.message);
        }
    }

    // Sort by size
    results.sort((a, b) => b.sizeBytes - a.sizeBytes);

    // Report
    console.log('\n=== ANALYSIS REPORT ===');
    console.log('Top 10 Largest Images:');
    results.slice(0, 10).forEach((r, i) => {
        console.log(`${i+1}. [${(r.sizeBytes / 1024 / 1024).toFixed(2)} MB] ${r.url} (${r.context})`);
    });

    console.log('\nStats:');
    const totalSize = results.reduce((sum, r) => sum + r.sizeBytes, 0);
    console.log(`Total Size of unique images: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Average Size: ${(totalSize / results.length / 1024).toFixed(2)} KB`);
    console.log(`Count > 1MB: ${results.filter(r => r.sizeBytes > 1024*1024).length}`);
    console.log(`Count > 500KB: ${results.filter(r => r.sizeBytes > 500*1024).length}`);

  } catch (err) {
    console.error('Analysis Failed:', err);
  }
}

function extractImage(img, context, list) {
    if (!img) return;
    if (typeof img === 'string') {
        list.push({ url: img, context, type: 'string' });
    } else if (typeof img === 'object') {
        if (img.url) list.push({ url: img.url, context, type: 'object.url' });
        if (img.original) list.push({ url: img.original, context, type: 'object.original' });
        if (img.medium) list.push({ url: img.medium, context, type: 'object.medium' });
        if (img.thumbnail) list.push({ url: img.thumbnail, context, type: 'object.thumbnail' });
    }
}

analyze();
