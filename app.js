const express = require('express');
const fs = require('fs');
const Fuse = require('fuse.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// Fungsi untuk mendapatkan respons dari Gemini AI dengan format yang rapi
async function generateResponseFromGemini(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        if (!response || !response.candidates || response.candidates.length === 0) {
            return "Saya tidak bisa menjawab itu saat ini.";
        }

        let text = response.candidates[0].content.parts[0].text;
        return formatResponse(text) || "Saya tidak bisa menjawab itu saat ini.";
    } catch (error) {
        console.error("Error dari Gemini AI:", error);
        return "Saya tidak bisa menjawab itu saat ini.";
    }
}

// Fungsi untuk membersihkan input pengguna
function cleanInput(text) {
    return text
        .toLowerCase()
        .replace(/\b(apakah|siapa|dimana|apa itu|tahu)\b/g, '') // Hilangkan kata tanya
        .trim();
}

// Fungsi untuk mencari respons terbaik berdasarkan kata kunci
function findBestMatch(input, percakapan) {
    const cleanedInput = cleanInput(input);

    // Cari jawaban yang benar-benar cocok
    const exactResponse = percakapan.find(p => cleanInput(p.input) === cleanedInput);
    if (exactResponse) return exactResponse.respon;

    // Gunakan Fuse.js untuk mencari yang paling mirip
    const fuse = new Fuse(percakapan, { keys: ['input'], threshold: 0.2 });
    const similarResult = fuse.search(cleanedInput);

    if (similarResult.length > 0) {
        return similarResult[0].item.respon;
    }

    return null;
}

// Fungsi untuk memformat respons agar lebih rapi
function formatResponse(text) {
    return text.replace(/\n/g, "\n\n"); // Tambahkan newline tambahan agar lebih readable
}

app.post('/chat', async (req, res) => {
    const { input } = req.body;
    console.log(`User input: ${input}`);

    fs.readFile('./otak.json', 'utf8', async (err, data) => {
        if (err) {
            console.error("Gagal membaca file:", err);
            return res.status(500).json({ message: "Terjadi kesalahan saat membaca data." });
        }

        let dataTraining;
        try {
            dataTraining = JSON.parse(data);
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(500).json({ message: "Format data tidak valid." });
        }

        const percakapan = dataTraining.percakapan;
        const bestResponse = findBestMatch(input, percakapan);

        if (bestResponse) {
            return res.json({ response: formatResponse(bestResponse) });
        }

        const geminiResponse = await generateResponseFromGemini(input);
        return res.json({ response: geminiResponse });
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
