# FUNKY THREADS - Shopify Integration Guide

## Overview
This is a modern, colorful e-commerce website built with HTML, CSS, and JavaScript. It features a fully functional shopping cart system ready to integrate with Shopify.

## Project Structure
```
/
├── index.html                 # Main HTML file
├── css/
│   └── styles.css            # All styling, animations, and responsive design
├── js/
│   ├── products.js           # Product data and product definitions
│   ├── cart.js               # Shopping cart logic and management
│   └── main.js               # Main functionality and interactions
├── SHOPIFY_INTEGRATION.md    # This file
└── README.md                 # General project information
```

## Features

### 🎨 Design Features
- **Vibrant Color Scheme**: Multiple gradient color combinations inspired by terryhoproducts.com
- **Smooth Animations**: Fade-ins, slide-ups, pop-ins, and parallax effects
- **Modern Typography**: Uses Space Grotesk and Inter fonts for a contemporary look
- **Responsive Design**: Fully responsive from mobile to desktop
- **Interactive Elements**: Hover effects, smooth transitions, and engaging interactions

### 🛒 Shopping Cart Features
- **Add/Remove Items**: Users can add and remove products from cart
- **Quantity Control**: Increase/decrease item quantities
- **Cart Persistence**: Cart data saved to localStorage
- **Cart Summary**: Real-time cart total calculation
- **Mobile Friendly**: Responsive cart sidebar for all devices

### 🏪 Product Management
- **12 Sample Products**: 6 T-shirts and 6 phone cases with unique designs
- **Product Filtering**: Filter by category (All, T-Shirts, Phone Cases)
- **Product Details**: Name, description, price, and category for each item
- **Easy to Extend**: Simple JSON structure for adding new products

## How to Integrate with Shopify

### Step 1: Add Shopify Buy Button
Replace the checkout button functionality in `js/cart.js`:

```javascript
// In handleCheckout() function, replace with:
function handleCheckout() {
    if (!cart || cart.items.length === 0) {
        showContactNotification('Your cart is empty!', true);
        return;
    }

    // Redirect to Shopify store
    window.location.href = 'https://your-store.myshopify.com/cart';
}
```

### Step 2: Connect Products to Shopify
Update `js/products.js` with your Shopify product IDs:

```javascript
const products = [
    {
        id: '1',  // Use your Shopify product ID
        name: 'Cosmic Rainbow Tee',
        category: 'tshirts',
        price: 34.99,
        description: 'Bold cosmic design with vibrant rainbow colors',
        image: '👕',
        shopifyId: '1234567890' // Add your Shopify ID
    },
    // ... more products
];
```

### Step 3: Implement Shopify API
Add the Shopify Buy SDK to enable direct checkout:

```html
<!-- Add to index.html <head> -->
<script src="https://cdn.shopify.com/s/files/1/YOUR-STORE-ID/cdn/shop.app.js"></script>
```

### Step 4: Update Checkout Flow
Modify `js/main.js` handleCheckout():

```javascript
function handleCheckout() {
    if (!cart || cart.items.length === 0) {
        showContactNotification('Your cart is empty!', true);
        return;
    }

    // Create Shopify checkout with cart items
    const checkoutData = cart.items.map(item => ({
        variantId: item.shopifyId,
        quantity: item.quantity
    }));

    // Initialize Shopify checkout
    ShopifyBuy.UI.onReady(client => {
        // Create checkout with items
        client.checkout.create({
            lineItems: checkoutData
        }).then(checkout => {
            // Redirect to Shopify checkout
            window.location.href = checkout.webUrl;
        });
    });
}
```

### Step 5: Add Product Variants
For Shopify integration, update product structure to include variants:

```javascript
{
    id: 1,
    name: 'Cosmic Rainbow Tee',
    category: 'tshirts',
    price: 34.99,
    description: 'Bold cosmic design with vibrant rainbow colors',
    image: '👕',
    variants: {
        'S': 'gid://shopify/ProductVariant/12345',
        'M': 'gid://shopify/ProductVariant/12346',
        'L': 'gid://shopify/ProductVariant/12347',
        'XL': 'gid://shopify/ProductVariant/12348'
    }
}
```

### Step 6: Environment Configuration
Create a `.env` file for Shopify credentials:

```
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_API_KEY=your_api_key
```

## Customization

### Change Colors
Edit CSS variables in `css/styles.css`:

```css
:root {
    --primary-1: #FF6B6B;      /* Main color */
    --primary-2: #4ECDC4;      /* Secondary color */
    --primary-3: #FFD93D;      /* Tertiary color */
    --primary-4: #A8E6CF;      /* Accent color */
    --primary-5: #FF8B94;      /* Highlight color */
    --dark-bg: #0F0F1E;        /* Dark background */
    --light-bg: #FFFFFF;       /* Light background */
    --text-dark: #1A1A2E;      /* Dark text */
    --text-light: #FFFFFF;     /* Light text */
    --accent: #FF1B6D;         /* Primary accent */
}
```

### Add More Products
Simply add to the `products` array in `js/products.js`:

```javascript
{
    id: 13,
    name: 'Your Product Name',
    category: 'tshirts', // or 'cases'
    price: 29.99,
    description: 'Product description',
    image: '👕' // or '📱'
}
```

### Modify Animations
Adjust animation timings in `css/styles.css`:

```css
--transition: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--smooth: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Cart Data Structure

The cart stores items in the following format:

```javascript
{
    id: 1,
    name: 'Product Name',
    price: 29.99,
    quantity: 2,
    category: 'tshirts',
    image: '👕'
}
```

Accessible via: `cart.items` array

## API Endpoints for Shopify

### Get Products
```
GET /admin/api/2023-01/products.json
```

### Create Cart
```
POST /api/2023-01/graphql.json
```

### Fetch Cart
```
GET /cart.json
```

### Add to Cart
```
POST /cart/add.json
```

## Testing

### Local Testing
1. Open `index.html` in a browser
2. Add items to cart
3. Verify cart functionality
4. Check localStorage for cart persistence

### Cart Verification
In browser console:
```javascript
// Check cart items
console.log(cart.items);

// Check cart total
console.log(cart.getTotal());

// Clear cart
cart.clearCart();
```

## Performance Optimization

- **Lazy Loading**: Images are prepared for lazy loading
- **CSS Optimization**: Minified production ready
- **JavaScript Efficiency**: Modular code structure
- **Scroll Performance**: Optimized animations with will-change

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Cart Not Persisting
- Check if localStorage is enabled
- Clear browser cache and reload
- Check browser console for errors

### Animations Not Smooth
- Verify GPU acceleration is enabled
- Check browser performance
- Reduce animation complexity if needed

### Shopify Integration Issues
- Verify Shopify API credentials
- Check CORS settings
- Ensure correct product IDs are used

## Next Steps for Deployment

1. **Domain Setup**: Point your domain to hosting
2. **SSL Certificate**: Enable HTTPS
3. **Shopify Connection**: Complete integration steps above
4. **Payment Processing**: Configure Shopify payments
5. **Inventory Sync**: Set up automatic inventory updates
6. **Email Notifications**: Configure order confirmations
7. **Analytics**: Add Google Analytics or Shopify analytics

## Support & Resources

- [Shopify API Documentation](https://shopify.dev/api)
- [Shopify Buy SDK](https://shopify.github.io/js-buy-sdk/)
- [Web Development Guide](https://developer.mozilla.org/)

## License

This project is ready for commercial use. Customize and deploy as needed.

---

**Status**: Ready for Shopify integration  
**Last Updated**: 2024  
**Version**: 1.0
