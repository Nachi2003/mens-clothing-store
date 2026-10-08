import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import { Link, useSearchParams } from "react-router-dom";



import { getProducts } from "../services/productService";

import { getProductVariants } from "../services/productVariantService";



import type { Product } from "../types/Product";

import type { ProductVariant } from "../types/ProductVariant";



const API_BASE_URL =

  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";



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



  const [productImages, setProductImages] = useState<

    Record<number, string>

  >({});



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // Search

  const [searchTerm, setSearchTerm] = useState("");



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

    const loadShopData = async () => {

      try {

        setLoading(true);

        setError("");



        const [productData, variantData] = await Promise.all([

          getProducts(),

          getProductVariants(),

        ]);



        setProducts(productData);

        setVariants(variantData);



        /*

         * Fetch images for every product

         */

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

    const colorSet = new Set<string>();



    variants.forEach((variant) => {

      if (variant.active && variant.color) {

        colorSet.add(variant.color);

      }

    });



    return Array.from(colorSet).sort();

  }, [variants]);



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

   * Filter + Search + Sort

   */

  const filteredProducts = useMemo(() => {

    let result = [...products];



    /*

     * SEARCH

     */

    const search = searchTerm.trim().toLowerCase();



    if (search) {

      result = result.filter((product) => {

        const productName =

          product.productName?.toLowerCase() || "";



        const category =

          product.categoryName?.toLowerCase() || "";



        const description =

          product.description?.toLowerCase() || "";



        return (

          productName.includes(search) ||

          category.includes(search) ||

          description.includes(search)

        );

      });

    }



    /*

     * CATEGORY FILTER

     */

    if (selectedCategories.length > 0) {

      result = result.filter((product) => {

        const category =

          product.categoryName?.toLowerCase() || "";



        return selectedCategories.some(

          (selectedCategory) =>

            selectedCategory.toLowerCase() === category

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



        return productVariants.some((variant) =>

          selectedColors.some(

            (color) =>

              color.toLowerCase() ===

              variant.color?.toLowerCase()

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

    products,

    variants,

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

          <div className="shop-search">

            <input

              type="search"

              placeholder="Search products..."

              value={searchTerm}

              onChange={(event) =>

                setSearchTerm(event.target.value)

              }

              aria-label="Search products"

            />

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