export interface CartItem {
  productId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

const CART_KEY = "latelier_cart";

// Notify the app whenever the cart changes
const notifyCartUpdate = () => {
  window.dispatchEvent(new Event("cartUpdated"));
};

// Get all cart items
export const getCartItems = (): CartItem[] => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

// Add item to cart
export const addToCart = (newItem: CartItem): CartItem[] => {
  const cart = getCartItems();

  const existingItem = cart.find(
    (item) => item.variantId === newItem.variantId
  );

  if (existingItem) {
    existingItem.quantity += newItem.quantity;
  } else {
    cart.push(newItem);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notifyCartUpdate();

  return cart;
};

// Remove item from cart
export const removeFromCart = (variantId: number): CartItem[] => {
  const updatedCart = getCartItems().filter(
    (item) => item.variantId !== variantId
  );

  localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
  notifyCartUpdate();

  return updatedCart;
};

// Update item quantity
export const updateCartQuantity = (
  variantId: number,
  quantity: number
): CartItem[] => {
  const cart = getCartItems();

  const item = cart.find((item) => item.variantId === variantId);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(variantId);
    }

    item.quantity = quantity;
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notifyCartUpdate();

  return cart;
};

// Clear cart
export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
  notifyCartUpdate();
};

// Calculate cart total
export const getCartTotal = (): number => {
  return getCartItems().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

// Get total number of items in cart
export const getCartItemCount = (): number => {
  return getCartItems().reduce(
    (total, item) => total + item.quantity,
    0
  );
};