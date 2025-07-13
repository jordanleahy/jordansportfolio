-- Clean up invalid data in offerings table where totalofferingamount contains text instead of numbers
-- This will remove rows where totalofferingamount is the header text or other invalid values

-- First, let's see what invalid data we have
-- DELETE rows where totalofferingamount contains text that should be headers
DELETE FROM public.offerings 
WHERE totalofferingamount::text = 'totalofferingamount' 
   OR totalofferingamount::text = 'Total Offering Amount'
   OR totalofferingamount::text ~ '^[A-Za-z]';

-- Clean up any other numeric columns that might have similar issues
DELETE FROM public.offerings 
WHERE totalamountsold::text ~ '^[A-Za-z]'
   OR totalremaining::text ~ '^[A-Za-z]'
   OR minimuminvestmentaccepted::text ~ '^[A-Za-z]'
   OR salescomm_dollaramount::text ~ '^[A-Za-z]'
   OR findersfee_dollaramount::text ~ '^[A-Za-z]'
   OR grossproceedsused_dollaramount::text ~ '^[A-Za-z]';

-- Also clean up related tables that might have header rows
DELETE FROM public.formd_submission 
WHERE accessionnumber = 'accessionnumber' 
   OR accessionnumber ~ '^[A-Za-z\s]+$';

DELETE FROM public.issuers 
WHERE accessionnumber = 'accessionnumber' 
   OR entityname = 'entityname'
   OR entityname = 'Entity Name';

DELETE FROM public.recipients 
WHERE accessionnumber = 'accessionnumber' 
   OR recipientname = 'recipientname';