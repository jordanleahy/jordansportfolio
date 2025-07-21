import { supabase } from "@/integrations/supabase/client";
import type { 
  OfferingFilters, 
  PaginatedResponse,
  SecSummaryStats
} from "@/types/sec";

export class SecServiceOptimized {
  // Get paginated offerings with filters - fully server-side optimized
  static async getOfferings(
    filters: OfferingFilters = {}, 
    page = 1, 
    pageSize = 50
  ): Promise<PaginatedResponse<any>> {
    console.log('🚀 Optimized getOfferings with filters:', JSON.stringify(filters, null, 2));
    
    // Use the materialized view for better performance
    let query = supabase
      .from('mv_offerings_enriched')
      .select('*', { count: 'exact' });

    // Apply base filters for data quality
    query = query
      .filter('totalamountsold', 'not.is', null)
      .gt('totalamountsold', 0);

    // Apply default filters (server-side) - only if no specific filters are applied
    if (filters.useDefaultFilters && (!filters.industries || filters.industries.length === 0)) {
      console.log('🚀 Applying server-side default tech filters');
      
      // Technology industry filtering
      const techKeywords = [
        'Technology', 'Software', 'Computer', 'Biotechnology', 
        'Internet', 'Telecommunications', 'Electronics', 
        'Information Technology', 'FinTech', 'E-commerce'
      ];
      
      const techFilter = techKeywords.map(keyword => 
        `industrygrouptype.ilike.%${keyword}%`
      ).join(',');
      
      query = query.or(techFilter);
      
      // Must have required fields
      query = query
        .filter('totalofferingamount', 'not.is', null)
        .filter('company_name', 'not.is', null);
    }

    // Apply industry filters
    if (filters.industry) {
      query = query.eq('industrygrouptype', filters.industry);
    }
    
    if (filters.industries && filters.industries.length > 0) {
      query = query.in('industrygrouptype', filters.industries);
    }


    // Apply amount range filters (server-side) - Fixed PostgREST syntax
    if (filters.amountRanges && filters.amountRanges.length > 0) {
      const amountConditions = filters.amountRanges.map(range => {
        switch (range) {
          case "Less than $500k":
            return "totalofferingamount.lt.500000";
          case "$500k - $2MM":
            return "and(totalofferingamount.gte.500000,totalofferingamount.lte.2000000)";
          case "$2MM - $5MM":
            return "and(totalofferingamount.gte.2000000,totalofferingamount.lte.5000000)";
          case "$5MM+":
            return "totalofferingamount.gt.5000000";
          default:
            return null;
        }
      }).filter(Boolean);
      
      if (amountConditions.length > 0) {
        query = query.or(amountConditions.join(','));
      }
    }

    // Apply max raised filters (server-side) - Fixed PostgREST syntax
    if (filters.maxRaisedRanges && filters.maxRaisedRanges.length > 0) {
      const raisedConditions = filters.maxRaisedRanges.map(range => {
        switch (range) {
          case "Less than $250K":
            return "totalamountsold.lt.250000";
          case "$250K - $500K":
            return "and(totalamountsold.gte.250000,totalamountsold.lte.500000)";
          case "$500K - $1M":
            return "and(totalamountsold.gte.500000,totalamountsold.lte.1000000)";
          case "$1M - $2M":
            return "and(totalamountsold.gte.1000000,totalamountsold.lte.2000000)";
          case "$2MM - $5MM":
            return "and(totalamountsold.gte.2000000,totalamountsold.lte.5000000)";
          case "$5MM - $10MM":
            return "and(totalamountsold.gte.5000000,totalamountsold.lte.10000000)";
          default:
            return null;
        }
      }).filter(Boolean);
      
      if (raisedConditions.length > 0) {
        query = query.or(raisedConditions.join(','));
      }
    }

    // Apply state filters (server-side)
    if (filters.states && filters.states.length > 0) {
      query = query.in('country_code', filters.states);
    }

    // Apply fully sold filter
    if (filters.fullySold) {
      query = query.eq('is_fully_raised', true);
    }

    // Apply sorting (server-side)
    if (filters.sortField && filters.sortDirection) {
      const ascending = filters.sortDirection === 'asc';

      // Handle special sorting cases
      if (filters.sortField === 'percentRaised') {
        // Calculate percentage raised and order by it
        // For percentage calculation, we can't modify the select in the middle
        // Just use the existing calculated field from the view
        query = query.order('totalamountsold', { ascending });
      } else if (filters.sortField === 'companyName') {
        query = query.order('company_name', { ascending });
      } else {
        const sortField = this.getSortField(filters.sortField);
        query = query.order(sortField, { ascending });
      }
    } else {
      // Default sort
      query = query.order('sale_date', { ascending: false, nullsFirst: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    try {
      const { data, error, count } = await query.range(from, to);

      console.log('🚀 Optimized query results:', {
        error: error?.message,
        count,
        dataLength: data?.length || 0
      });

      if (error) {
        console.error('Error fetching offerings:', error);
        throw new Error(`Failed to fetch offerings: ${error.message}`);
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(item => ({
        ...item,
        // Maintain backward compatibility
        issuers: [{
          entityname: item.company_name,
          city: item.company_city,
          stateorcountrydescription: item.company_location,
          stateorcountry: item.country_code
        }],
        signatures: [{
          nameofsigner: item.primary_signer
        }]
      }));

      return {
        data: transformedData,
        count: count || 0,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error: any) {
      console.error('Search query failed:', error);
      throw error;
    }
  }

  // Fallback basic search method
  private static async getOfferingsBasicSearch(
    filters: OfferingFilters = {}, 
    page = 1, 
    pageSize = 50
  ): Promise<PaginatedResponse<any>> {
    let query = supabase
      .from('mv_offerings_enriched')
      .select('*', { count: 'exact' });

    // Apply base filters
    query = query
      .filter('totalamountsold', 'not.is', null)
      .gt('totalamountsold', 0);


    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const transformedData = (data || []).map(item => ({
      ...item,
      issuers: [{
        entityname: item.company_name,
        city: item.company_city,
        stateorcountrydescription: item.company_location,
        stateorcountry: item.country_code
      }],
      signatures: [{
        nameofsigner: item.primary_signer
      }]
    }));

    return {
      data: transformedData,
      count: count || 0,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  // Get single offering with all details (optimized)
  static async getOfferingDetail(accessionnumber: string): Promise<any | null> {
    // First try the materialized view for basic info
    const { data: offering, error } = await supabase
      .from('mv_offerings_enriched')
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

    // Get additional details if needed
    const [
      { data: relatedPersons },
      { data: recipients },
      { data: formSubmission }
    ] = await Promise.all([
      supabase.from('related_persons').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('recipients').select('*').eq('accessionnumber', accessionnumber),
      supabase.from('formd_submission').select('*').eq('accessionnumber', accessionnumber).maybeSingle()
    ]);

    return {
      ...offering,
      // Transform to maintain compatibility
      issuers: [{
        entityname: offering.company_name,
        city: offering.company_city,
        stateorcountrydescription: offering.company_location,
        stateorcountry: offering.country_code
      }],
      signatures: [{
        nameofsigner: offering.primary_signer
      }],
      related_persons: relatedPersons || [],
      recipients: recipients || [],
      formd_submission: formSubmission
    };
  }

  // Get distinct industries for filter dropdown (optimized)
  static async getIndustries(): Promise<string[]> {
    const { data, error } = await supabase
      .from('mv_offerings_enriched')
      .select('industrygrouptype')
      .not('industrygrouptype', 'is', null)
      .order('industrygrouptype');

    if (error) {
      console.error('Error fetching industries:', error);
      throw new Error(`Failed to fetch industries: ${error.message}`);
    }

    const industries = [...new Set(data.map(item => item.industrygrouptype))];
    return industries.filter(Boolean);
  }

  // Get summary statistics (optimized)
  static async getSummaryStats(): Promise<SecSummaryStats> {
    try {
      const { data, error } = await supabase
        .from('mv_offerings_enriched')
        .select(`
          totalofferingamount,
          totalamountsold,
          industrygrouptype,
          sale_date,
          is_fully_raised
        `)
        .filter('totalamountsold', 'not.is', null)
        .gt('totalamountsold', 0);

      if (error) throw error;

      const offerings = data || [];
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Calculate stats
      const totalOfferings = offerings.length;
      const totalRaised = offerings.reduce((sum, o) => 
        sum + (parseFloat(String(o.totalamountsold)) || 0), 0
      );
      const avgAmount = totalOfferings > 0 ? totalRaised / totalOfferings : 0;
      
      const thisMonthOfferings = offerings.filter(o => 
        o.sale_date && o.sale_date.startsWith(currentMonth)
      );
      const thisMonthTotal = thisMonthOfferings.reduce((sum, o) => 
        sum + (parseFloat(String(o.totalamountsold)) || 0), 0
      );

      // Top industries
      const industryMap = new Map<string, number>();
      offerings.forEach(o => {
        if (o.industrygrouptype) {
          const current = industryMap.get(o.industrygrouptype) || 0;
          industryMap.set(o.industrygrouptype, current + 1);
        }
      });

      const topIndustries = Array.from(industryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ 
          industry: name, 
          count, 
          totalAmount: 0, 
          averageAmount: 0 
        }));

      return {
        totalOfferings,
        totalAmount: totalRaised,
        averageAmount: avgAmount,
        thisMonthOfferings: thisMonthOfferings.length,
        thisMonthAmount: thisMonthTotal,
        topIndustries
      };
    } catch (error: any) {
      console.error('Error fetching summary stats:', error);
      throw new Error(`Failed to fetch summary stats: ${error.message}`);
    }
  }

  // Helper function to map sort fields
  private static getSortField(field: string): string {
    switch (field) {
      case 'companyName':
        return 'company_name';
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
  }

  // Batch insert functions (keeping for data import)
  static async batchInsertSubmissions(submissions: any[]): Promise<void> {
    const { error } = await supabase.from('formd_submission').insert(submissions);
    if (error) throw error;
  }

  static async batchInsertOfferings(offerings: any[]): Promise<void> {
    const { error } = await supabase.from('offerings').insert(offerings);
    if (error) throw error;
  }

  static async batchInsertIssuers(issuers: any[]): Promise<void> {
    const { error } = await supabase.from('issuers').insert(issuers);
    if (error) throw error;
  }

  static async batchInsertSignatures(signatures: any[]): Promise<void> {
    const { error } = await supabase.from('signatures').insert(signatures);
    if (error) throw error;
  }

  static async batchInsertRelatedPersons(persons: any[]): Promise<void> {
    const { error } = await supabase.from('related_persons').insert(persons);
    if (error) throw error;
  }

  static async batchInsertRecipients(recipients: any[]): Promise<void> {
    const { error } = await supabase.from('recipients').insert(recipients);
    if (error) throw error;
  }
}
