import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card h-full flex flex-col items-center justify-center py-6">
      <ClockIcon className="w-8 h-8 text-primary-400 mb-3" />
      <div className="text-4xl font-bold text-dark-100 tabular-nums">
        {format(time, 'HH:mm:ss')}
      </div>
      <div className="text-dark-400 mt-2 capitalize">
        {format(time, 'EEEE d MMMM yyyy', { locale: fr })}
      </div>
    </div>
  );
}
