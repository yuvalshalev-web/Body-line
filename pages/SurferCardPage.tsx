import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlayerCard from '../components/PlayerCard';
import ConsistencyRankWidget from '../components/ConsistencyRankWidget';
import UserAnalytics from '../components/UserAnalytics';
import { Trophy, Waves, Target } from 'lucide-react';

const SurferCardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    fetch(`/api/stats/user/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user stats:', err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#006994] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">טוען נתונים...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 font-['Assistant']" dir="rtl">
      <div className="mb-12 text-center md:text-right">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full mb-4 shadow-sm">
          <Trophy size={14} />
          כרטיס הגולש המקצועי שלי
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
          כרטיס הגולש שלי
        </h1>
        <p className="text-slate-400 font-bold mt-3 text-lg">
          הפרופיל המקצועי שלך בנבחרת חבל זוג
        </p>
      </div>

      {/* The Professional Player Card */}
      <div className="mb-12">
        <PlayerCard userId={currentUser?.id || 'guest'} />
      </div>

      {/* Consistency Rank Widget */}
      <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <ConsistencyRankWidget userSessions={userData?.totalSessions || 0} />
        <div className="bg-gradient-to-br from-[#006994] to-[#40E0D0] p-8 rounded-[3rem] text-white flex flex-col justify-center shadow-xl shadow-[#006994]/20">
          <h3 className="text-2xl font-black mb-4">הדרך למקצוענות</h3>
          <p className="font-bold opacity-90 leading-relaxed">
            התמדה היא המפתח לשיפור בים. ככל שתגיע ליותר סשנים, כך תעלה בדירוג הקהילה ותפתח יכולות חדשות.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <div className="px-4 py-2 bg-white/20 rounded-full text-sm font-black backdrop-blur-sm border border-white/10">
              היעד הבא: Legend Rank
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics below */}
      <div className="mt-16 border-t border-slate-100 pt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#006994]/10 rounded-xl flex items-center justify-center text-[#006994]">
            <Waves size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ניתוח ביצועים מעמיק</h2>
        </div>
        <UserAnalytics userId={currentUser?.id || 'guest'} />
      </div>
    </div>
  );
};

export default SurferCardPage;
