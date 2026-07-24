import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GRACE_DAYS = 3;

// Dépublie automatiquement les pièces en rupture depuis plus de
// GRACE_DAYS jours. Appelé avant toute lecture publique/admin des
// produits pour que la règle s'applique sans tâche planifiée.
export async function sweepExpiredStock(
  supabase: SupabaseClient<Database>,
) {
  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("products")
    .update({ published: false })
    .eq("published", true)
    .eq("stock", 0)
    .not("out_of_stock_since", "is", null)
    .lt("out_of_stock_since", cutoff);
}
