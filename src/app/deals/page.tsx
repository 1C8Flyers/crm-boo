'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dealService, dealStageService, customerService } from '@/lib/firebase-services';
import type { Deal, DealStage, Customer } from '@/types';
import { Plus, DollarSign, Calendar, User, GripHorizontal, Search } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface DealCardProps {
  deal: Deal;
  customerName: string;
  isDragging?: boolean;
}

function DealCard({ deal, customerName, isDragging = false }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-3 cursor-pointer transition-colors ${
        isDragging ? 'opacity-50' : 'hover:bg-gray-100'
      }`}
      {...attributes}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{deal.title}</h4>
        <div
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 ml-2"
        >
          <GripHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-1" />
          <span>${deal.value.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          <span>{customerName}</span>
        </div>
        
        {deal.expectedCloseDate && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{deal.expectedCloseDate.toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {deal.description && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {deal.description}
        </p>
      )}

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Probability</span>
          <span className="font-medium">{deal.probability}%</span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${deal.probability}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default function Deals() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    try {
      const [dealsData, stagesData, customersData] = await Promise.all([
        dealService.getAll(),
        dealStageService.getAll(),
        customerService.getAll(),
      ]);

      setDeals(dealsData);
      setCustomers(customersData);
      
      // Initialize default stages if none exist
      if (stagesData.length === 0) {
        await dealStageService.initializeDefaultStages();
        const newStages = await dealStageService.getAll();
        setStages(newStages.sort((a, b) => a.order - b.order));
      } else {
        setStages(stagesData.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error loading deals data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers.find(c => c.id === deal.customerId)?.name
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stageId === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // Check if we're dropping over a stage or another deal
    const overStage = stages.find(stage => stage.id === overId);
    const overDeal = deals.find(deal => deal.id === overId);

    // If we're over a stage, move the deal to that stage
    if (overStage && activeDeal.stageId !== overStage.id) {
      setDeals(deals => deals.map(deal => 
        deal.id === activeId 
          ? { ...deal, stageId: overStage.id }
          : deal
      ));
    }
    // If we're over another deal, move to that deal's stage
    else if (overDeal && activeDeal.stageId !== overDeal.stageId) {
      setDeals(deals => deals.map(deal => 
        deal.id === activeId 
          ? { ...deal, stageId: overDeal.stageId }
          : deal
      ));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the deal being dragged
    const activeDeal = deals.find(deal => deal.id === activeId);
    if (!activeDeal) return;

    // Determine the target stage
    let targetStageId: string | null = null;
    
    const overStage = stages.find(stage => stage.id === overId);
    const overDeal = deals.find(deal => deal.id === overId);
    
    if (overStage) {
      targetStageId = overStage.id;
    } else if (overDeal) {
      targetStageId = overDeal.stageId;
    }

    // If moving to a different stage, update in Firebase
    if (targetStageId && activeDeal.stageId !== targetStageId) {
      try {
        await dealService.moveToStage(activeId, targetStageId);
        await loadData(); // Reload to ensure consistency
      } catch (error) {
        console.error('Error moving deal:', error);
        // Revert optimistic update
        await loadData();
      }
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals Pipeline</h1>
            <p className="text-gray-600">Track your sales opportunities</p>
          </div>
          <button
            onClick={() => router.push('/deals/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pipeline */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {isLoading ? (
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <div className="bg-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-gray-300 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-24 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stages.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deal stages configured</h3>
              <p className="text-gray-500 mb-4">Deal stages will be created automatically when you add your first deal</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                      {dealsByStage[stage.id]?.length || 0}
                    </span>
                  </div>

                  <SortableContext
                    items={dealsByStage[stage.id]?.map(deal => deal.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[200px]">
                      {dealsByStage[stage.id]?.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          customerName={getCustomerName(deal.customerId)}
                          isDragging={deal.id === activeId}
                        />
                      ))}
                      
                      {/* Drop zone for empty stages */}
                      {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                        <div
                          className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400"
                          data-stage-id={stage.id}
                        >
                          Drop deals here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>
          )}

          <DragOverlay>
            {activeId ? (
              <DealCard
                deal={deals.find(deal => deal.id === activeId)!}
                customerName={getCustomerName(deals.find(deal => deal.id === activeId)!.customerId)}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Pipeline Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageDeals = dealsByStage[stage.id] || [];
              const totalValue = stageDeals.reduce((sum: number, deal: Deal) => sum + deal.value, 0);
              const avgProbability = stageDeals.length > 0 
                ? stageDeals.reduce((sum: number, deal: Deal) => sum + deal.probability, 0) / stageDeals.length 
                : 0;
              
              return (
                <div key={stage.id} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{stage.name}</div>
                  <div className="text-xs text-gray-500">
                    {stageDeals.length} deals • {Math.round(avgProbability)}% avg
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}