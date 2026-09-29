import { useEffect, useState } from "react";
import axios from "axios";

import { getProducts } from "../services/productService";
import { getProductVariants } from "../services/productVariantService";
import { Link } from "react-router-dom";
import type { Product } from "../types/Product";
import type { ProductVariant } from "../types/ProductVariant";

interface ProductImage {
  imageId: number;
  imageUrl: string;
  primary: boolean;
}

function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productImages, setProductImages] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShopData = async () => {
      try {
        const [productData, variantData] = await Promise.all([
          getProducts(),
          getProductVariants(),
        ]);

        setProducts(productData);
        setVariants(variantData);

        // Fetch images for each product
        const imageResults = await Promise.all(
          productData.map(async (product) => {
            try {
              const response = await axios.get<ProductImage[]>(
                `http://localhost:8080/api/products/${product.productId}/images`
              );

              const images = response.data;

              const primaryImage =
                images.find((image) => image.primary) ?? images[0];

              return {
                productId: product.productId,
                imageUrl: primaryImage?.imageUrl ?? "",
              };
            } catch (err) {
              console.error(
                `Failed to load image for product ${product.productId}:`,
                err
              );

              return {
                productId: product.productId,
                imageUrl: "",
              };
            }
          })
        );

        const imageMap: Record<number, string> = {};

        imageResults.forEach((result) => {
          imageMap[result.productId] = result.imageUrl;
        });

        setProductImages(imageMap);
      } catch (err) {
        console.error("Failed to load shop data:", err);
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, []);

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
          <button type="button">Filters</button>

          <p>
            {loading ? "Loading..." : `${products.length} Products`}
          </p>

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
            {loading && (
              <div className="empty-products">
                Loading products...
              </div>
            )}

            {!loading && error && (
              <div className="empty-products">{error}</div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="empty-products">
                No products found.
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div className="product-grid">
                {products.map((product) => {
                  const productVariants = variants.filter(
                    (variant) =>
                      variant.productId === product.productId &&
                      variant.active
                  );

                  const prices = productVariants.map(
                    (variant) => variant.price
                  );

                  const lowestPrice =
                    prices.length > 0 ? Math.min(...prices) : null;

                  const imageUrl = productImages[product.productId];

                  // Convert relative image paths to backend URLs
                  const fullImageUrl = imageUrl
                    ? imageUrl.startsWith("http")
                      ? imageUrl
                      : `http://localhost:8080${imageUrl}`
                    : "";

                  return (
                    <Link to={`/product/${product.productId}`}
  className="product-card"
  key={product.productId}
  style={{
    textDecoration: "none",
    color: "inherit",
    display: "block",
  }}
>
                      <div className="product-image">
                        {fullImageUrl ? (
                          <img
                            src={fullImageUrl}
                            alt={product.productName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <span>PRODUCT IMAGE</span>
                        )}
                      </div>

                      <div className="product-details">
                        <h3>{product.productName}</h3>

                        <p>{product.categoryName}</p>

                        {lowestPrice !== null && (
                          <strong>₹{lowestPrice}</strong>
                        )}

                        <p>{productVariants.length} variants</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ShopPage;