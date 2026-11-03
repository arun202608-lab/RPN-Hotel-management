import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import TamilMascot from "../components/TamilMascot";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  HeartHandshake,
  Crown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  DoorOpen,
  UtensilsCrossed,
} from "lucide-react";

// Golden Lotus & Crown Luxury Emblem SVG
export const RpnGoldenCrownLogo = ({ className = "w-14 h-12" }) => (
  <svg
    viewBox="0 0 120 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f7e199" />
        <stop offset="25%" stopColor="#d9a84a" />
        <stop offset="65%" stopColor="#be8d36" />
        <stop offset="100%" stopColor="#966718" />
      </linearGradient>
      <filter id="goldShine" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#805615" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Center Diamond / Spear Petal */}
    <path
      d="M60 8 L73 38 L60 56 L47 38 Z"
      stroke="url(#goldMetallic)"
      strokeWidth="3.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
      filter="url(#goldShine)"
    />
    {/* Inner Jewel */}
    <polygon
      points="60,22 66,36 60,46 54,36"
      fill="url(#goldMetallic)"
    />

    {/* Left Outer Lotus Wing */}
    <path
      d="M47 38 L22 24 C16 44 26 68 60 78"
      stroke="url(#goldMetallic)"
      strokeWidth="3.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
      filter="url(#goldShine)"
    />

    {/* Right Outer Lotus Wing */}
    <path
      d="M73 38 L98 24 C104 44 94 68 60 78"
      stroke="url(#goldMetallic)"
      strokeWidth="3.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
      filter="url(#goldShine)"
    />

    {/* Left Inner Supporting Petal */}
    <path
      d="M47 56 C36 62 38 68 60 78"
      stroke="url(#goldMetallic)"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Right Inner Supporting Petal */}
    <path
      d="M73 56 C84 62 82 68 60 78"
      stroke="url(#goldMetallic)"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Lock scrolling on document and body only when on tall desktop screens
  useEffect(() => {
    const handleScrollLock = () => {
      const isDesktop = window.innerWidth > 1024 && window.innerHeight >= 720;
      if (isDesktop) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.height = "100%";
        document.documentElement.style.height = "100%";
      } else {
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
        document.body.style.height = "auto";
        document.documentElement.style.height = "auto";
      }
    };

    handleScrollLock();
    window.addEventListener("resize", handleScrollLock);

    return () => {
      window.removeEventListener("resize", handleScrollLock);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
    };
  }, []);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password flow state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Handle Login Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your admin username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(username.trim(), password);
      const role = res?.admin?.role;
      if (role === "Room Manager" || role === "Receptionist") {
        navigate("/room-desk");
      } else if (role === "Food Manager") {
        navigate("/food-desk");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failure:", err);
      const isNetworkErr = !err.response && (err.message === "Network Error" || err.code === "ERR_NETWORK");
      const currentApiUrl = api.defaults.baseURL || "";
      if (isNetworkErr) {
        setError(
          `Network Error: Backend connection failed (${currentApiUrl}). Please verify backend is live on Vercel and hotel_API_URL is set in Vercel client.`
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Invalid username or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Reset Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered admin email address.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.post("/auth/forgot-password", {
        email: forgotEmail.trim(),
      });

      if (res.data.success) {
        setGeneratedCode(res.data.resetCode || "");
        setSecurityQuestion(
          res.data.securityQuestion || "What is your hotel name?"
        );
        setForgotStep(2);
        setForgotSuccess("Verification code generated! Enter it below.");
      }
    } catch (err) {
      setForgotError(
        err.response?.data?.message || "Failed to process forgot password request."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Reset Password with Code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!resetCode && !securityAnswer) {
      setForgotError("Please provide the verification code or security answer.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        code: resetCode.trim(),
        securityAnswer: securityAnswer.trim(),
        newPassword,
      });

      if (res.data.success) {
        setForgotStep(3);
        setForgotSuccess("Password reset successfully!");
        setPassword(newPassword);
        setUsername(forgotEmail);
      }
    } catch (err) {
      setForgotError(
        err.response?.data?.message || "Failed to reset password. Please check code."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="rpn-login-viewport">
      {/* Hotel Night Exterior High-Definition Background */}
      <div className="rpn-login-backdrop"></div>

      {/* Subtle Dark Vignette for contrast */}
      <div className="rpn-login-vignette"></div>

      {/* Main Split Layout Container */}
      <div className="rpn-login-layout">
        {/* Left Side: Luxury Hotel Brand Experience */}
        <div className="rpn-hero-left">
          <div className="rpn-hero-brand-block">
            <RpnGoldenCrownLogo className="rpn-hero-logo" />
            <h1 className="rpn-hero-brand-title">RPN HOTEL</h1>
            <p className="rpn-hero-tagline">Experience Luxury, Feel at Home</p>
          </div>

          <div className="rpn-hero-features-bar">
            <div className="rpn-feature-pill">
              <HeartHandshake className="rpn-feature-icon" />
              <span>Comfort</span>
            </div>
            <span className="rpn-feature-sep">|</span>
            <div className="rpn-feature-pill">
              <Crown className="rpn-feature-icon" />
              <span>Hospitality</span>
            </div>
            <span className="rpn-feature-sep">|</span>
            <div className="rpn-feature-pill">
              <Sparkles className="rpn-feature-icon" />
              <span>Unforgettable Stays</span>
            </div>
          </div>
        </div>

        {/* Right Side: Exact White Login Card */}
        <div className="rpn-card-right-wrapper">
          {/* Animated 3D Tamil Traditional Girl Mascot */}
          <TamilMascot />

          <div className="rpn-white-card">
            {!isForgotOpen ? (
              /* Normal Sign In Form */
              <div className="rpn-card-content">
                {/* Brand Header inside Card */}
                <div className="rpn-card-header">
                  <RpnGoldenCrownLogo className="rpn-card-logo" />
                  <h2 className="rpn-card-title">RPN HOTEL</h2>
                  <h4 className="rpn-card-subtitle">Admin Panel</h4>
                  <p className="rpn-card-caption">
                    Sign in to manage your hotel operations
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rpn-alert-banner alert-error" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Quick Role Autofill Selector */}
                <div className="login-role-selector">
                  <span className="role-selector-label">ONE-CLICK ROLE AUTOFILL</span>
                  <div className="role-selector-pills">
                    <button
                      type="button"
                      className={`role-select-pill ${username === "admin@hotel.com" ? "active" : ""}`}
                      onClick={() => {
                        setUsername("admin@hotel.com");
                        setPassword("admin123");
                        setError("");
                      }}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span>👑 Admin</span>
                    </button>

                    <button
                      type="button"
                      className={`role-select-pill ${username === "room@hotel.com" ? "active" : ""}`}
                      onClick={() => {
                        setUsername("room@hotel.com");
                        setPassword("room123");
                        setError("");
                      }}
                    >
                      <DoorOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>🏨 Room Desk</span>
                    </button>

                    <button
                      type="button"
                      className={`role-select-pill ${username === "food@hotel.com" ? "active" : ""}`}
                      onClick={() => {
                        setUsername("food@hotel.com");
                        setPassword("food123");
                        setError("");
                      }}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                      <span>🍽️ Food Desk</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="rpn-login-form">
                  {/* Admin Username Field */}
                  <div className="rpn-form-group">
                    <label htmlFor="admin-username">Admin Username</label>
                    <div className="rpn-input-container">
                      <User className="rpn-input-icon" />
                      <input
                        id="admin-username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="rpn-form-group">
                    <label htmlFor="admin-password">Password</label>
                    <div className="rpn-input-container">
                      <Lock className="rpn-input-icon" />
                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="rpn-eye-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Options Row: Remember Me & Forgot Password */}
                  <div className="rpn-options-row">
                    <label className="rpn-remember-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      className="rpn-forgot-link"
                      onClick={() => {
                        setForgotEmail(
                          username.includes("@") ? username : "admin@hotel.com"
                        );
                        setForgotStep(1);
                        setForgotError("");
                        setForgotSuccess("");
                        setIsForgotOpen(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Golden Sign In Button */}
                  <button
                    type="submit"
                    className="rpn-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="rpn-btn-loading">
                        <span className="rpn-spinner"></span>
                        Signing In...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Subtle, elegant demo credentials hint */}
                <div className="rpn-card-footer-hint">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername("admin@hotel.com");
                      setPassword("admin123");
                      setError("");
                    }}
                    className="rpn-quick-demo-btn"
                    title="Click to fill default administrator credentials"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Default: admin@hotel.com / admin123</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Forgot Password Flow Inside Luxury Card */
              <div className="rpn-card-content">
                <button
                  type="button"
                  className="rpn-back-btn"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotStep(1);
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>

                <div className="rpn-card-header rpn-forgot-header">
                  <RpnGoldenCrownLogo className="rpn-card-logo" />
                  <h2 className="rpn-card-title">RPN HOTEL</h2>
                  <h4 className="rpn-card-subtitle">Password Recovery</h4>
                  <p className="rpn-card-caption">
                    {forgotStep === 1 && "Enter admin email to request a reset code"}
                    {forgotStep === 2 && "Enter your 6-digit code and set new password"}
                    {forgotStep === 3 && "Password updated successfully!"}
                  </p>
                </div>

                {forgotError && (
                  <div className="rpn-alert-banner alert-error" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="rpn-alert-banner alert-success" role="status">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {/* Step 1: Email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleRequestCode} className="rpn-login-form">
                    <div className="rpn-form-group">
                      <label htmlFor="forgot-email">Admin Email Address</label>
                      <div className="rpn-input-container">
                        <User className="rpn-input-icon" />
                        <input
                          id="forgot-email"
                          type="email"
                          placeholder="admin@hotel.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="rpn-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Sending Code..." : "Send Reset Code"}
                    </button>
                  </form>
                )}

                {/* Step 2: Code & New Password */}
                {forgotStep === 2 && (
                  <form onSubmit={handleResetPassword} className="rpn-login-form">
                    {generatedCode && (
                      <div className="rpn-code-display-box">
                        <span>Your Recovery Code:</span>
                        <code>{generatedCode}</code>
                      </div>
                    )}

                    <div className="rpn-form-group">
                      <label htmlFor="reset-code">Verification Code</label>
                      <div className="rpn-input-container">
                        <KeyRound className="rpn-input-icon" />
                        <input
                          id="reset-code"
                          type="text"
                          placeholder="6-digit code"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                        />
                      </div>
                    </div>

                    {securityQuestion && (
                      <div className="rpn-form-group">
                        <label htmlFor="sec-ans">{securityQuestion}</label>
                        <div className="rpn-input-container">
                          <ShieldCheck className="rpn-input-icon" />
                          <input
                            id="sec-ans"
                            type="text"
                            placeholder="Enter your security answer"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="rpn-form-group">
                      <label htmlFor="new-pw">New Password</label>
                      <div className="rpn-input-container">
                        <Lock className="rpn-input-icon" />
                        <input
                          id="new-pw"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="rpn-eye-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rpn-form-group">
                      <label htmlFor="conf-pw">Confirm Password</label>
                      <div className="rpn-input-container">
                        <Lock className="rpn-input-icon" />
                        <input
                          id="conf-pw"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="rpn-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}

                {/* Step 3: Success */}
                {forgotStep === 3 && (
                  <div className="rpn-success-step">
                    <p className="rpn-success-msg">
                      Your administrator password has been updated. You can now sign in with your new credentials.
                    </p>
                    <button
                      type="button"
                      className="rpn-submit-btn"
                      onClick={() => {
                        setIsForgotOpen(false);
                        setForgotStep(1);
                      }}
                    >
                      Return to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
