function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.querySelector(".content").classList.toggle("sidebar-collapsed");
}

const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const chatDisplay = document.getElementById("chat-display");

const notesTextarea = document.getElementById("notes-textarea");
const saveNotesBtn = document.getElementById("save-notes-btn");

let savedNotesContent = ""; // This variable will hold the saved notes

// Load saved notes if any (e.g., from localStorage, though not implemented here)
// notesTextarea.value = savedNotesContent;

saveNotesBtn.addEventListener("click", function () {
  savedNotesContent = notesTextarea.value;
  console.log("Notes saved:", savedNotesContent);
  alert("Notes saved!"); // Simple feedback
});

sendButton.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

async function sendMessage() {
  const message = chatInput.value.trim();
  if (message === "") return;

  // Display user's message
  const userMessageContainer = document.createElement("div");
  userMessageContainer.classList.add("message-container");
  const userMessageBubble = document.createElement("div");
  userMessageBubble.classList.add("message-bubble", "sent-message");
  userMessageBubble.textContent = message;
  userMessageContainer.appendChild(userMessageBubble);
  chatDisplay.appendChild(userMessageContainer);
  chatDisplay.scrollTop = chatDisplay.scrollHeight; // Scroll to bottom

  chatInput.value = ""; // Clear input

  // Display "AI is typing..."
  const aiTypingContainer = document.createElement("div");
  aiTypingContainer.classList.add("message-container");
  const aiTypingDiv = document.createElement("div");
  aiTypingDiv.classList.add("message-bubble", "received-message");
  aiTypingDiv.textContent = "AI is typing...";
  aiTypingContainer.appendChild(aiTypingDiv);
  chatDisplay.appendChild(aiTypingContainer);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let aiResponseText = "";

    // Remove "AI is typing..." before displaying actual response
    chatDisplay.removeChild(aiTypingContainer);

    const aiResponseContainer = document.createElement("div");
    aiResponseContainer.classList.add("message-container");
    const aiResponseDiv = document.createElement("div");
    aiResponseDiv.classList.add("message-bubble", "received-message");
    aiResponseDiv.textContent = "AI: ";
    aiResponseContainer.appendChild(aiResponseDiv);
    chatDisplay.appendChild(aiResponseContainer);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      aiResponseText += chunk;
      aiResponseDiv.textContent = `AI: ${aiResponseText}`;
      chatDisplay.scrollTop = chatDisplay.scrollHeight; // Scroll to bottom
    }

    notesTextarea.value =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  } catch (error) {
    console.error("Error:", error);
    // Remove "AI is typing..." if an error occurred before response
    if (chatDisplay.contains(aiTypingContainer)) {
      chatDisplay.removeChild(aiTypingContainer);
    }
    const errorContainer = document.createElement("div");
    errorContainer.classList.add("message-container");
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("message-bubble", "received-message");
    errorDiv.style.color = "red";
    errorDiv.textContent = `Error: ${error.message}`;
    errorContainer.appendChild(errorDiv);
    chatDisplay.appendChild(errorContainer);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }
}

// Function to load history
async function loadHistory() {
  try {
    const response = await fetch(`/api/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = ""; // Clear existing list

    data.history.forEach((item) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = item.title;
      link.dataset.content = item.content; // Store content in a data attribute
      link.addEventListener("click", (e) => {
        e.preventDefault();
        notesTextarea.value = e.target.dataset.content;
      });
      listItem.appendChild(link);
      historyList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

// Load history when the page loads
loadHistory();

document.addEventListener("DOMContentLoaded", () => {
  const sessionTimerElement = document.getElementById('session-timer');
  const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");
  let sessionTimerInterval;

  async function getSessionInfo() {
    try {
      const response = await fetch("/api/session_info");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching session info:", error);
      return null;
    }
  }

  function startSessionTimer(duration) {
    clearInterval(sessionTimerInterval);
    let timer = Math.floor(duration);

    const updateTimer = () => {
      if (timer <= 0) {
        clearInterval(sessionTimerInterval);
        sessionTimerElement.textContent = "Session expired. Reloading...";
        window.location.href = "/";
        return;
      }
      const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
      const seconds = String(timer % 60).padStart(2, "0");
      sessionTimerElement.textContent = `Session expires in: ${minutes}:${seconds}`;
      timer--;
    };

    updateTimer();
    sessionTimerInterval = setInterval(updateTimer, 1000);
  }

  // Throttled session reset
  let canReset = true;
  const throttleDuration = 1500; // Reset at most every 5 seconds

  async function resetSession() {
    if (!canReset) return;
    canReset = false;
    setTimeout(() => {
      canReset = true;
    }, throttleDuration);

    try {
      const response = await fetch("/api/reset_session_timeout", {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.remaining_seconds) {
        startSessionTimer(data.remaining_seconds);
      }
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  }

  // Add event listeners for user activity
  // Add event listeners for user activity
        ['click', 'keypress', 'mousemove'].forEach(eventType => {
            window.addEventListener(eventType, resetSession, { passive: true });
        });

  // Initial session load
  getSessionInfo().then((sessionInfo) => {
    if (sessionInfo && sessionInfo.remaining_seconds) {
      startSessionTimer(sessionInfo.remaining_seconds);
    }
  });
});
