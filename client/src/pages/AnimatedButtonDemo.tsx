import React from "react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { 
  Rocket, 
  Search, 
  BarChart3, 
  Star, 
  Building, 
  Settings, 
  ArrowRight 
} from "lucide-react";
import Layout from "@/components/Layout";

export default function AnimatedButtonDemo() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Animated Button Interactions</h1>
          <p className="text-gray-600">
            Click the buttons below to see their tap effects and hover over them to see the animations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DemoCard 
            title="Scale Animation" 
            description="Basic zoom effect on hover"
            variant="scale"
            icon={<Rocket className="mr-2 h-4 w-4" />}
            buttonText="Run Audit"
          />
          
          <DemoCard 
            title="Bounce Animation" 
            description="Button springs upward on hover"
            variant="bounce"
            icon={<Search className="mr-2 h-4 w-4" />}
            buttonText="Search Competitors"
          />
          
          <DemoCard 
            title="Pulse Animation" 
            description="Pulsating ripple effect"
            variant="pulse"
            icon={<BarChart3 className="mr-2 h-4 w-4" />}
            buttonText="Analyze Data"
          />
          
          <DemoCard 
            title="Rotate Animation" 
            description="Button wiggles side to side"
            variant="rotate"
            icon={<Star className="mr-2 h-4 w-4" />}
            buttonText="Check Reviews"
          />
          
          <DemoCard 
            title="Shake Animation" 
            description="Horizontal shaking motion"
            variant="shake"
            icon={<Building className="mr-2 h-4 w-4" />}
            buttonText="Connect GBP"
          />
          
          <DemoCard 
            title="Glow Animation" 
            description="Button glows on hover"
            variant="glow"
            icon={<Settings className="mr-2 h-4 w-4" />}
            buttonText="Configure Settings"
          />
          
          <DemoCard 
            title="Wobble Animation" 
            description="Button wobbles slightly"
            variant="wobble"
            icon={<ArrowRight className="mr-2 h-4 w-4" />}
            buttonText="View Details"
          />
        </div>
      </div>
    </Layout>
  );
}

function DemoCard({ 
  title, 
  description, 
  variant, 
  icon,
  buttonText
}: { 
  title: string; 
  description: string; 
  variant: 'pulse' | 'bounce' | 'scale' | 'rotate' | 'shake' | 'glow' | 'wobble';
  icon: React.ReactNode;
  buttonText: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="flex justify-center">
        <AnimatedButton variant={variant} className="flex items-center">
          {icon}
          {buttonText}
        </AnimatedButton>
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Variant: <code className="bg-gray-100 px-1 rounded">{variant}</code>
      </div>
    </div>
  );
}