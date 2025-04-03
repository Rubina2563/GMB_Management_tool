import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  Bell,
  Building,
  FileText,
  MessageSquare,
  Pencil
} from 'lucide-react';

export interface ActionItem {
  id: number;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  locationId: number | null;
  locationName: string;
  action: string;
  actionLink: string;
}

interface ActionCardsProps {
  actionCards?: ActionItem[];
  locationId?: number | null;
  priority?: 'high' | 'medium' | 'low' | 'all';
  maxItems?: number;
}

export default function ActionCards({ 
  actionCards = [], 
  locationId = null,
  priority = 'all',
  maxItems = 4
}: ActionCardsProps) {
  // Filter actions by selected location if needed
  const filteredActions = actionCards
    .filter(action => 
      !locationId || 
      action.locationId === locationId || 
      action.locationId === null
    )
    .filter(action => 
      priority === 'all' || action.priority === priority
    )
    .sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, maxItems);

  if (filteredActions.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2 text-[#F28C38]" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-gray-500">
          No recommended actions for the selected location.
        </CardContent>
      </Card>
    );
  }

  // Get icon based on action type
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <MessageSquare className="h-5 w-5" />;
      case 'post':
        return <Pencil className="h-5 w-5" />;
      case 'citation':
        return <Building className="h-5 w-5" />;
      case 'campaign':
        return <FileText className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get background color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Bell className="h-5 w-5 mr-2 text-[#F28C38]" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <motion.div
          className="divide-y"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredActions.map((action) => (
            <motion.div
              key={action.id}
              className="p-4 hover:bg-gray-50 transition-colors duration-200"
              variants={itemVariants}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-full ${getPriorityColor(action.priority)} mr-3`}>
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{action.description}</h3>
                  <div className="flex items-center mt-1 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-2">
                      {action.locationName}
                    </span>
                    <span className={`text-xs ${getPriorityColor(action.priority)} px-2 py-0.5 rounded`}>
                      {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)} Priority
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">
                      {action.impact.charAt(0).toUpperCase() + action.impact.slice(1)} Impact
                    </span>
                  </div>
                  <Link href={action.actionLink}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#F28C38] border-[#F28C38] hover:bg-[#F28C38]/10"
                    >
                      {action.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}