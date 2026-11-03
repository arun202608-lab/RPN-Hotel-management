import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  RotateCw,
  AlertCircle,
  Coffee,
  Check,
  DollarSign,
  ArrowUpRight,
  ChefHat,
  ShieldCheck,
} from "lucide-react";

function FoodManagement() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = admin?.role === "Super Admin" || admin?.role === "Admin";
  const [foods, setFoods] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Breakfast");
  const [price, setPrice] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch food items
  async function fetchFoods() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/foods");
      const records = response.data?.data || response.data || [];

      setFoods(
        records.map((food) => ({
          ...food,
          id: food._id,
          available: food.isAvailable,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load food menu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFoods();
  }, []);

  function resetForm() {
    setName("");
    setCategory("Breakfast");
    setPrice("");
    setIsAvailable(true);
    setEditingId(null);
    setIsFormOpen(false);
  }

  // Add or update food
  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      toast.error("Access Restricted: Changing dish prices requires Administrator approval.", "Approval Required");
      return;
    }

    const trimmedName = name.trim();
    const numericPrice = Number(price);

    if (!trimmedName || price === "" || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.warning("Please enter a valid dish name and price.", "Incomplete Details");
      return;
    }

    const duplicateFood = foods.some(
      (food) => food.name.toLowerCase() === trimmedName.toLowerCase() && food.id !== editingId
    );

    if (duplicateFood) {
      toast.error("This food item already exists in the dining menu.", "Duplicate Dish");
      return;
    }

    const foodData = {
      name: trimmedName,
      category,
      price: numericPrice,
      isAvailable,
    };

    try {
      setError("");

      if (editingId !== null) {
        await api.put(`/foods/${editingId}`, foodData);
        toast.success(`Dish "${trimmedName}" updated successfully.`, "Menu Updated");
      } else {
        await api.post("/foods", foodData);
        toast.success(`"${trimmedName}" added to the restaurant menu!`, "Dish Added");
      }

      await fetchFoods();
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to save food item";
      setError(msg);
      toast.error(msg, "Error Saving Dish");
    }
  }

  function handleEditFood(food) {
    setEditingId(food.id);
    setName(food.name);
    setCategory(food.category);
    setPrice(String(food.price));
    setIsAvailable(food.available !== false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Toggle availability directly
  async function handleToggleAvailability(food) {
    try {
      const nextAvailable = !food.available;
      await api.put(`/foods/${food.id}`, {
        isAvailable: nextAvailable,
      });
      await fetchFoods();
      toast.info(
        `"${food.name}" is now ${nextAvailable ? "Available to Order" : "Marked as Sold Out"}.`,
        "Availability Changed"
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update availability";
      toast.error(msg, "Status Update Failed");
    }
  }

  async function handleDeleteFood(id) {
    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can delete food items.", "Permission Denied");
      return;
    }

    const target = foods.find((f) => f.id === id);
    const dishName = target ? target.name : "this item";

    const ok = await confirm({
      title: "Remove Dish",
      message: `Are you sure you want to remove "${dishName}" from the dining catalog?`,
      confirmText: "Yes, Delete Dish",
      cancelText: "Keep on Menu",
      type: "danger",
    });

    if (!ok) return;

    try {
      setError("");
      await api.delete(`/foods/${id}`);
      if (editingId === id) resetForm();
      await fetchFoods();
      toast.success(`"${dishName}" has been removed from the dining menu.`, "Dish Removed");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to delete food item";
      setError(msg);
      toast.error(msg, "Error Removing Dish");
    }
  }

  // Filtered menu
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchSearch = food.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchCategory = categoryFilter === "All" || food.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [foods, search, categoryFilter]);

  const totalCount = foods.length;
  const availableCount = foods.filter((f) => f.available).length;
  const categoriesCount = new Set(foods.map((f) => f.category)).size;

  return (
    <div className="synaptix-dashboard-root">
      {/* Page Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="ai-active-pill">
            <UtensilsCrossed className="spark-icon" />
            <span>MENU & PRICING</span>
          </div>
          <h1 className="welcome-title">Restaurant Menu Catalog</h1>
          <p className="welcome-subtitle">
            Manage your restaurant catalog, culinary categories, pricing tiers, and live kitchen availability.
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchFoods}
            title="Refresh menu"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (isFormOpen && editingId === null) {
                  setIsFormOpen(false);
                } else {
                  resetForm();
                  setIsFormOpen(true);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "12px",
                background: "var(--primary-gradient)",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              {isFormOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Dish</span>
                </>
              )}
            </button>
          ) : (
            <div
              className="synaptix-ghost-pill"
              style={{
                opacity: 0.9,
                cursor: "default",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                color: "var(--accent)",
              }}
            >
              <ChefHat className="w-4 h-4 text-purple-400" />
              <span>Menu Operations (Availability Toggle Enabled)</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row (Glowing Synaptix Cards) */}
      <div className="synaptix-kpi-grid">
        {/* Total Dishes */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <UtensilsCrossed className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL DISHES</span>
          <div className="stat-main-number">{totalCount}</div>
          <div className="stat-growth-tag positive">
            <span>Dishes in restaurant catalog</span>
          </div>
        </div>

        {/* Available to Order */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 18, 40 6 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">AVAILABLE TO ORDER</span>
          <div className="stat-main-number">{availableCount}</div>
          <div className="stat-growth-tag positive">
            <span>Ready in hotel kitchen</span>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <Coffee className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">MENU CATEGORIES</span>
          <div className="stat-main-number">{categoriesCount}</div>
          <div className="stat-growth-tag positive">
            <span>Breakfast, Lunch, Dinner, etc.</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <AlertCircle className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">OUT OF STOCK</span>
          <div className="stat-main-number">{totalCount - availableCount}</div>
          <div className="stat-growth-tag positive">
            <span>Temporarily sold out</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Floating / Collapsible Form Card (Admin Only) */}
      {isAdmin && isFormOpen && (
        <div className="synaptix-main-card" style={{ marginBottom: "24px" }}>
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">{editingId !== null ? "EDIT RECIPE" : "NEW RECIPE"}</span>
              <h3 className="card-title-light">{editingId !== null ? "Edit Dish Details" : "Add Dish to Menu"}</h3>
              <p className="card-desc-muted">Configure menu item name, kitchen category, and pricing.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="synaptix-form-grid">
            <div className="desk-input-field">
              <label>Dish Name *</label>
              <div className="input-wrap">
                <UtensilsCrossed className="w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  placeholder="e.g. Masala Dosa, Biryani, Espresso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Category *</label>
              <div className="input-wrap">
                <Coffee className="w-4 h-4 text-purple-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Breakfast">🥞 Breakfast</option>
                  <option value="Lunch">🍛 Lunch</option>
                  <option value="Dinner">🍲 Dinner</option>
                  <option value="Snacks">🥪 Snacks</option>
                  <option value="Beverages">☕ Beverages</option>
                  <option value="Desserts">🍰 Desserts</option>
                </select>
              </div>
            </div>

            <div className="desk-input-field">
              <label>Price (₹) *</label>
              <div className="input-wrap">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  placeholder="e.g. 180"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Kitchen Status</label>
              <div className="input-wrap">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <select
                  value={isAvailable ? "true" : "false"}
                  onChange={(e) => setIsAvailable(e.target.value === "true")}
                >
                  <option value="true">🟢 Available to Order</option>
                  <option value="false">🔴 Sold Out / Kitchen Unavailable</option>
                </select>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="synaptix-ghost-pill"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  background: "var(--primary-gradient)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                }}
              >
                {editingId !== null ? "Update Dish" : "Save Dish to Menu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: Search & Category Filter Card */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="search-icon w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by dish name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="synaptix-filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Categories</option>
            <option value="Breakfast">🥞 Breakfast</option>
            <option value="Lunch">🍛 Lunch</option>
            <option value="Dinner">🍲 Dinner</option>
            <option value="Snacks">🥪 Snacks</option>
            <option value="Beverages">☕ Beverages</option>
            <option value="Desserts">🍰 Desserts</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">KITCHEN CATALOG</span>
            <h3 className="card-title-light">Culinary Menu ({filteredFoods.length})</h3>
            <p className="card-desc-muted">Manage recipe names, live availability toggles, and dish prices.</p>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="desktop-table-view table-responsive" style={{ overflowX: "auto" }}>
          <table className="synaptix-data-table">
            <thead>
              <tr>
                <th>Dish Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Kitchen Availability</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
                      <RotateCw className="w-5 h-5 animate-spin text-purple-400" />
                      <span>Loading menu catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                    <UtensilsCrossed className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
                    <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0" }}>No menu items found</h4>
                    <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Adjust your filter or add a new recipe to your menu.</p>
                  </td>
                </tr>
              ) : (
                filteredFoods.map((food) => (
                  <tr key={food.id}>
                    <td>
                      <strong style={{ display: "block", color: "var(--text-main)", fontSize: "13.5px" }}>
                        {food.name}
                      </strong>
                    </td>
                    <td>
                      <span className={`dish-category-badge ${food.category?.toLowerCase() || "lunch"}`} style={{ fontSize: "11px" }}>
                        {food.category === "Breakfast" && "🥞 "}
                        {food.category === "Lunch" && "🍛 "}
                        {food.category === "Dinner" && "🍲 "}
                        {food.category === "Snacks" && "🥪 "}
                        {food.category === "Beverages" && "☕ "}
                        {food.category === "Desserts" && "🍰 "}
                        {food.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "var(--accent)", fontSize: "14px" }}>
                        ₹{Number(food.price).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(food)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          border: food.available
                            ? "1px solid rgba(52, 211, 153, 0.4)"
                            : "1px solid rgba(239, 68, 68, 0.4)",
                          background: food.available
                            ? "rgba(52, 211, 153, 0.12)"
                            : "rgba(239, 68, 68, 0.12)",
                          color: food.available ? "#34D399" : "#F87171",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to toggle availability"
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: food.available ? "#34D399" : "#F87171",
                          }}
                        ></span>
                        <span>{food.available ? "Available" : "Sold Out"}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isAdmin ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleEditFood(food)}
                            title="Edit Dish & Pricing"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "var(--bg-card-inner)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-muted)",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--accent)";
                              e.currentTarget.style.borderColor = "var(--primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor = "var(--border-subtle)";
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteFood(food.id)}
                            title="Delete Dish (Admin Only)"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#F87171",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#EF4444";
                              e.currentTarget.style.color = "#FFFFFF";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                              e.currentTarget.style.color = "#F87171";
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "var(--text-dim)",
                            background: "var(--bg-card-inner)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          🔒 Price Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Dish Management Cards (Zero Horizontal Scroll) */}
        <div className="mobile-dishes-cards-view">
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
              <RotateCw className="w-5 h-5 animate-spin text-purple-400 mx-auto mb-2" />
              <span>Loading menu catalog...</span>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", background: "var(--bg-card-inner)", borderRadius: "14px", border: "1px dashed var(--border-subtle)" }}>
              <UtensilsCrossed className="w-8 h-8 text-purple-400 opacity-50 mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0", fontSize: "14px" }}>No dishes found</h4>
              <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "11.5px" }}>Adjust your filter or add a new recipe.</p>
            </div>
          ) : (
            filteredFoods.map((food) => (
              <div key={food.id} className="mobile-dish-mgmt-card">
                {/* Header: Category Badge & Price */}
                <div className="dish-mgmt-header">
                  <span className={`dish-category-badge ${food.category?.toLowerCase() || "lunch"}`} style={{ fontSize: "11px" }}>
                    {food.category === "Breakfast" && "🥞 "}
                    {food.category === "Lunch" && "🍛 "}
                    {food.category === "Dinner" && "🍲 "}
                    {food.category === "Snacks" && "🥪 "}
                    {food.category === "Beverages" && "☕ "}
                    {food.category === "Desserts" && "🍰 "}
                    {food.category}
                  </span>
                  <div className="dish-mgmt-price-tag">
                    <span className="currency">₹</span>
                    <span className="val">{Number(food.price).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Dish Name */}
                <h4 className="dish-mgmt-title">{food.name}</h4>

                {/* Footer: Live Kitchen Availability Toggle + Admin Edit / Delete */}
                <div className="dish-mgmt-footer">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(food)}
                    className={`dish-avail-pill ${food.available ? "in-stock" : "out-of-stock"}`}
                    title="Click to toggle availability"
                  >
                    <span className="status-dot"></span>
                    <span>{food.available ? "Available" : "Sold Out"}</span>
                  </button>

                  {isAdmin ? (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-action-icon edit"
                        onClick={() => handleEditFood(food)}
                        title="Edit Dish & Price"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon delete"
                        onClick={() => handleDeleteFood(food.id)}
                        title="Delete Dish"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#F87171",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Locked</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>
            Showing <strong style={{ color: "var(--text-main)" }}>{filteredFoods.length}</strong> of{" "}
            <strong style={{ color: "var(--text-main)" }}>{totalCount}</strong> catalog items
          </span>
          <span style={{ color: "var(--text-dim)" }}>Dining Catalog Active</span>
        </div>
      </div>
    </div>
  );
}

export default FoodManagement;
