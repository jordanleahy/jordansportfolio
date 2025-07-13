-- Convert text fields to numeric types for better data integrity
-- Handle data conversion safely by removing invalid records first

-- 1. Clean up invalid data in offerings table
DELETE FROM public.offerings 
WHERE numbernonaccreditedinvestors IS NOT NULL 
  AND numbernonaccreditedinvestors !~ '^[0-9]+$'
  AND numbernonaccreditedinvestors != '';

DELETE FROM public.offerings 
WHERE totalnumberalreadyinvested IS NOT NULL 
  AND totalnumberalreadyinvested !~ '^[0-9]+$'
  AND totalnumberalreadyinvested != '';

-- 2. Convert offerings text fields to integers
ALTER TABLE public.offerings 
ALTER COLUMN numbernonaccreditedinvestors TYPE INTEGER 
USING CASE 
  WHEN numbernonaccreditedinvestors = '' OR numbernonaccreditedinvestors IS NULL THEN NULL
  ELSE numbernonaccreditedinvestors::INTEGER 
END;

ALTER TABLE public.offerings 
ALTER COLUMN totalnumberalreadyinvested TYPE INTEGER 
USING CASE 
  WHEN totalnumberalreadyinvested = '' OR totalnumberalreadyinvested IS NULL THEN NULL
  ELSE totalnumberalreadyinvested::INTEGER 
END;

-- 3. Clean up invalid SIC codes (should be 4-digit numbers)
DELETE FROM public.formd_submission 
WHERE sic_code IS NOT NULL 
  AND sic_code !~ '^[0-9]{4}$'
  AND sic_code != '';

-- 4. Convert SIC code to integer
ALTER TABLE public.formd_submission 
ALTER COLUMN sic_code TYPE INTEGER 
USING CASE 
  WHEN sic_code = '' OR sic_code IS NULL THEN NULL
  ELSE sic_code::INTEGER 
END;

-- 5. Clean up invalid CIK numbers (should be numeric)
DELETE FROM public.issuers 
WHERE cik IS NOT NULL 
  AND cik !~ '^[0-9]+$'
  AND cik != '';

-- 6. Convert CIK to bigint
ALTER TABLE public.issuers 
ALTER COLUMN cik TYPE BIGINT 
USING CASE 
  WHEN cik = '' OR cik IS NULL THEN NULL
  ELSE cik::BIGINT 
END;

-- 7. Clean up invalid CRD numbers in recipients table
DELETE FROM public.recipients 
WHERE recipientcrdnumber IS NOT NULL 
  AND recipientcrdnumber !~ '^[0-9]+$'
  AND recipientcrdnumber != '';

DELETE FROM public.recipients 
WHERE associatedbdcrdnumber IS NOT NULL 
  AND associatedbdcrdnumber !~ '^[0-9]+$'
  AND associatedbdcrdnumber != '';

-- 8. Convert CRD numbers to integers
ALTER TABLE public.recipients 
ALTER COLUMN recipientcrdnumber TYPE INTEGER 
USING CASE 
  WHEN recipientcrdnumber = '' OR recipientcrdnumber IS NULL THEN NULL
  ELSE recipientcrdnumber::INTEGER 
END;

ALTER TABLE public.recipients 
ALTER COLUMN associatedbdcrdnumber TYPE INTEGER 
USING CASE 
  WHEN associatedbdcrdnumber = '' OR associatedbdcrdnumber IS NULL THEN NULL
  ELSE associatedbdcrdnumber::INTEGER 
END;