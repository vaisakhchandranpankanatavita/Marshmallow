# FUNKY THREADS - E-Commerce Website

A modern, vibrant e-commerce website for selling funky and colorful t-shirts and phone cases. Built with clean HTML, CSS, and JavaScript with a fully functional shopping cart system ready to integrate with Shopify.

## 🎨 Features

### Design & UX
- **Vibrant Color Scheme**: Eye-catching gradients and color combinations
- **Smooth Animations**: Fade-ins, slide-ups, bounces, and parallax effects inspired by terryhoproducts.com
- **Modern Typography**: Space Grotesk and Inter fonts for contemporary feel
- **Responsive Design**: Perfectly optimized for mobile, tablet, and desktop
- **Interactive Elements**: Hover effects, smooth transitions, and engaging interactions

### Shopping Cart
- ✅ Add/remove products
- ✅ Quantity management
- ✅ Real-time total calculation
- ✅ Cart persistence with localStorage
- ✅ Mobile-friendly sidebar cart
- ✅ Ready for Shopify integration

### Product Management
- 12 sample products (6 t-shirts, 6 phone cases)
- Product filtering by category
- Easy-to-extend product structure
- Rich product information display

## 🚀 Quick Start

### Prerequisites
- No build tools needed!
- Works in any modern browser
- Just open `index.html` in your browser

### Installation
1. Clone the repository
2. Open `index.html` in your browser
3. Start shopping!

## 📁 File Structure

```
/
├── index.html                      # Main HTML file
├── css/
│   └── styles.css                 # All styling (2000+ lines)
├── js/
│   ├── products.js                # Product data
│   ├── cart.js                    # Cart functionality
│   └── main.js                    # Main interactions
├── README.md                       # This file
└── SHOPIFY_INTEGRATION.md         # Shopify setup guide
```

## 🛒 Shopping Cart Usage

### For Users
1. Browse products
2. Click "Add to Cart" on any product
3. Use the cart button (top right) to view your cart
4. Adjust quantities or remove items
5. Proceed to checkout

### For Developers
```javascript
// Access cart programmatically
cart.addItem(product);
cart.removeItem(productId);
cart.updateQuantity(productId, newQuantity);
cart.getTotal();
cart.clearCart();
```

## 🎯 Shopify Integration

Complete integration guide available in `SHOPIFY_INTEGRATION.md`

### Quick Integration Steps:
1. Update product data with Shopify IDs
2. Add Shopify Buy SDK to HTML
3. Configure checkout flow
4. Deploy to your domain

See `SHOPIFY_INTEGRATION.md` for detailed instructions.

## 🎨 Customization

### Change Colors
Edit CSS variables in `css/styles.css` (lines 1-15):
```css
--primary-1: #FF6B6B;     /* Main pink/red */
--primary-2: #4ECDC4;     /* Teal */
--primary-3: #FFD93D;     /* Yellow */
/* ... more colors ... */
```

### Add Products
Edit `js/products.js`:
```javascript
{
    id: 13,
    name: 'Your Product',
    category: 'tshirts',
    price: 29.99,
    description: 'Your description',
    image: '👕'
}
```

### Modify Animations
Edit animation timings in `css/styles.css`:
```css
--transition: 0.3s cubic-bezier(...);
--smooth: 0.5s cubic-bezier(...);
```

## 📱 Responsive Breakpoints

- **Mobile**: 480px and below
- **Tablet**: 481px to 768px
- **Desktop**: 769px and above

## ⚡ Performance

- Lightweight: No external dependencies
- Fast: Optimized CSS and JavaScript
- Smooth: 60fps animations
- Accessible: WCAG compliant design

## 🔍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Sample Products

### T-Shirts (6 items)
- Cosmic Rainbow Tee - $34.99
- Electric Dream Shirt - $36.99
- Neon Wave Tee - $32.99
- Sunset Vibes Shirt - $34.99
- Psychedelic Pop Tee - $37.99
- Blob Dream Shirt - $35.99

### Phone Cases (6 items)
- Gradient Glow Case - $24.99
- Rainbow Splash Case - $26.99
- Neon Light Case - $23.99
- Cosmic Phone Shield - $27.99
- Pastel Dream Case - $22.99
- Wave Rider Case - $25.99

## 🛠️ Development

### No Build Step Required
Just edit the files and refresh your browser!

### Key Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients and animations
- **JavaScript ES6+**: Modern JavaScript features

## 💾 Local Storage

Cart data is automatically saved to browser's localStorage:
- Key: `cart`
- Persists across browser sessions
- Cleared on manual cart clear

## 🚀 Deployment

### Simple Deployment
1. Upload files to any web hosting
2. No backend required
3. Add Shopify integration
4. Go live!

### Recommended Hosting
- Netlify (free tier available)
- Vercel
- GitHub Pages
- Your own server

## 📝 License

This project is ready for commercial use. Customize and deploy freely.

## ✨ Features Highlight

- 🎨 **Trending Design**: Modern gradient colors and smooth animations
- 🛍️ **Easy Shopping**: Intuitive cart and checkout
- 📱 **Mobile Ready**: Responsive design on all devices
- ⚡ **Fast**: No dependencies, instant load time
- 🔗 **Shopify Ready**: Built for Shopify integration
- 🎯 **Expandable**: Easy to add products and customize

## 🎬 Demo Sections

### Hero Section
- Large eye-catching headline
- Call-to-action button
- Animated blob background

### Featured Products
- Carousel-style display
- Hot/New/Sale badges
- Smooth hover effects

### All Products Grid
- Filterable by category
- 12 sample products
- Product details and pricing

### Shopping Cart
- Slide-out sidebar
- Item management
- Real-time total calculation

### About Section
- Brand story
- Statistics showcase
- Community feel

### Contact Section
- Newsletter signup
- Contact form
- Customer support

### Footer
- Navigation links
- Social media links
- Copyright info

---

**Status**: Production Ready  
**Version**: 1.0  
**Last Updated**: 2024  

Made with 🎨 for creative brands