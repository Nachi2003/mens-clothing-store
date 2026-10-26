import { useEffect, useState } from "react";
import { getInventoryByVariantId } from "../services/inventoryService";
import type { Inventory } from "../services/inventoryService";

interface Product {
  productId: number;
  productName: string;
  categoryName: string;
  description?: string;
}

interface ProductImage {
  imageId?: number;
  imageUrl?: string;
  image_url?: string;
  primary?: boolean;
  isPrimary?: boolean;
  is_primary?: boolean;
}

interface ProductVariant {
  variantId: number;
  productId: number;
  productName: string;
  size: string;
  color: string;
  price: number;
  active: boolean;
}

interface Category {
  name: string;
  slug: string;
}

interface TrendingProduct {
  product: Product;
  imageUrl: string;
  color: string;
  price: number;
}

const categories: Category[] = [
  { name: "Shirts", slug: "shirts" },
  { name: "T-Shirts", slug: "t-shirts" },
  { name: "Trousers", slug: "trousers" },
  { name: "Jeans", slug: "jeans" },
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function normalizeImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE_URL}${imageUrl}`;
}

function HomePage() {
  const [categoryImages, setCategoryImages] = useState<
    Record<string, string>
  >({});

  const [trendingProducts, setTrendingProducts] = useState<
    TrendingProduct[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        // Products and variants are public browsing data. Do not make
        // homepage images depend on the admin-only inventory list endpoint.
        const [productResponse, variantResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products`),
          fetch(`${API_BASE_URL}/api/product-variants`),
        ]);

        if (!productResponse.ok) {
          throw new Error(`Failed to fetch products (${productResponse.status})`);
        }
        if (!variantResponse.ok) {
          throw new Error(
            `Failed to fetch product variants (${variantResponse.status})`
          );
        }

        const [products, variants]: [Product[], ProductVariant[]] =
          await Promise.all([
            productResponse.json(),
            variantResponse.json(),
          ]);

        // Retrieve images independently, so inventory errors cannot hide them.
        const imageEntries = await Promise.all(
          products.map(async (product) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/products/${product.productId}/images`
              );

              if (!response.ok) {
                console.error(
                  `Image request failed for product ${product.productId}: ${response.status}`
                );
                return [product.productId, ""] as const;
              }

              const images: ProductImage[] = await response.json();
              if (!Array.isArray(images) || images.length === 0) {
                return [product.productId, ""] as const;
              }

              const selectedImage =
                images.find(
                  (image) =>
                    image.primary || image.isPrimary || image.is_primary
                ) ?? images[0];

              const rawImageUrl =
                selectedImage.imageUrl || selectedImage.image_url || "";

              return [
                product.productId,
                rawImageUrl ? normalizeImageUrl(rawImageUrl) : "",
              ] as const;
            } catch (error) {
              console.error(
                `Failed to load image for product ${product.productId}:`,
                error
              );
              return [product.productId, ""] as const;
            }
          })
        );

        const imagesByProduct = new Map<number, string>(imageEntries);

        // The per-variant stock endpoint is already public in SecurityConfig.
        // If a stock lookup fails, keep loading the homepage rather than
        // preventing category and product images from rendering.
        const activeVariants = variants.filter((variant) => variant.active);
        const stockResults = await Promise.all(
          activeVariants.map(async (variant) => {
            try {
              const item: Inventory = await getInventoryByVariantId(
                variant.variantId
              );
              return {
                variantId: variant.variantId,
                quantity: Number(item.quantity) || 0,
              };
            } catch (error) {
              console.warn(
                `Could not load stock for variant ${variant.variantId}:`,
                error
              );
              return null;
            }
          })
        );

        const validStockResults = stockResults.filter(
          (item): item is { variantId: number; quantity: number } =>
            item !== null
        );

        const stockByVariant = new Map<number, number>(
          validStockResults.map((item) => [item.variantId, item.quantity])
        );

        const inStockProducts =
          validStockResults.length > 0
            ? products.filter((product) =>
                activeVariants.some(
                  (variant) =>
                    variant.productId === product.productId &&
                    (stockByVariant.get(variant.variantId) ?? 0) > 0
                )
              )
            : products;

        // Category cards use images uploaded for products in that category.
        // If stock is unavailable, use the product catalog as the image source.
        const categorySourceProducts =
          inStockProducts.length > 0 ? inStockProducts : products;
        const imageMap: Record<string, string> = {};

        categories.forEach((category) => {
          const matchingProducts = categorySourceProducts.filter((product) => {
            const productCategory = (product.categoryName ?? "")
              .trim()
              .toLowerCase()
              .replace(/[\\s_-]+/g, "");

            const targetCategory = category.name
              .trim()
              .toLowerCase()
              .replace(/[\\s_-]+/g, "");

            if (targetCategory === "tshirts") {
              return ["tshirt", "tshirts", "tee", "tees"].includes(
                productCategory
              );
            }

            return (
              productCategory === targetCategory ||
              productCategory ===
                category.slug.toLowerCase().replace(/[\\s_-]+/g, "")
            );
          });

          // Prefer a product with an image, instead of randomly selecting one
          // whose image list is empty.
          const selectedProduct = matchingProducts.find(
            (product) => Boolean(imagesByProduct.get(product.productId))
          );

          if (selectedProduct) {
            imageMap[category.slug] =
              imagesByProduct.get(selectedProduct.productId) ?? "";
          }
        });

        // Trending products use in-stock products when stock data is available.
        const productsToShow = (inStockProducts.length > 0
          ? inStockProducts
          : products
        ).slice(0, 4);

        const trendingResults: TrendingProduct[] = productsToShow
          .map((product) => {
            const productVariants = activeVariants.filter(
              (variant) => variant.productId === product.productId
            );

            if (productVariants.length === 0) {
              return null;
            }

            const prices = productVariants
              .map((variant) => Number(variant.price))
              .filter((price) => Number.isFinite(price));

            if (prices.length === 0) {
              return null;
            }

            return {
              product,
              imageUrl: imagesByProduct.get(product.productId) ?? "",
              color: productVariants[0].color,
              price: Math.min(...prices),
            };
          })
          .filter((item): item is TrendingProduct => item !== null);

        if (!cancelled) {
          setCategoryImages(imageMap);
          setTrendingProducts(trendingResults);
        }
      } catch (error) {
        console.error("Failed to load homepage data:", error);
      }
    }

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="home-page">
      {/* ==========================================
          HERO SECTION
          ========================================== */}

      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">
            UNIQUE ZONE · THE FASHION GARAGE
          </p>

          <h1>
            Style that
            <br />
            speaks for you.
          </h1>

          <p className="hero-description">
            Discover men's fashion designed for everyday
            confidence, comfort, and style.
          </p>

          <a href="/shop" className="hero-button">
            Shop Collection
          </a>
        </div>

        <div className="hero-image">
          <img
            src="/images/hero-men.jpg"
            alt="Unique Zone men's fashion collection"
          />
        </div>
      </section>

      {/* ==========================================
          CATEGORIES SECTION
          ========================================== */}

      <section className="categories-section">
        <div className="section-heading">
          <p className="section-label">EXPLORE UNIQUE ZONE</p>

          <h2>Shop by Category</h2>

          <p>
            Discover everyday essentials and styles from
            Unique Zone.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <a
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="category-card"
            >
              <div className="category-image">
                {categoryImages[category.slug] ? (
                  <img
                    src={categoryImages[category.slug]}
                    alt={`${category.name} collection`}
                    loading="lazy"
                  />
                ) : (
                  <span>
                    {category.name.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="category-info">
                <h3>{category.name}</h3>
                <span>Shop Now →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ==========================================
          TRENDING PRODUCTS
          ========================================== */}

      <section className="products-section">
        <div className="section-heading products-heading">
          <div>
            <p className="section-label">UNIQUE ZONE</p>
            <h2>Trending Products</h2>
          </div>

          <a href="/shop" className="view-all">
            View All →
          </a>
        </div>

        <div className="product-grid">
          {trendingProducts.map((item) => (
            <a
              key={item.product.productId}
              href={`/product/${item.product.productId}`}
              className="product-card"
            >
              <div className="product-image">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.product.productName}
                    loading="lazy"
                  />
                ) : (
                  <span>
                    {item.product.categoryName?.toUpperCase()}
                  </span>
                )}

                <span className="product-new-label">
                  NEW
                </span>
              </div>

              <div className="product-details">
                <h3>{item.product.productName}</h3>

                <p>{item.color}</p>

                <strong>
                  ₹{item.price.toLocaleString("en-IN")}
                </strong>
              </div>
            </a>
          ))}
        </div>

        {trendingProducts.length === 0 && (
          <p className="home-empty-message">
            New styles are arriving soon.
          </p>
        )}
      </section>

      {/* ==========================================
          BRAND STORY
          ========================================== */}

      <section className="story-section">
        <div className="story-image">
          <div className="story-image-placeholder">
            UNIQUE
            <br />
            ZONE
          </div>
        </div>

        <div className="story-content">
          <p className="section-label">
            THE FASHION GARAGE
          </p>

          <h2>
            Style made
            <br />
            for every day.
          </h2>

          <p>
            At Unique Zone, we bring together everyday
            fashion, comfort, and contemporary style.
            Discover pieces made to fit your lifestyle
            and express your individuality.
          </p>

          <a href="/shop" className="story-button">
            Explore Collection
          </a>
        </div>
      </section>
    </main>
  );
}

export default HomePage;