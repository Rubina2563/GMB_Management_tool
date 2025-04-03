/**
 * Description Generator Service
 * 
 * This service provides functionality to generate Google Business Profile descriptions
 * using either OpenAI API (when available) or fallback to a local implementation.
 */

import { DescriptionTone } from '../../shared/schema';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

interface BusinessDetails {
  businessName: string;
  categories: string[];
  services: string[];
  products: string[];
  uniqueSellingPoints: string[];
}

interface GeneratedDescriptions {
  descriptions: string[];
  canAutoUpdate: boolean;
  manualInstructions: string;
}

// Initialize OpenAI API if key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

/**
 * Generate business descriptions using OpenAI
 */
export const generateDescriptionsWithOpenAI = async (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): Promise<GeneratedDescriptions> => {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not available');
    }

    const prompt = buildOpenAIPrompt(businessDetails, tone);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional marketing copywriter specializing in Google Business Profile descriptions." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000 // Increased token limit to accommodate longer descriptions
    });

    // Parse the response text to extract the descriptions
    const content = response.choices[0]?.message?.content?.trim() || '';
    const descriptions = parseOpenAIResponse(content);

    return {
      descriptions,
      canAutoUpdate: true,
      manualInstructions: "You can now update your Google Business Profile with one of these descriptions. Choose the one that best represents your business."
    };
  } catch (error) {
    console.error('OpenAI description generation error:', error);
    throw error;
  }
}

/**
 * Parse the OpenAI response to extract descriptions
 */
const parseOpenAIResponse = (response: string): string[] => {
  // Split the response by numbered items or line breaks
  // First try to find descriptions with labels like "Description 1:"
  const descriptionLabels = response.match(/Description\s*\d+:?\s*([^\n]+)/g);
  
  let descriptions: string[] = [];
  
  if (descriptionLabels && descriptionLabels.length > 0) {
    // Extract the description text from the labeled sections
    descriptions = descriptionLabels.map(label => {
      const content = label.replace(/Description\s*\d+:?\s*/, '').trim();
      return content;
    });
  } else {
    // If no labeled descriptions, try to split by double line breaks
    descriptions = response.split(/\n\s*\n/).map(desc => desc.trim()).filter(Boolean);
  }
  
  // If we still couldn't parse it properly, just return the whole thing as one description
  if (descriptions.length === 0) {
    descriptions = [response];
  }
  
  return descriptions;
}

/**
 * Generate business descriptions locally using templates
 * This is a fallback when OpenAI is not available
 */
export const generateDescriptionsLocally = async (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): Promise<GeneratedDescriptions> => {
  const descriptions: string[] = [];
  
  // Generate descriptions using different templates
  descriptions.push(generateProfessionalTemplate(businessDetails, tone));
  descriptions.push(generateServiceFocusedTemplate(businessDetails, tone));
  descriptions.push(generateUniqueSellingPointsTemplate(businessDetails, tone));
  
  // Add two more descriptions by combining and extending the templates
  const combinedTemplate1 = generateCombinedTemplate1(businessDetails, tone);
  const combinedTemplate2 = generateCombinedTemplate2(businessDetails, tone);
  descriptions.push(combinedTemplate1);
  descriptions.push(combinedTemplate2);
  
  return {
    descriptions,
    canAutoUpdate: false,
    manualInstructions: "OpenAI integration is not available. These descriptions were generated using templates. You may want to edit them before using."
  };
}

/**
 * Generate business descriptions
 * Uses OpenAI if available, otherwise falls back to local generation
 */
export const generateDescriptions = async (
  businessDetails: BusinessDetails,
  tone: DescriptionTone,
): Promise<GeneratedDescriptions> => {
  try {
    // Try to use OpenAI first if available
    if (openai) {
      return await generateDescriptionsWithOpenAI(businessDetails, tone);
    } else {
      console.log('OpenAI API not available, falling back to local generation');
      return await generateDescriptionsLocally(businessDetails, tone);
    }
  } catch (error) {
    console.error('Error generating descriptions, falling back to local generation:', error);
    return await generateDescriptionsLocally(businessDetails, tone);
  }
}

/**
 * Build a prompt for OpenAI
 */
const buildOpenAIPrompt = (businessDetails: BusinessDetails, tone: DescriptionTone): string => {
  const { businessName, categories, services, products, uniqueSellingPoints } = businessDetails;
  
  let toneDescription = '';
  switch (tone) {
    case 'professional':
      toneDescription = 'professional and authoritative';
      break;
    case 'friendly':
      toneDescription = 'warm, friendly and approachable';
      break;
    case 'persuasive':
      toneDescription = 'persuasive and compelling';
      break;
    case 'informative':
      toneDescription = 'clear, informative and educational';
      break;
    case 'conversational':
      toneDescription = 'conversational and engaging';
      break;
  }
  
  return `
Generate 5 different compelling Google Business Profile descriptions for a business with the following details:

Business Name: ${businessName}
Categories: ${categories.join(', ')}
Services: ${services.join(', ')}
Products: ${products.join(', ')}
Unique Selling Points: ${uniqueSellingPoints.join(', ')}

Each description should be:
- Written in a ${toneDescription} tone
- Between 600-750 characters in length
- Engaging and optimized for local search
- Highlight the unique selling points prominently
- Include key services and products without being overly promotional
- Use detailed and descriptive language that paints a complete picture of the business
- Incorporate the business name (${businessName}) naturally into the description at least once
- The business name should be integrated smoothly and not feel forced

Label each description as "Description 1:", "Description 2:", etc.
`;
}

/**
 * Template-based description generators
 */
const generateProfessionalTemplate = (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): string => {
  const { businessName, categories, services, products, uniqueSellingPoints } = businessDetails;
  
  let tonalAdjectives = getTonalAdjectives(tone);
  
  return `At ${businessName}, we are ${categories.length > 0 ? `${categories[0]}` : 'a business'} specializing in ${services.slice(0, 3).join(', ')}${services.length > 3 ? ' and more' : ''}. Our ${tonalAdjectives[0]} team offers ${products.slice(0, 2).join(', ')}${products.length > 2 ? ' and other quality products' : ''}. What sets ${businessName} apart is our ${uniqueSellingPoints.slice(0, 2).join(' and ')}. We're committed to providing ${tonalAdjectives[1]} service to our community. Contact us today to experience the difference!`;
}

const generateServiceFocusedTemplate = (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): string => {
  const { businessName, categories, services, uniqueSellingPoints } = businessDetails;
  
  let tonalAdjectives = getTonalAdjectives(tone);
  
  return `Looking for ${tonalAdjectives[0]} ${categories.length > 0 ? categories[0] : 'service'}? ${businessName} provides ${services.slice(0, 3).join(', ')}${services.length > 3 ? ' and more' : ''}. With a focus on ${uniqueSellingPoints.slice(0, 2).join(' and ')}, our team delivers results you can count on. At ${businessName}, our approach is ${tonalAdjectives[1]} and customer-focused, ensuring you receive the best service possible. Reach out today to learn how we can help you!`;
}

const generateUniqueSellingPointsTemplate = (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): string => {
  const { businessName, categories, services, uniqueSellingPoints } = businessDetails;
  
  let tonalAdjectives = getTonalAdjectives(tone);
  
  return `${uniqueSellingPoints.length > 0 ? uniqueSellingPoints[0] : 'Quality service'} is at the heart of ${businessName}, your premier ${categories.length > 0 ? categories[0] : 'business'}. We're known for our ${tonalAdjectives[0]} approach to ${services.slice(0, 2).join(' and ')}. Whether you need ${services.length > 2 ? services[2] : 'assistance'} or ${tonalAdjectives[1]} solutions, the ${businessName} team is here to exceed your expectations. ${uniqueSellingPoints.length > 1 ? `We pride ourselves on ${uniqueSellingPoints[1]}.` : ''} Contact us to discover the difference ${businessName} can make for you.`;
}

/**
 * Get tonal adjectives based on the selected tone
 */
// Additional combined templates to create longer descriptions
const generateCombinedTemplate1 = (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): string => {
  const { businessName, categories, services, products, uniqueSellingPoints } = businessDetails;
  
  let tonalAdjectives = getTonalAdjectives(tone);
  
  return `Welcome to ${businessName}, your premier ${categories.length > 0 ? categories[0] : 'business'} specializing in comprehensive ${services.slice(0, 2).join(' and ')} services. 
  Our expert technicians at ${businessName} are dedicated to providing exceptional service with the highest quality ${products.slice(0, 2).join(', ')} 
  ${products.length > 2 ? `and other ${products[2]}` : 'and other products'} on the market. 
  What truly sets ${businessName} apart is our unwavering commitment to ${uniqueSellingPoints.slice(0, 1)} and our proud history as a 
  ${uniqueSellingPoints.length > 1 ? uniqueSellingPoints[1] : 'quality service provider'} deeply rooted in the community. 
  We understand that ${categories.length > 0 ? categories[0] : 'service'} needs don't follow a 9-to-5 schedule, 
  which is why our team is always ready to respond to your needs, day or night, weekends and holidays included. 
  With our ${tonalAdjectives[0]} approach to customer service and ${tonalAdjectives[1]} attention to detail, 
  ${businessName} has built a reputation for reliability, integrity, and skillful workmanship that stands the test of time. 
  Contact us today to experience the difference that professional, personalized service from ${businessName} can make for all your ${categories.length > 0 ? categories[0] : 'service'} needs!`;
}

const generateCombinedTemplate2 = (
  businessDetails: BusinessDetails,
  tone: DescriptionTone
): string => {
  const { businessName, categories, services, products, uniqueSellingPoints } = businessDetails;
  
  let tonalAdjectives = getTonalAdjectives(tone);
  
  return `Since establishing ${businessName} and our ${uniqueSellingPoints.length > 1 ? uniqueSellingPoints[1] : 'business'}, 
  we've been the trusted name in ${services.slice(0, 3).join(', ')} throughout the region. 
  At ${businessName}, our comprehensive approach combines technical expertise with exceptional customer service, 
  ensuring that every project is completed to the highest standards of quality and reliability. 
  What distinguishes ${businessName} from others is our unwavering commitment to ${uniqueSellingPoints.length > 0 ? uniqueSellingPoints[0] : 'quality service'}—offering 
  genuine support when you need it most—and our extensive catalog of premium ${products.join(', ')} 
  that allows us to handle projects of any scale or complexity. 
  Our technicians at ${businessName} undergo continuous training to stay current with the latest industry innovations and safety protocols, 
  ensuring that your home or business receives service that's both cutting-edge and thoroughly tested. 
  Having successfully completed thousands of jobs over our years of experience, 
  ${businessName} has developed ${tonalAdjectives[0]} processes that maximize efficiency without ever compromising on quality. 
  When you choose ${businessName}, you're not just hiring contractors—you're partnering with ${tonalAdjectives[1]} professionals 
  who take genuine pride in improving the comfort, safety, and functionality of your property. 
  Contact our friendly team today to schedule a consultation and experience firsthand the perfect blend of 
  traditional service values and modern technical expertise that only ${businessName} can provide!`;
}

const getTonalAdjectives = (tone: DescriptionTone): string[] => {
  switch (tone) {
    case 'professional':
      return ['expert', 'dependable', 'reliable'];
    case 'friendly':
      return ['welcoming', 'caring', 'personable'];
    case 'persuasive':
      return ['results-driven', 'proven', 'effective'];
    case 'informative':
      return ['knowledgeable', 'detailed', 'comprehensive'];
    case 'conversational':
      return ['approachable', 'genuine', 'straightforward'];
    default:
      return ['quality', 'excellent', 'dedicated'];
  }
}