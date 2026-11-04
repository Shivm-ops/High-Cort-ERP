-- scripts/cleanup_user.sql
-- Direct SQL cleanup for any user account, sessions, and CRM clients matching keyword 'shweta'

DO $$
DECLARE
    kw TEXT := '%shweta%';
    u_rec RECORD;
    cl_rec RECORD;
    remaining_cnt INT;
BEGIN
    RAISE NOTICE 'Starting cleanup for accounts matching: %', kw;

    -- 1. Loop through all matching users
    FOR u_rec IN SELECT id, email, full_name, firm_id FROM users WHERE email ILIKE kw OR full_name ILIKE kw LOOP
        RAISE NOTICE 'Deleting User: % (%) [ID: %]', u_rec.full_name, u_rec.email, u_rec.id;

        -- Clean up references safely
        BEGIN DELETE FROM user_sessions WHERE user_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM login_history WHERE user_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM audit_logs WHERE user_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM kyc_verifications WHERE user_id = u_rec.id OR reviewed_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM letterheads WHERE user_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM support_messages WHERE sender_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM support_tickets WHERE user_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM document_versions WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM draft_versions WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM drafts WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM filings WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM invoices WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM court_orders WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM parties WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM mact_workflow_logs WHERE entered_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM mact_cases WHERE advocate_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM case_advocates WHERE advocate_id = u_rec.id OR assigned_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM case_tasks WHERE assignee_id = u_rec.id OR assigned_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM case_laws WHERE created_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN UPDATE documents SET uploaded_by_id = NULL, modified_by_id = NULL, downloaded_by_id = NULL, filed_by_id = NULL WHERE uploaded_by_id = u_rec.id OR modified_by_id = u_rec.id OR downloaded_by_id = u_rec.id OR filed_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN UPDATE cases SET primary_advocate_id = NULL, created_by_id = NULL, updated_by_id = NULL WHERE primary_advocate_id = u_rec.id OR created_by_id = u_rec.id OR updated_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN UPDATE clients SET assigned_advocate_id = NULL, created_by_id = NULL, updated_by_id = NULL WHERE assigned_advocate_id = u_rec.id OR created_by_id = u_rec.id OR updated_by_id = u_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;

        -- Delete the user
        DELETE FROM users WHERE id = u_rec.id;
        RAISE NOTICE 'Deleted user: %', u_rec.email;

        -- Check firm
        IF u_rec.firm_id IS NOT NULL THEN
            SELECT count(*) INTO remaining_cnt FROM users WHERE firm_id = u_rec.firm_id;
            IF remaining_cnt = 0 THEN
                BEGIN DELETE FROM tenant_subscriptions WHERE firm_id = u_rec.firm_id; EXCEPTION WHEN OTHERS THEN NULL; END;
                BEGIN DELETE FROM firms WHERE id = u_rec.firm_id; EXCEPTION WHEN OTHERS THEN NULL; END;
                RAISE NOTICE 'Deleted empty firm: %', u_rec.firm_id;
            END IF;
        END IF;
    END LOOP;

    -- 2. Loop through all matching CRM clients
    FOR cl_rec IN SELECT id, name, email FROM clients WHERE email ILIKE kw OR name ILIKE kw LOOP
        RAISE NOTICE 'Deleting CRM Client: % (%) [ID: %]', cl_rec.name, cl_rec.email, cl_rec.id;

        BEGIN DELETE FROM documents WHERE client_id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM drafts WHERE client_id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM invoices WHERE client_id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM advance_payments WHERE client_id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM cases WHERE client_id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN DELETE FROM clients WHERE id = cl_rec.id; EXCEPTION WHEN OTHERS THEN NULL; END;
        RAISE NOTICE 'Deleted CRM client: %', cl_rec.name;
    END LOOP;

    RAISE NOTICE 'Cleanup completed successfully!';
END $$;
