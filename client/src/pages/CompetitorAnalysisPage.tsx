import React from 'react';
import { Helmet } from 'react-helmet';
import ComingSoon from '@/components/ComingSoon';

const CompetitorAnalysisPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Competitor Analysis | LocalAuthority</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6 text-black">Competitor Analysis</h1>
        <ComingSoon feature="Competitor Analysis" />
      </div>
    </>
  );
};

export default CompetitorAnalysisPage;