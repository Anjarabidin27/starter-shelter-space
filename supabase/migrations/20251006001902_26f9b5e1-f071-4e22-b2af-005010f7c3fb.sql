-- Insert profile manually for the user
INSERT INTO public.profiles (user_id, email, username, is_approved)
VALUES ('926b1446-c166-4dcd-80d2-a21946d6b2c1', 'tokoanjar09@gmail.com', 'tokoanjar', true)
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email, is_approved = true;

-- Set as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('926b1446-c166-4dcd-80d2-a21946d6b2c1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;