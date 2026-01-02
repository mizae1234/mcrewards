import React, { useState } from 'react';
import { SingleRewardForm } from '../../components/user/give/SingleRewardForm';
import { GroupRewardForm } from '../../components/user/give/GroupRewardForm';
import { Gift, Users } from 'lucide-react';

const GiveReward: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'group'>('single');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    window.scrollTo(0, 0);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Give Rewards</h1>
        <p className="text-gray-500">Recognize your colleagues for their hard work.</p>
      </div>

      {showSuccess && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-center animate-fade-in-down">
          <span className="text-xl mr-2">🎉</span>
          <span className="font-bold">Transaction Successful! Points have been delivered.</span>
        </div>
      )}

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-gray-100 p-1.5 rounded-xl">
        <button
          onClick={() => setMode('single')}
          className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${mode === 'single'
            ? 'bg-white text-brand-red shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Gift size={20} /> Single Reward
        </button>
        <button
          onClick={() => setMode('group')}
          className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${mode === 'group'
            ? 'bg-white text-brand-red shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Users size={20} /> Group Reward
        </button>
      </div>

      {/* Mode Description */}
      <div className="text-center text-sm text-gray-500 max-w-lg mx-auto">
        {mode === 'single'
          ? "Scan their personal QR code or search for a recipient."
          : "Distribute points to a Department, Business Unit, or Branch."}
      </div>

      {/* Forms */}
      <div className="animate-fade-in-up">
        {mode === 'single' ? (
          <SingleRewardForm onSuccess={handleSuccess} />
        ) : (
          <GroupRewardForm onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
};

export default GiveReward;