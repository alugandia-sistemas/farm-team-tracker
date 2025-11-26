-- Create invitation_tokens table for managing access tokens
CREATE TABLE public.invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can view tokens (we'll implement admin role later)
-- For now, allow authenticated users to check if a token is valid
CREATE POLICY "Users can check token validity"
ON public.invitation_tokens
FOR SELECT
USING (NOT used AND expires_at > now());

-- System can mark tokens as used
CREATE POLICY "System can update tokens"
ON public.invitation_tokens
FOR UPDATE
USING (true);

-- Create index for faster token lookups
CREATE INDEX idx_invitation_tokens_token ON public.invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_used ON public.invitation_tokens(used);

-- Add phone number to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;