import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { getProducts } from "../services/productService";

import { getProductVariants } from "../services/productVariantService";

import { getInventory } from "../services/inventoryService";

import { getProductImages, getProductImageUrl, type ProductImage } from "../services/productImageService";

import { createInStoreSale } from "../services/inStoreSaleService";

import type { Product } from "../types/Product";

import type { ProductVariant } from "../types/ProductVariant";

import type { Inventory } from "../services/inventoryService";

type CatalogItem = {

  variant: ProductVariant;

  product: Product | undefined;

  stock: number;

  imageUrl: string | null;

};

type CartLine = CatalogItem & { quantity: number };

const currency = (value: number) =>

  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

const normalized = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase();

export default function StaffBillingPage() {

  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const [inventory, setInventory] = useState<Inventory[]>([]);

  const [imagesByProduct, setImagesByProduct] = useState<Record<number, ProductImage[]>>({});

  const [productQuery, setProductQuery] = useState("");

  const [sizeQuery, setSizeQuery] = useState("");

  const [colorQuery, setColorQuery] = useState("");

  const [appliedSearch, setAppliedSearch] = useState({ product: "", size: "", color: "" });

  const [showAllProducts, setShowAllProducts] = useState(false);

  const PRODUCTS_TO_SHOW = 4;

  const [cart, setCart] = useState<CartLine[]>([]);

  const [billDiscount, setBillDiscount] = useState(0);

  const [customerName, setCustomerName] = useState("");

  const [customerPhone, setCustomerPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [completedSale, setCompletedSale] = useState<{

    saleNumber: string;

    total: number;

    totalDiscount: number;

    customerPhone: string;

    customerName: string;

  } | null>(null);

  const loadCatalog = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const [nextProducts, nextVariants, nextInventory] = await Promise.all([

        getProducts(),

        getProductVariants(),

        getInventory(),

      ]);

      setProducts(nextProducts);

      setVariants(nextVariants.filter((variant) => variant.active !== false));

      setInventory(nextInventory);

      const productIds = [...new Set(nextVariants.filter((variant) => variant.active !== false).map((variant) => variant.productId))];

      const imageEntries = await Promise.all(

        productIds.map(async (productId) => {

          try {

            return [productId, await getProductImages(productId)] as const;

          } catch {

            // Keep the product available in the catalogue even if its images fail to load.

            return [productId, [] as ProductImage[]] as const;

          }

        })

      );

      setImagesByProduct(Object.fromEntries(imageEntries));

    } catch (err) {

      setError(err instanceof Error ? err.message : "Could not load products and inventory.");

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    void loadCatalog();

  }, [loadCatalog]);

  const inventoryByVariant = useMemo(() => {

    const map = new Map<number, Inventory>();

    inventory.forEach((item) => map.set(item.variantId, item));

    return map;

  }, [inventory]);

  const catalogItems = useMemo<CatalogItem[]>(() => {

    const productById = new Map(products.map((product) => [product.productId, product]));

    return variants.map((variant) => {

      const product = productById.get(variant.productId);

      const imageList = imagesByProduct[variant.productId] ?? [];

      const matchingColorImages = imageList.filter((image) => normalized(image.color) === normalized(variant.color));

      const image = matchingColorImages[0] ?? imageList.find((candidate) => candidate.primary) ?? imageList[0];

      return {

        variant,

        product,

        stock: inventoryByVariant.get(variant.variantId)?.quantity ?? 0,

        imageUrl: image ? getProductImageUrl(image.imageUrl) : null,

      };

    });

  }, [variants, products, imagesByProduct, inventoryByVariant]);

  const filteredItems = useMemo(() => catalogItems.filter((item) => {

    const name = item.product?.productName ?? item.variant.productName;

    const productMatches = !appliedSearch.product || normalized(name).includes(normalized(appliedSearch.product)) || String(item.variant.productId) === appliedSearch.product.trim();

    const sizeMatches = !appliedSearch.size || normalized(item.variant.size).includes(normalized(appliedSearch.size));

    const colorMatches = !appliedSearch.color || normalized(item.variant.color).includes(normalized(appliedSearch.color));

    return productMatches && sizeMatches && colorMatches;

  }), [catalogItems, appliedSearch]);

  const subtotal = cart.reduce((total, line) => total + Number(line.variant.price) * line.quantity, 0);

  // Staff enters one discount for the whole bill. The backend accepts a fixed discount per unit,

  // so this total is distributed proportionally across the selected items when the sale is submitted.

  const totalDiscount = Math.min(subtotal, Math.max(0, Number(billDiscount) || 0));

  const totalPayable = Math.max(0, subtotal - totalDiscount);

  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);

  function searchProducts(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setShowAllProducts(false);

    setAppliedSearch({ product: productQuery.trim(), size: sizeQuery.trim(), color: colorQuery.trim() });

  }

  function addToBill(item: CatalogItem) {

    setError("");

    setNotice("");

    setCompletedSale(null);

    if (item.stock < 1) {

      setError("This variant is out of stock.");

      return;

    }

    setCart((current) => {

      const existing = current.find((line) => line.variant.variantId === item.variant.variantId);

      if (existing) {

        if (existing.quantity >= item.stock) {

          setError(`Only ${item.stock} unit(s) are available for ${item.variant.productName} · ${item.variant.color} / ${item.variant.size}.`);

          return current;

        }

        return current.map((line) => line.variant.variantId === item.variant.variantId ? { ...line, quantity: line.quantity + 1 } : line);

      }

      return [...current, { ...item, quantity: 1 }];

    });

  }

  function changeQuantity(variantId: number, nextQuantity: number) {

    setCart((current) => current.map((line) => {

      if (line.variant.variantId !== variantId) return line;

      return { ...line, quantity: Math.max(1, Math.min(line.stock, nextQuantity)) };

    }));

  }

  function removeLine(variantId: number) {

    setCart((current) => current.filter((line) => line.variant.variantId !== variantId));

  }

  async function completeSale() {

    setError("");

    setNotice("");

    const trimmedName = customerName.trim();

    const phoneDigits = customerPhone.replace(/\D/g, "");

    if (!cart.length) {

      setError("Add at least one item to the bill before completing the sale.");

      return;

    }

    if (!trimmedName) {

      setError("Customer name is required.");

      return;

    }

    if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(trimmedName)) {

      setError("Enter a valid customer name (letters, spaces, dots, apostrophes or hyphens; at least 2 characters).");

      return;

    }

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {

      setError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");

      return;

    }

    if (!Number.isFinite(Number(billDiscount)) || Number(billDiscount) < 0 || Number(billDiscount) > subtotal) {

      setError("Discount must be between ₹0 and the bill subtotal.");

      return;

    }

    setSubmitting(true);

    try {

      const result = await createInStoreSale({

        customerName: trimmedName,

        customerPhone: phoneDigits,

        paymentMethod,

        items: cart.map((line) => ({

          variantId: line.variant.variantId,

          quantity: line.quantity,

          // The backend accepts a per-unit fixed discount. Allocate the single bill discount

          // proportionally by unit price so all item discounts add up to the entered bill discount.

          discount: subtotal > 0 ? (totalDiscount * Number(line.variant.price)) / subtotal : 0,

        })),

      });

      const total = Number(result.totalAmount ?? totalPayable);

      const savedDiscount = totalDiscount;

      setCompletedSale({

        saleNumber: result.saleNumber,

        total,

        totalDiscount: savedDiscount,

        customerPhone: phoneDigits,

        customerName: trimmedName,

      });

      setNotice(`Sale ${result.saleNumber} completed. Inventory was updated and an invoice was generated by the backend.`);

      setCart([]);

      setBillDiscount(0);

      setCustomerName("");

      setCustomerPhone("");

      await loadCatalog();

    } catch (err) {

      setError(err instanceof Error ? err.message : "The sale could not be completed.");

    } finally {

      setSubmitting(false);

    }

  }

  function sendInvoiceOnWhatsApp() {

    if (!completedSale) {

      setError("Complete a sale before sharing its invoice.");

      return;

    }

    // WhatsApp requires an international number without spaces or symbols.

    const digits = completedSale.customerPhone.replace(/\D/g, "");

    const whatsappNumber = digits.length === 10 ? `91${digits}` : digits;

    if (!whatsappNumber || whatsappNumber.length < 10) {

      setError("Enter a valid customer WhatsApp number before sharing.");

      return;

    }

    const message = [

      `Hello ${completedSale.customerName}!`,

      "",

      "Thank you for shopping at UNIQUE ZONE – The Fashion Garage.",

      "",

      `Invoice reference: ${completedSale.saleNumber}`,

      `Discount: ${currency(completedSale.totalDiscount)}`,

      `Total payable: ${currency(completedSale.total)}`,

      "",

      "Thank you for shopping with us!",

    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");

  }

  return (

    <section className="uz-pos-page">

      <header className="uz-pos-header">

        <div>

          <p className="uz-pos-eyebrow">UNIQUE ZONE · THE FASHION GARAGE</p>

          <h1>In-Store Billing</h1>

          <p className="uz-pos-subtitle">Search by product name, size and colour, identify the exact item, then add it to the bill.</p>

        </div>

        <button type="button" className="uz-pos-refresh" onClick={() => void loadCatalog()} disabled={loading || submitting}>

          {loading ? "Loading…" : "Refresh catalogue"}

        </button>

      </header>

      {error && <div className="uz-pos-alert uz-pos-alert-error" role="alert"><strong>Unable to continue</strong><p>{error}</p></div>}

      {notice && (

        <div className="uz-pos-alert uz-pos-alert-success" role="status">

          <strong>Sale completed</strong>

          <p>{notice}</p>

          {completedSale && (

            <>

              <p className="uz-pos-sale-summary">

                Invoice reference: <b>{completedSale.saleNumber}</b>

                {" · "}

                Discount: <b>{currency(completedSale.totalDiscount)}</b>

                {" · "}

                Total payable: <b>{currency(completedSale.total)}</b>

              </p>

              {completedSale.customerPhone && (

                <button

                  type="button"

                  className="uz-pos-whatsapp-button"

                  onClick={sendInvoiceOnWhatsApp}

                >

                  Send invoice on WhatsApp

                </button>

              )}

            </>

          )}

        </div>

      )}

      <div className="uz-pos-layout">

        <section className="uz-pos-catalog" aria-label="Product catalogue">

          <form className="uz-pos-search" onSubmit={searchProducts}>

            <div className="uz-pos-search-grid">

              <label>Product name or product ID

                <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="e.g. Casual Shirt" />

              </label>

              <label>Size

                <input value={sizeQuery} onChange={(event) => setSizeQuery(event.target.value)} placeholder="e.g. L, XL" />

              </label>

              <label>Colour

                <input value={colorQuery} onChange={(event) => setColorQuery(event.target.value)} placeholder="e.g. Black, Navy Blue" />

              </label>

            </div>

            <div className="uz-pos-search-actions">

              <button type="submit" className="uz-pos-primary">Search matching items</button>

              <button type="button" className="uz-pos-secondary" onClick={() => { setProductQuery(""); setSizeQuery(""); setColorQuery(""); setAppliedSearch({ product: "", size: "", color: "" }); setShowAllProducts(false); }}>Clear filters</button>

            </div>

          </form>

          <div className="uz-pos-results-heading">

            <div><h2>Matching products</h2><p>Choose the image that matches the customer's item.</p></div>

            <span>{filteredItems.length} variant{filteredItems.length === 1 ? "" : "s"}</span>

          </div>

          {loading ? (

            <div className="uz-pos-empty">Loading products, variants, stock and uploaded images…</div>

          ) : filteredItems.length === 0 ? (

            <div className="uz-pos-empty">No matching variants found. Try a shorter product name or leave size/colour blank.</div>

          ) : (
            <>
              <div className="uz-pos-product-grid">
                {(showAllProducts
                  ? filteredItems
                  : filteredItems.slice(0, PRODUCTS_TO_SHOW)
                ).map((item) => (
                  <article className="uz-pos-product-card" key={item.variant.variantId}>
                    <div className="uz-pos-product-image">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={`${item.variant.productName}, ${item.variant.color}, size ${item.variant.size}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="uz-pos-no-image">
                          <span>No product image</span>
                          <small>Upload one in Product Management</small>
                        </div>
                      )}
                      <span
                        className={`uz-pos-stock-pill${
                          item.stock === 0 ? " is-out" : item.stock < 5 ? " is-low" : ""
                        }`}
                      >
                        {item.stock === 0 ? "Out of stock" : `${item.stock} in stock`}
                      </span>
                    </div>

                    <div className="uz-pos-product-info">
                      <h3>{item.product?.productName ?? item.variant.productName}</h3>
                      <p className="uz-pos-product-variant">
                        {item.variant.color || "Colour not set"} <span>·</span> Size {item.variant.size || "—"}
                      </p>
                      <strong className="uz-pos-product-price">
                        {currency(Number(item.variant.price))}
                      </strong>
                      <button
                        type="button"
                        className="uz-pos-add-button"
                        disabled={item.stock < 1 || submitting}
                        onClick={() => addToBill(item)}
                      >
                        {item.stock < 1 ? "Out of stock" : "Add to bill"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {filteredItems.length > PRODUCTS_TO_SHOW && (
                <button
                  type="button"
                  className="uz-pos-view-toggle"
                  onClick={() => setShowAllProducts((previous) => !previous)}
                  aria-expanded={showAllProducts}
                >
                  {showAllProducts
                    ? "View Less ↑"
                    : `View More (${filteredItems.length - PRODUCTS_TO_SHOW} more) ↓`}
                </button>
              )}
            </>
          )}

        </section>

        <aside className="uz-pos-bill" aria-label="Current bill">

          <div className="uz-pos-bill-heading"><div><p className="uz-pos-eyebrow">CURRENT TRANSACTION</p><h2>Customer Bill</h2></div><span className="uz-pos-item-count">{itemCount} item{itemCount === 1 ? "" : "s"}</span></div>

          <div className="uz-pos-customer-fields">

            <label>Customer name <span>Required</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Enter customer name" autoComplete="name" maxLength={60} required aria-required="true" /></label>

            <label>Customer phone <span>Required</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" placeholder="10-digit mobile number" autoComplete="tel-national" maxLength={10} pattern="[6-9][0-9]{9}" title="Enter 10 digits starting with 6, 7, 8, or 9" required aria-required="true" /></label>

          </div>

          <div className="uz-pos-cart-lines">

            {cart.length === 0 ? <div className="uz-pos-cart-empty"><span className="uz-pos-cart-icon">＋</span><strong>Your bill is empty</strong><p>Search for an item and select “Add to bill”.</p></div> : cart.map((line) => (

              <article className="uz-pos-cart-line" key={line.variant.variantId}>

                {line.imageUrl ? <img src={line.imageUrl} alt="" /> : <div className="uz-pos-cart-image-placeholder">—</div>}

                <div className="uz-pos-cart-line-main"><strong>{line.variant.productName}</strong><span>{line.variant.color} · {line.variant.size}</span><small>{currency(Number(line.variant.price))} each · max {line.stock}</small>

                  <div className="uz-pos-quantity-control"><button type="button" aria-label="Decrease quantity" disabled={line.quantity <= 1} onClick={() => changeQuantity(line.variant.variantId, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" aria-label="Increase quantity" disabled={line.quantity >= line.stock} onClick={() => changeQuantity(line.variant.variantId, line.quantity + 1)}>+</button><button type="button" className="uz-pos-remove" onClick={() => removeLine(line.variant.variantId)}>Remove</button></div>

                </div>

                <div className="uz-pos-line-pricing">

                  <strong className="uz-pos-line-total">{currency(Number(line.variant.price) * line.quantity)}</strong>

                </div>

              </article>

            ))}

          </div>

          <div className="uz-pos-payment-method"><span>Payment method</span><div className="uz-pos-payment-options"><button type="button" className={paymentMethod === "CASH" ? "active" : ""} onClick={() => setPaymentMethod("CASH")}><span>₹</span> Cash</button><button type="button" className={paymentMethod === "UPI" ? "active" : ""} onClick={() => setPaymentMethod("UPI")}><span>⌁</span> UPI</button></div></div>

          <div className="uz-pos-totals">

            <div><span>Items</span><span>{itemCount}</span></div>

            <div><span>Subtotal</span><span>{currency(subtotal)}</span></div>

            <label className="uz-pos-bill-discount">

              <span>Discount on total bill (₹)</span>

              <input

                type="number"

                min="0"

                max={subtotal}

                step="0.01"

                inputMode="decimal"

                value={billDiscount}

                disabled={submitting || cart.length === 0}

                onChange={(event) => {

                  const value = event.target.value === "" ? 0 : Number(event.target.value);

                  setBillDiscount(Number.isFinite(value) ? Math.min(subtotal, Math.max(0, value)) : 0);

                }}

                aria-label="Discount on total bill in rupees"

              />

            </label>

            <div><span>Total discount</span><span>−{currency(totalDiscount)}</span></div>

            <div className="uz-pos-grand-total"><strong>Total payable</strong><strong>{currency(totalPayable)}</strong></div>

          </div>

          <button type="button" className="uz-pos-complete" disabled={!cart.length || submitting || loading} onClick={() => void completeSale()}>{submitting ? "Saving sale…" : "Confirm sale & generate invoice"}</button>

          <p className="uz-pos-stock-note">Stock is deducted by the backend only when the sale is successfully saved. The backend also creates the invoice.</p>

        </aside>

      </div>

    </section>

  );

}
