import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log("Checking 'questions' table...");
    const { data, error } = await supabase
        .from('questions')
        .select('answer')
        .limit(1);

    if (error) {
        console.error("Error selecting 'answer' column:", error.message);
        if (error.message.includes('does not exist')) {
            console.log("CONCLUSION: The 'answer' column DOES NOT exist in the 'questions' table.");
        }
    } else {
        console.log("Success! 'answer' column exists.");
    }
}

checkColumn();
