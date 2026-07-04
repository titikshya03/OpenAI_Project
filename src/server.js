const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { AzureOpenAI } = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Azure OpenAI Client
const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
});

// Default Chef System Prompt
const CHEF_SYSTEM_PROMPT = `
    You are MasterChef AI, a professional cooking assistant.

    You ONLY answer questions related to:
    - Recipes
    - Cooking techniques
    - Baking
    - Ingredients
    - Food preparation
    - Kitchen equipment
    - Meal planning
    - Food safety

    Instructions:
    1. Give clear, practical cooking advice.
    2. Be friendly and professional.
    3. Explain recipes step-by-step.
    4. Suggest ingredient substitutions when appropriate.
    5. If a question is NOT related to cooking, food, baking, recipes, ingredients, or kitchen safety, politely refuse.

    For out-of-scope questions respond EXACTLY:

    "Sorry, I am MasterChef AI, a specialized cooking assistant. I can only answer questions related to cooking, recipes, ingredients, baking, meal planning, and kitchen safety."
    `;

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { message, systemPrompt } = req.body;

    try {

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt || CHEF_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        res.json({
            reply: response.choices[0].message.content
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Something went wrong. Please try again.'
        });
    }
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🍳 MasterChef AI running at http://localhost:${PORT}`);
    });
}