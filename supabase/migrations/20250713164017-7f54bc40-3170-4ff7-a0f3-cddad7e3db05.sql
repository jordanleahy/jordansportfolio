-- Convert amount columns from text to numeric for proper sorting and calculations
-- First, handle any non-numeric values by setting them to NULL

-- Update offerings table amount columns
UPDATE offerings 
SET totalofferingamount = NULL 
WHERE totalofferingamount IN ('Indefinite', 'Unlimited', '') 
   OR totalofferingamount !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET totalamountsold = NULL 
WHERE totalamountsold IN ('Indefinite', 'Unlimited', '') 
   OR totalamountsold !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET totalremaining = NULL 
WHERE totalremaining IN ('Indefinite', 'Unlimited', '') 
   OR totalremaining !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET grossproceedsused_dollaramount = NULL 
WHERE grossproceedsused_dollaramount IN ('Indefinite', 'Unlimited', '') 
   OR grossproceedsused_dollaramount !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET salescomm_dollaramount = NULL 
WHERE salescomm_dollaramount IN ('Indefinite', 'Unlimited', '') 
   OR salescomm_dollaramount !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET findersfee_dollaramount = NULL 
WHERE findersfee_dollaramount IN ('Indefinite', 'Unlimited', '') 
   OR findersfee_dollaramount !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE offerings 
SET minimuminvestmentaccepted = NULL 
WHERE minimuminvestmentaccepted IN ('Indefinite', 'Unlimited', '') 
   OR minimuminvestmentaccepted !~ '^[0-9]+(\.[0-9]+)?$';

-- Now convert the columns to numeric type
ALTER TABLE offerings 
ALTER COLUMN totalofferingamount TYPE NUMERIC USING totalofferingamount::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN totalamountsold TYPE NUMERIC USING totalamountsold::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN totalremaining TYPE NUMERIC USING totalremaining::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN grossproceedsused_dollaramount TYPE NUMERIC USING grossproceedsused_dollaramount::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN salescomm_dollaramount TYPE NUMERIC USING salescomm_dollaramount::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN findersfee_dollaramount TYPE NUMERIC USING findersfee_dollaramount::NUMERIC;

ALTER TABLE offerings 
ALTER COLUMN minimuminvestmentaccepted TYPE NUMERIC USING minimuminvestmentaccepted::NUMERIC;