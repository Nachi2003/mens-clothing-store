import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";
import {
    getProductImages,
    uploadProductImage,
    getProductImageUrl,
    type ProductImage,
} from "../services/productImageService";

import { getCategories, type Category } from "../services/categoryService";
import {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
} from "../services/productVariantService";
import {
    getInventory,
    createInventory,
    updateInventory,
    type Inventory,
} from "../services/inventoryService";
import type { Product } from "../types/Product";
import type { ProductVariant } from "../types/ProductVariant";
import Icon from "../components/AdminIcons";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size",
  "28", "30", "32", "34", "36", "38", "40", "42", "44", "46",
];


const PAGE_SIZE = 8;

// UI-only threshold used to highlight low stock. The backend does not
// currently expose a per-variant reorder level.
const LOW_STOCK_THRESHOLD = 5;

const rupee = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

type StockStatus = "active" | "low" | "out";
type StatusFilter = "all" | StockStatus;

const STATUS_LABEL: Record<StockStatus, string> = {
    active: "Active",
    low: "Low Stock",
    out: "Out of Stock",
};

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "low", label: "Low Stock" },
    { value: "out", label: "Out of Stock" },
];


/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */


function isHexColor(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

// Returns "#RRGGBB" (upper-case) for "#rrggbb" or "rrggbb", otherwise "".
function normalizeHex(value: string): string {
    const input = value.trim();

    if (isHexColor(input)) {
        return input.toUpperCase();
    }

    if (/^[0-9a-fA-F]{6}$/.test(input)) {
        return `#${input.toUpperCase()}`;
    }

    return "";
}

const CSS_GLOBAL_KEYWORDS = new Set([
    "inherit",
    "initial",
    "unset",
    "revert",
    "currentcolor",
    "transparent",
]);

let colorContext: CanvasRenderingContext2D | null | undefined;

// Turns a stored colour value (HEX or a CSS colour name such as "navy")
// into "#RRGGBB" for previews. Returns null when it cannot be previewed,
// e.g. "Navy Blue". The stored value itself is never changed by this.
function resolveColor(value: string): string | null {
    const input = value.trim();
    if (!input) return null;

    const hex = normalizeHex(input);
    if (hex) return hex;

    const candidate = input.replace(/\s+/g, "").toLowerCase();
    if (
        !/^[a-z]+$/.test(candidate) ||
        CSS_GLOBAL_KEYWORDS.has(candidate) ||
        typeof CSS === "undefined" ||
        !CSS.supports("color", candidate)
    ) {
        return null;
    }

    if (colorContext === undefined) {
        colorContext = document.createElement("canvas").getContext("2d");
    }
    if (!colorContext) return null;

    colorContext.fillStyle = "#000000";
    colorContext.fillStyle = candidate;
    const resolved = colorContext.fillStyle;

    return typeof resolved === "string" && resolved.startsWith("#")
        ? resolved.toUpperCase()
        : null;
}
type VariantRow = {
    rowId: number;
    variantId?: number;
    size: string;
    color: string;
    price: string;
    quantity: string;
}
type VariantField = keyof Omit<VariantRow, "rowId" | "variantId">;

const createEmptyVariant = (rowId: number): VariantRow => ({
    rowId,
    size: "M",
    color: "",
    price: "",
    quantity: "0",
});

function VariantRowEditor({
    row,
    index,
    canRemove,
    disabled,
    onChange,
    onRemove,
}: {
    row: VariantRow;
    index: number;
    canRemove: boolean;
    disabled: boolean;
    onChange: (field: VariantField, value: string) => void;
    onRemove: () => void;
}) {
    const label = `Variant ${index + 1}`;

    return (
        <div className="pmx-vrow" role="group" aria-label={label}>
            <label className="pmx-vcell">
                <span className="pmx-vlabel">Size</span>
                <select
                    value={row.size}
                    onChange={(event) => onChange("size", event.target.value)}
                    disabled={disabled}
                    required>
                    {SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </label>

            <div className="pmx-vcell pmx-vcell-color">
                <label className="pmx-vlabel" htmlFor={`pmx-color-${row.rowId}`}>
                    Color
                </label>
                <input
                    id={`pmx-color-${row.rowId}`}
                    value={row.color}
                    onChange={(event) => onChange("color", event.target.value)}
                    placeholder="Navy Blue, Olive Green, or Black"
                    maxLength={80}
                    disabled={disabled}
                    required
                />
            </div>

            <label className="pmx-vcell">
                <span className="pmx-vlabel">Price (₹)</span>
                <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={row.price}
                    onChange={(event) => onChange("price", event.target.value)}
                    placeholder="799"
                    disabled={disabled}
                    required
                />
            </label>

            <label className="pmx-vcell">
                <span className="pmx-vlabel">Stock</span>
                <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={row.quantity}
                    onChange={(event) => onChange("quantity", event.target.value)}
                    disabled={disabled}
                    required
                />
            </label>

            <div className="pmx-vcell pmx-vcell-action">
                <button
                    type="button"
                    className="pmx-icon-btn pmx-icon-btn-danger"
                    onClick={onRemove}
                    disabled={!canRemove || disabled}
                    aria-label={`Remove ${label}`}
                    title="Remove variant"
                >
                    <Icon name="trash" size={17} />
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type ProductRow = {
    product: Product;
    variants: ProductVariant[];
    totalStock: number;
    status: StockStatus;
};

export default function ProductManagementPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Each selected image can be assigned independently; multiple images may share a colour.
  const [selectedImageColors, setSelectedImageColors] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [productImages, setProductImages] = useState<
    Record<number, ProductImage[]>
  >({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [inventory, setInventory] = useState<Inventory[]>([]);

    const [showForm, setShowForm] = useState(true);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [categoryId, setCategoryId] = useState("");
    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [variantRows, setVariantRows] = useState<VariantRow[]>([
        createEmptyVariant(1),
    ]);
    const [nextRowId, setNextRowId] = useState(2);

    // Bulk size builder: one color/price can generate separate variant rows.
    // Each generated row retains its own editable stock quantity below.
    const [bulkSizes, setBulkSizes] = useState<string[]>([]);
    const [bulkColor, setBulkColor] = useState("");
    const [bulkPrice, setBulkPrice] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState<Set<Product["productId"]>>(
        () => new Set()
    );

    const [loading, setLoading] = useState(false);
    const [loadedOnce, setLoadedOnce] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadData() {
        setLoading(true);
        setError("");

        try {
            const [categoryData, productData, variantData, inventoryData] =
                await Promise.all([
                    getCategories(),
                    getProducts(),
                    getProductVariants(),
                    getInventory(),
                ]);

            setCategories(categoryData);
            setProducts(productData);
            setVariants(variantData);
            setInventory(inventoryData);

            const imageResults = await Promise.all(
                productData.map(async (product) => {
                    try {
                        const images = await getProductImages(product.productId);
                        return [product.productId, images] as const;
                    } catch (imageError) {
                        console.error(
                            `Failed to load images for product ${product.productId}:`,
                            imageError
                        );
                        return [product.productId, []] as const;
                    }
                })
            );

            setProductImages(Object.fromEntries(imageResults));
            setLoadedOnce(true);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load product data."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
    }, []);

    /* ---- derived data ---- */

    const productRows = useMemo<ProductRow[]>(() => {
        const byProduct = new Map<ProductVariant["productId"], ProductVariant[]>();
        for (const variant of variants) {
            const list = byProduct.get(variant.productId);
            if (list) list.push(variant);
            else byProduct.set(variant.productId, [variant]);
        }

        const stock = new Map<Inventory["variantId"], number>();
        for (const item of inventory) stock.set(item.variantId, item.quantity);

        return products.map((product) => {
            const productVariants = byProduct.get(product.productId) ?? [];
            const quantities = productVariants.map(
                (variant) => stock.get(variant.variantId) ?? 0
            );
            const totalStock = quantities.reduce((sum, qty) => sum + qty, 0);

            let status: StockStatus = "active";
            if (totalStock === 0) status = "out";
            else if (quantities.some((qty) => qty <= LOW_STOCK_THRESHOLD)) {
                status = "low";
            }

            return { product, variants: productVariants, totalStock, status };
        });
    }, [products, variants, inventory]);

    const stockByVariant = useMemo(() => {
        const map = new Map<Inventory["variantId"], number>();
        for (const item of inventory) map.set(item.variantId, item.quantity);
        return map;
    }, [inventory]);

    const lowStockCount = productRows.filter((row) => row.status === "low").length;

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return productRows.filter(({ product, status }) => {
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!query) return true;

            return (
                product.productName.toLowerCase().includes(query) ||
                (product.categoryName ?? "").toLowerCase().includes(query) ||
                (product.description ?? "").toLowerCase().includes(query)
            );
        });
    }, [productRows, search, statusFilter]);

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

    function toggleExpanded(productId: Product["productId"]) {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    }

    /* ---- variant row handlers ---- */

    function updateVariantRow(
        rowId: number,
        field: VariantField,
        value: string
    ) {
        setVariantRows((rows) =>
            rows.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
        );
    }

    function addVariantRow() {
        setVariantRows((rows) => [...rows, createEmptyVariant(nextRowId)]);
        setNextRowId((id) => id + 1);
    }

    function addSelectedSizesForColor() {
        setError("");
        const color = normalizeHex(bulkColor) || bulkColor.trim();
        const price = Number(bulkPrice);

        if (!color) {
            setError("Enter or choose a color before adding sizes.");
            return;
        }
        if (!bulkPrice.trim() || !Number.isFinite(price) || price <= 0) {
            setError("Enter a price greater than zero for the selected sizes.");
            return;
        }
        if (bulkSizes.length === 0) {
            setError("Select at least one size using the checkboxes.");
            return;
        }

        const existing = new Set(variantRows.map((row) =>
            `${row.size.trim().toLowerCase()}|${(normalizeHex(row.color) || row.color.trim()).toLowerCase()}`
        ));
        const duplicates = bulkSizes.filter((size) =>
            existing.has(`${size.toLowerCase()}|${color.toLowerCase()}`)
        );
        if (duplicates.length) {
            setError(`These size/color variants already exist: ${duplicates.join(", ")}. Remove the duplicate selection or edit the existing row.`);
            return;
        }

        const sortedSizes = SIZES.filter((size) => bulkSizes.includes(size));
        const newRows = sortedSizes.map((size, index) => ({
            rowId: nextRowId + index,
            size,
            color,
            price: String(price),
            quantity: "0",
        }));
        setVariantRows((rows) => {
            const hasOnlyUntouchedPlaceholder = rows.length === 1 &&
                rows[0].variantId === undefined &&
                !rows[0].color.trim() &&
                !rows[0].price.trim();
            return hasOnlyUntouchedPlaceholder ? newRows : [...rows, ...newRows];
        });
        setNextRowId((id) => id + newRows.length);
        setBulkSizes([]);
        setSuccess(`Added ${newRows.length} size variant${newRows.length === 1 ? "" : "s"} for ${color}. Set each size's stock separately below.`);
    }

    function removeVariantRow(rowId: number) {
        setVariantRows((rows) =>
            rows.length > 1 ? rows.filter((row) => row.rowId !== rowId) : rows
        );
    }

    function startEditProduct(product: Product) {
        const productVariants = variants.filter((variant) => variant.productId === product.productId);
        const rows: VariantRow[] = productVariants.map((variant, index) => {
            const stockItem = inventory.find((item) => item.variantId === variant.variantId);
            return {
                rowId: index + 1,
                variantId: variant.variantId,
                size: variant.size,
                color: variant.color,
                price: String(variant.price),
                quantity: String(stockItem?.quantity ?? 0),
            };
        });

        setEditingProductId(Number(product.productId));
        setCategoryId(String(product.categoryId));
        setProductName(product.productName);
        setDescription(product.description ?? "");
        setVariantRows(rows.length ? rows : [createEmptyVariant(1)]);
        setNextRowId(Math.max(1, ...rows.map((row) => row.rowId)) + 1);
        setBulkSizes([]);
        setBulkColor("");
        setBulkPrice("");
        setSelectedImages([]);
        setSelectedImageColors([]);
        setImagePreviews((previous) => {
            previous.forEach((url) => URL.revokeObjectURL(url));
            return [];
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
        setError("");
        setSuccess("");
        setShowForm(true);
        document.getElementById("pmx-add-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetProductForm() {
        setEditingProductId(null);
        setCategoryId("");
        setProductName("");
        setDescription("");
        setVariantRows([createEmptyVariant(nextRowId)]);
        setNextRowId((id) => id + 1);
        setBulkSizes([]);
        setBulkColor("");
        setBulkPrice("");
        setSelectedImages([]);
        setSelectedImageColors([]);
        setImagePreviews((previous) => {
            previous.forEach((url) => URL.revokeObjectURL(url));
            return [];
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
        setError("");
    }

    async function handleDeleteProduct(product: Product) {
        const confirmed = window.confirm(
            `Delete "${product.productName}"? This action may be blocked if the product has related orders or inventory records.`
        );
        if (!confirmed) return;

        setError("");
        setSuccess("");
        setSaving(true);
        try {
            await deleteProduct(Number(product.productId));
            setSuccess(`"${product.productName}" was deleted.`);
            setExpanded((current) => {
                const next = new Set(current);
                next.delete(product.productId);
                return next;
            });
            await loadData();
        } catch (err) {
            setError(err instanceof Error
                ? `Could not delete "${product.productName}". It may be linked to variants, inventory, or orders. Details: ${err.message}`
                : "Could not delete this product because related records may exist.");
        } finally {
            setSaving(false);
        }
    }

    function handleImageChange(fileList: FileList | null) {
        if (!fileList) return;

        const files = Array.from(fileList);
        if (files.length === 0) return;

        const invalidFile = files.find((file) => !file.type.startsWith("image/"));
        if (invalidFile) {
            setError(`"${invalidFile.name}" is not a valid image file.`);
            return;
        }

        const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);
        if (oversizedFile) {
            setError(`"${oversizedFile.name}" exceeds the 5 MB limit.`);
            return;
        }

        const existingKeys = new Set(
            selectedImages.map((file) => `${file.name}:${file.size}:${file.lastModified}`)
        );
        const newFiles = files.filter(
            (file) => !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`)
        );
        if (newFiles.length === 0) {
            if (imageInputRef.current) imageInputRef.current.value = "";
            return;
        }

        setError("");
        setSelectedImages((current) => [...current, ...newFiles]);
        setImagePreviews((current) => [
            ...current,
            ...newFiles.map((file) => URL.createObjectURL(file)),
        ]);
        // If there is only one colour variant, preselect it; otherwise require assignment per image.
        const availableColors = Array.from(
            new Set(variantRows.map((row) => row.color.trim()).filter(Boolean))
        );
        const defaultColor = availableColors.length === 1 ? availableColors[0] : "";
        setSelectedImageColors((current) => [...current, ...newFiles.map(() => defaultColor)]);

        if (imageInputRef.current) imageInputRef.current.value = "";
    }

    function removeSelectedImage(index: number) {
        setSelectedImages((current) => current.filter((_, i) => i !== index));
        setSelectedImageColors((current) => current.filter((_, i) => i !== index));
        setImagePreviews((current) => {
            const removed = current[index];
            if (removed) URL.revokeObjectURL(removed);
            return current.filter((_, i) => i !== index);
        });
    }

    async function loadImagesForProduct(productId: number) {
        try {
            const images = await getProductImages(productId);

            setProductImages((current) => ({
                ...current,
                [productId]: images,
            }));
        } catch (err) {
            console.error("Unable to load product images:", err);
        }
    }

    async function uploadImagesForProduct(productId: number) {
        if (selectedImages.length === 0) return;

        const missingColorIndex = selectedImageColors.findIndex((color) => !color.trim());
        if (missingColorIndex !== -1) {
            throw new Error(
                `Please assign a colour to image "${selectedImages[missingColorIndex]?.name ?? `#${missingColorIndex + 1}`}" before saving.`
            );
        }

        setImageUploading(true);
        try {
            // The existing backend accepts one file per request. The same colour
            // can be assigned to any number of images.
            for (let index = 0; index < selectedImages.length; index += 1) {
                await uploadProductImage(
                    productId,
                    selectedImages[index],
                    index === 0,
                    selectedImageColors[index].trim()
                );
            }

            setSelectedImages([]);
            setSelectedImageColors([]);
            setImagePreviews((previous) => {
                previous.forEach((url) => URL.revokeObjectURL(url));
                return [];
            });
            if (imageInputRef.current) imageInputRef.current.value = "";
            await loadImagesForProduct(productId);
        } finally {
            setImageUploading(false);
        }
    }

    /* ---- submit ---- */

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;

        setError("");
        setSuccess("");

        if (!categoryId || !productName.trim()) {
            setError("Please select a category and enter a product name.");
            return;
        }

        if (productName.trim().length > 150) {
            setError("Product name cannot exceed 150 characters.");
            return;
        }

        if (description.length > 500) {
            setError("Description cannot exceed 500 characters.");
            return;
        }

        // Colour is saved as entered, except that a bare or lower-case HEX is
        // normalised to "#RRGGBB" so storefront colour matching stays consistent.
        const cleanedRows = variantRows.map((row) => ({
            ...row,
            size: row.size.trim(),
            color: normalizeHex(row.color) || row.color.trim(),
        }));

        for (const row of cleanedRows) {
            if (!row.size || !row.color) {
                setError("Please enter a size and color for every variant.");
                return;
            }

            const price = Number(row.price);
            const quantity = Number(row.quantity);

            if (!row.price.trim() || !Number.isFinite(price) || price <= 0) {
                setError("Every variant must have a price greater than zero.");
                return;
            }

            if (
                row.quantity.trim() === "" ||
                !Number.isInteger(quantity) ||
                quantity < 0
            ) {
                setError("Stock quantity must be a whole number of zero or more.");
                return;
            }
        }

        const combinations = cleanedRows.map(
            (row) => `${row.size.toLowerCase()}|${row.color.toLowerCase()}`
        );

        if (new Set(combinations).size !== combinations.length) {
            setError("Duplicate size and color combinations are not allowed.");
            return;
        }

        if (selectedImages.length > 0) {
            const missingColorIndex = selectedImageColors.findIndex((color) => !color.trim());
            if (missingColorIndex !== -1) {
                setError(`Please assign a colour to image "${selectedImages[missingColorIndex]?.name ?? `#${missingColorIndex + 1}`}".`);
                return;
            }
        }

        let savedProduct: Product | null = null;

        setSaving(true);

        try {
            const productRequest = {
                categoryId: Number(categoryId),
                productName: productName.trim(),
                description: description.trim(),
            };

            savedProduct = editingProductId !== null
                ? await updateProduct(editingProductId, productRequest)
                : await createProduct(productRequest);

            if (selectedImages.length > 0) {
                await uploadImagesForProduct(Number(savedProduct.productId));
            }

            for (const row of cleanedRows) {
                if (row.variantId !== undefined) {
                    await updateProductVariant(Number(row.variantId), {
                        productId: Number(savedProduct.productId),
                        size: row.size,
                        color: row.color,
                        price: Number(row.price),
                    });

                    const existingStock = inventory.find(
                        (item) => Number(item.variantId) === Number(row.variantId)
                    );
                    if (existingStock) {
                        await updateInventory(Number(row.variantId), {
                            variantId: Number(row.variantId),
                            quantity: Number(row.quantity),
                        });
                    } else {
                        await createInventory({
                            variantId: Number(row.variantId),
                            quantity: Number(row.quantity),
                        });
                    }
                } else {
                    const createdVariant = await createProductVariant({
                        productId: Number(savedProduct.productId),
                        size: row.size,
                        color: row.color,
                        price: Number(row.price),
                    });
                    await createInventory({
                        variantId: Number(createdVariant.variantId),
                        quantity: Number(row.quantity),
                    });
                }
            }

            setSuccess(
                editingProductId !== null
                    ? `Product "${savedProduct.productName}" updated successfully.`
                    : `"${savedProduct.productName}" saved with ${cleanedRows.length} variant${cleanedRows.length === 1 ? "" : "s"}.`
            );
            resetProductForm();
            setShowForm(false);
            await loadData();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(
                savedProduct
                    ? `Product details were saved, but a variant, stock, or image update failed. Refresh and check existing records before retrying. Details: ${message}`
                    : message
            );
            if (savedProduct) await loadData();
        } finally {
            setSaving(false);
        }
    }

    const busy = loading || saving;
    const statValue = (value: number) => (loadedOnce ? String(value) : "—");

    return (
        <div className="pmx-page">
            <header className="pmx-header">
                <div>
                    <h1>Product Management</h1>
                    <p className="pmx-subtitle">
                        Manage products, sizes, colors and stock.
                    </p>
                </div>

                <button
                    type="button"
                    className="pmx-btn pmx-btn-primary"
                    onClick={() => setShowForm((open) => !open)}
                    aria-expanded={showForm}
                    aria-controls="pmx-add-form"
                >
                    <Icon name="plus" size={18} />
                    Add Product
                </button>
            </header>

            <section className="pmx-stats" aria-label="Product summary">
                <div className="pmx-stat">
                    <span className="pmx-stat-icon">
                        <Icon name="box" size={24} />
                    </span>
                    <div>
                        <span className="pmx-stat-label">Total Products</span>
                        <strong className="pmx-stat-value">
                            {statValue(products.length)}
                        </strong>
                    </div>
                </div>

                <div className="pmx-stat">
                    <span className="pmx-stat-icon">
                        <Icon name="tag" size={24} />
                    </span>
                    <div>
                        <span className="pmx-stat-label">Variants</span>
                        <strong className="pmx-stat-value">
                            {statValue(variants.length)}
                        </strong>
                    </div>
                </div>

                <div className="pmx-stat">
                    <span className="pmx-stat-icon">
                        <Icon name="warning" size={24} />
                    </span>
                    <div>
                        <span className="pmx-stat-label">Low Stock</span>
                        <strong className="pmx-stat-value pmx-stat-value-alert">
                            {statValue(lowStockCount)}
                        </strong>
                    </div>
                </div>
            </section>

            {success && (
                <div className="pmx-alert pmx-alert-success" role="status">
                    {success}
                </div>
            )}
            {error && !showForm && (
                <div className="pmx-alert pmx-alert-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        className="pmx-alert-action"
                        onClick={() => void loadData()}
                        disabled={busy}
                    >
                        Try again
                    </button>
                </div>
            )}

            {showForm && (
                <section className="pmx-panel" id="pmx-add-form">
                    <h2>{editingProductId !== null ? "Edit Product" : "Add New Product"}</h2>

                    <form className="pmx-form" onSubmit={handleSubmit}>
                        <div className="pmx-form-grid">
                            <label className="pmx-field">
                                <span>
                                    Product Name <i className="pmx-req">*</i>
                                </span>
                                <input
                                    value={productName}
                                    onChange={(event) => setProductName(event.target.value)}
                                    placeholder="e.g. Casual Shirt"
                                    maxLength={150}
                                    disabled={saving}
                                    required
                                />
                            </label>

                            <label className="pmx-field">
                                <span>
                                    Category <i className="pmx-req">*</i>
                                </span>
                                <select
                                    value={categoryId}
                                    onChange={(event) => setCategoryId(event.target.value)}
                                    disabled={saving}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.categoryId}
                                            value={category.categoryId}
                                        >
                                            {category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="pmx-field pmx-span-2">
                                <span>Description</span>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Fabric, fit and care details"
                                    maxLength={500}
                                    rows={3}
                                    disabled={saving}
                                />
                                <small className="pmx-counter">{description.length}/500</small>
                            </label>
                        </div>
                        <div className="pmx-field pmx-span-2">
                            <span>Product Images</span>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={saving || imageUploading}
                                onChange={(event) => handleImageChange(event.target.files)}
                            />
                            <small className="pmx-counter">
                                Select multiple images (maximum 5 MB each). Assign a colour to every image below; several images may use the same colour. Images upload when you save the product.
                            </small>

                            {imagePreviews.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 12 }}>
                                    {imagePreviews.map((preview, index) => (
                                        <div key={`${preview}-${index}`} style={{ minWidth: 0 }}>
                                            <img
                                                src={preview}
                                                alt={`Selected product image ${index + 1}`}
                                                style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10, border: "1px solid #ddd" }}
                                            />
                                            <div style={{ fontSize: 12, marginTop: 4, overflowWrap: "anywhere" }}>
                                                {selectedImages[index]?.name}
                                            </div>
                                            <label style={{ display: "block", marginTop: 8, fontSize: 12 }}>
                                                <span style={{ display: "block", marginBottom: 4 }}>Image colour *</span>
                                                <select
                                                    value={selectedImageColors[index] ?? ""}
                                                    onChange={(event) =>
                                                        setSelectedImageColors((current) =>
                                                            current.map((color, colorIndex) =>
                                                                colorIndex === index ? event.target.value : color
                                                            )
                                                        )
                                                    }
                                                    disabled={saving || imageUploading}
                                                    required
                                                    style={{ width: "100%", minWidth: 0 }}
                                                >
                                                    <option value="">Select colour</option>
                                                    {Array.from(
                                                        new Set(variantRows.map((row) => row.color.trim()).filter(Boolean))
                                                    ).map((color) => (
                                                        <option key={color.toLowerCase()} value={color}>{color}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <button
                                                type="button"
                                                className="pmx-btn"
                                                disabled={saving || imageUploading}
                                                onClick={() => removeSelectedImage(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="pmx-variants-section">
                            <h3>Product Variants</h3>
                            <p className="pmx-subtitle">
                                Select several sizes for one color to create separate variants. Each size gets its own stock field.
                            </p>

                            <section
                                aria-label="Add multiple sizes for one colour"
                                style={{
                                    border: "1px solid var(--pmx-line, #e5e1da)",
                                    borderRadius: 12,
                                    padding: 16,
                                    margin: "14px 0 18px",
                                    background: "var(--pmx-surface-soft, #fbf9f5)",
                                }}
                            >
                                <h4 style={{ margin: "0 0 12px", fontSize: 15 }}>
                                    Add multiple sizes for one colour
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 12, alignItems: "end" }}>
                                    <div className="pmx-vcell">
                                        <label className="pmx-vlabel" htmlFor="pmx-bulk-color">Color</label>
                                        <input
                                            id="pmx-bulk-color"
                                            value={bulkColor}
                                            onChange={(event) => setBulkColor(event.target.value)}
                                            placeholder="Black, Navy Blue, or Olive Green"
                                            maxLength={80}
                                            disabled={saving}
                                        />
                                    </div>
                                    <label className="pmx-vcell">
                                        <span className="pmx-vlabel">Price per variant (₹)</span>
                                        <input type="number" inputMode="decimal" min="0.01" step="0.01" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} placeholder="799" disabled={saving} />
                                    </label>
                                </div>
                                <div style={{ marginTop: 14 }}>
                                    <span className="pmx-vlabel" style={{ display: "block", marginBottom: 8 }}>Select sizes</span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
                                        {SIZES.map((size) => (
                                            <label key={size} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", border: "1px solid var(--pmx-line, #ded8cf)", borderRadius: 8, background: bulkSizes.includes(size) ? "#f1e7d7" : "white", cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                                                <input type="checkbox" checked={bulkSizes.includes(size)} disabled={saving} onChange={(event) => setBulkSizes((current) => event.target.checked ? [...current, size] : current.filter((item) => item !== size))} />
                                                <span>{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 14 }}>
                                    <button type="button" className="pmx-btn pmx-btn-primary" onClick={addSelectedSizesForColor} disabled={saving}>
                                        <Icon name="plus" size={17} /> Add selected sizes
                                    </button>
                                    <span style={{ color: "var(--pmx-muted, #6b665f)", fontSize: 12 }}>New variants start at 0 stock; adjust each quantity in the rows below.</span>
                                </div>
                            </section>

                            <div className="pmx-vtable">
                                <div className="pmx-vhead" aria-hidden="true">
                                    <span>
                                        Size <i className="pmx-req">*</i>
                                    </span>
                                    <span>
                                        Color <i className="pmx-req">*</i>
                                    </span>
                                    <span>
                                        Price (₹) <i className="pmx-req">*</i>
                                    </span>
                                    <span>
                                        Stock <i className="pmx-req">*</i>
                                    </span>
                                    <span>Action</span>
                                </div>

                                {variantRows.map((row, index) => (
                                    <VariantRowEditor
                                        key={row.rowId}
                                        row={row}
                                        index={index}
                                        canRemove={variantRows.length > 1 && row.variantId === undefined}
                                        disabled={saving}
                                        onChange={(field, value) =>
                                            updateVariantRow(row.rowId, field, value)
                                        }
                                        onRemove={() => removeVariantRow(row.rowId)}
                                    />
                                ))}
                            </div>

                            <p className="pmx-hint">
                                Enter a colour name such as Navy Blue, Olive Green, Mustard, or Black.
                                Upload each product image and assign it to the matching colour.
                            </p>
                        </div>

                        {error && (
                            <div className="pmx-alert pmx-alert-error" role="alert">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="pmx-form-actions">
                            <button
                                type="button"
                                className="pmx-btn pmx-btn-soft"
                                onClick={addVariantRow}
                                disabled={saving}
                            >
                                <Icon name="plus" size={18} />
                                Add Variant
                            </button>

                            <div className="pmx-form-actions-end">
                                <button
                                    type="submit"
                                    className="pmx-btn pmx-btn-primary"
                                    disabled={busy}
                                >
                                    {saving ? "Saving…" : editingProductId !== null ? "Update Product" : "Save Product"}
                                </button>
                                <button
                                    type="button"
                                    className="pmx-btn"
                                    onClick={() => {
                                        resetProductForm();
                                        setShowForm(false);
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            )}

            <section className="pmx-panel" aria-labelledby="pmx-list-title">
                <div className="pmx-toolbar">
                    <h2 id="pmx-list-title">Product Inventory</h2>

                    <label className="pmx-search">
                        <span className="pmx-sr-only">Search products or categories</span>
                        <Icon name="search" size={18} />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search products, category..."
                        />
                    </label>
                </div>

                <div className="pmx-pills" role="group" aria-label="Filter by stock">
                    {FILTER_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`pmx-pill${statusFilter === option.value ? " is-active" : ""}`}
                            aria-pressed={statusFilter === option.value}
                            onClick={() => {
                                setStatusFilter(option.value);
                                setPage(1);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {loading && !loadedOnce ? (
                    <ul className="pmx-skeleton-list" aria-label="Loading products">
                        {[0, 1, 2, 3].map((item) => (
                            <li key={item} className="pmx-skeleton" />
                        ))}
                    </ul>
                ) : filteredRows.length === 0 ? (
                    <div className="pmx-empty">
                        <strong>
                            {products.length === 0
                                ? "No products yet"
                                : "No products match your filters"}
                        </strong>
                        <p>
                            {products.length === 0
                                ? "Add your first product to start tracking stock."
                                : "Try a different search or choose another stock filter."}
                        </p>
                        {products.length > 0 && (
                            <button
                                type="button"
                                className="pmx-btn"
                                onClick={() => {
                                    setSearch("");
                                    setStatusFilter("all");
                                    setPage(1);
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="pmx-table-wrap">
                            <table className="pmx-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Image</th>
                                        <th scope="col">Product Name</th>
                                        <th scope="col">Category</th>
                                        <th scope="col">Variants</th>
                                        <th scope="col">Total Stock</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleRows.map(({ product, variants: rowVariants, totalStock, status }) => {
                                        const isOpen = expanded.has(product.productId);

                                        return (
                                            <Fragment key={product.productId}>
                                                <tr>
                                                    <td>
                                                        <div className="pmx-thumb">
                                                            {productImages[product.productId]?.find((image) => image.primary)
                                                                ?.imageUrl ? (
                                                                <img
                                                                    src={getProductImageUrl(
                                                                        productImages[product.productId]!.find(
                                                                            (image) => image.primary
                                                                        )!.imageUrl
                                                                    )}
                                                                    alt={product.productName}
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        objectFit: "cover",
                                                                        borderRadius: 8,
                                                                    }}
                                                                />
                                                            ) : (
                                                                product.productName.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="pmx-cell-name">
                                                        {product.productName}
                                                    </td>
                                                    <td>{product.categoryName}</td>
                                                    <td>{rowVariants.length}</td>
                                                    <td>{totalStock}</td>
                                                    <td>
                                                        <span className={`pmx-badge pmx-badge-${status}`}>
                                                            {STATUS_LABEL[status]}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="pmx-icon-btn"
                                                            onClick={() => toggleExpanded(product.productId)}
                                                            aria-expanded={isOpen}
                                                            aria-label={`${isOpen ? "Hide" : "Show"} variants for ${product.productName}`}
                                                            title={isOpen ? "Hide variants" : "View variants"}
                                                        >
                                                            <Icon name="eye" size={17} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pmx-icon-btn"
                                                            onClick={() => startEditProduct(product)}
                                                            disabled={busy}
                                                            aria-label={`Edit ${product.productName}`}
                                                            title="Edit product"
                                                        >
                                                            <Icon name="edit" size={17} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pmx-icon-btn pmx-icon-btn-danger"
                                                            onClick={() => void handleDeleteProduct(product)}
                                                            disabled={busy}
                                                            aria-label={`Delete ${product.productName}`}
                                                            title="Delete product"
                                                        >
                                                            <Icon name="trash" size={17} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {isOpen && (
                                                    <tr className="pmx-detail-row">
                                                        <td colSpan={7}>
                                                            {product.description && (
                                                                <p className="pmx-detail-desc">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                            {rowVariants.length === 0 ? (
                                                                <p className="pmx-detail-desc">No variants.</p>
                                                            ) : (
                                                                <ul className="pmx-chips">
                                                                    {rowVariants.map((variant) => {
                                                                        const stock = stockByVariant.get(
                                                                            variant.variantId
                                                                        );
                                                                        const swatch = resolveColor(variant.color);
                                                                        const stockClass =
                                                                            stock === undefined
                                                                                ? ""
                                                                                : stock === 0
                                                                                    ? " pmx-stock-out"
                                                                                    : stock <= LOW_STOCK_THRESHOLD
                                                                                        ? " pmx-stock-low"
                                                                                        : "";

                                                                        return (
                                                                            <li
                                                                                key={variant.variantId}
                                                                                className="pmx-chip"
                                                                            >
                                                                                <span
                                                                                    className={`pmx-swatch pmx-swatch-sm${swatch ? "" : " pmx-swatch-empty"}`}
                                                                                    style={
                                                                                        swatch
                                                                                            ? { backgroundColor: swatch }
                                                                                            : undefined
                                                                                    }
                                                                                    title={variant.color}
                                                                                />
                                                                                <span className="pmx-chip-label">
                                                                                    {variant.color} / {variant.size}
                                                                                </span>
                                                                                <span className="pmx-chip-price">
                                                                                    {rupee.format(Number(variant.price))}
                                                                                </span>
                                                                                <span
                                                                                    className={`pmx-chip-stock${stockClass}`}
                                                                                >
                                                                                    {stock === undefined
                                                                                        ? "Stock not set"
                                                                                        : stock === 0
                                                                                            ? "Out of stock"
                                                                                            : `${stock} in stock`}
                                                                                </span>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <nav className="pmx-pagination" aria-label="Product pages">
                            <span>
                                {pageStart + 1}–
                                {Math.min(pageStart + PAGE_SIZE, filteredRows.length)} of{" "}
                                {filteredRows.length}
                            </span>
                            <div className="pmx-pagination-buttons">
                                <button
                                    type="button"
                                    className="pmx-btn"
                                    onClick={() => setPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    className="pmx-btn"
                                    onClick={() => setPage(currentPage + 1)}
                                    disabled={currentPage >= pageCount}
                                >
                                    Next
                                </button>
                            </div>
                        </nav>
                    </>
                )}
            </section>
        </div>
    );
}