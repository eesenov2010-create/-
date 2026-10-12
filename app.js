"use strict";

const keys = {
  profile: "quicklunch-profile",
  cart: "quicklunch-cart",
  order: "quicklunch-last-order",
  returnTo: "quicklunch-return-to",
  chat: "quicklunch-chat",
  cartNotice: "quicklunch-cart-notice"
};

const preparedMeals = new Map([
  ["meal-fish-salmon", { name: "Жареное филе лосося без костей", category: "Рыбные блюда", unit: "порц." }],
  ["meal-fish-zander", { name: "Филе судака без костей", category: "Рыбные блюда", unit: "порц." }],
  ["meal-fish-pollock", { name: "Запечённое филе минтая", category: "Рыбные блюда", unit: "порц." }],
  ["meal-fish-cakes", { name: "Рыбные котлеты", category: "Рыбные блюда", unit: "порц." }],
  ["meal-fish-cod", { name: "Запечённое филе трески", category: "Рыбные блюда", unit: "порц." }],
  ["meal-meat-cutlets", { name: "Говяжьи котлеты", category: "Мясные блюда", unit: "порц." }],
  ["meal-meat-goulash", { name: "Гуляш из говядины", category: "Мясные блюда", unit: "порц." }],
  ["meal-meat-meatballs", { name: "Мясные тефтели", category: "Мясные блюда", unit: "порц." }],
  ["meal-meat-stew", { name: "Тушёная говядина", category: "Мясные блюда", unit: "порц." }],
  ["meal-poultry-grill", { name: "Куриное филе на гриле", category: "Блюда из птицы", unit: "порц." }],
  ["meal-poultry-cutlets", { name: "Куриные котлеты", category: "Блюда из птицы", unit: "порц." }],
  ["meal-poultry-thigh", { name: "Запечённое куриное бедро", category: "Блюда из птицы", unit: "порц." }],
  ["meal-poultry-vegetables", { name: "Курица с овощами", category: "Блюда из птицы", unit: "порц." }],
  ["meal-side-mash", { name: "Картофельное пюре", category: "Гарниры", unit: "порц." }],
  ["meal-side-rice", { name: "Отварной рис", category: "Гарниры", unit: "порц." }],
  ["meal-side-buckwheat", { name: "Гречка", category: "Гарниры", unit: "порц." }],
  ["meal-side-pasta", { name: "Макароны с маслом", category: "Гарниры", unit: "порц." }],
  ["meal-side-ragout", { name: "Овощное рагу", category: "Гарниры", unit: "порц." }],
  ["meal-soup-chicken", { name: "Куриный суп", category: "Супы", unit: "порц." }],
  ["meal-soup-borscht", { name: "Борщ", category: "Супы", unit: "порц." }],
  ["meal-soup-meatballs", { name: "Суп с фрикадельками", category: "Супы", unit: "порц." }],
  ["meal-soup-vegetable", { name: "Овощной суп", category: "Супы", unit: "порц." }],
  ["meal-salad-fresh", { name: "Салат из свежих овощей", category: "Салаты и овощные блюда", unit: "порц." }],
  ["meal-salad-vinaigrette", { name: "Винегрет", category: "Салаты и овощные блюда", unit: "порц." }],
  ["meal-salad-carrot", { name: "Морковный салат", category: "Салаты и овощные блюда", unit: "порц." }],
  ["meal-salad-vegetables", { name: "Тушёные овощи", category: "Салаты и овощные блюда", unit: "порц." }],
  ["meal-dessert-bun", { name: "Булочка", category: "Выпечка и десерты", unit: "шт." }],
  ["meal-dessert-pirozhok", { name: "Пирожок", category: "Выпечка и десерты", unit: "шт." }],
  ["meal-dessert-syrniki", { name: "Сырники", category: "Выпечка и десерты", unit: "порц." }],
  ["meal-dessert-casserole", { name: "Творожная запеканка", category: "Выпечка и десерты", unit: "порц." }]
]);

function readSession(key, fallback) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function writeCart(cart) {
  const serialized = JSON.stringify(cart);
  try {
    localStorage.setItem(keys.cart, serialized);
    try {
      sessionStorage.removeItem(keys.cart);
    } catch {
      return;
    }
  } catch {
    sessionStorage.setItem(keys.cart, serialized);
  }
}

function readCart() {
  let serialized = null;
  try {
    serialized = localStorage.getItem(keys.cart);
  } catch {
    serialized = null;
  }

  if (serialized === null) {
    try {
      serialized = sessionStorage.getItem(keys.cart);
    } catch {
      serialized = null;
    }
  }

  let savedItems = [];
  try {
    const parsed = serialized ? JSON.parse(serialized) : [];
    if (Array.isArray(parsed)) savedItems = parsed;
  } catch {
    savedItems = [];
  }

  const mergedItems = new Map();
  let removedLegacyItems = false;
  for (const savedItem of savedItems) {
    const meal = preparedMeals.get(savedItem?.id);
    const quantity = Number(savedItem?.quantity);
    if (!meal || !Number.isFinite(quantity) || quantity <= 0) {
      removedLegacyItems = true;
      continue;
    }

    const current = mergedItems.get(savedItem.id);
    if (current) current.quantity += quantity;
    else mergedItems.set(savedItem.id, { id: savedItem.id, ...meal, quantity });
  }

  const cart = [...mergedItems.values()];
  writeCart(cart);
  if (removedLegacyItems) sessionStorage.setItem(keys.cartNotice, "1");
  return cart;
}

function clearCart() {
  try {
    localStorage.removeItem(keys.cart);
  } catch {
    sessionStorage.removeItem(keys.cart);
  }
  sessionStorage.removeItem(keys.cart);
}

function formatCartCount(count) {
  const lastTwo = count % 100;
  const lastDigit = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} блюд`;
  if (lastDigit === 1) return `${count} блюдо`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} блюда`;
  return `${count} блюд`;
}

function getProfile() {
  return readSession(keys.profile, null);
}

function showWelcomeDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "welcome-dialog";
  dialog.setAttribute("aria-labelledby", "welcome-heading");

  const form = document.createElement("form");
  form.innerHTML = `
    <p class="eyebrow">QuickLunch</p>
    <h2 id="welcome-heading">Добро пожаловать</h2>
    <p>Введите имя, чтобы перейти к демонстрационному профилю.</p>
    <label for="welcome-name">Ваше имя</label>
    <input id="welcome-name" name="name" type="text" maxlength="70" autocomplete="name" required>
    <button type="submit">Продолжить</button>
  `;
  dialog.append(form);
  document.body.append(dialog);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const name = new FormData(form).get("name").trim();
    if (!name) return;
    writeSession(keys.profile, { name, email: "" });
    window.location.assign("profile.html");
  });

  dialog.showModal();
  form.elements.name.focus();
}

function rememberReturnPage() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="products-"]');
    if (link) {
      writeSession(keys.returnTo, `${window.location.pathname}${window.location.search}${window.location.hash}`);
    }

    const backLink = event.target.closest("[data-back]");
    if (!backLink) return;

    const previous = readSession(keys.returnTo, "");
    const previousPath = previous.split(/[?#]/, 1)[0];
    const safePath = /(?:^|\/)(?:index|catalog)\.html$/;
    if (safePath.test(previousPath)) {
      event.preventDefault();
      window.location.assign(previous);
    }
  });
}

function renderCartList(list, items, removable) {
  list.replaceChildren();
  for (const item of items) {
    const row = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${item.name} — ${item.quantity} ${item.unit} (${item.category})`;
    row.append(description);

    if (removable) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-cart-item";
      remove.dataset.removeId = item.id;
      remove.textContent = "Убрать";
      remove.setAttribute("aria-label", `Убрать из корзины: ${item.name}`);
      row.append(remove);
    }

    list.append(row);
  }
}

function setupCategorySelection() {
  const form = document.querySelector("[data-product-form]");
  if (!form) return;

  const error = form.querySelector("[data-product-error]");
  const panel = document.querySelector("[data-cart-panel]");
  const cartList = panel.querySelector("[data-cart-items]");
  const cartStatus = panel.querySelector("[data-cart-status]");

  form.querySelectorAll("[data-product-name]").forEach((choice) => {
    choice.addEventListener("change", () => {
      const option = choice.closest(".product-option");
      const quantity = option.querySelector("[data-quantity]");
      option.classList.toggle("is-selected", choice.checked);
      quantity.disabled = !choice.checked;
      quantity.required = choice.checked;
      if (!choice.checked) quantity.value = "";
      error.textContent = "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = [...form.querySelectorAll("[data-product-name]:checked")];
    if (!selected.length) {
      error.textContent = "Выберите хотя бы одно блюдо.";
      form.querySelector("[data-product-name]").focus();
      return;
    }

    const additions = [];
    for (const choice of selected) {
      const quantityField = choice.closest(".product-option").querySelector("[data-quantity]");
      if (!quantityField.reportValidity()) return;
      additions.push({
        id: choice.value,
        category: form.dataset.category,
        name: choice.dataset.productName,
        quantity: Number(quantityField.value),
        unit: choice.dataset.unit
      });
    }

    const cart = readCart();
    for (const addition of additions) {
      const existing = cart.find((item) => item.id === addition.id);
      if (existing) existing.quantity += addition.quantity;
      else cart.push({ id: addition.id, ...preparedMeals.get(addition.id), quantity: addition.quantity });
    }
    writeCart(cart);
    renderCartList(cartList, cart, true);
    cartStatus.textContent = `В корзине ${formatCartCount(cart.length)}. Повторное добавление блюда увеличивает количество порций.`;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    error.textContent = "Выбранные блюда добавлены. Повторное добавление суммирует количество порций.";
  });

  panel.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-cart]")) {
      panel.hidden = true;
      return;
    }

    const removeButton = event.target.closest("[data-remove-id]");
    if (!removeButton) return;
    const cart = readCart().filter((item) => item.id !== removeButton.dataset.removeId);
    writeCart(cart);
    renderCartList(cartList, cart, true);
    cartStatus.textContent = cart.length ? `В корзине ${formatCartCount(cart.length)}.` : "Корзина пуста.";
  });
}

function setupOrderForm() {
  const form = document.querySelector("#order-form");
  if (!form) return;

  const list = document.querySelector("[data-order-items]");
  const emptyNotice = document.querySelector("[data-order-empty]");
  const error = document.querySelector("[data-order-error]");
  const cart = readCart();
  renderCartList(list, cart, false);
  emptyNotice.hidden = cart.length > 0;
  if (sessionStorage.getItem(keys.cartNotice)) {
    error.textContent = "Старые позиции сырья удалены из корзины, так как каталог теперь содержит готовые блюда. Проверьте выбранные блюда.";
    sessionStorage.removeItem(keys.cartNotice);
  }

  const profile = getProfile();
  if (profile) {
    form.elements.contact_name.value = profile.name || "";
    form.elements.contact_email.value = profile.email || "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentCart = readCart();
    if (!currentCart.length) {
      error.textContent = "Корзина пуста. Выберите готовые блюда перед отправкой заявки.";
      emptyNotice.hidden = false;
      emptyNotice.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!form.reportValidity()) return;
    const order = Object.fromEntries(new FormData(form).entries());
    writeSession(keys.order, { ...order, items: currentCart, createdAt: new Date().toISOString() });
    clearCart();
    window.location.assign("success.html");
  });
}

function setupProfile() {
  const profileForm = document.querySelector("[data-profile-form]");
  if (profileForm) {
    const profile = getProfile() || { name: "", email: "" };
    profileForm.elements.profile_name.value = profile.name;
    profileForm.elements.profile_email.value = profile.email;

    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;
      const values = new FormData(profileForm);
      writeSession(keys.profile, {
        name: values.get("profile_name").trim(),
        email: values.get("profile_email").trim()
      });
      profileForm.querySelector("[data-profile-status]").textContent = "Данные сохранены в этой вкладке. Это не полноценная учётная запись.";
    });
  }

  const chatForm = document.querySelector("[data-chat-form]");
  const chatList = document.querySelector("[data-chat-messages]");
  if (!chatForm || !chatList) return;

  const renderMessages = () => {
    chatList.replaceChildren();
    for (const message of readSession(keys.chat, [])) {
      const row = document.createElement("li");
      row.textContent = message;
      chatList.append(row);
    }
  };
  renderMessages();

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!chatForm.reportValidity()) return;
    const field = chatForm.elements.chat_message;
    const message = field.value.trim();
    if (!message) return;
    const messages = readSession(keys.chat, []);
    messages.push(`Вы: ${message}`);
    writeSession(keys.chat, messages.slice(-50));
    field.value = "";
    renderMessages();
  });
}

function setupSuccessPage() {
  const success = document.querySelector("[data-success-panel]");
  if (!success) return;
  const order = readSession(keys.order, null);
  const empty = document.querySelector("[data-success-empty]");
  success.hidden = !order;
  empty.hidden = Boolean(order);
}

document.addEventListener("DOMContentLoaded", () => {
  rememberReturnPage();
  setupCategorySelection();
  setupOrderForm();
  setupProfile();
  setupSuccessPage();

  const currentPage = window.location.pathname.split("/").pop();
  if (!getProfile() && currentPage !== "profile.html" && currentPage !== "success.html") {
    showWelcomeDialog();
  }
});