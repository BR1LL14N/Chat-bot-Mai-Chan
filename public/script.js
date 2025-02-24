document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.getElementById("chat-box");
    const userInputField = document.getElementById("user-input");
    const sendButton = document.getElementById("submitBtn");

    // Muat riwayat chat saat halaman pertama kali dimuat
    loadChatHistory();

    sendButton.addEventListener("click", sendMessage);
    userInputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    async function sendMessage() {
        const userInput = userInputField.value.trim();
        if (userInput === "") return;
    
        displayUserMessage(userInput);
        userInputField.value = "";
    
        // Tambahkan indikator loading
        displayBotMessage("Bot sedang mengetik...");
    
        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: userInput }),
            });
    
            if (!response.ok) {
                throw new Error("Server mengembalikan respons tidak valid");
            }
    
            const data = await response.json();
    
            if (!data.response || typeof data.response !== "string") {
                throw new Error("Respons bot tidak valid atau kosong");
            }
    
            removeLastBotMessage(); // Hapus pesan "Bot sedang mengetik..."
            
            // Proses teks sebelum ditampilkan
            const formattedResponse = formatBotResponse(data.response);
            displayBotMessage(formattedResponse);
        } catch (error) {
            console.error("Error fetching response:", error);
            removeLastBotMessage();
            displayBotMessage("Terjadi kesalahan, coba lagi nanti.");
        }
    }

    function formatBotResponse(text) {
        return text.replace(/^Bot:\s*/, '')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // Format bold
            .replace(/- /g, '\n- ')  // Format list dengan newline sebelum bullet
            .replace(/(?<!\n)\n(?!\n)/g, '\n\n') || "Saya tidak bisa menjawab itu saat ini.";
    }

    async function loadChatHistory() {
        try {
            const response = await fetch("/history");
            if (!response.ok) throw new Error("Gagal mengambil riwayat chat");
    
            const data = await response.json();
    
            if (!data.history || !Array.isArray(data.history) || data.history.length === 0) {
                console.warn("Riwayat chat kosong atau tidak valid.");
                return;
            }
    
            data.history.forEach((message) => {
                if (!message || typeof message.text !== "string") {
                    console.warn("Pesan dalam riwayat tidak valid:", message);
                    return;
                }
    
                if (message.sender === "user") {
                    displayUserMessage(message.text);
                } else {
                    displayBotMessage(formatBotResponse(message.text));
                }
            });
        } catch (error) {
            console.error("Gagal mengambil riwayat chat:", error);
        }
    }

    function displayUserMessage(message) {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("flex", "justify-end", "my-1");

        const messageElement = document.createElement("div");
        messageElement.classList.add(
            "user-message",
            "bg-blue-500",
            "text-white",
            "px-4",
            "py-2",
            "rounded-lg",
            "max-w-xs"
        );
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);
        chatBox.appendChild(messageContainer);
        scrollToBottom();
    }

    function displayBotMessage(message) {
        if (!message) {
            console.error("Pesan bot kosong atau tidak terdefinisi.");
            return;
        }
    
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("flex", "justify-start", "my-1");
    
        const messageElement = document.createElement("div");
        messageElement.classList.add(
            "bot-message",
            "bg-gray-300",
            "text-gray-800",
            "px-4",
            "py-2",
            "rounded-lg",
            "max-w-xs"
        );

        const formattedMessage = message.replaceAll("\n", "<br>");
        messageElement.innerHTML = formattedMessage; // Menggunakan innerHTML agar format HTML dirender
    
        messageContainer.appendChild(messageElement);
        chatBox.appendChild(messageContainer);
        scrollToBottom();
    }

    function removeLastBotMessage() {
        const botMessages = chatBox.getElementsByClassName("bot-message");
    
        if (botMessages.length > 0) {
            const lastBotMessage = botMessages[botMessages.length - 1];
            if (lastBotMessage && lastBotMessage.textContent.includes("Bot sedang mengetik...")) {
                lastBotMessage.remove();
            }
        }
    }

    function scrollToBottom() {
        chatBox.lastElementChild?.scrollIntoView({ behavior: "smooth" });
    }
});
