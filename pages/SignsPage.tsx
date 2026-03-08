import React from 'react';
import { RespectLocalsSign } from '../components/RespectLocalsSign';
import { SquareSharkSign } from '../components/SquareSharkSign';

const SignsPage: React.FC = () => {
  return (
    <div className="p-6 flex flex-col items-center gap-8">
      <h1 className="text-4xl font-black text-white mb-8">Signs Menu</h1>
      <RespectLocalsSign />
      <SquareSharkSign />
      {/* Add more signs here */}
    </div>
  );
};

export default SignsPage;
