import { useLocation } from "wouter";
import { motion } from "framer-motion";

const features = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
    title: "React Frontend",
    description: "Modern UI built with React, Tailwind CSS, and Framer Motion for smooth animations."
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />,
    title: "Node.js Backend",
    description: "Express-powered API with clean routing structure and health endpoint monitoring."
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    title: "Rolex-Inspired Design",
    description: "Elegant UI with Rolex color palette and Montserrat typography for a premium feel."
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    title: "Axios Integration",
    description: "Seamless API communication between frontend and backend using Axios HTTP client."
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
    title: "Component Architecture",
    description: "Well-organized file structure with separate components, pages, and routes."
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    title: "Responsive Design",
    description: "Mobile-first approach ensuring perfect display on all device sizes."
  }
];

const Home = () => {
  const [_, navigate] = useLocation();
  
  const getStarted = () => {
    navigate("/documentation");
  };
  
  const viewCode = () => {
    window.open("https://github.com", "_blank");
  };

  const copyCommands = () => {
    const commands = `# Clone the repository
git clone https://github.com/username/react-node-starter.git

# Install dependencies
cd react-node-starter
npm install

# Start development server
npm run dev`;

    navigator.clipboard.writeText(commands)
      .then(() => {
        console.log("Commands copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy commands: ", err);
      });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-[#006039] to-[#9eca9e] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              className="text-3xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome to React + Node.js Project
            </motion.h1>
            <motion.p 
              className="text-xl mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              A powerful starter template with React frontend and Node.js backend
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button 
                className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg"
                onClick={getStarted}
              >
                Get Started
              </button>
              <button 
                className="bg-white hover:bg-[#f4f4f2] text-[#006039] px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg"
                onClick={viewCode}
              >
                View Code
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#006039]">Key Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-[#f4f4f2] rounded-lg p-6 shadow-md hover:shadow-lg transition duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-[#006039] rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#006039]">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 bg-[#f4f4f2]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#006039]">API Integration</h2>
            
            <motion.div 
              className="bg-white rounded-lg shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
                
                <div>
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
                
                <div className="mt-6">
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
              </div>
            </motion.div>
            
            <div className="mt-8 text-center">
              <button 
                className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg"
                onClick={() => {
                  fetch('/api/health')
                    .then(res => res.json())
                    .then(data => {
                      console.log('Server health:', data);
                    })
                    .catch(err => {
                      console.error('Health check failed:', err);
                    });
                }}
              >
                Test Endpoint
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Project Structure Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#006039]">Project Structure</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Frontend Structure */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-[#006039] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#a37e2c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Frontend Structure
              </h3>
              <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                /client<br/>
                ├── public/<br/>
                │   ├── index.html<br/>
                │   └── favicon.ico<br/>
                ├── src/<br/>
                │   ├── components/<br/>
                │   │   ├── Header.tsx<br/>
                │   │   ├── Footer.tsx<br/>
                │   │   └── ... other components<br/>
                │   ├── pages/<br/>
                │   │   ├── Home.tsx<br/>
                │   │   ├── Features.tsx<br/>
                │   │   └── ... other pages<br/>
                │   ├── lib/<br/>
                │   │   └── api.ts<br/>
                │   ├── App.tsx<br/>
                │   └── main.tsx<br/>
                ├── index.html<br/>
                └── tsconfig.json
              </div>
            </motion.div>
            
            {/* Backend Structure */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-[#006039] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#a37e2c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Backend Structure
              </h3>
              <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                /server<br/>
                ├── routes/<br/>
                │   ├── health.js<br/>
                │   └── ... other routes<br/>
                ├── middleware/<br/>
                │   └── ... middleware files<br/>
                ├── controllers/<br/>
                │   └── ... controller files<br/>
                ├── config/<br/>
                │   └── ... configuration files<br/>
                ├── index.ts<br/>
                └── routes.ts
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 bg-gradient-to-br from-[#006039] to-[#9eca9e] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Ready to Get Started?</h2>
            <p className="text-xl mb-10">Follow these simple steps to launch your project</p>
            
            <motion.div 
              className="bg-white text-gray-800 rounded-lg p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-left font-mono text-sm bg-gray-100 p-4 rounded">
                # Clone the repository<br/>
                git clone https://github.com/username/react-node-starter.git<br/><br/>
                
                # Install dependencies<br/>
                cd react-node-starter<br/>
                npm install<br/><br/>
                
                # Start development server<br/>
                npm run dev
              </div>
              
              <div className="mt-8 flex justify-center">
                <button 
                  className="bg-[#a37e2c] hover:bg-[#c9c08f] text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-lg flex items-center"
                  onClick={copyCommands}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Commands
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
