-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone_farm TEXT NOT NULL,
  responsible_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (true);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members policies
CREATE POLICY "Authenticated users can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (true);

-- Create time_records table
CREATE TABLE public.time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  entry_timestamp TIMESTAMPTZ NOT NULL,
  exit_timestamp TIMESTAMPTZ,
  work_location TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- Time records policies
CREATE POLICY "Authenticated users can view time records"
  ON public.time_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create time records"
  ON public.time_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update time records"
  ON public.time_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete time records"
  ON public.time_records FOR DELETE
  TO authenticated
  USING (true);

-- Create production table
CREATE TABLE public.production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_record_id UUID NOT NULL REFERENCES public.time_records(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Cajas', 'KG', 'Metros')),
  quantity NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production ENABLE ROW LEVEL SECURITY;

-- Production policies
CREATE POLICY "Authenticated users can view production"
  ON public.production FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create production"
  ON public.production FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update production"
  ON public.production FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete production"
  ON public.production FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();