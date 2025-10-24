'use client';

import { useState, useEffect } from 'react';
import { activityService } from '@/lib/firebase-services';
import type { Activity, Deal, Customer } from '@/types';
import { 
  Plus,
  MessageSquare,
  Phone,
  Calendar,
  Mail,
  CheckSquare,
  Clock,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const noteSchema = z.object({
  type: z.enum(['note', 'call', 'meeting', 'email', 'task']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  duration: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NotesProps {
  deal: Deal;
  customer?: Customer;
}

const activityIcons = {
  note: MessageSquare,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  task: CheckSquare,
};

const activityColors = {
  note: 'text-blue-500',
  call: 'text-green-500',
  meeting: 'text-purple-500',
  email: 'text-orange-500',
  task: 'text-red-500',
};

export default function Notes({ deal, customer }: NotesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      type: 'note',
      priority: 'medium',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    loadActivities();
  }, [deal.id]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getByDeal(deal.id);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: NoteFormData) => {
    try {
      // Build activity data, filtering out undefined values for Firebase
      const rawActivityData = {
        type: data.type,
        title: data.title,
        description: data.description,
        dealId: deal.id,
        customerId: deal.customerId,
        completed: data.type === 'task' ? false : true,
        outcome: data.outcome,
        nextAction: data.nextAction,
        duration: data.duration,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      };

      // Filter out undefined values to prevent Firebase errors
      const activityData = Object.fromEntries(
        Object.entries(rawActivityData).filter(([_, value]) => value !== undefined)
      ) as Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;

      if (editingActivity) {
        await activityService.update(editingActivity.id, activityData);
      } else {
        await activityService.create(activityData);
      }

      reset();
      setShowAddForm(false);
      setEditingActivity(null);
      await loadActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setValue('type', activity.type);
    setValue('title', activity.title);
    setValue('description', activity.description || '');
    setValue('outcome', activity.outcome || '');
    setValue('nextAction', activity.nextAction || '');
    setValue('duration', activity.duration);
    setValue('priority', activity.priority || 'medium');
    setValue('dueDate', activity.dueDate ? activity.dueDate.toISOString().split('T')[0] : '');
    setShowAddForm(true);
  };

  const handleDelete = async (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        await activityService.delete(activityId);
        await loadActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
          Notes & Activities
        </h3>
        <button
          onClick={() => {
            setEditingActivity(null);
            reset();
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
          style={{ 
            backgroundColor: '#2E4A62',
            color: 'white'
          }}
        >
          <Plus className="h-4 w-4" />
          Add Activity
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>
            {editingActivity ? 'Edit Activity' : 'Add New Activity'}
          </h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                  Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <option value="note">Note</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="task">Task</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a brief title..."
                style={{ fontFamily: 'var(--font-pt-sans)' }}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter details..."
                style={{ fontFamily: 'var(--font-pt-sans)' }}
              />
            </div>

            {(selectedType === 'call' || selectedType === 'meeting') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                    Duration (minutes)
                  </label>
                  <input
                    {...register('duration', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'var(--font-pt-sans)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                    Outcome
                  </label>
                  <input
                    {...register('outcome')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What was the result?"
                    style={{ fontFamily: 'var(--font-pt-sans)' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                Next Action
              </label>
              <input
                {...register('nextAction')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What needs to happen next?"
                style={{ fontFamily: 'var(--font-pt-sans)' }}
              />
            </div>

            {selectedType === 'task' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                  Due Date
                </label>
                <input
                  {...register('dueDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: 'var(--font-pt-sans)' }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#2E4A62', fontFamily: 'var(--font-pt-sans)' }}
              >
                {isSubmitting ? 'Saving...' : editingActivity ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingActivity(null);
                  reset();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-pt-sans)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500" style={{ fontFamily: 'var(--font-pt-sans)' }}>
              No activities yet. Add your first note or activity above.
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                          {activity.title}
                        </h4>
                        {activity.priority && activity.priority !== 'medium' && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`} style={{ fontFamily: 'var(--font-pt-sans)' }}>
                            {activity.priority}
                          </span>
                        )}
                      </div>
                      
                      {activity.description && (
                        <p className="text-gray-700 mb-2" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                          {activity.description}
                        </p>
                      )}
                      
                      {(activity.outcome || activity.nextAction || activity.duration) && (
                        <div className="space-y-1 text-sm">
                          {activity.outcome && (
                            <p style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <span className="font-medium text-gray-900">Outcome:</span>{' '}
                              <span className="text-gray-700">{activity.outcome}</span>
                            </p>
                          )}
                          {activity.nextAction && (
                            <p style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <span className="font-medium text-gray-900">Next Action:</span>{' '}
                              <span className="text-gray-700">{activity.nextAction}</span>
                            </p>
                          )}
                          {activity.duration && (
                            <p style={{ fontFamily: 'var(--font-pt-sans)' }}>
                              <span className="font-medium text-gray-900">Duration:</span>{' '}
                              <span className="text-gray-700">{activity.duration} minutes</span>
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                          <Clock className="h-4 w-4" />
                          {formatDate(activity.createdAt)}
                        </span>
                        {activity.dueDate && (
                          <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-pt-sans)' }}>
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(activity.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit activity"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}