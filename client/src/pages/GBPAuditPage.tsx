import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { colors } from "@/lib/colors";
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion";
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';
import type { TooltipProps } from 'recharts';
import { 
  LineChart, 
  Line as RechartsLine, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  SearchIcon, 
  FileTextIcon, 
  ClipboardCheckIcon, 
  BarChart3Icon,
  ArrowUpRightIcon,
  DownloadIcon,
  ImageIcon,
  ActivityIcon,
  PhoneCallIcon,
  CompassIcon,
  GlobeIcon,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Flag,
  X,
  Info,
  InfoIcon,
  BarChart2Icon
} from 'lucide-react';
import { TimelineAnalysisContainer } from '@/components/audit/TimelineAnalysisContainer';
import { jsPDF } from 'jspdf';


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

export default function GBPAuditPage() {
  // State for GBP profiles and selection
  const [profiles, setProfiles] = useState<Array<{id: string; name: string; address: string; category: string}>>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [creditsLoading, setCreditsLoading] = useState<boolean>(true);
  const [credits, setCredits] = useState<number>(0);
  
  // Audit results state
  const [auditResult, setAuditResult] = useState<any>(null);
  const [insights, setInsights] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch GBP profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch('/api/client/gbp/select');
        const data = await response.json();
        
        if (data.success) {
          setProfiles(data.profiles);
          
          // Auto-select the first profile for demo purposes
          if (data.profiles.length > 0 && !selectedProfile) {
            setSelectedProfile(data.profiles[0].id);
          }
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch GBP profiles",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Failed to fetch GBP profiles:', error);
        toast({
          title: "Error",
          description: "Failed to connect to the server",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/client/gbp/credits');
        const data = await response.json();
        
        if (data.success) {
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setCreditsLoading(false);
      }
    };
    
    fetchProfiles();
    fetchCredits();
  }, [selectedProfile]);
  
  // Handle GBP profile selection
  const handleProfileChange = (value: string) => {
    setSelectedProfile(value);
    
    // Fetch the latest audit for this profile immediately
    if (value) {
      getLatestAudit(value);
    }
  };
  
  // Connect a new GBP
  const handleConnectGBP = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/client/gbp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorizationCode: 'mock-code' // In a real implementation, this would be from OAuth flow
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new GBP to the profiles list
        setProfiles(prev => [...prev, {
          id: data.gbp.id,
          name: data.gbp.name,
          address: data.gbp.address,
          category: data.gbp.category || 'Business'
        }]);
        
        toast({
          title: "GBP Connected Successfully",
          description: data.message || "New location has been added to your account.",
          style: { backgroundColor: colors.orange.base, color: 'white' },
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect GBP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to connect GBP:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load an existing audit if available on mount
  useEffect(() => {
    if (selectedProfile) {
      const fetchExistingAudit = async () => {
        try {
          const auditResponse = await fetch(`/api/client/gbp/audit/${selectedProfile}`);
          const auditData = await auditResponse.json();
          
          if (auditData.success && auditData.audit) {
            setAuditResult(auditData.audit);
            
            // Also fetch any insights
            const insightsResponse = await fetch(`/api/client/gbp/insights/${selectedProfile}`);
            const insightsData = await insightsResponse.json();
            
            if (insightsData.success) {
              setInsights(insightsData.insights || []);
            }
            
            setActiveTab("overview");
          }
        } catch (error) {
          console.error('Failed to fetch existing audit:', error);
        }
      };
      
      fetchExistingAudit();
    }
  }, [selectedProfile]);

  // Function to get the latest audit for the selected profile
  const getLatestAudit = async (profileId: string) => {
    try {
      console.log("Fetching latest audit for profile:", profileId);
      const auditResponse = await fetch(`/api/client/gbp/audit/${profileId}`);
      const auditData = await auditResponse.json();
      
      if (auditData.success && auditData.audit) {
        console.log("Successfully fetched audit data:", auditData.audit);
        setAuditResult(auditData.audit);
        
        // Also fetch insights for this profile
        const insightsResponse = await fetch(`/api/client/gbp/insights/${profileId}`);
        const insightsData = await insightsResponse.json();
        
        if (insightsData.success) {
          console.log("Successfully fetched insights:", insightsData.insights);
          setInsights(insightsData.insights || []);
        }
        
        // Set the active tab to overview
        setActiveTab("overview");
      } else {
        console.log("No audit data available or fetch unsuccessful:", auditData);
      }
    } catch (error) {
      console.error("Error fetching latest audit:", error);
    }
  };
  
  // Run an audit on the selected GBP
  const runAudit = async () => {
    if (!selectedProfile) {
      toast({
        title: "Selection Required",
        description: "Please select a GBP profile first.",
        variant: "destructive",
      });
      return;
    }
    
    if (credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to run an audit.",
        variant: "destructive",
      });
      return;
    }
    
    setAuditLoading(true);
    
    try {
      // Run the audit
      const auditResponse = await fetch('/api/client/gbp/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gbpId: selectedProfile
        })
      });
      
      const auditData = await auditResponse.json();
      
      if (!auditData.success) {
        throw new Error(auditData.message || "Failed to run audit");
      }
      
      // Get insights/history for the GBP
      const insightsResponse = await fetch(`/api/client/gbp/insights/${selectedProfile}`);
      const insightsData = await insightsResponse.json();
      
      if (!insightsData.success) {
        throw new Error(insightsData.message || "Failed to fetch insights");
      }
      
      // Update state with the data
      setAuditResult(auditData.audit);
      setInsights(insightsData.insights || []);
      setCredits(auditData.credits.remaining);
      setActiveTab("overview");
      
      toast({
        title: "Audit Complete",
        description: `Score: ${auditData.audit.overall_score}/100. ${auditData.credits.used} credit has been deducted.`,
        style: { backgroundColor: colors.orange.base, color: 'white' },
      });
      
      // Add console logging to help debug
      console.log("Audit result:", auditData.audit);
      console.log("Insights:", insightsData.insights);
    } catch (error) {
      console.error('Failed to run audit:', error);
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : "An error occurred while running the audit",
        variant: "destructive",
      });
    } finally {
      setAuditLoading(false);
    }
  };
  
  // Handle recommendation implementation
  const handleImplementRecommendation = async (recommendation: any) => {
    if (!selectedProfile) {
      toast({
        title: "Error",
        description: "No GBP profile selected",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real implementation, this would communicate with the API
      // to implement the recommendation on the GBP profile
      toast({
        title: "Implementation Started",
        description: `Working on: ${typeof recommendation.description === 'object' 
          ? (recommendation.description.suggestion || recommendation.description.text || JSON.stringify(recommendation.description)) 
          : recommendation.description}`,
        style: { backgroundColor: colors.orange.base, color: 'white' },
      });
      
      // For now, we'll simulate the implementation without an API call
      setTimeout(() => {
        toast({
          title: "Implementation Complete",
          description: `Successfully implemented: ${typeof recommendation.description === 'object' 
            ? (recommendation.description.suggestion || recommendation.description.text || JSON.stringify(recommendation.description)) 
            : recommendation.description}`,
          style: { backgroundColor: '#4CAF50', color: 'white' },
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to implement recommendation:', error);
      toast({
        title: "Implementation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Generate PDF report
  const generatePDF = () => {
    if (!auditResult) {
      toast({
        title: "No Audit Available",
        description: "Please run an audit first before generating a PDF report.",
        variant: "destructive",
      });
      return;
    }
    
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("GBP Audit Report", 20, 20);
    
    doc.setFontSize(16);
    doc.text(`Business: ${auditResult?.details?.business?.name || "Not available"}`, 20, 35);
    
    doc.setFontSize(14);
    doc.text(`Overall Score: ${auditResult?.overall_score || 0}/100`, 20, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60);
    
    doc.setFontSize(12);
    doc.text("Category Scores:", 20, 75);
    doc.text(`Business Details: ${auditResult?.business_details_score || 0}/100`, 30, 85);
    doc.text(`Reviews: ${auditResult?.reviews_score || 0}/100`, 30, 95);
    doc.text(`Posts: ${auditResult?.posts_score || 0}/100`, 30, 105);
    doc.text(`Competitors: ${auditResult?.competitors_score || 0}/100`, 30, 115);
    
    doc.text("Top Recommendations:", 20, 130);
    if (auditResult?.recommendations && auditResult.recommendations.length > 0) {
      auditResult.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
        const descText = typeof rec.description === 'object' 
          ? (rec.description.suggestion || rec.description.text || JSON.stringify(rec.description))
          : rec.description;
        doc.text(`${index + 1}. ${descText} (${rec.priority} priority)`, 30, 140 + (index * 10));
      });
    } else {
      doc.text("No recommendations available", 30, 140);
    }
    
    doc.save("gbp-audit-report.pdf");
    
    toast({
      title: "PDF Generated",
      description: "Your audit report has been downloaded.",
      style: { backgroundColor: colors.orange.base, color: 'white' },
    });
    
    console.log("PDF generated with audit data:", auditResult);
  };
  
  // Animation ref for scroll into view effects
  const interactiveProgressRef = useRef(null);
  const isInView = useInView(interactiveProgressRef, { once: false, amount: 0.3 });
  const progressAnimationControls = useAnimation();
  
  // Effect to trigger animations when in view
  useEffect(() => {
    if (isInView) {
      progressAnimationControls.start('visible');
    } else {
      progressAnimationControls.start('hidden');
    }
  }, [isInView, progressAnimationControls]);
  
  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';  // Green
    if (score >= 60) return colors.orange.base;
    return colors.accent.red;
  };
  
  // Get the emoji feedback based on score
  const getEmojiForScore = (score: number) => {
    if (score >= 90) return '🎯';  // Excellent
    if (score >= 80) return '🚀';  // Great
    if (score >= 70) return '👍';  // Good
    if (score >= 60) return '😊';  // Satisfactory
    if (score >= 50) return '🤔';  // Average
    if (score >= 40) return '😐';  // Needs improvement
    if (score >= 30) return '😬';  // Concerning
    return '😱';  // Critical
  };
  
  // Interactive Campaign Metrics Component
  const InteractiveCampaignMetrics = ({ metrics }: { metrics: any }) => {
    const [activeMetric, setActiveMetric] = useState<string | null>(null);
    
    return (
      <motion.div 
        ref={interactiveProgressRef}
        initial="hidden"
        animate={progressAnimationControls}
        className="mt-6 p-4 bg-white rounded-lg shadow border"
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text.dark }}>
          Interactive Campaign Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["calls", "website_clicks", "direction_requests"].map((metricKey) => {
            const metric = metrics?.[metricKey] || { current: 0, change_percent: 0 };
            const isActive = activeMetric === metricKey;
            
            return (
              <motion.div
                key={metricKey}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-orange-500' : ''}`}
                style={{ 
                  backgroundColor: isActive ? colors.orange.base + '10' : colors.background.light,
                  borderColor: colors.text.secondary + '30',
                  border: '1px solid'
                }}
                onClick={() => setActiveMetric(isActive ? null : metricKey)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      duration: 0.5,
                      delay: ["calls", "website_clicks", "direction_requests"].indexOf(metricKey) * 0.1
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize" style={{ color: colors.text.dark }}>
                    {metricKey.replace('_', ' ')}
                  </h4>
                  {metricKey === "calls" && <PhoneCallIcon className="h-5 w-5" style={{ color: colors.orange.base }} />}
                  {metricKey === "website_clicks" && <GlobeIcon className="h-5 w-5" style={{ color: colors.blue.base }} />}
                  {metricKey === "direction_requests" && <CompassIcon className="h-5 w-5" style={{ color: colors.green.base }} />}
                </div>
                
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold mr-2" style={{ color: colors.text.dark }}>
                    {metric.current}
                  </span>
                  <div className={`text-sm font-medium ${metric.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change_percent >= 0 ? '+' : ''}{metric.change_percent}%
                  </div>
                </div>
                
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    {/* Trend mini-chart */}
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metric.trend || []}>
                          <RechartsLine
                            type="monotone"
                            dataKey="value"
                            stroke={
                              metricKey === "calls" ? colors.orange.base : 
                              metricKey === "website_clicks" ? colors.blue.base : 
                              colors.green.base
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="text-sm mt-2" style={{ color: colors.text.secondary }}>
                      <div className="flex justify-between">
                        <span>30 days ago</span>
                        <span>Today</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm" style={{ color: colors.text.dark }}>
                      <div className="flex items-center">
                        {metric.change_percent >= 10 ? (
                          <CheckCircle size={14} className="mr-1 text-green-500" />
                        ) : metric.change_percent >= 0 ? (
                          <AlertCircle size={14} className="mr-1 text-amber-500" />
                        ) : (
                          <AlertTriangle size={14} className="mr-1 text-red-500" />
                        )}
                        {metric.change_percent >= 10 ? 
                          "Strong growth! Keep up the good work." : 
                          metric.change_percent >= 0 ? 
                          "Stable performance. Look for growth opportunities." : 
                          "Declining trend. Immediate attention required."}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.accent.red;
      case 'medium':
        return colors.orange.base;
      case 'low':
        return '#4CAF50';  // Green
      default:
        return colors.orange.base;
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business':
        return <SearchIcon className="h-5 w-5" />;
      case 'reviews':
        return <FileTextIcon className="h-5 w-5" />;
      case 'posts':
        return <ClipboardCheckIcon className="h-5 w-5" />;
      case 'competitors':
        return <BarChart3Icon className="h-5 w-5" />;
      case 'performance':
        return <ActivityIcon className="h-5 w-5" />;
      default:
        return <SearchIcon className="h-5 w-5" />;
    }
  };
  
  // Prepare insights chart data
  const getChartData = () => {
    if (!insights || insights.length === 0) return null;
    
    const sortedInsights = [...insights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const labels = sortedInsights.map(insight => {
      const date = new Date(insight.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Overall Score',
          data: sortedInsights.map(insight => insight.score),
          borderColor: '#6B5B95',
          backgroundColor: 'rgba(107, 91, 149, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: '#6B5B95',
          pointRadius: 4,
        },
        {
          label: 'Business Details',
          data: sortedInsights.map(insight => insight.category_scores.business_details),
          borderColor: colors.orange.base,
          backgroundColor: 'rgba(242, 140, 56, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: colors.orange.base,
          pointRadius: 3,
        },
        {
          label: 'Reviews',
          data: sortedInsights.map(insight => insight.category_scores.reviews),
          borderColor: '#4CAF50', // Green
          backgroundColor: 'rgba(85, 188, 144, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#4CAF50', // Green
          pointRadius: 3,
        },
        {
          label: 'Posts',
          data: sortedInsights.map(insight => insight.category_scores.posts),
          borderColor: '#2196F3', // Blue
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#2196F3', // Blue
          pointRadius: 3,
        },
        {
          label: 'Performance',
          data: sortedInsights.map(insight => insight.category_scores.performance || 0),
          borderColor: '#9C27B0', // Purple
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#9C27B0', // Purple
          pointRadius: 3,
        },
      ]
    };
  };
  
  const chartData = getChartData();
  
  // Prepare chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: colors.text.dark,
        bodyColor: colors.text.dark,
        borderColor: colors.text.secondary + '30',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        titleFont: {
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: colors.text.dark,
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: colors.text.secondary + '20',
        },
        ticks: {
          color: colors.text.dark,
          callback: function(this: any, value: string | number) { return value.toString(); },
        }
      },
    },
  };

  // Tooltip content render for RechartsTooltip
  const renderRechartsTooltip = (props: any) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white shadow-lg rounded-md border" style={{ borderColor: colors.text.secondary + '30' }}>
          <p className="text-sm font-medium mb-1" style={{ color: colors.text.dark }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 my-1">
              <div className="w-3 h-3" style={{ backgroundColor: entry.color }} />
              <p className="text-xs" style={{ color: colors.text.dark }}>
                {entry.name}: {entry.value}
              </p>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="w-full pl-[70px] pr-[150px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text.dark }}>GBP Audit</h1>
        <p style={{ color: colors.text.secondary }}>
          Evaluate and enhance your Google Business Profile presence
        </p>
      </div>
      
      <div className="mb-6">
        <Card style={{ 
          background: colors.background.white,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: `1px solid ${colors.text.secondary}20`
        }}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle style={{ color: colors.text.dark }}>Select GBP Profile</CardTitle>
              {!creditsLoading && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm" style={{ 
                  backgroundColor: colors.orange.light, 
                  color: colors.orange.base
                }}>
                  <span>{credits} {credits === 1 ? 'Credit' : 'Credits'}</span>
                </div>
              )}
            </div>
            <CardDescription style={{ color: colors.text.dark }}>
              Choose a GBP profile to audit or connect a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select 
                  value={selectedProfile} 
                  onValueChange={handleProfileChange}
                  disabled={loading}
                >
                  <SelectTrigger style={{ 
                    borderColor: colors.text.secondary + '50', 
                    color: colors.text.dark,
                    backgroundColor: colors.background.white
                  }}>
                    <SelectValue placeholder="Select a GBP profile" />
                  </SelectTrigger>
                  <SelectContent style={{ 
                    backgroundColor: colors.background.white,
                    borderColor: colors.text.secondary + '30'
                  }}>
                    {profiles.map(profile => (
                      <SelectItem 
                        key={profile.id} 
                        value={profile.id}
                        style={{ color: colors.text.dark }}
                      >
                        {profile.name} - {profile.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={loading}
                  onClick={handleConnectGBP}
                  style={{ 
                    borderColor: colors.orange.base, 
                    color: colors.orange.base,
                    backgroundColor: 'transparent'
                  }}
                  className="flex-shrink-0"
                >
                  Connect New GBP
                </Button>
                
                <Button
                  disabled={!selectedProfile || auditLoading || credits < 1}
                  onClick={runAudit}
                  style={{ 
                    backgroundColor: colors.orange.base,
                    color: 'white'
                  }}
                  className="flex-shrink-0 hover:bg-[#F5A461] mr-2"
                >
                  {auditLoading ? 'Running Audit...' : 'Run Audit'}
                </Button>
                
                {/* Download Report button removed as requested */}
              </div>
            </div>
            
            {/* Horizontal Overall Score Section */}
            {auditResult && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.text.secondary + '20' }}>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                      background: `conic-gradient(${getScoreColor(auditResult.overall_score)} ${auditResult.overall_score}%, #f3f4f6 0)`,
                      boxShadow: 'inset 0 0 0 5px white'
                    }}>
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: getScoreColor(auditResult.overall_score) }}>
                          {auditResult.overall_score}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm uppercase tracking-wider opacity-70" style={{ color: colors.text.dark }}>
                        Overall Score
                      </div>
                      <div className="text-sm" style={{ color: colors.text.secondary }}>
                        {auditResult.overall_score >= 80 ? 'Excellent' : 
                        auditResult.overall_score >= 60 ? 'Good' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-2 rounded-md" style={{ backgroundColor: colors.background.light }}>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                        Reviews
                      </div>
                      <div className="text-lg font-medium" style={{ color: getScoreColor(auditResult.reviews_score) }}>
                        {auditResult.reviews_score}
                      </div>
                    </div>
                    <div className="p-2 rounded-md" style={{ backgroundColor: colors.background.light }}>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                        Posts
                      </div>
                      <div className="text-lg font-medium" style={{ color: getScoreColor(auditResult.posts_score) }}>
                        {auditResult.posts_score}
                      </div>
                    </div>
                    <div className="p-2 rounded-md" style={{ backgroundColor: colors.background.light }}>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                        Info
                      </div>
                      <div className="text-lg font-medium" style={{ color: getScoreColor(auditResult.business_info_score) }}>
                        {auditResult.business_info_score}
                      </div>
                    </div>
                    <div className="p-2 rounded-md" style={{ backgroundColor: colors.background.light }}>
                      <div className="text-xs uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                        Photos
                      </div>
                      <div className="text-lg font-medium" style={{ color: getScoreColor(auditResult.photos_score) }}>
                        {auditResult.photos_score}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Top Actions Section - Placed before the tabs */}
      {auditResult && auditResult.recommendations && auditResult.recommendations.length > 0 && (
        <div className="mb-6">
          <Card style={{ 
            background: colors.background.white,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.text.secondary}20`
          }}>
            <CardHeader>
              <CardTitle style={{ color: colors.text.dark }}>Top Actions</CardTitle>
              <CardDescription style={{ color: colors.text.dark }}>
                Priority recommendations that will improve your GBP performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auditResult.recommendations.slice(0, 3).map((rec: any, index: number) => (
                  <div 
                    key={index}
                    className="p-3 rounded-md"
                    style={{
                      backgroundColor: colors.background.light,
                      borderLeft: `4px solid ${getPriorityColor(rec.priority)}`
                    }}
                  >
                    <div className="font-medium text-sm mb-2" style={{ color: colors.text.dark }}>
                      {typeof rec.description === 'object' 
                        ? (rec.description.suggestion || rec.description.text || JSON.stringify(rec.description)) 
                        : rec.description}
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge style={{
                        backgroundColor: getPriorityColor(rec.priority) + '20',
                        color: getPriorityColor(rec.priority),
                        border: `1px solid ${getPriorityColor(rec.priority)}`
                      }}>
                        {rec.priority} priority
                      </Badge>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        style={{ color: colors.orange.base }}
                        className="text-xs"
                      >
                        Fix Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {auditResult && (
        <Tabs 
          defaultValue="overview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="mb-6 bg-transparent border-b w-full justify-start rounded-none" style={{ borderColor: colors.text.secondary + '30' }}>
            <TabsTrigger 
              value="overview"
              style={{ 
                color: activeTab === 'overview' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'overview' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="business-info"
              style={{ 
                color: activeTab === 'business-info' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'business-info' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Business Info
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              style={{ 
                color: activeTab === 'reviews' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'reviews' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              style={{ 
                color: activeTab === 'posts' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'posts' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="photos"
              style={{ 
                color: activeTab === 'photos' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'photos' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              style={{ 
                color: activeTab === 'performance' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'performance' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations"
              style={{ 
                color: activeTab === 'recommendations' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'recommendations' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                marginRight: '0.5rem',
              }}
            >
              Recommendations
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              style={{ 
                color: activeTab === 'insights' ? 'white' : colors.text.dark,
                backgroundColor: activeTab === 'insights' ? colors.orange.base : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
              }}
            >
              Insights
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }}>Business Overview</CardTitle>
                    <CardDescription style={{ color: colors.text.dark }}>
                      Key information and status of your GBP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                          {auditResult.details.business.name}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                            </div>
                            <div style={{ color: colors.text.dark }}>
                              {auditResult.details.business.address}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                            </div>
                            <div style={{ color: colors.text.dark }}>
                              {auditResult.details.business.phone}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                              </svg>
                            </div>
                            <div style={{ color: colors.text.dark }}>
                              <a 
                                href={auditResult.details.business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {auditResult.details.business.website}
                              </a>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                <line x1="4" y1="22" x2="4" y2="15"></line>
                              </svg>
                            </div>
                            <div className="flex items-center" style={{ color: colors.text.dark }}>
                              <span className="font-medium">Place ID:</span>
                              <span className="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                                {auditResult.gbp_id}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                            </div>
                            <div style={{ color: colors.text.dark }}>
                              {auditResult.details.business.category}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Key audit scores */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                          Key Areas
                        </h3>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: colors.text.dark }}>Reviews Score</span>
                            <span style={{ color: getScoreColor(auditResult.reviews_score) }}>
                              {auditResult.reviews_score}/100
                            </span>
                          </div>
                          <Progress 
                            value={auditResult.reviews_score} 
                            className="h-2" 
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              '--progress-foreground': getScoreColor(auditResult.reviews_score)
                            } as React.CSSProperties}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: colors.text.dark }}>Posts Score</span>
                            <span style={{ color: getScoreColor(auditResult.posts_score) }}>
                              {auditResult.posts_score}/100
                            </span>
                          </div>
                          <Progress 
                            value={auditResult.posts_score} 
                            className="h-2" 
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              '--progress-foreground': getScoreColor(auditResult.posts_score)
                            } as React.CSSProperties}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: colors.text.dark }}>Business Info Score</span>
                            <span style={{ color: getScoreColor(auditResult.business_info_score) }}>
                              {auditResult.business_info_score}/100
                            </span>
                          </div>
                          <Progress 
                            value={auditResult.business_info_score} 
                            className="h-2" 
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              '--progress-foreground': getScoreColor(auditResult.business_info_score)
                            } as React.CSSProperties}
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: colors.text.dark }}>Photos Score</span>
                            <span style={{ color: getScoreColor(auditResult.photos_score) }}>
                              {auditResult.photos_score}/100
                            </span>
                          </div>
                          <Progress 
                            value={auditResult.photos_score} 
                            className="h-2" 
                            style={{ 
                              backgroundColor: '#f3f4f6',
                              '--progress-foreground': getScoreColor(auditResult.photos_score)
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }}>Top Actions</CardTitle>
                    <CardDescription style={{ color: colors.text.dark }}>
                      Priority recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditResult.recommendations.slice(0, 3).map((rec: any, index: number) => (
                        <div 
                          key={index}
                          className="p-3 rounded-md"
                          style={{
                            backgroundColor: colors.background.light,
                            borderLeft: `4px solid ${getPriorityColor(rec.priority)}`
                          }}
                        >
                          <div className="font-medium mb-1" style={{ color: colors.text.dark }}>
                            {typeof rec.description === 'object' 
                              ? (rec.description.suggestion || rec.description.text || JSON.stringify(rec.description)) 
                              : rec.description}
                          </div>
                          <div className="flex justify-between items-center">
                            <Badge style={{
                              backgroundColor: getPriorityColor(rec.priority) + '20',
                              color: getPriorityColor(rec.priority),
                              border: `1px solid ${getPriorityColor(rec.priority)}`
                            }}>
                              {rec.priority} priority
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              style={{ color: colors.orange.base }}
                              onClick={() => {
                                setActiveTab("recommendations");
                              }}
                            >
                              View details
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        style={{ 
                          borderColor: colors.orange.base, 
                          color: colors.orange.base
                        }}
                        onClick={() => {
                          setActiveTab("recommendations");
                        }}
                      >
                        View All Recommendations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="md:col-span-1">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`,
                  height: '100%'
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }}>Review Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Total Reviews</span>
                        <span className="font-bold" style={{ color: colors.text.dark }}>
                          {auditResult.details.reviews.count}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Average Rating</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold" style={{ color: colors.text.dark }}>
                            {auditResult.details.reviews.average_rating}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Response Rate</span>
                        <span className="font-bold" style={{ color: Number(auditResult.details.reviews.response_rate) >= 80 ? '#4CAF50' : colors.orange.base }}>
                          {auditResult.details.reviews.response_rate}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Spam Detected</span>
                        <Badge style={{
                          backgroundColor: auditResult.details.reviews.spam_reviews?.length > 0 ? 
                            colors.accent.red + '20' : '#4CAF5020',
                          color: auditResult.details.reviews.spam_reviews?.length > 0 ? 
                            colors.accent.red : '#4CAF50',
                        }}>
                          {auditResult.details.reviews.spam_reviews?.length || 0}
                        </Badge>
                      </div>
                      
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        style={{ 
                          borderColor: colors.orange.base, 
                          color: colors.orange.base
                        }}
                        onClick={() => {
                          setActiveTab("reviews");
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`,
                  height: '100%'
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }}>Photo Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Total Photos</span>
                        <span className="font-bold" style={{ color: colors.text.dark }}>
                          {auditResult.details.photos.total_count}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Coverage Score</span>
                        <span className="font-bold" style={{ color: getScoreColor(auditResult.details.photos.coverage_score) }}>
                          {auditResult.details.photos.coverage_score}/100
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Business Uploaded</span>
                        <span className="font-bold" style={{ color: colors.text.dark }}>
                          {auditResult.details.photos.business_uploaded}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>User Uploaded</span>
                        <span className="font-bold" style={{ color: colors.text.dark }}>
                          {auditResult.details.photos.user_uploaded}
                        </span>
                      </div>
                      
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        style={{ 
                          borderColor: colors.orange.base, 
                          color: colors.orange.base
                        }}
                        onClick={() => {
                          setActiveTab("photos");
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`,
                  height: '100%'
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }}>Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Website Clicks</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold" style={{ color: colors.text.dark }}>
                            {auditResult.details.performance.website_clicks.current}
                          </span>
                          <span className="text-xs" style={{ 
                            color: auditResult.details.performance.website_clicks.change_percent >= 0 ? 
                              '#4CAF50' : colors.accent.red
                          }}>
                            {auditResult.details.performance.website_clicks.change_percent >= 0 ? '+' : ''}
                            {auditResult.details.performance.website_clicks.change_percent}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Calls</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold" style={{ color: colors.text.dark }}>
                            {auditResult.details.performance.calls.current}
                          </span>
                          <span className="text-xs" style={{ 
                            color: auditResult.details.performance.calls.change_percent >= 0 ? 
                              '#4CAF50' : colors.accent.red
                          }}>
                            {auditResult.details.performance.calls.change_percent >= 0 ? '+' : ''}
                            {auditResult.details.performance.calls.change_percent}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Direction Requests</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold" style={{ color: colors.text.dark }}>
                            {auditResult.details.performance.direction_requests.current}
                          </span>
                          <span className="text-xs" style={{ 
                            color: auditResult.details.performance.direction_requests.change_percent >= 0 ? 
                              '#4CAF50' : colors.accent.red
                          }}>
                            {auditResult.details.performance.direction_requests.change_percent >= 0 ? '+' : ''}
                            {auditResult.details.performance.direction_requests.change_percent}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span style={{ color: colors.text.dark }}>Messages</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold" style={{ color: colors.text.dark }}>
                            {auditResult.details.performance.messages.current}
                          </span>
                          <span className="text-xs" style={{ 
                            color: auditResult.details.performance.messages.change_percent >= 0 ? 
                              '#4CAF50' : colors.accent.red
                          }}>
                            {auditResult.details.performance.messages.change_percent >= 0 ? '+' : ''}
                            {auditResult.details.performance.messages.change_percent}%
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        style={{ 
                          borderColor: colors.orange.base, 
                          color: colors.orange.base
                        }}
                        onClick={() => {
                          setActiveTab("performance");
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{ 
                background: colors.background.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.text.secondary}20`
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle style={{ color: colors.text.dark }}>
                      Review Analysis
                    </CardTitle>
                    <Badge
                      style={{
                        backgroundColor: getScoreColor(auditResult.reviews_score) + '20',
                        color: getScoreColor(auditResult.reviews_score)
                      }}
                    >
                      Score: {auditResult.reviews_score}/100
                    </Badge>
                  </div>
                  <CardDescription style={{ color: colors.text.dark }}>
                    Breakdown of your Google reviews presence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                          Overview
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <span className="w-48" style={{ color: colors.text.dark }}>Total Reviews</span>
                            <span className="font-bold" style={{ color: colors.text.dark }}>
                              10
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-48" style={{ color: colors.text.dark }}>Average Rating</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold" style={{ color: colors.text.dark }}>
                                3.6
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-48" style={{ color: colors.text.dark }}>Response Rate</span>
                            <span className="font-bold" style={{ 
                              color: Number(20) >= 80 ? 
                                '#4CAF50' : colors.orange.base 
                            }}>
                              20%
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-48" style={{ color: colors.text.dark }}>Average Response Time</span>
                            <span className="font-bold" style={{ 
                              color: 24 <= 24 ? 
                                '#4CAF50' : colors.orange.base 
                            }}>
                              24 hours
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="w-48" style={{ color: colors.text.dark }}>Recent Reviews (30d)</span>
                            <span className="font-bold" style={{ color: colors.text.dark }}>
                              2
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                          Rating Distribution
                        </h3>
                        <div className="space-y-3">
                          {/* Static rating distribution as requested */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-10">
                              <span style={{ color: colors.text.dark }}>5</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ 
                                  width: "30%",
                                  backgroundColor: '#4CAF50'
                                }}
                              />
                            </div>
                            <div className="w-10 text-left" style={{ color: colors.text.dark }}>
                              3
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-10">
                              <span style={{ color: colors.text.dark }}>4</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ 
                                  width: "20%",
                                  backgroundColor: '#4CAF50'
                                }}
                              />
                            </div>
                            <div className="w-10 text-left" style={{ color: colors.text.dark }}>
                              2
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-10">
                              <span style={{ color: colors.text.dark }}>3</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ 
                                  width: "30%",
                                  backgroundColor: colors.orange.base
                                }}
                              />
                            </div>
                            <div className="w-10 text-left" style={{ color: colors.text.dark }}>
                              3
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-10">
                              <span style={{ color: colors.text.dark }}>2</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ 
                                  width: "10%",
                                  backgroundColor: colors.accent.red
                                }}
                              />
                            </div>
                            <div className="w-10 text-left" style={{ color: colors.text.dark }}>
                              1
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-10">
                              <span style={{ color: colors.text.dark }}>1</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </div>
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ 
                                  width: "10%",
                                  backgroundColor: colors.accent.red
                                }}
                              />
                            </div>
                            <div className="w-10 text-left" style={{ color: colors.text.dark }}>
                              1
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                            Sentiment Analysis
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-md" style={{ 
                              backgroundColor: colors.background.light,
                              borderLeft: '4px solid #4CAF50'
                            }}>
                              <div className="text-sm uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                                Positive
                              </div>
                              <div className="text-xl font-medium" style={{ color: '#4CAF50' }}>
                                {auditResult.details.reviews.sentiment?.distribution?.positive || 0}%
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-md" style={{ 
                              backgroundColor: colors.background.light,
                              borderLeft: `4px solid ${colors.orange.base}`
                            }}>
                              <div className="text-sm uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                                Neutral
                              </div>
                              <div className="text-xl font-medium" style={{ color: colors.orange.base }}>
                                {auditResult.details.reviews.sentiment?.distribution?.neutral || 0}%
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-md" style={{ 
                              backgroundColor: colors.background.light,
                              borderLeft: `4px solid ${colors.accent.red}`
                            }}>
                              <div className="text-sm uppercase tracking-wider opacity-70 mb-1" style={{ color: colors.text.dark }}>
                                Negative
                              </div>
                              <div className="text-xl font-medium" style={{ color: colors.accent.red }}>
                                {auditResult.details.reviews.sentiment?.distribution?.negative || 0}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.dark }}>
                            Key Phrases Identified
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm font-medium mb-2" style={{ color: '#4CAF50' }}>
                                Positive Mentions
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {auditResult.details.reviews.sentiment?.key_phrases?.positive?.map((phrase: string, index: number) => (
                                  <Badge key={index} style={{
                                    backgroundColor: '#4CAF5020',
                                    color: '#4CAF50',
                                    border: '1px solid #4CAF50'
                                  }}>
                                    {phrase}
                                  </Badge>
                                )) || <span className="text-xs text-gray-500">No positive phrases found</span>}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium mb-2" style={{ color: colors.orange.base }}>
                                Neutral Mentions
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {auditResult.details.reviews.sentiment?.key_phrases?.neutral?.map((phrase: string, index: number) => (
                                  <Badge key={index} style={{
                                    backgroundColor: colors.orange.base + '20',
                                    color: colors.orange.base,
                                    border: `1px solid ${colors.orange.base}`
                                  }}>
                                    {phrase}
                                  </Badge>
                                )) || <span className="text-xs text-gray-500">No neutral phrases found</span>}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium mb-2" style={{ color: colors.accent.red }}>
                                Negative Mentions
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {auditResult.details.reviews.sentiment?.key_phrases?.negative?.map((phrase: string, index: number) => (
                                  <Badge key={index} style={{
                                    backgroundColor: colors.accent.red + '20',
                                    color: colors.accent.red,
                                    border: `1px solid ${colors.accent.red}`
                                  }}>
                                    {phrase}
                                  </Badge>
                                )) || <span className="text-xs text-gray-500">No negative phrases found</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Removed duplicate Review Timeline Analysis component */}
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-6"
              >
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`
                }}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle style={{ color: colors.text.dark }}>Spam Review Detection</CardTitle>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: "#FF5722",
                          color: "white",
                        }}
                      >
                        Fraud Guard
                      </Badge>
                    </div>
                    <CardDescription style={{ color: colors.text.dark }}>
                      AI-powered detection of suspicious review activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditResult.details.reviews.spam_reviews && auditResult.details.reviews.spam_reviews.length > 0 ? (
                      <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div className="text-sm font-medium" style={{ color: colors.text.dark }}>
                          {auditResult.details.reviews.spam_reviews.length} potentially fraudulent {auditResult.details.reviews.spam_reviews.length === 1 ? 'review' : 'reviews'} detected
                        </div>
                      </div>
                    
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b" style={{ color: colors.text.dark }}>
                              <th className="py-2 px-4 text-left font-medium">Reviewer</th>
                              <th className="py-2 px-4 text-left font-medium">Flag Reason</th>
                              <th className="py-2 px-4 text-left font-medium">Confidence</th>
                              <th className="py-2 px-4 text-left font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditResult.details.reviews.spam_reviews.map((spam: any, index: number) => (
                              <tr key={index} className="border-b" style={{ color: colors.text.dark }}>
                                <td className="py-3 px-4">{spam.reviewer_name}</td>
                                <td className="py-3 px-4">{spam.flag_reason}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full bg-red-500" 
                                        style={{ width: `${spam.flag_confidence}%` }}
                                      />
                                    </div>
                                    <span>{spam.flag_confidence}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                      <Flag className="h-4 w-4 mr-1" />
                                      Report
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <X className="h-4 w-4 mr-1" />
                                      Ignore
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <div className="text-sm font-medium" style={{ color: colors.text.dark }}>
                            Recommendations
                          </div>
                        </div>
                        <ul className="mt-2 list-disc list-inside" style={{ color: colors.text.dark }}>
                          <li>Report suspicious reviews to Google for removal</li>
                          <li>Respond professionally to explain your business practices</li>
                          <li>Encourage legitimate customers to leave authentic reviews</li>
                          <li>Monitor regularly for new spam reviews that could harm your reputation</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="text-lg font-medium mb-1" style={{ color: colors.text.dark }}>
                        No spam reviews detected
                      </div>
                      <div className="text-sm text-center max-w-lg" style={{ color: colors.text.secondary }}>
                        Our AI-powered system has analyzed your reviews and found no signs of suspicious activity. 
                        We'll continue monitoring for potential spam reviews.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Timeline Analysis for Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6"
            >
              <TimelineAnalysisContainer 
                locationId={auditResult.gbp_id}
                dataType="reviews"
                title="Review Timeline Analysis"
                description="Analyze how your reviews trend over time compared to competitors"
                keyInsights={
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium mb-2 text-black">
                      Key Insights:
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-black">
                      <li>Your review volume has fluctuated over the past 6 months with an average of 5.8 reviews per month</li>
                      <li>Competitors are averaging 31.5 total reviews, which is 215% more than your business</li>
                      <li>Competitor B has the highest review count (47) and rating (4.7), making them the market leader</li>
                      <li>February 2024 was your strongest month with 8 new reviews</li>
                      <li>Consider implementing a review request strategy to increase monthly review volume</li>
                    </ul>
                  </div>
                }
              />
            </motion.div>
          </TabsContent>
          
          {/* Posts Tab */}
          <TabsContent value="posts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{ 
                background: colors.background.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.text.secondary}20`
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle style={{ color: colors.text.dark }}>
                      Posts Analysis
                    </CardTitle>
                    <Badge style={{ 
                      backgroundColor: getScoreColor(auditResult.posts_score), 
                      color: 'white' 
                    }}>
                      {auditResult.posts_score}/100
                    </Badge>
                  </div>
                  <CardDescription style={{ color: colors.text.dark }}>
                    Analysis of your Google Business Profile posts and content strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Posting Frequency</h3>
                        <div className="flex items-center">
                          <span className="text-3xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.posts?.posts?.length || 0}
                          </span>
                          <span className="ml-2 text-sm" style={{ color: colors.text.secondary }}>
                            posts in the last 90 days
                          </span>
                        </div>
                        <div className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                          {auditResult.details?.posts?.post_frequency === 'low' ? (
                            <div className="flex items-center text-red-500">
                              <AlertTriangle size={14} className="mr-1" />
                              Low frequency - aim for weekly posts
                            </div>
                          ) : auditResult.details?.posts?.post_frequency === 'medium' ? (
                            <div className="flex items-center text-amber-500">
                              <AlertCircle size={14} className="mr-1" />
                              Medium frequency - consider increasing to 2x weekly
                            </div>
                          ) : (
                            <div className="flex items-center text-green-500">
                              <CheckCircle size={14} className="mr-1" />
                              Good posting frequency
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Content Variety</h3>
                        <div className="flex items-center">
                          <span className="text-3xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.posts?.content_variety || 'Low'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                          {auditResult.details?.posts?.content_variety === 'Low' ? (
                            <div className="flex items-center text-red-500">
                              <AlertTriangle size={14} className="mr-1" />
                              Use more updates, offers, and events
                            </div>
                          ) : auditResult.details?.posts?.content_variety === 'Medium' ? (
                            <div className="flex items-center text-amber-500">
                              <AlertCircle size={14} className="mr-1" />
                              Good mix, add more multimedia content
                            </div>
                          ) : (
                            <div className="flex items-center text-green-500">
                              <CheckCircle size={14} className="mr-1" />
                              Excellent content variety
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Keyword Usage</h3>
                        <div className="flex items-center">
                          <span className="text-3xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.posts?.keyword_coverage || 'Low'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                          {auditResult.details?.posts?.keyword_coverage === 'Low' ? (
                            <div className="flex items-center text-red-500">
                              <AlertTriangle size={14} className="mr-1" />
                              Include more relevant keywords in posts
                            </div>
                          ) : auditResult.details?.posts?.keyword_coverage === 'Medium' ? (
                            <div className="flex items-center text-amber-500">
                              <AlertCircle size={14} className="mr-1" />
                              Good use of keywords, more variety needed
                            </div>
                          ) : (
                            <div className="flex items-center text-green-500">
                              <CheckCircle size={14} className="mr-1" />
                              Excellent keyword integration
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-medium" style={{ color: colors.text.dark }}>Recent Posts</h3>
                    <div className="space-y-4">
                      {auditResult.details?.posts?.posts?.slice(0, 3).map((post: any, index: number) => (
                        <div 
                          key={`post-${index}`}
                          className="p-4 rounded-lg border"
                          style={{
                            background: colors.background.light,
                            borderColor: colors.text.secondary + '20'
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium" style={{ color: colors.text.dark }}>{post.title}</h4>
                              <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                                {new Date(post.created_at).toLocaleDateString()} • 
                                <span className="ml-1 px-2 py-0.5 text-xs rounded-full" style={{
                                  backgroundColor: colors.orange.base + '20',
                                  color: colors.orange.base
                                }}>
                                  {post.type}
                                </span>
                              </p>
                            </div>
                            {post.has_photo && (
                              <div className="flex items-center text-sm" style={{ color: colors.green.base }}>
                                <ImageIcon size={14} className="mr-1" />
                                Photo
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                            {post.content}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.keywords?.map((keyword: string, kidx: number) => (
                              <Badge 
                                key={`keyword-${index}-${kidx}`}
                                variant="outline"
                                style={{
                                  backgroundColor: colors.orange.base + '10',
                                  color: colors.orange.base,
                                  borderColor: colors.orange.base + '30'
                                }}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Recommendations</h3>
                      <ul className="space-y-2">
                        {auditResult.details?.posts?.recommendations?.map((rec: any, index: number) => (
                          <li 
                            key={`post-rec-${index}`}
                            className="flex items-start"
                          >
                            <CheckCircle size={16} className="mr-2 text-green-500 mt-0.5" />
                            <span style={{ color: colors.text.dark }}>
                              {typeof rec === 'object' 
                                ? (rec.suggestion || rec.description || JSON.stringify(rec)) 
                                : rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Timeline Analysis for Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6"
            >
              <TimelineAnalysisContainer 
                locationId={auditResult.gbp_id}
                dataType="posts"
                title="Posts Timeline Analysis"
                description="Analyze how your posting frequency compares to competitors over time"
                keyInsights={
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium mb-2 text-black">
                      Key Insights:
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-black">
                      <li>Your posting frequency is inconsistent with 1-2 posts per month on average</li>
                      <li>Competitors are posting 3.8 times per month on average, 90% more than your business</li>
                      <li>Competitor A has the most consistent posting schedule at weekly intervals</li>
                      <li>March 2024 was your strongest month with 3 posts published</li>
                      <li>Consider implementing a consistent weekly posting schedule to improve visibility</li>
                    </ul>
                  </div>
                }
              />
            </motion.div>
          </TabsContent>
          
          {/* Business Info Tab */}
          <TabsContent value="business-info">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{ 
                background: colors.background.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.text.secondary}20`
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle style={{ color: colors.text.dark }}>
                      Business Information Analysis
                    </CardTitle>
                    <Badge style={{ 
                      backgroundColor: getScoreColor(auditResult.business_info_score), 
                      color: 'white' 
                    }}>
                      {auditResult.business_info_score}/100
                    </Badge>
                  </div>
                  <CardDescription style={{ color: colors.text.dark }}>
                    Analysis of your Google Business Profile information completeness and accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-4" style={{ color: colors.text.dark }}>Profile Checks</h3>
                        <div className="space-y-3">
                          {auditResult.business_info_checks?.map((check: any, index: number) => (
                            <div 
                              key={`info-check-${index}`} 
                              className="flex items-start justify-between p-3 rounded-lg"
                              style={{
                                backgroundColor: check.status === 'pass' ? colors.green.base + '10' : colors.accent.red + '10',
                                border: `1px solid ${check.status === 'pass' ? colors.green.base + '30' : colors.accent.red + '30'}`,
                              }}
                            >
                              <div className="flex items-start w-full">
                                {check.status === 'pass' ? (
                                  <CheckCircle size={18} className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <X size={18} className="mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="w-full">
                                  <div className="flex justify-between w-full">
                                    <span className="font-medium" style={{ color: colors.text.dark }}>{check.field}</span>
                                    <Badge variant="outline" style={{
                                      backgroundColor: check.status === 'pass' ? colors.green.base + '20' : colors.accent.red + '20',
                                      color: check.status === 'pass' ? colors.green.base : colors.accent.red,
                                      borderColor: 'transparent'
                                    }}>
                                      {check.status === 'pass' ? 'Pass' : 'Needs Attention'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mt-2 grid grid-cols-1 gap-1">
                                    <div className="flex items-center">
                                      <span className="text-xs font-semibold mr-2" style={{ color: colors.text.dark }}>Current:</span>
                                      <span className="text-xs" style={{ color: colors.text.dark }}>{check.value || 'Not set'}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <span className="text-xs font-semibold mr-2" style={{ color: colors.text.dark }}>Expected:</span>
                                      <span className="text-xs" style={{ color: colors.text.dark }}>{check.expected || 'Not applicable'}</span>
                                    </div>
                                    
                                    {check.status !== 'pass' && check.recommendation && (
                                      <div className="mt-1 flex items-start">
                                        <Info size={12} className="text-amber-500 mr-1 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs" style={{ color: colors.text.dark }}>
                                          {typeof check.recommendation === 'object' 
                                            ? (check.recommendation.suggestion || check.recommendation.description || JSON.stringify(check.recommendation)) 
                                            : check.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Categories & Services</h3>
                        
                        {/* Categories Competitor Comparison Visualization */}
                        <div className="mt-4 mb-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-md font-medium" style={{ color: colors.text.dark }}>Category Comparison</h4>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info size={16} className="cursor-help text-gray-400 hover:text-gray-600" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p style={{ maxWidth: '250px' }}>Compares your categories with top 5 competitors in your area</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <div className="mt-3 relative">
                            {/* Circular progress visualization */}
                            <div className="flex justify-center mb-4">
                              <div className="relative w-52 h-52">
                                {/* Primary category ring - Green */}
                                <div className="absolute inset-0" style={{ 
                                  background: `conic-gradient(${colors.green.base} 0% 100%, #E2E8F0 100% 100%)`,
                                  borderRadius: '100%',
                                  clipPath: 'circle(50% at center)',
                                }}>
                                </div>
                                
                                {/* Secondary category ring - Gray with portion filled in orange based on match */}
                                <div className="absolute inset-0 m-4" style={{ 
                                  background: `conic-gradient(${colors.orange.base} 0% 0%, #E2E8F0 0% 100%)`, 
                                  borderRadius: '100%',
                                  clipPath: 'circle(50% at center)',
                                }}>
                                </div>
                                
                                {/* Inner white circle */}
                                <div className="absolute inset-0 m-16" style={{
                                  background: colors.background.white,
                                  borderRadius: '100%'
                                }}>
                                </div>
                                
                                {/* Labels */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold" style={{ color: colors.text.dark }}>100%</span>
                                  <span className="text-xs text-center" style={{ color: colors.text.dark }}>Primary<br/>Match</span>
                                </div>
                                
                                {/* Primary Category Label */}
                                <div className="absolute" style={{ left: '2px', top: '46%' }}>
                                  <span className="text-xs font-medium px-1 py-0.5 rounded" 
                                    style={{ backgroundColor: colors.green.base, color: 'white' }}>
                                    Primary
                                  </span>
                                </div>
                                
                                {/* Secondary Category Label */}
                                <div className="absolute" style={{ left: '14px', top: '27%' }}>
                                  <span className="text-xs font-medium px-1 py-0.5 rounded" 
                                    style={{ backgroundColor: '#E2E8F0', color: colors.text.dark }}>
                                    Secondary
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Category details */}
                            <div className="mt-2">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.green.base + '10', border: `1px solid ${colors.green.base + '30'}` }}>
                                <h5 className="font-medium" style={{ color: colors.text.dark }}>Primary Category</h5>
                                <div className="flex justify-between mt-1">
                                  <span className="font-bold" style={{ color: colors.text.dark }}>
                                    {auditResult.details?.business_info?.categories?.primary || 'Not set'}
                                  </span>
                                  <span className="text-sm font-medium" style={{ color: colors.green.base }}>
                                    Matches with 5 competitors
                                  </span>
                                </div>
                              </div>
                              
                              <div className="p-3 rounded-lg mt-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div className="flex justify-between">
                                  <h5 className="font-medium" style={{ color: colors.text.dark }}>Secondary Categories</h5>
                                  <span className="text-sm py-0.5 px-2 rounded-full" style={{
                                    backgroundColor: auditResult.details?.business_info?.categories?.relevant ? colors.green.base + '20' : colors.accent.red + '20',
                                    color: auditResult.details?.business_info?.categories?.relevant ? colors.green.base : colors.accent.red
                                  }}>
                                    {auditResult.details?.business_info?.categories?.relevant ? 'Relevant' : 'Review Needed'}
                                  </span>
                                </div>
                                <p className="text-sm mt-1" style={{ color: colors.text.dark }}>
                                  None of your secondary categories have matches with competitors' locations.
                                </p>
                                
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  {auditResult.details?.business_info?.categories?.secondary?.map((category: string, i: number) => (
                                    <div key={`sec-cat-${i}`} className="flex gap-2 p-2 rounded items-center" style={{ 
                                      backgroundColor: '#f1f5f9',
                                      border: '1px solid #e2e8f0'
                                    }}>
                                      <div className="h-2 w-2 rounded-full bg-gray-400 flex-shrink-0"></div>
                                      <span className="text-xs truncate" style={{ color: colors.text.dark }}>{category}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Competitor Categories Not Used */}
                                <div className="mt-4">
                                  <h6 className="text-sm font-medium" style={{ color: colors.text.dark }}>
                                    Competitor Categories You Don't Have:
                                  </h6>
                                  <div className="mt-1 grid grid-cols-2 gap-2">
                                    <div className="flex gap-2 p-2 rounded items-center" style={{ 
                                      backgroundColor: colors.orange.base + '10',
                                      border: `1px solid ${colors.orange.base + '30'}`
                                    }}>
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.orange.base }}></div>
                                      <span className="text-xs truncate" style={{ color: colors.text.dark }}>Party planner</span>
                                      <span className="text-xs px-1 rounded ml-auto" style={{ backgroundColor: colors.orange.base + '20', color: colors.orange.base }}>23.1%</span>
                                    </div>
                                    <div className="flex gap-2 p-2 rounded items-center" style={{ 
                                      backgroundColor: colors.orange.base + '10',
                                      border: `1px solid ${colors.orange.base + '30'}`
                                    }}>
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.orange.base }}></div>
                                      <span className="text-xs truncate" style={{ color: colors.text.dark }}>Party store</span>
                                      <span className="text-xs px-1 rounded ml-auto" style={{ backgroundColor: colors.orange.base + '20', color: colors.orange.base }}>7.7%</span>
                                    </div>
                                    <div className="flex gap-2 p-2 rounded items-center" style={{ 
                                      backgroundColor: colors.orange.base + '10',
                                      border: `1px solid ${colors.orange.base + '30'}`
                                    }}>
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.orange.base }}></div>
                                      <span className="text-xs truncate" style={{ color: colors.text.dark }}>Event planner</span>
                                      <span className="text-xs px-1 rounded ml-auto" style={{ backgroundColor: colors.orange.base + '20', color: colors.orange.base }}>15.4%</span>
                                    </div>
                                    <div className="flex gap-2 p-2 rounded items-center" style={{ 
                                      backgroundColor: colors.orange.base + '10',
                                      border: `1px solid ${colors.orange.base + '30'}`
                                    }}>
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.orange.base }}></div>
                                      <span className="text-xs truncate" style={{ color: colors.text.dark }}>Bouncy castle hire</span>
                                      <span className="text-xs px-1 rounded ml-auto" style={{ backgroundColor: colors.orange.base + '20', color: colors.orange.base }}>15.4%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Services Section */}
                        <div className="mt-6">
                          <div className="flex justify-between items-center">
                            <h4 className="text-md font-medium" style={{ color: colors.text.dark }}>Services</h4>
                            <span className="text-xs px-2 py-1 rounded-full" style={{
                              backgroundColor: auditResult.details?.business_info?.services?.complete ? colors.green.base + '20' : colors.accent.red + '20',
                              color: auditResult.details?.business_info?.services?.complete ? colors.green.base : colors.accent.red,
                            }}>
                              {auditResult.details?.business_info?.services?.complete ? 'Complete' : 'Incomplete'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {auditResult.details?.business_info?.services?.list?.map((service: string, index: number) => (
                              <Badge 
                                key={`service-${index}`}
                                variant="outline"
                                style={{
                                  backgroundColor: colors.background.light,
                                  color: colors.text.dark,
                                  borderColor: colors.text.secondary + '30'
                                }}
                              >
                                {service}
                              </Badge>
                            )) || <span className="text-sm" style={{ color: colors.text.dark }}>None set</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Business Description</h3>
                      <div className="mt-2">
                        <p className="text-sm p-3 rounded-lg bg-gray-50" style={{ color: colors.text.dark }}>
                          {auditResult.details?.business_info?.description?.text || 'No description set'}
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="flex items-center text-sm" style={{ color: colors.text.secondary }}>
                            <span className="font-medium mr-2">Length:</span>
                            <span className={auditResult.details?.business_info?.description?.length > 300 ? 'text-green-500' : 'text-amber-500'}>
                              {auditResult.details?.business_info?.description?.length || 0} characters
                            </span>
                          </div>
                          <div className="flex items-center text-sm" style={{ color: colors.text.secondary }}>
                            <span className="font-medium mr-2">Keywords:</span>
                            <span className={auditResult.details?.business_info?.description?.keywords_included ? 'text-green-500' : 'text-red-500'}>
                              {auditResult.details?.business_info?.description?.keywords_included ? 'Included' : 'Missing'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm" style={{ color: colors.text.secondary }}>
                            <span className="font-medium mr-2">Promotional:</span>
                            <span className={!auditResult.details?.business_info?.description?.promotional_language ? 'text-green-500' : 'text-red-500'}>
                              {auditResult.details?.business_info?.description?.promotional_language ? 'Yes - Remove' : 'No - Good'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>NAP Consistency</h3>
                      <div className={`mt-2 p-3 rounded-lg ${auditResult.details?.business_info?.nap_consistency?.consistent ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center">
                          {auditResult.details?.business_info?.nap_consistency?.consistent ? (
                            <CheckCircle size={18} className="mr-2 text-green-500" />
                          ) : (
                            <AlertTriangle size={18} className="mr-2 text-red-500" />
                          )}
                          <span style={{ color: colors.text.dark }}>
                            {auditResult.details?.business_info?.nap_consistency?.consistent 
                              ? 'NAP information is consistent across platforms'
                              : 'NAP inconsistencies detected'}
                          </span>
                        </div>
                        
                        {!auditResult.details?.business_info?.nap_consistency?.consistent && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium" style={{ color: colors.text.dark }}>Issues:</h4>
                            <ul className="ml-6 mt-1 text-sm list-disc" style={{ color: colors.text.secondary }}>
                              {auditResult.details?.business_info?.nap_consistency?.issues.map((issue: string, index: number) => (
                                <li key={`nap-issue-${index}`}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Photos Tab */}
          <TabsContent value="photos">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{ 
                background: colors.background.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.text.secondary}20`
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle style={{ color: colors.text.dark }}>
                      Photos Analysis
                    </CardTitle>
                    <Badge style={{ 
                      backgroundColor: getScoreColor(auditResult.photos_score), 
                      color: 'white' 
                    }}>
                      {auditResult.photos_score}/100
                    </Badge>
                  </div>
                  <CardDescription style={{ color: colors.text.dark }}>
                    Analysis of your Google Business Profile photo quality and coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Photo Count</h3>
                        <div className="flex items-end">
                          <span className="text-3xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.photos?.total_count || 0}
                          </span>
                          <span className="ml-2 text-sm mb-1" style={{ color: colors.text.secondary }}>
                            total photos
                          </span>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span className="text-sm font-medium mr-2" style={{ color: colors.text.secondary }}>Coverage Score:</span>
                          <span className="text-sm px-2 py-0.5 rounded-full" style={{
                            backgroundColor: getScoreColor(auditResult.details?.photos?.coverage_score || 0) + '20',
                            color: getScoreColor(auditResult.details?.photos?.coverage_score || 0)
                          }}>
                            {auditResult.details?.photos?.coverage_score || 0}/100
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Upload Source</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: colors.text.secondary }}>Business-uploaded:</span>
                            <span className="font-semibold" style={{ color: colors.text.dark }}>
                              {auditResult.details?.photos?.business_uploaded || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: colors.text.secondary }}>User-uploaded:</span>
                            <span className="font-semibold" style={{ color: colors.text.dark }}>
                              {auditResult.details?.photos?.user_uploaded || 0}
                            </span>
                          </div>
                          <div className="mt-1">
                            <div className="relative w-full h-2 mt-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.text.secondary + '20' }}>
                              <div 
                                className="h-full transition-all"
                                style={{ 
                                  width: `${(auditResult.details?.photos?.business_uploaded || 0) / 
                                         (auditResult.details?.photos?.total_count || 1) * 100}%`,
                                  backgroundColor: colors.orange.base
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1 text-xs" style={{ color: colors.text.secondary }}>
                              <span>Business</span>
                              <span>User</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Photo Categories</h3>
                        <div className="space-y-1">
                          {Object.entries(auditResult.details?.photos?.types || {}).map(([type, count]: [string, any], index: number) => (
                            <div key={`photo-type-${index}`} className="flex justify-between items-center">
                              <span className="text-sm capitalize" style={{ color: colors.text.dark }}>{type}:</span>
                              <div className="flex items-center">
                                <span className="font-semibold mr-2" style={{ color: colors.text.dark }}>{count}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                                  backgroundColor: count > 3 ? colors.green.base + '20' : colors.amber.base + '20',
                                  color: count > 3 ? colors.green.base : colors.amber.base
                                }}>
                                  {count > 3 ? 'Good' : 'Need more'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Photo Recommendations</h3>
                      <ul className="space-y-2">
                        {auditResult.details?.photos?.recommendations?.map((rec: any, index: number) => (
                          <li 
                            key={`photo-rec-${index}`}
                            className="flex items-start"
                          >
                            <CheckCircle size={16} className="mr-2 text-green-500 mt-0.5" />
                            <span style={{ color: colors.text.dark }}>
                              {typeof rec === 'object' 
                                ? (rec.suggestion || rec.description || JSON.stringify(rec)) 
                                : rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Timeline Analysis for Photos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6"
            >
              <TimelineAnalysisContainer 
                locationId={auditResult.gbp_id}
                dataType="photos"
                title="Photos Timeline Analysis"
                description="Analyze how your photo uploads compare to competitors over time"
                keyInsights={
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium mb-2 text-black">
                      Key Insights:
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-black">
                      <li>Your business uploads an average of 2.3 photos per month, lower than industry average</li>
                      <li>Competitors are adding 5.1 photos per month on average, showcasing more visual content</li>
                      <li>Competitor C has the highest quality photos with professional photography</li>
                      <li>January 2024 was your strongest month with 4 new photos uploaded</li>
                      <li>Consider adding more interior and team photos to increase customer engagement</li>
                    </ul>
                  </div>
                }
              />
            </motion.div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card style={{ 
                background: colors.background.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.text.secondary}20`
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle style={{ color: colors.text.dark }}>
                        Performance Analysis {getEmojiForScore(auditResult.performance_score)}
                      </CardTitle>
                      <CardDescription style={{ color: colors.text.dark }}>
                        Analysis of your Google Business Profile engagement metrics and trends
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge style={{ 
                        backgroundColor: getScoreColor(auditResult.performance_score) + '20', 
                        color: getScoreColor(auditResult.performance_score)
                      }}>
                        Score: {auditResult.performance_score}/100
                      </Badge>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              style={{
                                borderColor: colors.orange.base,
                                color: colors.orange.base
                              }}
                              className="px-2 h-8"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download Performance Report</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-4" style={{ color: colors.text.dark }}>Overall Interactions</h3>
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-3xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.performance?.overview?.total_interactions?.current || 0}
                          </span>
                          <div className="flex items-center mt-1">
                            <span className={`text-sm ${(auditResult.details?.performance?.overview?.total_interactions?.change_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(auditResult.details?.performance?.overview?.total_interactions?.change_percent || 0) >= 0 ? '+' : ''}
                              {auditResult.details?.performance?.overview?.total_interactions?.change_percent || 0}%
                            </span>
                            <span className="text-xs ml-1" style={{ color: colors.text.secondary }}>vs previous period</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium mr-2" style={{ color: colors.text.secondary }}>Industry benchmark:</span>
                            <span className="text-sm">{auditResult.details?.performance?.overview?.total_interactions?.benchmark || 0}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-sm font-medium mr-2" style={{ color: colors.text.secondary }}>Status:</span>
                            <span className={`text-sm ${auditResult.details?.performance?.overview?.total_interactions?.status === 'above' ? 'text-green-500' : auditResult.details?.performance?.overview?.total_interactions?.status === 'equal' ? 'text-amber-500' : 'text-red-500'}`}>
                              {auditResult.details?.performance?.overview?.total_interactions?.status === 'above' ? 'Above benchmark' : 
                               auditResult.details?.performance?.overview?.total_interactions?.status === 'equal' ? 'At benchmark' : 'Below benchmark'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={auditResult.details?.performance?.overview?.total_interactions?.trend || []}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.text.secondary + '20'} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fill: colors.text.secondary }}
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth()+1}/${date.getDate()}`;
                              }}
                            />
                            <YAxis tick={{ fill: colors.text.secondary }} />
                            <RechartsTooltip
                              formatter={(value: any) => [value, 'Interactions']}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString();
                              }}
                              contentStyle={{
                                backgroundColor: colors.background.white,
                                borderColor: colors.text.secondary + '30',
                              }}
                            />
                            <RechartsLine
                              type="monotone"
                              dataKey="value"
                              stroke={colors.orange.base}
                              strokeWidth={2}
                              dot={{ stroke: colors.orange.base, fill: colors.orange.base, r: 4 }}
                              activeDot={{ stroke: colors.orange.base, fill: colors.orange.base, r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium" style={{ color: colors.text.dark }}>Calls</h3>
                          <PhoneCallIcon className="h-5 w-5" style={{ color: colors.orange.base }} />
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.performance?.calls?.current || 0}
                          </span>
                          <div className="flex items-center mt-1">
                            <span className={`text-sm ${(auditResult.details?.performance?.calls?.change_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(auditResult.details?.performance?.calls?.change_percent || 0) >= 0 ? '+' : ''}
                              {auditResult.details?.performance?.calls?.change_percent || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium" style={{ color: colors.text.dark }}>Direction Requests</h3>
                          <CompassIcon className="h-5 w-5" style={{ color: colors.green.base }} />
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.performance?.direction_requests?.current || 0}
                          </span>
                          <div className="flex items-center mt-1">
                            <span className={`text-sm ${(auditResult.details?.performance?.direction_requests?.change_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(auditResult.details?.performance?.direction_requests?.change_percent || 0) >= 0 ? '+' : ''}
                              {auditResult.details?.performance?.direction_requests?.change_percent || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium" style={{ color: colors.text.dark }}>Website Clicks</h3>
                          <GlobeIcon className="h-5 w-5" style={{ color: colors.blue.base }} />
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl font-semibold" style={{ color: colors.text.dark }}>
                            {auditResult.details?.performance?.website_clicks?.current || 0}
                          </span>
                          <div className="flex items-center mt-1">
                            <span className={`text-sm ${(auditResult.details?.performance?.website_clicks?.change_percent || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(auditResult.details?.performance?.website_clicks?.change_percent || 0) >= 0 ? '+' : ''}
                              {auditResult.details?.performance?.website_clicks?.change_percent || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow border">
                      <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.dark }}>Top Search Queries</h3>
                      <div className="space-y-2">
                        {auditResult.details?.performance?.searches?.top_queries?.map((query: any, index: number) => (
                          <div 
                            key={`query-${index}`}
                            className="flex justify-between items-center p-2 rounded-lg"
                            style={{
                              backgroundColor: index % 2 === 0 ? colors.background.light : 'transparent',
                            }}
                          >
                            <div className="flex items-center">
                              <span className="w-5 text-center font-medium mr-2" style={{ color: colors.text.secondary }}>{index + 1}.</span>
                              <span style={{ color: colors.text.dark }}>{query.query}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-3" style={{ color: colors.text.dark }}>{query.volume}</span>
                              <span className={`text-xs ${query.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {query.change_percent >= 0 ? '+' : ''}
                                {query.change_percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Interactive Campaign Metrics */}
                    <InteractiveCampaignMetrics metrics={auditResult.details?.performance || {}} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          

          
          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card style={{ 
              background: colors.background.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: `1px solid ${colors.text.secondary}20`
            }}>
              <CardHeader>
                <CardTitle style={{ color: colors.text.dark }}>Recommendations</CardTitle>
                <CardDescription style={{ color: colors.text.dark }}>
                  Actionable steps to improve your Google Business Profile performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence>
                    {auditResult.recommendations?.map((recommendation: any, index: number) => (
                      <motion.div
                        key={`recommendation-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 rounded-lg border"
                        style={{
                          background: colors.background.light,
                          borderColor: getPriorityColor(recommendation.priority) + '40',
                          borderLeft: `4px solid ${getPriorityColor(recommendation.priority)}`
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-full"
                              style={{
                                backgroundColor: colors.orange.base + "20",
                              }}
                            >
                              {getCategoryIcon(recommendation.category)}
                            </div>
                            <div>
                              <h3 className="font-semibold" style={{ color: colors.text.dark }}>
                                {typeof recommendation.description === 'object' 
                                  ? (recommendation.description.suggestion || recommendation.description.text || JSON.stringify(recommendation.description)) 
                                  : recommendation.description}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  style={{
                                    backgroundColor: getPriorityColor(recommendation.priority) + '20',
                                    color: getPriorityColor(recommendation.priority),
                                    border: `1px solid ${getPriorityColor(recommendation.priority)}`
                                  }}
                                >
                                  {recommendation.priority} priority
                                </Badge>
                                <span className="text-xs capitalize" style={{ color: colors.text.secondary }}>
                                  {recommendation.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: colors.orange.base,
                              color: 'white'
                            }}
                            className="hover:bg-[#F5A461]"
                            onClick={() => handleImplementRecommendation(recommendation)}
                          >
                            <ArrowUpRightIcon className="h-4 w-4 mr-1" />
                            Implement
                          </Button>
                        </div>
                        <div className="ml-12 mb-3" style={{ color: colors.text.dark }}>
                          <strong>Action:</strong> {typeof recommendation.action === 'object' ? 
                            (recommendation.action?.description || JSON.stringify(recommendation.action)) : 
                            recommendation.action}
                        </div>
                        <div className="ml-12" style={{ color: colors.text.dark }}>
                          <strong>Impact:</strong> {typeof recommendation.impact === 'object' ? 
                            (recommendation.impact?.description || JSON.stringify(recommendation.impact)) : 
                            recommendation.impact}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="md:col-span-3">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`
                }}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle style={{ color: colors.text.dark }}>Performance Trends</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ color: colors.orange.base, borderColor: colors.orange.base + '40' }}
                        onClick={generatePDF}
                      >
                        <DownloadIcon className="h-4 w-4 mr-1" />
                        Export PDF
                      </Button>
                    </div>
                    <CardDescription style={{ color: colors.text.dark }}>
                      Historical audit performance over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {chartData ? (
                        <Line data={chartData} options={chartOptions} />
                      ) : (
                        <div className="flex justify-center items-center h-full" style={{ color: colors.text.secondary }}>
                          No historical data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-1">
                <Card style={{ 
                  background: colors.background.white,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.text.secondary}20`,
                  height: '100%'
                }}>
                  <CardHeader>
                    <CardTitle style={{ color: colors.text.dark }} className="text-lg">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights && insights.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span style={{ color: colors.text.dark }}>Current Score:</span>
                            <span className="font-bold" style={{ color: getScoreColor(insights[insights.length - 1].score) }}>
                              {insights[insights.length - 1].score}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: colors.text.dark }}>Previous Score:</span>
                            <span className="font-bold" style={{ color: getScoreColor(insights[insights.length - 2]?.score || 0) }}>
                              {insights[insights.length - 2]?.score || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: colors.text.dark }}>Change:</span>
                            <span className="font-bold" style={{ 
                              color: (insights[insights.length - 1].score - (insights[insights.length - 2]?.score || 0)) > 0 
                                ? '#4CAF50' 
                                : colors.accent.red 
                            }}>
                              {(insights[insights.length - 1].score - (insights[insights.length - 2]?.score || 0)) > 0 ? '+' : ''}
                              {(insights[insights.length - 1].score - (insights[insights.length - 2]?.score || 0)).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: colors.text.dark }}>Highest Score:</span>
                            <span className="font-bold" style={{ color: '#4CAF50' }}>
                              {Math.max(...insights.map(i => i.score))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: colors.text.dark }}>Audits Run:</span>
                            <span className="font-bold" style={{ color: colors.text.dark }}>
                              {insights.length}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center" style={{ color: colors.text.secondary }}>
                          No insights available yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <Card style={{ 
              background: colors.background.white,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: `1px solid ${colors.text.secondary}20`
            }}>
              <CardHeader>
                <CardTitle style={{ color: colors.text.dark }}>Performance by Category</CardTitle>
                <CardDescription style={{ color: colors.text.dark }}>
                  See how your GBP is performing in different categories over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights && insights.length > 0 ? (
                  <div style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={insights.map(insight => ({
                        name: new Date(insight.date).toLocaleDateString(),
                        business: insight.category_scores.business_details,
                        reviews: insight.category_scores.reviews,
                        posts: insight.category_scores.posts,
                        photos: insight.category_scores.photos || 0,
                        performance: insight.category_scores.performance || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.text.secondary + '20'} />
                        <XAxis 
                          dataKey="name" 
                          style={{ fontSize: '12px' }}
                          stroke={colors.text.secondary} 
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          style={{ fontSize: '12px' }}
                          stroke={colors.text.secondary}
                        />
                        <RechartsTooltip 
                          content={renderRechartsTooltip}
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="business" 
                          name="Business Info"
                          stroke={colors.orange.base} 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="reviews" 
                          name="Reviews"
                          stroke="#4CAF50" 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="posts" 
                          name="Posts"
                          stroke="#2196F3" 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="photos" 
                          name="Photos"
                          stroke="#9C27B0" 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="performance" 
                          name="Performance"
                          stroke="#FF5722" 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-80" style={{ color: colors.text.secondary }}>
                    No insight data available yet. Run multiple audits over time to see trends.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}