import React from 'react';
import { motion } from 'motion/react';
import { WoodSignLink } from '../components/WoodSignLink';
import { RespectLocalsSign } from '../components/RespectLocalsSign';
import { SignPost } from '../components/SignPost';
import { AngryBird } from '../components/AngryBird';
import surferMenuConfig from '../surfer_menu_config.json';
import { useNavigate, useLocation } from 'react-router-dom';

const SignsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = surferMenuConfig.menu_items;

  const navItems = [
    { path: '/dashboard', ...menuItems[0], text: 'דף הבית' },
    { path: '/directory', ...menuItems[1], text: 'נבחרת הכוכבים' },
    { path: '/gallery', ...menuItems[2], text: 'גלריית תמונות' },
    { path: '/events', ...menuItems[3], text: 'אירועים' },
    { path: '/posts', ...menuItems[4], text: 'פוסטים' },
    { path: '/world-news', ...menuItems[5], text: 'חדשות' },
    { path: '/surfer-card', ...menuItems[6], text: 'דשבורד אישי' },
    { path: '/profile', ...menuItems[7], text: 'פרופיל שלי' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center py-12 px-4 overflow-x-hidden bg-[#e0f2f1]">
      {/* Beach Background Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-[#fdf5e6] -z-10" style={{ borderRadius: '100% 100% 0 0 / 20% 20% 0 0' }} />
      <div className="absolute bottom-[35vh] left-0 right-0 h-20 bg-[#80cbc4]/20 blur-2xl -z-10" />
      
      {/* Clouds */}
      <div className="absolute top-20 left-[10%] w-32 h-12 bg-white/60 blur-xl rounded-full -z-10" />
      <div className="absolute top-40 right-[15%] w-48 h-16 bg-white/40 blur-xl rounded-full -z-10" />

      {/* The Post (SVG Component) - Centered absolutely */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 pointer-events-none -z-10">
        <SignPost className="h-full w-full" />
      </div>

      {/* Sand Mound at the base of the pole */}
      <div className="absolute bottom-[38vh] left-1/2 -translate-x-1/2 w-24 h-8 bg-amber-200/60 blur-md rounded-[100%] -z-10" />
      <div className="absolute bottom-[39vh] left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-100/80 blur-sm rounded-[100%] -z-10" />

      {/* Respect the Locals Sign at the top */}
      <div className="scale-75 md:scale-100 mb-4 z-10 relative flex flex-col items-center">
        <RespectLocalsSign />
        {/* Nail for the diamond sign */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#2a2a2a] shadow-lg z-20" />
      </div>

      {/* Navigation Signs */}
      <div className="flex flex-col items-center w-full max-w-md gap-1 relative z-10">
        {navItems.map((item, idx) => (
          <div key={item.path} className="w-full max-w-[320px] flex justify-center relative">
            {/* Angry Bird perched on the Home Page sign */}
            {idx === 0 && (
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <AngryBird delay={0.5} />
              </div>
            )}
            <WoodSignLink 
              item={item}
              index={idx}
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            />
          </div>
        ))}
      </div>

      {/* Sand at the bottom */}
      <div className="mt-auto pt-20 flex flex-wrap justify-center gap-8 relative z-10">
        <motion.div 
          animate={{ rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-5xl drop-shadow-lg"
        >
          🐚
        </motion.div>
        <motion.div 
          animate={{ x: [-10, 10, -10] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="text-5xl drop-shadow-lg"
        >
          🦀
        </motion.div>
        <motion.div 
          animate={{ rotate: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="text-5xl drop-shadow-lg"
        >
          🌴
        </motion.div>
      </div>
    </div>
  );
};

export default SignsPage;

