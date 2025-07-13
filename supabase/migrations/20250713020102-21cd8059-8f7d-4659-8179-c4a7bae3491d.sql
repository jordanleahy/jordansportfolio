-- Add missing columns to offerings table
ALTER TABLE public.offerings 
ADD COLUMN salesamtclarificationofresp text,
ADD COLUMN hasnonaccreditedinvestors boolean,
ADD COLUMN numbernonaccreditedinvestors numeric,
ADD COLUMN totalnumberalreadyinvested numeric;