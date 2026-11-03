const Room = require("../models/Room");

// 20 Luxury Rooms with shuffled types as requested
const default20Rooms = [
  { roomNumber: "101", roomType: "Single", pricePerNight: 1500, capacity: 1, status: "Available", description: "Standard Single with high-speed Wi-Fi & work desk" },
  { roomNumber: "102", roomType: "Double", pricePerNight: 2500, capacity: 2, status: "Available", description: "Spacious Double Bed with balcony and garden view" },
  { roomNumber: "103", roomType: "Deluxe", pricePerNight: 4200, capacity: 3, status: "Available", description: "Deluxe King Bed with mini bar, smart TV, and lounge area" },
  { roomNumber: "104", roomType: "Suite", pricePerNight: 6800, capacity: 4, status: "Available", description: "Executive Luxury Suite with separate living room & jacuzzi" },
  { roomNumber: "105", roomType: "Double", pricePerNight: 2600, capacity: 2, status: "Available", description: "Comfort Twin Double Room for family or colleagues" },
  { roomNumber: "106", roomType: "Single", pricePerNight: 1600, capacity: 1, status: "Available", description: "Executive Single with ergonomic workspace and rainfall shower" },
  { roomNumber: "107", roomType: "Deluxe", pricePerNight: 4500, capacity: 3, status: "Available", description: "Grand Deluxe with king bed and panoramic sunset view" },
  { roomNumber: "108", roomType: "Suite", pricePerNight: 7200, capacity: 4, status: "Available", description: "Royal Gold Suite with private dining and butler service" },
  { roomNumber: "109", roomType: "Double", pricePerNight: 2700, capacity: 2, status: "Available", description: "Premium Double Room overlooking the pool" },
  { roomNumber: "110", roomType: "Single", pricePerNight: 1700, capacity: 1, status: "Available", description: "Smart Single Studio with luxury mattress" },
  { roomNumber: "111", roomType: "Deluxe", pricePerNight: 4800, capacity: 3, status: "Available", description: "Heritage Deluxe with bespoke golden accents" },
  { roomNumber: "112", roomType: "Suite", pricePerNight: 8500, capacity: 4, status: "Available", description: "Presidential Luxury Suite with marble bathroom & spa tub" },
  { roomNumber: "113", roomType: "Single", pricePerNight: 1500, capacity: 1, status: "Available", description: "Minimalist Single Room for solo business travelers" },
  { roomNumber: "114", roomType: "Double", pricePerNight: 2800, capacity: 2, status: "Available", description: "Superior Double with plush king mattress and coffee bar" },
  { roomNumber: "115", roomType: "Deluxe", pricePerNight: 4600, capacity: 3, status: "Available", description: "Club Deluxe with complimentary high-tea access" },
  { roomNumber: "116", roomType: "Suite", pricePerNight: 7500, capacity: 4, status: "Available", description: "Penthouse Suite with private terrace and skyline view" },
  { roomNumber: "117", roomType: "Double", pricePerNight: 2500, capacity: 2, status: "Available", description: "Standard Double Room with full air conditioning" },
  { roomNumber: "118", roomType: "Single", pricePerNight: 1650, capacity: 1, status: "Available", description: "Deluxe Single with garden patio access" },
  { roomNumber: "119", roomType: "Deluxe", pricePerNight: 4900, capacity: 3, status: "Available", description: "Royal Sunset Deluxe with bespoke amenities" },
  { roomNumber: "120", roomType: "Suite", pricePerNight: 9500, capacity: 4, status: "Available", description: "Imperial Royal Suite - the pinnacle of RPN hospitality" },
];

// Seed 20 rooms if count < 20
async function seedDefaultRooms() {
  try {
    const count = await Room.countDocuments();
    if (count < 20) {
      for (const r of default20Rooms) {
        const exists = await Room.findOne({ roomNumber: r.roomNumber });
        if (!exists) {
          await Room.create(r);
        }
      }
      console.log("✅ Shuffled 20 Rooms initialized in catalog");
    }
  } catch (error) {
    console.error("Error seeding rooms:", error.message);
  }
}

// 1. Get all rooms (with optional ?status=Available or ?type=Single)
async function getRooms(req, res) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.type && req.query.type !== "All") {
      filter.roomType = req.query.type;
    }

    const rooms = await Room.find(filter).sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
}

// 2. Get a single room
async function getRoomById(req, res) {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid room ID",
    });
  }
}

// 3. Create a room
async function createRoom(req, res) {
  try {
    const {
      roomNumber,
      roomType,
      pricePerNight,
      capacity,
      status,
      description,
    } = req.body;

    const finalCapacity =
      capacity !== undefined && Number(capacity) > 0
        ? Number(capacity)
        : roomType === "Single"
        ? 1
        : roomType === "Suite"
        ? 4
        : 2;

    if (!roomNumber?.trim() || !roomType || pricePerNight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide room number, room type, and price per night",
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      roomType,
      pricePerNight: Number(pricePerNight),
      capacity: finalCapacity,
      status: status || "Available",
      description,
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
}

// 4. Update a room
async function updateRoom(req, res) {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists",
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to update room",
    });
  }
}

// 5. Delete a room
async function deleteRoom(req, res) {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete room",
    });
  }
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  seedDefaultRooms,
};
