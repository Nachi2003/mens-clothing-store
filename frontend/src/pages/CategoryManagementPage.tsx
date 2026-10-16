import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "../services/categoryService";

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function resetForm() {
    setCategoryName("");
    setDescription("");
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const name = categoryName.trim();
    const details = description.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateCategory(editingId, {
          categoryName: name,
          description: details,
        });
        setMessage("Category updated successfully.");
      } else {
        await createCategory({
          categoryName: name,
          description: details,
        });
        setMessage("Category added successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingId(category.categoryId);
    setCategoryName(category.categoryName);
    setDescription(category.description ?? "");
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Delete the category "${category.categoryName}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteCategory(category.categoryId);
      setMessage("Category deleted successfully.");

      if (editingId === category.categoryId) {
        resetForm();
      }

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category. It may contain products."
      );
    }
  }

  return (
    <main className="category-management">
      <header className="category-page-header">
        <div>
          <h1>Category Management</h1>
          <p>Organize the clothing categories in your store.</p>
        </div>
        <span className="category-count">
          {categories.length} categories
        </span>
      </header>

      <section className="category-form-card">
        <h2>{editingId !== null ? "Edit Category" : "Add New Category"}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="categoryName">Category Name *</label>
          <input
            id="categoryName"
            type="text"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="e.g. Shirts, Jeans, T-Shirts"
            maxLength={100}
            required
          />

          <label htmlFor="categoryDescription">Description</label>
          <textarea
            id="categoryDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this category"
            maxLength={500}
            rows={3}
          />

          {error && <p className="category-error">{error}</p>}
          {message && <p className="category-success">{message}</p>}

          <div className="category-form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Category"
                  : "Add Category"}
            </button>

            {editingId !== null && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="category-list-card">
        <h2>Existing Categories</h2>

        {loading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found. Add your first category above.</p>
        ) : (
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td>{category.categoryId}</td>
                    <td>{category.categoryName}</td>
                    <td>{category.description || "—"}</td>
                    <td>
                      <div className="category-row-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}