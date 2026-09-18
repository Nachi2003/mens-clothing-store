function HomePage() {
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
          <div className="hero-image-placeholder">
            MEN'S
            <br />
            COLLECTION
          </div>
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

          <a href="/shop?category=shirts" className="category-card">
            <div className="category-image">
              SHIRTS
            </div>

            <div className="category-info">
              <h3>Shirts</h3>
              <span>Shop Now →</span>
            </div>
          </a>


          <a href="/shop?category=t-shirts" className="category-card">
            <div className="category-image">
              T-SHIRTS
            </div>

            <div className="category-info">
              <h3>T-Shirts</h3>
              <span>Shop Now →</span>
            </div>
          </a>


          <a href="/shop?category=trousers" className="category-card">
            <div className="category-image">
              TROUSERS
            </div>

            <div className="category-info">
              <h3>Trousers</h3>
              <span>Shop Now →</span>
            </div>
          </a>


          <a href="/shop?category=jeans" className="category-card">
            <div className="category-image">
              JEANS
            </div>

            <div className="category-info">
              <h3>Jeans</h3>
              <span>Shop Now →</span>
            </div>
          </a>

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
      <div className="product-image">
        T-SHIRT
      </div>

      <div className="product-details">
        <h3>Premium Cotton T-Shirt</h3>
        <p>White</p>
        <strong>₹599</strong>
      </div>
    </a>


    <a href="/product/3" className="product-card">
      <div className="product-image">
        JEANS
      </div>

      <div className="product-details">
        <h3>Slim Fit Jeans</h3>
        <p>Dark Blue</p>
        <strong>₹1,299</strong>
      </div>
    </a>


    <a href="/product/4" className="product-card">
      <div className="product-image">
        TROUSERS
      </div>

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