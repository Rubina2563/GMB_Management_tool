import React from "react";
import { GlowButton } from "@/components/ui/glow-button";
import { 
  Rocket, 
  Search, 
  BarChart3, 
  Star, 
  Building, 
  Settings, 
  ArrowRight,
  FileDown,
  RefreshCw,
  PlusCircle
} from "lucide-react";
import Layout from "@/components/Layout";

export default function GlowButtonDemo() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Glowing Button Interactions</h1>
          <p className="text-gray-600 mb-6">
            These buttons use the glow animation effect on hover, giving your UI a subtle interactive feel.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Primary Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary" className="flex items-center">
                <FileDown className="mr-2 h-4 w-4" />
                Download Report
              </GlowButton>
              
              <GlowButton variant="primary" className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </GlowButton>
              
              <GlowButton variant="primary" className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New
              </GlowButton>
              
              <GlowButton variant="primary" size="sm" className="flex items-center">
                Small Button
              </GlowButton>
              
              <GlowButton variant="primary" size="lg" className="flex items-center">
                Large Button
              </GlowButton>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary">
                Primary
              </GlowButton>
              
              <GlowButton variant="secondary">
                Secondary
              </GlowButton>
              
              <GlowButton variant="outline">
                Outline
              </GlowButton>
              
              <GlowButton variant="destructive">
                Destructive
              </GlowButton>
              
              <GlowButton variant="ghost">
                Ghost
              </GlowButton>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Action Buttons with Icons</h2>
            <div className="flex flex-wrap gap-4">
              <GlowButton variant="primary" className="flex items-center">
                <Rocket className="mr-2 h-4 w-4" />
                Run Audit
              </GlowButton>
              
              <GlowButton variant="outline" className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Search
              </GlowButton>
              
              <GlowButton variant="secondary" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </GlowButton>
              
              <GlowButton variant="primary" className="flex items-center">
                <Star className="mr-2 h-4 w-4" />
                Review Profile
              </GlowButton>
              
              <GlowButton variant="ghost" className="flex items-center">
                <ArrowRight className="ml-2 h-4 w-4" />
                Read More
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}