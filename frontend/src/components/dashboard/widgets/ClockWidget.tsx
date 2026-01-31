import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col items-center justify-center py-6 h-full">
        <Clock className="w-8 h-8 text-primary mb-3" />
        <div className="text-4xl font-bold text-foreground tabular-nums">
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="text-muted-foreground mt-2 capitalize">
          {format(time, 'EEEE d MMMM yyyy', { locale: fr })}
        </div>
      </CardContent>
    </Card>
  );
}
