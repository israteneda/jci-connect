-- =====================================================
-- SEED DATA for JCI Connect
-- Run this after the initial migration
-- =====================================================

-- This system is designed for single-chapter installations
-- Each chapter deploys their own instance

-- =====================================================
-- ORGANIZATION SETTINGS
-- =====================================================

-- Insert default organization settings
INSERT INTO public.organization_settings (
  id,
  organization_name,
  organization_city,
  organization_country,
  email_config,
  whatsapp_config
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'JCI Connect',
  'Ottawa',
  'Canada',
  '{"smtp_host": "smtp.gmail.com", "smtp_port": 587, "smtp_username": "", "smtp_password": "", "smtp_use_tls": true}',
  '{"api_url": "", "api_token": ""}'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MESSAGE TEMPLATES
-- =====================================================

-- Insert sample email template
INSERT INTO public.message_templates (name, type, subject, content, variables, is_active) VALUES
(
  'Prospective Member Email',
  'email',
  'Explore Growth, Leadership & Friendship with {{organization_name}}',
  'Hi {{first_name}},

Thank you for your interest in {{organization_name}}. We''re a community of young leaders and professionals who believe in developing skills, creating impact, and building lifelong friendships along the way.

When you become part of JCI, you open the door to a wide range of opportunities for personal and professional growth:

<strong>Training & Mentorship</strong> – Participate in workshops, develop public speaking and facilitation skills, and even progress toward becoming a certified JCI trainer.

<strong>Leadership Development</strong> – Take up local, national, or international leadership roles that challenge and grow your abilities.

<strong>Entrepreneurship & Innovation</strong> – Join projects that nurture entrepreneurial thinking and bring ideas to life.

<strong>Community Impact</strong> – Lead or support initiatives that address real challenges and create meaningful change in Ottawa.

<strong>Networking & Global Connections</strong> – Build strong relationships with professionals, entrepreneurs, and changemakers across Canada and over 100 countries worldwide.

You can learn more about {{organization_name}} here: https://www.jciottawa.ca/index.php

If you''d like to have a personal conversation about how JCI fits with your goals, you can schedule a short call with our Membership Director. [Insert Calendar Link]

We''d love for you to experience what JCI truly offers — a place where learning leads to leadership, and friendships last far beyond meetings and events. Looking forward to see you as part of the community.

Warm regards,
Israel
President, {{organization_name}}',
  ARRAY['first_name', 'organization_name'],
  true
) ON CONFLICT DO NOTHING;

-- Insert sample WhatsApp template
INSERT INTO public.message_templates (name, type, content, variables, is_active) VALUES
(
  'JCI Ottawa Welcome WhatsApp',
  'whatsapp',
  'Hi *{{first_name}} {{last_name}}*
Welcome to *{{organization_name}}*. We''re excited to have you join our community of young leaders.

Do you believe in _lifelong friendships_? At JCI, you''ll find opportunities to build genuine connections while growing your skills and making an impact.

Here are a few links to help you get started:
• WhatsApp Group (for updates and reminders): Join here
• JVC Platform (workshops and leadership resources): https://jvc.jci.cc/
• Website (events and projects): https://www.jciottawa.ca/index.php
• Facebook: https://www.facebook.com/JCI.Ottawa
• Instagram: https://www.instagram.com/jciottawa/

You''ll also find a detailed welcome email in your inbox with more information about *{{organization_name}}* and how to get involved.

If you''d like, you can schedule a short call with our Membership Director (Your new friend) for a personal orientation into the organization. (we will create a Calendly Link or alternate open source)

Looking forward to meeting you soon — because beyond skills and projects, JCI is where _lifelong friendships_ are built.

Best Regards,
Israel
President
*{{organization_name}}*',
  ARRAY['first_name', 'last_name', 'organization_name'],
  true
) ON CONFLICT DO NOTHING;


-- =====================================================
-- ADMIN USER SETUP INSTRUCTIONS
-- =====================================================

-- Note: Admin users should be created through Supabase Auth Dashboard
-- After creating a user, update their role:
-- UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id = 'user-id-here';

-- Example: Create a test member with membership
-- First create user in Auth Dashboard, then:
-- INSERT INTO public.memberships (user_id, membership_type, status, start_date, expiry_date, member_number, payment_status, payment_type, annual_fee)
-- VALUES ('user-id-here', 'local', 'active', '2025-01-01', '2025-12-31', 'M-001', 'paid', 'annual', 100.00);

-- Example: Add a board position for a member
-- INSERT INTO public.board_positions (user_id, position_title, level, description, priority, start_date, is_active)
-- VALUES ('user-id-here', 'President', 'local', 'Chapter President responsible for overall leadership', 1, '2025-01-01', true);
