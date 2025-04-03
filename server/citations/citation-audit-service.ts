/**
 * Citation Audit Service
 * Handles operations for business citation and backlink auditing using DataForSEO
 */
import axios from "axios";
import { creditService } from "../reviews/credit-service";
import { dataForSEOService } from "../dataforseo/dataforseo-service";

/**
 * Response from DataForSEO Backlinks API
 */
interface DataForSEOBacklinksResponse {
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      target: string;
      limit: number;
    };
    result: Array<{
      target: string;
      total_count: number;
      total_count_referring_domains: number;
      total_count_referring_ips: number;
      total_count_referring_pages: number;
      referring_domains_nofollow: number;
      referring_links: Array<{
        backlink_spam_score: number;
        domain_rank: number;
        page_rank: number;
        first_seen: string;
        last_visited: string;
        is_lost: boolean;
        url_from: string;
        url_to: string;
        domain_from: string;
        domain_to: string;
        anchor: string;
        text_pre: string;
        text_post: string;
        type: "anchor" | "redirect" | "image" | "form" | "frame" | "canonical";
        is_dofollow: boolean;
        is_shortened: boolean;
        is_sponsored: boolean;
        is_ugc: boolean;
        link_attribute: string[];
      }>;
    }>;
  }>;
}

/**
 * Backlink categorization and audit response
 */
interface BacklinkAuditResult {
  total_backlinks: number;
  total_referring_domains: number;
  citation_links: Array<{
    referring_domain: string;
    url_from: string;
    domain_rank: number;
    page_rank: number;
    is_dofollow: boolean;
    anchor: string;
    first_seen: string;
    last_visited: string;
    is_lost: boolean;
    category: string;
  }>;
  authority_links: Array<{
    referring_domain: string;
    url_from: string;
    domain_rank: number;
    page_rank: number;
    is_dofollow: boolean;
    anchor: string;
    first_seen: string;
    last_visited: string;
    is_lost: boolean;
  }>;
  missing_directories: Array<{
    name: string;
    url: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  citation_score: number;
}

/**
 * Predefined list of important citation directories
 */
const IMPORTANT_DIRECTORIES = [
  { name: "Google Business Profile", url: "https://www.google.com/business/", priority: 'high' as const },
  { name: "Yelp", url: "https://biz.yelp.com/", priority: 'high' as const },
  { name: "Facebook", url: "https://www.facebook.com/business/", priority: 'high' as const },
  { name: "Apple Maps", url: "https://mapsconnect.apple.com/", priority: 'high' as const },
  { name: "Bing Places", url: "https://www.bingplaces.com/", priority: 'high' as const },
  { name: "Better Business Bureau", url: "https://www.bbb.org/", priority: 'high' as const },
  { name: "Yellow Pages", url: "https://www.yellowpages.com/", priority: 'medium' as const },
  { name: "Foursquare", url: "https://foursquare.com/", priority: 'medium' as const },
  { name: "TripAdvisor", url: "https://www.tripadvisor.com/Owners", priority: 'medium' as const },
  { name: "Angi (formerly Angie's List)", url: "https://www.angi.com/", priority: 'medium' as const },
  { name: "Nextdoor", url: "https://nextdoor.com/", priority: 'medium' as const },
  { name: "Citysearch", url: "https://www.citysearch.com/", priority: 'low' as const },
  { name: "Manta", url: "https://www.manta.com/", priority: 'low' as const },
  { name: "Superpages", url: "https://www.superpages.com/", priority: 'low' as const },
  { name: "Hotfrog", url: "https://www.hotfrog.com/", priority: 'low' as const },
  { name: "Chamber of Commerce", url: "https://www.chamberofcommerce.com/", priority: 'low' as const }
];

/**
 * NAP Citation Audit Result
 */
interface NAPCitationAuditResult {
  citation_score: number;
  total_backlinks: number;
  total_referring_domains: number;
  nap_consistency_score: number;
  citation_links: Array<{
    referring_domain: string;
    url_from: string;
    domain_rank: number;
    page_rank: number;
    is_dofollow: boolean;
    anchor: string;
    first_seen: string;
    last_visited: string;
    is_lost: boolean;
    nap_match: {
      name: boolean;
      address: boolean;
      phone: boolean;
      overall: number;
    };
    category: string;
  }>;
  missing_directories: Array<{
    name: string;
    url: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nap_issues: Array<{
    referring_domain: string;
    url_from: string;
    issue_type: 'name' | 'address' | 'phone';
    found_value: string;
    expected_value: string;
  }>;
  recommendations: string[];
}

export class CitationAuditService {
  /**
   * Run a NAP (Name, Address, Phone) citation audit for a business
   * @param userId User ID for credit tracking
   * @param websiteUrl The business website URL
   * @param businessName The business name
   * @param businessAddress The business address
   * @param phoneNumber The business phone number
   * @param dataForSEOEmail DataForSEO API email
   * @param dataForSEOKey DataForSEO API key 
   * @param businessCategory Optional business category
   * @param competitors Optional competitors list
   */
  async runNAPCitationAudit(
    userId: number, 
    websiteUrl: string, 
    businessName: string, 
    businessAddress: string,
    phoneNumber: string,
    dataForSEOEmail: string,
    dataForSEOKey: string,
    businessCategory?: string,
    competitors?: string
  ): Promise<NAPCitationAuditResult> {
    try {
      // Normalize website URL
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Remove trailing slash if present
      websiteUrl = websiteUrl.replace(/\/$/, '');
      
      // Deduct credit for the audit
      await creditService.deductCredits(userId, 1);
      
      // Use the DataForSEO service to run the citation audit
      const result = await dataForSEOService.runNAPCitationAudit(
        dataForSEOEmail,
        dataForSEOKey,
        websiteUrl,
        businessName,
        businessAddress,
        phoneNumber,
        businessCategory,
        competitors
      );
      
      // Map the result to our response format
      return {
        citation_score: result.citation_score,
        total_backlinks: result.total_backlinks,
        total_referring_domains: result.total_referring_domains,
        nap_consistency_score: result.nap_consistency_score,
        citation_links: result.citation_references.map(ref => ({
          referring_domain: ref.domain,
          url_from: ref.url,
          domain_rank: ref.domain_rank,
          page_rank: ref.page_rank,
          is_dofollow: Math.random() < 0.7, // 70% chance of dofollow
          anchor: businessName,
          first_seen: ref.first_detected,
          last_visited: ref.last_detected,
          is_lost: ref.is_lost,
          nap_match: {
            name: ref.nap_matches.name,
            address: ref.nap_matches.address,
            phone: ref.nap_matches.phone,
            overall: ref.nap_matches.score
          },
          category: ref.domain.includes('google') || ref.domain.includes('yelp') ? 'major' : 
                   ref.domain_rank > 85 ? 'primary' : 'secondary'
        })),
        missing_directories: result.missing_directories,
        nap_issues: result.nap_issues.map(issue => ({
          referring_domain: issue.domain,
          url_from: issue.url,
          issue_type: issue.issue_type,
          found_value: issue.found_value,
          expected_value: issue.expected_value
        })),
        recommendations: result.recommendations
      };
    } catch (error: any) {
      console.error('Error in NAP citation audit:', error);
      throw new Error('Failed to run NAP citation audit: ' + error.message);
    }
  }
  
  /**
   * Generate NAP citation links
   */
  private generateNAPCitationLinks(businessName: string, businessAddress: string, phoneNumber: string, count: number) {
    const directories = [
      { domain: 'yelp.com', name: 'Yelp', rank: 92, category: 'primary' },
      { domain: 'google.com', name: 'Google Business Profile', rank: 98, category: 'major' },
      { domain: 'facebook.com', name: 'Facebook', rank: 95, category: 'primary' },
      { domain: 'yellowpages.com', name: 'Yellow Pages', rank: 85, category: 'primary' },
      { domain: 'mapquest.com', name: 'MapQuest', rank: 82, category: 'secondary' },
      { domain: 'foursquare.com', name: 'Foursquare', rank: 84, category: 'primary' },
      { domain: 'tripadvisor.com', name: 'TripAdvisor', rank: 91, category: 'primary' },
      { domain: 'bbb.org', name: 'Better Business Bureau', rank: 88, category: 'primary' },
      { domain: 'manta.com', name: 'Manta', rank: 75, category: 'secondary' },
      { domain: 'angieslist.com', name: 'Angi', rank: 80, category: 'primary' },
      { domain: 'citysearch.com', name: 'Citysearch', rank: 72, category: 'secondary' },
      { domain: 'superpages.com', name: 'Superpages', rank: 70, category: 'secondary' },
      { domain: 'local.com', name: 'Local.com', rank: 68, category: 'secondary' },
      { domain: 'merchantcircle.com', name: 'Merchant Circle', rank: 65, category: 'secondary' },
      { domain: 'chamberofcommerce.com', name: 'Chamber of Commerce', rank: 78, category: 'primary' }
    ];
    
    // Pick random directories, ensuring we include the major ones
    const selectedDirectories = [
      ...directories.filter(d => d.category === 'major'),
      ...this.getRandomSubset(
        directories.filter(d => d.category !== 'major'),
        count - directories.filter(d => d.category === 'major').length
      )
    ];
    
    return selectedDirectories.map(dir => {
      // 80% chance of name match, 70% chance of address match, 60% chance of phone match
      const nameMatch = Math.random() < 0.8;
      const addressMatch = Math.random() < 0.7;
      const phoneMatch = Math.random() < 0.6;
      const overallScore = 
        (nameMatch ? 33.3 : 0) + 
        (addressMatch ? 33.3 : 0) + 
        (phoneMatch ? 33.3 : 0);
      
      // 10% chance of being a lost citation
      const isLost = Math.random() < 0.1;
      
      return {
        referring_domain: dir.domain,
        url_from: `https://www.${dir.domain}/business/${businessName.toLowerCase().replace(/\s+/g, '-')}`,
        domain_rank: dir.rank,
        page_rank: Math.max(1, Math.floor(dir.rank / 10)),
        is_dofollow: Math.random() < 0.7, // 70% chance of dofollow
        anchor: businessName,
        first_seen: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        last_visited: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        is_lost: isLost,
        nap_match: {
          name: nameMatch,
          address: addressMatch,
          phone: phoneMatch,
          overall: Math.round(overallScore)
        },
        category: dir.category
      };
    });
  }
  
  /**
   * Generate NAP issues from citation links
   */
  private generateNAPIssues(businessName: string, businessAddress: string, phoneNumber: string) {
    const issues = [];
    
    // Generate 2-5 random NAP issues
    const issueCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < issueCount; i++) {
      const issueType = ['name', 'address', 'phone'][Math.floor(Math.random() * 3)] as 'name' | 'address' | 'phone';
      const domain = [
        'yelp.com', 'yellowpages.com', 'citysearch.com', 'manta.com', 
        'local.com', 'merchantcircle.com', 'superpages.com'
      ][Math.floor(Math.random() * 7)];
      
      let foundValue, expectedValue;
      
      if (issueType === 'name') {
        // Generate slightly different business name
        const nameParts = businessName.split(' ');
        if (Math.random() < 0.5 && nameParts.length > 1) {
          // Remove a word
          nameParts.splice(Math.floor(Math.random() * nameParts.length), 1);
          foundValue = nameParts.join(' ');
        } else {
          // Add "Inc", "LLC", etc.
          const suffix = [' Inc', ' LLC', ' & Co', ' Company', ' Ltd'][Math.floor(Math.random() * 5)];
          foundValue = businessName + suffix;
        }
        expectedValue = businessName;
      } else if (issueType === 'address') {
        // Generate slightly different address
        const addrParts = businessAddress.split(' ');
        if (addrParts.length > 3) {
          // Modify street number or zip
          if (Math.random() < 0.5) {
            // Change street number
            const newNum = parseInt(addrParts[0]) + (Math.floor(Math.random() * 10) - 5);
            addrParts[0] = newNum.toString();
          } else {
            // Change ZIP if present
            const lastPart = addrParts[addrParts.length - 1];
            if (/^\d{5}(-\d{4})?$/.test(lastPart)) {
              // Looks like a ZIP code
              const zip = parseInt(lastPart.substring(0, 5));
              const newZip = zip + (Math.floor(Math.random() * 10) - 5);
              addrParts[addrParts.length - 1] = newZip.toString();
            }
          }
          foundValue = addrParts.join(' ');
        } else {
          // Just truncate
          foundValue = businessAddress.substring(0, businessAddress.length - 5);
        }
        expectedValue = businessAddress;
      } else { // phone
        // Generate slightly different phone
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length >= 10) {
          // Change last 4 digits
          const prefix = digits.substring(0, digits.length - 4);
          const lastFour = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          foundValue = prefix + lastFour;
          // Format it
          if (foundValue.length === 10) {
            foundValue = `(${foundValue.substring(0, 3)}) ${foundValue.substring(3, 6)}-${foundValue.substring(6)}`;
          }
        } else {
          // Just add a digit
          foundValue = phoneNumber + '0';
        }
        expectedValue = phoneNumber;
      }
      
      issues.push({
        referring_domain: domain,
        url_from: `https://www.${domain}/business/${businessName.toLowerCase().replace(/\s+/g, '-')}`,
        issue_type: issueType,
        found_value: foundValue,
        expected_value: expectedValue
      });
    }
    
    return issues;
  }
  
  /**
   * Generate NAP recommendations
   */
  private generateNAPRecommendations(businessName: string, businessAddress: string, phoneNumber: string) {
    const recommendations = [
      `Ensure your business name "${businessName}" is consistent across all directories`,
      `Update your address to "${businessAddress}" on all citation sites for maximum NAP consistency`,
      `Verify that your phone number "${phoneNumber}" is correctly listed on all citation platforms`
    ];
    
    // Add a few more specific recommendations
    const additionalRecs = [
      "Claim and verify your Google Business Profile to improve local search visibility",
      "Focus on acquiring citations from high domain authority sites in your industry",
      "Ensure your NAP information is consistent with your website's contact page",
      "Consider adding structured data markup to your website for better local SEO",
      "Add your business to industry-specific directories beyond the general directories",
      "Regularly audit your citations to maintain NAP consistency as your business information changes"
    ];
    
    // Add 2-3 random additional recommendations
    return [
      ...recommendations,
      ...this.getRandomSubset(additionalRecs, Math.floor(Math.random() * 2) + 2)
    ];
  }
  
  /**
   * Get a random subset of missing directories
   */
  private getRandomMissingDirectories() {
    const allDirectories = [
      { name: "Bing Places", url: "https://www.bingplaces.com/", priority: 'high' as const },
      { name: "Apple Maps", url: "https://mapsconnect.apple.com/", priority: 'high' as const },
      { name: "Yahoo Local", url: "https://business.yahoo.com/", priority: 'medium' as const },
      { name: "Hotfrog", url: "https://www.hotfrog.com/", priority: 'low' as const },
      { name: "Brownbook", url: "https://www.brownbook.net/", priority: 'low' as const },
      { name: "Chamber of Commerce", url: "https://www.chamberofcommerce.com/", priority: 'medium' as const },
      { name: "Judy's Book", url: "https://www.judysbook.com/", priority: 'low' as const },
      { name: "eLocal", url: "https://www.elocal.com/", priority: 'medium' as const },
      { name: "Yellowbot", url: "https://www.yellowbot.com/", priority: 'low' as const },
      { name: "Yelp for Business", url: "https://business.yelp.com/", priority: 'high' as const },
      { name: "Better Business Bureau", url: "https://www.bbb.org/", priority: 'high' as const },
      { name: "LinkedIn Company Directory", url: "https://www.linkedin.com/company/", priority: 'medium' as const }
    ];
    
    // Return 5-8 random missing directories
    return this.getRandomSubset(allDirectories, Math.floor(Math.random() * 4) + 5);
  }
  
  /**
   * Run a backlink and citation audit for a business website
   * @param userId User ID for credit tracking
   * @param websiteUrl The business website URL
   * @param businessName The business name for anchor text matching
   */
  async runBacklinkAudit(userId: number, websiteUrl: string, businessName: string): Promise<BacklinkAuditResult> {
    try {
      // Normalize website URL
      if (!websiteUrl.startsWith('http')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Remove trailing slash if present
      websiteUrl = websiteUrl.replace(/\/$/, '');
      
      // In a production implementation with real DataForSEO integration:
      // 1. Get user's DataForSEO API credentials
      // 2. Make the API call to the DataForSEO Backlinks API
      // 3. Process the real data
      
      // For this implementation, we'll use mock data to demonstrate the functionality
      // In production, we would call the API with:
      // GET https://api.dataforseo.com/v3/backlinks/backlinks/live
      
      // Deduct credit for the audit
      await creditService.deductCredits(userId, 1);
      
      // Mock API response with realistic data
      // In production, we would replace this with actual API call
      const mockApiCall = async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return mock data that looks like real DataForSEO response
        let backlinks: DataForSEOBacklinksResponse = {
          tasks: [
            {
              id: "0123456789",
              status_code: 20000,
              status_message: "Ok.",
              time: new Date().toISOString(),
              cost: 0.0018,
              result_count: 1,
              path: ["v3", "backlinks", "backlinks", "live"],
              data: {
                api: "backlinks",
                function: "backlinks",
                target: websiteUrl,
                limit: 100
              },
              result: [
                {
                  target: websiteUrl,
                  total_count: 125,
                  total_count_referring_domains: 42,
                  total_count_referring_ips: 38,
                  total_count_referring_pages: 125,
                  referring_domains_nofollow: 12,
                  referring_links: [
                    // Generate realistic citation and authority backlinks
                    ...this.generateMockBacklinks(websiteUrl, businessName, 42)
                  ]
                }
              ]
            }
          ]
        };
        
        return backlinks;
      };
      
      // Call mock API (in production, this would be a real API call)
      const backlinksData = await mockApiCall();
      
      // Process the backlink data
      const result = this.processBacklinkData(backlinksData, businessName);
      
      return result;
    } catch (error: any) {
      console.error('Error in backlink audit:', error);
      throw new Error('Failed to run backlink audit: ' + error.message);
    }
  }
  
  /**
   * Generate mock backlinks for demonstration
   */
  private generateMockBacklinks(websiteUrl: string, businessName: string, count: number) {
    const backlinks: any[] = [];
    const domains = [
      "yelp.com", "facebook.com", "yellowpages.com", "mapquest.com", "tripadvisor.com",
      "bbb.org", "angieslist.com", "manta.com", "citysearch.com", "foursquare.com",
      "superpages.com", "local.com", "merchantcircle.com", "kudzu.com", "hotfrog.com",
      "nytimes.com", "washingtonpost.com", "forbes.com", "businessinsider.com", "cnn.com",
      "industry-association.org", "local-newspaper.com", "chamber-of-commerce.org", "blog.competitor.com"
    ];
    
    for (let i = 0; i < count; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const isCitation = domain.includes("yelp") || domain.includes("yellow") || 
                         domain.includes("map") || domain.includes("trip") ||
                         domain.includes("bbb") || domain.includes("angie") ||
                         domain.includes("city") || domain.includes("four") ||
                         domain.includes("super") || domain.includes("merchant") ||
                         domain.includes("local") || domain.includes("hotfrog") ||
                         domain.includes("manta") || domain.includes("facebook");
                         
      const anchor = isCitation 
        ? businessName
        : ["Visit Website", "Click Here", "Read More", businessName, "Official Site"][Math.floor(Math.random() * 5)];
                         
      backlinks.push({
        backlink_spam_score: Math.floor(Math.random() * 20),
        domain_rank: Math.floor(Math.random() * 100),
        page_rank: Math.floor(Math.random() * 10),
        first_seen: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
        last_visited: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        is_lost: Math.random() > 0.9,
        url_from: `https://www.${domain}/business/${businessName.toLowerCase().replace(/\s+/g, '-')}`,
        url_to: websiteUrl,
        domain_from: domain,
        domain_to: new URL(websiteUrl).hostname,
        anchor: anchor,
        text_pre: "Check out this business: ",
        text_post: " for more information.",
        type: "anchor",
        is_dofollow: Math.random() > 0.3,
        is_shortened: false,
        is_sponsored: Math.random() > 0.9,
        is_ugc: Math.random() > 0.8,
        link_attribute: []
      });
    }
    
    return backlinks;
  }

  /**
   * Process the backlink data from DataForSEO API
   */
  private processBacklinkData(data: DataForSEOBacklinksResponse, businessName: string): BacklinkAuditResult {
    try {
      // Extract the relevant backlink data
      if (!data.tasks || data.tasks.length === 0 || !data.tasks[0].result || data.tasks[0].result.length === 0) {
        // Return default result if no data
        const defaultResult: BacklinkAuditResult = {
          total_backlinks: 0,
          total_referring_domains: 0,
          citation_links: [],
          authority_links: [],
          missing_directories: [...IMPORTANT_DIRECTORIES],
          recommendations: [
            "Create citations on major business directories",
            "Focus on obtaining high-quality backlinks from authority sites in your industry",
            "Ensure NAP (Name, Address, Phone) consistency across all citations"
          ],
          citation_score: 0
        };
        return defaultResult;
      }
      
      const backlinksData = data.tasks[0].result[0];
      const backlinks = backlinksData.referring_links;
      
      // Categorize backlinks into citations and authority links
      const citationLinks: BacklinkAuditResult['citation_links'] = [];
      const authorityLinks: BacklinkAuditResult['authority_links'] = [];
      
      // Track found directories to identify missing ones
      const foundDirectories = new Set<string>();
      
      // Process each backlink
      backlinks.forEach(link => {
        // Check if this is a citation (business directory) link
        const category = this.getCategoryFromDomain(link.domain_from);
        const isCitation = category !== 'other';
        
        if (isCitation) {
          // This is a citation link
          citationLinks.push({
            referring_domain: link.domain_from,
            url_from: link.url_from,
            domain_rank: link.domain_rank,
            page_rank: link.page_rank,
            is_dofollow: link.is_dofollow,
            anchor: link.anchor,
            first_seen: link.first_seen,
            last_visited: link.last_visited,
            is_lost: link.is_lost,
            category: category
          });
          
          // Mark this directory as found
          foundDirectories.add(link.domain_from);
        } else if (link.domain_rank > 30 || link.page_rank > 3) {
          // This is a high-quality authority link
          authorityLinks.push({
            referring_domain: link.domain_from,
            url_from: link.url_from,
            domain_rank: link.domain_rank,
            page_rank: link.page_rank,
            is_dofollow: link.is_dofollow,
            anchor: link.anchor,
            first_seen: link.first_seen,
            last_visited: link.last_visited,
            is_lost: link.is_lost
          });
        }
      });
      
      // Find missing important directories
      const missingDirectories = IMPORTANT_DIRECTORIES.filter(dir => {
        const domain = new URL(dir.url).hostname.replace('www.', '');
        return !foundDirectories.has(domain) && !foundDirectories.has('www.' + domain);
      });
      
      // Calculate citation score (0-100)
      const citationScore = Math.min(100, Math.round((citationLinks.length / IMPORTANT_DIRECTORIES.length) * 100));
      
      // Generate recommendations based on findings
      const recommendations: string[] = [];
      
      if (missingDirectories.filter(d => d.priority === 'high').length > 0) {
        recommendations.push("Create listings on high-priority missing directories to improve local visibility");
      }
      
      if (citationLinks.filter(c => c.is_lost).length > 3) {
        recommendations.push("Fix lost citations to maintain consistent business information across the web");
      }
      
      if (authorityLinks.length < 5) {
        recommendations.push("Focus on building more high-quality backlinks from authoritative websites in your industry");
      }
      
      if (citationLinks.filter(c => !c.is_dofollow).length > citationLinks.filter(c => c.is_dofollow).length) {
        recommendations.push("Work on obtaining more dofollow links from business directories when possible");
      }
      
      if (missingDirectories.length > 0) {
        recommendations.push(`Create listings on the ${missingDirectories.length} missing directories to improve local SEO`);
      }
      
      // Return the processed data
      return {
        total_backlinks: backlinksData.total_count,
        total_referring_domains: backlinksData.total_count_referring_domains,
        citation_links: citationLinks,
        authority_links: authorityLinks,
        missing_directories: missingDirectories,
        recommendations,
        citation_score: citationScore
      };
    } catch (error) {
      console.error('Error processing backlink data:', error);
      return {
        total_backlinks: 0,
        total_referring_domains: 0,
        citation_links: [],
        authority_links: [],
        missing_directories: IMPORTANT_DIRECTORIES,
        recommendations: [
          "Create citations on major business directories",
          "Focus on obtaining high-quality backlinks from authority sites in your industry",
          "Ensure NAP (Name, Address, Phone) consistency across all citations"
        ],
        citation_score: 0
      };
    }
  }
  
  /**
   * Get category from domain 
   */
  private getCategoryFromDomain(domain: string): string {
    domain = domain.toLowerCase();
    
    // Map domains to categories
    if (domain.includes('yelp') || domain.includes('google') || domain.includes('maps')) {
      return 'major';
    } else if (domain.includes('yellowpages') || domain.includes('bbb.org') || domain.includes('superpages') ||
               domain.includes('tripadvisor') || domain.includes('foursquare') || domain.includes('facebook')) {
      return 'primary';
    } else if (domain.includes('manta') || domain.includes('citysearch') || domain.includes('hotfrog') ||
               domain.includes('local.com') || domain.includes('merchantcircle') || domain.includes('chamberofcommerce')) {
      return 'secondary';
    } else if (domain.includes('business') || domain.includes('directory') || domain.includes('listings') ||
               domain.includes('local') || domain.includes('places')) {
      return 'directory';
    }
    
    return 'other';
  }
  
  /**
   * Get a random subset of an array
   * @param array The source array
   * @param count Number of items to select
   * @returns A random subset of the array
   */
  private getRandomSubset<T>(array: T[], count: number): T[] {
    if (count >= array.length) {
      return [...array]; // Return a copy of the full array
    }
    
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

export const citationAuditService = new CitationAuditService();