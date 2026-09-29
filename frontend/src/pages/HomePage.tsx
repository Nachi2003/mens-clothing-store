import { useEffect, useState } from "react";

interface Product {
  productId: number;
  productName: string;
  categoryName: string;
}

interface ProductImage {
  imageUrl?: string;
  image_url?: string;
  isPrimary?: boolean;
  is_primary?: boolean;
}

interface Category {
  name: string;
  slug: string;
}

const categories: Category[] = [
  { name: "Shirts", slug: "shirts" },
  { name: "T-Shirts", slug: "t-shirts" },
  { name: "Trousers", slug: "trousers" },
  { name: "Jeans", slug: "jeans" },
];

function HomePage() {
  const [categoryImages, setCategoryImages] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadCategoryImages() {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const products: Product[] = await response.json();

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

            // Randomly select a product from this category.
            const randomIndex = Math.floor(
              Math.random() * matchingProducts.length
            );

            const selectedProduct = matchingProducts[randomIndex];

            try {
              const imageResponse = await fetch(
                `/api/products/${selectedProduct.productId}/images`
              );

              if (!imageResponse.ok) return;

              const images: ProductImage[] =
                await imageResponse.json();

              if (!Array.isArray(images) || images.length === 0) return;

              const primaryImage = images.find(
                (image) => image.isPrimary || image.is_primary
              );

              const selectedImage =
                primaryImage || images[0];

              const imageUrl =
                selectedImage.imageUrl || selectedImage.image_url;

              if (imageUrl) {
                imageMap[category.slug] = imageUrl;
              }
            } catch (error) {
              console.error(
                `Failed to load image for ${category.name}:`,
                error
              );
            }
          })
        );

        if (!cancelled) {
          setCategoryImages(imageMap);
        }
      } catch (error) {
        console.error("Failed to load category images:", error);
      }
    }

    loadCategoryImages();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">MEN'S COLLECTION</p>

          <h1>
            Style that
            <br />
            speaks for you.
          </h1>

          <p className="hero-description">
            Discover timeless menswear designed for everyday confidence,
            comfort, and style.
          </p>

          <a href="/shop" className="hero-button">
            Shop Collection
          </a>
        </div>

        <div className="hero-image">
          <img
            src="/images/hero-men.jpg"
            alt="L'ATELIER premium men's fashion collection"
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-heading">
          <p className="section-label">EXPLORE</p>

          <h2>Shop by Category</h2>

          <p>
            Find your everyday essentials and timeless styles.
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
                  <span>{category.name.toUpperCase()}</span>
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

      {/* Trending Products Section */}
      <section className="products-section">
        <div className="section-heading products-heading">
          <div>
            <p className="section-label">THIS WEEK</p>
            <h2>Trending Products</h2>
          </div>

          <a href="/shop" className="view-all">
            View All →
          </a>
        </div>

        <div className="product-grid">
          <a href="/product/1" className="product-card">
            <div className="product-image">
              <span>NEW</span>
              SHIRT
            </div>

            <div className="product-details">
              <h3>Classic Casual Shirt</h3>
              <p>Black</p>
              <strong>₹799</strong>
            </div>
          </a>

          <a href="/product/2" className="product-card">
            <div className="product-image">T-SHIRT</div>

            <div className="product-details">
              <h3>Premium Cotton T-Shirt</h3>
              <p>White</p>
              <strong>₹599</strong>
            </div>
          </a>

          <a href="/product/3" className="product-card">
            <div className="product-image">JEANS</div>

            <div className="product-details">
              <h3>Slim Fit Jeans</h3>
              <p>Dark Blue</p>
              <strong>₹1,299</strong>
            </div>
          </a>

          <a href="/product/4" className="product-card">
            <div className="product-image">TROUSERS</div>

            <div className="product-details">
              <h3>Regular Fit Trousers</h3>
              <p>Beige</p>
              <strong>₹999</strong>
            </div>
          </a>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="story-section">
        <div className="story-image">
          <div className="story-image-placeholder">
            OUR
            <br />
            STORY
          </div>
        </div>

        <div className="story-content">
          <p className="section-label">OUR PHILOSOPHY</p>

          <h2>
            Simple style.
            <br />
            Made for every day.
          </h2>

          <p>
            We believe great menswear does not need to be complicated.
            Our collection focuses on clean designs, comfortable fabrics,
            and timeless styles that fit naturally into everyday life.
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