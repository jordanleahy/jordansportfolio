// SEC Form D data types matching the database schema

export interface FormDSubmission {
  ACCESSIONNUMBER: string;
  FILE_NUM?: number;
  FILING_DATE?: string;
  SIC_CODE?: string;
  SCHEMAVERSION?: string;
  SUBMISSIONTYPE?: string;
  TESTORLIVE?: string;
  OVER100PERSONSFLAG?: boolean;
  OVER100ISSUERFLAG?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offering {
  ACCESSIONNUMBER: string;
  INDUSTRYGROUPTYPE?: string;
  INVESTMENTFUNDTYPE?: string;
  IS40ACT?: boolean;
  REVENUERANGE?: string;
  AGGREGATENETASSETVALUERANGE?: string;
  FEDERALEXEMPTIONS_ITEMS_LIST?: string;
  ISAMENDMENT?: boolean;
  PREVIOUSACCESSIONNUMBER?: string;
  SALE_DATE?: string;
  YETTOOCCUR?: boolean;
  MORETHANONEYEAR?: boolean;
  ISEQUITYTYPE?: boolean;
  ISDEBTTYPE?: boolean;
  ISOPTIONTOACQUIRETYPE?: boolean;
  ISSECURITYTOBEACQUIREDTYPE?: boolean;
  ISPOOLEDINVESTMENTFUNDTYPE?: boolean;
  ISTENANTINCOMMONTYPE?: boolean;
  ISMINERALPROPERTYTYPE?: boolean;
  ISOTHERTYPE?: boolean;
  DESCRIPTIONOFOTHERTYPE?: string;
  ISBUSINESSCOMBINATIONTRANS?: boolean;
  BUSCOMBCLARIFICATIONOFRESP?: string;
  MINIMUMINVESTMENTACCEPTED?: number;
  OVER100RECIPIENTFLAG?: boolean;
  TOTALOFFERINGAMOUNT?: number;
  TOTALAMOUNTSOLD?: number;
  TOTALREMAINING?: number;
  SALESCOMM_DOLLARAMOUNT?: number;
  SALESCOMM_ISESTIMATE?: boolean;
  FINDERSFEE_DOLLARAMOUNT?: number;
  FINDERSFEE_ISESTIMATE?: boolean;
  FINDERFEECLARIFICATIONOFRESP?: string;
  GROSSPROCEEDSUSED_DOLLARAMOUNT?: number;
  GROSSPROCEEDSUSED_ISESTIMATE?: boolean;
  GROSSPROCEEDSUSED_CLAROFRESP?: string;
  AUTHORIZEDREPRESENTATIVE?: string;
  created_at: string;
  updated_at: string;
}

export interface Issuer {
  id: string;
  ACCESSIONNUMBER: string;
  IS_PRIMARYISSUER_FLAG?: boolean;
  ISSUER_SEQ_KEY?: number;
  CIK?: string;
  ENTITYNAME?: string;
  STREET1?: string;
  STREET2?: string;
  CITY?: string;
  STATEORCOUNTRY?: string;
  STATEORCOUNTRYDESCRIPTION?: string;
  ZIPCODE?: string;
  ISSUERPHONENUMBER?: string;
  JURISDICTIONOFINC?: string;
  ENTITYTYPE?: string;
  ENTITYTYPEOTHERDESC?: string;
  YEAROFINC_VALUE_ENTERED?: number;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  ACCESSIONNUMBER: string;
  SIGNATURE_SEQ_KEY?: number;
  ISSUERNAME?: string;
  SIGNATURENAME?: string;
  NAMEOFSIGNER?: string;
  SIGNATURETITLE?: string;
  SIGNATUREDATE?: string;
  created_at: string;
  updated_at: string;
}

export interface RelatedPerson {
  id: string;
  ACCESSIONNUMBER: string;
  RELATEDPERSON_SEQ_KEY?: number;
  FIRSTNAME?: string;
  MIDDLENAME?: string;
  LASTNAME?: string;
  STREET1?: string;
  STREET2?: string;
  CITY?: string;
  STATEORCOUNTRY?: string;
  STATEORCOUNTRYDESCRIPTION?: string;
  ZIPCODE?: string;
  RELATIONSHIP_1?: string;
  RELATIONSHIP_2?: string;
  RELATIONSHIP_3?: string;
  RELATIONSHIPCLARIFICATION?: string;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  ACCESSIONNUMBER: string;
  RECIPIENT_SEQ_KEY?: number;
  RECIPIENTNAME?: string;
  RECIPIENTCRDNUMBER?: string;
  ASSOCIATEDBDNAME?: string;
  ASSOCIATEDBDCRDNUMBER?: string;
  STREET1?: string;
  STREET2?: string;
  CITY?: string;
  STATEORCOUNTRY?: string;
  STATEORCOUNTRYDESCRIPTION?: string;
  ZIPCODE?: string;
  STATES_OR_VALUE_LIST?: string;
  DESCRIPTIONS_LIST?: string;
  FOREIGNSOLICITATION?: boolean;
  created_at: string;
  updated_at: string;
}

// Combined types for API responses
export interface OfferingWithIssuer extends Offering {
  issuers: Issuer[];
  formd_submission: FormDSubmission;
}

export interface OfferingDetail extends OfferingWithIssuer {
  signatures: Signature[];
  related_persons: RelatedPerson[];
  recipients: Recipient[];
}

// Filter and search types
export interface OfferingFilters {
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  industry?: string;
  industries?: string[];
  searchQuery?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  fullySold?: boolean; // Filter for companies where offering amount equals amount sold
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Industry statistics
export interface IndustryStats {
  industry: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

// Summary statistics
export interface SecSummaryStats {
  totalOfferings: number;
  totalAmount: number;
  averageAmount: number;
  thisMonthOfferings: number;
  thisMonthAmount: number;
  topIndustries: IndustryStats[];
}