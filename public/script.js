document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.getElementById("chat-box");
    const userInputField = document.getElementById("user-input");
    const sendButton = document.getElementById("submitBtn");

    // Event listener untuk mengirim pesan
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

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input: userInput })
            });

            const data = await response.json();

            if (data.similar) {
                displayBotMessage(`Apakah maksud Anda: "${data.similar}"?\n${data.response}`);
            } else {
                displayBotMessage(data.response);
            }
        } catch (error) {
            console.error("Error fetching response:", error);
            displayBotMessage("Terjadi kesalahan, coba lagi nanti.");
        }
    }

    function displayUserMessage(message) {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("flex", "justify-end", "my-1");

        const messageElement = document.createElement("div");
        messageElement.classList.add("user-message", "bg-blue-500", "text-white", "px-4", "py-2", "rounded-lg", "max-w-xs");
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);
        chatBox.appendChild(messageContainer);
        scrollToBottom();
    }

    function displayBotMessage(message) {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("flex", "justify-start", "my-1");
    
        // Mengubah **teks** menjadi <strong>teks</strong>
        message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold teks
        message = message.replace(/\n\n/g, "\n"); // Hilangkan extra space akibat double enter
        message = message.replace(/\n/g, "<br>"); // Buat newline tetap terlihat


    
        const messageElement = document.createElement("div");
        messageElement.classList.add("bot-message", "bg-gray-300", "text-gray-800", "px-4", "py-2", "rounded-lg", "max-w-xs");
        messageElement.innerHTML = message; // Gunakan innerHTML agar tag HTML diproses
    
        messageContainer.appendChild(messageElement);
        chatBox.appendChild(messageContainer);
        scrollToBottom();
    }
    
    

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
