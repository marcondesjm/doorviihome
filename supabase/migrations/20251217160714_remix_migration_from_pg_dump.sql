CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: access_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid,
    code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    property_name text NOT NULL,
    duration text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT activity_logs_type_check CHECK ((type = ANY (ARRAY['doorbell'::text, 'answered'::text, 'missed'::text, 'incoming'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    image_url text,
    is_online boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: video_calls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_calls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_name text NOT NULL,
    property_id uuid,
    property_name text NOT NULL,
    owner_id uuid NOT NULL,
    visitor_joined boolean DEFAULT false,
    owner_joined boolean DEFAULT false,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone
);

ALTER TABLE ONLY public.video_calls REPLICA IDENTITY FULL;


--
-- Name: access_codes access_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_code_key UNIQUE (code);


--
-- Name: access_codes access_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: video_calls video_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_pkey PRIMARY KEY (id);


--
-- Name: video_calls video_calls_room_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_room_name_key UNIQUE (room_name);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: properties update_properties_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: access_codes access_codes_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: access_codes access_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_calls video_calls_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_calls
    ADD CONSTRAINT video_calls_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: video_calls Anyone can update visitor_joined status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update visitor_joined status" ON public.video_calls FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: video_calls Anyone can view calls by room_name; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view calls by room_name" ON public.video_calls FOR SELECT USING (true);


--
-- Name: video_calls Owners can create calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can create calls" ON public.video_calls FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: video_calls Owners can update their calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their calls" ON public.video_calls FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: video_calls Owners can view their calls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can view their calls" ON public.video_calls FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: access_codes Users can delete their own access codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own access codes" ON public.access_codes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: properties Users can delete their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own properties" ON public.properties FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: access_codes Users can insert their own access codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own access codes" ON public.access_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: activity_logs Users can insert their own activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: properties Users can insert their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own properties" ON public.properties FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: properties Users can update their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own properties" ON public.properties FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: access_codes Users can view their own access codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own access codes" ON public.access_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs Users can view their own activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: properties Users can view their own properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own properties" ON public.properties FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: access_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: video_calls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


