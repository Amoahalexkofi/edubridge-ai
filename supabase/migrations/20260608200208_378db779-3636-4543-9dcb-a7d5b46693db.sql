
-- Enums
CREATE TYPE public.app_role AS ENUM ('student','teacher','parent','admin','super_admin');
CREATE TYPE public.exam_type AS ENUM ('bece','wassce');
CREATE TYPE public.question_type AS ENUM ('multiple_choice','short_answer','fill_blank','matching','essay');
CREATE TYPE public.difficulty_level AS ENUM ('easy','medium','hard');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  school TEXT,
  region TEXT,
  exam_target public.exam_type,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- default role student; can be overridden via signup metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  exam_type public.exam_type NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are public" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Topics
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.topics TO authenticated, anon;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are public" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Teachers and admins manage topics" ON public.topics FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objectives TEXT,
  content TEXT,
  video_url TEXT,
  duration_minutes INT,
  order_index INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons viewable by signed in" ON public.lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers/admins manage lessons" ON public.lessons FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  question_type public.question_type NOT NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  year INT,
  marks INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by signed in" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers/admins manage questions" ON public.questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Exams
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_type public.exam_type NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  total_marks INT NOT NULL DEFAULT 100,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exams viewable by signed in" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers/admins manage exams" ON public.exams FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.exam_questions (
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, question_id)
);
GRANT SELECT ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exam questions viewable by signed in" ON public.exam_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers/admins manage exam questions" ON public.exam_questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Attempts
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  total_marks INT,
  status TEXT NOT NULL DEFAULT 'in_progress'
);
GRANT SELECT, INSERT, UPDATE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create their own attempts" ON public.exam_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own attempts" ON public.exam_attempts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  marks_awarded INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT, INSERT, UPDATE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their attempt answers" ON public.attempt_answers FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));
CREATE POLICY "Users insert their attempt answers" ON public.attempt_answers FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));
CREATE POLICY "Users update their attempt answers" ON public.attempt_answers FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid()));

-- Seed subjects
INSERT INTO public.subjects (name, slug, exam_type, description, icon, color) VALUES
('English Language','bece-english','bece','Reading, writing and comprehension','BookOpen','emerald'),
('Mathematics','bece-mathematics','bece','Numbers, algebra, geometry','Calculator','amber'),
('Integrated Science','bece-science','bece','Physics, chemistry, biology basics','Atom','sky'),
('Social Studies','bece-social','bece','Ghana, governance and society','Globe2','rose'),
('Career Technology','bece-career-tech','bece','Pre-technical and vocational skills','Wrench','violet'),
('Computing','bece-computing','bece','Digital literacy and ICT','Laptop','indigo'),
('Creative Arts','bece-arts','bece','Visual and performing arts','Palette','pink'),
('Ghanaian Language','bece-ghanaian','bece','Examinable Ghanaian languages','Languages','teal'),
('Religious & Moral Education','bece-rme','bece','RME for BECE','HeartHandshake','orange'),
('French','bece-french','bece','French as a foreign language','Globe','blue'),
('Core English','wassce-english','wassce','WASSCE core English','BookOpen','emerald'),
('Core Mathematics','wassce-core-math','wassce','WASSCE core mathematics','Calculator','amber'),
('Integrated Science','wassce-science','wassce','WASSCE integrated science','Atom','sky'),
('Social Studies','wassce-social','wassce','WASSCE social studies','Globe2','rose'),
('Elective Mathematics','wassce-elec-math','wassce','Elective mathematics','Sigma','amber'),
('Physics','wassce-physics','wassce','WASSCE physics','Atom','sky'),
('Chemistry','wassce-chemistry','wassce','WASSCE chemistry','FlaskConical','violet'),
('Biology','wassce-biology','wassce','WASSCE biology','Leaf','green'),
('Economics','wassce-economics','wassce','WASSCE economics','TrendingUp','indigo'),
('Geography','wassce-geography','wassce','WASSCE geography','Map','teal'),
('Government','wassce-government','wassce','WASSCE government','Landmark','rose'),
('Literature in English','wassce-literature','wassce','WASSCE literature','Feather','pink');
