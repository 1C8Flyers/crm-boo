'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealStageService } from '@/lib/firebase-services';
import CompanySettings from '@/components/settings/CompanySettings';
import type { DealStage } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Plus, Trash2, AlertCircle, Save } from 'lucide-react';

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  color: z.string().min(1, 'Color is required'),
});

type StageFormData = z.infer<typeof stageSchema>;

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadStages();
    }
  }, [user]);

  const loadStages = async () => {
    try {
      const stagesData = await dealStageService.getAll();
      
      // Initialize default stages if none exist
      if (stagesData.length === 0) {
        await dealStageService.initializeDefaultStages();
        const newStages = await dealStageService.getAll();
        setStages(newStages);
      } else {
        setStages(stagesData);
      }
    } catch (error) {
      console.error('Error loading stages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: StageFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (editingStage) {
        // Update existing stage
        await dealStageService.update(editingStage, {
          name: data.name,
          color: data.color,
        });
      } else {
        // Create new stage
        await dealStageService.create({
          name: data.name,
          color: data.color,
          order: stages.length,
        });
      }

      await loadStages();
      reset();
      setEditingStage(null);
    } catch (error: any) {
      console.error('Error saving stage:', error);
      setError('root', {
        message: error.message || 'Failed to save stage',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (stage: DealStage) => {
    setEditingStage(stage.id);
    reset({
      name: stage.name,
      color: stage.color,
    });
  };

  const handleDelete = async (stageId: string) => {
    if (!confirm('Are you sure you want to delete this stage? This cannot be undone.')) {
      return;
    }

    try {
      await dealStageService.delete(stageId);
      await loadStages();
    } catch (error: any) {
      console.error('Error deleting stage:', error);
      setError('root', {
        message: error.message || 'Failed to delete stage',
      });
    }
  };

  const cancelEdit = () => {
    setEditingStage(null);
    reset();
  };

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-gray-400 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Configure your CRM settings and preferences</p>
        </div>

        {/* Deal Stages Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Deal Stages</h2>
            <p className="text-sm text-gray-600">Customize your sales pipeline stages</p>
          </div>

          <div className="p-6">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              </div>
            )}

            {/* Add/Edit Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                {editingStage ? 'Edit Stage' : 'Add New Stage'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Stage Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter stage name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    Color *
                  </label>
                  <input
                    {...register('color')}
                    type="color"
                    className="mt-1 w-full h-10 border border-gray-300 rounded-md"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          const currentForm = document.querySelector('input[type="color"]') as HTMLInputElement;
                          if (currentForm) currentForm.value = color;
                        }}
                        className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
                  )}
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingStage ? 'Update' : 'Add'} Stage
                      </>
                    )}
                  </button>
                  {editingStage && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Stages List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-16 h-8 bg-gray-200 rounded"></div>
                      <div className="w-16 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{stage.name}</span>
                      {stage.isDefault && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(stage)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {!stage.isDefault && (
                        <button
                          onClick={() => handleDelete(stage.id)}
                          className="px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Company Settings Section */}
        <CompanySettings />

        {/* Account Settings Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
            <p className="text-sm text-gray-600">Manage your account preferences</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <div className="mt-1 text-sm text-gray-500 bg-gray-50 p-2 rounded font-mono">
                  {user?.uid}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  More account settings and integrations will be available in future updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}