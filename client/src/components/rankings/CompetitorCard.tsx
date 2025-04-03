import React from 'react';
import { motion } from 'framer-motion';
import { CompetitorDetails } from './competitor-types';
import { 
  Star, 
  Globe, 
  Award, 
  Tag, 
  Clock,
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompetitorCardProps {
  competitor: CompetitorDetails;
  isYourBusiness?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const CompetitorCard: React.FC<CompetitorCardProps> = ({
  competitor,
  isYourBusiness = false,
  isSelected = false,
  onClick
}) => {
  // Convert domain to a Google Maps URL
  const getMapsUrl = (businessName: string) => {
    return `https://www.google.com/maps/search/${encodeURIComponent(businessName)}`;
  };

  return (
    <motion.div
      className={`bg-gray-50 border rounded-lg p-4 hover:shadow-md transition-all ${
        isSelected ? 'border-2 border-[#F28C38] shadow-md' : ''
      }`}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-black">
          {competitor.name}
          {isYourBusiness && <span className="ml-2 text-xs bg-[#F28C38] text-white px-2 py-1 rounded-full">Your Business</span>}
        </h3>
        <div className={`h-3 w-3 rounded-full ${competitor.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-black">
          <Award className="h-4 w-4 text-[#F28C38] mr-2" />
          <span className="text-sm">Rank: <strong>{competitor.rank}</strong></span>
          <span className="mx-2">•</span>
          <span className="text-sm">Overlap: <strong>{competitor.overlap}%</strong></span>
        </div>
        
        <div className="flex items-center text-black">
          <Star className="h-4 w-4 text-[#F28C38] mr-2" />
          <span className="text-sm">{competitor.reviewCount} reviews</span>
          <span className="mx-2">•</span>
          <span className="text-sm">{competitor.averageRating.toFixed(1)}/5.0</span>
        </div>
        
        <div className="flex items-center text-black">
          <Tag className="h-4 w-4 text-[#F28C38] mr-2" />
          <span className="text-sm italic">{competitor.categories.join(', ')}</span>
        </div>
        
        <div className="flex items-center text-black">
          <Clock className="h-4 w-4 text-[#F28C38] mr-2" />
          <span className="text-sm">{competitor.isOpen ? 'Currently Open' : 'Currently Closed'}</span>
        </div>
        
        {competitor.website && (
          <div className="flex items-center text-black">
            <Globe className="h-4 w-4 text-[#F28C38] mr-2" />
            <span className="text-sm">Domain: <strong>{competitor.website.replace('https://', '')}</strong></span>
            <span className="mx-2">•</span>
            <span className="text-sm">Authority: <strong>{competitor.domainAuthority}</strong>/100</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-black">
          <span className="font-medium">{competitor.rankingKeywords}</span> ranking keywords
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center bg-white hover:bg-gray-50 text-black border-[#F28C38]"
          onClick={(e) => {
            e.stopPropagation();
            window.open(getMapsUrl(competitor.name), '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Profile
        </Button>
      </div>
    </motion.div>
  );
};

export default CompetitorCard;