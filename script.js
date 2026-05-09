const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const orderForm = document.getElementById("order-form");
const orderStatus = document.getElementById("order-status");
const paymentLink = document.getElementById("payment-link");
const revealItems = document.querySelectorAll(".reveal");
const sizeOptions = document.querySelectorAll(".size-option");
const addToCartButton = document.getElementById("add-to-cart");
const productStatus = document.getElementById("product-status");
const cartCount = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartTotal = document.getElementById("cart-total");
const authTriggers = document.querySelectorAll(".auth-trigger");
const accountTabs = document.querySelectorAll(".account-tab");
const accountTabsWrap = document.querySelector(".account-tabs");
const accountForms = document.querySelectorAll(".account-form");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const accountMessage = document.getElementById("account-message");
const accountHeading = document.getElementById("account-heading");
const headerLogin = document.getElementById("header-login");
const headerRegister = document.getElementById("header-register");
const accountPill = document.getElementById("account-pill");
const accountSession = document.getElementById("account-session");
const accountSessionName = document.getElementById("account-session-name");
const logoutButton = document.getElementById("logout-button");
const zoomableImages = document.querySelectorAll(".zoomable-image");
const lightbox = document.getElementById("image-lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxZoomIn = document.getElementById("lightbox-zoom-in");
const lightboxZoomOut = document.getElementById("lightbox-zoom-out");
const paymentMethods = document.querySelectorAll(".payment-method");
const cardFields = document.getElementById("card-fields");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const checkoutProductTotal = document.getElementById("checkout-product-total");
const checkoutTotal = document.getElementById("checkout-total");
const deliveryStatus = document.getElementById("delivery-status");

const isFilePreview = window.location.protocol === "file:";
const CART_STORAGE_KEY = "threeam-cart";
const AUTH_USER_STORAGE_KEY = "threeam-auth-user";
const AUTH_SESSION_STORAGE_KEY = "threeam-auth-session";
const DEMO_USERS_STORAGE_KEY = "threeam-demo-users";
const DEMO_ACCOUNT_STORAGE_KEY = "threeam-demo-account";
const DELIVERY_STORAGE_KEY = "threeam-delivery";
const PRODUCT_PRICE = 7.5;
const SHIPPING_PRICE = 2.5;

let selectedSize = "Small";
let lightboxScale = 1;
let selectedPaymentMethod = "cod";

const readStoredJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const saveStoredJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getAccount = () => readStoredJson(AUTH_USER_STORAGE_KEY, null);
const getAuthSession = () => readStoredJson(AUTH_SESSION_STORAGE_KEY, null);
const getCart = () => readStoredJson(CART_STORAGE_KEY, []);
const getDemoUsers = () => readStoredJson(DEMO_USERS_STORAGE_KEY, []);
const getDelivery = () => readStoredJson(DELIVERY_STORAGE_KEY, null);

const persistAuthState = ({ user, session }) => {
  saveStoredJson(AUTH_USER_STORAGE_KEY, user);
  saveStoredJson(AUTH_SESSION_STORAGE_KEY, session);
};

const clearAuthState = () => {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

const clearCheckoutState = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(DELIVERY_STORAGE_KEY);
};

const persistDemoAuthState = (user) => {
  saveStoredJson(DEMO_ACCOUNT_STORAGE_KEY, user);
  persistAuthState({
    user,
    session: {
      mode: "demo-local"
    }
  });
};

const clearDemoAuthState = () => {
  localStorage.removeItem(DEMO_ACCOUNT_STORAGE_KEY);
  clearAuthState();
};

const apiRequest = async (path, payload = {}) => {
  const session = getAuthSession();
  const headers = {
    "Content-Type": "application/json"
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
};

const setAuthView = (target) => {
  accountTabs.forEach((tab) => {
    const isActive = tab.dataset.authTarget === target;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  accountForms.forEach((form) => {
    form.classList.toggle("active", form.id === `${target}-form`);
  });
};

const renderAccountState = () => {
  const account = getAccount();

  if (!account) {
    accountHeading.textContent = "Register or log in before adding products to cart.";
    accountPill.textContent = "Guest";
    accountSession.hidden = true;
    headerLogin.hidden = false;
    headerRegister.hidden = false;
    accountTabsWrap.hidden = false;
    registerForm.hidden = false;
    loginForm.hidden = false;
    accountMessage.textContent = isFilePreview
      ? "Local demo auth is active in file preview mode. Register here to test sign in before deployment."
      : "Guests can browse, but adding LEGENDS TEE to the cart requires an account.";
    return;
  }

  accountHeading.textContent = "Your account is active.";
  accountPill.textContent = account.fullName || account.email;
  accountSession.hidden = false;
  headerLogin.hidden = true;
  headerRegister.hidden = true;
  accountTabsWrap.hidden = true;
  registerForm.hidden = true;
  loginForm.hidden = true;
  accountSessionName.textContent = account.fullName ? `${account.fullName} (${account.email})` : account.email;
  accountMessage.textContent = `Logged in as ${account.fullName || account.email}. You can now add products to cart and prepare your Bahrain order.`;
};

const renderCheckoutTotals = () => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.length ? subtotal + SHIPPING_PRICE : 0;

  checkoutProductTotal.textContent = `${subtotal.toFixed(1)} BD`;
  checkoutTotal.textContent = `${total.toFixed(1)} BD`;
};

const renderDeliveryState = () => {
  const delivery = getDelivery();

  if (!delivery) {
    deliveryStatus.textContent = "Save delivery details first so checkout can create the order correctly.";
    paymentLink.hidden = true;
    return;
  }

  deliveryStatus.textContent = `Delivery saved for ${delivery.customerName} in ${delivery.location}. Bahrain shipping fee: 2.5 BD.`;
  paymentLink.hidden = false;
};

const renderCart = () => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cart.length ? subtotal + SHIPPING_PRICE : 0;

  cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  cartSubtotal.textContent = `${subtotal.toFixed(1)} BD`;
  cartTotal.textContent = `${total.toFixed(1)} BD`;
  cartItems.innerHTML = "";

  if (!cart.length) {
    cartEmpty.hidden = false;
    renderCheckoutTotals();
    return;
  }

  cartEmpty.hidden = true;

  cart.forEach((item) => {
    const itemNode = document.createElement("article");
    itemNode.className = "cart-item";
    itemNode.innerHTML = `
      <div class="cart-item-top">
        <span class="cart-item-name">${item.name}</span>
        <strong>${(item.price * item.quantity).toFixed(1)} BD</strong>
      </div>
      <span class="cart-item-meta">Size: ${item.size}</span>
      <span class="cart-item-meta">Quantity: ${item.quantity}</span>
    `;
    cartItems.appendChild(itemNode);
  });

  renderCheckoutTotals();
};

const addProductToCart = () => {
  const account = getAccount();

  if (!account) {
    productStatus.textContent = "Please register or log in first before adding LEGENDS TEE to your cart.";
    setAuthView("register");
    document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const cart = getCart();
  const existingItem = cart.find((item) => item.name === "LEGENDS TEE" && item.size === selectedSize);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: "LEGENDS TEE",
      size: selectedSize,
      price: PRODUCT_PRICE,
      quantity: 1
    });
  }

  saveStoredJson(CART_STORAGE_KEY, cart);
  productStatus.textContent = `LEGENDS TEE in ${selectedSize} was added to your cart.`;
  renderCart();
  document.getElementById("cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const updateLightboxScale = () => {
  lightboxImage.style.transform = `scale(${lightboxScale})`;
};

const openLightbox = (image) => {
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxScale = 1;
  updateLightboxScale();
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeLightbox = () => {
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxScale = 1;
  document.body.style.overflow = "";
};

const setPaymentMethod = (method) => {
  selectedPaymentMethod = method;

  paymentMethods.forEach((button) => {
    const isActive = button.dataset.paymentMethod === method;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  cardFields.hidden = method !== "card";
};

const restoreLocalDemoSession = () => {
  const demoAccount = readStoredJson(DEMO_ACCOUNT_STORAGE_KEY, null);

  if (demoAccount) {
    persistAuthState({
      user: demoAccount,
      session: {
        mode: "demo-local"
      }
    });
  } else {
    clearAuthState();
  }

  renderAccountState();
};

const restoreAuthSession = async () => {
  if (isFilePreview) {
    restoreLocalDemoSession();
    return;
  }

  const storedSession = getAuthSession();

  if (!storedSession?.access_token || !storedSession?.refresh_token) {
    renderAccountState();
    return;
  }

  try {
    const data = await apiRequest("/api/auth/session", {
      session: storedSession
    });

    persistAuthState(data);
  } catch (error) {
    clearAuthState();
    console.warn("Session restore failed:", error.message);
  }

  renderAccountState();
};

const registerWithLocalDemoAuth = ({ fullName, email, password }) => {
  const users = getDemoUsers();

  if (users.some((user) => user.email === email)) {
    throw new Error("This email already has an account. Please log in instead.");
  }

  const user = { fullName, email, password };
  users.push(user);
  saveStoredJson(DEMO_USERS_STORAGE_KEY, users);
  persistDemoAuthState(user);
  return user;
};

const createOrderRecord = async ({ user, delivery, payment }) => {
  if (isFilePreview) {
    return {
      orderId: `demo-${Date.now()}`
    };
  }

  return apiRequest("/api/orders/create", {
    user,
    cart: getCart(),
    delivery,
    payment
  });
};

const loginWithLocalDemoAuth = ({ email, password }) => {
  const users = getDemoUsers();
  const matchingUser = users.find((user) => user.email === email && user.password === password);

  if (!matchingUser) {
    throw new Error("Incorrect email or password. Try again or create a new account.");
  }

  persistDemoAuthState(matchingUser);
  return matchingUser;
};

const handleCheckoutReturnState = async () => {
  const params = new URLSearchParams(window.location.search);
  const checkoutState = params.get("checkout");
  const sessionId = params.get("session_id");
  const clearCheckoutQuery = () => {
    const nextUrl = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
  };

  if (checkoutState === "success" && sessionId && !isFilePreview) {
    checkoutStatus.textContent = "Verifying your Stripe payment...";

    try {
      const data = await apiRequest("/api/checkout/verify-session", {
        session_id: sessionId
      });

      if (data.success) {
        clearCheckoutState();
        renderCart();
        renderDeliveryState();
      }

      checkoutStatus.textContent = data.success
        ? `Payment confirmed. Order ${data.orderId} is now marked as paid.`
        : `Payment returned with status ${data.status}. Please contact support if you were charged.`;
    } catch (error) {
      checkoutStatus.textContent = error.message;
    }

    clearCheckoutQuery();
  } else if (checkoutState === "success") {
    clearCheckoutState();
    renderCart();
    renderDeliveryState();
    checkoutStatus.textContent = "Payment completed successfully. Your order is ready for fulfillment.";
    clearCheckoutQuery();
  } else if (checkoutState === "cancelled") {
    checkoutStatus.textContent = "Checkout was cancelled. You can review your cart and try again.";
    clearCheckoutQuery();
  }
};

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

authTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setAuthView(trigger.dataset.authTarget || "register");
  });
});

accountTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setAuthView(tab.dataset.authTarget || "register");
  });
});

sizeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    selectedSize = option.dataset.size || "Small";

    sizeOptions.forEach((button) => {
      const isActive = button === option;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  });
});

zoomableImages.forEach((image) => {
  image.addEventListener("click", () => openLightbox(image));
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightboxZoomIn?.addEventListener("click", () => {
  lightboxScale = Math.min(lightboxScale + 0.2, 3);
  updateLightboxScale();
});

lightboxZoomOut?.addEventListener("click", () => {
  lightboxScale = Math.max(lightboxScale - 0.2, 0.6);
  updateLightboxScale();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  }
});

paymentMethods.forEach((button) => {
  button.addEventListener("click", () => {
    setPaymentMethod(button.dataset.paymentMethod || "cod");
  });
});

addToCartButton?.addEventListener("click", addProductToCart);

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  accountMessage.textContent = isFilePreview ? "Creating demo account..." : "Creating your account...";

  try {
    if (isFilePreview) {
      const user = registerWithLocalDemoAuth({ fullName, email, password });
      registerForm.reset();
      renderAccountState();
      accountMessage.textContent = `Welcome ${user.fullName || user.email}. Demo account created locally for preview mode.`;
      return;
    }

    const data = await apiRequest("/api/auth/register", {
      fullName,
      email,
      password
    });

    persistAuthState(data);
    registerForm.reset();
    renderAccountState();
    accountMessage.textContent = data.welcomeEmailSent
      ? `Welcome ${data.user.fullName || data.user.email}. Your account is live and a welcome email was sent.`
      : `Welcome ${data.user.fullName || data.user.email}. Your account is live, but the welcome email could not be sent yet.`;
  } catch (error) {
    accountMessage.textContent = error.message;

    if (error.message.toLowerCase().includes("already")) {
      setAuthView("login");
    }
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  accountMessage.textContent = isFilePreview ? "Logging into demo account..." : "Logging you in...";

  try {
    if (isFilePreview) {
      const user = loginWithLocalDemoAuth({ email, password });
      loginForm.reset();
      renderAccountState();
      accountMessage.textContent = `Logged in as ${user.fullName || user.email}.`;
      return;
    }

    const data = await apiRequest("/api/auth/login", {
      email,
      password
    });

    persistAuthState(data);
    loginForm.reset();
    renderAccountState();
    accountMessage.textContent = `Logged in as ${data.user.fullName || data.user.email}.`;
  } catch (error) {
    accountMessage.textContent = error.message;
  }
});

logoutButton?.addEventListener("click", async () => {
  if (isFilePreview) {
    clearDemoAuthState();
    setAuthView("register");
    renderAccountState();
    accountMessage.textContent = "You have been logged out from preview mode.";
    return;
  }

  const storedSession = getAuthSession();

  try {
    if (storedSession) {
      await apiRequest("/api/auth/logout", {
        session: storedSession
      });
    }
  } catch (error) {
    console.warn("Logout request failed:", error.message);
  }

  clearAuthState();
  setAuthView("register");
  renderAccountState();
  accountMessage.textContent = "You have been logged out.";
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name");
  const inquiryType = formData.get("inquiryType");

  formStatus.textContent = `Thanks${name ? `, ${name}` : ""}. Your ${inquiryType || "brand"} inquiry is ready for follow-up.`;
  contactForm.reset();
});

orderForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const delivery = {
    customerName: String(formData.get("customerName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    size: String(formData.get("size") || "").trim(),
    address: String(formData.get("address") || "").trim()
  };

  saveStoredJson(DELIVERY_STORAGE_KEY, delivery);
  selectedSize = delivery.size || selectedSize;
  sizeOptions.forEach((button) => {
    const isActive = button.dataset.size === selectedSize;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderDeliveryState();
  orderStatus.textContent = `Delivery details saved for ${delivery.location || "Bahrain"}. Continue to payment to place the order.`;
  orderForm.reset();
  document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

checkoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const account = getAccount();
  const cart = getCart();
  const delivery = getDelivery();

  if (!account) {
    checkoutStatus.textContent = "Please register or log in before continuing to payment.";
    setAuthView("register");
    document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (!cart.length) {
    checkoutStatus.textContent = "Add LEGENDS TEE to your cart before continuing to payment.";
    document.getElementById("drops")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (!delivery?.customerName || !delivery?.phone || !delivery?.location || !delivery?.address) {
    checkoutStatus.textContent = "Please save delivery details first before continuing to payment.";
    document.getElementById("order-product")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const formData = new FormData(checkoutForm);
  const checkoutName = String(formData.get("checkoutName") || account.fullName || "").trim();
  const checkoutPhone = String(formData.get("checkoutPhone") || delivery.phone || "").trim();

  if (selectedPaymentMethod === "cod") {
    checkoutStatus.textContent = "Creating your order...";

    try {
      const data = await createOrderRecord({
        user: account,
        delivery: {
          ...delivery,
          customerName: checkoutName || delivery.customerName,
          phone: checkoutPhone || delivery.phone
        },
        payment: {
          method: "cod",
          status: "pending_cod",
          provider: "manual"
        }
      });

      checkoutStatus.textContent = `Cash on delivery selected. Order ${data.orderId} was created successfully. Total due on delivery: ${checkoutTotal.textContent}.`;
      clearCheckoutState();
      renderCart();
      renderDeliveryState();
      checkoutForm.reset();
      setPaymentMethod("cod");
      return;
    } catch (error) {
      checkoutStatus.textContent = error.message;
      return;
    }
  }

  if (isFilePreview) {
    checkoutStatus.textContent = "Hosted Stripe Checkout works after deployment on Vercel. File preview mode cannot open the live payment session.";
    return;
  }

  checkoutStatus.textContent = "Redirecting to Stripe Checkout...";

  try {
    const data = await apiRequest("/api/checkout/create-session", {
      cart,
      customer: {
        name: checkoutName || account.fullName || account.email,
        email: account.email,
        phone: checkoutPhone
      },
      shipping: {
        location: delivery.location,
        address: delivery.address
      },
      user: account
    });

    if (!data.url) {
      throw new Error("Secure checkout could not be started.");
    }

    window.location.href = data.url;
  } catch (error) {
    checkoutStatus.textContent = error.message;
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

setAuthView("register");
setPaymentMethod("cod");
renderCart();
renderDeliveryState();
handleCheckoutReturnState();
restoreAuthSession();
