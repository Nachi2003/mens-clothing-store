import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { addToCart } from "../services/cartService";
import { addToBackendCart } from "../services/backendCartService";

import type { Product } from "../types/Product";
import type { ProductVariant } from "../types/ProductVariant";

interface ProductImage {
  imageId: number;
  imageUrl: string;
  primary: boolean;
  color: string | null;
}

interface InventoryResponse {
  inventoryId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  updatedAt: string;
}

// Convert relative image paths to complete backend URLs
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `http://localhost:8080${imageUrl}`;
};

// Compare stored colour names consistently (e.g. "Navy Blue" and "navy blue").
const normalizeColorName = (color: string | null | undefined) =>
  (color ?? "").trim().toLocaleLowerCase();

function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] =
    useState<ProductImage | null>(null);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [stockQuantity, setStockQuantity] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVariantStock = async (variantId: number) => {
    try {
      const response = await axios.get<InventoryResponse>(
        `http://localhost:8080/api/inventory/variant/${variantId}`
      );

      const availableStock = response.data.quantity ?? 0;

      setStockQuantity(availableStock);

      setQuantity((currentQuantity) => {
        if (availableStock <= 0) {
          return 1;
        }

        return Math.min(currentQuantity, availableStock);
      });
    } catch (inventoryError) {
      console.error("Failed to load inventory:", inventoryError);
      setStockQuantity(0);
      setQuantity(1);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const [productResponse, variantsResponse, imagesResponse] =
          await Promise.all([
            axios.get<Product>(
              `http://localhost:8080/api/products/${productId}`
            ),

            axios.get<ProductVariant[]>(
              "http://localhost:8080/api/product-variants"
            ),

            axios.get<ProductImage[]>(
              `http://localhost:8080/api/products/${productId}/images`
            ),
          ]);

        const productVariants = variantsResponse.data.filter(
          (variant) =>
            variant.productId === Number(productId) && variant.active
        );

        const productImages = imagesResponse.data;

        setProduct(productResponse.data);
        setVariants(productVariants);
        setImages(productImages);

        const primaryImage =
          productImages.find((image) => image.primary) ??
          productImages[0] ??
          null;

        setSelectedImage(primaryImage);

        if (productVariants.length > 0) {
          const firstVariant = productVariants[0];

          setSelectedVariant(firstVariant);

          try {
            const inventoryResponse = await axios.get<InventoryResponse>(
              `http://localhost:8080/api/inventory/variant/${firstVariant.variantId}`
            );

            setStockQuantity(inventoryResponse.data.quantity ?? 0);
          } catch (inventoryError) {
            console.error("Failed to load inventory:", inventoryError);
            setStockQuantity(0);
          }
        } else {
          setSelectedVariant(null);
          setStockQuantity(0);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // When a colour is selected, switch the main image to that colour's
  // primary image (or first image) and keep thumbnails limited to that colour.
  useEffect(() => {
    if (!selectedVariant || images.length === 0) return;

    const selectedColorKey = normalizeColorName(selectedVariant.color);
    const colorImages = images.filter(
      (image) => normalizeColorName(image.color) === selectedColorKey
    );

    const unassignedImages = images.filter(
      (image) => !normalizeColorName(image.color)
    );

    const nextImage =
      colorImages.find((image) => image.primary) ??
      colorImages[0] ??
      unassignedImages.find((image) => image.primary) ??
      unassignedImages[0] ??
      images.find((image) => image.primary) ??
      images[0];

    setSelectedImage(nextImage ?? null);
  }, [images, selectedVariant?.color]);

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) => {
      if (stockQuantity <= 0) {
        return 1;
      }

      return Math.min(currentQuantity + 1, stockQuantity);
    });
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !product) {
      alert("Please select a size and color.");
      return;
    }

    if (stockQuantity <= 0) {
      alert("This variant is currently out of stock.");
      return;
    }

    if (quantity > stockQuantity) {
      alert(
        `Only ${stockQuantity} item${
          stockQuantity === 1 ? "" : "s"
        } available.`
      );
      setQuantity(stockQuantity);
      return;
    }

    try {
      // First, save the item to the backend
      await addToBackendCart(selectedVariant.variantId, quantity);

      // Then update the local cart for the UI
      addToCart({
        productId: product.productId,
        variantId: selectedVariant.variantId,
        productName: product.productName,
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.price,
        quantity: quantity,
        imageUrl: selectedImage
          ? getFullImageUrl(selectedImage.imageUrl)
          : "",
      });

      alert("Product added to cart successfully!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add product to cart.";

      alert(message);
    }
  };

  const handleBuyNow = () => {
    if (!selectedVariant || !product) {
      alert("Please select a size and color.");
      return;
    }

    if (stockQuantity <= 0) {
      alert("This variant is currently out of stock.");
      return;
    }

    if (quantity > stockQuantity) {
      alert(
        `Only ${stockQuantity} item${
          stockQuantity === 1 ? "" : "s"
        } available.`
      );
      setQuantity(stockQuantity);
      return;
    }

    // Store only the temporary Buy Now selection. Do not add it to either cart.
    const buyNowItem = {
      productId: product.productId,
      variantId: selectedVariant.variantId,
      productName: product.productName,
      size: selectedVariant.size,
      color: selectedVariant.color,
      price: selectedVariant.price,
      quantity,
      imageUrl: selectedImage
        ? getFullImageUrl(selectedImage.imageUrl)
        : "",
    };

    sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
    navigate("/checkout?mode=buy-now");
  };

  if (loading) {
    return (
      <main className="product-page">
        <div className="product-page-message">Loading product...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-page">
        <div className="product-page-message">{error}</div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-page">
        <div className="product-page-message">
          Product not found.
        </div>
      </main>
    );
  }

  const colors = Array.from(
    new Set(variants.map((variant) => variant.color))
  );

  const sizes = Array.from(
    new Set(variants.map((variant) => variant.size))
  );

  const selectedColorKey = normalizeColorName(selectedVariant?.color);
  const selectedColorImages = images.filter(
    (image) => normalizeColorName(image.color) === selectedColorKey && selectedColorKey.length > 0
  );
  const unassignedImages = images.filter(
    (image) => !normalizeColorName(image.color)
  );
  // Prefer images explicitly assigned to the selected colour. If none exist,
  // use unassigned images as a backward-compatible fallback for older products.
  const visibleImages = selectedColorImages.length > 0
    ? selectedColorImages
    : unassignedImages.length > 0
      ? unassignedImages
      : images;

  return (
    <main className="product-page">
      <section className="product-main">
        {/* Image Gallery */}
        <div className="product-gallery">
          {visibleImages.length > 1 && (
            <div className="product-thumbnails">
              {visibleImages.map((image) => (
                <button
                  key={image.imageId}
                  type="button"
                  className={
                    selectedImage?.imageId === image.imageId
                      ? "thumbnail active"
                      : "thumbnail"
                  }
                  onClick={() => setSelectedImage(image)}
                  aria-label="View product image"
                >
                  <img
                    src={getFullImageUrl(image.imageUrl)}
                    alt={product.productName}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="product-main-image">
            {selectedImage ? (
              <img
                src={getFullImageUrl(selectedImage.imageUrl)}
                alt={product.productName}
              />
            ) : (
              <span>PRODUCT IMAGE</span>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="product-info">
          <p className="product-category">
            {product.categoryName}
          </p>

          <h1>{product.productName}</h1>

          <div className="product-rating">
            <span>☆ ☆ ☆ ☆ ☆</span>
            <span> (No Reviews)</span>
          </div>

          <div className="product-price">
            ₹{selectedVariant?.price ?? 0}
          </div>

          <div className="product-divider" />

          {/* Description */}
          <p className="product-description">
            {product.description}
          </p>

          {/* Color */}
          <div className="product-option">
            <div className="option-header">
              <span>COLOR</span>

              {selectedVariant && (
                <strong>{selectedVariant.color}</strong>
              )}
            </div>

            <div className="color-options color-image-options">
              {colors.map((color) => {
                const colorVariant = variants.find(
                  (variant) => normalizeColorName(variant.color) === normalizeColorName(color)
                );
                const colorKey = normalizeColorName(color);
                const imageForColor =
                  images.find((image) => normalizeColorName(image.color) === colorKey && image.primary) ??
                  images.find((image) => normalizeColorName(image.color) === colorKey) ??
                  images.find((image) => !normalizeColorName(image.color) && image.primary) ??
                  images.find((image) => !normalizeColorName(image.color)) ??
                  images.find((image) => image.primary) ??
                  images[0];

                return (
                  <button
                    key={color}
                    type="button"
                    className={
                      normalizeColorName(selectedVariant?.color) === colorKey
                        ? "color-image-button selected"
                        : "color-image-button"
                    }
                    onClick={() => {
                      if (colorVariant) {
                        setSelectedVariant(colorVariant);
                        setQuantity(1);
                        loadVariantStock(colorVariant.variantId);
                        const matchingImages = images.filter(
                          (image) => normalizeColorName(image.color) === colorKey
                        );
                        const nextImage =
                          matchingImages.find((image) => image.primary) ??
                          matchingImages[0] ??
                          images.find((image) => !normalizeColorName(image.color) && image.primary) ??
                          images.find((image) => !normalizeColorName(image.color)) ??
                          imageForColor ??
                          null;
                        setSelectedImage(nextImage);
                      }
                    }}
                    aria-label={`Select ${color}`}
                    title={color}
                    aria-pressed={normalizeColorName(selectedVariant?.color) === colorKey}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      width: 88,
                      padding: 5,
                      border: normalizeColorName(selectedVariant?.color) === colorKey
                        ? "2px solid #111827"
                        : "1px solid #d1d5db",
                      borderRadius: 8,
                      background: "#ffffff",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {imageForColor ? (
                      <img
                        src={getFullImageUrl(imageForColor.imageUrl)}
                        alt={`${color} ${product.productName}`}
                        className="color-option-image"
                        style={{
                          display: "block",
                          width: "100%",
                          height: 96,
                          objectFit: "cover",
                          borderRadius: 5,
                          background: "#f3f4f6",
                        }}
                      />
                    ) : (
                      <span
                        className="color-option-image-placeholder"
                        aria-hidden="true"
                        style={{
                          display: "flex",
                          width: "100%",
                          height: 96,
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f3f4f6",
                          borderRadius: 5,
                        }}
                      >
                        {color.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span
                      className="color-option-label"
                      style={{ fontSize: 12, textAlign: "center", lineHeight: 1.2 }}
                    >
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div className="product-option">
            <div className="option-header">
              <span>SELECT SIZE</span>

              <button
                type="button"
                className="size-guide"
              >
                Size Guide
              </button>
            </div>

            <div className="size-options">
              {sizes.map((size) => {
                const sizeVariant = variants.find(
                  (variant) =>
                    variant.size === size &&
                    variant.color === selectedVariant?.color
                );

                return (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedVariant?.size === size
                        ? "size-button selected"
                        : "size-button"
                    }
                    disabled={!sizeVariant}
                    onClick={() => {
                      if (sizeVariant) {
                        setSelectedVariant(sizeVariant);
                        setQuantity(1);
                        loadVariantStock(sizeVariant.variantId);
                      }
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Status */}
          <div className="product-stock-status">
            {stockQuantity <= 0 ? (
              <span className="out-of-stock">Out of Stock</span>
            ) : stockQuantity < 10 ? (
              <span className="low-stock">
                Only {stockQuantity} left in stock
              </span>
            ) : (
              <span className="in-stock">In Stock</span>
            )}
          </div>

          {/* Quantity + Cart */}
          <div className="purchase-row">
            <div className="quantity-selector">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={stockQuantity <= 0}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  stockQuantity <= 0 ||
                  quantity >= stockQuantity
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={stockQuantity <= 0}
            >
              {stockQuantity <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
            </button>

            <button
              type="button"
              className="buy-now-button"
              onClick={handleBuyNow}
              disabled={stockQuantity <= 0}
            >
              {stockQuantity <= 0 ? "OUT OF STOCK" : "BUY NOW"}
            </button>
          </div>

          {/* Information Accordions */}
          <div className="product-accordions">
            <details>
              <summary>Fabric & Care Instructions</summary>
              <p>
                Dry clean recommended or machine wash with cold water.
                Follow the care label provided with the product.
              </p>
            </details>

            <details>
              <summary>Complementary Tailoring</summary>
              <p>
                Tailoring and alteration services can be added later.
              </p>
            </details>

            <details>
              <summary>Complimentary Shipping & Returns</summary>
              <p>
                Shipping and return information will be available here.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductDetailsPage;
