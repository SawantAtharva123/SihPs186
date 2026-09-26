-- Initial Schema Setup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE,
  person_id TEXT UNIQUE,
  name TEXT,
  service_number TEXT,
  rank TEXT,
  unit_id TEXT,
  role TEXT,
  email TEXT UNIQUE,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE,
  name TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE duty_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE,
  person_id TEXT REFERENCES profiles(person_id),
  date DATE,
  start_time TIME,
  end_time TIME,
  duration_hours NUMERIC,
  shift_type TEXT,
  is_night BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sleep_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE,
  person_id TEXT REFERENCES profiles(person_id),
  date DATE,
  duration_hours NUMERIC,
  quality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recovery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE,
  person_id TEXT REFERENCES profiles(person_id),
  date DATE,
  score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_duty_person_date ON duty_records(person_id, date);
CREATE INDEX idx_sleep_person_date ON sleep_records(person_id, date);
CREATE INDEX idx_recovery_person_date ON recovery_records(person_id, date);
