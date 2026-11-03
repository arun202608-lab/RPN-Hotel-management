import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  UserCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  RotateCw,
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  Building,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Crown,
  KeyRound,
  ChefHat,
  DoorOpen,
} from "lucide-react";

function Staff() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = !admin?.role || admin.role.includes("Admin") || admin.role === "Super Admin";
  const [staffList, setStaffList] = useState([]);

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [department, setDepartment] = useState("Reception");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Active");
  const [portalRole, setPortalRole] = useState("None");
  const [portalPassword, setPortalPassword] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch staff list from backend
  async function fetchStaff() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/staff");
      const records = response.data?.data || response.data || [];
      setStaffList(Array.isArray(records) ? records : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load staff roster.";
      setError(msg);
      toast.error(msg, "Error Loading Staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  function resetForm() {
    setName("");
    setEmployeeId("");
    setEmail("");
    setPhone("");
    setGender("Male");
    setDepartment("Reception");
    setDesignation("");
    setSalary("");
    setJoiningDate("");
    setAddress("");
    setStatus("Active");
    setPortalRole("None");
    setPortalPassword("");
    setEditingId(null);
    setIsFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please provide the employee's full name.");
      toast.error("Employee full name is mandatory.", "Validation Error");
      return;
    }

    if (!phone.trim()) {
      setError("Please provide a contact phone number.");
      toast.error("Contact phone number is mandatory.", "Validation Error");
      return;
    }

    const staffData = {
      fullName: trimmedName,
      staffId: employeeId.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      gender,
      department,
      designation: designation.trim(),
      salary: Number(salary) || 0,
      joiningDate: joiningDate || undefined,
      address: address.trim(),
      portalRole,
      portalPassword: portalPassword.trim() || undefined,
      status,
    };

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await api.put(`/staff/${editingId}`, staffData);
        toast.success(`Staff member ${trimmedName} updated successfully.`, "Staff Updated");
      } else {
        await api.post("/staff", staffData);
        toast.success(`Staff member ${trimmedName} enrolled successfully!`, "Staff Enrolled");
      }

      await fetchStaff();
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to save staff profile.";
      setError(msg);
      toast.error(msg, "Error Saving Staff");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(staff) {
    setEditingId(staff._id);
    setName(staff.fullName);
    setEmployeeId(staff.staffId);
    setEmail(staff.email);
    setPhone(staff.phone);
    setGender(staff.gender);
    setDepartment(staff.department);
    setDesignation(staff.designation);
    setSalary(String(staff.salary));
    setJoiningDate(staff.joiningDate?.slice(0, 10) || "");
    setAddress(staff.address || "");
    setStatus(staff.status);
    setPortalRole(staff.portalRole || "None");
    setPortalPassword("");
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can remove staff personnel.", "Permission Denied");
      return;
    }

    const target = staffList.find((s) => s._id === id);
    const staffName = target ? target.fullName : "this staff member";

    const ok = await confirm({
      title: "Remove Staff Member",
      message: `Are you sure you want to remove ${staffName} from the hotel workforce roster?`,
      confirmText: "Yes, Remove Staff",
      cancelText: "Keep Active",
      type: "danger",
    });

    if (!ok) return;

    try {
      setError("");
      await api.delete(`/staff/${id}`);
      if (editingId === id) resetForm();
      await fetchStaff();
      toast.success(`${staffName} has been removed from the roster.`, "Staff Removed");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete staff member.";
      setError(msg);
      toast.error(msg, "Error Removing Staff");
    }
  }

  async function handleStatusToggle(staff) {
    const nextStatus = staff.status === "Active" ? "Inactive" : "Active";
    try {
      await api.put(`/staff/${staff._id}`, { status: nextStatus });
      await fetchStaff();
      toast.info(`Status for ${staff.fullName} updated to ${nextStatus}.`, "Status Updated");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status.";
      toast.error(msg, "Status Update Failed");
    }
  }

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim();
    return staffList.filter((s) => {
      const matchSearch =
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.staffId && s.staffId.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q));
      const matchDept = departmentFilter === "All" || s.department === departmentFilter;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [staffList, search, departmentFilter, statusFilter]);

  const getInitials = (str) => {
    if (!str) return "S";
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const totalCount = staffList.length;
  const activeCount = staffList.filter((s) => s.status === "Active").length;
  const inactiveCount = staffList.filter((s) => s.status === "Inactive").length;
  const totalPayroll = staffList.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header & Action Pills (Matches Dashboard) */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="synaptix-brand-tag">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>HUMAN RESOURCES OPERATIONS</span>
          </div>
          <h1>Staff Directory & Roles</h1>
          <p>Manage hotel workforce, departmental assignments, and role-based portal credentials</p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchStaff}
            title="Refresh staff records"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Roster</span>
          </button>

          <button
            type="button"
            className={`synaptix-tab-pill ${isFormOpen ? "active" : ""}`}
            onClick={() => {
              if (isFormOpen && editingId === null) {
                setIsFormOpen(false);
              } else {
                resetForm();
                setIsFormOpen(true);
              }
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
                <span>Add Employee</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Synaptix Glowing KPI Cards (Exact Dashboard Style) */}
      <div className="synaptix-kpi-grid">
        {/* Total Staff */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <UserCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL CREW ROSTER</span>
          <div className="stat-main-number">{totalCount}</div>
          <div className="stat-growth-tag positive">
            <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
            <span>Registered Staff Members</span>
          </div>
        </div>

        {/* Active on Duty */}
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
          <span className="stat-caption">ACTIVE ON DUTY</span>
          <div className="stat-main-number">{activeCount}</div>
          <div className="stat-growth-tag positive">
            <span>{totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% Operational Attendance</span>
          </div>
        </div>

        {/* Off Duty / Inactive */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <Briefcase className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">OFF DUTY / STANDBY</span>
          <div className="stat-main-number">{inactiveCount}</div>
          <div className="stat-growth-tag">
            <span>Leave / Off-shift Crew</span>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <DollarSign className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">MONTHLY PAYROLL BUDGET</span>
          <div className="stat-main-number">₹{totalPayroll.toLocaleString("en-IN")}</div>
          <div className="stat-growth-tag positive">
            <span>Consolidated Compensation</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="modern-alert-banner alert-error" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {isFormOpen && (
        <div className="synaptix-main-card">
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">EMPLOYEE ENROLLMENT</span>
              <h3 className="card-title-light">
                {editingId !== null ? "Edit Staff Details" : "Register New Employee"}
              </h3>
              <p className="card-desc-muted">
                Assign employee ID, designate department, register payroll, and grant portal credentials.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="synaptix-form-grid">
            <div className="synaptix-form-field">
              <label htmlFor="staff-name">Full Name *</label>
              <div className="input-wrap">
                <input
                  id="staff-name"
                  type="text"
                  placeholder="e.g. Ramesh Patel, Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-id">Staff ID</label>
              <div className="input-wrap">
                <input
                  id="staff-id"
                  type="text"
                  placeholder="e.g. EMP-005 (auto-generated if empty)"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-email">Email Address</label>
              <div className="input-wrap">
                <input
                  id="staff-email"
                  type="email"
                  placeholder="e.g. staff@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-phone">Phone Number *</label>
              <div className="input-wrap">
                <input
                  id="staff-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-dept">Department</label>
              <div className="input-wrap">
                <select
                  id="staff-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="Reception">Reception</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Management">Management</option>
                  <option value="Security">Security</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-desig">Designation</label>
              <div className="input-wrap">
                <input
                  id="staff-desig"
                  type="text"
                  placeholder="e.g. Front Desk Officer, Head Chef"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-salary">Monthly Salary (₹)</label>
              <div className="input-wrap">
                <input
                  id="staff-salary"
                  type="number"
                  placeholder="e.g. 28000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-join">Joining Date</label>
              <div className="input-wrap">
                <input
                  id="staff-join"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-gender">Gender</label>
              <div className="input-wrap">
                <select
                  id="staff-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="staff-status">Employment Status</label>
              <div className="input-wrap">
                <select
                  id="staff-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Active">Active Duty</option>
                  <option value="Inactive">Inactive / On Leave</option>
                </select>
              </div>
            </div>

            {/* Role-Based Access Control Assignment */}
            <div className="synaptix-form-field full-width" style={{ marginTop: 8 }}>
              <div className="synaptix-toolbar-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
                <span className="card-pretitle">ROLE-BASED PORTAL PERMISSION (RBAC)</span>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                  Assign which hotel operational desk this employee can log into.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%" }}>
                  <select
                    id="staff-portal-role"
                    value={portalRole}
                    onChange={(e) => setPortalRole(e.target.value)}
                    className="synaptix-select"
                    style={{ width: "100%" }}
                  >
                    <option value="None">None (Staff member only - No portal login)</option>
                    <option value="Receptionist">🏨 Receptionist (Reception Desk & Guest Hospitality)</option>
                    <option value="Room Manager">🏨 Room Manager (Room Booking Desk & Tokens)</option>
                    <option value="Food Manager">🍽️ Food Manager (Food Order Desk & Dining Bills)</option>
                    <option value="Super Admin">👑 Super Admin (Full Hotel Administration)</option>
                  </select>

                  {portalRole !== "None" && (
                    <input
                      type="text"
                      placeholder="Set Login Password (e.g. room123 / secret)"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      className="synaptix-select"
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
                {portalRole !== "None" && (
                  <span style={{ fontSize: 11.5, color: "var(--accent)" }}>
                    Employee logs in with email: <strong>{email || "staff@hotel.com"}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="synaptix-form-actions">
              <button
                type="button"
                className="btn-modern-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modern-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving Employee..."
                  : editingId !== null
                  ? "Update Employee"
                  : "Register Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar Search & Department/Status Filter (Matches Synaptix Card) */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or designation..."
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
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Departments</option>
            <option value="Reception">Reception</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Management">Management</option>
            <option value="Security">Security</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Workforce Roster Table Card (Matches Synaptix Stay History Table) */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">WORKFORCE ROSTER</span>
            <h3 className="card-title-light">
              Active Hotel Crew Directory ({filteredStaff.length})
            </h3>
            <p className="card-desc-muted">
              Complete directory of hotel personnel, departmental assignments, and portal access permissions.
            </p>
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="synaptix-data-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Department</th>
                <th>Contact Information</th>
                <th>Portal Access</th>
                <th>Monthly Salary</th>
                <th>Employment Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-state-cell">
                    <div className="empty-history-box" style={{ padding: 40 }}>
                      <RotateCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                      <h4>Loading Staff Directory...</h4>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-state-cell">
                    <div className="empty-history-box">
                      <UserCheck className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
                      <h4>No Employees Found</h4>
                      <p>Adjust your search criteria or register a new team member to this roster.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((st) => (
                  <tr key={st._id}>
                    <td>
                      <div className="table-guest-cell" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <UserAvatar
                          name={st.fullName}
                          gender={st.gender}
                          size={42}
                        />
                        <div>
                          <strong style={{ display: "block", color: "var(--text-main)", fontSize: 14.5 }}>
                            {st.fullName}
                          </strong>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                            {st.staffId} • {st.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="token-hash-pill">
                        {st.department}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <div className="contact-pill-synaptix" title={`Phone: ${st.phone}`}>
                          <Phone className="w-3.5 h-3.5 text-purple-400" />
                          <span>{st.phone}</span>
                        </div>
                        <div className="contact-pill-synaptix" title={`Email: ${st.email}`}>
                          <Mail className="w-3.5 h-3.5 text-purple-400" />
                          <span>{st.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {st.portalRole === "Room Manager" || st.portalRole === "Receptionist" ? (
                        <span className="role-tag-badge room">🏨 Reception Desk</span>
                      ) : st.portalRole === "Food Manager" ? (
                        <span className="role-tag-badge food">🍽️ Food Desk</span>
                      ) : st.portalRole === "Super Admin" ? (
                        <span className="role-tag-badge admin">👑 Admin</span>
                      ) : (
                        <span className="role-tag-badge none">Staff Only</span>
                      )}
                    </td>

                    <td>
                      <span className="table-amount-purple">
                        ₹{Number(st.salary || 0).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(st)}
                        className={st.status === "Active" ? "checkout-badge-done" : "status-badge-inactive"}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Click to toggle status"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                        {st.status}
                      </button>
                    </td>

                    <td className="text-right">
                      <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-icon edit"
                          onClick={() => handleEdit(st)}
                          title="Edit Staff Member"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDelete(st._id)}
                            title="Delete Staff Member (Admin Only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)" }}>
          <span>
            Showing <strong>{filteredStaff.length}</strong> of <strong>{totalCount}</strong> crew members
          </span>
          <span>Department Active Sync • OK</span>
        </div>
      </div>
    </div>
  );
}

export default Staff;
