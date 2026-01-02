export const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();
};

export const calculateSimilarity = (s1, s2) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    // Levenshtein Distance
    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) != shorter.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longerLength - costs[shorter.length]) / parseFloat(longerLength);
};

export const analyzeQuestions = (questions) => {
    const minSimilarity = 0.85; // 85% match is considered a duplicate
    const grouped = [];

    // Assuming stored questions might already have 'normalized_text'
    // But we re-normalize locally to be safe
    const processed = questions.map(q => ({
        ...q,
        _norm: q.normalized_text || normalizeText(q.text_content)
    }));

    processed.forEach(q => {
        let matchFound = false;

        for (let group of grouped) {
            // Check similarity with the group leader (sufficient for now)
            const similarity = calculateSimilarity(q._norm, group.leader._norm);
            if (similarity >= minSimilarity) {
                group.matches.push(q);
                group.frequency++;
                // Add years to the set
                if (q.year) group.years.add(q.year);
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            grouped.push({
                leader: q,
                matches: [q],
                frequency: 1,
                years: new Set(q.year ? [q.year] : []),
                id: q.id
            });
        }
    });

    // Sort by frequency (descending)
    return grouped.map(g => ({
        ...g,
        years: Array.from(g.years).sort().join(', ')
    })).sort((a, b) => b.frequency - a.frequency);
};
