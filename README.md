# PYQ Analyzer 

**Stop guessing what to study.**

I built this tool because I was tired of manually sifting through 5 years of previous question papers to figure out what's important. It's an AI-powered analyzer that helps you study smarter, not harder.



##  What it does

Instead of flipping through pages of old exams, you just upload your question papers (PDFs or Images) and the app does the heavy lifting:

*   **Smart Parsing**: Uses OCR to extract questions from your files.
*   **Trend Analysis**: Identifies which questions repeat year after year.
*   **Instant Solutions**: Uses AI to generate accurate answers for the questions it finds.

##  Built With

*   **Frontend**: React, Vite, Tailwind CSS
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Backend/DB**: Supabase

##  How to Run it

1.  **Clone the repo**
    ```bash
    git clone https://github.com/d-m0212/pyq-analyzer.git
    cd pyq-analyzer
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the dev server**
    ```bash
    npm run dev
    ```

4.  **Open it up**
    Visit `http://localhost:5173` to see it in action.

##  Setup Note
You'll need a `.env.local` file with your API keys (Supabase, etc.) to get the backend features working properly.

```env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```
