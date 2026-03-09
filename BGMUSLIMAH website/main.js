// ================================================================
// BGMUSLIMAH — main.js
// This file controls all the interactive behaviour on the site.
// JavaScript is the "brain" — it responds to clicks, scrolls, etc.
// ================================================================


// ----------------------------------------------------------------
// CART SYSTEM
// We store the cart as an array of objects in memory
// Each object = { name: "...", price: 89, quantity: 1 }
// ----------------------------------------------------------------

// Start with an empty cart
let cart = [];

// This runs every time the page loads — restores cart from browser storage
window.addEventListener('DOMContentLoaded', () => {
  // localStorage = the browser remembers data even after closing the page
  const saved = localStorage.getItem('bgmuslimah-cart');
  if (saved) {
    cart = JSON.parse(saved); // Convert saved text back into JavaScript object
    updateCartUI();
  }
});

// OPEN CART — called when cart icon is clicked
function openCart() {
  document.getElementById('cartSidebar').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  // Prevent the page behind from scrolling
  document.body.style.overflow = 'hidden';
}

// CLOSE CART — called when overlay or X is clicked
function closeCart() {
  document.getElementById('cartSidebar').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}

// addToCart is defined below in the PRE-ORDER SYSTEM section
// It handles both regular and preorder items

// REMOVE FROM CART — called when × button on cart item is clicked
function removeFromCart(index) {
  // Remove 1 item at position "index" from the cart array
  cart.splice(index, 1);
  localStorage.setItem('bgmuslimah-cart', JSON.stringify(cart));
  updateCartUI();
}

// UPDATE CART UI — rebuilds the cart HTML whenever cart changes
function updateCartUI() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartFooter  = document.getElementById('cartFooter');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Only count non-preorder items in the price total
  // Preorders are reservations — no money changes hands
  const totalPrice = cart
    .filter(item => !item.isPreorder)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const hasPreorders = cart.some(item => item.isPreorder);

  cartCountEl.textContent = totalItems;
  cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    cartFooter.style.display = 'none';
    return;
  }

  // Build cart items HTML
  // Preorder items get a special tag and show "Reservation — no payment"
  let itemsHTML = '';

  // Show a notice at the top if there are any preorders
  if (hasPreorders) {
    itemsHTML += `
      <div class="cart-preorder-note">
        ✦ Your cart includes <strong>Pre-Order reservations</strong>.
        These are free to hold — we'll contact you when ready.
        No payment required for these items.
      </div>
    `;
  }

  itemsHTML += cart.map((item, index) => `
    <div class="cart-item">
      <div>
        <div style="font-weight:400; margin-bottom:4px">${item.name}</div>
        ${item.isPreorder
          ? `<span class="cart-item-tag">Pre-Order · No payment</span>`
          : `<div style="font-size:12px; color:#9A9A9A">${item.quantity} × ${item.price}€</div>`
        }
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
    </div>
  `).join('');

  cartItemsEl.innerHTML = itemsHTML;

  cartFooter.style.display = 'block';

  // If only preorders in cart, show 0€ with a note
  if (totalPrice === 0 && hasPreorders) {
    cartTotalEl.textContent = '0€ (reservations only)';
  } else {
    cartTotalEl.textContent = totalPrice + '€';
  }
}


// ----------------------------------------------------------------
// MOBILE MENU
// Shows/hides the navigation on small screens
// ----------------------------------------------------------------
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('open'); // toggle = add if not there, remove if it is
}

// Close mobile menu when clicking a nav link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});


// ----------------------------------------------------------------
// NEWSLETTER FORM
// Handles the email signup form at the bottom
// ----------------------------------------------------------------
function handleNewsletter(event) {
  // preventDefault stops the page from refreshing (default form behaviour)
  event.preventDefault();

  const input = event.target.querySelector('input[type="email"]');
  const email = input.value;

  // For now we just show a thank you message
  // Later we'll connect this to Mailchimp or another service
  input.value = '';
  alert('Thank you! You\'re on the list. We\'ll be in touch soon. 🖤');
}


// ----------------------------------------------------------------
// SCROLL ANIMATIONS
// Elements fade in as you scroll down to them
// ----------------------------------------------------------------

// Add the fade-in class to sections we want to animate
// We do this with JavaScript so that if JS is disabled, content still shows
document.querySelectorAll('.categories, .featured, .brand-strip, .instagram, .newsletter').forEach(el => {
  el.classList.add('fade-in');
});

// IntersectionObserver = watches elements and fires when they enter the screen
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element is now visible — add the "visible" class which triggers the CSS animation
      entry.target.classList.add('visible');
      // Stop watching once it's visible (we only want the animation once)
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1 // Trigger when 10% of the element is visible
});

// Start watching all fade-in elements
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


// ----------------------------------------------------------------
// NAVBAR SHADOW ON SCROLL
// Adds a subtle shadow to the navbar when you've scrolled down
// ----------------------------------------------------------------
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});


// ----------------------------------------------------------------
// PRE-ORDER SYSTEM
// ----------------------------------------------------------------

// Tracks which item is being pre-ordered
let currentPreorderItem = null;

// Called when "Pre-Order Now" button is clicked
// isPreorder = true means this is a preorder, not a regular purchase
function addToCart(name, price, isPreorder) {
  if (isPreorder) {
    // For preorders: open the modal to collect customer details
    openPreorder(name, price);
  } else {
    // For regular items: add directly to cart as before
    addRegularToCart(name, price);
  }
}

// Opens the preorder modal
function openPreorder(name, price) {
  currentPreorderItem = { name, price };
  // Show the item name inside the modal
  document.getElementById('preorderItemName').textContent = name + ' — ' + price + '€';
  document.getElementById('preorderModal').classList.add('active');
  document.getElementById('preorderOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Closes the preorder modal
function closePreorder() {
  document.getElementById('preorderModal').classList.remove('active');
  document.getElementById('preorderOverlay').classList.remove('active');
  document.body.style.overflow = '';
  currentPreorderItem = null;
}

// Called when the preorder form is submitted
function submitPreorder(event) {
  event.preventDefault();

  const name      = document.getElementById('preorderName').value;
  const email     = document.getElementById('preorderEmail').value;
  const phone     = document.getElementById('preorderPhone').value;
  const notes     = document.getElementById('preorderNotes').value;
  const item      = currentPreorderItem;

  // Add to cart as a preorder item (marked differently)
  addPreorderToCart(item.name, item.price, { name, email, phone, notes });

  // Reset form
  event.target.reset();
  closePreorder();

  // Open cart so customer can see their reservation
  openCart();

  // Confirmation message
  alert(`Thank you, ${name}! Your reservation for "${item.name}" has been noted. We'll contact you at ${email} when it's ready. No payment needed! 🖤`);
}

// Adds a regular (non-preorder) item to cart
function addRegularToCart(name, price) {
  const existing = cart.find(item => item.name === name && !item.isPreorder);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1, isPreorder: false });
  }
  localStorage.setItem('bgmuslimah-cart', JSON.stringify(cart));
  updateCartUI();
  openCart();
}

// Adds a preorder item to cart (always a new entry — each preorder is unique)
function addPreorderToCart(name, price, customerInfo) {
  cart.push({
    name,
    price,
    quantity: 1,
    isPreorder: true,
    customer: customerInfo
  });
  localStorage.setItem('bgmuslimah-cart', JSON.stringify(cart));
  updateCartUI();
}
