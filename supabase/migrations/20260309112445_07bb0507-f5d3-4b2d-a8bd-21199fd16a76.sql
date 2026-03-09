
-- =============================================
-- MODULE 1: USER MANAGEMENT (extends existing profiles)
-- =============================================

-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- MODULE 2: FILE/ASSET MANAGEMENT (encrypted files)
-- =============================================

CREATE TYPE public.file_type AS ENUM ('image', 'audio', 'document', 'video', 'other');
CREATE TYPE public.encryption_method AS ENUM ('lsb', 'dct', 'dwt', 'aes256', 'rsa', 'custom');

CREATE TABLE public.encrypted_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  file_type file_type NOT NULL DEFAULT 'image',
  encryption_method encryption_method NOT NULL DEFAULT 'lsb',
  original_file_url text,
  encrypted_file_url text,
  file_size_bytes bigint,
  category text,
  tags text[] DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encrypted_files ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_encrypted_files_updated_at
  BEFORE UPDATE ON public.encrypted_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for encrypted_files
CREATE POLICY "Users can view own files" ON public.encrypted_files
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view public files" ON public.encrypted_files
  FOR SELECT TO authenticated USING (is_public = true);

CREATE POLICY "Users can insert own files" ON public.encrypted_files
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.encrypted_files
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.encrypted_files
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- File reviews/ratings
CREATE TABLE public.file_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.encrypted_files(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, user_id)
);
ALTER TABLE public.file_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews of public files" ON public.file_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reviews" ON public.file_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.file_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.file_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- MODULE 3: OPERATIONS MANAGEMENT (encode/decode)
-- =============================================

CREATE TYPE public.operation_type AS ENUM ('encode', 'decode');
CREATE TYPE public.operation_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_id uuid REFERENCES public.encrypted_files(id) ON DELETE SET NULL,
  operation_type operation_type NOT NULL,
  status operation_status NOT NULL DEFAULT 'pending',
  encryption_method encryption_method NOT NULL DEFAULT 'lsb',
  input_file_url text,
  output_file_url text,
  message_embedded text,
  error_message text,
  processing_time_ms integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_operations_updated_at
  BEFORE UPDATE ON public.operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for operations
CREATE POLICY "Users can view own operations" ON public.operations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own operations" ON public.operations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operations" ON public.operations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own operations" ON public.operations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Operation notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_id uuid REFERENCES public.operations(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- MODULE 4: REPORTS & ANALYTICS (activity logs)
-- =============================================

CREATE TYPE public.activity_type AS ENUM (
  'login', 'logout', 'encode', 'decode', 'file_upload', 'file_delete',
  'profile_update', 'settings_change', 'export', 'other'
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type activity_type NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Usage statistics (aggregated daily)
CREATE TABLE public.usage_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  encode_count integer NOT NULL DEFAULT 0,
  decode_count integer NOT NULL DEFAULT 0,
  files_uploaded integer NOT NULL DEFAULT 0,
  storage_used_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.usage_statistics ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_usage_statistics_updated_at
  BEFORE UPDATE ON public.usage_statistics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own statistics" ON public.usage_statistics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own statistics" ON public.usage_statistics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON public.usage_statistics
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statistics" ON public.usage_statistics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for operations and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
