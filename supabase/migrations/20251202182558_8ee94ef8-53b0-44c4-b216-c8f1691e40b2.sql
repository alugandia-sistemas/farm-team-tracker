-- Create work_zones table
CREATE TABLE public.work_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.work_zones ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_zones
CREATE POLICY "Authenticated users can view work zones"
ON public.work_zones FOR SELECT
USING (true);

CREATE POLICY "Admins can create work zones"
ON public.work_zones FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update work zones"
ON public.work_zones FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete work zones"
ON public.work_zones FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));