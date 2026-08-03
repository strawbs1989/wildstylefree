const SUPABASE_URL = "https://pzdjemvogdpbpinixltc.supabase.co";

const SUPABASE_KEY = "sb_publishable__DnIH0oiCtOl9tyBCVb9hg_9vwcrxQr";

const { createClient } = supabase;

const client = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
