-- Insert sample data for formd_submission
INSERT INTO formd_submission (
  accessionnumber, file_num, filing_date, sic_code, schemaversion, 
  submissiontype, testorlive, over100personsflag, over100issuerflag
) VALUES 
('0001234567-23-000001', 1, '2023-07-15', '8748', '1.0', 'D', 'LIVE', true, false),
('0007654321-25-000010', 2, '2025-03-12', '8731', '1.0', 'D', 'LIVE', false, true);

-- Insert sample data for issuers
INSERT INTO issuers (
  accessionnumber, is_primaryissuer_flag, issuer_seq_key, cik, entityname,
  street1, city, stateorcountry, zipcode, issuerphonenumber,
  jurisdictionofinc, entitytype, yearofinc_value_entered
) VALUES 
('0001234567-23-000001', true, 1, '0001234567', 'Sample Innovations LLC', 
 '123 Main St', 'San Francisco', 'US', '94105', '(415) 555-0100', 
 'CA', 'LLC', 2018),
('0007654321-25-000010', true, 1, '0007654321', 'Green Tech Corp',
 '789 Green Way', 'Austin', 'US', '73301', '(512) 555-0123',
 'TX', 'C Corp', 2021);

-- Insert sample data for offerings
INSERT INTO offerings (
  accessionnumber, industrygrouptype, investmentfundtype, is40act, revenuerange,
  sale_date, isequitytype, minimuminvestmentaccepted, totalofferingamount,
  salescomm_dollaramount, authorizedrepresentative
) VALUES 
('0001234567-23-000001', 'Technology', 'Series A', false, '$1M-$5M',
 '2023-07-01', true, 10000, 25000000, 500000, 'John Doe'),
('0007654321-25-000010', 'Clean Energy', 'Seed', false, '<$500k',
 '2025-03-10', true, 500, 1000000, 30000, 'Alice Green');

-- Insert sample data for signatures
INSERT INTO signatures (
  accessionnumber, signature_seq_key, issuername, nameofsigner,
  signaturetitle, signaturedate
) VALUES 
('0001234567-23-000001', 1, 'Sample Innovations LLC', 'John Doe', 'CEO', '2023-07-15'),
('0007654321-25-000010', 1, 'Green Tech Corp', 'Alice Green', 'Founder & CEO', '2025-03-12');

-- Insert sample data for related_persons
INSERT INTO related_persons (
  accessionnumber, relatedperson_seq_key, firstname, lastname, city, relationship_1
) VALUES 
('0001234567-23-000001', 1, 'Jane', 'Smith', 'San Francisco', 'Director'),
('0007654321-25-000010', 1, 'Robert', 'Smith', 'Austin', 'Investor');

-- Insert sample data for recipients
INSERT INTO recipients (
  accessionnumber, recipient_seq_key, recipientname, zipcode, foreignsolicitation
) VALUES 
('0001234567-23-000001', 1, 'VC Fund LLC', '95113', false),
('0007654321-25-000010', 1, 'Solar Partners LP', '75201', false);