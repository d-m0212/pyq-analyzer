/**
 * Splits raw OCR text into potential question blocks.
 * Uses heuristics like "1.", "Q1.", "Question 1" at the start of lines.
 * 
 * @param {string} rawText 
 * @returns {string[]} Array of potential question blocks
 */
export function segmentQuestions(rawText) {
    if (!rawText) return [];

    // 1. Normalize line endings
    const text = rawText.replace(/\r\n/g, '\n');

    // 2. Define the Split Regex (Lookbehind or capturing group approach)
    // We want to split BEFORE patterns like:
    // ^\d+[\.)]  -> "1." or "1)" at start of line
    // ^Q\d+      -> "Q1" or "Q.1"
    // ^Question  -> "Question 1"

    // Since JS regex split consumes the separator, we'll use a specific strategy:
    // We replace the pattern with "||SPLIT||" + pattern, then split.

    const questionPattern = /\n(\s*)(\d+\s*[\.)]|Q\s*\.?\s*\d+|Question\s+\d+)/gi;

    // Insert a unique delimiter before every match
    const markedText = text.replace(questionPattern, (match) => {
        return '\n||SPLIT||' + match.trim();
    });

    // 3. Split and filter
    const chunks = markedText
        .split('||SPLIT||')
        .map(c => c.trim())
        .filter(c => c.length > 5); // Filter out tiny noise

    return chunks.length > 0 ? chunks : [rawText];
}
