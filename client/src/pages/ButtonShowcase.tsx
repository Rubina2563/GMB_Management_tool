import React from "react";
import Layout from "@/components/Layout";
import { GlowButton } from "@/components/ui/glow-button";
import { FileDown, Search, BarChart3, Star, RefreshCw, Plus } from "lucide-react";

/**
 * This page showcases both the original AnimatedButton styles and our new GlowButton component
 */
export default function ButtonShowcase() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold mb-6">Button Microinteraction Showcase</h1>
          
          <p className="text-gray-600 mb-8">
            This page demonstrates the glow animation style that will be applied across the SaaS platform.
            Hover over buttons to see the subtle glow effect, which provides immediate visual feedback for interactive elements.
          </p>
          
          <h2 className="text-xl font-semibold mb-4">Primary Action Buttons</h2>
          <div className="flex flex-wrap gap-4 mb-8">
            <GlowButton 
              variant="primary" 
              className="flex items-center"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Report
            </GlowButton>
            
            <GlowButton 
              variant="primary" 
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </GlowButton>
            
            <GlowButton 
              variant="primary" 
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </GlowButton>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Secondary Button Styles</h2>
          <div className="flex flex-wrap gap-4 mb-8">
            <GlowButton variant="secondary" className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Search Records
            </GlowButton>
            
            <GlowButton variant="outline" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </GlowButton>
            
            <GlowButton variant="destructive" className="flex items-center">
              Remove Item
            </GlowButton>
            
            <GlowButton variant="ghost" className="flex items-center">
              <Star className="mr-2 h-4 w-4" />
              Add to Favorites
            </GlowButton>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <GlowButton variant="primary" size="sm">
              Small
            </GlowButton>
            
            <GlowButton variant="primary" size="default">
              Default
            </GlowButton>
            
            <GlowButton variant="primary" size="lg">
              Large
            </GlowButton>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Plan</h2>
          <p className="text-gray-600 mb-4">
            We've created a separate GlowButton component that won't interfere with existing button implementations.
            For new features, we'll use the GlowButton component, and we'll gradually migrate existing buttons
            when working on those sections of the application.
          </p>
          
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-medium mb-2">How to use GlowButton:</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto mb-4">
              {`import { GlowButton } from "@/components/ui/glow-button";

<GlowButton 
  variant="primary" 
  className="flex items-center"
>
  <FileDown className="mr-2 h-4 w-4" />
  Download Report
</GlowButton>`}
            </pre>
            
            <p className="text-sm text-gray-600">
              The GlowButton component supports variants: primary, secondary, outline, destructive, ghost<br />
              And sizes: default, sm, lg, icon
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}