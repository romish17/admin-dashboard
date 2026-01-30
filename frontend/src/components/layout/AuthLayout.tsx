import { ServerIcon } from '@heroicons/react/24/outline';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
            <ServerIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-dark-100">
          AdminDashboard
        </h1>
        <p className="mt-2 text-center text-sm text-dark-400">
          Personal productivity cockpit for sysadmins
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-dark-800 py-8 px-4 shadow-xl shadow-dark-950/50 sm:rounded-xl sm:px-10 border border-dark-700">
          {children}
        </div>
      </div>
    </div>
  );
}
