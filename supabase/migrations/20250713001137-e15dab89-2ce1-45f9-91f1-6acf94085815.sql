-- Insert sample SEC Form D data for testing

-- Insert submission record first (parent table)
INSERT INTO public.formd_submission (
  accessionnumber, file_num, filing_date, sic_code, schemaversion, 
  submissiontype, testorlive, over100personsflag, over100issuerflag
) VALUES (
  '0001234567-23-000001', 1, '2023-07-15', '8748', '1.0', 
  'D', 'LIVE', true, false
);

-- Insert issuer record
INSERT INTO public.issuers (
  accessionnumber, is_primaryissuer_flag, issuer_seq_key, cik, entityname,
  street1, city, stateorcountry, stateorcountrydescription, zipcode,
  issuerphonenumber, jurisdictionofinc, entitytype, yearofinc_value_entered
) VALUES (
  '0001234567-23-000001', true, 1, '0001234567', 'Sample Innovations LLC',
  '123 Main St', 'San Francisco', 'US', 'California', '94105',
  '(415) 555-0100', 'CA', 'LLC', 2018
);

-- Insert offering record
INSERT INTO public.offerings (
  accessionnumber, industrygrouptype, investmentfundtype, is40act, revenuerange,
  federalexemptions_items_list, isamendment, sale_date, yettooccur, morethanoneyear,
  isequitytype, isdebttype, isoptiontoacquiretype, issecuritytobeacquiredtype,
  ispooledinvestmentfundtype, istenantincommontype, ismineralpropertytype, isothertype,
  isbusinesscombinationtrans, minimuminvestmentaccepted, over100recipientflag,
  totalofferingamount, totalamountsold, totalremaining, salescomm_dollaramount,
  salescomm_isestimate, findersfee_dollaramount, findersfee_isestimate,
  finderfeeclarificationofresp, grossproceedsused_dollaramount, grossproceedsused_isestimate,
  authorizedrepresentative
) VALUES (
  '0001234567-23-000001', 'Technology', 'Series A', false, '$1M-$5M',
  'Reg D', false, '2023-07-01', false, false,
  true, false, false, false,
  false, false, false, false,
  false, 10000, false,
  25000000, 15000000, 10000000, 500000,
  false, 250000, true,
  'Estimate pending', 20000000, false,
  'John Doe'
);

-- Insert signature record
INSERT INTO public.signatures (
  accessionnumber, signature_seq_key, issuername, signaturename,
  nameofsigner, signaturetitle, signaturedate
) VALUES (
  '0001234567-23-000001', 1, 'Sample Innovations LLC', 'John Doe',
  'John Doe', 'CEO', '2023-07-15'
);

-- Insert related person record
INSERT INTO public.related_persons (
  accessionnumber, relatedperson_seq_key, firstname, middlename, lastname,
  street1, street2, city, stateorcountry, stateorcountrydescription, zipcode,
  relationship_1, relationship_2
) VALUES (
  '0001234567-23-000001', 1, 'Jane', 'A.', 'Smith',
  '123 Main St', 'Suite 200', 'San Francisco', 'US', 'California', '94105',
  'Director', 'Board Member'
);

-- Insert recipient record
INSERT INTO public.recipients (
  accessionnumber, recipient_seq_key, recipientname, recipientcrdnumber,
  associatedbdname, associatedbdcrdnumber, street1, city, stateorcountry,
  stateorcountrydescription, zipcode, states_or_value_list, descriptions_list,
  foreignsolicitation
) VALUES (
  '0001234567-23-000001', 1, 'VC Fund LLC', '12345',
  'Seed Capital Partners', '54321', '456 Market St', 'San Jose', 'US',
  'California', '95113', 'CA, NY', 'Early-stage venture funding',
  false
);