import { Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Cpu className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-foreground">
          <span className="text-primary">NEXUS</span>HUB
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Personal productivity cockpit for sysadmins
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
