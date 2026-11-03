import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Crown,
  Trash2,
  LogOut,
  HelpCircle,
} from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const toastIdRef = useRef(0);

  // Add a new toast notification
  const addToast = useCallback((type, message, title = "") => {
    const id = ++toastIdRef.current;
    
    // Default titles based on type
    let defaultTitle = "Notification";
    if (type === "success") defaultTitle = "Success";
    if (type === "error") defaultTitle = "Notice";
    if (type === "warning") defaultTitle = "Warning";
    if (type === "info") defaultTitle = "Information";

    const newToast = {
      id,
      type,
      title: title || defaultTitle,
      message,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title) => addToast("success", msg, title),
    error: (msg, title) => addToast("error", msg, title),
    warning: (msg, title) => addToast("warning", msg, title),
    info: (msg, title) => addToast("info", msg, title),
  };

  // Promise-based luxury confirmation dialog
  const confirm = useCallback(({
    title = "Confirm Action",
    message = "Are you sure you wish to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "gold", // 'gold' | 'danger' | 'warning'
  } = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve: (result) => {
          setConfirmDialog(null);
          resolve(result);
        },
      });
    });
  }, []);

  // Close confirm modal on Escape key
  useEffect(() => {
    if (!confirmDialog) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        confirmDialog.resolve(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDialog]);

  // Gracefully enhance window.alert so even legacy calls look stunning
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const text = typeof msg === "object" ? JSON.stringify(msg) : String(msg || "");
      if (text.toLowerCase().includes("fail") || text.toLowerCase().includes("error") || text.toLowerCase().includes("invalid")) {
        toast.error(text, "System Alert");
      } else if (text.toLowerCase().includes("success") || text.toLowerCase().includes("completed")) {
        toast.success(text, "Success");
      } else {
        toast.info(text, "Notice");
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Luxury Toast Notification Stack (Fixed at Top-Right) */}
      <aside
        className="luxury-toast-container"
        aria-label="Notification alerts"
        aria-live="polite"
      >
        {toasts.map((t) => {
          let IconComponent = CheckCircle2;
          let iconClass = "toast-icon-success";
          if (t.type === "error") {
            IconComponent = AlertCircle;
            iconClass = "toast-icon-error";
          } else if (t.type === "warning") {
            IconComponent = AlertTriangle;
            iconClass = "toast-icon-warning";
          } else if (t.type === "info") {
            IconComponent = Crown;
            iconClass = "toast-icon-info";
          }

          return (
            <div
              key={t.id}
              className={`luxury-toast-card toast-${t.type}`}
              role="alert"
            >
              <div className={`luxury-toast-icon-badge ${iconClass}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="luxury-toast-body">
                <h4 className="luxury-toast-title">{t.title}</h4>
                <p className="luxury-toast-message">{t.message}</p>
              </div>

              <button
                type="button"
                className="luxury-toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="luxury-toast-timer-bar"></div>
            </div>
          );
        })}
      </aside>

      {/* Royal Confirmation Modal Dialog */}
      {confirmDialog && (
        <div
          className="luxury-confirm-backdrop"
          onClick={() => confirmDialog.resolve(false)}
          role="presentation"
        >
          <div
            className={`luxury-confirm-modal ${confirmDialog.type}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            {/* Top Close Button */}
            <button
              type="button"
              className="luxury-confirm-close-btn"
              onClick={() => confirmDialog.resolve(false)}
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Hotel Brand Tag */}
            <div className="luxury-confirm-brand-pill">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>RPN LUXURY HOTELS</span>
            </div>

            {/* Top Emblem Icon Badge */}
            <div className={`luxury-confirm-emblem ${confirmDialog.type || "gold"}`}>
              {confirmDialog.title?.toLowerCase().includes("out") ? (
                <LogOut size={30} strokeWidth={2.4} className="confirm-icon icon-logout" />
              ) : confirmDialog.type === "danger" ? (
                <Trash2 size={30} strokeWidth={2.4} className="confirm-icon icon-danger" />
              ) : confirmDialog.type === "warning" ? (
                <AlertTriangle size={30} strokeWidth={2.4} className="confirm-icon icon-warning" />
              ) : (
                <Crown size={30} strokeWidth={2.4} className="confirm-icon icon-gold" />
              )}
            </div>

            <h3 id="confirm-dialog-title" className="luxury-confirm-title">
              {confirmDialog.title}
            </h3>

            <p className="luxury-confirm-message">{confirmDialog.message}</p>

            <div className="luxury-confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => confirmDialog.resolve(false)}
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                className={`btn-confirm-proceed ${confirmDialog.type}`}
                onClick={() => confirmDialog.resolve(true)}
                autoFocus
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
