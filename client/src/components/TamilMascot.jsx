import { useState, useEffect } from "react";

export default function TamilMascot() {
  const [entered, setEntered] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);

  useEffect(() => {
    // 1. Initial Load: Login card loads first, avatar stays hidden below
    // After 800ms, she smoothly rises straight up from the bottom
    const enterTimer = setTimeout(() => {
      setEntered(true);
    }, 800);

    // 2. Speech bubble appears smoothly after she has fully risen into position
    const speechTimer = setTimeout(() => {
      setShowSpeech(true);
    }, 2000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(speechTimer);
    };
  }, []);

  const handleMascotClick = () => {
    setIsGreeting(true);
    setTimeout(() => setIsGreeting(false), 900);
  };

  return (
    <div
      className={`rpn-mascot-anchor ${entered ? "entered" : "hidden"} ${isGreeting ? "greeting-nod" : ""}`}
      onClick={handleMascotClick}
      title="வணக்கம்! Welcome to RPN Luxury Hotel (Click to greet)"
      aria-label="RPN Hotel Tamil Traditional Welcome Mascot"
    >
      {/* Welcoming Speech Bubble: 'வணக்கம்! Welcome Back !' */}
      <div className={`mascot-speech-bubble ${showSpeech ? "visible" : ""}`}>
        <div className="speech-bubble-inner">
          <span className="speech-lotus-icon">🪷</span>
          <div className="speech-text-col">
            <span className="speech-tamil-word">வணக்கம்!</span>
            <span className="speech-english-word">Welcome Back !</span>
          </div>
        </div>
        <div className="speech-bubble-tail"></div>
      </div>

      {/* 3D Tamil Nadu Girl Character in Vanakkam / Namaste Gesture */}
      <div className="mascot-character-container">
        <img
          src="/tamil-mascot-vanakkam.png?v=full_standing_3d"
          alt="RPN Hotel 3D Tamil Traditional Girl Mascot in Vanakkam Greeting"
          className="mascot-character-image"
          draggable={false}
        />
      </div>
    </div>
  );
}

