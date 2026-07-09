import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Request-scoped auth lookup. `supabase.auth.getUser()` is a network round-trip
 * to Supabase's auth server that validates the JWT; every page previously made
 * that call in BOTH the layout and the page, so each navigation paid for it
 * twice. React's cache() dedupes it within a single request render, so the
 * layout and page now share one round-trip.
 *
 * Use this everywhere instead of calling supabase.auth.getUser() directly.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
