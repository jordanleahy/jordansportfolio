-- Add missing columns to issuers table
ALTER TABLE public.issuers 
ADD COLUMN issuer_previousname_1 text,
ADD COLUMN issuer_previousname_2 text,
ADD COLUMN issuer_previousname_3 text,
ADD COLUMN edgar_previousname_1 text,
ADD COLUMN edgar_previousname_2 text,
ADD COLUMN edgar_previousname_3 text,
ADD COLUMN yearofinc_timespan_choice text;

-- Remove duplicate STREET2 column (keeping lowercase street2)
ALTER TABLE public.issuers DROP COLUMN IF EXISTS "STREET2";