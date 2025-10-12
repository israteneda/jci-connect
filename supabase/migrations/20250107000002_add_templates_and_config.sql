-- =====================================================
-- JCI CONNECT - TEMPLATES AND CONFIGURATION SCHEMA
-- Migration: Add templates and communication configuration
-- Date: 2025-01-07
-- Purpose: Add message templates and communication settings
-- =====================================================

-- =====================================================
-- MESSAGE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject TEXT, -- Only for email templates
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- Array of variable names used in template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_templates IS 'Message templates for email and WhatsApp communications';
COMMENT ON COLUMN public.message_templates.type IS 'Template type: email or whatsapp';
COMMENT ON COLUMN public.message_templates.subject IS 'Email subject line (only for email templates)';
COMMENT ON COLUMN public.message_templates.content IS 'Template content with variable placeholders like {{first_name}}';
COMMENT ON COLUMN public.message_templates.variables IS 'Array of variable names extracted from content';

-- =====================================================
-- COMMUNICATION CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communication_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type) -- Only one config per type
);

COMMENT ON TABLE public.communication_configs IS 'Communication service configurations (WhatsApp EvolutionAPI, SMTP, etc.)';
COMMENT ON COLUMN public.communication_configs.type IS 'Configuration type: whatsapp or email';
COMMENT ON COLUMN public.communication_configs.config_data IS 'JSON configuration data specific to each service type';

-- =====================================================
-- MESSAGE LOGS TABLE (for tracking sent messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject TEXT, -- For email messages
  content TEXT NOT NULL,
  variables_used JSONB DEFAULT '{}', -- Variables that were replaced in the message
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_logs IS 'Log of all messages sent through the system';
COMMENT ON COLUMN public.message_logs.variables_used IS 'JSON object with the actual values used for each variable';
COMMENT ON COLUMN public.message_logs.status IS 'Message delivery status';

-- =====================================================
-- UPDATE CHAPTER SETTINGS TABLE
-- =====================================================
-- Add communication configuration columns to existing chapter_settings table
ALTER TABLE public.chapter_settings 
ADD COLUMN IF NOT EXISTS whatsapp_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT '{}';

COMMENT ON COLUMN public.chapter_settings.whatsapp_config IS 'WhatsApp EvolutionAPI configuration';
COMMENT ON COLUMN public.chapter_settings.email_config IS 'SMTP email configuration';

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON public.message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON public.message_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_communication_configs_type ON public.communication_configs(type);
CREATE INDEX IF NOT EXISTS idx_message_logs_template_id ON public.message_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient_id ON public.message_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_type ON public.message_logs(type);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON public.message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to new tables
CREATE TRIGGER set_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_communication_configs_updated_at
  BEFORE UPDATE ON public.communication_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MESSAGE TEMPLATES TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read active templates
CREATE POLICY "Users can view active templates"
  ON public.message_templates FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND is_active = true
  );

-- Allow admins to manage all templates
CREATE POLICY "Admins can manage all templates"
  ON public.message_templates FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Allow senators to view all templates
CREATE POLICY "Senators can view all templates"
  ON public.message_templates FOR SELECT
  USING (public.get_my_role() = 'senator');

-- =====================================================
-- COMMUNICATION CONFIGURATIONS TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read configurations
CREATE POLICY "Users can view communication configs"
  ON public.communication_configs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage configurations
CREATE POLICY "Admins can manage communication configs"
  ON public.communication_configs FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MESSAGE LOGS TABLE POLICIES
-- =====================================================

-- Users can view their own message logs
CREATE POLICY "Users can view their own message logs"
  ON public.message_logs FOR SELECT
  USING (auth.uid() = recipient_id);

-- Admins can view all message logs
CREATE POLICY "Admins can view all message logs"
  ON public.message_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Admins can manage message logs
CREATE POLICY "Admins can manage message logs"
  ON public.message_logs FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to extract variables from template content
CREATE OR REPLACE FUNCTION public.extract_template_variables(content TEXT, subject TEXT DEFAULT NULL)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  full_text TEXT;
  matches TEXT[];
BEGIN
  -- Combine content and subject
  full_text := COALESCE(content, '') || ' ' || COALESCE(subject, '');
  
  -- Extract all {{variable}} patterns
  SELECT ARRAY(
    SELECT DISTINCT regexp_replace(match, '[{}]', '', 'g')
    FROM regexp_split_to_table(full_text, '\{\{[^}]+\}\}') AS match
    WHERE match ~ '\{\{[^}]+\}\}'
  ) INTO matches;
  
  RETURN COALESCE(matches, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION public.extract_template_variables(TEXT, TEXT) IS 'Extracts variable names from template content and subject';

-- Function to validate template variables
CREATE OR REPLACE FUNCTION public.validate_template_variables(template_content TEXT, template_subject TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  variables TEXT[];
  valid_variables TEXT[] := ARRAY[
    'first_name', 'last_name', 'email', 'phone', 'member_number',
    'chapter_name', 'chapter_city', 'chapter_country', 'website',
    'meeting_date', 'meeting_time', 'meeting_location', 'event_name',
    'event_date', 'event_location', 'payment_amount', 'due_date'
  ];
  var TEXT;
BEGIN
  variables := public.extract_template_variables(template_content, template_subject);
  
  -- Check if all variables are in the valid list
  FOREACH var IN ARRAY variables
  LOOP
    IF NOT (var = ANY(valid_variables)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.validate_template_variables(TEXT, TEXT) IS 'Validates that all template variables are from the allowed list';

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample email template
INSERT INTO public.message_templates (name, type, subject, content, variables, is_active) VALUES
(
  'Welcome Email',
  'email',
  'Welcome to {{chapter_name}}!',
  'Dear {{first_name}},

Welcome to {{chapter_name}}! We are excited to have you as a new member of our chapter.

Here are some important details:
- Member Number: {{member_number}}
- Chapter: {{chapter_name}}
- Location: {{chapter_city}}, {{chapter_country}}

If you have any questions, please don''t hesitate to contact us.

Best regards,
{{chapter_name}} Team',
  ARRAY['first_name', 'chapter_name', 'member_number', 'chapter_city', 'chapter_country'],
  true
) ON CONFLICT DO NOTHING;

-- Insert sample WhatsApp template
INSERT INTO public.message_templates (name, type, content, variables, is_active) VALUES
(
  'Meeting Reminder',
  'whatsapp',
  'Hi {{first_name}}! 👋

This is a reminder about our upcoming meeting:

📅 Date: {{meeting_date}}
🕐 Time: {{meeting_time}}
📍 Location: {{meeting_location}}

We look forward to seeing you there! 🎯

Best regards,
{{chapter_name}} Team',
  ARRAY['first_name', 'meeting_date', 'meeting_time', 'meeting_location', 'chapter_name'],
  true
) ON CONFLICT DO NOTHING;

-- Insert default communication configurations
INSERT INTO public.communication_configs (type, enabled, config_data) VALUES
(
  'whatsapp',
  false,
  '{
    "api_url": "",
    "api_key": "",
    "instance_name": "",
    "webhook_url": ""
  }'
),
(
  'email',
  false,
  '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_secure": false,
    "from_email": "",
    "from_name": ""
  }'
) ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Templates and Communication Schema Created Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Tables: message_templates, communication_configs, message_logs';
  RAISE NOTICE '🔧 Functions: extract_template_variables, validate_template_variables';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '📝 Sample templates created';
  RAISE NOTICE '⚙️  Default configurations created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Step: Configure WhatsApp and Email settings in the admin panel';
  RAISE NOTICE '========================================';
END $$;
