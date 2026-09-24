DO $$
DECLARE
    fn RECORD;
BEGIN
    FOR fn IN
        SELECT n.nspname AS schema_name,
               p.proname AS function_name,
               pg_get_function_identity_arguments(p.oid) AS identity_arguments
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'finance'
           AND p.prokind = 'f'
           AND NOT EXISTS (
               SELECT 1
                 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS cfg
                WHERE cfg LIKE 'search_path=%'
           )
    LOOP
        EXECUTE format(
            'ALTER FUNCTION %I.%I(%s) SET search_path = %I, public, pg_catalog',
            fn.schema_name,
            fn.function_name,
            fn.identity_arguments,
            fn.schema_name
        );
    END LOOP;
END $$;
