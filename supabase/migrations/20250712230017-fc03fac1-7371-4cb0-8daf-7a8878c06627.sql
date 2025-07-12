-- Create SEC data tables with proper indexes and RLS policies

-- First, create the main submission tracking table
CREATE TABLE public.formd_submission (
  ACCESSIONNUMBER text NOT NULL PRIMARY KEY,
  FILE_NUM integer,
  FILING_DATE date,
  SIC_CODE text,
  SCHEMAVERSION text,
  SUBMISSIONTYPE text,
  TESTORLIVE text,
  OVER100PERSONSFLAG boolean,
  OVER100ISSUERFLAG boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create offerings table
CREATE TABLE public.offerings (
  ACCESSIONNUMBER text NOT NULL PRIMARY KEY REFERENCES public.formd_submission(ACCESSIONNUMBER),
  INDUSTRYGROUPTYPE text,
  INVESTMENTFUNDTYPE text,
  IS40ACT boolean,
  REVENUERANGE text,
  AGGREGATENETASSETVALUERANGE text,
  FEDERALEXEMPTIONS_ITEMS_LIST text,
  ISAMENDMENT boolean,
  PREVIOUSACCESSIONNUMBER text,
  SALE_DATE date,
  YETTOOCCUR boolean,
  MORETHANONEYEAR boolean,
  ISEQUITYTYPE boolean,
  ISDEBTTYPE boolean,
  ISOPTIONTOACQUIRETYPE boolean,
  ISSECURITYTOBEACQUIREDTYPE boolean,
  ISPOOLEDINVESTMENTFUNDTYPE boolean,
  ISTENANTINCOMMONTYPE boolean,
  ISMINERALPROPERTYTYPE boolean,
  ISOTHERTYPE boolean,
  DESCRIPTIONOFOTHERTYPE text,
  ISBUSINESSCOMBINATIONTRANS boolean,
  BUSCOMBCLARIFICATIONOFRESP text,
  MINIMUMINVESTMENTACCEPTED numeric(16,2),
  OVER100RECIPIENTFLAG boolean,
  TOTALOFFERINGAMOUNT numeric(16,2),
  TOTALAMOUNTSOLD numeric(16,2),
  TOTALREMAINING numeric(16,2),
  SALESCOMM_DOLLARAMOUNT numeric(16,2),
  SALESCOMM_ISESTIMATE boolean,
  FINDERSFEE_DOLLARAMOUNT numeric(16,2),
  FINDERSFEE_ISESTIMATE boolean,
  FINDERFEECLARIFICATIONOFRESP text,
  GROSSPROCEEDSUSED_DOLLARAMOUNT numeric(16,2),
  GROSSPROCEEDSUSED_ISESTIMATE boolean,
  GROSSPROCEEDSUSED_CLAROFRESP text,
  AUTHORIZEDREPRESENTATIVE text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create issuers table
CREATE TABLE public.issuers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ACCESSIONNUMBER text NOT NULL REFERENCES public.formd_submission(ACCESSIONNUMBER),
  IS_PRIMARYISSUER_FLAG boolean,
  ISSUER_SEQ_KEY integer,
  CIK text,
  ENTITYNAME text,
  STREET1 text,
  STREET2 text,
  CITY text,
  STATEORCOUNTRY text,
  STATEORCOUNTRYDESCRIPTION text,
  ZIPCODE text,
  ISSUERPHONENUMBER text,
  JURISDICTIONOFINC text,
  ENTITYTYPE text,
  ENTITYTYPEOTHERDESC text,
  YEAROFINC_VALUE_ENTERED integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create signatures table
CREATE TABLE public.signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ACCESSIONNUMBER text NOT NULL REFERENCES public.formd_submission(ACCESSIONNUMBER),
  SIGNATURE_SEQ_KEY integer,
  ISSUERNAME text,
  SIGNATURENAME text,
  NAMEOFSIGNER text,
  SIGNATURETITLE text,
  SIGNATUREDATE date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create related_persons table
CREATE TABLE public.related_persons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ACCESSIONNUMBER text NOT NULL REFERENCES public.formd_submission(ACCESSIONNUMBER),
  RELATEDPERSON_SEQ_KEY integer,
  FIRSTNAME text,
  MIDDLENAME text,
  LASTNAME text,
  STREET1 text,
  STREET2 text,
  CITY text,
  STATEORCOUNTRY text,
  STATEORCOUNTRYDESCRIPTION text,
  ZIPCODE text,
  RELATIONSHIP_1 text,
  RELATIONSHIP_2 text,
  RELATIONSHIP_3 text,
  RELATIONSHIPCLARIFICATION text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create recipients table
CREATE TABLE public.recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ACCESSIONNUMBER text NOT NULL REFERENCES public.formd_submission(ACCESSIONNUMBER),
  RECIPIENT_SEQ_KEY integer,
  RECIPIENTNAME text,
  RECIPIENTCRDNUMBER text,
  ASSOCIATEDBDNAME text,
  ASSOCIATEDBDCRDNUMBER text,
  STREET1 text,
  STREET2 text,
  CITY text,
  STATEORCOUNTRY text,
  STATEORCOUNTRYDESCRIPTION text,
  ZIPCODE text,
  STATES_OR_VALUE_LIST text,
  DESCRIPTIONS_LIST text,
  FOREIGNSOLICITATION boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add updated_at triggers for all tables
CREATE TRIGGER update_formd_submission_updated_at
  BEFORE UPDATE ON public.formd_submission
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON public.offerings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_issuers_updated_at
  BEFORE UPDATE ON public.issuers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_signatures_updated_at
  BEFORE UPDATE ON public.signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_related_persons_updated_at
  BEFORE UPDATE ON public.related_persons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_recipients_updated_at
  BEFORE UPDATE ON public.recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
-- Core offerings indexes
CREATE INDEX idx_offerings_sale_date ON public.offerings(SALE_DATE);
CREATE INDEX idx_offerings_total_amount ON public.offerings(TOTALOFFERINGAMOUNT);
CREATE INDEX idx_offerings_industry ON public.offerings(INDUSTRYGROUPTYPE);

-- Issuers indexes
CREATE INDEX idx_issuers_cik ON public.issuers(CIK);
CREATE INDEX idx_issuers_city ON public.issuers(CITY);
CREATE INDEX idx_issuers_state ON public.issuers(STATEORCOUNTRY);
CREATE INDEX idx_issuers_entityname ON public.issuers(ENTITYNAME);
CREATE INDEX idx_issuers_accessionnumber ON public.issuers(ACCESSIONNUMBER);

-- Related persons indexes
CREATE INDEX idx_related_persons_accessionnumber ON public.related_persons(ACCESSIONNUMBER);
CREATE INDEX idx_related_persons_lastname ON public.related_persons(LASTNAME);

-- Recipients indexes
CREATE INDEX idx_recipients_accessionnumber ON public.recipients(ACCESSIONNUMBER);
CREATE INDEX idx_recipients_name ON public.recipients(RECIPIENTNAME);

-- Form D submission indexes
CREATE INDEX idx_formd_filing_date ON public.formd_submission(FILING_DATE);
CREATE INDEX idx_formd_sic_code ON public.formd_submission(SIC_CODE);

-- Enable Row Level Security
ALTER TABLE public.formd_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.related_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (SEC data is public)
CREATE POLICY "SEC data is publicly viewable" ON public.formd_submission FOR SELECT USING (true);
CREATE POLICY "SEC data is publicly viewable" ON public.offerings FOR SELECT USING (true);
CREATE POLICY "SEC data is publicly viewable" ON public.issuers FOR SELECT USING (true);
CREATE POLICY "SEC data is publicly viewable" ON public.signatures FOR SELECT USING (true);
CREATE POLICY "SEC data is publicly viewable" ON public.related_persons FOR SELECT USING (true);
CREATE POLICY "SEC data is publicly viewable" ON public.recipients FOR SELECT USING (true);

-- Create policies for authenticated insert/update (for import processes)
CREATE POLICY "Authenticated users can insert SEC data" ON public.formd_submission FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert SEC data" ON public.offerings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert SEC data" ON public.issuers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert SEC data" ON public.signatures FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert SEC data" ON public.related_persons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert SEC data" ON public.recipients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update SEC data" ON public.formd_submission FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SEC data" ON public.offerings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SEC data" ON public.issuers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SEC data" ON public.signatures FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SEC data" ON public.related_persons FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SEC data" ON public.recipients FOR UPDATE USING (auth.uid() IS NOT NULL);