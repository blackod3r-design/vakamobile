import { createClient } from '@supabase/supabase-js';

// ⚠️ REEMPLAZA ESTO CON LO QUE COPIASTE DEL DASHBOARD
const supabaseUrl = 'https://nthalvpfnsontnlrcvfw.supabase.co';
const supabaseKey = 'sb_publishable_EZaEL6MJQtc2Ks-11OVMKQ_WAASWNw-';

export const supabase = createClient(supabaseUrl, supabaseKey);