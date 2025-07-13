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
    // Build the base query - use simple select first, then join manually
    let query = supabase
      .from('offerings')
      .select('*', { count: 'exact' });

    // Apply sorting - handle special cases for related table sorting
    if (filters.sortField && filters.sortDirection) {
      const sortField = getSortField(filters.sortField);
      if (filters.sortField === 'companyName') {
        // For company name, we'll handle this client-side since we need manual joins
        query = query.order('sale_date', { ascending: false });
      } else if (filters.sortField === 'amountRaised') {
        // Handle numeric sorting for amount - now properly numeric columns
        query = query
          .filter('totalofferingamount', 'not.is', null)
          .order('totalofferingamount', { ascending: filters.sortDirection === 'asc' });
      } else {
        query = query.order(sortField, { ascending: filters.sortDirection === 'asc' });
      }
    } else {
      // Default sort by sale_date descending
      query = query.order('sale_date', { ascending: false });
    }

    // Apply filters

    if (filters.industry) {
      query = query.eq('industrygrouptype', filters.industry);
    }

    if (filters.industries && filters.industries.length > 0) {
      query = query.in('industrygrouptype', filters.industries);
    }

    if (filters.searchQuery) {
      query = query.or(`industrygrouptype.ilike.%${filters.searchQuery}%,descriptionofothertype.ilike.%${filters.searchQuery}%`);
    }

    // Filter for fully sold companies (offering amount equals amount sold)
    if (filters.fullySold) {
      query = query
        .filter('totalofferingamount', 'not.eq', 'Indefinite')
        .filter('totalofferingamount', 'not.is', null)
        .filter('totalamountsold', 'not.eq', 'Indefinite')
        .filter('totalamountsold', 'not.is', null)
        .filter('totalofferingamount', 'eq', 'totalamountsold');
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: offerings, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching offerings:', error);
      throw new Error(`Failed to fetch offerings: ${error.message}`);
    }

    if (!offerings || offerings.length === 0) {
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
    
    const [issuersData, signaturesData] = await Promise.all([
      supabase
        .from('issuers')
        .select('accessionnumber, entityname, city, stateorcountrydescription')
        .in('accessionnumber', accessionnumbers),
      supabase
        .from('signatures')
        .select('accessionnumber, nameofsigner')
        .in('accessionnumber', accessionnumbers)
    ]);

    // Manually join the data
    const enrichedOfferings = offerings.map(offering => ({
      ...offering,
      issuers: issuersData.data?.filter(i => i.accessionnumber === offering.accessionnumber) || [],
      signatures: signaturesData.data?.filter(s => s.accessionnumber === offering.accessionnumber) || []
    }));

    return {
      data: enrichedOfferings,
      count: enrichedOfferings.length,
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

  // Get summary statistics with improved data parsing
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

      // Direct calculation - no RPC needed since we handle data parsing
      const { data: offeringsData, error } = await supabase
        .from('offerings')
        .select('totalofferingamount, sale_date, industrygrouptype');

      if (error) {
        throw error;
      }

      const validOfferings = offeringsData.filter(item => item.totalofferingamount);
      const numericOfferings = validOfferings.filter(item => parseAmount(item.totalofferingamount) > 0);
      
      const totalOfferings = numericOfferings.length;
      const totalAmount = numericOfferings.reduce((sum, item) => sum + parseAmount(item.totalofferingamount), 0);
      const averageAmount = totalOfferings > 0 ? totalAmount / totalOfferings : 0;

      // This month's data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthStr = thisMonth.toISOString().split('T')[0];
      
      const thisMonthOfferings = validOfferings.filter(item => 
        item.sale_date && item.sale_date >= thisMonthStr
      ).length;
      
      const thisMonthAmount = validOfferings
        .filter(item => item.sale_date && item.sale_date >= thisMonthStr)
        .reduce((sum, item) => sum + parseAmount(item.totalofferingamount), 0);

      // Top industries calculation
      const industryMap = new Map<string, { count: number; totalAmount: number }>();
      
      validOfferings.forEach(item => {
        if (!item.industrygrouptype) return;
        
        const industry = item.industrygrouptype;
        const amount = parseAmount(item.totalofferingamount);
        
        if (!industryMap.has(industry)) {
          industryMap.set(industry, { count: 0, totalAmount: 0 });
        }
        
        const current = industryMap.get(industry)!;
        current.count++;
        current.totalAmount += amount;
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

      return {
        totalOfferings,
        totalAmount,
        averageAmount,
        thisMonthOfferings,
        thisMonthAmount,
        topIndustries
      };
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