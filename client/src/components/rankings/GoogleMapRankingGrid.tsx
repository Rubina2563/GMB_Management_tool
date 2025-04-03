import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, OverlayView } from '@react-google-maps/api';
import { RankingNode } from './types';
import { ChevronRightIcon, InfoIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import RankingHeatmapOverlay from './RankingHeatmapOverlay';
import RankingTrendConnector from './RankingTrendConnector';
import { generateHistoricalData, generateTrendLines } from './mock-historical-data';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Default map styles for full-width display
const mapContainerStyle = {
  width: '100%',
  height: '700px', // Taller map for better visibility
  borderRadius: '8px',
};

// Default center for the map (will be overridden by actual data)
const defaultCenter = {
  lat: 33.4484,
  lng: -112.0740 // Phoenix area
};

// Map styling options to make it look professional with white theme
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#333333" }]
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [{ color: "#f9f9f9" }]
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [{ saturation: -100 }, { lightness: 45 }]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [{ color: "#e1f3f8" }, { visibility: "on" }]
    }
  ]
};

// The pixel position for the OverlayView
const getPixelPositionOffset = (width: number, height: number) => ({
  x: -(width / 2),
  y: -(height / 2),
});

// Define the historical data point type for trends
interface HistoricalRankingPoint {
  date: string;
  rank: number;
  lat: number;
  lng: number;
}

// Define the heatmap data point with weighted value
interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
}

interface GoogleMapRankingGridProps {
  nodes: RankingNode[];
  keyword: string;
  location: string;
  isLoading: boolean;
  onNodeHover?: (node: RankingNode | null) => void;
  mapRef?: React.MutableRefObject<any>;
  historicalData?: HistoricalRankingPoint[][]; // Optional historical data array (array of arrays, one per date)
}

const GoogleMapRankingGrid: React.FC<GoogleMapRankingGridProps> = ({
  nodes,
  keyword,
  location,
  isLoading,
  onNodeHover,
  mapRef,
  historicalData = []
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(13);
  const [selectedNode, setSelectedNode] = useState<RankingNode | null>(null);
  
  // State for visualization controls
  const [showTrendOverlay, setShowTrendOverlay] = useState<boolean>(false);
  const [showTrendArrows, setShowTrendArrows] = useState<boolean>(true);
  const [showTrendLines, setShowTrendLines] = useState<boolean>(true); // Always true now that we removed the toggle
  const [visualizationType, setVisualizationType] = useState<'rank' | 'change'>('rank');
  
  // Generate historical data for trend visualization
  const generatedHistoricalData = useMemo(() => {
    return generateHistoricalData(nodes, 3);
  }, [nodes]);
  
  // Generate trend lines from historical data
  const trendLines = useMemo(() => {
    if (generatedHistoricalData.length === 0) return [];
    return generateTrendLines(generatedHistoricalData);
  }, [generatedHistoricalData]);
  
  // State for storing the dynamically fetched API key
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  
  // Use a static API key from environment variables to prevent re-initialization issues
  // This prevents the "Loader must not be called again with different options" error
  const staticApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  
  // Define libraries as a static array to prevent reloading warning
  // This addresses the warning: "LoadScript has been reloaded unintentionally!"
  const libraries: any = React.useMemo(() => [], []);
  
  // Load the Google Maps JavaScript API with the static key
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: staticApiKey,
    libraries
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Expose the map through the ref for external control
    if (mapRef) {
      mapRef.current = map;
    }
  }, [mapRef]);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate the center of the grid
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const totalLat = nodes.reduce((acc, node) => acc + node.lat, 0);
      const totalLng = nodes.reduce((acc, node) => acc + node.lng, 0);
      
      setCenter({
        lat: totalLat / nodes.length,
        lng: totalLng / nodes.length
      });
      
      // Adjust zoom based on grid size
      const latMax = Math.max(...nodes.map(n => n.lat));
      const latMin = Math.min(...nodes.map(n => n.lat));
      const lngMax = Math.max(...nodes.map(n => n.lng));
      const lngMin = Math.min(...nodes.map(n => n.lng));
      
      const latDiff = latMax - latMin;
      const lngDiff = lngMax - lngMin;
      
      // Calculate appropriate zoom level based on grid spread
      const maxDiff = Math.max(latDiff, lngDiff);
      let newZoom = 13; // Default zoom
      
      if (maxDiff > 0.1) newZoom = 11;
      else if (maxDiff > 0.05) newZoom = 12;
      else if (maxDiff > 0.02) newZoom = 13;
      else if (maxDiff > 0.01) newZoom = 14;
      else newZoom = 15;
      
      setZoom(newZoom);
    }
  }, [nodes]);

  // Helper to determine background color based on rank
  const getNodeBackgroundColor = (rank: number) => {
    if (rank <= 3) return 'rgba(52, 168, 83, 0.9)'; // Green for top ranks (1-3)
    if (rank <= 10) return 'rgba(251, 188, 5, 0.9)'; // Yellow for mid ranks (4-10)
    return 'rgba(234, 67, 53, 0.9)'; // Red for low ranks (11+)
  };

  // Fixed hover handling to prevent "dancing" behavior
  const handleNodeHover = (node: RankingNode | null) => {
    // Only update if we're not already hovering on this node
    if (onNodeHover && (!selectedNode || node?.id !== selectedNode.id)) {
      onNodeHover(node);
    }
  };

  const handleNodeClick = (node: RankingNode) => {
    // When node is clicked, we select it and stop further hover events
    setSelectedNode(node);
    if (onNodeHover) onNodeHover(node);
  };

  if (loadError) {
    return <div className="p-6 bg-white rounded-lg border border-red-200 text-red-700 shadow-sm">
      <div className="flex items-center">
        <InfoIcon className="h-6 w-6 mr-2 text-red-500" />
        <h3 className="font-semibold">Error loading Google Maps</h3>
      </div>
      <p className="mt-2 text-sm">{loadError.message}</p>
    </div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-white rounded-lg border">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38]"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] bg-white rounded-lg border shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F28C38] mb-4"></div>
        <p className="text-black">Loading ranking grid data...</p>
      </div>
    );
  }

  // Handle view mode changes from the overlay component
  const handleViewChange = (mode: 'standard' | 'heatmap' | 'trend') => {
    if (mode === 'standard') {
      setShowTrendOverlay(false);
      setShowTrendArrows(false);
      setShowTrendLines(false);
    } else if (mode === 'heatmap') {
      setShowTrendOverlay(true);
      setShowTrendArrows(false);
      setShowTrendLines(false);
    } else if (mode === 'trend') {
      setShowTrendOverlay(false);
      setShowTrendArrows(true);
      setShowTrendLines(true);
    }
  };
  
  // Get trend arrow component based on rank change
  const getTrendArrow = (rankChange: number | undefined) => {
    if (!rankChange || rankChange === 0) return null;
    if (rankChange > 0) {
      return <TrendingUpIcon className="h-4 w-4 text-green-600 absolute -top-4 right-0" />;
    } else {
      return <TrendingDownIcon className="h-4 w-4 text-red-600 absolute -top-4 right-0" />;
    }
  };
  
  return (
    <div className="relative bg-white rounded-lg shadow-sm">
      <div className="absolute top-4 left-4 z-10 bg-white px-4 py-3 rounded-md shadow-md text-black">
        <div className="font-semibold text-lg border-b pb-2 mb-2">
          "{keyword}" in {location}
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="w-4 h-4 inline-block bg-[#34A853] rounded-full mr-2"></span>
            <span>Rank 1-3</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 inline-block bg-[#FBBC05] rounded-full mr-2"></span>
            <span>Rank 4-10</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 inline-block bg-[#EA4335] rounded-full mr-2"></span>
            <span>Rank 11+</span>
          </div>
        </div>
      </div>
      
      {/* Add the Heatmap Control Panel */}
      <RankingHeatmapOverlay 
        nodes={nodes} 
        onViewChange={handleViewChange}
        onArrowsChange={(showArrows) => setShowTrendArrows(showArrows)}
      />
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={mapOptions}
      >
        {nodes.map((node) => (
          <OverlayView
            key={node.id}
            position={{ lat: node.lat, lng: node.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={getPixelPositionOffset}
          >
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center relative
                text-white font-bold shadow-md cursor-pointer transition-transform
                hover:scale-110 border-2 border-white hover:border-opacity-100 border-opacity-80
                ${showTrendOverlay ? 'opacity-80' : 'opacity-100'}
              `}
              style={{ 
                backgroundColor: showTrendOverlay 
                  ? (node.rankChange && node.rankChange > 0 
                      ? 'rgba(52, 168, 83, 0.9)' // Green for improving
                      : node.rankChange && node.rankChange < 0 
                        ? 'rgba(234, 67, 53, 0.9)' // Red for declining
                        : 'rgba(158, 158, 158, 0.9)') // Gray for unchanged
                  : getNodeBackgroundColor(node.rank)
              }}
              title={`Rank: ${node.rank}${node.rankChange ? `, Change: ${node.rankChange > 0 ? '+' : ''}${node.rankChange}` : ''}`}
              onMouseEnter={() => handleNodeHover(node)}
              onMouseLeave={() => handleNodeHover(null)}
              onClick={() => handleNodeClick(node)}
            >
              {node.rank}
              {showTrendArrows && getTrendArrow(node.rankChange)}
            </div>
          </OverlayView>
        ))}
        
        {selectedNode && (
          <InfoWindow
            position={{ lat: selectedNode.lat, lng: selectedNode.lng }}
            onCloseClick={() => {
              setSelectedNode(null);
              if (onNodeHover) onNodeHover(null);
            }}
          >
            <div className="p-3 max-w-[300px] bg-white text-black">
              <div className="font-bold mb-2 border-b pb-1 text-[#1C2526]">Rank #{selectedNode.rank}</div>
              <div className="text-sm">
                <div className="flex justify-between my-1">
                  <span className="text-gray-700">Location:</span>
                  <span>{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
                </div>
                {selectedNode.searchVolume !== undefined && (
                  <div className="flex justify-between my-1">
                    <span className="text-gray-700">Search Volume:</span>
                    <span>{selectedNode.searchVolume}/mo</span>
                  </div>
                )}
                <div className="flex justify-between my-1">
                  <span className="text-gray-700">Rank Change:</span>
                  <span className={`font-semibold ${selectedNode.rankChange && selectedNode.rankChange > 0 ? 'text-green-600' : selectedNode.rankChange && selectedNode.rankChange < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {selectedNode.rankChange && selectedNode.rankChange > 0 ? '+' : ''}{selectedNode.rankChange || 0}
                  </span>
                </div>
                {selectedNode.competitors && selectedNode.competitors.length > 0 && (
                  <div className="pt-1 mt-1 border-t">
                    <span className="text-gray-700 block mb-1 font-medium">Top Competitors:</span>
                    <div className="space-y-1">
                      {selectedNode.competitors.map((comp, i) => (
                        <div key={i} className="flex items-center text-xs">
                          <ChevronRightIcon className="h-3 w-3 text-[#F28C38] mr-1" />
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
        
        {/* Add trend connectors to show movement over time */}
        {showTrendLines && generatedHistoricalData.map((nodeHistory, index) => {
          // Only render if we have at least 2 points in the history
          if (nodeHistory.length >= 2) {
            return (
              <RankingTrendConnector 
                key={`trend-connector-${index}`}
                trendLines={generateTrendLines([nodeHistory])}
                showArrows={showTrendArrows}
                showLines={showTrendLines}
              />
            );
          }
          return null;
        })}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapRankingGrid;