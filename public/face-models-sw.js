// Face Recognition Models Service Worker
// Caches face-api.js models for offline use

const CACHE_NAME = 'qshe-face-models-v1';
const MODELS_CACHE_NAME = 'qshe-face-models-data-v1';

// Face-api.js model URLs to cache
const FACE_API_MODELS = [
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2'
];

// Additional assets to cache
const FACE_API_ASSETS = [
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
];

// Install event - pre-cache essential models
self.addEventListener('install', (event) => {
  console.log('🔄 Face Models SW: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Cache the face-api.js library
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(FACE_API_ASSETS);
        console.log('✅ Face Models SW: Library cached');
        
        // Pre-cache essential models (tiny detector only for fast initial load)
        const modelsCache = await caches.open(MODELS_CACHE_NAME);
        const essentialModels = FACE_API_MODELS.filter(url => 
          url.includes('tiny_face_detector')
        );
        
        const cachePromises = essentialModels.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await modelsCache.put(url, response);
              console.log(`✅ Cached essential model: ${url.split('/').pop()}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to cache essential model: ${url}`, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('✅ Face Models SW: Essential models cached');
        
      } catch (error) {
        console.error('❌ Face Models SW: Install failed', error);
      }
    })()
  );
  
  self.skipWaiting();
});

// Activate event - claim clients and start background caching
self.addEventListener('activate', (event) => {
  console.log('🔄 Face Models SW: Activating...');
  
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      console.log('✅ Face Models SW: Activated');
      
      // Start background caching of remaining models
      self.postMessage({ type: 'START_BACKGROUND_CACHE' });
    })()
  );
});

// Fetch event - serve cached models or fetch with fallback
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Handle face-api.js library requests
  if (FACE_API_ASSETS.some(asset => url.includes(asset.split('/').pop()))) {
    event.respondWith(
      caches.match(event.request, { cacheName: CACHE_NAME })
        .then(response => {
          if (response) {
            console.log(`📦 Serving cached library: ${url.split('/').pop()}`);
            return response;
          }
          
          // Fallback to network
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                // Cache for next time
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // Handle face model requests
  if (FACE_API_MODELS.some(model => url.includes(model.split('/').pop()))) {
    event.respondWith(
      caches.match(event.request, { cacheName: MODELS_CACHE_NAME })
        .then(response => {
          if (response) {
            console.log(`📦 Serving cached model: ${url.split('/').pop()}`);
            return response;
          }
          
          // Fallback to network with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          return fetch(event.request, { signal: controller.signal })
            .then(networkResponse => {
              clearTimeout(timeoutId);
              
              if (networkResponse.ok) {
                // Cache for next time
                caches.open(MODELS_CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                  console.log(`💾 Cached model: ${url.split('/').pop()}`);
                });
              }
              return networkResponse;
            })
            .catch(error => {
              clearTimeout(timeoutId);
              console.warn(`⚠️ Failed to fetch model: ${url.split('/').pop()}`, error);
              
              // Return a minimal error response
              return new Response(
                JSON.stringify({ error: 'Model temporarily unavailable' }),
                { 
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }
});

// Message event - handle background caching requests
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_MODELS_BACKGROUND') {
    cacheRemainingModels();
  }
  
  if (event.data?.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

// Background caching of remaining models
async function cacheRemainingModels() {
  console.log('🔄 Starting background model caching...');
  
  try {
    const modelsCache = await caches.open(MODELS_CACHE_NAME);
    const nonEssentialModels = FACE_API_MODELS.filter(url => 
      !url.includes('tiny_face_detector')
    );
    
    for (const url of nonEssentialModels) {
      try {
        // Check if already cached
        const cached = await modelsCache.match(url);
        if (cached) {
          console.log(`⏭️ Already cached: ${url.split('/').pop()}`);
          continue;
        }
        
        // Fetch and cache with retry logic
        let retries = 3;
        while (retries > 0) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await modelsCache.put(url, response);
              console.log(`✅ Background cached: ${url.split('/').pop()}`);
              break;
            }
          } catch (error) {
            retries--;
            if (retries === 0) {
              console.warn(`❌ Failed to cache after retries: ${url.split('/').pop()}`);
            } else {
              console.log(`🔄 Retrying cache: ${url.split('/').pop()} (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error caching model: ${url}`, error);
      }
    }
    
    console.log('✅ Background model caching completed');
    
    // Notify main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'MODELS_CACHED', status: 'completed' });
    });
    
  } catch (error) {
    console.error('❌ Background caching failed:', error);
  }
}

// Get cache status for debugging
async function getCacheStatus() {
  try {
    const modelsCache = await caches.open(MODELS_CACHE_NAME);
    const libraryCache = await caches.open(CACHE_NAME);
    
    const cachedModels = [];
    const cachedLibrary = [];
    
    for (const url of FACE_API_MODELS) {
      const cached = await modelsCache.match(url);
      cachedModels.push({
        url: url.split('/').pop(),
        cached: !!cached,
        size: cached ? (await cached.blob()).size : 0
      });
    }
    
    for (const url of FACE_API_ASSETS) {
      const cached = await libraryCache.match(url);
      cachedLibrary.push({
        url: url.split('/').pop(),
        cached: !!cached,
        size: cached ? (await cached.blob()).size : 0
      });
    }
    
    return {
      models: cachedModels,
      library: cachedLibrary,
      totalCachedModels: cachedModels.filter(m => m.cached).length,
      totalModels: FACE_API_MODELS.length
    };
    
  } catch (error) {
    console.error('Error getting cache status:', error);
    return { error: error.message };
  }
}

console.log('🚀 Face Models Service Worker loaded');