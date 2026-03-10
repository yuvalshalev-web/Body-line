import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalogTimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#006994',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      },
    },
  },
});

const AnalogTimePicker: React.FC<AnalogTimePickerProps> = ({ value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeValue = value ? dayjs(`2024-01-01T${value}`) : dayjs();

  const handleAccept = (newValue: Dayjs | null) => {
    if (newValue) {
      onChange(newValue.format('HH:mm'));
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col gap-2 w-full">
        {/* Minimized View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full h-[48px] px-5 bg-white/40 backdrop-blur-md text-[var(--deep-teal-sea)] border border-white/40 rounded-2xl font-black text-sm hover:bg-white/60 transition-all shadow-sm group"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-[var(--vibrant-cyan)]" />
            <span>{value || 'בחירת שעה'}</span>
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Expanded Picker */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="overflow-hidden"
            >
              <div 
                className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden shadow-2xl mt-2 relative"
                style={{ backdropFilter: 'blur(20px)' }}
              >
                {/* Glassy overlay for extra frosted effect */}
                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <StaticTimePicker 
                    displayStaticWrapperAs="desktop"
                    orientation="portrait"
                    ampm={false}
                    value={timeValue}
                    onAccept={handleAccept}
                    onClose={handleCancel}
                    onChange={(newValue) => {
                      if (newValue) {
                        onChange(newValue.format('HH:mm'));
                      }
                    }}
                    slotProps={{
                      actionBar: { 
                        actions: ['accept', 'cancel'],
                        sx: {
                          '& .MuiButton-root': {
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            fontFamily: '"Inter", sans-serif',
                            color: '#006994',
                          }
                        }
                      },
                      toolbar: {
                        hidden: false,
                      }
                    }}
                    sx={{
                      '& .MuiPickersLayout-root': {
                        backgroundColor: 'transparent',
                      },
                      '& .MuiClock-root': {
                        backgroundColor: 'rgba(248, 250, 252, 0.5)',
                        margin: '16px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      },
                      '& .MuiClockPointer-root': {
                        backgroundColor: '#006994',
                      },
                      '& .MuiClockPointer-thumb': {
                        backgroundColor: '#006994',
                        borderColor: '#006994',
                      },
                      '& .MuiClock-pin': {
                        backgroundColor: '#006994',
                      },
                      '& .MuiPickersToolbar-root': {
                        padding: '24px 16px',
                        backgroundColor: 'rgba(248, 250, 252, 0.3)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        flexDirection: 'row !important', // Force LTR order
                        justifyContent: 'center !important', // Center digits
                        alignItems: 'center',
                        direction: 'ltr', // Ensure HH : mm order
                      },
                      '& .MuiPickersToolbar-content': {
                        display: 'flex',
                        flexDirection: 'row !important',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                      },
                      '& .MuiPickersToolbarText-root': {
                        fontSize: '3rem',
                        fontWeight: '300',
                        color: '#1e293b',
                      },
                      '& .MuiPickersToolbarText-root.Mui-selected': {
                        color: '#006994',
                        fontWeight: '600',
                      },
                      '& .MuiPickersToolbar-separator': {
                        fontSize: '3rem',
                        margin: '0 8px',
                        color: '#94a3b8',
                      }
                    }}
                  />
                </LocalizationProvider>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
};

export default AnalogTimePicker;
