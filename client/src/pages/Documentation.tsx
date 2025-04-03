import { motion } from "framer-motion";

const Documentation = () => {
  return (
    <div className="bg-[#f4f4f2] min-h-screen py-12">
      <div className="w-full pl-[70px] pr-[150px]">
        <motion.div
          className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">Getting Started</h2>
            <p className="mb-4">
              Welcome to the React + Node.js project documentation. This guide will help you understand the project structure and how to get started.
            </p>
            
            <h3 className="text-xl font-semibold text-[#006039] mt-6 mb-3">Prerequisites</h3>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2">Node.js (v14 or later)</li>
              <li className="mb-2">npm or yarn</li>
              <li className="mb-2">Git</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#006039] mt-6 mb-3">Installation</h3>
            <p className="mb-4">Follow these steps to set up the project locally:</p>
            
            <div className="bg-gray-100 p-4 rounded-md mb-6 font-mono text-sm">
              # Clone the repository<br/>
              git clone https://github.com/username/react-node-starter.git<br/><br/>
              
              # Navigate to the project directory<br/>
              cd react-node-starter<br/><br/>
              
              # Install dependencies<br/>
              npm install<br/><br/>
              
              # Start the development server<br/>
              npm run dev
            </div>
            
            <p className="mb-4">
              This will start both the frontend and backend servers. The frontend will be available at <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:5000</code> and the backend API at <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:5000/api</code>.
            </p>
            
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">Project Structure</h2>
            <p className="mb-4">
              The project follows a client-server architecture with a clear separation of concerns:
            </p>
            
            <h3 className="text-xl font-semibold text-[#006039] mt-6 mb-3">Frontend (client)</h3>
            <p className="mb-4">
              The frontend is built with React, using TypeScript for type safety and Tailwind CSS for styling.
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2"><strong>client/src/components/</strong>: Reusable UI components</li>
              <li className="mb-2"><strong>client/src/pages/</strong>: Page components for routing</li>
              <li className="mb-2"><strong>client/src/lib/</strong>: Utility functions and API handlers</li>
              <li className="mb-2"><strong>client/src/index.css</strong>: Global styles and Tailwind imports</li>
              <li className="mb-2"><strong>client/src/App.tsx</strong>: Main application component and routing</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#006039] mt-6 mb-3">Backend (server)</h3>
            <p className="mb-4">
              The backend is built with Node.js and Express, using TypeScript for type safety.
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2"><strong>server/index.ts</strong>: Entry point for the Express server</li>
              <li className="mb-2"><strong>server/routes.ts</strong>: API route definitions</li>
              <li className="mb-2"><strong>server/storage.ts</strong>: Data storage interface</li>
              <li className="mb-2"><strong>shared/schema.ts</strong>: Data models and validation schemas</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">API Documentation</h2>
            
            <h3 className="text-xl font-semibold text-[#006039] mt-6 mb-3">Health Check</h3>
            <p className="mb-2"><strong>Endpoint:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">GET /api/health</code></p>
            <p className="mb-4"><strong>Description:</strong> Checks if the server is running properly.</p>
            <p className="mb-2"><strong>Response:</strong></p>
            <div className="bg-gray-100 p-4 rounded-md mb-6 font-mono text-sm">
              {`{
  "status": "healthy",
  "timestamp": "2023-10-30T12:34:56.789Z",
  "uptime": "2h 34m 12s",
  "message": "Server is running properly"
}`}
            </div>
            
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">Styling Guidelines</h2>
            <p className="mb-4">
              The project uses Tailwind CSS with a custom Rolex-inspired color palette:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2"><strong>Primary:</strong> <code className="bg-[#f4f4f2] px-1 py-0.5 rounded">#f4f4f2</code> (Light background)</li>
              <li className="mb-2"><strong>Secondary:</strong> <code className="bg-[#c9c08f] px-1 py-0.5 rounded text-white">#c9c08f</code> (Gold accent)</li>
              <li className="mb-2"><strong>Accent:</strong> <code className="bg-[#a37e2c] px-1 py-0.5 rounded text-white">#a37e2c</code> (Deep gold)</li>
              <li className="mb-2"><strong>Dark:</strong> <code className="bg-[#006039] px-1 py-0.5 rounded text-white">#006039</code> (Rolex green)</li>
              <li className="mb-2"><strong>Highlight:</strong> <code className="bg-[#9eca9e] px-1 py-0.5 rounded">#9eca9e</code> (Light green)</li>
            </ul>
            <p className="mb-4">
              The application uses Montserrat as the primary font family throughout the interface.
            </p>
            
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">Contributing</h2>
            <p className="mb-4">
              We welcome contributions to this project. Please follow these steps to contribute:
            </p>
            <ol className="list-decimal pl-6 mb-6">
              <li className="mb-2">Fork the repository</li>
              <li className="mb-2">Create a feature branch (<code className="bg-gray-100 px-1 py-0.5 rounded">git checkout -b feature/amazing-feature</code>)</li>
              <li className="mb-2">Commit your changes (<code className="bg-gray-100 px-1 py-0.5 rounded">git commit -m 'Add some amazing feature'</code>)</li>
              <li className="mb-2">Push to the branch (<code className="bg-gray-100 px-1 py-0.5 rounded">git push origin feature/amazing-feature</code>)</li>
              <li className="mb-2">Open a Pull Request</li>
            </ol>
            
            <h2 className="text-2xl font-semibold text-[#006039] mt-8 mb-4">License</h2>
            <p className="mb-4">
              This project is licensed under the MIT License - see the LICENSE file for details.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Documentation;
