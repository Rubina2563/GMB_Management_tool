import { useAuth } from "../lib/auth";
import { useEffect, useState } from "react";
import { Redirect, Link } from "wouter";
import { Building, DollarSign, Home, Key, UserRound, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Mock data for dashboard display
  const properties = [
    { id: 1, name: "Luxury Villa", location: "Beverly Hills", price: "$5,200,000", status: "Available" },
    { id: 2, name: "Waterfront Condo", location: "Miami Beach", price: "$2,100,000", status: "Pending" },
    { id: 3, name: "Penthouse Suite", location: "Manhattan", price: "$7,500,000", status: "Available" },
  ];

  // Redirect if user is not authenticated
  if (!isLoading && !user) {
    return <Redirect to="/auth" />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C38]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.username}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/api-keys">
            <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white">
              <Key className="mr-2 h-4 w-4" />
              Manage API Keys
            </Button>
          </Link>
        </div>
      </header>

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties">
            Properties
          </TabsTrigger>
          <TabsTrigger value="profile">
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-gray-200 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-black flex items-center">
                    <Building className="mr-2 h-5 w-5 text-[#F28C38]" />
                    Properties
                  </CardTitle>
                  <CardDescription>Your property portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{properties.length}</p>
                  <p className="text-sm text-gray-500">Listed properties</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-black flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-[#F28C38]" />
                    Value
                  </CardTitle>
                  <CardDescription>Total portfolio value</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$14.8M</p>
                  <p className="text-sm text-gray-500">Estimated market value</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-black flex items-center">
                    <Users className="mr-2 h-5 w-5 text-[#F28C38]" />
                    Clients
                  </CardTitle>
                  <CardDescription>Active client inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-gray-500">Interested buyers</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
                  <h2 className="text-xl font-bold text-black mb-4">Recent Activity</h2>
                  <ul className="space-y-3">
                    <li className="bg-white p-3 rounded-md border border-gray-200/30 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-[#6B5B95]/10 flex items-center justify-center mr-3">
                        <Home className="h-4 w-4 text-[#6B5B95]" />
                      </div>
                      <div>
                        <p className="font-medium">New property viewing scheduled</p>
                        <p className="text-sm text-gray-500">March 12, 2025 at 2:00 PM</p>
                      </div>
                    </li>
                    <li className="bg-white p-3 rounded-md border border-gray-200/30 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-[#F28C38]/10 flex items-center justify-center mr-3">
                        <DollarSign className="h-4 w-4 text-[#F28C38]" />
                      </div>
                      <div>
                        <p className="font-medium">Offer received on Luxury Villa</p>
                        <p className="text-sm text-gray-500">March 10, 2025 at 10:15 AM</p>
                      </div>
                    </li>
                    <li className="bg-white p-3 rounded-md border border-gray-200/30 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-[#6B5B95]/10 flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-[#6B5B95]" />
                      </div>
                      <div>
                        <p className="font-medium">New client registration</p>
                        <p className="text-sm text-gray-500">March 8, 2025 at 5:30 PM</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div>
                <Card className="border-gray-200 shadow-md h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-black flex items-center">
                      <Key className="mr-2 h-5 w-5 text-[#F28C38]" />
                      API Integration
                    </CardTitle>
                    <CardDescription>Manage your external API keys</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect with external services by configuring your API keys for data integration.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/api-keys" className="w-full">
                      <Button className="w-full bg-[#F28C38] hover:bg-[#F28C38]/80 text-white">
                        Configure API Keys
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1C2526] text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{property.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{property.location}</td>
                        <td className="px-6 py-4 text-sm font-medium text-[#F28C38]">{property.price}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'Available' 
                              ? 'bg-[#6B5B95]/10 text-[#6B5B95]' 
                              : 'bg-[#F28C38]/10 text-[#F28C38]'
                          }`}>
                            {property.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex flex-col items-center">
                  <div className="h-32 w-32 rounded-full bg-[#6B5B95] flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {user?.username.substring(0, 1).toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold">{user?.username}</h2>
                  <p className="text-gray-500">{user?.email}</p>
                </div>
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-black">Account Information</h3>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Username</p>
                          <p className="font-medium">{user?.username}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium">March 2025</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Account Type</p>
                          <p className="font-medium">Premium</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-black">API Integration</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      Connect external services by configuring your API keys for SEO, Analytics, and search data.
                    </p>
                    <Link href="/api-keys">
                      <Button className="bg-[#F28C38] hover:bg-[#F28C38]/80 text-white">
                        <Key className="mr-2 h-4 w-4" />
                        Manage API Keys
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}