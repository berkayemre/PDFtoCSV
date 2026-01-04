const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Geliştirilmiş Prompt: Bozulmaları önlemek için daha net yapı
const SAT_PROMPT = `
Extract all SAT questions from the provided PDF into a structured JSON array.
Each question object MUST follow this schema:
{
  "exam_name": "Digital SAT March 2025",
  "question_html": "HTML formatted question text (use <p>, <b>, <sup>)",
  "model_choice": "A, B, C, or D",
  "subject": "Reading/Writing or Math",
  "label": "Sub-topic name",
  "order": "easy, medium, or hard",
  "choice_A_html": "HTML for choice A",
  "choice_B_html": "HTML for choice B",
  "choice_C_html": "HTML for choice C",
  "choice_D_html": "HTML for choice D"
}

IMPORTANT: 
1. If the PDF contains too many questions to process in one response, focus on providing as many complete questions as possible until you reach your output limit. 
2. Ensure the JSON is valid and properly closed.
3. For Math questions with graphs/images, describe the visual in [brackets] inside question_html.
4. Return ONLY the JSON array.
`;

app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Lütfen bir PDF dosyası yükleyin.');
        }

        console.log("Dosya alındı, Gemini 2.0 işliyor...");

        // Gemini 2.0 Flash ve JSON Modu yapılandırması
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1, // Daha tutarlı JSON çıktısı için düşük sıcaklık
            }
        });

        const pdfPart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: "application/pdf"
            }
        };

        const result = await model.generateContent([SAT_PROMPT, pdfPart]);
        const response = await result.response;
        let text = response.text();

        // JSON Modu olsa bile bazen başta/sonda boşluk kalabilir, temizleyelim
        text = text.trim();

        try {
            const jsonData = JSON.parse(text);
            console.log(`${jsonData.length} adet soru başarıyla işlendi.`);
            res.json(jsonData);
        } catch (parseError) {
            console.error("JSON Parse Hatası. Gelen ham metin özeti:", text.substring(0, 100) + "...");
            // Eğer JSON hala bozuk geliyorsa, manuel bir temizleme denemesi
            const fallbackText = text.substring(0, text.lastIndexOf('}') + 1) + ']';
            try {
                res.json(JSON.parse(fallbackText));
            } catch (e) {
                throw new Error("AI çıktısı geçerli bir JSON değil ve otomatik düzeltilemedi.");
            }
        }

    } catch (error) {
        console.error("Hata Detayı:", error);
        res.status(500).json({ 
            error: "PDF işlenirken bir hata oluştu.", 
            message: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Backend sunucusu http://localhost:${port} adresinde çalışıyor.`);
});