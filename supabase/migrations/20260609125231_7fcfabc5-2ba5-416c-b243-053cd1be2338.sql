
-- Lock down direct execution. Trigger invocation does not require EXECUTE
-- privilege on the function (it runs on behalf of the table owner), so this
-- only blocks anon/authenticated from RPC-calling the function directly.
REVOKE EXECUTE ON FUNCTION public.log_row_change() FROM PUBLIC, anon, authenticated;
