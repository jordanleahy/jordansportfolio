-- Clean up remaining invalid data in numeric columns
-- Remove records with 'Indefinite' and other text values in numeric columns

DELETE FROM public.offerings 
WHERE totalofferingamount::text = 'Indefinite' 
   OR totalamountsold::text = 'Indefinite'
   OR totalremaining::text = 'Indefinite'
   OR minimuminvestmentaccepted::text = 'Indefinite'
   OR salescomm_dollaramount::text = 'Indefinite'
   OR findersfee_dollaramount::text = 'Indefinite'
   OR grossproceedsused_dollaramount::text = 'Indefinite';

-- Also clean up any other text that might be in numeric fields
DELETE FROM public.offerings 
WHERE totalofferingamount::text = 'Total Offering Amount'
   OR totalamountsold::text = 'Total Amount Sold'
   OR totalremaining::text = 'Total Remaining'
   OR totalofferingamount::text = ''
   OR totalamountsold::text = ''
   OR totalremaining::text = '';

-- Remove any records where the numeric fields contain only letters (no numbers)
DELETE FROM public.offerings 
WHERE totalofferingamount::text ~ '^[A-Za-z\s]+$'
   OR totalamountsold::text ~ '^[A-Za-z\s]+$'
   OR totalremaining::text ~ '^[A-Za-z\s]+$';