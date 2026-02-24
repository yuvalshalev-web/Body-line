import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserAnalytics from '../components/UserAnalytics';
import { Waves } from 'lucide-react';

const MyWavePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-['Assistant']" dir="rtl">
      <div className="mb-12 text-center md:text-right">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#40E0D0]/10 text-[#006994] text-[10px] font-black rounded-full mb-4 shadow-sm">
          <Waves size={14} />
          הגל האישי שלי
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
          הגל שלי
        </h1>
        <p className="text-slate-400 font-bold mt-3 text-lg">
          הביצועים, ההתקדמות והסטטיסטיקה האישית שלך בים
        </p>
      </div>

      <div className="mt-8">
        <UserAnalytics userId={currentUser?.id || 'guest'} />
      </div>
    </div>
  );
};

export default MyWavePage;
