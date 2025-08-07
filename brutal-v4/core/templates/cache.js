/**
 * BRUTAL V4 - Template Cache Module
 * Caching system for templates and styles
 */

// Template cache for performance
const templateCache = new Map();
const styleCache = new Map();

// Cache size limits
const MAX_TEMPLATE_CACHE_SIZE = 1000;
const MAX_STYLE_CACHE_SIZE = 500;

/**
 * Get template from cache
 */
export function getTemplateCache(key) {
    const cached = templateCache.get(key);
    if (cached) {
        cached.hits++;
        cached.lastAccessed = Date.now();
    }
    return cached;
}

/**
 * Set template in cache
 */
export function setTemplateCache(key, value) {
    // Enforce cache size limit
    if (templateCache.size >= MAX_TEMPLATE_CACHE_SIZE) {
        evictLeastRecentlyUsed(templateCache);
    }
    
    templateCache.set(key, {
        ...value,
        lastAccessed: Date.now()
    });
}

/**
 * Get style from cache
 */
export function getStyleCache(key) {
    return styleCache.get(key);
}

/**
 * Set style in cache
 */
export function setStyleCache(key, value) {
    // Enforce cache size limit
    if (styleCache.size >= MAX_STYLE_CACHE_SIZE) {
        evictLeastRecentlyUsed(styleCache);
    }
    
    styleCache.set(key, value);
}

/**
 * Clear all caches
 */
export function clearCache() {
    templateCache.clear();
    styleCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const templateStats = Array.from(templateCache.values()).reduce((stats, cache) => {
        stats.totalSize += cache.template.innerHTML.length;
        stats.totalHits += cache.hits || 0;
        if ((cache.hits || 0) === 0) stats.unused++;
        return stats;
    }, { totalSize: 0, totalHits: 0, unused: 0 });
    
    return {
        templates: {
            count: templateCache.size,
            totalSize: templateStats.totalSize,
            totalHits: templateStats.totalHits,
            unused: templateStats.unused
        },
        styles: {
            count: styleCache.size
        },
        total: templateCache.size + styleCache.size,
        efficiency: templateStats.totalHits / Math.max(templateCache.size, 1),
        memoryEstimate: templateStats.totalSize + (styleCache.size * 100) // Rough estimate
    };
}

/**
 * Evict least recently used items from cache
 */
function evictLeastRecentlyUsed(cache, itemsToEvict = 10) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => {
        const aTime = a[1].lastAccessed || 0;
        const bTime = b[1].lastAccessed || 0;
        return aTime - bTime;
    });
    
    for (let i = 0; i < itemsToEvict && i < entries.length; i++) {
        cache.delete(entries[i][0]);
    }
}