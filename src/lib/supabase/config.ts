// NEXT_PUBLIC_ values are safe to expose client-side by design (the anon/publishable
// key is gated by Row Level Security, not a secret). The fallback lets the app build
// and run even when the env vars aren't set on the deployment platform.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rcsbbrgnoxehtehdoiyt.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc2Jicmdub3hlaHRlaGRvaXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MDk0MDUsImV4cCI6MjEwNTI4NTQwNX0.WyWfJXM1s2nPPlxgRPNtm9bqOwJ2qFr0d3NnnWq229A";
