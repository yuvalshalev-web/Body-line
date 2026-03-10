import React, { useEffect, useRef } from 'react';
import $ from 'jquery';

interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChangeValue: (time: string) => void;
}

const bodyLineTimePickerConfig = {
    colors: {
        buttonTextColor: '#00D9E6', // vibrant-cyan
        clockFaceColor: '#007085', // deep-teal-sea
        clockInnerCircleTextColor: '#FFDE45', // sunshine-yellow
        clockOuterCircleTextColor: '#B2EBF2', // aqua-mist
        hoverCircleColor: '#FF2D60', // electric-red-pink
        popupBackgroundColor: '#00AFC2', // turquoise-teal
        popupHeaderBackgroundColor: '#007085', // deep-teal-sea
        popupHeaderTextColor: '#FFDE45', // sunshine-yellow
        selectorColor: '#FF2D60', // electric-red-pink
        selectorNumberColor: '#FFFFFF'
    },
    fonts: {
        fontFamily: 'Assistant, sans-serif',
    },
    precision: 5,
    vibrate: true
};

const TimePicker: React.FC<TimePickerProps> = ({ value, onChangeValue, className, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initPicker = async () => {
      if (typeof window !== 'undefined') {
        (window as any).jQuery = $;
        (window as any).$ = $;
      }
      
      await import('jquery-clock-timepicker');
      
      if (!isMounted || !inputRef.current) return;
      
      const $input = $(inputRef.current);
      
      ($input as any).clockTimePicker({
        ...bodyLineTimePickerConfig,
        onChange: function(newValue: string) {
          onChangeValue(newValue);
        }
      });

      $input.on('change', function() {
        onChangeValue($(this).val() as string);
      });
    };

    initPicker();

    return () => {
      isMounted = false;
      if (inputRef.current) {
        const $input = $(inputRef.current);
        $input.off('change');
        if (typeof ($input as any).clockTimePicker === 'function') {
          ($input as any).clockTimePicker('dispose');
        }
      }
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      $(inputRef.current).val(value);
    }
  }, [value]);

  return (
    <input 
      ref={inputRef}
      type="text" 
      defaultValue={value}
      className={`community-time-input ${className || ''}`}
      {...props}
    />
  );
};

export default TimePicker;
