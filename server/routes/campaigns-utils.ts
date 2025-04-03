/**
 * Campaign Utilities
 * 
 * Helper functions for creating test campaign data
 */

/**
 * Generate keywords for a test campaign
 * @returns Array of keywords with IDs
 */
export function generateTestKeywords() {
  const keywords = [
    { id: 1, keyword: "local business", campaign_id: 1 },
    { id: 2, keyword: "service provider", campaign_id: 1 },
    { id: 3, keyword: "local expert", campaign_id: 1 },
    { id: 4, keyword: "trusted business", campaign_id: 1 },
    { id: 5, keyword: "professional service", campaign_id: 1 },
    { id: 6, keyword: "best rated company", campaign_id: 1 },
    { id: 7, keyword: "nearby services", campaign_id: 1 },
    { id: 8, keyword: "top rated business", campaign_id: 1 }
  ];
  
  return keywords;
}

/**
 * Get campaign keywords by campaign ID
 * @param campaignId Campaign ID to filter by
 * @returns Array of matching keywords
 */
export function getCampaignKeywords(campaignId: number) {
  const allKeywords = generateTestKeywords();
  return allKeywords.filter(kw => kw.campaign_id === campaignId);
}