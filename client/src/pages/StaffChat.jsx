import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bell,
  RotateCw,
  Crown,
  DoorOpen,
  ChefHat,
  Users,
  Check,
  CheckCheck,
  AlertCircle,
  Plus,
  X,
  Megaphone,
  Radio,
  Clock,
  ShieldCheck,
  Flame,
} from "lucide-react";

export default function StaffChat() {
  const { admin } = useAuth();
  const { toast } = useToast();

  const userRole = admin?.role || "Super Admin";
  const isAdmin = userRole === "Super Admin" || userRole === "Admin";
  const isRoom = userRole === "Room Manager" || userRole === "Receptionist";
  const isFood = userRole === "Food Manager";

  // Data states
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState("all_staff");
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mobileChatView, setMobileChatView] = useState("channels"); // 'channels' | 'chat'

  // Broadcast Modal for Admin
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("Normal");
  const [broadcastTarget, setBroadcastTarget] = useState("All");
  const [postingUpdate, setPostingUpdate] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get("/chat/contacts");
      const list = res.data?.data || [];
      setContacts(list);

      // Default select first available direct contact if not set
      if (!activeContactId && list.length > 0) {
        setActiveContactId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch chat contacts:", err);
    }
  }, [activeContactId]);

  // Active contact object
  const activeContact = useMemo(() => {
    return (
      contacts.find((c) => c.id === activeContactId) || {
        id: "all_staff",
        role: "All",
        name: "📢 Hotel Staff Broadcast",
        title: "General Hotel Announcements",
        online: true,
      }
    );
  }, [contacts, activeContactId]);

  // Fetch messages for active thread
  const fetchMessages = useCallback(async () => {
    if (!activeContact) return;
    try {
      const res = await api.get(`/chat/messages?contactRole=${activeContact.role}`);
      setMessages(res.data?.data || []);

      // Also mark messages as read for this thread
      if (activeContact.role !== "All") {
        await api.put("/chat/messages/read", { senderRole: activeContact.role });
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, [activeContact]);

  // Fetch hotel notifications / announcements
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/chat/notifications");
      setNotifications(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load hotel notifications:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchNotifications()]);
      setLoading(false);
    };
    init();
  }, []);

  // Whenever active contact changes, fetch messages and scroll
  useEffect(() => {
    if (activeContact) {
      fetchMessages();
    }
  }, [activeContact, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Live polling every 4 seconds for instant message arrival
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      fetchNotifications();
      fetchContacts();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchNotifications, fetchContacts]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      setSending(true);
      const payload = {
        receiverRole: activeContact.role,
        receiverName: activeContact.name,
        receiverEmail: activeContact.email || "",
        message: messageText,
      };

      const res = await api.post("/chat/messages", payload);
      const newMsg = res.data?.data;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
      await fetchContacts();
      if (activeContact.role === "All") {
        await fetchNotifications();
      }
      scrollToBottom();
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to deliver message. Check connection.", "Message Error");
    } finally {
      setSending(false);
    }
  };

  // Quick reply chip click
  const handleQuickChip = (text) => {
    setInputText(text);
  };

  // Quick chips depending on current user role
  const quickChips = useMemo(() => {
    if (isAdmin) {
      return [
        "Please update status 👍",
        "VIP guest arriving today ⭐",
        "Front Desk: please verify room booking 🏨",
        "Kitchen: prepare room service order 🍽️",
        "Good work team! 👏",
      ];
    }
    if (isRoom) {
      return [
        "Room is ready for check-in ✓",
        "Guest checked in successfully 🏨",
        "Room requires housekeeping / cleaning 🧹",
        "Understood Administrator, on it! 👍",
      ];
    }
    return [
      "Kitchen order is being prepared 🍳",
      "Food dispatched for Room Service 🍽️",
      "Dining table order completed ✓",
      "Yes Administrator, verified! 👍",
    ];
  }, [isAdmin, isRoom]);

  // Handle Create Hotel Announcement / Broadcast (Admin only)
  const handlePostBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.warning("Please provide announcement title and description.", "Missing Info");
      return;
    }

    try {
      setPostingUpdate(true);
      await api.post("/chat/notifications", {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        priority: broadcastPriority,
        targetRole: broadcastTarget,
      });

      toast.success("Hotel announcement broadcasted to all employees!", "Update Posted");
      setIsBroadcastModalOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastPriority("Normal");
      setBroadcastTarget("All");

      await Promise.all([fetchNotifications(), fetchMessages(), fetchContacts()]);
    } catch (err) {
      console.error("Broadcast error:", err);
      toast.error(err.response?.data?.message || "Failed to post update", "Error");
    } finally {
      setPostingUpdate(false);
    }
  };

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
           
          <h1 className="welcome-title">Staff Chat & Hotel Announcements</h1>
          <p className="welcome-subtitle">
            Welcome back, <strong>{admin?.name}</strong>  
          </p>
        </div>

        <div className="synaptix-actions-bar">
          {isAdmin && (
            <button
              type="button"
              className="synaptix-ghost-pill"
              onClick={() => setIsBroadcastModalOpen(true)}
              style={{
                background: "var(--primary-gradient)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: "700",
                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
              }}
            >
              <Megaphone className="w-4 h-4" />
              <span>+ Post Hotel Update</span>
            </button>
          )}

          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={() => {
              fetchContacts();
              fetchMessages();
              fetchNotifications();
            }}
            title="Refresh chat and updates"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Mobile Chat View Switcher (Channels vs Chat Thread) */}
      <div className="staff-chat-mobile-tabs">
        <button
          type="button"
          className={`chat-mobile-tab-btn ${mobileChatView === "channels" ? "active" : ""}`}
          onClick={() => setMobileChatView("channels")}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Staff Channels</span>
          <span className="chat-tab-pill">{contacts.length}</span>
        </button>
        <button
          type="button"
          className={`chat-mobile-tab-btn ${mobileChatView === "chat" ? "active" : ""}`}
          onClick={() => setMobileChatView("chat")}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeContact.name}
          </span>
        </button>
      </div>

      {/* Main Staff Chat Layout: Left Channels List | Right Chat Thread */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          marginTop: "10px",
          minHeight: "680px",
        }}
        className="staff-chat-grid-container"
      >
        {/* ============================================================
            LEFT COLUMN: CHAT CHANNELS & EMPLOYEES
            ============================================================ */}
        <div
          className={`synaptix-main-card staff-chat-channels-card ${mobileChatView === "chat" ? "chat-mobile-hide" : ""}`}
          style={{
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              STAFF CHANNELS ({contacts.length})
            </span>
            <span className="ai-active-pill" style={{ padding: "3px 8px", fontSize: "10px" }}>
              <span className="pulse-dot-purple" style={{ width: "6px", height: "6px" }}></span>
              Live Staff
            </span>
          </div>

          {/* Channels List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1 }}>
            {contacts.map((contact) => {
              const isActive = activeContactId === contact.id;
              const isBroadcast = contact.role === "All";

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    setMobileChatView("chat");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: isActive ? "var(--bg-card-hover)" : "var(--bg-card-inner)",
                    border: isActive ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                    boxShadow: isActive ? "0 4px 16px rgba(139, 92, 246, 0.25)" : "none",
                  }}
                >
                  {/* Contact Avatar / Icon */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {isBroadcast ? (
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "12px",
                          background: "rgba(251, 146, 60, 0.18)",
                          color: "#FB923C",
                          display: "grid",
                          placeItems: "center",
                          border: "1px solid rgba(251, 146, 60, 0.3)",
                        }}
                      >
                        <Megaphone className="w-5 h-5" />
                      </div>
                    ) : (
                      <UserAvatar name={contact.name} size={42} />
                    )}

                    {/* Online status indicator */}
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: "#34D399",
                        border: "2px solid var(--bg-card)",
                        boxShadow: "0 0 6px #34D399",
                      }}
                    ></span>
                  </div>

                  {/* Contact Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong
                        style={{
                          fontSize: "13.5px",
                          color: isActive ? "#FFFFFF" : "var(--text-main)",
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {contact.name}
                      </strong>
                    </div>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        margin: "2px 0 0 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contact.lastMessage || contact.title}
                    </p>
                  </div>

                  {/* Unread Message Badge */}
                  {contact.unreadCount > 0 && (
                    <span
                      style={{
                        background: "var(--primary-gradient)",
                        color: "#FFFFFF",
                        fontSize: "10.5px",
                        fontWeight: "800",
                        padding: "2px 7px",
                        borderRadius: "9999px",
                        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.5)",
                      }}
                    >
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Info Box for Current User Role */}
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background: "var(--bg-card-inner)",
              border: "1px dashed var(--border-subtle)",
              fontSize: "11.5px",
              color: "var(--text-muted)",
              marginTop: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <strong style={{ color: "var(--text-main)" }}>Logged in as:</strong>
            </div>
            <span>
              {admin?.name} ({userRole}) • Connected to Live Hotel Relay.
            </span>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN: ACTIVE CHAT THREAD / BROADCAST PANEL
            ============================================================ */}
        <div
          className={`synaptix-main-card staff-chat-thread-card ${mobileChatView === "channels" ? "chat-mobile-hide" : ""}`}
          style={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Thread Header */}
          <div
            className="staff-chat-thread-header"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-card-inner)",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {/* Mobile Back Button to Channels List */}
              <button
                type="button"
                className="chat-back-to-channels-btn"
                onClick={() => setMobileChatView("channels")}
                title="Back to Channels"
              >
                ← Channels
              </button>

              {activeContact.role === "All" ? (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(251, 146, 60, 0.18)",
                    color: "#FB923C",
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid rgba(251, 146, 60, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  <Megaphone className="w-4 h-4" />
                </div>
              ) : (
                <UserAvatar name={activeContact.name} size={36} />
              )}

              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "14.5px", color: "var(--text-main)", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeContact.name}
                </h3>
                <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "600", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeContact.role === "All"
                    ? "Broadcast Updates to All Employees"
                    : `Active Channel • ${activeContact.title || activeContact.role}`}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: "rgba(52, 211, 153, 0.15)",
                  color: "#34D399",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#34D399",
                  }}
                ></span>
                Live Connected
              </span>
            </div>
          </div>

          {/* If Broadcast Tab: Show Hotel Announcements Feed at the Top */}
          {activeContact.role === "All" && notifications.length > 0 && (
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(139, 92, 246, 0.08)",
                borderBottom: "1px solid var(--border-subtle)",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  📢 OFFICIAL HOTEL NOTICES & ANNOUNCEMENTS ({notifications.length})
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    + New Notice
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>{n.title}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background:
                            n.priority === "Urgent"
                              ? "rgba(239, 68, 68, 0.2)"
                              : n.priority === "High"
                              ? "rgba(251, 146, 60, 0.2)"
                              : "rgba(52, 211, 153, 0.2)",
                          color:
                            n.priority === "Urgent"
                              ? "#F87171"
                              : n.priority === "High"
                              ? "#FB923C"
                              : "#34D399",
                        }}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: "10.5px", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                      Posted by {n.createdByName} • {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "var(--bg-card)",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", padding: "40px 20px" }}>
                <MessageSquare className="w-12 h-12 text-purple-400 opacity-40 mx-auto mb-2" />
                <h4 style={{ color: "var(--text-main)", fontSize: "16px", margin: "0 0 6px 0" }}>
                  No messages in this channel yet
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                  Send a message below to start communicating with {activeContact.name}.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSentByMe = msg.senderEmail === admin?.email;

                return (
                  <div
                    key={msg._id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isSentByMe ? "flex-end" : "flex-start",
                      width: "100%",
                    }}
                  >
                    {/* Sender Label & Role Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "4px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <strong style={{ color: "var(--text-main)" }}>
                        {isSentByMe ? "You" : msg.senderName}
                      </strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background:
                            msg.senderRole === "Super Admin"
                              ? "rgba(139, 92, 246, 0.2)"
                              : msg.senderRole === "Room Manager"
                              ? "rgba(56, 189, 248, 0.2)"
                              : "rgba(251, 146, 60, 0.2)",
                          color:
                            msg.senderRole === "Super Admin"
                              ? "var(--accent)"
                              : msg.senderRole === "Room Manager"
                              ? "#38BDF8"
                              : "#FB923C",
                        }}
                      >
                        {msg.senderRole}
                      </span>
                      <span>
                        • {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "12px 18px",
                        borderRadius: isSentByMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isSentByMe ? "var(--primary-gradient)" : "var(--bg-card-inner)",
                        color: isSentByMe ? "#FFFFFF" : "var(--text-main)",
                        border: isSentByMe ? "none" : "1px solid var(--border-subtle)",
                        boxShadow: isSentByMe ? "0 4px 14px rgba(139, 92, 246, 0.35)" : "none",
                        fontSize: "13.5px",
                        lineHeight: "1.5",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </div>

                    {/* Read status check */}
                    {isSentByMe && (
                      <span style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <CheckCheck className="w-3 h-3 text-purple-400" />
                        <span>Delivered</span>
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Response Chips */}
          <div
            className="staff-chat-quick-chips"
            style={{
              padding: "8px 18px",
              background: "var(--bg-card-inner)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", alignSelf: "center", marginRight: "4px", flexShrink: 0 }}>
              Quick Reply:
            </span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickChip(chip)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "9999px",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.color = "var(--text-main)";
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="staff-chat-input-form"
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-card-inner)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <input
              type="text"
              placeholder={`Type a message to ${activeContact.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="staff-chat-input-field"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 18px",
                borderRadius: "14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: "13.5px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="staff-chat-send-btn"
              title="Send Message"
              aria-label="Send Message"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                gap: "8px",
                padding: "12px 22px",
                borderRadius: "14px",
                border: "none",
                background: inputText.trim() ? "var(--primary-gradient)" : "var(--bg-card)",
                color: inputText.trim() ? "#FFFFFF" : "var(--text-dim)",
                fontWeight: "700",
                fontSize: "13.5px",
                cursor: inputText.trim() ? "pointer" : "not-allowed",
                boxShadow: inputText.trim() ? "0 4px 16px rgba(139, 92, 246, 0.4)" : "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
              }}
            >
              {sending ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="staff-chat-send-label">Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ============================================================
          ADMIN BROADCAST HOTEL UPDATE MODAL
          ============================================================ */}
      {isBroadcastModalOpen && (
        <div
          className="synaptix-modal-backdrop"
          onClick={() => setIsBroadcastModalOpen(false)}
        >
          <div
            className="synaptix-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "540px", padding: "28px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span className="card-pretitle">STAFF ANNOUNCEMENT</span>
                <h3 className="card-title-light">Broadcast Hotel Update</h3>
                <p className="card-desc-muted">
                  Post a hotel announcement to appear in employee notifications and staff chat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="modal-close-pill"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostBroadcast} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="desk-input-field">
                <label>Announcement Title *</label>
                <div className="input-wrap">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="e.g. VIP Guest Arrival at 4:00 PM"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="desk-input-field">
                  <label>Audience / Department</label>
                  <div className="input-wrap">
                    <Users className="w-4 h-4 text-purple-400" />
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                    >
                      <option value="All">All Hotel Staff (Rooms + Kitchen)</option>
                      <option value="Room Manager">Room Desk Only</option>
                      <option value="Food Manager">Food Desk Only</option>
                    </select>
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>Priority Level</label>
                  <div className="input-wrap">
                    <Flame className="w-4 h-4 text-purple-400" />
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value)}
                    >
                      <option value="Normal">🟢 Normal Notice</option>
                      <option value="High">🟠 High Priority</option>
                      <option value="Urgent">🔴 Urgent Operational Alert</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="desk-input-field">
                <label>Announcement Description & Instructions *</label>
                <textarea
                  placeholder="Provide instructions for receptionists and kitchen managers..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "var(--bg-card-inner)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    background: "var(--bg-card-inner)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={postingUpdate}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "12px",
                    background: "var(--primary-gradient)",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
                  }}
                >
                  {postingUpdate ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Megaphone className="w-4 h-4" />
                      <span>Broadcast to Employees</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

