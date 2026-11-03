import React from "react";

// Helper to determine gender if not explicitly provided
export function detectGender(name = "", explicitGender = "") {
  if (explicitGender && explicitGender !== "Other") {
    return explicitGender.toLowerCase().startsWith("f") ? "female" : "male";
  }
  const cleanName = (name || "").toLowerCase().trim();
  const femaleNames = [
    "priya", "deepa", "lakshmi", "kavitha", "anitha", "shanthi", "santhi", "meena",
    "divya", "sneha", "pooja", "swathi", "soundarya", "ramya", "keerthi", "lavanya",
    "sarah", "emma", "mary", "anita", "radha", "bhavani", "geetha", "rupa", "sita",
    "aarti", "aarthi", "vimala", "revathi", "nithya", "vidya", "uma", "jaya", "asha"
  ];
  const isFemale = femaleNames.some((fn) => cleanName.includes(fn));
  return isFemale ? "female" : "male";
}

// Deterministic seed based on name string
function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function UserAvatar({
  name = "User",
  gender = "Male",
  size = 40,
  className = "",
  showBadge = true,
}) {
  const actualGender = detectGender(name, gender);
  const variantIndex = hashString(name) % 3; // 0, 1, or 2

  // Gradient ID prefix to prevent conflicts
  const idSuffix = hashString(name).toString(36);

  // MALE AVATAR VARIANTS
  const renderMaleAvatar = () => {
    const gradients = [
      { from: "#4F46E5", to: "#7C3AED", hair: "#1E1B4B", skin: "#FBCFE8", shirt: "#312E81" },
      { from: "#0284C7", to: "#6366F1", hair: "#0F172A", skin: "#FED7AA", shirt: "#0369A1" },
      { from: "#7C3AED", to: "#C026D3", hair: "#2E1065", skin: "#FDE68A", shirt: "#581C87" },
    ];
    const theme = gradients[variantIndex];

    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }}
      >
        <defs>
          <linearGradient id={`mGrad-${idSuffix}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor={theme.from} />
            <stop offset="1" stopColor={theme.to} />
          </linearGradient>
        </defs>

        {/* Outer Circular Gradient Background */}
        <circle cx="50" cy="50" r="50" fill={`url(#mGrad-${idSuffix})`} />

        {/* Shoulders / Suit Jacket */}
        <path
          d="M20 96 C20 74 34 68 50 68 C66 68 80 74 80 96 Z"
          fill={theme.shirt}
        />
        {/* Shirt Collar / V-Neck */}
        <polygon points="50,84 40,68 60,68" fill="#FFFFFF" />
        <polygon points="50,84 46,68 54,68" fill="#F43F5E" />

        {/* Neck */}
        <rect x="44" y="55" width="12" height="16" rx="4" fill={theme.skin} />

        {/* Head / Face */}
        <ellipse cx="50" cy="44" rx="19" ry="22" fill={theme.skin} />

        {/* Ears */}
        <circle cx="31" cy="44" r="5" fill={theme.skin} />
        <circle cx="69" cy="44" r="5" fill={theme.skin} />

        {/* Stylish Modern Male Hair */}
        {variantIndex === 0 && (
          <path
            d="M31 38 C30 22 42 16 50 16 C60 16 70 20 69 38 C65 30 58 26 50 26 C40 26 34 32 31 38 Z"
            fill={theme.hair}
          />
        )}
        {variantIndex === 1 && (
          <path
            d="M30 40 C28 20 40 14 54 14 C68 14 71 24 69 40 C63 26 54 22 46 24 C38 26 33 34 30 40 Z"
            fill={theme.hair}
          />
        )}
        {variantIndex === 2 && (
          <path
            d="M31 40 C29 20 40 15 50 15 C62 15 70 22 69 40 C64 28 54 24 48 24 C40 24 34 32 31 40 Z"
            fill={theme.hair}
          />
        )}

        {/* Eyes */}
        <ellipse cx="43" cy="43" rx="2.2" ry="2.8" fill="#1E293B" />
        <ellipse cx="57" cy="43" rx="2.2" ry="2.8" fill="#1E293B" />

        {/* Eyebrows */}
        <path d="M39 37 Q43 35 47 37" stroke={theme.hair} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M53 37 Q57 35 61 37" stroke={theme.hair} strokeWidth="1.8" strokeLinecap="round" />

        {/* Smile */}
        <path d="M44 53 Q50 58 56 53" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  };

  // FEMALE AVATAR VARIANTS
  const renderFemaleAvatar = () => {
    const gradients = [
      { from: "#EC4899", to: "#8B5CF6", hair: "#311042", skin: "#FED7AA", shirt: "#831843" },
      { from: "#F43F5E", to: "#A855F7", hair: "#1E1B4B", skin: "#FDE68A", shirt: "#9D174D" },
      { from: "#A855F7", to: "#6366F1", hair: "#3B0764", skin: "#FECDD3", shirt: "#4C1D95" },
    ];
    const theme = gradients[variantIndex];

    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }}
      >
        <defs>
          <linearGradient id={`fGrad-${idSuffix}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor={theme.from} />
            <stop offset="1" stopColor={theme.to} />
          </linearGradient>
        </defs>

        {/* Outer Circular Gradient Background */}
        <circle cx="50" cy="50" r="50" fill={`url(#fGrad-${idSuffix})`} />

        {/* Back Hair (Long framing hair) */}
        <path
          d="M26 44 C24 64 28 80 34 88 C36 78 36 60 36 50 Z"
          fill={theme.hair}
        />
        <path
          d="M74 44 C76 64 72 80 66 88 C64 78 64 60 64 50 Z"
          fill={theme.hair}
        />

        {/* Shoulders / Blazer */}
        <path
          d="M22 96 C22 74 34 68 50 68 C66 68 78 74 78 96 Z"
          fill={theme.shirt}
        />
        {/* Blouse Neckline */}
        <path d="M42 68 Q50 82 58 68 Z" fill="#FFFFFF" />

        {/* Neck */}
        <rect x="45" y="55" width="10" height="15" rx="3" fill={theme.skin} />

        {/* Head / Face */}
        <ellipse cx="50" cy="43" rx="18" ry="21" fill={theme.skin} />

        {/* Cute Earrings */}
        <circle cx="31" cy="46" r="2.5" fill="#FBBF24" />
        <circle cx="69" cy="46" r="2.5" fill="#FBBF24" />

        {/* Front Hair / Bangs */}
        <path
          d="M31 38 C30 18 42 14 50 14 C62 14 70 20 69 38 C64 28 56 22 50 25 C42 22 35 28 31 38 Z"
          fill={theme.hair}
        />

        {/* Eyes with Lashes */}
        <ellipse cx="43" cy="43" rx="2" ry="2.6" fill="#1E293B" />
        <ellipse cx="57" cy="43" rx="2" ry="2.6" fill="#1E293B" />
        <path d="M41 40 L39 38" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M59 40 L61 38" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />

        {/* Eyebrows */}
        <path d="M39 36 Q43 34 47 36" stroke={theme.hair} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 36 Q57 34 61 36" stroke={theme.hair} strokeWidth="1.5" strokeLinecap="round" />

        {/* Soft Cheeks */}
        <circle cx="39" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />
        <circle cx="61" cy="48" r="3" fill="#FDA4AF" opacity="0.6" />

        {/* Friendly Smile */}
        <path d="M45 52 Q50 56 55 52" stroke="#E11D48" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  };

  return (
    <div
      className={`user-avatar-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.25)",
        border: "1.5px solid rgba(139, 92, 246, 0.45)",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
      title={`${name} (${actualGender === "female" ? "Female" : "Male"})`}
    >
      {actualGender === "female" ? renderFemaleAvatar() : renderMaleAvatar()}
    </div>
  );
}

