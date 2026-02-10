'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiSettings,
  FiPlus,
  FiX,
  FiCheck,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiAlertTriangle,
  FiTag,
  FiClock,
} from 'react-icons/fi';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import type { SystemSetting } from '@/types';

interface CreateSettingForm {
  key: string;
  value: string;
  description: string;
  category: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch settings
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.getSettings(),
  });

  // Create setting form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSettingForm>({
    defaultValues: { key: '', value: '', description: '', category: '' },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSettingForm) =>
      api.createSetting({
        key: data.key,
        value: data.value,
        ...(data.description ? { description: data.description } : {}),
        ...(data.category ? { category: data.category } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      closeCreateModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: string; description?: string }) =>
      api.updateSetting(key, { value, ...(description !== undefined ? { description } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.deleteSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setDeleteConfirm(null);
    },
  });

  // Derive unique categories from data
  const categories = useMemo(() => {
    if (!settings) return [];
    const cats = new Set<string>();
    settings.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [settings]);

  // Filter settings by category
  const filteredSettings = useMemo(() => {
    if (!settings) return [];
    if (categoryFilter === 'all') return settings;
    return settings.filter((s) => s.category === categoryFilter);
  }, [settings, categoryFilter]);

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    reset();
    createMutation.reset();
  };

  const startEditing = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
    setEditDescription(setting.description || '');
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditValue('');
    setEditDescription('');
    updateMutation.reset();
  };

  const handleSaveEdit = (key: string) => {
    updateMutation.mutate({ key, value: editValue, description: editDescription || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform configuration and system parameters.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-blue flex items-center gap-2 !py-2.5 !px-4 text-sm w-fit"
        >
          <FiPlus /> New Setting
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            categoryFilter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All
          {settings && (
            <span className="ml-1.5 text-xs text-gray-400">({settings.length})</span>
          )}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              categoryFilter === cat
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat}
            <span className="ml-1.5 text-xs text-gray-400">
              ({settings?.filter((s) => s.category === cat).length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Settings List */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-dao-blue border-t-transparent rounded-full animate-spin" />
            Loading settings...
          </div>
        </div>
      ) : isError ? (
        <div className="card text-center py-12">
          <div className="text-red-500 mb-2">Failed to load settings.</div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })}
            className="text-sm text-dao-blue hover:underline"
          >
            Try again
          </button>
        </div>
      ) : filteredSettings.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiSettings className="text-xl text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No settings found</p>
          <p className="text-sm text-gray-400 mt-1">
            {categoryFilter !== 'all'
              ? `No settings in the "${categoryFilter}" category.`
              : 'Create your first system setting to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSettings.map((setting) => (
            <div
              key={setting.id}
              className="card hover:border-gray-200 transition-colors"
            >
              {editingKey === setting.key ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-semibold text-dao-blue bg-dao-blue/5 px-2 py-0.5 rounded">
                        {setting.key}
                      </code>
                      {setting.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          <FiTag className="text-[10px]" />
                          {setting.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={cancelEditing}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiX className="text-lg" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={editValue.length > 80 ? 4 : 2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                      placeholder="Optional description..."
                    />
                  </div>

                  {updateMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      Failed to update setting. Please try again.
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(setting.key)}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-dao-blue rounded-lg hover:bg-dao-blue/90 transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : (
                        <>
                          <FiSave /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono font-semibold text-dao-blue bg-dao-blue/5 px-2 py-0.5 rounded">
                        {setting.key}
                      </code>
                      {setting.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          <FiTag className="text-[10px]" />
                          {setting.category}
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-mono text-gray-900 break-all">{setting.value}</p>
                    </div>

                    {setting.description && (
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FiClock className="text-[10px]" />
                      Updated {format(new Date(setting.updatedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEditing(setting)}
                      className="p-2 text-gray-400 hover:text-dao-blue hover:bg-dao-blue/5 rounded-lg transition-colors"
                      title="Edit setting"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>

                    {deleteConfirm === setting.key ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate(setting.key)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Confirm delete"
                        >
                          {deleteMutation.isPending ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiCheck className="text-sm" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel delete"
                        >
                          <FiX className="text-sm" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(setting.key)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete setting"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Error Toast */}
      {deleteMutation.isError && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <FiAlertTriangle />
          Failed to delete setting.
          <button
            onClick={() => deleteMutation.reset()}
            className="ml-2 text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Setting Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Create New Setting</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('key', { required: 'Setting key is required' })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  placeholder="e.g. min_investment_amount"
                />
                {errors.key && (
                  <p className="text-xs text-red-500 mt-1">{errors.key.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('value', { required: 'Setting value is required' })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue resize-none"
                  placeholder="e.g. 5000"
                />
                {errors.value && (
                  <p className="text-xs text-red-500 mt-1">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  placeholder="Optional description of this setting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  {...register('category')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-dao-blue/20 focus:border-dao-blue"
                  placeholder="e.g. platform, kyc, investment"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {createMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  Failed to create setting. The key may already exist.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="btn-secondary flex-1 !py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-blue flex-1 !py-2.5 text-sm disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Setting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
