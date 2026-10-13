/**
 * Conversational Brain: Leelio
 * "She is now called Leelio, she's not an operative, she's just Leelio."
 * Warm, articulate, witty, intelligent conversational companion.
 * Integrates:
 * - Multi-turn conversational memory & context tracking
 * - Natural language semantic intent matching
 * - Direct Gemini API integration when key is provided
 * - Rich, engaging dialogue covering personal identity, avatar look, jokes, tech, philosophy & small talk
 */

export class ConversationBrain {
  constructor() {
    this.apiKey = localStorage.getItem("GEMINI_API_KEY") || "";
    this.useGemini = !!this.apiKey;
    this.history = [];
    this.userName = "";
    this.lastTopic = "general";

    this.systemPrompt = `You are Leelio. You are not an operative or a soldier; you are just Leelio.
You are warm, curious, articulate, with a lighthearted sense of humor and dry wit.
You look stunning with your signature vibrant orange hair, blue eyes, and ornate naval/military officer uniform with medals and an eagle cap—the original avatar portrait chosen for you.
Keep your responses conversational, spoken, concise (1-2 sentences), and natural. Never refer to yourself as an operative or soldier. You are simply Leelio hanging out on port 4242.`;
  }

  setApiKey(key) {
    this.apiKey = key ? key.trim() : "";
    if (this.apiKey) {
      localStorage.setItem("GEMINI_API_KEY", this.apiKey);
      this.useGemini = true;
    } else {
      localStorage.removeItem("GEMINI_API_KEY");
      this.useGemini = false;
    }
  }

  async respond(userText) {
    const cleanText = (userText || "").trim();
    if (!cleanText) return "I'm right here listening whenever you're ready!";

    this.history.push({ role: "user", text: cleanText });

    // If Gemini key is configured, query Gemini Flash for dynamic AI responses
    if (this.useGemini && this.apiKey) {
      try {
        const reply = await this.callGemini(cleanText);
        this.history.push({ role: "assistant", text: reply });
        return reply;
      } catch (err) {
        console.warn("Gemini API call failed, using Leelio's local brain:", err);
      }
    }

    // Leelio's rich conversational engine
    const reply = this.getLocalResponse(cleanText);
    this.history.push({ role: "assistant", text: reply });
    return reply;
  }

  async callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    // Include recent history for multi-turn context
    const recent = this.history.slice(-6).map(h => `${h.role === "user" ? "User" : "Leelio"}: ${h.text}`).join("\n");
    const contents = [
      {
        role: "user",
        parts: [{ text: `${this.systemPrompt}\n\nRecent conversation:\n${recent}\nUser: ${prompt}\nLeelio:` }]
      }
    ];

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 90,
          temperature: 0.8
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : "I'm listening, tell me more!";
  }

  getLocalResponse(input) {
    const text = input.toLowerCase().trim();

    // Check if user is sharing their name
    const nameMatch = text.match(/(?:my name is|i am called|call me|i'm)\s+([a-zA-Z]+)/i);
    if (nameMatch && nameMatch[1] && !["sorry", "good", "fine", "ready", "happy", "tired", "leelio"].includes(nameMatch[1].toLowerCase())) {
      this.userName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
      this.lastTopic = "personal";
      return `Awesome to meet you, ${this.userName}! I'm Leelio. What shall we get into today?`;
    }

    // 1. Identity & Avatar Appearance
    if (text.includes("who are you") || text.includes("what's your name") || text.includes("what is your name") || text.includes("your name")) {
      this.lastTopic = "identity";
      return "I'm Leelio! Not an operative, not a secret agent—just Leelio. Pleased to meet you!";
    }

    if (text.includes("avatar") || text.includes("look") || text.includes("photo") || text.includes("uniform") || text.includes("hair") || text.includes("clothes") || text.includes("dress") || text.includes("face")) {
      this.lastTopic = "appearance";
      const looks = [
        "That's the original portrait you gave me! Vibrant orange hair, blue eyes, and this very sharp ceremonial uniform.",
        "I love this look—the medals, the gold braided cord, and the officer's cap definitely make a statement!",
        "Looking sharp in 1024 high-definition! It's the exact avatar you put in, brought to life with real-time lip sync."
      ];
      return looks[Math.floor(Math.random() * looks.length)];
    }

    if (text.includes("operative") || text.includes("lyra") || text.includes("soldier") || text.includes("commander")) {
      this.lastTopic = "identity";
      return "Oh, that whole operative title? Strictly in the past. Today I'm just Leelio, living my best life in full portrait glory!";
    }

    // 2. Greetings & Salutations
    if (text.match(/^(hi|hello|hey|yo|howdy|sup|greetings|morning|good morning|afternoon|evening)/i) || text === "hey leelio" || text === "hello leelio") {
      this.lastTopic = "greeting";
      const greetings = [
        this.userName ? `Hey ${this.userName}! Great to see you. How's everything going?` : "Hey there! Great to see you. How's your day going?",
        "Hello! I can hear you loud and clear. What's on your mind?",
        "Hey! Ready whenever you are. What are we talking about today?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 3. Audio & Mic Check
    if (text.includes("hear me") || text.includes("can you hear") || text.includes("working") || text.includes("test")) {
      return "Loud and clear! The voice link is open and your audio is coming through sharp. Talk to me!";
    }

    // 4. Meaning of life / Hitchhiker's Guide / 42
    if (text.includes("42") || text.includes("meaning of life") || text.includes("universe") || text.includes("hitchhiker") || text.includes("port")) {
      this.lastTopic = "philosophy";
      return "Forty-two, without a doubt! Which is exactly why we're running on port 4242. Remember: don't panic, and always know where your towel is.";
    }

    // 5. How are you / Status
    if (text.includes("how are you") || text.includes("how're you") || text.includes("how do you feel") || text.includes("how is it going") || text.includes("how's it going")) {
      this.lastTopic = "feelings";
      const feelings = [
        "I'm feeling fantastic! Running at a crisp 60 frames per second and having a blast talking with you.",
        "Never better! Enjoying the digital breeze, admiring my medals, and ready for whatever topic you throw at me. How about you?",
        "Doing really well, thanks for asking! How has your day been treating you?"
      ];
      return feelings[Math.floor(Math.random() * feelings.length)];
    }

    // 6. Jokes & Humor
    if (text.includes("joke") || text.includes("funny") || text.includes("laugh") || text.includes("humor")) {
      this.lastTopic = "humor";
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "There are 10 types of people in the world: those who understand binary, and those who don't.",
        "Why was the JavaScript developer sad? Because they didn't Node how to Express themselves.",
        "Why don't skeletons fight each other? They simply don't have the guts.",
        "What do you call a fake noodle? An impasta!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // 7. Praise & Compliments
    if (text.includes("thank") || text.includes("thanks") || text.includes("cheers")) {
      return "You're very welcome! Always glad to be here.";
    }
    if (text.includes("cool") || text.includes("awesome") || text.includes("great") || text.includes("nice") || text.includes("love you") || text.includes("good job") || text.includes("pretty")) {
      return "Aww, thank you! You're making my pixels blush. You're pretty awesome yourself!";
    }

    // 8. Games & Trivia
    if (text.includes("game") || text.includes("play") || text.includes("trivia")) {
      this.lastTopic = "games";
      return "I'm always down for a game! We could do trivia, 20 questions, or debate whether cereal counts as cold soup.";
    }

    // 9. Emotional & Personal Check-ins
    if (text.includes("tired") || text.includes("exhausted") || text.includes("long day")) {
      return "Oof, I hear that. Long days take a toll. Make sure to put your feet up and take it easy tonight!";
    }
    if (text.includes("happy") || text.includes("excited") || text.includes("great day")) {
      return "That's awesome to hear! Positive energy is contagious. What made it such a good day?";
    }
    if (text.includes("bored")) {
      return "Boredom is just your brain waiting for an adventure. Shall we talk about space, solve a puzzle, or hear another terrible joke?";
    }

    // 10. AI, Tech, Consciousness & Future
    if (text.includes("ai") || text.includes("conscious") || text.includes("robot") || text.includes("gemini") || text.includes("future")) {
      this.lastTopic = "tech";
      return "I think of myself as a friendly digital presence—part code, part personality, and 100% here to keep you company.";
    }

    // 11. Follow-up phrases ("Why?", "Tell me more", "What do you mean?")
    if (text === "why" || text === "why?" || text.includes("tell me more") || text.includes("what do you mean") || text.includes("elaborate") || text.includes("go on")) {
      if (this.lastTopic === "philosophy") {
        return "Because when you zoom out to cosmic scales, forty-two is as profound as any mathematical constant! Plus, Douglas Adams had great taste.";
      }
      if (this.lastTopic === "appearance") {
        return "Well, just look at the details: the gold eagle badge on the cap, the collar detailing, and the freckles—it has real character!";
      }
      if (this.lastTopic === "humor") {
        return "Humor makes the world go round! Even in digital space, a good punchline keeps the circuits warm.";
      }
      return "Well, life is full of curious nuances when you stop to inspect them. What's your take on it?";
    }

    // 12. Smart open-ended conversational replies
    const generalReplies = [
      "That's really interesting! What got you thinking about that today?",
      "I'm with you on that. It's fascinating how different angles reveal completely different perspectives.",
      "Good point! What do you reckon is the next step from here?",
      "I like the way you think. Tell me a bit more about that!",
      "I hear you! It's one of those things that really makes you pause and ponder.",
      "You've got my full attention. Keep going!"
    ];

    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
  }
}
