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

export class SecService {
  // Get paginated offerings with filters
  static async getOfferings(
    filters: OfferingFilters = {}, 
    page = 1, 
    pageSize = 50
  ): Promise<PaginatedResponse<any>> {
    let query = supabase
      .from('offerings')
      .select(`
        *,
        issuers(*),
        formd_submission(*)
      `)
      .order('sale_date', { ascending: false });

    // Apply filters
    if (filters.dateFrom || filters.dateTo) {
      const startDate = filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : '1900-01-01';
      const endDate = filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : '2100-12-31';
      query = query
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);
    }

    if (filters.minAmount !== undefined) {
      query = query.gte('totalofferingamount', filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      query = query.lte('totalofferingamount', filters.maxAmount);
    }

    if (filters.industry) {
      query = query.eq('industrygrouptype', filters.industry);
    }

    if (filters.industries && filters.industries.length > 0) {
      query = query.in('industrygrouptype', filters.industries);
    }

    // Search across multiple fields
    if (filters.searchQuery) {
      const searchTerm = `%${filters.searchQuery}%`;
      query = query.or(`
        issuers.entityname.ilike.${searchTerm},
        issuers.cik.ilike.${searchTerm},
        accessionnumber.ilike.${searchTerm}
      `);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('offerings')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching offerings:', error);
      throw new Error(`Failed to fetch offerings: ${error.message}`);
    }

    return {
      data: data || [],
      count: data?.length || 0,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  // Get single offering with all details
  static async getOfferingDetail(accessionnumber: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('offerings')
      .select(`
        *,
        issuers(*),
        signatures(*),
        related_persons(*),
        recipients(*),
        formd_submission(*)
      `)
      .eq('accessionnumber', accessionnumber)
      .maybeSingle();

    if (error) {
      console.error('Error fetching offering detail:', error);
      throw new Error(`Failed to fetch offering detail: ${error.message}`);
    }

    return data;
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

  // Get summary statistics
  static async getSummaryStats(): Promise<SecSummaryStats> {
    try {
      // Get total offerings and amount
      const { data: totalData, error: totalError } = await supabase
        .from('offerings')
        .select('totalofferingamount')
        .not('totalofferingamount', 'is', null);

      if (totalError) throw totalError;

      const totalOfferings = totalData.length;
      const totalAmount = totalData.reduce((sum, item) => sum + (item.totalofferingamount || 0), 0);
      const averageAmount = totalOfferings > 0 ? totalAmount / totalOfferings : 0;

      // Get this month's data
      const thisMonth = new Date();
      thisMonth.setDate(1); // First day of month
      const thisMonthStr = thisMonth.toISOString().split('T')[0];

      const { data: monthData, error: monthError } = await supabase
        .from('offerings')
        .select('totalofferingamount')
        .gte('sale_date', thisMonthStr)
        .not('totalofferingamount', 'is', null);

      if (monthError) throw monthError;

      const thisMonthOfferings = monthData.length;
      const thisMonthAmount = monthData.reduce((sum, item) => sum + (item.totalofferingamount || 0), 0);

      // Get top industries
      const { data: industryData, error: industryError } = await supabase
        .from('offerings')
        .select('industrygrouptype, totalofferingamount')
        .not('industrygrouptype', 'is', null)
        .not('totalofferingamount', 'is', null);

      if (industryError) throw industryError;

      const industryMap = new Map<string, { count: number; totalAmount: number }>();
      
      industryData.forEach(item => {
        const industry = item.industrygrouptype;
        const amount = item.totalofferingamount || 0;
        
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