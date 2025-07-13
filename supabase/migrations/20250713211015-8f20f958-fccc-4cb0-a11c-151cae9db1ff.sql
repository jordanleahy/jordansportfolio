-- Convert text fields to numeric types safely without violating foreign key constraints
-- Only convert values that are valid numbers, leave invalid ones as NULL

-- 1. Convert offerings text fields to integers (without deleting records)
ALTER TABLE public.offerings 
ALTER COLUMN numbernonaccreditedinvestors TYPE INTEGER 
USING CASE 
  WHEN numbernonaccreditedinvestors = '' OR numbernonaccreditedinvestors IS NULL THEN NULL
  WHEN numbernonaccreditedinvestors ~ '^[0-9]+$' THEN numbernonaccreditedinvestors::INTEGER
  ELSE NULL
END;

ALTER TABLE public.offerings 
ALTER COLUMN totalnumberalreadyinvested TYPE INTEGER 
USING CASE 
  WHEN totalnumberalreadyinvested = '' OR totalnumberalreadyinvested IS NULL THEN NULL
  WHEN totalnumberalreadyinvested ~ '^[0-9]+$' THEN totalnumberalreadyinvested::INTEGER
  ELSE NULL
END;

-- 2. Convert SIC code to integer (without deleting records)
ALTER TABLE public.formd_submission 
ALTER COLUMN sic_code TYPE INTEGER 
USING CASE 
  WHEN sic_code = '' OR sic_code IS NULL THEN NULL
  WHEN sic_code ~ '^[0-9]+$' THEN sic_code::INTEGER
  ELSE NULL
END;

-- 3. Convert CIK to bigint (without deleting records)
ALTER TABLE public.issuers 
ALTER COLUMN cik TYPE BIGINT 
USING CASE 
  WHEN cik = '' OR cik IS NULL THEN NULL
  WHEN cik ~ '^[0-9]+$' THEN cik::BIGINT
  ELSE NULL
END;

-- 4. Convert CRD numbers to integers (without deleting records)
ALTER TABLE public.recipients 
ALTER COLUMN recipientcrdnumber TYPE INTEGER 
USING CASE 
  WHEN recipientcrdnumber = '' OR recipientcrdnumber IS NULL THEN NULL
  WHEN recipientcrdnumber ~ '^[0-9]+$' THEN recipientcrdnumber::INTEGER
  ELSE NULL
END;

ALTER TABLE public.recipients 
ALTER COLUMN associatedbdcrdnumber TYPE INTEGER 
USING CASE 
  WHEN associatedbdcrdnumber = '' OR associatedbdcrdnumber IS NULL THEN NULL
  WHEN associatedbdcrdnumber ~ '^[0-9]+$' THEN associatedbdcrdnumber::INTEGER
  ELSE NULL
END;