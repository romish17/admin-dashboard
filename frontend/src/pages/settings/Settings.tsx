import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiGet, apiPatch, apiPost, apiPut, apiDelete, getErrorMessage } from '@/services/api';
import { Category, Tag } from '@/types';
import { User, Key, Tag as TagIcon, Folder, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { TagForm } from '@/components/forms/TagForm';

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'password', name: 'Password', icon: Key },
  { id: 'categories', name: 'Categories', icon: Folder },
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

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isTagSaving, setIsTagSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'tags') {
      fetchTags();
    }
  }, [activeTab]);

  async function fetchCategories() {
    try {
      const data = await apiGet<Category[]>('/categories');
      setCategories(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function fetchTags() {
    try {
      const data = await apiGet<Tag[]>('/tags');
      setTags(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

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

  // Category handlers
  function openCategoryModal(category?: Category) {
    setEditingCategory(category || null);
    setIsCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  }

  async function handleCategorySubmit(data: { name: string; description?: string; color: string; icon?: string }) {
    setIsCategorySaving(true);
    try {
      if (editingCategory) {
        await apiPut(`/categories/${editingCategory.id}`, data);
        toast.success('Category updated');
      } else {
        await apiPost('/categories', data);
        toast.success('Category created');
      }
      closeCategoryModal();
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiDelete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  // Tag handlers
  function openTagModal(tag?: Tag) {
    setEditingTag(tag || null);
    setIsTagModalOpen(true);
  }

  function closeTagModal() {
    setIsTagModalOpen(false);
    setEditingTag(null);
  }

  async function handleTagSubmit(data: { name: string; color: string }) {
    setIsTagSaving(true);
    try {
      if (editingTag) {
        await apiPut(`/tags/${editingTag.id}`, data);
        toast.success('Tag updated');
      } else {
        await apiPost('/tags', data);
        toast.success('Tag created');
      }
      closeTagModal();
      fetchTags();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsTagSaving(false);
    }
  }

  async function deleteTag(id: string) {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await apiDelete(`/tags/${id}`);
      toast.success('Tag deleted');
      fetchTags();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={user?.email || ''} disabled className="input bg-muted" />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" value={user?.username || ''} disabled className="input bg-muted" />
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
              <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Manage Categories</h2>
                <button onClick={() => openCategoryModal()} className="btn-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  New Category
                </button>
              </div>

              {categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No categories yet. Create your first one!</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="text-foreground font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-muted-foreground text-sm">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openCategoryModal(category)}
                          className="p-2 hover:bg-dark-600 rounded"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 hover:bg-red-600/20 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Manage Tags</h2>
                <button onClick={() => openTagModal()} className="btn-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  New Tag
                </button>
              </div>

              {tags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tags yet. Create your first one!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full group"
                      style={{ backgroundColor: `${tag.color}20` }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-foreground">{tag.name}</span>
                      {tag.usageCount !== undefined && (
                        <span className="text-muted-foreground text-xs">({tag.usageCount})</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openTagModal(tag)}
                          className="p-1 hover:bg-dark-600 rounded"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteTag(tag.id)}
                          className="p-1 hover:bg-red-600/20 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <CategoryForm
          category={editingCategory || undefined}
          onSubmit={handleCategorySubmit}
          onCancel={closeCategoryModal}
          isLoading={isCategorySaving}
        />
      </Modal>

      {/* Tag Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
        title={editingTag ? 'Edit Tag' : 'New Tag'}
        size="sm"
      >
        <TagForm
          tag={editingTag || undefined}
          onSubmit={handleTagSubmit}
          onCancel={closeTagModal}
          isLoading={isTagSaving}
        />
      </Modal>
    </div>
  );
}
