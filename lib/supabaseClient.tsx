import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uolgtuyyhjwdnbobumoz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbGd0dXl5aGp3ZG5ib2J1bW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTQ0MDAsImV4cCI6MjA3Mzk5MDQwMH0.sCm9jgKjHmh54R_bou-kB_5RdT9tJinRSpvfHe5gSWw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
