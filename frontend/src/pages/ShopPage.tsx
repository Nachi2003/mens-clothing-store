function ShopPage() {
  return (
    <main className="shop-page">
      <section className="shop-header">
        <p className="section-label">COLLECTION</p>

        <h1>Shop Men's Clothing</h1>

        <p>
          Explore our collection of shirts, t-shirts, trousers,
          jeans, and more.
        </p>
      </section>

      <section className="shop-content">
        <div className="shop-toolbar">
          <button type="button">
            Filters
          </button>

          <p>Products</p>

          <select defaultValue="recommended">
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="shop-layout">

          <aside className="filters">
            <h2>Filters</h2>

            <div className="filter-group">
              <h3>Category</h3>
              <p>Categories will load from backend</p>
            </div>

            <div className="filter-group">
              <h3>Size</h3>
              <p>Sizes will load from backend</p>
            </div>

            <div className="filter-group">
              <h3>Color</h3>
              <p>Colors will load from backend</p>
            </div>
          </aside>

          <div className="shop-products">
            <div className="empty-products">
              Products will appear here.
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

export default ShopPage;