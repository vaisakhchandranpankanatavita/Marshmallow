// Product Data
const products = [
    // T-Shirts
    {
        id: 1,
        name: 'Cosmic Rainbow Tee',
        category: 'tshirts',
        price: 34.99,
        description: 'Bold cosmic design with vibrant rainbow colors',
        image: '👕'
    },
    {
        id: 2,
        name: 'Electric Dream Shirt',
        category: 'tshirts',
        price: 36.99,
        description: 'Trippy electric gradient print',
        image: '👕'
    },
    {
        id: 3,
        name: 'Neon Wave Tee',
        category: 'tshirts',
        price: 32.99,
        description: 'Smooth neon wave animation inspired',
        image: '👕'
    },
    {
        id: 4,
        name: 'Sunset Vibes Shirt',
        category: 'tshirts',
        price: 34.99,
        description: 'Warm sunset gradient with retro feel',
        image: '👕'
    },
    {
        id: 5,
        name: 'Psychedelic Pop Tee',
        category: 'tshirts',
        price: 37.99,
        description: 'Eye-catching psychedelic pop art',
        image: '👕'
    },
    {
        id: 6,
        name: 'Blob Dream Shirt',
        category: 'tshirts',
        price: 35.99,
        description: 'Flowing blob shapes with gradient colors',
        image: '👕'
    },

    // Phone Cases
    {
        id: 7,
        name: 'Gradient Glow Case',
        category: 'cases',
        price: 24.99,
        description: 'Smooth gradient protection for all models',
        image: '📱'
    },
    {
        id: 8,
        name: 'Rainbow Splash Case',
        category: 'cases',
        price: 26.99,
        description: 'Colorful splash pattern with grip edges',
        image: '📱'
    },
    {
        id: 9,
        name: 'Neon Light Case',
        category: 'cases',
        price: 23.99,
        description: 'Glowing neon effect protective case',
        image: '📱'
    },
    {
        id: 10,
        name: 'Cosmic Phone Shield',
        category: 'cases',
        price: 27.99,
        description: 'Space-themed cosmic design case',
        image: '📱'
    },
    {
        id: 11,
        name: 'Pastel Dream Case',
        category: 'cases',
        price: 22.99,
        description: 'Soft pastel gradient protection',
        image: '📱'
    },
    {
        id: 12,
        name: 'Wave Rider Case',
        category: 'cases',
        price: 25.99,
        description: 'Wavy pattern with bold colors',
        image: '📱'
    }
];

// Export products for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = products;
}
