import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import {
  MessageSquare,
  X,
  Send,
  Maximize2,
  RotateCw,
  Megaphone,
  CheckCheck,
} from "lucide-react";

export default function FloatingChatWidget() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = admin?.role || "Super Admin";
  const isAdmin = userRole === "Super Admin" || userRole === "Admin";

  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState("all_staff");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef(null);

  // If already on /chat page, don't show the floating widget
  const isChatPage = location.pathname.includes("/chat");

  // Fetch contacts & unread counts
  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get("/chat/contacts");
      const list = res.data?.data || [];
      setContacts(list);

      const unread = list.reduce(
        (sum, c) => sum + (Number(c.unreadCount) || 0),
        0
      );
      setTotalUnread(unread);

      // Auto-set default active contact if not set
      if (list.length > 0 && activeContactId === "all_staff") {
        setActiveContactId(list[0].id);
      }
    } catch {
      // Background silent catch
    }
  }, [activeContactId]);

  const activeContact =
    contacts.find((c) => c.id === activeContactId) || contacts[0] || null;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!activeContact) return;
    try {
      const res = await api.get(`/chat/messages?contactRole=${activeContact.role}`);
      setMessages(res.data?.data || []);

      if (isOpen && activeContact.role !== "All") {
        await api.put("/chat/messages/read", { senderRole: activeContact.role });
      }
    } catch {
      // Silent catch
    }
  }, [activeContact, isOpen]);

  useEffect(() => {
    fetchContacts();
    const timer = setInterval(() => {
      fetchContacts();
      if (isOpen) {
        fetchMessages();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchContacts, fetchMessages, isOpen]);

  useEffect(() => {
    if (isOpen && activeContact) {
      fetchMessages();
    }
  }, [isOpen, activeContact, fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      setSending(true);
      const res = await api.post("/chat/messages", {
        receiverRole: activeContact.role,
        receiverName: activeContact.name,
        receiverEmail: activeContact.email || "",
        message: messageText,
      });

      const newMsg = res.data?.data;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
      fetchContacts();
    } catch (err) {
      console.error("Floating send error:", err);
    } finally {
      setSending(false);
    }
  };

  if (isChatPage) return null;

  return (
    <div
      className="floating-chat-container"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          type="button"
          className="floating-chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "9999px",
            background: "var(--primary-gradient)",
            color: "#FFFFFF",
            border: "none",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.5)",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "13.5px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ position: "relative" }}>
            <MessageSquare className="w-5 h-5" />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#34D399",
                boxShadow: "0 0 6px #34D399",
              }}
            ></span>
          </div>

          <span className="floating-chat-btn-label">Staff Chat</span>

          {totalUnread > 0 && (
            <span
              style={{
                background: "#EF4444",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: "800",
                padding: "2px 7px",
                borderRadius: "9999px",
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.8)",
              }}
            >
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Expanded Floating Messenger Card */}
      {isOpen && (
        <div
          className="floating-chat-window"
          style={{
            width: "360px",
            height: "500px",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 120px)",
            background: "var(--bg-card)",
            border: "1.5px solid var(--border-subtle)",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--bg-card-inner)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <div>
                <strong style={{ fontSize: "13.5px", color: "var(--text-main)", display: "block" }}>
                  Staff Relay Chat
                </strong>
                <span style={{ fontSize: "10.5px", color: "var(--accent)" }}>
                  {admin?.name} ({userRole})
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/chat");
                }}
                title="Open Fullscreen Chat"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contact Pills Switcher */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "8px 12px",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border-subtle)",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {contacts.map((c) => {
              const active = activeContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveContactId(c.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: active ? "700" : "600",
                    background: active ? "var(--primary-gradient)" : "var(--bg-card-inner)",
                    color: active ? "#FFFFFF" : "var(--text-muted)",
                    border: active ? "none" : "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>{c.name.split(" ")[0]}</span>
                  {c.unreadCount > 0 && (
                    <span
                      style={{
                        background: active ? "#FFFFFF" : "var(--primary)",
                        color: active ? "var(--primary)" : "#FFFFFF",
                        fontSize: "9px",
                        fontWeight: "800",
                        padding: "1px 5px",
                        borderRadius: "9999px",
                      }}
                    >
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: "12px 14px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "var(--bg-card-inner)",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "12px", margin: 0 }}>No messages yet with {activeContact?.name}.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isSentByMe = m.senderEmail === admin?.email;
                return (
                  <div
                    key={m._id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isSentByMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "2px" }}>
                      {isSentByMe ? "You" : m.senderName.split(" ")[0]} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "8px 14px",
                        borderRadius: isSentByMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: isSentByMe ? "var(--primary-gradient)" : "var(--bg-card)",
                        color: isSentByMe ? "#FFFFFF" : "var(--text-main)",
                        border: isSentByMe ? "none" : "1px solid var(--border-subtle)",
                        fontSize: "12.5px",
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "10px 14px",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder={`Message ${activeContact?.name?.split(" ")[0] || "staff"}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "9px 14px",
                borderRadius: "10px",
                background: "var(--bg-card-inner)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                border: "none",
                background: inputText.trim() ? "var(--primary-gradient)" : "var(--bg-card-inner)",
                color: inputText.trim() ? "#FFFFFF" : "var(--text-dim)",
                display: "grid",
                placeItems: "center",
                cursor: inputText.trim() ? "pointer" : "default",
                flexShrink: 0,
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

