import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { addToCart } from "../services/cartService";
import type { Product } from "../types/Product";
import type { ProductVariant } from "../types/ProductVariant";

interface ProductImage {
  imageId: number;
  imageUrl: string;
  primary: boolean;
}

// Convert relative image paths to complete backend URLs
const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return "";

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `http://localhost:8080${imageUrl}`;
};

function ProductDetailsPage() {
  const { productId } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] =
    useState<ProductImage | null>(null);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setSelectedVariant(productVariants[0]);
        } else {
          setSelectedVariant(null);
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

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };
const handleAddToCart = () => {
  if (!selectedVariant || !product) {
    alert("Please select a size and color.");
    return;
  }

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
};

  const increaseQuantity = () => {
    setQuantity((current) => current + 1);
  };

  if (loading) {
    return (
      <main className="product-page">
        <div className="product-page-message">
          Loading product...
        </div>
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

  return (
    <main className="product-page">
      <section className="product-main">
        {/* Image Gallery */}

        <div className="product-gallery">
          {images.length > 1 && (
            <div className="product-thumbnails">
              {images.map((image) => (
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

            <div className="color-options">
              {colors.map((color) => {
                const colorVariant = variants.find(
                  (variant) => variant.color === color
                );

                return (
                  <button
                    key={color}
                    type="button"
                    className={
                      selectedVariant?.color === color
                        ? "color-button selected"
                        : "color-button"
                    }
                    onClick={() => {
                      if (colorVariant) {
                        setSelectedVariant(colorVariant);
                      }
                    }}
                    aria-label={color}
                    title={color}
                  >
                    <span
                      className={`color-circle color-${color
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}

          <div className="product-option">
            <div className="option-header">
              <span>SELECT SIZE</span>

              <button type="button" className="size-guide">
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
                      }
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity + Cart */}

          <div className="purchase-row">
            <div className="quantity-selector">
              <button
                type="button"
                onClick={decreaseQuantity}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
              >
                +
              </button>
            </div>

            <button
  type="button"
  className="add-to-cart-button"
  onClick={handleAddToCart}
>
  ADD TO CART
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