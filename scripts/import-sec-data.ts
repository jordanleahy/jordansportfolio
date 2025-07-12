#!/usr/bin/env tsx

/**
 * SEC Form D Data Import Script
 * 
 * This Node.js script imports SEC Form D data from TSV files into Supabase.
 * It handles streaming, data normalization, and batch inserts for performance.
 * 
 * Usage:
 *   npm install tsx csv-parse @supabase/supabase-js
 *   npx tsx scripts/import-sec-data.ts [data-directory]
 * 
 * Expected TSV files in data directory:
 *   - SUBMISSION.tsv
 *   - OFFERING.tsv  
 *   - ISSUER.tsv
 *   - SIGNATURE.tsv
 *   - RELATEDPERSON.tsv
 *   - RECIPIENT.tsv
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wgwmzfbnkovumqcvsxgd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 1000;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Data directory from command line argument or default
const dataDir = process.argv[2] || './data';

if (!existsSync(dataDir)) {
  console.error(`Data directory not found: ${dataDir}`);
  process.exit(1);
}

// Utility functions
const parseDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return null;
  }
};

const parseNumber = (numStr: string): number | null => {
  if (!numStr || numStr.trim() === '') return null;
  const num = parseFloat(numStr.replace(/[,$]/g, ''));
  return isNaN(num) ? null : num;
};

const parseBoolean = (boolStr: string): boolean | null => {
  if (!boolStr || boolStr.trim() === '') return null;
  const str = boolStr.toLowerCase().trim();
  if (str === 'true' || str === '1' || str === 'yes') return true;
  if (str === 'false' || str === '0' || str === 'no') return false;
  return null;
};

const parseInt = (intStr: string): number | null => {
  if (!intStr || intStr.trim() === '') return null;
  const num = Number.parseInt(intStr, 10);
  return isNaN(num) ? null : num;
};

// Batch processor class
class BatchProcessor<T> {
  private batch: T[] = [];
  private readonly batchSize: number;
  private readonly processor: (batch: T[]) => Promise<void>;
  private readonly tableName: string;

  constructor(tableName: string, batchSize: number, processor: (batch: T[]) => Promise<void>) {
    this.tableName = tableName;
    this.batchSize = batchSize;
    this.processor = processor;
  }

  async add(item: T): Promise<void> {
    this.batch.push(item);
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    console.log(`Processing ${this.batch.length} ${this.tableName} records...`);
    try {
      await this.processor([...this.batch]);
      console.log(`✓ Successfully processed ${this.batch.length} ${this.tableName} records`);
    } catch (error) {
      console.error(`✗ Error processing ${this.tableName} batch:`, error);
      throw error;
    }
    this.batch = [];
  }
}

// Import functions for each table
async function importSubmissions(filePath: string): Promise<void> {
  console.log('\n📄 Importing Form D submissions...');
  
  const processor = new BatchProcessor(
    'submissions',
    BATCH_SIZE,
    async (batch) => {
      const { error } = await supabase
        .from('formd_submission')
        .upsert(batch, { onConflict: 'ACCESSIONNUMBER' });
      if (error) throw error;
    }
  );

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    
    createReadStream(filePath)
      .pipe(parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }))
      .on('data', async (row: any) => {
        try {
          const submission = {
            ACCESSIONNUMBER: row.ACCESSIONNUMBER,
            FILE_NUM: parseInt(row.FILE_NUM),
            FILING_DATE: parseDate(row.FILING_DATE),
            SIC_CODE: row.SIC_CODE || null,
            SCHEMAVERSION: row.SCHEMAVERSION || null,
            SUBMISSIONTYPE: row.SUBMISSIONTYPE || null,
            TESTORLIVE: row.TESTORLIVE || null,
            OVER100PERSONSFLAG: parseBoolean(row.OVER100PERSONSFLAG),
            OVER100ISSUERFLAG: parseBoolean(row.OVER100ISSUERFLAG),
          };
          
          await processor.add(submission);
          rowCount++;
          
          if (rowCount % 5000 === 0) {
            console.log(`Processed ${rowCount} submission rows...`);
          }
        } catch (error) {
          console.error('Error processing submission row:', error);
        }
      })
      .on('end', async () => {
        try {
          await processor.flush();
          console.log(`✓ Completed importing ${rowCount} submissions`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importOfferings(filePath: string): Promise<void> {
  console.log('\n💰 Importing offerings...');
  
  const processor = new BatchProcessor(
    'offerings',
    BATCH_SIZE,
    async (batch) => {
      const { error } = await supabase
        .from('offerings')
        .upsert(batch, { onConflict: 'ACCESSIONNUMBER' });
      if (error) throw error;
    }
  );

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    
    createReadStream(filePath)
      .pipe(parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }))
      .on('data', async (row: any) => {
        try {
          const offering = {
            ACCESSIONNUMBER: row.ACCESSIONNUMBER,
            INDUSTRYGROUPTYPE: row.INDUSTRYGROUPTYPE || null,
            INVESTMENTFUNDTYPE: row.INVESTMENTFUNDTYPE || null,
            IS40ACT: parseBoolean(row.IS40ACT),
            REVENUERANGE: row.REVENUERANGE || null,
            AGGREGATENETASSETVALUERANGE: row.AGGREGATENETASSETVALUERANGE || null,
            FEDERALEXEMPTIONS_ITEMS_LIST: row.FEDERALEXEMPTIONS_ITEMS_LIST || null,
            ISAMENDMENT: parseBoolean(row.ISAMENDMENT),
            PREVIOUSACCESSIONNUMBER: row.PREVIOUSACCESSIONNUMBER || null,
            SALE_DATE: parseDate(row.SALE_DATE),
            YETTOOCCUR: parseBoolean(row.YETTOOCCUR),
            MORETHANONEYEAR: parseBoolean(row.MORETHANONEYEAR),
            ISEQUITYTYPE: parseBoolean(row.ISEQUITYTYPE),
            ISDEBTTYPE: parseBoolean(row.ISDEBTTYPE),
            ISOPTIONTOACQUIRETYPE: parseBoolean(row.ISOPTIONTOACQUIRETYPE),
            ISSECURITYTOBEACQUIREDTYPE: parseBoolean(row.ISSECURITYTOBEACQUIREDTYPE),
            ISPOOLEDINVESTMENTFUNDTYPE: parseBoolean(row.ISPOOLEDINVESTMENTFUNDTYPE),
            ISTENANTINCOMMONTYPE: parseBoolean(row.ISTENANTINCOMMONTYPE),
            ISMINERALPROPERTYTYPE: parseBoolean(row.ISMINERALPROPERTYTYPE),
            ISOTHERTYPE: parseBoolean(row.ISOTHERTYPE),
            DESCRIPTIONOFOTHERTYPE: row.DESCRIPTIONOFOTHERTYPE || null,
            ISBUSINESSCOMBINATIONTRANS: parseBoolean(row.ISBUSINESSCOMBINATIONTRANS),
            BUSCOMBCLARIFICATIONOFRESP: row.BUSCOMBCLARIFICATIONOFRESP || null,
            MINIMUMINVESTMENTACCEPTED: parseNumber(row.MINIMUMINVESTMENTACCEPTED),
            OVER100RECIPIENTFLAG: parseBoolean(row.OVER100RECIPIENTFLAG),
            TOTALOFFERINGAMOUNT: parseNumber(row.TOTALOFFERINGAMOUNT),
            TOTALAMOUNTSOLD: parseNumber(row.TOTALAMOUNTSOLD),
            TOTALREMAINING: parseNumber(row.TOTALREMAINING),
            SALESCOMM_DOLLARAMOUNT: parseNumber(row.SALESCOMM_DOLLARAMOUNT),
            SALESCOMM_ISESTIMATE: parseBoolean(row.SALESCOMM_ISESTIMATE),
            FINDERSFEE_DOLLARAMOUNT: parseNumber(row.FINDERSFEE_DOLLARAMOUNT),
            FINDERSFEE_ISESTIMATE: parseBoolean(row.FINDERSFEE_ISESTIMATE),
            FINDERFEECLARIFICATIONOFRESP: row.FINDERFEECLARIFICATIONOFRESP || null,
            GROSSPROCEEDSUSED_DOLLARAMOUNT: parseNumber(row.GROSSPROCEEDSUSED_DOLLARAMOUNT),
            GROSSPROCEEDSUSED_ISESTIMATE: parseBoolean(row.GROSSPROCEEDSUSED_ISESTIMATE),
            GROSSPROCEEDSUSED_CLAROFRESP: row.GROSSPROCEEDSUSED_CLAROFRESP || null,
            AUTHORIZEDREPRESENTATIVE: row.AUTHORIZEDREPRESENTATIVE || null,
          };
          
          await processor.add(offering);
          rowCount++;
          
          if (rowCount % 2000 === 0) {
            console.log(`Processed ${rowCount} offering rows...`);
          }
        } catch (error) {
          console.error('Error processing offering row:', error);
        }
      })
      .on('end', async () => {
        try {
          await processor.flush();
          console.log(`✓ Completed importing ${rowCount} offerings`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importIssuers(filePath: string): Promise<void> {
  console.log('\n🏢 Importing issuers...');
  
  const processor = new BatchProcessor(
    'issuers',
    BATCH_SIZE,
    async (batch) => {
      const { error } = await supabase.from('issuers').insert(batch);
      if (error) throw error;
    }
  );

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    
    createReadStream(filePath)
      .pipe(parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }))
      .on('data', async (row: any) => {
        try {
          const issuer = {
            ACCESSIONNUMBER: row.ACCESSIONNUMBER,
            IS_PRIMARYISSUER_FLAG: parseBoolean(row.IS_PRIMARYISSUER_FLAG),
            ISSUER_SEQ_KEY: parseInt(row.ISSUER_SEQ_KEY),
            CIK: row.CIK || null,
            ENTITYNAME: row.ENTITYNAME || null,
            STREET1: row.STREET1 || null,
            STREET2: row.STREET2 || null,
            CITY: row.CITY || null,
            STATEORCOUNTRY: row.STATEORCOUNTRY || null,
            STATEORCOUNTRYDESCRIPTION: row.STATEORCOUNTRYDESCRIPTION || null,
            ZIPCODE: row.ZIPCODE || null,
            ISSUERPHONENUMBER: row.ISSUERPHONENUMBER || null,
            JURISDICTIONOFINC: row.JURISDICTIONOFINC || null,
            ENTITYTYPE: row.ENTITYTYPE || null,
            ENTITYTYPEOTHERDESC: row.ENTITYTYPEOTHERDESC || null,
            YEAROFINC_VALUE_ENTERED: parseInt(row.YEAROFINC_VALUE_ENTERED),
          };
          
          await processor.add(issuer);
          rowCount++;
          
          if (rowCount % 5000 === 0) {
            console.log(`Processed ${rowCount} issuer rows...`);
          }
        } catch (error) {
          console.error('Error processing issuer row:', error);
        }
      })
      .on('end', async () => {
        try {
          await processor.flush();
          console.log(`✓ Completed importing ${rowCount} issuers`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Helper function to import other tables (signatures, related persons, recipients)
async function importTable(
  tableName: string, 
  filePath: string, 
  transformer: (row: any) => any
): Promise<void> {
  console.log(`\n📝 Importing ${tableName}...`);
  
  const processor = new BatchProcessor(
    tableName,
    BATCH_SIZE,
    async (batch) => {
      const { error } = await supabase.from(tableName).insert(batch);
      if (error) throw error;
    }
  );

  return new Promise((resolve, reject) => {
    let rowCount = 0;
    
    createReadStream(filePath)
      .pipe(parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
      }))
      .on('data', async (row: any) => {
        try {
          const transformedRow = transformer(row);
          await processor.add(transformedRow);
          rowCount++;
          
          if (rowCount % 5000 === 0) {
            console.log(`Processed ${rowCount} ${tableName} rows...`);
          }
        } catch (error) {
          console.error(`Error processing ${tableName} row:`, error);
        }
      })
      .on('end', async () => {
        try {
          await processor.flush();
          console.log(`✓ Completed importing ${rowCount} ${tableName}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Main import function
async function main(): Promise<void> {
  console.log('🚀 Starting SEC Form D data import...');
  console.log(`Data directory: ${dataDir}`);
  
  const startTime = Date.now();

  try {
    // Import in dependency order (submissions first, then everything else)
    
    // 1. Form D Submissions (required by all other tables)
    const submissionFile = join(dataDir, 'SUBMISSION.tsv');
    if (existsSync(submissionFile)) {
      await importSubmissions(submissionFile);
    } else {
      console.warn('⚠️  SUBMISSION.tsv not found, skipping...');
    }

    // 2. Offerings (references submissions)
    const offeringFile = join(dataDir, 'OFFERING.tsv');
    if (existsSync(offeringFile)) {
      await importOfferings(offeringFile);
    } else {
      console.warn('⚠️  OFFERING.tsv not found, skipping...');
    }

    // 3. Issuers
    const issuerFile = join(dataDir, 'ISSUER.tsv');
    if (existsSync(issuerFile)) {
      await importIssuers(issuerFile);
    } else {
      console.warn('⚠️  ISSUER.tsv not found, skipping...');
    }

    // 4. Signatures
    const signatureFile = join(dataDir, 'SIGNATURE.tsv');
    if (existsSync(signatureFile)) {
      await importTable('signatures', signatureFile, (row) => ({
        ACCESSIONNUMBER: row.ACCESSIONNUMBER,
        SIGNATURE_SEQ_KEY: parseInt(row.SIGNATURE_SEQ_KEY),
        ISSUERNAME: row.ISSUERNAME || null,
        SIGNATURENAME: row.SIGNATURENAME || null,
        NAMEOFSIGNER: row.NAMEOFSIGNER || null,
        SIGNATURETITLE: row.SIGNATURETITLE || null,
        SIGNATUREDATE: parseDate(row.SIGNATUREDATE),
      }));
    } else {
      console.warn('⚠️  SIGNATURE.tsv not found, skipping...');
    }

    // 5. Related Persons
    const relatedPersonFile = join(dataDir, 'RELATEDPERSON.tsv');
    if (existsSync(relatedPersonFile)) {
      await importTable('related_persons', relatedPersonFile, (row) => ({
        ACCESSIONNUMBER: row.ACCESSIONNUMBER,
        RELATEDPERSON_SEQ_KEY: parseInt(row.RELATEDPERSON_SEQ_KEY),
        FIRSTNAME: row.FIRSTNAME || null,
        MIDDLENAME: row.MIDDLENAME || null,
        LASTNAME: row.LASTNAME || null,
        STREET1: row.STREET1 || null,
        STREET2: row.STREET2 || null,
        CITY: row.CITY || null,
        STATEORCOUNTRY: row.STATEORCOUNTRY || null,
        STATEORCOUNTRYDESCRIPTION: row.STATEORCOUNTRYDESCRIPTION || null,
        ZIPCODE: row.ZIPCODE || null,
        RELATIONSHIP_1: row.RELATIONSHIP_1 || null,
        RELATIONSHIP_2: row.RELATIONSHIP_2 || null,
        RELATIONSHIP_3: row.RELATIONSHIP_3 || null,
        RELATIONSHIPCLARIFICATION: row.RELATIONSHIPCLARIFICATION || null,
      }));
    } else {
      console.warn('⚠️  RELATEDPERSON.tsv not found, skipping...');
    }

    // 6. Recipients
    const recipientFile = join(dataDir, 'RECIPIENT.tsv');
    if (existsSync(recipientFile)) {
      await importTable('recipients', recipientFile, (row) => ({
        ACCESSIONNUMBER: row.ACCESSIONNUMBER,
        RECIPIENT_SEQ_KEY: parseInt(row.RECIPIENT_SEQ_KEY),
        RECIPIENTNAME: row.RECIPIENTNAME || null,
        RECIPIENTCRDNUMBER: row.RECIPIENTCRDNUMBER || null,
        ASSOCIATEDBDNAME: row.ASSOCIATEDBDNAME || null,
        ASSOCIATEDBDCRDNUMBER: row.ASSOCIATEDBDCRDNUMBER || null,
        STREET1: row.STREET1 || null,
        STREET2: row.STREET2 || null,
        CITY: row.CITY || null,
        STATEORCOUNTRY: row.STATEORCOUNTRY || null,
        STATEORCOUNTRYDESCRIPTION: row.STATEORCOUNTRYDESCRIPTION || null,
        ZIPCODE: row.ZIPCODE || null,
        STATES_OR_VALUE_LIST: row.STATES_OR_VALUE_LIST || null,
        DESCRIPTIONS_LIST: row.DESCRIPTIONS_LIST || null,
        FOREIGNSOLICITATION: parseBoolean(row.FOREIGNSOLICITATION),
      }));
    } else {
      console.warn('⚠️  RECIPIENT.tsv not found, skipping...');
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n🎉 Import completed successfully in ${duration} seconds!`);
    console.log('\n📊 Next steps:');
    console.log('1. Run your application and navigate to /sec');
    console.log('2. Use the API endpoints to query the imported data');
    console.log('3. Check the summary statistics on the dashboard');

  } catch (error) {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().catch(console.error);
}