import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase URL/Key configured locally.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Checking employees and recent bookings in Supabase...");

  const { data: employees } = await supabase.from("employees").select("*");
  console.log("Employees in DB:", employees);

  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, name, work_email, company_name, sourced_by_employee_id, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (bErr) {
    console.error("Failed to query bookings:", bErr);
    return;
  }

  console.log("Recent Bookings in DB:", bookings);

  if (employees && employees.length > 0 && bookings && bookings.length > 0) {
    const defaultRep = employees[0];
    const unassigned = bookings.filter((b) => !b.sourced_by_employee_id);
    console.log(`Found ${unassigned.length} unassigned bookings.`);
    for (const b of unassigned) {
      console.log(`Assigning booking ${b.id} (${b.name} - ${b.company_name}) to rep ${defaultRep.full_name}...`);
      const { error: upErr } = await supabase
        .from("bookings")
        .update({ sourced_by_employee_id: defaultRep.id })
        .eq("id", b.id);
      if (upErr) {
        console.error("Update error:", upErr);
      } else {
        console.log(`Assigned booking ${b.id} to ${defaultRep.full_name}!`);
      }
    }
  }
}

main().catch(console.error);
