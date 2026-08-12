// Main JavaScript for Product Management and Interactions

document.addEventListener('DOMContentLoaded', () => {
    initializeProducts();
    setupFilterButtons();
    setupScrollAnimations();
    setupContactForm();
});

// Initialize and render products
function initializeProducts() {
    const productsGrid = document.getElementById('productsGrid');
    renderProducts(products, productsGrid);
}

// Render products to the grid
function renderProducts(productsToRender, container) {
    container.innerHTML = productsToRender.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.05}s">
            <div class="product-image ${product.category}">
                ${product.image}
            </div>
            <div class="product-info">
                <div class="product-category">${product.category === 'tshirts' ? 'T-Shirt' : 'Phone Case'}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="handleAddToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Handle add to cart
function handleAddToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && cart) {
        cart.addItem(product);
    }
}

// Setup filter buttons
function setupFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter products
            const filter = btn.dataset.filter;
            const filtered = filter === 'all'
                ? products
                : products.filter(p => p.category === filter);

            renderProducts(filtered, document.getElementById('productsGrid'));
        });
    });
}

// Setup scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.products, .about, .contact').forEach(el => {
        observer.observe(el);
    });
}

// Setup contact form
function setupContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const inputs = contactForm.querySelectorAll('.form-input, .form-textarea');
    const submitBtn = contactForm.querySelector('.cta-button');

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const name = inputs[0].value;
            const email = inputs[1].value;
            const message = inputs[2].value;

            if (name && email && message) {
                // Show success message
                showContactNotification('Message sent! We\'ll get back to you soon.');

                // Clear form
                inputs.forEach(input => input.value = '');
            } else {
                showContactNotification('Please fill in all fields.', true);
            }
        });
    }
}

// Show notification
function showContactNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: ${isError ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Handle checkout (placeholder for Shopify integration)
function handleCheckout() {
    if (!cart || cart.items.length === 0) {
        showContactNotification('Your cart is empty!', true);
        return;
    }

    // Prepare cart data for Shopify
    const cartData = {
        items: cart.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
        })),
        total: cart.getTotal(),
        timestamp: new Date().toISOString()
    };

    console.log('Cart Data Ready for Shopify Integration:', cartData);

    // Show message
    showContactNotification('Redirecting to checkout... (Shopify integration ready)', false);

    // Placeholder for Shopify redirect
    setTimeout(() => {
        // Replace this with actual Shopify integration
        // window.location.href = `https://your-shopify-store.myshopify.com/cart/${cart.items.map(i => i.id).join(',')}`;
        console.log('Ready to connect to Shopify Store');
    }, 1000);
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effect to product cards
document.addEventListener('mouseover', (e) => {
    const productCard = e.target.closest('.product-card');
    if (productCard) {
        productCard.style.transform = 'translateY(-8px)';
    }
});

document.addEventListener('mouseout', (e) => {
    const productCard = e.target.closest('.product-card');
    if (productCard) {
        productCard.style.transform = '';
    }
});

// Parallax effect on scroll (optional enhancement)
window.addEventListener('scroll', () => {
    const blobs = document.querySelectorAll('.blob');
    blobs.forEach((blob, index) => {
        const speed = (index + 1) * 0.5;
        blob.style.transform = `translateY(${window.scrollY * speed}px)`;
    });
});

// Performance optimization - lazy load images if needed
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                // Placeholder for lazy loading actual images
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('.product-image').forEach(img => imageObserver.observe(img));
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderProducts,
        handleAddToCart,
        handleCheckout
    };
}
