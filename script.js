const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const orderForm = document.getElementById("order-form");
const orderStatus = document.getElementById("order-status");
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
const verifyForm = document.getElementById("verify-form");
const resendCodeButton = document.getElementById("resend-code-button");
const changeEmailButton = document.getElementById("change-email-button");
const verificationLogoutButton = document.getElementById("verification-logout-button");
const verificationPanel = document.getElementById("verification-panel");
const verificationCopy = document.getElementById("verification-copy");
const accountMessage = document.getElementById("account-message");
const accountHeading = document.getElementById("account-heading");
const headerLogin = document.getElementById("header-login");
const headerRegister = document.getElementById("header-register");
const accountPill = document.getElementById("account-pill");
const accountSession = document.getElementById("account-session");
const accountSessionName = document.getElementById("account-session-name");
const logoutButton = document.getElementById("logout-button");
const adminPanel = document.getElementById("admin-panel");
const adminMessage = document.getElementById("admin-message");
const adminOrders = document.getElementById("admin-orders");
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
const PENDING_VERIFICATION_EMAIL_STORAGE_KEY = "threeam-pending-verification-email";
const DELIVERY_STORAGE_KEY = "threeam-delivery";
const PRODUCT_PRICE = 7.5;
const SHIPPING_PRICE = 2.5;
const TAX_RATE = 0.1;

let selectedSize = "Small";
let lightboxScale = 1;
let selectedPaymentMethod = "cod";
let authReady = false;
let isAdminUser = false;

const navigateTo = (href) => {
  window.location.href = href;
};

const redirectAfterAuthSuccess = () => {
  if (window.location.pathname.endsWith("/account.html") || window.location.pathname.endsWith("/account")) {
    navigateTo("index.html");
  }
};

const sanitizeNameInput = (value) => String(value || "").replace(/[^A-Za-z ]+/g, "").replace(/\s{2,}/g, " ").trimStart();
const sanitizePhoneInput = (value) => String(value || "").replace(/\D+/g, "");

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
const getPendingVerificationEmail = () => localStorage.getItem(PENDING_VERIFICATION_EMAIL_STORAGE_KEY);

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

const setPendingVerificationEmail = (email) => {
  localStorage.setItem(PENDING_VERIFICATION_EMAIL_STORAGE_KEY, email);
};

const clearPendingVerificationEmail = () => {
  localStorage.removeItem(PENDING_VERIFICATION_EMAIL_STORAGE_KEY);
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

const apiGetRequest = async (path) => {
  const session = getAuthSession();
  const headers = {};

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(path, {
    method: "GET",
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
};

const setAuthView = (target) => {
  if (!accountTabs.length || !accountForms.length) {
    return;
  }

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
  const pendingVerificationEmail = getPendingVerificationEmail();
  document.body.classList.toggle("is-authenticated", Boolean(account));

  if (!account) {
    const isVerifying = Boolean(pendingVerificationEmail);

    if (accountHeading) {
      accountHeading.textContent = isVerifying
        ? "Confirm your email to activate your account."
        : "Register or log in before adding products to cart.";
    }

    if (accountPill) {
      accountPill.textContent = "Guest";
    }

    if (accountSession) {
      accountSession.hidden = true;
    }

    if (headerLogin) {
      headerLogin.hidden = false;
    }

    if (headerRegister) {
      headerRegister.hidden = false;
    }

    if (verificationPanel) {
      verificationPanel.hidden = !isVerifying;
    }

    if (accountTabsWrap) {
      accountTabsWrap.hidden = isVerifying;
    }

    if (registerForm) {
      registerForm.hidden = isVerifying ? true : false;
    }

    if (loginForm) {
      loginForm.hidden = isVerifying ? true : false;
    }

    if (verificationCopy) {
      verificationCopy.textContent = pendingVerificationEmail
        ? `We sent a verification code to ${pendingVerificationEmail}. Enter it below to confirm your email and continue.`
        : "Enter the code sent to your email address to activate your account.";
    }

    if (accountMessage) {
      accountMessage.textContent = isVerifying
        ? "Your account is almost ready. Confirm your email to finish signing in."
        : isFilePreview
        ? "Local demo auth is active in file preview mode. Register here to test sign in before deployment."
        : "Guests can browse, but adding LEGENDS TEE to the cart requires an account.";
    }

    isAdminUser = false;
    if (adminPanel) {
      adminPanel.hidden = true;
    }
    authReady = true;
    return;
  }

  if (accountHeading) {
    accountHeading.textContent = "Your account is active.";
  }

  if (accountPill) {
    accountPill.textContent = account.fullName || account.email;
  }

  if (accountSession) {
    accountSession.hidden = false;
  }

  if (headerLogin) {
    headerLogin.hidden = true;
  }

  if (headerRegister) {
    headerRegister.hidden = true;
  }

  if (verificationPanel) {
    verificationPanel.hidden = true;
  }

  if (accountTabsWrap) {
    accountTabsWrap.hidden = true;
  }

  if (registerForm) {
    registerForm.hidden = true;
  }

  if (loginForm) {
    loginForm.hidden = true;
  }

  if (accountSessionName) {
    accountSessionName.textContent = account.fullName ? `${account.fullName} (${account.email})` : account.email;
  }

  if (accountMessage) {
    accountMessage.textContent = `Logged in as ${account.fullName || account.email}. You can now add products to cart and prepare your Bahrain order.`;
  }

  authReady = true;
};

const renderAdminOrders = (orders = []) => {
  if (!adminOrders || !adminMessage) {
    return;
  }

  adminOrders.innerHTML = "";

  if (!orders.length) {
    adminMessage.textContent = "No orders yet. New ones will appear here as they come in.";
    return;
  }

  adminMessage.textContent = `Showing ${orders.length} recent order${orders.length === 1 ? "" : "s"}.`;

  orders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "admin-order-card";
    const items = Array.isArray(order.cart)
      ? order.cart.map((item) => `${item.name} (${item.size}) x${item.quantity}`).join(", ")
      : "";

    card.innerHTML = `
      <div class="admin-order-head">
        <strong>Order ${order.id}</strong>
        <strong>${Number(order.totalBhd).toFixed(1)} BD</strong>
      </div>
      <div class="admin-order-meta">
        <span>${order.customerName}</span>
        <span>${order.customerPhone}</span>
        <span>${order.paymentMethod} / ${order.paymentStatus}</span>
      </div>
      <div class="admin-order-items">${items}</div>
      <div class="admin-order-meta">
        <span>${order.shippingLocation}</span>
        <span>${order.shippingAddress}</span>
      </div>
    `;

    adminOrders.appendChild(card);
  });
};

const loadAdminOrders = async () => {
  const account = getAccount();

  if (!adminPanel || !adminMessage || !adminOrders || !account || isFilePreview) {
    isAdminUser = false;
    if (adminPanel) {
      adminPanel.hidden = true;
    }
    return;
  }

  try {
    const data = await apiGetRequest("/api/admin/orders/list");
    isAdminUser = true;
    adminPanel.hidden = false;
    renderAdminOrders(data.orders || []);
  } catch {
    isAdminUser = false;
    adminPanel.hidden = true;
  }
};

const renderCheckoutTotals = () => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = cart.length ? subtotal * TAX_RATE : 0;
  const total = cart.length ? subtotal + SHIPPING_PRICE + tax : 0;

  if (checkoutProductTotal) {
    checkoutProductTotal.textContent = `${subtotal.toFixed(1)} BD`;
  }

  const checkoutTax = document.getElementById("checkout-tax");

  if (checkoutTax) {
    checkoutTax.textContent = `${tax.toFixed(1)} BD`;
  }

  if (checkoutTotal) {
    checkoutTotal.textContent = `${total.toFixed(1)} BD`;
  }
};

const renderDeliveryState = () => {
  const delivery = getDelivery();

  if (!deliveryStatus) {
    return;
  }

  if (!delivery) {
    deliveryStatus.textContent = "Save delivery details first so checkout can create the order correctly.";
    if (checkoutForm?.closest(".checkout-panel")) {
      checkoutForm.closest(".checkout-panel").hidden = true;
    }
    return;
  }

  deliveryStatus.textContent = `Delivery saved for ${delivery.customerName} in ${delivery.location}. Bahrain shipping fee: 2.5 BD.`;
  if (checkoutForm?.closest(".checkout-panel")) {
    checkoutForm.closest(".checkout-panel").hidden = false;
  }

  const checkoutNameInput = checkoutForm?.elements?.namedItem("checkoutName");
  const checkoutPhoneInput = checkoutForm?.elements?.namedItem("checkoutPhone");

  if (checkoutNameInput && !checkoutNameInput.value) {
    checkoutNameInput.value = delivery.customerName || "";
  }

  if (checkoutPhoneInput && !checkoutPhoneInput.value) {
    checkoutPhoneInput.value = delivery.phone || "";
  }
};

const renderCart = () => {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = cart.length ? subtotal * TAX_RATE : 0;
  const total = cart.length ? subtotal + SHIPPING_PRICE + tax : 0;

  if (cartCount) {
    cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
  }

  if (!cartItems || !cartEmpty || !cartSubtotal || !cartTotal) {
    renderCheckoutTotals();
    return;
  }

  cartSubtotal.textContent = `${subtotal.toFixed(1)} BD`;
  const cartTax = document.getElementById("cart-tax");
  if (cartTax) {
    cartTax.textContent = `${tax.toFixed(1)} BD`;
  }
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
    if (productStatus) {
      productStatus.textContent = "Please register or log in first before adding LEGENDS TEE to your cart.";
    }
    setAuthView("register");
    if (document.getElementById("account")) {
      document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigateTo("account.html");
    }
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
  if (productStatus) {
    productStatus.textContent = `LEGENDS TEE in ${selectedSize} was added to your cart.`;
  }
  renderCart();

  if (document.getElementById("cart")) {
    document.getElementById("cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    navigateTo("cart.html");
  }
};

const attachInputSanitizers = () => {
  const nameInputs = document.querySelectorAll('input[name="customerName"], input[name="checkoutName"]');
  const phoneInputs = document.querySelectorAll('input[name="phone"], input[name="checkoutPhone"]');

  nameInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.value = sanitizeNameInput(input.value);
    });
  });

  phoneInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.value = sanitizePhoneInput(input.value);
    });
  });
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

  if (cardFields) {
    cardFields.hidden = method !== "card";
  }
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
  authReady = false;

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
    if (checkoutStatus) {
      checkoutStatus.textContent = "Verifying your Stripe payment...";
    }

    try {
      const data = await apiRequest("/api/checkout/verify-session", {
        session_id: sessionId
      });

      if (data.success) {
        clearCheckoutState();
        renderCart();
        renderDeliveryState();
      }

      if (checkoutStatus) {
        checkoutStatus.textContent = data.success
          ? `Payment confirmed. Order ${data.orderId} is now marked as paid.`
          : `Payment returned with status ${data.status}. Please contact support if you were charged.`;
      }
    } catch (error) {
      if (checkoutStatus) {
        checkoutStatus.textContent = error.message;
      }
    }

    clearCheckoutQuery();
  } else if (checkoutState === "success") {
    clearCheckoutState();
    renderCart();
    renderDeliveryState();
    if (checkoutStatus) {
      checkoutStatus.textContent = "Payment completed successfully. Your order is ready for fulfillment.";
    }
    clearCheckoutQuery();
  } else if (checkoutState === "cancelled") {
    if (checkoutStatus) {
      checkoutStatus.textContent = "Checkout was cancelled. You can review your cart and try again.";
    }
    clearCheckoutQuery();
  }
};

const handleEmailVerificationReturn = async () => {
  if (isFilePreview) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (!tokenHash) {
    return;
  }

  accountMessage.textContent = "Confirming your email...";

  try {
    const data = await apiRequest("/api/auth/verify-email", {
      tokenHash,
      type
    });

    persistAuthState(data);
    clearPendingVerificationEmail();
    renderAccountState();
    accountMessage.textContent = data.welcomeEmailSent
      ? `Email confirmed. Welcome ${data.user.fullName || data.user.email}.`
      : `Email confirmed. Welcome ${data.user.fullName || data.user.email}. Your welcome email could not be sent yet.`;
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
  } catch (error) {
    accountMessage.textContent = error.message;
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
      redirectAfterAuthSuccess();
      return;
    }

    const data = await apiRequest("/api/auth/register", {
      fullName,
      email,
      password
    });

    if (data.session && data.user && !data.requiresEmailVerification) {
      persistAuthState(data);
      clearPendingVerificationEmail();
      registerForm.reset();
      renderAccountState();
      accountMessage.textContent = data.message || `Welcome ${data.user.fullName || data.user.email}.`;
      redirectAfterAuthSuccess();
      return;
    }

    clearAuthState();
    setPendingVerificationEmail(data.email || email);
    registerForm.reset();
    renderAccountState();
    accountMessage.textContent = data.message || "Check your email for the verification code.";
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
      clearPendingVerificationEmail();
      loginForm.reset();
      renderAccountState();
      accountMessage.textContent = `Logged in as ${user.fullName || user.email}.`;
      redirectAfterAuthSuccess();
      return;
    }

    const data = await apiRequest("/api/auth/login", {
      email,
      password
    });

    persistAuthState(data);
    clearPendingVerificationEmail();
    loginForm.reset();
    renderAccountState();
    await loadAdminOrders();
    accountMessage.textContent = `Logged in as ${data.user.fullName || data.user.email}.`;
    redirectAfterAuthSuccess();
  } catch (error) {
    accountMessage.textContent = error.message;
  }
});

verifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const pendingEmail = getPendingVerificationEmail();
  const formData = new FormData(verifyForm);
  const token = String(formData.get("token") || "").trim();

  if (!pendingEmail) {
    accountMessage.textContent = "Start with registration first so we know which email to confirm.";
    return;
  }

  accountMessage.textContent = "Confirming your email...";

  try {
    const data = await apiRequest("/api/auth/verify-email", {
      email: pendingEmail,
      token
    });

    persistAuthState(data);
    clearPendingVerificationEmail();
    verifyForm.reset();
    renderAccountState();
    await loadAdminOrders();
    accountMessage.textContent = data.welcomeEmailSent
      ? `Email confirmed. Welcome ${data.user.fullName || data.user.email}.`
      : `Email confirmed. Welcome ${data.user.fullName || data.user.email}. Your welcome email could not be sent yet.`;
    redirectAfterAuthSuccess();
  } catch (error) {
    accountMessage.textContent = error.message;
  }
});

resendCodeButton?.addEventListener("click", async () => {
  const pendingEmail = getPendingVerificationEmail();

  if (!pendingEmail) {
    accountMessage.textContent = "Start with registration first so we know which email to resend.";
    return;
  }

  accountMessage.textContent = "Resending verification code...";

  try {
    const data = await apiRequest("/api/auth/resend-verification", {
      email: pendingEmail
    });

    accountMessage.textContent = data.message || "Verification code resent. Check your inbox and spam folders.";
  } catch (error) {
    accountMessage.textContent = error.message || "Could not resend verification code.";
  }
});

changeEmailButton?.addEventListener("click", () => {
  clearPendingVerificationEmail();
  verifyForm?.reset();
  setAuthView("register");
  renderAccountState();
  accountMessage.textContent = "You can now register again with a different email address.";
});

verificationLogoutButton?.addEventListener("click", () => {
  clearAuthState();
  clearPendingVerificationEmail();
  verifyForm?.reset();
  setAuthView("register");
  renderAccountState();
  accountMessage.textContent = "You have been logged out. You can register or log in again.";
});

logoutButton?.addEventListener("click", async () => {
  if (isFilePreview) {
    clearDemoAuthState();
    clearPendingVerificationEmail();
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
  clearPendingVerificationEmail();
  isAdminUser = false;
  adminPanel.hidden = true;
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
    customerName: sanitizeNameInput(formData.get("customerName")),
    phone: sanitizePhoneInput(formData.get("phone")),
    location: String(formData.get("location") || "").trim(),
    size: String(formData.get("size") || "").trim(),
    address: String(formData.get("address") || "").trim()
  };

  if (!delivery.customerName) {
    orderStatus.textContent = "Please enter a name using letters only.";
    return;
  }

  if (!delivery.phone) {
    orderStatus.textContent = "Please enter a phone number using numbers only.";
    return;
  }

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
  if (document.getElementById("checkout")) {
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    navigateTo("checkout.html");
  }
});

checkoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!authReady) {
    checkoutStatus.textContent = "Restoring your session...";
    await restoreAuthSession();
  }

  const account = getAccount();
  const cart = getCart();
  const delivery = getDelivery();

  if (!account) {
    checkoutStatus.textContent = "Please register or log in before continuing to payment.";
    setAuthView("register");
    if (document.getElementById("account")) {
      document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigateTo("account.html");
    }
    return;
  }

  if (!cart.length) {
    checkoutStatus.textContent = "Add LEGENDS TEE to your cart before continuing to payment.";
    if (document.getElementById("drops")) {
      document.getElementById("drops")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigateTo("legends-tee.html");
    }
    return;
  }

  if (!delivery?.customerName || !delivery?.phone || !delivery?.location || !delivery?.address) {
    checkoutStatus.textContent = "Please save delivery details first before continuing to payment.";
    if (document.getElementById("order-product")) {
      document.getElementById("order-product")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }

  const formData = new FormData(checkoutForm);
  const checkoutName = sanitizeNameInput(formData.get("checkoutName") || account.fullName || "");
  const checkoutPhone = sanitizePhoneInput(formData.get("checkoutPhone") || delivery.phone || "");

  if (!checkoutName) {
    checkoutStatus.textContent = "Please enter a valid order name using letters only.";
    return;
  }

  if (!checkoutPhone) {
    checkoutStatus.textContent = "Please enter a valid phone number using numbers only.";
    return;
  }

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

      checkoutStatus.textContent = `Cash on delivery selected. Order ${data.orderId} was created and is waiting for confirmation. Total due on delivery: ${checkoutTotal.textContent}.`;
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

const initializeApp = async () => {
  attachInputSanitizers();
  setAuthView("register");
  setPaymentMethod("cod");
  renderCart();
  renderDeliveryState();
  await handleEmailVerificationReturn();
  await handleCheckoutReturnState();
  await restoreAuthSession();
  await loadAdminOrders();
};

initializeApp();
