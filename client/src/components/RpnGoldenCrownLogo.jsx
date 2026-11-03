import React from "react";

// Signature RPN Luxury Hotel Royal Crown & Lotus Vector Logo
export const RpnGoldenCrownLogo = ({ className = "w-10 h-8", idPrefix = "rpn" }) => {
  const gradId = `${idPrefix}-goldMetallic`;
  const shadowId = `${idPrefix}-goldShine`;

  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7e199" />
          <stop offset="25%" stopColor="#d9a84a" />
          <stop offset="65%" stopColor="#be8d36" />
          <stop offset="100%" stopColor="#966718" />
        </linearGradient>
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#805615" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Center Diamond / Spear Petal */}
      <path
        d="M60 8 L73 38 L60 56 L47 38 Z"
        stroke={`url(#${gradId})`}
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${shadowId})`}
      />
      {/* Inner Jewel */}
      <polygon
        points="60,22 66,36 60,46 54,36"
        fill={`url(#${gradId})`}
      />

      {/* Left Outer Lotus Wing */}
      <path
        d="M47 38 L22 24 C16 44 26 68 60 78"
        stroke={`url(#${gradId})`}
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${shadowId})`}
      />

      {/* Right Outer Lotus Wing */}
      <path
        d="M73 38 L98 24 C104 44 94 68 60 78"
        stroke={`url(#${gradId})`}
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${shadowId})`}
      />

      {/* Left Inner Supporting Petal */}
      <path
        d="M47 56 C36 62 38 68 60 78"
        stroke={`url(#${gradId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right Inner Supporting Petal */}
      <path
        d="M73 56 C84 62 82 68 60 78"
        stroke={`url(#${gradId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default RpnGoldenCrownLogo;

