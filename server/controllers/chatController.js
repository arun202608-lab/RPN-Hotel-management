const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

// Seed default initial welcome update & chat coordination if empty
const seedDefaultUpdates = async () => {
  try {
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.create([
        {
          title: "🏨 Welcome to RPN Hotel Staff Network",
          message:
            "Admin, Room Desk, and Food Desk are now securely connected. Use Internal Staff Chat for live front-desk and kitchen order coordination.",
          priority: "Normal",
          targetRole: "All",
          createdByName: "Hotel Administrator",
          createdByRole: "Super Admin",
        },
        {
          title: "⭐ VIP Guest Arrival at 4:00 PM Today",
          message:
            "Executive Suite #104 reserved for VIP guests. Front Desk please prepare welcome pass; Kitchen prepare complimentary high tea.",
          priority: "High",
          targetRole: "All",
          createdByName: "Hotel Administrator",
          createdByRole: "Super Admin",
        },
      ]);
      console.log("✅ Seeded default hotel staff updates & announcements");
    }

    const msgCount = await Message.countDocuments();
    if (msgCount === 0) {
      const adminUser = await Admin.findOne({ email: "admin@hotel.com" });
      const roomUser = await Admin.findOne({ email: "room@hotel.com" });
      const foodUser = await Admin.findOne({ email: "food@hotel.com" });

      if (adminUser && roomUser && foodUser) {
        await Message.create([
          {
            senderId: adminUser._id,
            senderName: "Hotel Administrator",
            senderRole: "Super Admin",
            senderEmail: adminUser.email,
            receiverRole: "Room Manager",
            receiverName: "Priya Sharma (Room Desk)",
            receiverEmail: roomUser.email,
            message: "Hello Priya, please ensure Deluxe Room #103 is inspected and ready for evening check-in.",
            isRead: true,
            readBy: [adminUser.email, roomUser.email],
          },
          {
            senderId: roomUser._id,
            senderName: "Priya Sharma (Room Desk)",
            senderRole: "Room Manager",
            senderEmail: roomUser.email,
            receiverRole: "Super Admin",
            receiverName: "Hotel Administrator",
            receiverEmail: adminUser.email,
            message: "Understood, Sir! Room #103 has been sanitized and key pass is prepared.",
            isRead: true,
            readBy: [adminUser.email, roomUser.email],
          },
          {
            senderId: adminUser._id,
            senderName: "Hotel Administrator",
            senderRole: "Super Admin",
            senderEmail: adminUser.email,
            receiverRole: "Food Manager",
            receiverName: "Chef Rajesh (Food Desk)",
            receiverEmail: foodUser.email,
            message: "Chef Rajesh, banquet dinner buffet begins at 7:30 PM. Please verify inventory.",
            isRead: true,
            readBy: [adminUser.email, foodUser.email],
          },
          {
            senderId: foodUser._id,
            senderName: "Chef Rajesh (Food Desk)",
            senderRole: "Food Manager",
            senderEmail: foodUser.email,
            receiverRole: "Super Admin",
            receiverName: "Hotel Administrator",
            receiverEmail: adminUser.email,
            message: "Yes Administrator, buffet prep is 90% completed. Kitchen staff is on schedule.",
            isRead: true,
            readBy: [adminUser.email, foodUser.email],
          },
        ]);
        console.log("✅ Seeded default internal staff chat messages");
      }
    }
  } catch (err) {
    console.error("Failed to seed chat/notifications:", err.message);
  }
};

// GET /api/chat/messages
// Returns messages relevant to logged in user
const getMessages = async (req, res) => {
  try {
    const userRole = req.admin.role;
    const userEmail = req.admin.email;
    const { contactRole } = req.query;

    let filter = {};

    const isAdmin = userRole === "Super Admin" || userRole === "Admin";
    const isRoom = userRole === "Room Manager" || userRole === "Receptionist";
    const isFood = userRole === "Food Manager";

    if (contactRole) {
      if (contactRole === "All") {
        filter = { receiverRole: "All" };
      } else if (isAdmin) {
        // Admin chatting with contactRole (Room Manager or Food Manager)
        filter = {
          $or: [
            { senderRole: { $in: ["Super Admin", "Admin"] }, receiverRole: contactRole },
            { senderRole: contactRole, receiverRole: { $in: ["Super Admin", "Admin"] } },
          ],
        };
      } else if (isRoom) {
        if (contactRole.includes("Admin")) {
          filter = {
            $or: [
              { senderRole: { $in: ["Room Manager", "Receptionist"] }, receiverRole: { $in: ["Super Admin", "Admin"] } },
              { senderRole: { $in: ["Super Admin", "Admin"] }, receiverRole: { $in: ["Room Manager", "Receptionist"] } },
            ],
          };
        } else {
          // Room Desk chatting with Food Desk
          filter = {
            $or: [
              { senderRole: { $in: ["Room Manager", "Receptionist"] }, receiverRole: "Food Manager" },
              { senderRole: "Food Manager", receiverRole: { $in: ["Room Manager", "Receptionist"] } },
            ],
          };
        }
      } else if (isFood) {
        if (contactRole.includes("Admin")) {
          filter = {
            $or: [
              { senderRole: "Food Manager", receiverRole: { $in: ["Super Admin", "Admin"] } },
              { senderRole: { $in: ["Super Admin", "Admin"] }, receiverRole: "Food Manager" },
            ],
          };
        } else {
          // Food Desk chatting with Room Desk
          filter = {
            $or: [
              { senderRole: "Food Manager", receiverRole: { $in: ["Room Manager", "Receptionist"] } },
              { senderRole: { $in: ["Room Manager", "Receptionist"] }, receiverRole: "Food Manager" },
            ],
          };
        }
      }
    } else {
      // General messages for this user
      if (isAdmin) {
        filter = {}; // Admin sees all staff coordination
      } else if (isRoom) {
        filter = {
          $or: [
            { senderRole: { $in: ["Room Manager", "Receptionist"] } },
            { receiverRole: { $in: ["Room Manager", "Receptionist", "All"] } },
          ],
        };
      } else if (isFood) {
        filter = {
          $or: [
            { senderRole: "Food Manager" },
            { receiverRole: { $in: ["Food Manager", "All"] } },
          ],
        };
      }
    }

    const messages = await Message.find(filter).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve messages" });
  }
};

// POST /api/chat/messages
// Send message from Admin to Employee or Employee to Admin
const sendMessage = async (req, res) => {
  try {
    const { receiverRole, receiverName, receiverEmail, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty" });
    }

    const newMessage = await Message.create({
      senderId: req.admin._id,
      senderName: req.admin.name,
      senderRole: req.admin.role,
      senderEmail: req.admin.email,
      receiverRole: receiverRole || "Super Admin",
      receiverName: receiverName || "",
      receiverEmail: receiverEmail || "",
      message: message.trim(),
      readBy: [req.admin.email],
    });

    // If message is broadcast to 'All', automatically add to notifications
    if (receiverRole === "All") {
      await Notification.create({
        title: `📢 Announcement from ${req.admin.name}`,
        message: message.trim(),
        priority: "High",
        targetRole: "All",
        createdByName: req.admin.name,
        createdByRole: req.admin.role,
        readBy: [req.admin.email],
      });
    }

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ success: false, message: "Failed to deliver message" });
  }
};

// PUT /api/chat/messages/read
// Mark thread as read
const markMessagesRead = async (req, res) => {
  try {
    const { senderRole } = req.body;
    const userRole = req.admin.role;
    const userEmail = req.admin.email;

    if (!senderRole) {
      return res.status(400).json({ success: false, message: "Sender role required" });
    }

    await Message.updateMany(
      {
        senderRole,
        receiverRole: { $in: [userRole, "All"] },
        readBy: { $ne: userEmail },
      },
      {
        $set: { isRead: true },
        $addToSet: { readBy: userEmail },
      }
    );

    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.error("markMessagesRead error:", err);
    res.status(500).json({ success: false, message: "Failed to mark messages read" });
  }
};

// GET /api/chat/notifications
// Hotel updates & notifications
const getNotifications = async (req, res) => {
  try {
    const userRole = req.admin.role;
    const isAdmin = userRole === "Super Admin" || userRole === "Admin";

    let filter = {};
    if (!isAdmin) {
      filter = {
        targetRole: { $in: ["All", userRole] },
      };
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(30);

    // Calculate unread count for current user
    const unreadCount = notifications.filter(
      (n) => !n.readBy || !n.readBy.includes(req.admin.email)
    ).length;

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve hotel updates" });
  }
};

// POST /api/chat/notifications
// Admin creates hotel update / announcement
const createNotification = async (req, res) => {
  try {
    const isAdmin = req.admin.role === "Super Admin" || req.admin.role === "Admin";
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only Hotel Administrators can broadcast hotel updates.",
      });
    }

    const { title, message, priority, targetRole } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message content are required.",
      });
    }

    const newNotification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      priority: priority || "Normal",
      targetRole: targetRole || "All",
      createdByName: req.admin.name,
      createdByRole: req.admin.role,
      readBy: [req.admin.email],
    });

    res.status(201).json({
      success: true,
      data: newNotification,
    });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ success: false, message: "Failed to post hotel update" });
  }
};

// PUT /api/chat/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.admin.email },
    });
    res.json({ success: true, message: "Notification marked read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Operation failed" });
  }
};

// DELETE /api/chat/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const isAdmin = req.admin.role === "Super Admin" || req.admin.role === "Admin";
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Admin authorization required" });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

// GET /api/chat/contacts
// Returns list of staff chat channels with last message & unread count
const getChatContacts = async (req, res) => {
  try {
    const userRole = req.admin.role;
    const userEmail = req.admin.email;
    const isAdmin = userRole === "Super Admin" || userRole === "Admin";

    // Standard contacts list
    const contacts = [
      {
        id: "super_admin",
        role: "Super Admin",
        name: "Hotel Administrator",
        title: "Executive Management",
        email: "admin@hotel.com",
        online: true,
        avatarIcon: "Crown",
        color: "admin",
      },
      {
        id: "room_manager",
        role: "Room Manager",
        name: "Priya Sharma (Room Desk)",
        title: "Front Desk & Reservations",
        email: "room@hotel.com",
        online: true,
        avatarIcon: "DoorOpen",
        color: "room",
      },
      {
        id: "food_manager",
        role: "Food Manager",
        name: "Chef Rajesh (Food Desk)",
        title: "Dining & Kitchen Operations",
        email: "food@hotel.com",
        online: true,
        avatarIcon: "ChefHat",
        color: "food",
      },
      {
        id: "all_staff",
        role: "All",
        name: "📢 Hotel Staff Broadcast",
        title: "General Hotel Announcements",
        email: "broadcast@hotel.com",
        online: true,
        avatarIcon: "Sparkles",
        color: "broadcast",
      },
    ];

    // Filter out oneself from the direct chat list, but keep Broadcast
    const filtered = contacts.filter((c) => {
      if (c.role === "All") return true;
      if (isAdmin && (c.role === "Super Admin" || c.role === "Admin")) return false;
      if ((userRole === "Room Manager" || userRole === "Receptionist") && c.role === "Room Manager") return false;
      if (userRole === "Food Manager" && c.role === "Food Manager") return false;
      return true;
    });

    // Populate unread count & last message for each contact
    const enriched = await Promise.all(
      filtered.map(async (contact) => {
        let messageFilter = {};
        if (contact.role === "All") {
          messageFilter = { receiverRole: "All" };
        } else {
          messageFilter = {
            $or: [
              { senderRole: contact.role, receiverRole: { $in: [userRole, "All"] } },
              { senderRole: userRole, receiverRole: contact.role },
            ],
          };
        }

        const lastMsg = await Message.findOne(messageFilter).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderRole: contact.role,
          receiverRole: { $in: [userRole, "All"] },
          readBy: { $ne: userEmail },
        });

        return {
          ...contact,
          lastMessage: lastMsg?.message || "No messages yet",
          lastTime: lastMsg?.createdAt || null,
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    console.error("getChatContacts error:", err);
    res.status(500).json({ success: false, message: "Failed to load chat channels" });
  }
};

module.exports = {
  seedDefaultUpdates,
  getMessages,
  sendMessage,
  markMessagesRead,
  getNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  getChatContacts,
};

