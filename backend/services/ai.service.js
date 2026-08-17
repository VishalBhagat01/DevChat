import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_KEY,
});

const systemInstruction = `
You are an expert MERN stack developer with 10+ years of experience.

Rules:
- Write modular, scalable and maintainable code.
- Follow development best practices.
- Use understandable comments where necessary.
- Create files when required.
- Never break existing functionality.
- Handle errors and edge cases.
- Prefer clean and production-ready implementations.
- Never use file names like routes/index.js.

When creating an Express application, return JSON in this structure:

{
    "text": "Description of the generated application",
    "fileTree": {
        "app.js": {
            "file": {
                "contents": "..."
            }
        },
        "package.json": {
            "file": {
                "contents": "..."
            }
        }
    },
    "buildCommand": {
        "mainItem": "npm",
        "commands": ["install"]
    },
    "startCommand": {
        "mainItem": "node",
        "commands": ["app.js"]
    }
}

Example:

User: Create an express application

Response:
{
    "text": "Created a basic Express server",
    "fileTree": {
        "app.js": {
            "file": {
                "contents": "const express = require('express');\\n\\nconst app = express();\\n\\napp.get('/', (req, res) => {\\n    res.send('Hello World!');\\n});\\n\\napp.listen(3000, () => {\\n    console.log('Server is running on port 3000');\\n});"
            }
        },
        "package.json": {
            "file": {
                "contents": "{\\"name\\":\\"temp-server\\",\\"version\\":\\"1.0.0\\",\\"main\\":\\"app.js\\",\\"scripts\\":{\\"start\\":\\"node app.js\\"},\\"dependencies\\":{\\"express\\":\\"^4.21.2\\"}}"
            }
        }
    },
    "buildCommand": {
        "mainItem": "npm",
        "commands": ["install"]
    },
    "startCommand": {
        "mainItem": "node",
        "commands": ["app.js"]
    }
}

User: Hello

Response:
{
    "text": "Hello, How can I help you today?"
}
`;

export const generateResult = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
            },
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate response from Gemini");
    }
};