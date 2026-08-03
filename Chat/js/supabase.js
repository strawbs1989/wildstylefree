// =====================================================
// Wildstyle Community
// Supabase Configuration
// =====================================================

const SUPABASE_URL = "https://pzdjemvogdpbpinixltc.supabase.co";

const SUPABASE_KEY = "sb_publishable__DnIH0oiCtOl9tyBCVb9hg_9vwcrxQr";

// Create the Supabase client
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
