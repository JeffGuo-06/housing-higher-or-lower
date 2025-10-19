-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_name character varying NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  correct_guesses integer DEFAULT 0 CHECK (correct_guesses >= 0),
  total_guesses integer DEFAULT 0 CHECK (total_guesses >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  pack_id integer DEFAULT 1,
  CONSTRAINT leaderboard_pkey PRIMARY KEY (id),
  CONSTRAINT leaderboard_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.packs(id)
);
CREATE TABLE public.packs (
  id integer NOT NULL,
  name character varying NOT NULL,
  description text,
  difficulty character varying,
  property_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT packs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mls_number character varying,
  property_id character varying,
  address text NOT NULL,
  city character varying,
  state character varying,
  province character varying,
  postal_code character varying,
  country character NOT NULL CHECK (country = ANY (ARRAY['US'::bpchar, 'CA'::bpchar])),
  latitude numeric CHECK (latitude >= '-90'::integer::numeric AND latitude <= 90::numeric),
  longitude numeric CHECK (longitude >= '-180'::integer::numeric AND longitude <= 180::numeric),
  price integer NOT NULL CHECK (price > 0),
  bedrooms character varying,
  bathrooms character varying,
  sqft integer CHECK (sqft > 0),
  lot_size character varying,
  year_built integer CHECK (year_built >= 1600 AND year_built::numeric <= (EXTRACT(year FROM CURRENT_DATE) + 5::numeric)),
  property_type character varying,
  listing_url text,
  image_url text,
  image_url_med text,
  image_url_low text,
  local_image_path text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  pack_id integer DEFAULT 1,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.packs(id)
);