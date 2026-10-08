import { useEffect, useState } from "react";

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
        const response = await fetch(`${API_BASE_URL}/api/products`);

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const products: Product[] = await response.json();

        /*
         * ==========================================
         * CATEGORY IMAGES
         * ==========================================
         */

        const imageMap: Record<string, string> = {};

        await Promise.all(
          categories.map(async (category) => {
            const matchingProducts = products.filter((product) => {
              const productCategory = product.categoryName
                ?.trim()
                .toLowerCase();

              return (
                productCategory === category.name.toLowerCase() ||
                productCategory === category.slug.toLowerCase()
              );
            });

            if (matchingProducts.length === 0) return;

            // Random product from this category
            const randomIndex = Math.floor(
              Math.random() * matchingProducts.length
            );

            const selectedProduct = matchingProducts[randomIndex];

            try {
              const imageResponse = await fetch(
                `${API_BASE_URL}/api/products/${selectedProduct.productId}/images`
              );

              if (!imageResponse.ok) return;

              const images: ProductImage[] =
                await imageResponse.json();

              if (!Array.isArray(images) || images.length === 0) return;

              const primaryImage = images.find(
                (image) =>
                  image.primary ||
                  image.isPrimary ||
                  image.is_primary
              );

              const selectedImage =
                primaryImage || images[0];

              const imageUrl =
                selectedImage.imageUrl ||
                selectedImage.image_url;

              if (imageUrl) {
                imageMap[category.slug] =
                  normalizeImageUrl(imageUrl);
              }
            } catch (error) {
              console.error(
                `Failed to load image for ${category.name}:`,
                error
              );
            }
          })
        );

        /*
         * ==========================================
         * TRENDING PRODUCTS
         * ==========================================
         */

        const productsToShow = products.slice(0, 4);

        const trendingResults = await Promise.all(
          productsToShow.map(async (product) => {
            try {
              const [imageResponse, variantResponse] =
                await Promise.all([
                  fetch(
                    `${API_BASE_URL}/api/products/${product.productId}/images`
                  ),
                  fetch(
                    `${API_BASE_URL}/api/product-variants`
                  ),
                ]);

              let imageUrl = "";

              if (imageResponse.ok) {
                const images: ProductImage[] =
                  await imageResponse.json();

                if (Array.isArray(images) && images.length > 0) {
                  const primaryImage = images.find(
                    (image) =>
                      image.primary ||
                      image.isPrimary ||
                      image.is_primary
                  );

                  const selectedImage =
                    primaryImage || images[0];

                  const rawImageUrl =
                    selectedImage.imageUrl ||
                    selectedImage.image_url;

                  if (rawImageUrl) {
                    imageUrl = normalizeImageUrl(rawImageUrl);
                  }
                }
              }

              let variants: ProductVariant[] = [];

              if (variantResponse.ok) {
                variants = await variantResponse.json();
              }

              const productVariants = variants.filter(
                (variant) =>
                  variant.productId === product.productId &&
                  variant.active
              );

              if (productVariants.length === 0) {
                return null;
              }

              // Display the lowest active variant price
              const lowestPrice = Math.min(
                ...productVariants.map(
                  (variant) => Number(variant.price)
                )
              );

              const firstVariant = productVariants[0];

              return {
                product,
                imageUrl,
                color: firstVariant.color,
                price: lowestPrice,
              };
            } catch (error) {
              console.error(
                `Failed to load product ${product.productId}:`,
                error
              );

              return null;
            }
          })
        );

        if (!cancelled) {
          setCategoryImages(imageMap);

          setTrendingProducts(
            trendingResults.filter(
              (item): item is TrendingProduct => item !== null
            )
          );
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