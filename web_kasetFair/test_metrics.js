require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Key:", supabaseKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Querying assumption table...");
    const { data, error } = await supabase
        .from('assumption')
        .select('store_id, foot_traffic, interest_rate, conversion_rate, day1, day9')
        .limit(5);

    if (error) {
        console.error("Error fetching assumption:", error);
    } else {
        console.log(`Found ${data.length} rows.`);
        console.log(JSON.stringify(data, null, 2));
    }
}

main();
