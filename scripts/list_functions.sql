-- Query to list all functions in the public schema with their full signatures
-- This helps identify function overloading issues and view complete function definitions

SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatility,
  l.lanname as language,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- 'f' = function (not aggregate, window, or procedure)
ORDER BY p.proname, pg_get_function_arguments(p.oid);

-- Simpler version - just names and signatures (easier to read)
-- Uncomment the query below if you just want a quick overview:

/*
SELECT
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f'
ORDER BY proname;
*/
