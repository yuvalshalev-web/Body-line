import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Home, Users, Image, Calendar, MapPin, 
  Settings, Info, MessageCircle, Waves, Sun, 
  Anchor, Compass, LifeBuoy 
} from 'lucide-react';

// --- Types ---
interface MenuSign {
  id: string;
  text: string;
  icon: React.ReactNode;
  color: string;
  direction: 'left' | 'right';
  rotation: number;
  path: string;
}

// --- Components ---

const WoodSign: React.FC<{ sign: MenuSign; onClick?: () => void }> = ({ sign, onClick }) => {
  const isLeft = sign.direction === 'left';
  
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 0 }}
      initial={{ rotate: sign.rotation }}
      className={`relative w-64 h-16 flex items-center cursor-pointer transition-all duration-300 group ${isLeft ? 'pr-8' : 'pl-8'}`}
      onClick={onClick}
    >
      <div 
        className={`wood-texture w-full h-full flex items-center justify-center px-4 relative
          ${isLeft ? 'rounded-l-lg clip-path-arrow-left' : 'rounded-r-lg clip-path-arrow-right'}`}
        style={{ backgroundColor: sign.color }}
      >
        <div className="sign-nail" />
        <div className={`flex items-center gap-3 text-white font-display font-bold text-lg drop-shadow-md`}>
          {sign.icon}
          <span>{sign.text}</span>
        </div>
      </div>
    </motion.div>
  );
};

const NavigationDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const signs: MenuSign[] = [
    { id: '1', text: 'Home', icon: <Home size={20} />, color: '#00D9E6', direction: 'right', rotation: 2, path: '/' },
    { id: '2', text: 'Members', icon: <Users size={20} />, color: '#00AFC2', direction: 'left', rotation: -1.5, path: '/members' },
    { id: '3', text: 'Gallery', icon: <Image size={20} />, color: '#FF2D60', direction: 'right', rotation: 3, path: '/gallery' },
    { id: '4', text: 'Events', icon: <Calendar size={20} />, color: '#CC2678', direction: 'left', rotation: -2.5, path: '/events' },
    { id: '5', text: 'Spots', icon: <MapPin size={20} />, color: '#FFDE45', direction: 'right', rotation: 1.8, path: '/spots' },
    { id: '6', text: 'Forecast', icon: <Waves size={20} />, color: '#FF9F1C', direction: 'left', rotation: -3, path: '/forecast' },
    { id: '7', text: 'Community', icon: <MessageCircle size={20} />, color: '#C29670', direction: 'right', rotation: 1.2, path: '/community' },
    { id: '8', text: 'Safety', icon: <LifeBuoy size={20} />, color: '#007085', direction: 'left', rotation: -2.2, path: '/safety' },
    { id: '9', text: 'Equipment', icon: <Anchor size={20} />, color: '#B2EBF2', direction: 'right', rotation: 2.8, path: '/equipment' },
    { id: '10', text: 'Explore', icon: <Compass size={20} />, color: '#00D9E6', direction: 'left', rotation: -1.8, path: '/explore' },
    { id: '11', text: 'Weather', icon: <Sun size={20} />, color: '#FFDE45', direction: 'right', rotation: 2.4, path: '/weather' },
    { id: '12', text: 'About', icon: <Info size={20} />, color: '#00AFC2', direction: 'left', rotation: -2.8, path: '/about' },
    { id: '13', text: 'Settings', icon: <Settings size={20} />, color: '#7A1555', direction: 'right', rotation: 1.5, path: '/settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 glass z-50 overflow-y-auto p-8 flex flex-col gap-4 items-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-electric-pink transition-colors"
            >
              <X size={32} />
            </button>
            
            <div className="mt-12 flex flex-col gap-6 w-full items-center">
              {signs.map((sign) => (
                <Link key={sign.id} to={sign.path} onClick={onClose}>
                  <WoodSign sign={sign} />
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => (
  <header className="fixed top-0 left-0 w-full h-20 glass z-30 flex items-center justify-between px-8">
    <div className="flex items-center gap-4">
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Menu size={28} />
      </button>
      <h1 className="text-2xl font-display font-bold tracking-tight">
        Body<span className="text-cyan-vibrant">-line</span>
      </h1>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full glass flex items-center justify-center overflow-hidden border-2 border-cyan-vibrant">
        <img 
          src="https://picsum.photos/seed/surfer/100/100" 
          alt="Profile" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </header>
);

const HomePage = () => (
  <div className="pt-28 px-8 pb-12 max-w-7xl mx-auto">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {/* Hero Section */}
      <div className="col-span-full glass-card p-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h2 className="text-5xl font-display font-bold leading-tight">
            Welcome to <br />
            <span className="text-cyan-vibrant">Body-line</span>
          </h2>
          <p className="text-aqua-mist text-lg max-w-xl">
            The ultimate community platform for surfers. 
            Track your progress, share your sessions, and connect with the elite 50.
          </p>
          <div className="flex gap-4">
            <button className="glass-button bg-cyan-vibrant/20 border-cyan-vibrant/50 hover:bg-cyan-vibrant/40">
              Join Session
            </button>
            <button className="glass-button">
              View Gallery
            </button>
          </div>
        </div>
        <div className="w-full md:w-1/3 aspect-square rounded-3xl overflow-hidden glass border-4 border-white/10">
          <img 
            src="https://picsum.photos/seed/wave/600/600" 
            alt="Hero Wave" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="glass-card p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Active Members</h3>
          <Users className="text-cyan-vibrant" />
        </div>
        <div className="text-4xl font-bold">42 / 50</div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div className="bg-cyan-vibrant h-full w-[84%]" />
        </div>
      </div>

      <div className="glass-card p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Next Session</h3>
          <Calendar className="text-electric-pink" />
        </div>
        <div className="text-2xl font-bold">Tomorrow, 06:30 AM</div>
        <p className="text-aqua-mist">Zvulun Beach, Herzliya</p>
      </div>

      <div className="glass-card p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-bold">Wave Height</h3>
          <Waves className="text-sunshine-yellow" />
        </div>
        <div className="text-4xl font-bold">1.2m</div>
        <p className="text-aqua-mist">Period: 8.5s | Wind: 5kts E</p>
      </div>
    </motion.div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen">
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
        <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Placeholder routes for other pages */}
            <Route path="*" element={
              <div className="pt-32 text-center">
                <h2 className="text-3xl font-display font-bold">Page Under Construction</h2>
                <Link to="/" className="text-cyan-vibrant hover:underline mt-4 inline-block">Back to Home</Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
