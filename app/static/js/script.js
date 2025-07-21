    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.querySelector('.content').classList.toggle('sidebar-collapsed');
    }

    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatDisplay = document.getElementById('chat-display');

    const notesTextarea = document.getElementById('notes-textarea');
    const saveNotesBtn = document.getElementById('save-notes-btn');

    let savedNotesContent = ""; // This variable will hold the saved notes

    // Load saved notes if any (e.g., from localStorage, though not implemented here)
    // notesTextarea.value = savedNotesContent;

    saveNotesBtn.addEventListener('click', function() {
        savedNotesContent = notesTextarea.value;
        console.log('Notes saved:', savedNotesContent);
        alert('Notes saved!'); // Simple feedback
    });

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;

        // Display user's message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.textContent = `You: ${message}`;
        userMessageDiv.style.textAlign = 'right';
        userMessageDiv.style.margin = '5px 0';
        chatDisplay.appendChild(userMessageDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight; // Scroll to bottom

        chatInput.value = ''; // Clear input

        // Display "AI is typing..."
        const aiTypingDiv = document.createElement('div');
        aiTypingDiv.textContent = 'AI is typing...';
        aiTypingDiv.style.fontStyle = 'italic';
        aiTypingDiv.style.color = '#888';
        aiTypingDiv.style.margin = '5px 0';
        chatDisplay.appendChild(aiTypingDiv);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let aiResponseText = '';

            // Remove "AI is typing..." before displaying actual response
            chatDisplay.removeChild(aiTypingDiv);

            const aiResponseDiv = document.createElement('div');
            aiResponseDiv.textContent = 'AI: ';
            aiResponseDiv.style.margin = '5px 0';
            chatDisplay.appendChild(aiResponseDiv);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiResponseText += chunk;
                aiResponseDiv.textContent = `AI: ${aiResponseText}`;
                chatDisplay.scrollTop = chatDisplay.scrollHeight; // Scroll to bottom
            }

            notesTextarea.value = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

        } catch (error) {
            console.error('Error:', error);
            // Remove "AI is typing..." if an error occurred before response
            if (chatDisplay.contains(aiTypingDiv)) {
                chatDisplay.removeChild(aiTypingDiv);
            }
            const errorDiv = document.createElement('div');
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.style.color = 'red';
            chatDisplay.appendChild(errorDiv);
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }
    }