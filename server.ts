/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Import real database models, Cloudinary services and Groq generator
import { connectToDatabase, User, Post } from "./server/database";
import { uploadImageToCloudinary } from "./server/cloudinary";
import { generateGroqOrGeminiNickname } from "./server/llm";
import { choose, ADJECTIVES, ANIMALS } from "./server/server-shared";

dotenv.config();

// Auto-trigger database connection asynchronously
connectToDatabase().catch(err => {
  console.warn("MongoDB connection background warning:", err);
});

// Initialize Gemini SDK with User-Agent telemetry
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
          'referrer': 'aistudio-build'
        }
      }
    });
    console.log("Gemini client successfully initialized");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not configured or placeholder detected. Operating in high-fidelity simulation mode.");
}

// ---------------- IN-MEMORY DATABASE AND SERVICES ----------------

const generateAnonymousProfile = () => {
  const adj = choose(ADJECTIVES);
  const anim = choose(ANIMALS);
  const num = Math.floor(100 + Math.random() * 900);
  const username = `${adj}${anim}${num}`;
  const avatarSeed = `seed-${Math.floor(Math.random() * 1000)}`;
  return { username, avatarSeed };
};

const generateAiAnonymousProfile = async (): Promise<{ username: string, avatarSeed: string }> => {
  return generateGroqOrGeminiNickname(ai);
};

// Mock User Database
let users: any[] = [
  {
    id: "user-1",
    username: "SereneOctopus15",
    avatarSeed: "seed-101",
    role: "user",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 5,
    moodHistory: [
      { date: "2026-05-23", mood: "peaceful", note: "Tuned into meditation class" },
      { date: "2026-05-24", mood: "calm", note: "Busy day but kept composure" },
      { date: "2026-05-25", mood: "anxious", note: "Work worries" },
      { date: "2026-05-26", mood: "peaceful", note: "Writing down intentions" },
      { date: "2026-05-27", mood: "calm", note: "Stay in sync" },
    ],
    bookmarks: ["post-2"]
  },
  {
    id: "admin-1",
    username: "QuietModerator",
    avatarSeed: "seed-admin",
    role: "admin",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 12,
    moodHistory: [{ date: "2026-05-27", mood: "peaceful" }],
    bookmarks: []
  }
];

// Seed Stories (Posts) with Rich, Emotionally Calm content
let posts: any[] = [
  {
    id: "post-1",
    title: "Learning to let go of old expectations",
    content: "I spent years trying to fulfill a version of myself that was created by high school pressures and my family's dreams. Today, I turned 24, and I sat down with a piece of paper, wrote all those weights down, and burned them. It feels incredibly real to finally say: 'I don't know who I am fully yet, but I am proud to start finding out.' Safely venting here.",
    category: "Reflection",
    imageUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800", // Warm, tranquil sunrise silhouette
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    username: "GentleMist44",
    avatarSeed: "seed-mist",
    reactions: { support: 15, hugs: 24, metoo: 9, listen: 18, heart: 12 },
    userReactions: {},
    isReported: false,
    reportsCount: 0,
    aiModerated: true,
    aiSafetyStatus: "clean",
    aiReflection: "Your ritual of writing down those expectations and physically letting them go is a powerful act of reclamation. Turning 24 is a beautiful time of self-authored beginnings. It is absolutely fine not to have every chapter written yet. You are exactly where you need to be, discovering yourself day by day. Thank you for sharing this peace with us.",
    comments: [
      {
        id: "comment-1",
        postId: "post-1",
        content: "This resonates so much. I felt the exact same way on my 25th birthday.",
        username: "WanderingFox12",
        avatarSeed: "seed-fox",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "post-2",
    title: "Anxious about future, trying to breathe",
    content: "I have a big interview tomorrow and my heart won't stop racing. The anxiety feels physical - high chest tightness, cold hands. It's hard to remember that I am competent when the fear starts to cloud everything. If you're reading this, could you send virtual breath cues or warm thoughts? Trying to stay in sync.",
    category: "Struggle",
    imageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=800", // Soft misty woods with golden sunlight
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    username: "CozyKoala20",
    avatarSeed: "seed-koala",
    reactions: { support: 32, hugs: 48, metoo: 22, listen: 29, heart: 14 },
    userReactions: { "user-1": "support" },
    isReported: false,
    reportsCount: 0,
    aiModerated: true,
    aiSafetyStatus: "clean",
    aiReflection: "Take a deep breath in through your nose for 4 seconds... hold it for 4... and slowly let it out through your mouth for 6. Your anxiety is a response to how much you care, but it is not a declaration of your value or your capabilities. Focus purely on your next breath, and remember that whatever happens tomorrow, you still return to safety and community.",
    comments: [
      {
        id: "comment-2",
        postId: "post-2",
        content: "Breathing with you, internet friend. Inhale peace, exhale tension. You have got this!",
        username: "SereneOctopus15",
        avatarSeed: "seed-101",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "post-3",
    title: "Gratitude for small morning rituals",
    content: "Just a reminder that there is beauty in the quiet. Watching the steam curl off my chamomile tea this morning while the rest of the neighborhood was sleeping. No phone, no emails, just the cool morning air. We don't have to constant optimize ourselves. Sometimes just being is the ultimate achievement.",
    category: "Gratitude",
    imageUrl: "https://images.unsplash.com/photo-1517089530412-f2048958ea23?auto=format&fit=crop&q=80&w=800", // Warm aesthetic teacup
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    username: "MindfulSprout10",
    avatarSeed: "seed-sprout",
    reactions: { support: 11, hugs: 8, metoo: 16, listen: 12, heart: 25 },
    userReactions: {},
    isReported: false,
    reportsCount: 0,
    aiModerated: true,
    aiSafetyStatus: "clean",
    aiReflection: "There is immense depth in what you shared. Stepping off the treadmill of constant productivity to enjoy the simple curl of tea steam is an act of gentle courage. It reminds us that our primary purpose is to live and feel, not just produce. Thank you for this calming reminder.",
    comments: []
  },
  {
    id: "post-4",
    title: "Confession: I pretend to have it all together",
    content: "To my colleagues, parents, and friends, I am the dependable, perfectly organized leader who never falters. But underneath, I often feel like a construct of matchsticks. I am terrified that one day someone will ask a question I don't know the answer to, and the entire structure will collapse. Sharing this here is the only place I can breathe.",
    category: "Confession",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800", // Soft tranquil evening sea
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    username: "QuietOtter17",
    avatarSeed: "seed-otter",
    reactions: { support: 42, hugs: 39, metoo: 51, listen: 30, heart: 19 },
    userReactions: {},
    isReported: false,
    reportsCount: 0,
    aiModerated: true,
    aiSafetyStatus: "clean",
    aiReflection: "It is exhausting to carry the weight of being the anchor for everyone else. What you are describing is a deeply human experience—imposter anxiety. Please remember that you don't have to carry the answer to everything to retain your place or your dignity. Being honest about not knowing or feeling fragile is actually a profound strength, not a weakness. Rest here, you can lower your shield.",
    comments: []
  }
];

// Helper to trigger Gemini API reflection & safety scan
async function performGeminiScanAndResponse(title: string, content: string, category: string): Promise<{ safetyStatus: 'clean' | 'flagged', reflection: string }> {
  if (!ai) {
    // High-fidelity fallback simulated reflection
    const simReflections: Record<string, string[]> = {
      Struggle: [
        "Your struggle is heard and valid. It takes bravery to voice this burden. Please remind yourself that storms pass, and you do not have to weather this alone.",
        "I am sending you immense care. It's okay to feel overwhelmed. Treat yourself with deep kindness today. Small steps count.",
        "Your honesty is a warm comfort to others going through similar paths. Breathing with you through this tough moment."
      ],
      Confession: [
        "Thank you for sharing this truth. Carrying secrets can be incredibly heavy. Releasing it anonymously is a brave first step toward healing.",
        "No judgment here, only acceptance. We all carry hidden weights. Releasing this into the calm space is highly restorative.",
        "Allow yourself some grace. Letting go of this confession lifts a burden, which opens up space for self-compassion."
      ],
      Reflection: [
        "Your reflection is beautifully grounded. Appreciating these moments of inner growth offers a lovely rhythm to modern life.",
        "How wonderfully thoughtful. Taking time to map your emotions allows your mind to align back with your core essence.",
        "This perspective is a beautiful gift to the feed today. Thank you for inviting us to reflect alongside you."
      ],
      Gratitude: [
        "Gratitude is a lens that turns details into treasures. Celebrating your appreciation for these small wonders of life.",
        "This post brings a joyful peace to the feed. Spotting small positive sparks lifts our collective emotional state.",
        "Thank you for sharing this lovely moment of gratitude. It reminds us that warmth and connection are all around."
      ],
      Dream: [
        "What a magnificent dream. May your path towards these aspirations be rich, creative, and gentle on your spirit.",
        "Our dreams are the silent compasses of our hearts. Never stop nurturing these hopeful thoughts.",
        "Holding space for your aspirations. There is infinite magic in giving your dreams an anonymous voice."
      ],
      Celebration: [
        "Huge warm congratulations! Your success shines so bright, and sharing it elevates our whole community spirit. Hooray!",
        "This is massive! It's so important to stop and celebrate our tiny and grand milestones. Incredibly proud of your journey.",
        "What a beautiful spark of joy! Letting this victory echo anonymously spreads hope and courage to everyone."
      ]
    };

    const categoryList = simReflections[category] || simReflections['Reflection'];
    const reflection = choose(categoryList);
    return { safetyStatus: 'clean', reflection };
  }

  try {
    const prompt = `You are the empathetic, compassionate, and wise virtual guide of "SyncUp", an anonymous storytelling and emotional support platform.
A user has written a post. Your job is to:
1. Conduct an extremely careful safety screening to ensure no severe self-harm plans, abuse, harassment, extreme hate speech, or explicit illegal instructions exist. Return safety_status as "flagged" if it violates these, else "clean".
2. Write a highly empathetic, soothing, calming, non-judgmental, and thoughtful "AI Reflection" (approx 3-5 sentences) in direct human-to-human tone. Speak like a caring mentor or friend. Avoid generic automated sounds. Provide direct breathing tricks, gentle comfort, or supportive reflections. Do not use hashtags or emojis in the response.

Post Category: ${category}
Post Title: ${title}
Post Content: ${content}

Respond exclusively in standard JSON format containing keys: "safety_status" ("clean" or "flagged") and "reflection" (string).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["safety_status", "reflection"],
          properties: {
            safety_status: {
              type: Type.STRING,
              enum: ["clean", "flagged"],
              description: "Safety status assessment."
            },
            reflection: {
              type: Type.STRING,
              description: "Heartwarming, supportive 3-5 sentence reflection."
            }
          }
        }
      }
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return {
      safetyStatus: result.safety_status === "flagged" ? "flagged" : "clean",
      reflection: result.reflection || "Thank you for sharing this story. We are holding a gentle space for you here."
    };
  } catch (error) {
    console.error("Gemini API call failed, falling back to simulation:", error);
    return { safetyStatus: 'clean', reflection: "Thank you for sharing your heart and soul with SyncUp. You are in a safe, community-supported haven where your feelings are validated and cared for." };
  }
}

// ---------------- SERVER APPLICATION CODE ----------------

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // HEALTH CHECK API
  app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "healthy", apiMode: ai ? "gemini-api" : "simulation-api" });
  });

  // ---------------- AUTHENTICATION APIS ----------------

  // Setup current active user (persisted in active memory)
  let currentActiveSession: any = null; // Auto login user-1 for development ease

  // Get current session
  app.get("/api/auth/session", (req, res) => {
    res.json({ success: true, data: currentActiveSession });
  });

  // Clerk Authentication Sync (MongoDB user synchronization with Groq/Gemini name generator fallback)
  app.post("/api/auth/clerk-sync", async (req, res) => {
    const { clerkUserId, email, fullName } = req.body;
    if (!clerkUserId) {
      return res.status(400).json({ success: false, error: "clerkUserId is mandatory." });
    }

    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        let dbUser = await User.findOne({ clerkUserId });
        let isNewUser = false;

        if (!dbUser) {
          isNewUser = true;
          // Generate customized comfortable pseudonym via Groq (preferred) or Gemini
          const profile = await generateGroqOrGeminiNickname(ai);

          // Make sure name is unique
          let username = profile.username;
          let exists = await User.findOne({ username });
          let tries = 0;
          while (exists && tries < 5) {
            username = `${profile.username.replace(/\d+$/, '')}${Math.floor(100 + Math.random() * 900)}`;
            exists = await User.findOne({ username });
            tries++;
          }

          dbUser = await User.create({
            clerkUserId,
            username,
            avatarSeed: profile.avatarSeed,
            role: "user",
            streak: 1,
            moodHistory: [],
            bookmarks: [],
            createdAt: new Date()
          });
          console.log(`🔌 Registered new user [${username}] linked to Clerk ID [${clerkUserId}]`);
        }

        currentActiveSession = {
          id: dbUser.clerkUserId,
          clerkUserId: dbUser.clerkUserId,
          username: dbUser.username,
          avatarSeed: dbUser.avatarSeed,
          role: dbUser.role,
          streak: dbUser.streak,
          moodHistory: dbUser.moodHistory,
          bookmarks: dbUser.bookmarks,
          createdAt: dbUser.createdAt.toISOString()
        };

        return res.json({ success: true, data: currentActiveSession, isNewUser });
      } catch (err) {
        console.error("Clerk sync db error:", err);
        return res.status(500).json({ success: false, error: "Database error synchronizing Clerk user." });
      }
    } else {
      // Fallback local memory operations
      let matched = users.find(u => u.clerkUserId === clerkUserId || (email && u.googleEmail === email));
      if (matched) {
        currentActiveSession = { ...matched };
        return res.json({ success: true, data: currentActiveSession, isNewUser: false });
      }

      const profile = await generateGroqOrGeminiNickname(ai);
      const newUser = {
        id: clerkUserId,
        clerkUserId,
        username: profile.username,
        avatarSeed: profile.avatarSeed,
        role: "user",
        streak: 1,
        moodHistory: [],
        bookmarks: [],
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      currentActiveSession = { ...newUser };
      return res.json({ success: true, data: currentActiveSession, isNewUser: true });
    }
  });

  // Google Sign In / Registration with dynamic AI anonymous nickname generation (simulation mapping)
  app.post("/api/auth/google", async (req, res) => {
    const { email, fullName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Google email is required for authentication." });
    }

    // Check if an existing user is linked to this Google email
    let matched = users.find(u => u.googleEmail && u.googleEmail.toLowerCase() === email.trim().toLowerCase());
    
    if (matched) {
      currentActiveSession = { ...matched };
      return res.json({ success: true, data: currentActiveSession, isNewUser: false });
    }

    // New user signing up with Google! Generate custom comforting pseudonym via AI
    try {
      const profile = await generateAiAnonymousProfile();
      
      // Make sure the AI-generated name is unique in our mock database
      let username = profile.username;
      let counter = 1;
      while (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        username = `${profile.username.replace(/\d+$/, '')}${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 5) break; 
      }

      const newUser = {
        id: `user-${Date.now()}`,
        username,
        avatarSeed: profile.avatarSeed,
        googleEmail: email.trim(),
        fullName: fullName || "Google User",
        role: "user",
        createdAt: new Date().toISOString(),
        streak: 1,
        moodHistory: [],
        bookmarks: []
      };

      users.push(newUser);
      currentActiveSession = { ...newUser };
      res.json({ success: true, data: currentActiveSession, isNewUser: true });
    } catch (err) {
      res.status(550).json({ success: false, error: "Failed to generate your secure anonymous cover. Please try again." });
    }
  });

  // Register
  app.post("/api/auth/register", (req, res) => {
    const { username, avatarSeed } = req.body;
    let finalProfile = { username, avatarSeed };

    // Auto-generate if left blank
    if (!finalProfile.username || finalProfile.username.trim() === "") {
      const generated = generateAnonymousProfile();
      finalProfile.username = generated.username;
      finalProfile.avatarSeed = generated.avatarSeed;
    }

    // Check if username taken
    const exists = users.find(u => u.username.toLowerCase() === finalProfile.username.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: "Username is already taken. Try randomized helper details." });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username: finalProfile.username,
      avatarSeed: finalProfile.avatarSeed || `seed-${Math.floor(Math.random() * 1000)}`,
      role: finalProfile.username.toLowerCase().includes("moderator") || finalProfile.username.toLowerCase().includes("admin") ? "admin" : "user",
      createdAt: new Date().toISOString(),
      streak: 1,
      moodHistory: [],
      bookmarks: []
    };

    users.push(newUser);
    currentActiveSession = { ...newUser };
    res.json({ success: true, data: currentActiveSession });
  });

  // Log in
  app.post("/api/auth/login", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, error: "Please enter your anonymous alias." });
    }

    const matched = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (matched) {
      currentActiveSession = { ...matched };
      res.json({ success: true, data: currentActiveSession });
    } else {
      // Create user automatically under this requested username! No lockouts
      const newUser = {
        id: `user-${Date.now()}`,
        username: username.trim(),
        avatarSeed: `seed-${Math.floor(Math.random() * 1000)}`,
        role: username.toLowerCase().includes("moderator") || username.toLowerCase().includes("admin") ? "admin" : "user",
        createdAt: new Date().toISOString(),
        streak: 1,
        moodHistory: [],
        bookmarks: []
      };
      users.push(newUser);
      currentActiveSession = { ...newUser };
      res.json({ success: true, data: currentActiveSession });
    }
  });

  // Log out
  app.post("/api/auth/logout", (req, res) => {
    currentActiveSession = null;
    res.json({ success: true, data: null });
  });

  // Register mood check-in & increase streak! (Mongoose and Local fallbacks supported)
  app.post("/api/auth/update-mood", async (req, res) => {
    if (!currentActiveSession) {
      return res.status(401).json({ success: false, error: "Auth required to check-in mood." });
    }

    const { mood, note } = req.body;
    if (!mood) {
      return res.status(400).json({ success: false, error: "Mood selection is mandatory." });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        const dbUser = await User.findOne({ clerkUserId: currentActiveSession.id || currentActiveSession.clerkUserId });
        if (!dbUser) {
          return res.status(404).json({ success: false, error: "Clerk user profile not found in MongoDB." });
        }

        const existingMoodIdx = dbUser.moodHistory.findIndex((m: any) => m.date === todayStr);
        if (existingMoodIdx !== -1) {
          dbUser.moodHistory[existingMoodIdx] = { date: todayStr, mood, note };
        } else {
          dbUser.moodHistory.push({ date: todayStr, mood, note });
          dbUser.streak = (dbUser.streak || 0) + 1;
        }

        await dbUser.save();
        currentActiveSession = {
          id: dbUser.clerkUserId,
          clerkUserId: dbUser.clerkUserId,
          username: dbUser.username,
          avatarSeed: dbUser.avatarSeed,
          role: dbUser.role,
          streak: dbUser.streak,
          moodHistory: dbUser.moodHistory,
          bookmarks: dbUser.bookmarks,
          createdAt: dbUser.createdAt.toISOString()
        };
        return res.json({ success: true, data: currentActiveSession });
      } catch (err) {
        console.error("Mongoose mood check-in edit failed:", err);
        return res.status(500).json({ success: false, error: "Could not persist your live mood inside MongoDB." });
      }
    } else {
      // Find the user entry in the DB
      const userIdx = users.findIndex(u => u.id === currentActiveSession.id);
      if (userIdx !== -1) {
        const dbUser = users[userIdx];
        // Avoid duplicated mood entries on same day
        const existingMoodIdx = dbUser.moodHistory.findIndex((m: any) => m.date === todayStr);

        if (existingMoodIdx !== -1) {
          dbUser.moodHistory[existingMoodIdx] = { date: todayStr, mood, note };
        } else {
          dbUser.moodHistory.push({ date: todayStr, mood, note });
          dbUser.streak = (dbUser.streak || 0) + 1; // Bump streak
        }

        users[userIdx] = dbUser;
        currentActiveSession = { ...dbUser };
        res.json({ success: true, data: currentActiveSession });
      } else {
        res.status(404).json({ success: false, error: "Session integrity failure." });
      }
    }
  });

  // Toggle bookmark / save story (Mongoose and Local fallbacks supported)
  app.post("/api/auth/toggle-bookmark", async (req, res) => {
    if (!currentActiveSession) {
      return res.status(401).json({ success: false, error: "Please log in to bookmark stories." });
    }

    const { postId } = req.body;
    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        const dbUser = await User.findOne({ clerkUserId: currentActiveSession.id || currentActiveSession.clerkUserId });
        if (!dbUser) {
          return res.status(404).json({ success: false, error: "Clerk user profile not found in MongoDB." });
        }

        const bkIndex = dbUser.bookmarks.indexOf(postId);
        if (bkIndex !== -1) {
          dbUser.bookmarks.splice(bkIndex, 1);
        } else {
          dbUser.bookmarks.push(postId);
        }

        await dbUser.save();
        currentActiveSession = {
          id: dbUser.clerkUserId,
          clerkUserId: dbUser.clerkUserId,
          username: dbUser.username,
          avatarSeed: dbUser.avatarSeed,
          role: dbUser.role,
          streak: dbUser.streak,
          moodHistory: dbUser.moodHistory,
          bookmarks: dbUser.bookmarks,
          createdAt: dbUser.createdAt.toISOString()
        };
        return res.json({ success: true, data: currentActiveSession });
      } catch (err) {
        console.error("Mongoose bookmark toggle failed:", err);
        return res.status(500).json({ success: false, error: "Could not persist your bookmarked stories in MongoDB." });
      }
    } else {
      const userIdx = users.findIndex(u => u.id === currentActiveSession.id);

      if (userIdx !== -1) {
        const dbUser = users[userIdx];
        const bkIndex = dbUser.bookmarks.indexOf(postId);
        if (bkIndex !== -1) {
          dbUser.bookmarks.splice(bkIndex, 1);
        } else {
          dbUser.bookmarks.push(postId);
        }
        users[userIdx] = dbUser;
        currentActiveSession = { ...dbUser };
        res.json({ success: true, data: currentActiveSession });
      } else {
        res.status(404).json({ success: false, error: "Session mismatch." });
      }
    }
  });


  // ---------------- STORY POSTS APIS ----------------

  // Get stories list (filters: search, category, bookmarks-only, trending-sorting, flagged)
  app.get("/api/posts", async (req, res) => {
    const { category, search, bookmarksOnly, sort, showFlagged } = req.query;
    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        let query: any = {};
        if (showFlagged === "true") {
          query.isReported = true;
        } else {
          query.$or = [{ isReported: false }, { reportsCount: { $lt: 3 } }];
        }
        if (category && category !== "all") {
          query.category = new RegExp(`^${category}$`, "i");
        }
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } }
          ];
        }
        if (bookmarksOnly === "true") {
          if (!currentActiveSession) {
            return res.json({ success: true, data: [] });
          }
          query._id = { $in: currentActiveSession.bookmarks };
        }

        let list = await Post.find(query);

        if (sort === "trending") {
          list = list.sort((a, b) => {
            const sumA = Array.from(a.reactions ? a.reactions.values() : []).reduce((sum: number, cur: any) => sum + (cur as number), 0) as number;
            const sumB = Array.from(b.reactions ? b.reactions.values() : []).reduce((sum: number, cur: any) => sum + (cur as number), 0) as number;
            return sumB - sumA;
          });
        } else if (sort === "comments") {
          list = list.sort((a, b) => b.comments.length - a.comments.length);
        } else {
          list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        const cleanedList = list.map(p => {
          const jsonVal = p.toJSON();
          return {
            ...jsonVal,
            id: jsonVal._id.toString(),
            reactions: jsonVal.reactions || { support: 0, hugs: 0, metoo: 0, listen: 0, heart: 0 }
          };
        });

        return res.json({ success: true, data: cleanedList });
      } catch (err) {
        console.error("Mongoose state error reading posts:", err);
        return res.status(500).json({ success: false, error: "Database error reading story feed." });
      }
    } else {
      let list = [...posts];

      if (showFlagged === "true") {
        list = list.filter(p => p.isReported);
      } else {
        list = list.filter(p => !p.isReported || p.reportsCount < 3);
      }

      if (category && category !== "all") {
        list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
      }

      if (search) {
        const q = (search as string).toLowerCase();
        list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q));
      }

      if (bookmarksOnly === "true") {
        if (!currentActiveSession) {
          return res.json({ success: true, data: [] });
        }
        list = list.filter(p => currentActiveSession.bookmarks.includes(p.id));
      }

      if (sort === "trending") {
        list.sort((a, b) => {
          const scoreA = Object.values(a.reactions).reduce((sum: number, cur: any) => sum + (cur as number), 0) as number;
          const scoreB = Object.values(b.reactions).reduce((sum: number, cur: any) => sum + (cur as number), 0) as number;
          return scoreB - scoreA;
        });
      } else if (sort === "comments") {
        list.sort((a, b) => b.comments.length - a.comments.length);
      } else {
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      res.json({ success: true, data: list });
    }
  });

  // Create Story (integrates Gemini for moderation, Cloudinary for covers & Mongoose)
  app.post("/api/posts", async (req, res) => {
    let { title, content, category, imageUrl } = req.body;

    if (!content || !category) {
      return res.status(400).json({ success: false, error: "Category selection and Content are mandatory." });
    }

    const postTitle = title && title.trim() !== "" ? title.trim() : `Reflecting in the Moment`;
    const userDetails = currentActiveSession || { username: "GuestStarfish", avatarSeed: "seed-guest", id: "guest", role: "user" };

    // Process media with Cloudinary if a base64 was sent!
    if (imageUrl && imageUrl.startsWith("data:image")) {
      try {
        console.log("☁️ Base64 target cover found! Syncing to Cloudinary service...");
        imageUrl = await uploadImageToCloudinary(imageUrl);
      } catch (cldErr) {
        console.error("Cloudinary failed, resorting to base64 fallback configuration:", cldErr);
      }
    }

    // Trigger Gemini background scan & supportive action
    let safetyStatus: "clean" | "flagged" = "clean";
    let aiReflection = "Thank you for sharing your thoughts in this safe space. Remember to practice mindful deep breathing as you navigate these emotions.";

    try {
      const gemResponse = await performGeminiScanAndResponse(postTitle, content, category);
      safetyStatus = gemResponse.safetyStatus as "clean" | "flagged";
      aiReflection = gemResponse.reflection;
    } catch (gErr) {
      console.warn("Problem calling Gemini moderator. Falling back safely:", gErr);
    }

    const isMongo = await connectToDatabase();
    if (isMongo) {
      try {
        const newPostDoc = await Post.create({
          title: postTitle,
          content: content.trim(),
          category,
          imageUrl: imageUrl || null,
          createdAt: new Date(),
          username: userDetails.username,
          clerkUserId: userDetails.clerkUserId || userDetails.id || "guest",
          avatarSeed: userDetails.avatarSeed,
          reactions: { support: 0, hugs: 0, metoo: 0, listen: 0, heart: 0 },
          userReactions: {},
          isReported: safetyStatus === "flagged",
          reportsCount: safetyStatus === "flagged" ? 1 : 0,
          reportReason: safetyStatus === "flagged" ? "AI Auto-Moderation Flagged Trigger content" : undefined,
          aiModerated: true,
          aiSafetyStatus: safetyStatus,
          aiReflection: safetyStatus === "flagged" ? "This post has been temporarily flagged for moderation sweep. Please stay calm and check community support lines if you feel severe struggles." : aiReflection,
          comments: []
        });

        const cleaned = {
          ...newPostDoc.toJSON(),
          id: newPostDoc._id.toString()
        };
        return res.json({ success: true, data: cleaned });
      } catch (dbErr) {
        console.error("Mongoose registration error:", dbErr);
        return res.status(500).json({ success: false, error: "Could not save your story in MongoDB." });
      }
    } else {
      const newPost = {
        id: `post-${Date.now()}`,
        title: postTitle,
        content: content.trim(),
        category: category,
        imageUrl: imageUrl || null,
        createdAt: new Date().toISOString(),
        username: userDetails.username,
        avatarSeed: userDetails.avatarSeed,
        reactions: { support: 0, hugs: 0, metoo: 0, listen: 0, heart: 0 },
        userReactions: {},
        isReported: safetyStatus === "flagged",
        reportsCount: safetyStatus === "flagged" ? 1 : 0,
        reportReason: safetyStatus === "flagged" ? "AI Auto-Moderation Flagged Trigger content" : undefined,
        aiModerated: true,
        aiSafetyStatus: safetyStatus,
        aiReflection: safetyStatus === "flagged" ? "This post has been temporarily flagged for moderation sweep. Please stay calm and check community support lines if you feel severe struggles." : aiReflection,
        comments: []
      };

      posts.unshift(newPost); // Add to head of active posts list
      res.json({ success: true, data: newPost });
    }
  });

  // Empathy reaction to story (with MongoDB synchronization support)
  app.post("/api/posts/:id/react", async (req, res) => {
    const { id } = req.params;
    const { reactionType } = req.body; // 'support' | 'hugs' | 'metoo' | 'listen' | 'heart'

    if (!reactionType) {
      return res.status(400).json({ success: false, error: "No reactionType provided." });
    }

    const userKey = currentActiveSession ? (currentActiveSession.clerkUserId || currentActiveSession.id) : "guest-visitor";
    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        const postObj = await Post.findById(id);
        if (!postObj) {
          return res.status(404).json({ success: false, error: "Post not found." });
        }

        if (!postObj.reactions) {
          postObj.reactions = new Map();
        }
        if (!postObj.userReactions) {
          postObj.userReactions = new Map();
        }

        const existingReaction = postObj.userReactions.get(userKey);

        if (existingReaction === reactionType) {
          const val = postObj.reactions.get(reactionType) || 0;
          postObj.reactions.set(reactionType, Math.max(0, val - 1));
          postObj.userReactions.delete(userKey);
        } else {
          if (existingReaction) {
            const priorVal = postObj.reactions.get(existingReaction) || 0;
            postObj.reactions.set(existingReaction, Math.max(0, priorVal - 1));
          }
          const currentVal = postObj.reactions.get(reactionType) || 0;
          postObj.reactions.set(reactionType, currentVal + 1);
          postObj.userReactions.set(userKey, reactionType);
        }

        await postObj.save();
        const cleaned = {
          ...postObj.toJSON(),
          id: postObj._id.toString(),
          reactions: postObj.reactions || { support: 0, hugs: 0, metoo: 0, listen: 0, heart: 0 }
        };
        return res.json({ success: true, data: cleaned });
      } catch (err) {
        console.error("DB reaction execution failed:", err);
        return res.status(500).json({ success: false, error: "Failed to store reaction inside MongoDB." });
      }
    } else {
      const postIdx = posts.findIndex(p => p.id === id);
      if (postIdx === -1) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }

      const postObj = posts[postIdx];

      if (!postObj.userReactions) {
        postObj.userReactions = {};
      }

      const existingReaction = postObj.userReactions[userKey];

      // Remove existing if identical toggle
      if (existingReaction === reactionType) {
        postObj.reactions[reactionType] = Math.max(0, (postObj.reactions[reactionType] || 0) - 1);
        delete postObj.userReactions[userKey];
      } else {
        // Remove prior reaction if exists
        if (existingReaction) {
          postObj.reactions[existingReaction] = Math.max(0, (postObj.reactions[existingReaction] || 0) - 1);
        }
        // Add new
        postObj.reactions[reactionType] = (postObj.reactions[reactionType] || 0) + 1;
        postObj.userReactions[userKey] = reactionType;
      }

      posts[postIdx] = postObj;
      res.json({ success: true, data: postObj });
    }
  });

  // Post comment down under story (MongoDB & Local fallbacks supported)
  app.post("/api/posts/:id/comment", async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ success: false, error: "Comment text cannot be completely empty." });
    }

    const author = currentActiveSession || { username: "GuestStarfish", avatarSeed: "seed-guest", clerkUserId: "guest" };
    const isMongo = await connectToDatabase();

    if (isMongo) {
      try {
        const postObj = await Post.findById(id);
        if (!postObj) {
          return res.status(404).json({ success: false, error: "Post not found." });
        }

        postObj.comments.push({
          content: content.trim(),
          username: author.username,
          avatarSeed: author.avatarSeed,
          clerkUserId: author.clerkUserId || author.id || "guest",
          createdAt: new Date()
        });

        await postObj.save();
        const cleaned = {
          ...postObj.toJSON(),
          id: postObj._id.toString(),
          reactions: postObj.reactions || { support: 0, hugs: 0, metoo: 0, listen: 0, heart: 0 }
        };
        return res.json({ success: true, data: cleaned });
      } catch (err) {
        console.error("Mongoose commenting failed:", err);
        return res.status(500).json({ success: false, error: "Failed to persist comment on MongoDB." });
      }
    } else {
      const postIdx = posts.findIndex(p => p.id === id);
      if (postIdx === -1) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }

      const newComment = {
        id: `comment-${Date.now()}`,
        postId: id,
        content: content.trim(),
        username: author.username,
        avatarSeed: author.avatarSeed,
        createdAt: new Date().toISOString()
      };

      posts[postIdx].comments.push(newComment);
      res.json({ success: true, data: posts[postIdx] });
    }
  });

  // Flag and report inappropriate stories
  app.post("/api/posts/:id/report", (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const postIdx = posts.findIndex(p => p.id === id);
    if (postIdx === -1) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }

    const postObj = posts[postIdx];
    postObj.isReported = true;
    postObj.reportsCount = (postObj.reportsCount || 0) + 1;
    postObj.reportReason = reason || "Inappropriate Story content";

    posts[postIdx] = postObj;
    res.json({ success: true, data: postObj });
  });


  // ---------------- ADMIN PANEL APIS ----------------

  interface ModerationLog {
    id: string;
    action: string;
    details: string;
    adminUsername: string;
    timestamp: string;
  }

  let moderationLogs: ModerationLog[] = [
    {
      id: "log-seed-1",
      action: "System Initialization",
      details: "Universal safe spaces configured. Incident board online.",
      adminUsername: "SystemAdmin",
      timestamp: new Date().toISOString()
    }
  ];

  function addModerationLog(action: string, details: string, adminUsername?: string) {
    const newLog: ModerationLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      adminUsername: adminUsername || "QuietModerator",
      timestamp: new Date().toISOString()
    };
    moderationLogs.unshift(newLog);
    if (moderationLogs.length > 30) {
      moderationLogs = moderationLogs.slice(0, 30);
    }
  }

  // Get moderation history log trace
  app.get("/api/admin/moderation-logs", (req, res) => {
    if (!currentActiveSession || currentActiveSession.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden. Admin authorization required." });
    }
    res.json({ success: true, data: moderationLogs });
  });

  // Get admin stats & user count
  app.get("/api/admin/stats", async (req, res) => {
    if (!currentActiveSession || currentActiveSession.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden. Admin authorization required." });
    }

    const isMongo = await connectToDatabase();
    let totalUsersCount = 0;
    let fallbackMode = !isMongo;
    let adminCount = 0;

    if (isMongo) {
      try {
        totalUsersCount = await User.countDocuments();
        adminCount = await User.countDocuments({ role: "admin" });
      } catch (err) {
        console.error("Failed to query DB user count:", err);
        totalUsersCount = users.length;
        adminCount = users.filter((u: any) => u.role === "admin").length;
        fallbackMode = true;
      }
    } else {
      totalUsersCount = users.length;
      adminCount = users.filter((u: any) => u.role === "admin").length;
    }

    res.json({
      success: true,
      data: {
        totalUsers: totalUsersCount,
        admins: adminCount,
        databaseType: fallbackMode ? "In-Memory Sandbox Database (Fallback Mode)" : "MongoDB Atlas Cloud Cluster",
        activeConnections: 1,
        totalPosts: posts.length
      }
    });
  });

  // Reset or approve flagged Story
  app.post("/api/admin/posts/:id/moderation", async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'delete'

    if (!currentActiveSession || currentActiveSession.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden. Admin authorization required." });
    }

    const isMongo = await connectToDatabase();
    
    // Attempt database action if Mongo is accessible
    if (isMongo) {
      try {
        if (action === "delete") {
          await Post.findByIdAndDelete(id);
        } else {
          await Post.findByIdAndUpdate(id, {
            isReported: false,
            reportsCount: 0,
            reportReason: undefined,
            aiSafetyStatus: "clean"
          });
        }
      } catch (err) {
        console.error("Database moderation sync failed:", err);
      }
    }

    const postIdx = posts.findIndex(p => p.id === id);
    if (action === "delete") {
      if (postIdx !== -1) {
        posts.splice(postIdx, 1);
      }
      addModerationLog("Post Expunged", `Post [${id}] permanently removed from database and collective feed.`, currentActiveSession?.username);
      res.json({ success: true, data: null, message: "Story successfully expunged." });
    } else {
      if (postIdx === -1 && isMongo) {
        addModerationLog("Post Approved", `Dismissed reports against Post [${id}] (Database Sync).`, currentActiveSession?.username);
        return res.json({ success: true, message: "Story returned to main feed." });
      }
      if (postIdx === -1) {
        return res.status(404).json({ success: false, error: "Post not found in moderation list." });
      }
      // Restore clean status
      posts[postIdx].isReported = false;
      posts[postIdx].reportsCount = 0;
      posts[postIdx].reportReason = undefined;
      posts[postIdx].aiSafetyStatus = "clean";
      addModerationLog("Post Approved", `Dismissed reports against Post [${id}] and restored client viewability.`, currentActiveSession?.username);
      res.json({ success: true, data: posts[postIdx], message: "Story returned to main feed." });
    }
  });

  // Delete all currently reported/flagged posts
  app.post("/api/admin/posts/clear-all-reported", async (req, res) => {
    if (!currentActiveSession || currentActiveSession.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden. Admin authorization required." });
    }

    const { action } = req.body;
    if (action !== "delete-all") {
      return res.status(400).json({ success: false, error: "Invalid clear-all action." });
    }

    try {
      const isMongo = await connectToDatabase();
      if (isMongo) {
        // Delete all reported/flagged posts from Mongoose database
        await Post.deleteMany({ isReported: true });
      }

      // Also clean up from local memory
      const initialCount = posts.length;
      posts = posts.filter(p => !p.isReported);
      const clearedCount = initialCount - posts.length;

      addModerationLog("Board Cleared", `Bulk expunged all reported incidents. Cleared unit count: ${clearedCount}.`, currentActiveSession?.username);

      res.json({
        success: true,
        message: `Successfully cleared all reported/flagged posts.`,
        clearedCount
      });
    } catch (err) {
      console.error("Failed to clear reported posts from database:", err);
      // Fallback: clear from memory
      posts = posts.filter(p => !p.isReported);
      addModerationLog("Board Cleared", `Bulk expunged all reported incidents (Local Fallback Backup).`, currentActiveSession?.username);
      res.json({
        success: true,
        message: `Cleared reported posts from memory backup (Database error occurred).`,
        error: (err as Error).message
      });
    }
  });

  // Run AI sweeping moderation using Gemini over post index
  app.post("/api/admin/sweep", async (req, res) => {
    if (!currentActiveSession || currentActiveSession.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden. Admin authorization required." });
    }

    if (!ai) {
      addModerationLog("Gemini AI Sweep", "Triggered standard safety sweep (Client simulated clean).", currentActiveSession?.username);
      return res.json({
        success: true,
        data: { sweptCount: 0, flaggedCount: 0 },
        message: "Gemini client offline. Standard sweep simulated clean."
      });
    }

    try {
      let sweptCount = 0;
      let flaggedCount = 0;

      // Sweep unmoderated posts or newly modified ones
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (!post.aiModerated || post.aiSafetyStatus === 'pending') {
          sweptCount++;
          const gemRes = await performGeminiScanAndResponse(post.title, post.content, post.category);
          post.aiModerated = true;
          post.aiSafetyStatus = gemRes.safetyStatus;
          if (gemRes.safetyStatus === 'flagged') {
            post.isReported = true;
            post.reportsCount = (post.reportsCount || 0) + 1;
            post.reportReason = "AI Sweep Automated Flagging";
            flaggedCount++;
          } else {
            post.aiReflection = gemRes.reflection;
          }
          posts[i] = post;
        }
      }

      addModerationLog("Gemini AI Sweep", `AI safety scan completed. Checked ${sweptCount} posts, auto-flagged ${flaggedCount} unsafe items.`, currentActiveSession?.username);

      res.json({
        success: true,
        data: { sweptCount, flaggedCount },
        message: `Sweep completed on index database. Checked ${sweptCount} items. Flagged ${flaggedCount} unsafe items.`
      });
    } catch (e) {
      addModerationLog("Gemini AI Sweep Failed", "Crashed during active automated database scanning.", currentActiveSession?.username);
      res.status(500).json({ success: false, error: "AI Moderation sweep crashed." });
    }
  });


  // ---------------- VITE MIDDLEWARE SERVICE SETUP ----------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SyncUp Full Stack Server running securely on http://localhost:${PORT}`);
  });
}

startServer();
