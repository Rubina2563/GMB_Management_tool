import React from 'react';
import { Helmet } from 'react-helmet';
import ComingSoon from '@/components/ComingSoon';

const OrganicRankingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Local Organic Rankings | LocalAuthority</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6 text-black">Local Organic Rankings</h1>
        <ComingSoon feature="Local Organic Rankings" />
      </div>
    </>
  );
};

export default OrganicRankingsPage;