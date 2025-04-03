import { useState } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ApiReference = () => {
  const { toast } = useToast();
  const [healthResponse, setHealthResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/health", undefined);
      const data = await response.json();
      setHealthResponse(data);
      toast({
        title: "API Request Successful",
        description: "The health endpoint is working properly."
      });
    } catch (error) {
      console.error("Error testing health endpoint:", error);
      toast({
        title: "API Request Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f4f4f2] min-h-screen py-12">
      <div className="w-full pl-[70px] pr-[150px]">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-10">
            <div className="bg-[#006039] text-white py-4 px-6">
              <div className="flex items-center">
                <span className="text-lg font-semibold">Health Check Endpoint</span>
                <span className="ml-auto bg-green-500 text-xs px-2 py-1 rounded-full">GET</span>
              </div>
              <p className="text-sm text-[#c9c08f] mt-1">Verify your backend server is running properly</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#006039]">Request</h3>
                <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                  GET /api/health
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#006039]">Response</h3>
                <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                  {`{
  "status": "healthy",
  "timestamp": "2023-10-30T12:34:56.789Z",
  "uptime": "2h 34m 12s",
  "message": "Server is running properly"
}`}
                </div>
              </div>
              
              {healthResponse && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-[#006039]">Actual Response</h3>
                  <div className="bg-gray-800 text-blue-400 p-4 rounded font-mono text-sm overflow-x-auto">
                    {JSON.stringify(healthResponse, null, 2)}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#006039]">Frontend Integration</h3>
                <div className="bg-gray-800 text-blue-400 p-4 rounded font-mono text-sm overflow-x-auto">
{`import axios from 'axios';

const checkServerHealth = async () => {
  try {
    const response = await axios.get('/api/health');
    console.log('Server status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};`}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-[#006039]">Usage with React Query</h3>
                <div className="bg-gray-800 text-blue-400 p-4 rounded font-mono text-sm overflow-x-auto">
{`import { useQuery } from '@tanstack/react-query';

function HealthStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/health'],
  });

  if (isLoading) return <div>Checking server status...</div>;
  if (error) return <div>Error checking server status</div>;

  return (
    <div>
      <h2>Server Status: {data.status}</h2>
      <p>Uptime: {data.uptime}</p>
      <p>{data.message}</p>
    </div>
  );
}`}
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  className={`${
                    loading 
                      ? 'bg-gray-400' 
                      : 'bg-[#a37e2c] hover:bg-[#c9c08f]'
                  } text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg`}
                  onClick={testHealthEndpoint}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </span>
                  ) : (
                    'Test Endpoint'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-[#006039] mb-4">Additional API Notes</h2>
            <p className="mb-4">
              This project provides a simple health check endpoint as a starting point. In a real-world application, you would implement additional endpoints for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">User authentication and authorization</li>
              <li className="mb-2">CRUD operations for your application data</li>
              <li className="mb-2">File uploads</li>
              <li className="mb-2">Real-time communication using WebSockets</li>
              <li className="mb-2">Integration with third-party services</li>
            </ul>
            <p>
              All API endpoints should follow RESTful principles, use appropriate HTTP methods, and return standardized response structures with proper status codes.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiReference;
