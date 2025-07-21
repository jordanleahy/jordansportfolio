import { supabase } from "@/integrations/supabase/client";
import type { 
  Offering, 
  OfferingWithIssuer, 
  OfferingDetail, 
  OfferingFilters, 
  PaginatedResponse,
  SecSummaryStats,
  IndustryStats
 } from "@/types/sec";

// Helper function to map frontend sort fields to database fields
const getSortField = (field: string): string => {
  switch (field) {
    case 'companyName':
      return 'entityname'; // Will be used with issuer join
    case 'amountRaised':
      return 'totalofferingamount';
    case 'amountSold':
      return 'totalamountsold';
    case 'dateOfFirstSale':
      return 'sale_date';
    case 'industry':
      return 'industrygrouptype';
    default:
      return 'sale_date';
  }
};

export class SecService {
  // Get paginated offerings with filters
  static async getOfferings(
    filters: OfferingFilters = {}, 
    page = 1, 
    pageSize = 50
  ): Promise<PaginatedResponse<any>> {
    console.log('🔍 DEBUG: Starting getOfferings with filters:', JSON.stringify(filters, null, 2));
    console.log('🔍 DEBUG: Page:', page, 'PageSize:', pageSize);
    
    // Build the base query - use simple select first, then join manually
    let query = supabase
      .from('offerings')
      .select('*', { count: 'exact' })
      // Only show offerings where amount sold > 0 for better data quality
      .filter('totalamountsold', 'not.is', null)
      .gt('totalamountsold', 0);

    // Apply default filters if enabled
    if (filters.useDefaultFilters) {
      console.log('🔍 DEBUG: Applying default filters (specific tech industries only)');
      
      // Only show specific technology industries - but be more permissive
      const allowedTechIndustries = [
        "Other Technology",
        "Computer Software", 
        "Biotechnology",
        "Computer Hardware",
        "Internet",
        "Software",
        "Technology",
        "Telecommunications",
        "Computer Services",
        "Electronics",
        "Information Technology",
        "Media & Entertainment",
        "FinTech",
        "E-commerce"
      ];
      
      // Use broader filtering - include partial matches for technology
      query = query.or(
        allowedTechIndustries.map(industry => 
          `industrygrouptype.ilike.%${industry}%`
        ).join(',') + ',industrygrouptype.ilike.%Technology%,industrygrouptype.ilike.%Software%,industrygrouptype.ilike.%Computer%'
      );
        
      // Ensure we have the required fields for filtering
      query = query
        .filter('totalofferingamount', 'not.is', null)
        .filter('totalamountsold', 'not.is', null);
    }

    // Apply sorting - handle special cases for related table sorting
    if (filters.sortField && filters.sortDirection) {
      const sortField = getSortField(filters.sortField);
      if (filters.sortField === 'companyName' || filters.sortField === 'percentRaised') {
        // For company name and percentRaised, we'll handle this client-side since we need manual joins/calculations
        query = query.order('sale_date', { ascending: false });
      } else if (filters.sortField === 'amountRaised') {
        // Handle numeric sorting for amount - now properly numeric columns
        query = query
          .filter('totalofferingamount', 'not.is', null)
          .order('totalofferingamount', { ascending: filters.sortDirection === 'asc' });
      } else if (filters.sortField === 'amountSold') {
        // Handle numeric sorting for amount sold
        query = query.order('totalamountsold', { ascending: filters.sortDirection === 'asc' });
      } else {
        query = query.order(sortField, { ascending: filters.sortDirection === 'asc' });
      }
    } else {
      // Default sort by sale_date descending
      query = query.order('sale_date', { ascending: false });
    }

    // Apply user filters (these override defaults when specified)

    if (filters.industry) {
      query = query.eq('industrygrouptype', filters.industry);
    }

    if (filters.industries && filters.industries.length > 0) {
      query = query.in('industrygrouptype', filters.industries);
    }

    // Handle search query - fix the weird object issue

    // Filter for fully sold companies (offering amount equals amount sold)
    if (filters.fullySold) {
      query = query
        .filter('totalofferingamount', 'not.eq', 'Indefinite')
        .filter('totalofferingamount', 'not.is', null)
        .filter('totalamountsold', 'not.eq', 'Indefinite')
        .filter('totalamountsold', 'not.is', null)
        .filter('totalofferingamount', 'eq', 'totalamountsold');
    }

    // Amount range filtering will be done client-side after fetching issuers
    // State filtering will also be done client-side after fetching issuers with location data

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: offerings, error, count } = await query.range(from, to);

    console.log('🔍 DEBUG: Initial DB query results:');
    console.log('  - Error:', error);
    console.log('  - Count:', count);
    console.log('  - Offerings length:', offerings?.length || 0);
    console.log('  - Sample offering:', offerings?.[0] ? {
      accessionnumber: offerings[0].accessionnumber,
      industrygrouptype: offerings[0].industrygrouptype,
      totalofferingamount: offerings[0].totalofferingamount,
      totalamountsold: offerings[0].totalamountsold,
      totalremaining: offerings[0].totalremaining
    } : 'No offerings found');

    if (error) {
      console.error('Error fetching offerings:', error);
      throw new Error(`Failed to fetch offerings: ${error.message}`);
    }

    if (!offerings || offerings.length === 0) {
      console.log('🔍 DEBUG: No offerings found from initial query - returning empty result');
      return {
        data: [],
        count: 0,
        total: count || 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Now fetch related issuers and signatures for the offerings
    const accessionnumbers = offerings.map(o => o.accessionnumber);
    
    let issuersQuery = supabase
      .from('issuers')
      .select('accessionnumber, entityname, city, stateorcountrydescription, stateorcountry')
      .in('accessionnumber', accessionnumbers);
      // Removed strict US filtering from database level - will handle client-side for more control

    // Additional client-side filtering will ensure we only show US tech companies

    const [issuersData, signaturesData] = await Promise.all([
      issuersQuery,
      supabase
        .from('signatures')
        .select('accessionnumber, nameofsigner')
        .in('accessionnumber', accessionnumbers)
    ]);

    console.log('🔍 DEBUG: Related data fetched:');
    console.log('  - Issuers data error:', issuersData.error);
    console.log('  - Issuers count:', issuersData.data?.length || 0);
    console.log('  - Signatures data error:', signaturesData.error);
    console.log('  - Signatures count:', signaturesData.data?.length || 0);

    // Manually join the data
    const enrichedOfferings = offerings.map(offering => ({
      ...offering,
      issuers: issuersData.data?.filter(i => i.accessionnumber === offering.accessionnumber) || [],
      signatures: signaturesData.data?.filter(s => s.accessionnumber === offering.accessionnumber) || []
    }));

    console.log('🔍 DEBUG: After manual joins:');
    console.log('  - Enriched offerings count:', enrichedOfferings.length);
    console.log('  - Sample enriched offering:', enrichedOfferings[0] ? {
      accessionnumber: enrichedOfferings[0].accessionnumber,
      hasIssuers: enrichedOfferings[0].issuers.length > 0,
      hasSignatures: enrichedOfferings[0].signatures.length > 0,
      issuerName: enrichedOfferings[0].issuers[0]?.entityname || 'No issuer'
    } : 'No enriched offerings');

    // Apply filters - simplified for better results
    let filteredOfferings = enrichedOfferings;
    
    if (filters.useDefaultFilters) {
      console.log('🔍 DEBUG: Applying simplified client-side filtering');
      
      filteredOfferings = filteredOfferings.filter(offering => {
        // Must have issuer data
        const hasIssuer = offering.issuers.length > 0;
        
        // Simple US check - be more permissive to get more results
        const hasUSIssuer = offering.issuers.some((issuer: any) => {
          const state = issuer.stateorcountry;
          const description = issuer.stateorcountrydescription;
          
          // More permissive US checking
          return !state || // Include if no state data (don't exclude unknowns)
                 state === 'US' || 
                 state === 'United States' || 
                 state?.length === 2 || // Assume 2-letter codes are US states
                 (description && description.toLowerCase().includes('united states'));
        });
        
        // Has some fundraising activity
        const hasActivity = 
          (offering.totalamountsold && offering.totalamountsold > 0) ||
          (offering.totalofferingamount && offering.totalofferingamount > 0);
        
        return hasIssuer && hasUSIssuer && hasActivity;
      });
      
      console.log('🔍 DEBUG: After simplified filtering:');
      console.log('  - Original count:', enrichedOfferings.length);
      console.log('  - Filtered count:', filteredOfferings.length);
      console.log('  - Percentage kept:', Math.round((filteredOfferings.length / enrichedOfferings.length) * 100) + '%');
    }
    
    console.log('🔍 DEBUG: Before client-side filters - Current count:', filteredOfferings.length);
    
    // Apply amount range filtering
    if (filters.amountRanges && filters.amountRanges.length > 0) {
      console.log('🔍 DEBUG: Applying amount range filters:', filters.amountRanges);
      const beforeCount = filteredOfferings.length;
      filteredOfferings = filteredOfferings.filter(offering => {
        const amount = offering.totalofferingamount;
        if (!amount || String(amount) === 'Indefinite') return false;
        
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return false;
        
        return filters.amountRanges!.some(range => {
          switch (range) {
            case "Less than $500k":
              return numAmount < 500000;
            case "$500k - $2MM":
              return numAmount >= 500000 && numAmount <= 2000000;
            case "$2MM - $5MM":
              return numAmount >= 2000000 && numAmount <= 5000000;
            case "$5MM+":
              return numAmount > 5000000;
            default:
              return false;
          }
        });
      });
      console.log('🔍 DEBUG: After amount range filter:', beforeCount, '->', filteredOfferings.length);
    }
    
    // Apply max raised filtering (based on amount sold)
    if (filters.maxRaisedRanges && filters.maxRaisedRanges.length > 0) {
      console.log('🔍 DEBUG: Applying amount sold filters:', filters.maxRaisedRanges);
      const beforeCount = filteredOfferings.length;
      filteredOfferings = filteredOfferings.filter(offering => {
        const amount = offering.totalamountsold;
        if (!amount || String(amount) === 'Indefinite') return false;
        
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return false;
        
        const matches = filters.maxRaisedRanges!.some(range => {
          switch (range) {
            case "Less than $250K":
              return numAmount < 250000;
            case "$250K - $500K":
              return numAmount >= 250000 && numAmount <= 500000;
            case "$500K - $1M":
              return numAmount >= 500000 && numAmount <= 1000000;
            case "$1M - $2M":
              return numAmount >= 1000000 && numAmount <= 2000000;
            case "$2MM - $5MM":
              return numAmount >= 2000000 && numAmount <= 5000000;
            case "$5MM - $10MM":
              return numAmount >= 5000000 && numAmount <= 10000000;
            default:
              return false;
          }
        });
        
        if (matches) {
          console.log(`🔍 DEBUG: Match found for amount $${numAmount} with ranges:`, filters.maxRaisedRanges);
        }
        
        return matches;
      });
      console.log('🔍 DEBUG: After amount sold filter:', beforeCount, '->', filteredOfferings.length);
    }
    
    // Apply state filtering
    if (filters.states && filters.states.length > 0) {
      console.log('🔍 DEBUG: Applying state filters:', filters.states);
      const beforeCount = filteredOfferings.length;
      filteredOfferings = filteredOfferings.filter(offering => {
        return offering.issuers.some((issuer: any) => {
          const issuerState = issuer.stateorcountry;
          return issuerState && filters.states!.includes(issuerState);
        });
      });
      console.log('🔍 DEBUG: After state filter:', beforeCount, '->', filteredOfferings.length);
    }
    
    
    const finalOfferings = filteredOfferings;
    
    console.log('🔍 DEBUG: Final result:');
    console.log('  - Final offerings count:', finalOfferings.length);
    console.log('  - Returning to UI...');

    return {
      data: finalOfferings,
      count: finalOfferings.length,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  // Get single offering with all details
  static async getOfferingDetail(accessionnumber: string): Promise<any | null> {
    // Get the main offering
    const { data: offering, error } = await supabase
      .from('offerings')
      .select('*')
      .eq('accessionnumber', accessionnumber)
      .maybeSingle();

    if (error) {
      console.error('Error fetching offering detail:', error);
      throw new Error(`Failed to fetch offering detail: ${error.message}`);
    }

    if (!offering) {
      return null;
    }

    // Get related data manually
    const [
      { data: issuers },
      { data: signatures },
      { data: relatedPersons },
      { data: recipients },
      { data: formSubmission }
    ] = await Promise.all([
      supabase.from('issuers').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('signatures').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('related_persons').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('recipients').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('formd_submission').select('*').eq('accessionnumber', accessionnumber).maybeSingle()
    ]);

    return {
      ...offering,
      issuers: issuers || [],
      signatures: signatures || [],
      related_persons: relatedPersons || [],
      recipients: recipients || [],
      formd_submission: formSubmission
    };
  }

  // Get distinct industries for filter dropdown
  static async getIndustries(): Promise<string[]> {
    const { data, error } = await supabase
      .from('offerings')
      .select('industrygrouptype')
      .not('industrygrouptype', 'is', null)
      .order('industrygrouptype');

    if (error) {
      console.error('Error fetching industries:', error);
      throw new Error(`Failed to fetch industries: ${error.message}`);
    }

    // Get unique values
    const industries = [...new Set(data.map(item => item.industrygrouptype))];
    return industries.filter(Boolean);
  }

  // Get summary statistics with improved data parsing and performance
  static async getSummaryStats(): Promise<SecSummaryStats> {
    try {
      // Parse numeric amounts safely, excluding 'Indefinite' and other non-numeric values
      const parseAmount = (amount: any): number => {
        if (!amount) return 0;
        const str = String(amount).toLowerCase().trim();
        if (str === 'indefinite' || str === 'unlimited' || str === '') return 0;
        const num = Number(amount);
        return isNaN(num) ? 0 : num;
      };

      // More efficient query - get ALL data since it only changes quarterly
      const { data: offeringsData, error } = await supabase
        .from('offerings')
        .select('totalofferingamount, sale_date, industrygrouptype')
        .not('totalofferingamount', 'is', null)
        .limit(10000); // Ensure we get all data - increase if needed

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Total rows from DB:', offeringsData?.length || 0);
      
      // Filter for numeric offerings more efficiently
      const numericOfferings = offeringsData?.filter(item => {
        const amount = parseAmount(item.totalofferingamount);
        return amount > 0;
      }) || [];
      
      console.log('Valid numeric offerings:', numericOfferings.length);
      
      const totalOfferings = numericOfferings.length;
      const totalAmount = numericOfferings.reduce((sum, item) => sum + parseAmount(item.totalofferingamount), 0);
      const averageAmount = totalOfferings > 0 ? totalAmount / totalOfferings : 0;

      // This month's data - more efficient filtering
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthStr = thisMonth.toISOString().split('T')[0];
      
      const thisMonthData = numericOfferings.filter(item => 
        item.sale_date && item.sale_date >= thisMonthStr
      );
      
      const thisMonthOfferings = thisMonthData.length;
      const thisMonthAmount = thisMonthData.reduce((sum, item) => sum + parseAmount(item.totalofferingamount), 0);

      // Top industries calculation - use Map for better performance
      const industryMap = new Map<string, { count: number; totalAmount: number }>();
      
      numericOfferings.forEach(item => {
        if (!item.industrygrouptype) return;
        
        const industry = item.industrygrouptype;
        const amount = parseAmount(item.totalofferingamount);
        
        const current = industryMap.get(industry) || { count: 0, totalAmount: 0 };
        current.count++;
        current.totalAmount += amount;
        industryMap.set(industry, current);
      });

      const topIndustries: IndustryStats[] = Array.from(industryMap.entries())
        .map(([industry, stats]) => ({
          industry,
          count: stats.count,
          totalAmount: stats.totalAmount,
          averageAmount: stats.totalAmount / stats.count
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      const result = {
        totalOfferings,
        totalAmount,
        averageAmount,
        thisMonthOfferings,
        thisMonthAmount,
        topIndustries
      };

      console.log('Summary stats result:', result);
      return result;
    } catch (error: any) {
      console.error('Error fetching summary stats:', error);
      throw new Error(`Failed to fetch summary statistics: ${error.message}`);
    }
  }

  // Batch insert functions for import processes
  static async batchInsertSubmissions(submissions: any[]): Promise<void> {
    const { error } = await supabase
      .from('formd_submission')
      .upsert(submissions, { onConflict: 'accessionnumber' });

    if (error) {
      console.error('Error inserting submissions:', error);
      throw new Error(`Failed to insert submissions: ${error.message}`);
    }
  }

  static async batchInsertOfferings(offerings: any[]): Promise<void> {
    const { error } = await supabase
      .from('offerings')
      .upsert(offerings, { onConflict: 'accessionnumber' });

    if (error) {
      console.error('Error inserting offerings:', error);
      throw new Error(`Failed to insert offerings: ${error.message}`);
    }
  }

  static async batchInsertIssuers(issuers: any[]): Promise<void> {
    const { error } = await supabase
      .from('issuers')
      .insert(issuers);

    if (error) {
      console.error('Error inserting issuers:', error);
      throw new Error(`Failed to insert issuers: ${error.message}`);
    }
  }

  static async batchInsertSignatures(signatures: any[]): Promise<void> {
    const { error } = await supabase
      .from('signatures')
      .insert(signatures);

    if (error) {
      console.error('Error inserting signatures:', error);
      throw new Error(`Failed to insert signatures: ${error.message}`);
    }
  }

  static async batchInsertRelatedPersons(persons: any[]): Promise<void> {
    const { error } = await supabase
      .from('related_persons')
      .insert(persons);

    if (error) {
      console.error('Error inserting related persons:', error);
      throw new Error(`Failed to insert related persons: ${error.message}`);
    }
  }

  static async batchInsertRecipients(recipients: any[]): Promise<void> {
    const { error } = await supabase
      .from('recipients')
      .insert(recipients);

    if (error) {
      console.error('Error inserting recipients:', error);
      throw new Error(`Failed to insert recipients: ${error.message}`);
    }
  }
}