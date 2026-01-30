import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiPatch, apiPost, getErrorMessage } from '@/services/api';
import { UserIcon, KeyIcon, TagIcon, FolderIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'profile', name: 'Profile', icon: UserIcon },
  { id: 'password', name: 'Password', icon: KeyIcon },
  { id: 'categories', name: 'Categories', icon: FolderIcon },
  { id: 'tags', name: 'Tags', icon: TagIcon },
];

export function Settings() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await apiPatch('/auth/me', profile);
      setUser(updated as never);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await apiPost('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Settings</h1>
        <p className="text-dark-400">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">Profile Information</h2>
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={user?.email || ''} disabled className="input bg-dark-700" />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" value={user?.username || ''} disabled className="input bg-dark-700" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">Change Password</h2>
              <form onSubmit={changePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">Manage Categories</h2>
              <p className="text-dark-400">Category management coming soon...</p>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-dark-100 mb-4">Manage Tags</h2>
              <p className="text-dark-400">Tag management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
