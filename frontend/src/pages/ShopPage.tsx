import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import { Link, useSearchParams } from "react-router-dom";

import { getProducts } from "../services/productService";

import { getProductVariants } from "../services/productVariantService";

import { getInventoryByVariantId } from "../services/inventoryService";

import type { Product } from "../types/Product";

import type { ProductVariant } from "../types/ProductVariant";

import type { Inventory } from "../services/inventoryService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** Normalize category names and URL slugs to the same comparable value. */
function normalizeCategory(category?: string | null): string {
  const normalized = (category ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (["tshirt", "tshirts", "tee", "tees"].includes(normalized)) return "tshirts";
  if (["shirt", "shirts"].includes(normalized)) return "shirts";
  if (["trouser", "trousers"].includes(normalized)) return "trousers";
  if (["jean", "jeans"].includes(normalized)) return "jeans";
  return normalized;
}

interface ProductImage {

  imageId: number;

  imageUrl: string;

  primary: boolean;

}

type SortOption =

  | "recommended"

  | "price-low"

  | "price-high"

  | "newest"

  | "name";

function ShopPage() {

  const [searchParams] = useSearchParams();

  const urlCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);

  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [inventory, setInventory] = useState<Inventory[]>([]);

  // If public stock lookups fail, keep the catalog visible rather than hiding all products.
  const [inventoryUnavailable, setInventoryUnavailable] = useState(false);

  const [productImages, setProductImages] = useState<

    Record<number, string>

  >({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Search

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Filters

  const [selectedCategories, setSelectedCategories] = useState<string[]>(

    []

  );

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");

  // Sorting

  const [sortOption, setSortOption] =

    useState<SortOption>("recommended");

  // Mobile filter drawer

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  /*

   * Load products, variants and images

   */

  useEffect(() => {
    let cancelled = false;

    const loadShopData = async () => {
      setLoading(true);
      setError("");

      try {
        // Products and variants must not be blocked by an inventory authorization error.
        const [productResult, variantResult] = await Promise.allSettled([
          getProducts(),
          getProductVariants(),
        ]);

        if (productResult.status === "rejected") {
          throw productResult.reason;
        }
        if (variantResult.status === "rejected") {
          throw variantResult.reason;
        }

        const productData = productResult.value;
        const variantData = variantResult.value;

        if (cancelled) return;
        setProducts(productData);
        setVariants(variantData);

        // Load all product images before requesting inventory.
        const imageResults = await Promise.all(
          productData.map(async (product) => {
            try {
              const response = await axios.get<ProductImage[]>(
                `${API_BASE_URL}/api/products/${product.productId}/images`
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
              return { productId: product.productId, imageUrl: "" };
            }
          })
        );

        const imageMap: Record<number, string> = {};
        imageResults.forEach((result) => {
          imageMap[result.productId] = result.imageUrl;
        });
        if (cancelled) return;
        setProductImages(imageMap);

        // This existing endpoint is explicitly public in SecurityConfig.
        const activeVariants = variantData.filter((variant) => variant.active);
        const inventoryResults = await Promise.all(
          activeVariants.map(async (variant) => {
            try {
              return await getInventoryByVariantId(variant.variantId);
            } catch (err) {
              console.error(
                `Failed to load inventory for variant ${variant.variantId}:`,
                err
              );
              return null;
            }
          })
        );

        const successfulInventory = inventoryResults.filter(
          (item): item is Inventory => item !== null
        );
        if (cancelled) return;
        setInventory(successfulInventory);
        setInventoryUnavailable(
          activeVariants.length > 0 && successfulInventory.length === 0
        );
      } catch (err) {
        console.error("Failed to load shop data:", err);
        if (!cancelled) {
          setError("Unable to load products. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadShopData();
    return () => {
      cancelled = true;
    };
  }, []);

  /*

   * Apply category from URL

   *

   * Example:

   * /shop?category=shirts

   */

  useEffect(() => {

    if (urlCategory) {

      setSelectedCategories([urlCategory.toLowerCase()]);

    } else {

      setSelectedCategories([]);

    }

  }, [urlCategory]);

  /*

   * Get unique categories

   */

  const categories = useMemo(() => {

    const categorySet = new Set<string>();

    products.forEach((product) => {

      if (product.categoryName) {

        categorySet.add(product.categoryName);

      }

    });

    return Array.from(categorySet).sort();

  }, [products]);

  /*

   * Get unique sizes

   */

  const sizes = useMemo(() => {

    const sizeSet = new Set<string>();

    variants.forEach((variant) => {

      if (variant.active && variant.size) {

        sizeSet.add(variant.size);

      }

    });

    return Array.from(sizeSet).sort();

  }, [variants]);

  /*

   * Get unique colors

   */

  const colors = useMemo(() => {
    const stockByVariant = new Map<number, number>(
      inventory.map((item) => [item.variantId, Number(item.quantity) || 0])
    );
    const colorSet = new Set<string>();

    variants.forEach((variant) => {
      const stock = stockByVariant.get(variant.variantId) ?? 0;
      if (variant.active && variant.color?.trim() && stock >= 1) {
        colorSet.add(variant.color.trim());
      }
    });

    return Array.from(colorSet).sort((a, b) => a.localeCompare(b));
  }, [variants, inventory]);

  /*

   * Get active variants for a product

   */

  const getProductVariantList = (

    productId: number

  ): ProductVariant[] => {

    return variants.filter(

      (variant) =>

        variant.productId === productId && variant.active

    );

  };

  /*

   * Get lowest active variant price

   */

  const getLowestPrice = (

    productId: number

  ): number | null => {

    const productVariants = getProductVariantList(productId);

    const prices = productVariants

      .map((variant) => Number(variant.price))

      .filter((price) => !Number.isNaN(price));

    if (prices.length === 0) {

      return null;

    }

    return Math.min(...prices);

  };

  /*

   * Only show products with at least one active variant in stock.
   * Sold-out products remain available in the admin inventory.

   */

  const inStockProducts = useMemo(() => {
    const stockByVariant = new Map<number, number>(
      inventory.map((item) => [item.variantId, Number(item.quantity) || 0])
    );

    return products.filter((product) =>
      variants.some((variant) => {
        if (variant.productId !== product.productId || !variant.active) {
          return false;
        }

        // If stock data is unavailable due to authorization/network failure,
        // keep products visible so catalog images and details still render.
        if (inventoryUnavailable) return true;

        return (stockByVariant.get(variant.variantId) ?? 0) > 0;
      })
    );
  }, [products, variants, inventory, inventoryUnavailable]);

  /**
   * Keyword search across product name, category, description, and variant
   * color/size. Every typed word must match somewhere in the product data.
   */
  const matchesSearch = (product: Product, query: string): boolean => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;

    const variantTerms = variants
      .filter((variant) => variant.productId === product.productId && variant.active)
      .flatMap((variant) => [variant.color, variant.size]);

    const searchableText = [
      product.productName,
      product.categoryName,
      product.description ?? "",
      ...variantTerms,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[-_]+/g, " ");

    return words.every((word) => searchableText.includes(word));
  };

  const searchSuggestions = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return [];
    return inStockProducts
      .filter((product) => matchesSearch(product, query))
      .slice(0, 6);
  }, [searchTerm, inStockProducts, variants]);

  /*

   * Filter + Search + Sort

   */

  const filteredProducts = useMemo(() => {

    let result = [...inStockProducts];

    /*

     * SEARCH

     */

    const search = searchTerm.trim();

    if (search) {
      result = result.filter((product) => matchesSearch(product, search));
    }

    /*

     * CATEGORY FILTER

     */

    if (selectedCategories.length > 0) {

      result = result.filter((product) => {

        const productCategory = normalizeCategory(product.categoryName);

        return selectedCategories.some(
          (selectedCategory) =>
            normalizeCategory(selectedCategory) === productCategory
        );

      });

    }

    /*

     * SIZE FILTER

     */

    if (selectedSizes.length > 0) {

      result = result.filter((product) => {

        const productVariants = getProductVariantList(

          product.productId

        );

        return productVariants.some((variant) =>

          selectedSizes.some(

            (size) =>

              size.toLowerCase() ===

              variant.size?.toLowerCase()

          )

        );

      });

    }

    /*

     * COLOR FILTER

     */

    if (selectedColors.length > 0) {

      result = result.filter((product) => {

        const productVariants = getProductVariantList(

          product.productId

        );

        const stockByVariant = new Map<number, number>(
          inventory.map((item) => [item.variantId, Number(item.quantity) || 0])
        );
        return productVariants.some((variant) =>
          (stockByVariant.get(variant.variantId) ?? 0) >= 1 &&
          selectedColors.some(
            (color) => color.toLowerCase() === variant.color?.toLowerCase()
          )
        );

      });

    }

    /*

     * MINIMUM PRICE

     */

    if (minPrice !== "") {

      const minimum = Number(minPrice);

      if (!Number.isNaN(minimum)) {

        result = result.filter((product) => {

          const price = getLowestPrice(product.productId);

          return price !== null && price >= minimum;

        });

      }

    }

    /*

     * MAXIMUM PRICE

     */

    if (maxPrice !== "") {

      const maximum = Number(maxPrice);

      if (!Number.isNaN(maximum)) {

        result = result.filter((product) => {

          const price = getLowestPrice(product.productId);

          return price !== null && price <= maximum;

        });

      }

    }

    /*

     * SORT

     */

    switch (sortOption) {

      case "price-low":

        result.sort((a, b) => {

          const priceA =

            getLowestPrice(a.productId) ?? Infinity;

          const priceB =

            getLowestPrice(b.productId) ?? Infinity;

          return priceA - priceB;

        });

        break;

      case "price-high":

        result.sort((a, b) => {

          const priceA =

            getLowestPrice(a.productId) ?? 0;

          const priceB =

            getLowestPrice(b.productId) ?? 0;

          return priceB - priceA;

        });

        break;

      case "name":

        result.sort((a, b) =>

          a.productName.localeCompare(b.productName)

        );

        break;

      case "newest":

        /*

         * Higher product ID is treated as newer.

         */

        result.sort(

          (a, b) => b.productId - a.productId

        );

        break;

      case "recommended":

      default:

        /*

         * Keep backend order.

         */

        break;

    }

    return result;

  }, [

    inStockProducts,

    variants,

    inventory,

    searchTerm,

    selectedCategories,

    selectedSizes,

    selectedColors,

    minPrice,

    maxPrice,

    sortOption,

  ]);

  /*

   * Toggle category

   */

  const toggleCategory = (category: string) => {

    setSelectedCategories((current) => {

      const exists = current.some(

        (item) =>

          item.toLowerCase() === category.toLowerCase()

      );

      if (exists) {

        return current.filter(

          (item) =>

            item.toLowerCase() !== category.toLowerCase()

        );

      }

      return [...current, category.toLowerCase()];

    });

  };

  /*

   * Toggle size

   */

  const toggleSize = (size: string) => {

    setSelectedSizes((current) => {

      const exists = current.some(

        (item) =>

          item.toLowerCase() === size.toLowerCase()

      );

      if (exists) {

        return current.filter(

          (item) =>

            item.toLowerCase() !== size.toLowerCase()

        );

      }

      return [...current, size];

    });

  };

  /*

   * Toggle color

   */

  const toggleColor = (color: string) => {

    setSelectedColors((current) => {

      const exists = current.some(

        (item) =>

          item.toLowerCase() === color.toLowerCase()

      );

      if (exists) {

        return current.filter(

          (item) =>

            item.toLowerCase() !== color.toLowerCase()

        );

      }

      return [...current, color];

    });

  };

  /*

   * Clear filters

   */

  const clearFilters = () => {

    setSearchTerm("");

    /*

     * Preserve category from URL.

     */

    if (urlCategory) {

      setSelectedCategories([

        urlCategory.toLowerCase(),

      ]);

    } else {

      setSelectedCategories([]);

    }

    setSelectedSizes([]);

    setSelectedColors([]);

    setMinPrice("");

    setMaxPrice("");

    setSortOption("recommended");

  };

  /*

   * Count active filters

   */

  const activeFilterCount =

    selectedCategories.length +

    selectedSizes.length +

    selectedColors.length +

    (minPrice !== "" ? 1 : 0) +

    (maxPrice !== "" ? 1 : 0);

  /*

   * Filter panel

   */

  const renderFilterPanel = () => (

    <aside className="filters">

      <div className="filter-header">

        <h2>Filters</h2>

        {activeFilterCount > 0 && (

          <button

            type="button"

            onClick={clearFilters}

            className="clear-filters"

          >

            Clear All

          </button>

        )}

      </div>

      {/* CATEGORY */}

      <div className="filter-group">

        <h3>Category</h3>

        {categories.length === 0 ? (

          <p>No categories available.</p>

        ) : (

          categories.map((category) => (

            <label

              key={category}

              className="filter-option"

            >

              <input

                type="checkbox"

                checked={selectedCategories.some(

                  (item) =>

                    item.toLowerCase() ===

                    category.toLowerCase()

                )}

                onChange={() =>

                  toggleCategory(category)

                }

              />

              <span>{category}</span>

            </label>

          ))

        )}

      </div>

      {/* SIZE */}

      <div className="filter-group">

        <h3>Size</h3>

        {sizes.length === 0 ? (

          <p>No sizes available.</p>

        ) : (

          <div className="size-options">

            {sizes.map((size) => (

              <label

                key={size}

                className={`size-option ${selectedSizes.includes(size)

                  ? "selected"

                  : ""

                  }`}

              >

                <input

                  type="checkbox"

                  checked={selectedSizes.includes(size)}

                  onChange={() => toggleSize(size)}

                />

                <span>{size}</span>

              </label>

            ))}

          </div>

        )}

      </div>

      {/* COLOR */}

      <div className="filter-group">

        <h3>Color</h3>

        {colors.length === 0 ? (

          <p>No colors available.</p>

        ) : (

          colors.map((color) => (

            <label

              key={color}

              className="filter-option"

            >

              <input

                type="checkbox"

                checked={selectedColors.some(

                  (item) =>

                    item.toLowerCase() ===

                    color.toLowerCase()

                )}

                onChange={() => toggleColor(color)}

              />

              <span>{color}</span>

            </label>

          ))

        )}

      </div>

      {/* PRICE */}

      <div className="filter-group">

        <h3>Price</h3>

        <div className="price-inputs">

          <div className="price-input-wrapper">

  <span className="price-symbol">₹</span>

  <input

    type="text"

    inputMode="numeric"

    placeholder="Min"

    value={minPrice}

    onChange={(event) => {

      const value = event.target.value.replace(/\D/g, "");

      setMinPrice(value);

    }}

  />

</div>

          <span>–</span>

          <div className="price-input-wrapper">

  <span className="price-symbol">₹</span>

  <input

    type="text"

    inputMode="numeric"

    placeholder="Max"

    value={maxPrice}

    onChange={(event) => {

      const value = event.target.value.replace(/\D/g, "");

      setMaxPrice(value);

    }}

  />

</div>

        </div>

      </div>

    </aside>

  );

  return (

    <main className="shop-page">

      {/* SHOP HEADER */}

      <section className="shop-header">

        <p className="section-label">

          UNIQUE ZONE · THE FASHION GARAGE

        </p>

        <h1>Shop Men's Clothing</h1>

        <p>

          Explore our collection of shirts, t-shirts,

          trousers, jeans, and more.

        </p>

      </section>

      <section className="shop-content">

        {/* TOOLBAR */}

        <div className="shop-toolbar">

          <div className="shop-toolbar-left">

            <button

              type="button"

              className="mobile-filter-button"

              onClick={() =>

                setShowMobileFilters(true)

              }

            >

              Filters

              {activeFilterCount > 0 && (

                <span className="filter-count">

                  {activeFilterCount}

                </span>

              )}

            </button>

            <p>

              {loading

                ? "Loading..."

                : `${filteredProducts.length} ${filteredProducts.length === 1

                  ? "Product"

                  : "Products"

                }`}

            </p>

          </div>

          {/* SEARCH */}

          <div
            className="shop-search"
            style={{ position: "relative" }}
            onBlur={(event) => {
              const nextTarget = event.relatedTarget as Node | null;
              if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                setSearchFocused(false);
              }
            }}
          >
            <input
              type="search"
              placeholder="Search by product, color, category, or size..."
              value={searchTerm}
              onFocus={() => setSearchFocused(true)}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setActiveSuggestionIndex(-1);
                setSearchFocused(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && searchSuggestions.length > 0) {
                  event.preventDefault();
                  setSearchFocused(true);
                  setActiveSuggestionIndex((current) =>
                    current < searchSuggestions.length - 1 ? current + 1 : 0
                  );
                } else if (event.key === "ArrowUp" && searchSuggestions.length > 0) {
                  event.preventDefault();
                  setActiveSuggestionIndex((current) =>
                    current > 0 ? current - 1 : searchSuggestions.length - 1
                  );
                } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                  const selected = searchSuggestions[activeSuggestionIndex];
                  if (selected) {
                    event.preventDefault();
                    window.location.href = `/product/${selected.productId}`;
                  }
                } else if (event.key === "Escape") {
                  setSearchFocused(false);
                  setActiveSuggestionIndex(-1);
                }
              }}
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={searchFocused && searchTerm.trim().length > 0}
            />

            {searchTerm.trim().length > 0 && searchFocused && (
              <div
                role="listbox"
                aria-label="Product suggestions"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: "#fff",
                  border: "1px solid #e5ddd1",
                  borderRadius: 8,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((product, index) => {
                    const rawImage = productImages[product.productId] ?? "";
                    const suggestionImage = rawImage
                      ? rawImage.startsWith("http")
                        ? rawImage
                        : `${API_BASE_URL}${rawImage}`
                      : "";
                    return (
                      <Link
                        key={product.productId}
                        to={`/product/${product.productId}`}
                        role="option"
                        aria-selected={activeSuggestionIndex === index}
                        onMouseDown={() => setSearchFocused(false)}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          textDecoration: "none",
                          color: "inherit",
                          background: activeSuggestionIndex === index ? "#f5f1eb" : "#fff",
                          borderBottom: index < searchSuggestions.length - 1 ? "1px solid #eee8df" : "none",
                        }}
                      >
                        {suggestionImage ? (
                          <img
                            src={suggestionImage}
                            alt=""
                            loading="lazy"
                            style={{ width: 48, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                          />
                        ) : (
                          <span style={{ width: 48, height: 56, background: "#f1ece4", borderRadius: 4, flexShrink: 0 }} />
                        )}
                        <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <strong>{product.productName}</strong>
                          <small style={{ color: "#777" }}>{product.categoryName}</small>
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div style={{ padding: "14px", color: "#777" }}>
                    No matching products found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SORT */}

          <div className="shop-sort">

            <label htmlFor="sort-products">

              Sort:

            </label>

            <select

              id="sort-products"

              value={sortOption}

              onChange={(event) =>

                setSortOption(

                  event.target.value as SortOption

                )

              }

            >

              <option value="recommended">

                Recommended

              </option>

              <option value="price-low">

                Price: Low to High

              </option>

              <option value="price-high">

                Price: High to Low

              </option>

              <option value="newest">

                Newest

              </option>

              <option value="name">

                Name

              </option>

            </select>

          </div>

        </div>

        {/* SHOP CONTENT */}

        <div className="shop-layout">

          {/* DESKTOP FILTERS */}

          <div className="desktop-filters">

            {renderFilterPanel()}

          </div>

          {/* PRODUCTS */}

          <div className="shop-products">

            {loading && (

              <div className="empty-products">

                Loading products...

              </div>

            )}

            {!loading && error && (

              <div className="empty-products">

                {error}

              </div>

            )}

            {!loading &&

              !error &&

              products.length === 0 && (

                <div className="empty-products">

                  No products available.

                </div>

              )}

            {!loading &&

              !error &&

              products.length > 0 &&

              filteredProducts.length === 0 && (

                <div className="empty-products">

                  <h3>No products found</h3>

                  <p>

                    Try changing your search or

                    filters.

                  </p>

                  <button

                    type="button"

                    onClick={clearFilters}

                  >

                    Clear Filters

                  </button>

                </div>

              )}

            {!loading &&

              !error &&

              filteredProducts.length > 0 && (

                <div className="product-grid">

                  {filteredProducts.map((product) => {

                    const productVariants =

                      getProductVariantList(

                        product.productId

                      );

                    const lowestPrice =

                      getLowestPrice(

                        product.productId

                      );

                    const imageUrl =

                      productImages[

                      product.productId

                      ];

                    /*

                     * Convert relative image path

                     * into backend URL.

                     */

                    const fullImageUrl = imageUrl

                      ? imageUrl.startsWith("http")

                        ? imageUrl

                        : `${API_BASE_URL}${imageUrl}`

                      : "";

                    return (

                      <Link

                        to={`/product/${product.productId}`}

                        className="product-card"

                        key={product.productId}

                        style={{

                          textDecoration: "none",

                          color: "inherit",

                          display: "block",

                        }}

                      >

                        {/* PRODUCT IMAGE */}

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

                              loading="lazy"

                            />

                          ) : (

                            <span>

                              PRODUCT IMAGE

                            </span>

                          )}

                        </div>

                        {/* PRODUCT DETAILS */}

                        <div className="product-details">

                          <h3>

                            {product.productName}

                          </h3>

                          <p>

                            {product.categoryName}

                          </p>

                          {lowestPrice !== null && (

                            <strong>

                              ₹

                              {lowestPrice.toLocaleString(

                                "en-IN"

                              )}

                            </strong>

                          )}

                          <p>

                            {productVariants.length}{" "}

                            {productVariants.length ===

                              1

                              ? "variant"

                              : "variants"}

                          </p>

                        </div>

                      </Link>

                    );

                  })}

                </div>

              )}

          </div>

        </div>

      </section>

      {/* MOBILE FILTER DRAWER */}

      {showMobileFilters && (

        <div

          className="mobile-filter-overlay"

          onClick={() =>

            setShowMobileFilters(false)

          }

        >

          <div

            className="mobile-filter-drawer"

            onClick={(event) =>

              event.stopPropagation()

            }

          >

            <div className="mobile-filter-header">

              <h2>Filters</h2>

              <button

                type="button"

                onClick={() =>

                  setShowMobileFilters(false)

                }

                aria-label="Close filters"

              >

                ×

              </button>

            </div>

            {renderFilterPanel()}

            <div className="mobile-filter-actions">

              <button

                type="button"

                onClick={clearFilters}

              >

                Clear All

              </button>

              <button

                type="button"

                onClick={() =>

                  setShowMobileFilters(false)

                }

              >

                Apply Filters

              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}

export default ShopPage;
