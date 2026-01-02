export const extractQuestionsWithPerplexity = async (file, apiKey, onProgress) => {
    if (!apiKey) throw new Error("API Key is required");

    // Helper to convert file to base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove "data:image/..." prefix
        reader.onerror = error => reject(error);
    });

    // List of models to try in order of preference
    const CANDIDATE_MODELS = [
        "sonar",
        "llama-3.1-sonar-small-128k-online",
        "llama-3.1-sonar-large-128k-online"
    ];

    try {
        if (onProgress) onProgress(0.2); // Encoding
        const base64Image = await toBase64(file);

        if (onProgress) onProgress(0.4); // Preparing Request

        const prompt = `
        You are an expert exam digitizer. 
        Analyze this image of a question paper.
        Extract ALL questions found in the image.
        
        Return ONLY a valid JSON array of objects. Do not use Markdown notation (no \`\`\`json).
        Each object must have:
        - "question_number": string (e.g., "1", "2a", "Q3")
        - "text": string (The full question text, neatly formatted)
        - "marks": number (if visible, otherwise null)
        
        If the image contains multiple questions, list them all.
        If text is cut off or illegible, make your best guess but mark it with [?]
        `;

        let lastError = null;

        // Retry loop
        for (const modelName of CANDIDATE_MODELS) {
            try {
                console.log(`Attempting Perplexity model: ${modelName}`);

                const response = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:${file.type};base64,${base64Image}`
                                        }
                                    }
                                ]
                            }
                        ],
                        temperature: 0.1
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData?.error?.message || `API Error: ${response.status}`);
                }

                const data = await response.json();
                const content = data.choices[0].message.content;

                console.log(`Success with model: ${modelName}`);

                if (onProgress) onProgress(0.9); // Parsing

                // Clean up any potential markdown
                const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJson);

            } catch (err) {
                console.warn(`Model ${modelName} failed:`, err.message);
                lastError = err;
                // Continue to next model
            }
        }

        // If loop completes without success
        throw lastError || new Error("All Perplexity models failed.");

    } catch (error) {
        console.error("Perplexity OCR Error:", error);
        throw new Error("Perplexity Scan Failed: " + error.message);
    }
};

export const generateAnswerWithPerplexity = async (questionText, apiKey) => {
    if (!apiKey) throw new Error("API Key is required");

    const prompt = `
    You are a brilliant academic tutor.
    Please provide a comprehensive, step-by-step solution to the following question.
    
    QUESTION:
    "${questionText}"
    
    FORMATTING RULES:
    - Use Markdown for formatting (bold, italic, lists).
    - If it's a math/science problem, show the working clearly.
    - Be concise but thorough.
    - If the question marks are known, tailor the length accordingly.
    `;

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar", // Fast, cheap, web-aware
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful academic assistant."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Perplexity API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Perplexity Answer Error:", error);
        throw new Error("Failed to generate answer: " + error.message);
    }
};
