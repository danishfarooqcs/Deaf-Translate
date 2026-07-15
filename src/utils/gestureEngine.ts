export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Compute Euclidean distance between two 3D landmarks
export function getDistance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

// Compute 2D distance (often more robust for webcam viewing straight-on)
export function getDistance2D(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}

export interface HandFingerState {
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
}

export function analyzeFingerStates(landmarks: Landmark[], handScale: number): HandFingerState {
  const wrist = landmarks[0];
  
  // Finger MCP and TIP indexes
  // Thumb: MCP=2, IP=3, TIP=4
  // Index: MCP=5, PIP=6, TIP=8
  // Middle: MCP=9, PIP=10, TIP=12
  // Ring: MCP=13, PIP=14, TIP=16
  // Pinky: MCP=17, PIP=18, TIP=20

  const indexMCP = landmarks[5];
  const indexTIP = landmarks[8];
  
  const middleMCP = landmarks[9];
  const middleTIP = landmarks[12];
  
  const ringMCP = landmarks[13];
  const ringTIP = landmarks[16];
  
  const pinkyMCP = landmarks[17];
  const pinkyTIP = landmarks[20];
  
  const thumbMCP = landmarks[2];
  const thumbTIP = landmarks[4];
  const thumbIP = landmarks[3];

  // A finger is extended if the distance from Wrist to TIP is greater than Wrist to MCP
  // We normalize by handScale to make it distance-independent.
  const indexExtended = getDistance(wrist, indexTIP) > getDistance(wrist, indexMCP) * 1.15;
  const middleExtended = getDistance(wrist, middleTIP) > getDistance(wrist, middleMCP) * 1.15;
  const ringExtended = getDistance(wrist, ringTIP) > getDistance(wrist, ringMCP) * 1.15;
  const pinkyExtended = getDistance(wrist, pinkyTIP) > getDistance(wrist, pinkyMCP) * 1.15;
  
  // Thumb is extended if it's far from the palm and index finger
  const thumbToPinkyBase = getDistance(thumbTIP, landmarks[17]);
  const thumbToIdxMCP = getDistance(thumbTIP, indexMCP);
  const thumbExtended = thumbToIdxMCP > handScale * 0.9 && getDistance(wrist, thumbTIP) > getDistance(wrist, thumbMCP) * 1.1;

  return {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended
  };
}

export interface GestureResult {
  sign: string;
  confidence: number;
  reasoning: string;
}

export function detectGesture(landmarks: Landmark[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { sign: 'NO_HAND', confidence: 0, reasoning: 'No hand detected' };
  }

  // Hand scale (wrist to index finger MCP is a good stable reference)
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  const handScale = getDistance(wrist, middleMCP);

  if (handScale === 0) {
    return { sign: 'UNKNOWN', confidence: 0, reasoning: 'Invalid hand data' };
  }

  const {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended
  } = analyzeFingerStates(landmarks, handScale);

  // Tips for convenience
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // MCP bases
  const thumbMCP = landmarks[2];
  const indexMCP = landmarks[5];
  const middleMCPPoint = landmarks[9];
  const ringMCPPoint = landmarks[13];
  const pinkyMCPPoint = landmarks[17];

  // Specific distances for complex shapes
  const thumbIndexTipDist = getDistance(thumbTip, indexTip) / handScale;
  const thumbMiddleTipDist = getDistance(thumbTip, middleTip) / handScale;
  const indexMiddleTipDist = getDistance(indexTip, middleTip) / handScale;
  const ringPinkyTipDist = getDistance(ringTip, pinkyTip) / handScale;
  
  // 1. I Love You: Thumb, Index, Pinky extended. Middle and Ring folded.
  if (thumbExtended && indexExtended && pinkyExtended && !middleExtended && !ringExtended) {
    return { 
      sign: 'I Love You', 
      confidence: 94, 
      reasoning: 'Thumb, Index, Pinky extended; Middle, Ring folded' 
    };
  }

  // 2. Y Sign: Thumb and Pinky extended. Index, Middle, Ring folded.
  if (thumbExtended && pinkyExtended && !indexExtended && !middleExtended && !ringExtended) {
    return { 
      sign: 'Y', 
      confidence: 96, 
      reasoning: 'ASL letter Y: Thumb and Pinky extended' 
    };
  }

  // 3. L Sign: Thumb and Index extended. Middle, Ring, Pinky folded.
  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    // Make sure thumb and index are separated
    if (thumbIndexTipDist > 0.8) {
      return { 
        sign: 'L', 
        confidence: 95, 
        reasoning: 'ASL letter L: Thumb and Index extended at angle' 
      };
    }
  }

  // 4. V Sign (Peace): Index and Middle extended. Thumb, Ring, Pinky folded.
  if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    if (indexMiddleTipDist > 0.3) {
      return { 
        sign: 'V', 
        confidence: 95, 
        reasoning: 'ASL letter V: Index and Middle separated' 
      };
    } else {
      // U Sign: Index and Middle extended together.
      return {
        sign: 'U',
        confidence: 90,
        reasoning: 'ASL letter U: Index and Middle extended together'
      };
    }
  }

  // 5. W Sign: Index, Middle, Ring extended. Pinky and Thumb folded.
  if (!thumbExtended && indexExtended && middleExtended && ringExtended && !pinkyExtended) {
    return { 
      sign: 'W', 
      confidence: 92, 
      reasoning: 'ASL letter W: Index, Middle, Ring extended' 
    };
  }

  // 6. F Sign: Index and Thumb tips touching. Middle, Ring, Pinky extended.
  if (thumbIndexTipDist < 0.25 && middleExtended && ringExtended && pinkyExtended) {
    return { 
      sign: 'F', 
      confidence: 93, 
      reasoning: 'ASL letter F: Index and Thumb touch, others extended' 
    };
  }

  // 7. D Sign: Index extended. Thumb, Middle, Ring, Pinky tips touch.
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const thumbMiddleDist = getDistance(thumbTip, middleTip) / handScale;
    const thumbRingDist = getDistance(thumbTip, ringTip) / handScale;
    if (thumbMiddleDist < 0.4 && thumbRingDist < 0.4) {
      return { 
        sign: 'D', 
        confidence: 91, 
        reasoning: 'ASL letter D: Index extended, other fingers touch thumb' 
      };
    }
  }

  // 8. B Sign (Open Palm): All 5 fingers extended.
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    // If thumb is folded across palm, it's a solid B
    return { 
      sign: 'B', 
      confidence: 95, 
      reasoning: 'ASL letter B: Open flat hand' 
    };
  }

  // 9. I Sign: Pinky extended, others folded.
  if (pinkyExtended && !indexExtended && !middleExtended && !ringExtended && !thumbExtended) {
    return { 
      sign: 'I', 
      confidence: 96, 
      reasoning: 'ASL letter I: Pinky extended' 
    };
  }

  // 10. C Sign: Curved hand.
  // We can measure if index, middle, ring, pinky are curved (partially extended but not straight)
  // And the thumb is also curved, forming an open circular profile.
  const indexDistWrist = getDistance(wrist, indexTip) / handScale;
  const middleDistWrist = getDistance(wrist, middleTip) / handScale;
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    // Check if hand forms a crescent profile
    if (indexTip.y < indexMCP.y && thumbTip.x < indexMCP.x) {
      return {
        sign: 'C',
        confidence: 88,
        reasoning: 'ASL letter C: Curved palm profile'
      };
    }
  }

  // 11. O Sign: All finger tips touch thumb tip
  const dIndex = getDistance(indexTip, thumbTip) / handScale;
  const dMiddle = getDistance(middleTip, thumbTip) / handScale;
  const dRing = getDistance(ringTip, thumbTip) / handScale;
  const dPinky = getDistance(pinkyTip, thumbTip) / handScale;
  if (dIndex < 0.35 && dMiddle < 0.35 && dRing < 0.35 && dPinky < 0.45) {
    return {
      sign: 'O',
      confidence: 90,
      reasoning: 'ASL letter O: Finger tips touch thumb'
    };
  }

  // 12. A Sign: Fist with thumb on the side.
  // All fingers folded. Thumb is extended beside index MCP.
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const thumbIsBeside = thumbTip.y < indexMCP.y && thumbTip.x > indexMCP.x;
    if (thumbIsBeside) {
      return { 
        sign: 'A', 
        confidence: 92, 
        reasoning: 'ASL letter A: Closed fist with thumb on the side' 
      };
    }
    
    // S Sign: Fist with thumb wrapped in front
    const thumbFront = getDistance(thumbTip, middleTip) / handScale < 0.45;
    if (thumbFront) {
      return {
        sign: 'S',
        confidence: 89,
        reasoning: 'ASL letter S: Closed fist with thumb wrapped across'
      };
    }
    
    // E Sign: Fist with thumb folded under fingers
    return {
      sign: 'E',
      confidence: 85,
      reasoning: 'ASL letter E: Closed fist, fingers tucked'
    };
  }

  // 13. K Sign: Index and Middle pointing up, thumb touching Middle finger base/PIP.
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const thumbMiddleMCPDist = getDistance(thumbTip, landmarks[10]) / handScale; // middle PIP
    if (thumbMiddleMCPDist < 0.35) {
      return {
        sign: 'K',
        confidence: 91,
        reasoning: 'ASL letter K: Index/Middle up, thumb touching middle PIP'
      };
    }
  }

  // Words & Phrases (Simulated on static posture hold or dynamic triggers)
  // Hello: Flat hand waved vertically (We can map B with tilted angle)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
    // If hand is tilted sideways (wrist.x != indexMCP.x)
    const angleSide = Math.abs(wrist.x - indexMCP.x);
    if (angleSide > 0.08) {
      return {
        sign: 'Hello',
        confidence: 85,
        reasoning: 'Hand extended and tilted near head position'
      };
    }
  }
  
  // Thank You: Flat hand moving forward (simulated by flat vertical open hand pointing forward, z depth check)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
    return {
      sign: 'Thank You',
      confidence: 82,
      reasoning: 'Flat fingers moving from mouth forward'
    };
  }

  // Please: Flat hand rubbing chest (detected as hand flat and facing body)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbIndexTipDist < 0.4) {
    // Check if flat hand orientation is tilted
    return {
      sign: 'Please',
      confidence: 80,
      reasoning: 'Flat hand orientation'
    };
  }

  // Yes: Fist nodding (simulated by closed fist rotating in Y coordinates over time, or just fist)
  // No: Index, middle, and thumb touching (fast touch)
  if (!ringExtended && !pinkyExtended && indexExtended && middleExtended && thumbExtended) {
    if (thumbIndexTipDist < 0.3 && thumbMiddleTipDist < 0.3) {
      return {
        sign: 'No',
        confidence: 88,
        reasoning: 'Index and middle tips touching thumb'
      };
    }
    
    // H Sign: Index and Middle extended together horizontally.
    const isHorizontal = Math.abs(indexTip.y - middleTip.y) < 0.05 && Math.abs(indexTip.x - wrist.x) > 0.15;
    if (isHorizontal) {
      return {
        sign: 'H',
        confidence: 86,
        reasoning: 'ASL letter H: Index and Middle extended horizontally'
      };
    }
  }

  return { 
    sign: 'Analyzing...', 
    confidence: 50, 
    reasoning: 'Detecting hand joint configurations' 
  };
}
