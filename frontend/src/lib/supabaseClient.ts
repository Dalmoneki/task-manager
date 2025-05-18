import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase'; // ajuste o path se necessário

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Debug global no navegador
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
