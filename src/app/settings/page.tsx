'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealStageService, customerService, dealService } from '@/lib/firebase-services';
import CompanySettings from '@/components/settings/CompanySettings';
import type { DealStage } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Plus, Trash2, AlertCircle, Save, GripVertical, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Download, Upload, FileText } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  color: z.string().min(1, 'Color is required'),
});

type StageFormData = z.infer<typeof stageSchema>;

interface SortableStageProps {
  stage: DealStage;
  onEdit: (stage: DealStage) => void;
  onDelete: (stageId: string) => void;
  onMoveUp: (stageId: string) => void;
  onMoveDown: (stageId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SortableStage({ stage, onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 bg-white"
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1"
        >
          <GripVertical className="w-4 h-4 text-gray-700" />
        </div>
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
      <div className="flex items-center space-x-2">
        {/* Arrow buttons for manual ordering */}
        <div className="flex space-x-1">
          <button
            onClick={() => onMoveUp(stage.id)}
            disabled={!canMoveUp}
            className={`p-1 rounded ${
              canMoveUp 
                ? 'text-gray-700 hover:text-gray-900' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            title="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(stage.id)}
            disabled={!canMoveDown}
            className={`p-1 rounded ${
              canMoveDown 
                ? 'text-gray-700 hover:text-gray-900' 
                : 'text-gray-200 cursor-not-allowed'
            }`}
            title="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onEdit(stage)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(stage.id)}
          className="px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
          title="Delete stage"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stages, setStages] = useState<DealStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Collapsible section states
  const [isDealStagesCollapsed, setIsDealStagesCollapsed] = useState(true);
  const [isDataImportCollapsed, setIsDataImportCollapsed] = useState(true);
  const [isCompanySettingsCollapsed, setIsCompanySettingsCollapsed] = useState(true);
  const [isAccountSettingsCollapsed, setIsAccountSettingsCollapsed] = useState(true);

  // Import functionality state
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
    type: 'customers' | 'deals' | null;
  }>({ success: 0, errors: [], type: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((stage) => stage.id === active.id);
      const newIndex = stages.findIndex((stage) => stage.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);
      
      // Update order property
      const orderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index
      }));

      setStages(orderedStages);
      setIsReordering(true);

      try {
        await dealStageService.reorder(orderedStages);
      } catch (error) {
        console.error('Error reordering stages:', error);
        // Revert on error
        setStages(stages);
      } finally {
        setIsReordering(false);
      }
    }
  };

  const handleMoveUp = async (stageId: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === stageId);
    if (currentIndex > 0) {
      const newStages = arrayMove(stages, currentIndex, currentIndex - 1);
      const orderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index
      }));

      setStages(orderedStages);
      setIsReordering(true);

      try {
        await dealStageService.reorder(orderedStages);
      } catch (error) {
        console.error('Error reordering stages:', error);
        setStages(stages);
      } finally {
        setIsReordering(false);
      }
    }
  };

  const handleMoveDown = async (stageId: string) => {
    const currentIndex = stages.findIndex(stage => stage.id === stageId);
    if (currentIndex < stages.length - 1) {
      const newStages = arrayMove(stages, currentIndex, currentIndex + 1);
      const orderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index
      }));

      setStages(orderedStages);
      setIsReordering(true);

      try {
        await dealStageService.reorder(orderedStages);
      } catch (error) {
        console.error('Error reordering stages:', error);
        setStages(stages);
      } finally {
        setIsReordering(false);
      }
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
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    const confirmMessage = `Are you sure you want to delete the "${stage.name}" stage? This action cannot be undone and may affect existing deals.`;

    if (!confirm(confirmMessage)) {
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

  // Sample data for downloads
  const generateCustomerSample = () => {
    const csvContent = `name,email,phone,company,address
John Smith,john.smith@example.com,555-0123,Acme Corp,"123 Main St, New York, NY 10001"
Jane Doe,jane.doe@example.com,555-0456,TechStart Inc,"456 Tech Ave, San Francisco, CA 94102"
Bob Johnson,bob.johnson@example.com,555-0789,Global Solutions,"789 Business Blvd, Chicago, IL 60601"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateDealSample = () => {
    const csvContent = `title,customerEmail,value,probability,stage,type,description
"Q4 Software License",john.smith@example.com,25000,75,Proposal,subscription,"Annual software license renewal"
"Hardware Upgrade",jane.doe@example.com,15000,50,Discovery,one-time,"Office hardware upgrade project"
"Consulting Services",bob.johnson@example.com,50000,80,Negotiation,service,"6-month consulting engagement"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deals_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const result: string[][] = [];
    
    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const handleFileImport = async (file: File, type: 'customers' | 'deals') => {
    if (!user) return;
    
    setIsImporting(true);
    setImportResults({ success: 0, errors: [], type });
    
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error('File is empty');
      }
      
      const headers = rows[0].map(h => h.toLowerCase().replace(/"/g, ''));
      const dataRows = rows.slice(1);
      
      let successCount = 0;
      const errors: string[] = [];
      
      if (type === 'customers') {
        const requiredFields = ['name', 'email'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed
          
          try {
            const customerData: any = {};
            headers.forEach((header, index) => {
              const value = row[index]?.replace(/"/g, '').trim();
              if (value) {
                customerData[header] = value;
              }
            });
            
            if (!customerData.name || !customerData.email) {
              errors.push(`Row ${rowNum}: Missing required fields (name, email)`);
              continue;
            }
            
            // Check if customer already exists
            const existingCustomers = await customerService.getAll();
            const exists = existingCustomers.some(c => c.email.toLowerCase() === customerData.email.toLowerCase());
            
            if (exists) {
              errors.push(`Row ${rowNum}: Customer with email ${customerData.email} already exists`);
              continue;
            }
            
            await customerService.create(customerData);
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${rowNum}: ${error.message}`);
          }
        }
      } else if (type === 'deals') {
        const requiredFields = ['title', 'customeremail', 'value'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Get customers and stages for validation
        const [customers, dealStages] = await Promise.all([
          customerService.getAll(),
          dealStageService.getAll()
        ]);
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const rowNum = i + 2;
          
          try {
            const dealData: any = {};
            headers.forEach((header, index) => {
              const value = row[index]?.replace(/"/g, '').trim();
              if (value) {
                dealData[header] = value;
              }
            });
            
            if (!dealData.title || !dealData.customeremail || !dealData.value) {
              errors.push(`Row ${rowNum}: Missing required fields (title, customerEmail, value)`);
              continue;
            }
            
            // Find customer by email
            const customer = customers.find(c => c.email.toLowerCase() === dealData.customeremail.toLowerCase());
            if (!customer) {
              errors.push(`Row ${rowNum}: Customer with email ${dealData.customeremail} not found`);
              continue;
            }
            
            // Find stage by name or use first stage
            let stageId = dealStages[0]?.id;
            if (dealData.stage) {
              const stage = dealStages.find(s => s.name.toLowerCase() === dealData.stage.toLowerCase());
              if (stage) {
                stageId = stage.id;
              }
            }
            
            const dealToCreate = {
              title: dealData.title,
              customerId: customer.id,
              value: parseFloat(dealData.value) || 0,
              stageId,
              type: dealData.type || 'one-time',
              description: dealData.description || '',
              probability: parseFloat(dealData.probability) || 50, // Default to 50% if not provided
            };
            
            await dealService.create(dealToCreate);
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${rowNum}: ${error.message}`);
          }
        }
      }
      
      setImportResults({ success: successCount, errors, type });
    } catch (error: any) {
      setImportResults({ success: 0, errors: [error.message], type });
    } finally {
      setIsImporting(false);
    }
  };

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
            <Settings className="w-6 h-6 text-gray-700 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-900">Configure your CRM settings and preferences</p>
        </div>

        {/* Deal Stages Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div 
            className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsDealStagesCollapsed(!isDealStagesCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Deal Stages</h2>
                <p className="text-sm text-gray-900">Customize your sales pipeline stages</p>
              </div>
              {isDealStagesCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {!isDealStagesCollapsed && (
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-900">
                    Drag stages to reorder them, or use the arrow buttons
                  </p>
                  {isReordering && (
                    <div className="flex items-center text-sm text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Saving order...
                    </div>
                  )}
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {stages.map((stage, index) => (
                        <SortableStage
                          key={stage.id}
                          stage={stage}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          canMoveUp={index > 0}
                          canMoveDown={index < stages.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Data Import Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div 
            className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsDataImportCollapsed(!isDataImportCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Data Import</h2>
                <p className="text-sm text-gray-900">Import customers and deals from CSV files</p>
              </div>
              {isDataImportCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {!isDataImportCollapsed && (
            <div className="p-6 space-y-6">
              {/* Import Results */}
              {importResults.type && (
                <div className={`rounded-md p-4 ${
                  importResults.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {importResults.errors.length > 0 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${
                        importResults.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                        Import Results for {importResults.type}
                      </h3>
                      <div className={`mt-2 text-sm ${
                        importResults.errors.length > 0 ? 'text-yellow-700' : 'text-green-700'
                      }`}>
                        <p>Successfully imported: {importResults.success} records</p>
                        {importResults.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Errors ({importResults.errors.length}):</p>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              {importResults.errors.slice(0, 10).map((error, index) => (
                                <li key={index} className="text-xs">{error}</li>
                              ))}
                              {importResults.errors.length > 10 && (
                                <li className="text-xs">... and {importResults.errors.length - 10} more errors</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Import */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Customers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import customer data from a CSV file. Required fields: name, email. Optional: phone, company, address.
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={generateCustomerSample}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileImport(file, 'customers');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isImporting}
                    />
                    <button
                      disabled={isImporting}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isImporting && importResults.type === 'customers' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <p><strong>CSV Format:</strong> name,email,phone,company,address</p>
                  <p><strong>Required:</strong> name, email</p>
                </div>
              </div>

              {/* Deal Import */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Deals</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import deal data from a CSV file. Required fields: title, customerEmail, value. Optional: probability, stage, type, description.
                </p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={generateDealSample}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileImport(file, 'deals');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isImporting}
                    />
                    <button
                      disabled={isImporting}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isImporting && importResults.type === 'deals' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <p><strong>CSV Format:</strong> title,customerEmail,value,probability,stage,type,description</p>
                  <p><strong>Required:</strong> title, customerEmail, value</p>
                  <p><strong>Note:</strong> Customer must exist before importing deals</p>
                </div>
              </div>

              {/* Import Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Import Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• CSV files should have headers in the first row</li>
                  <li>• Use quotes around fields that contain commas</li>
                  <li>• Email addresses must be unique for customers</li>
                  <li>• Import customers before importing deals</li>
                  <li>• Deal stages will default to the first stage if not specified</li>
                  <li>• Deal types can be: one-time, subscription, service</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Company Settings Section */}
        <CompanySettings 
          isCollapsed={isCompanySettingsCollapsed}
          onToggleCollapse={() => setIsCompanySettingsCollapsed(!isCompanySettingsCollapsed)}
        />

        {/* Account Settings Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div 
            className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsAccountSettingsCollapsed(!isAccountSettingsCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-900">Manage your account preferences</p>
              </div>
              {isAccountSettingsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {!isAccountSettingsCollapsed && (
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
                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {user?.uid}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-900">
                  More account settings and integrations will be available in future updates.
                </p>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}