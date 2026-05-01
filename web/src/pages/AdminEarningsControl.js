import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import axios from 'axios';
import { DollarSign, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Components
import FinancialControlHeader from '@/components/admin/FinancialControlHeader';
import ReadyForBatchQueue from '@/components/admin/ReadyForBatchQueue';
import BatchManager from '@/components/admin/BatchManager';
import BatchPreviewDialog from '@/components/admin/BatchPreviewDialog';
import BatchDetailSheet from '@/components/admin/BatchDetailSheet';
import HeldQueue from '@/components/admin/HeldQueue';
import FlaggedQueue from '@/components/admin/FlaggedQueue';
import RiskSignalsPanel from '@/components/admin/RiskSignalsPanel';
import ProjectDevCostPanel from '@/components/admin/ProjectDevCostPanel';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminEarningsControl = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [approvedQueue, setApprovedQueue] = useState([]);
  const [batches, setBatches] = useState([]);
  const [heldEarnings, setHeldEarnings] = useState([]);
  const [flaggedEarnings, setFlaggedEarnings] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('ready');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  const fetchEarningsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [overviewRes, approvedRes, batchesRes, heldRes, flaggedRes] = await Promise.all([
        axios.get(`${API}/admin/earnings/overview`, { withCredentials: true }),
        axios.get(`${API}/admin/earnings/approved`, { withCredentials: true }),
        axios.get(`${API}/admin/payout/batches`, { withCredentials: true }),
        axios.get(`${API}/admin/earnings/held`, { withCredentials: true }),
        axios.get(`${API}/admin/earnings/flagged`, { withCredentials: true })
      ]);

      setOverview(overviewRes.data);
      setApprovedQueue(approvedRes.data.developers || []);
      setBatches(batchesRes.data.batches || []);
      setHeldEarnings(heldRes.data.held || []);
      setFlaggedEarnings(flaggedRes.data.flagged || []);
      
      // TODO: Fetch projects list for dev cost panel
      setProjects([
        { project_id: 'proj_1', name: 'DevOS Platform' },
        { project_id: 'proj_2', name: 'Client Dashboard' }
      ]);
    } catch (error) {
      console.error('Error fetching admin earnings data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchEarningsData();
    }
  }, [user]);

  const handleRefresh = () => {
    fetchEarningsData(true);
  };

  const handleCreateBatch = (developer) => {
    setSelectedDeveloper(developer);
    setIsPreviewOpen(true);
  };

  const handleConfirmCreateBatch = async () => {
    if (!selectedDeveloper) return;
    
    try {
      setIsCreatingBatch(true);
      
      const response = await axios.post(
        `${API}/admin/payout/batches`,
        {
          user_id: selectedDeveloper.user_id,
          earning_ids: selectedDeveloper.earnings.map(e => e.earning_id)
        },
        { withCredentials: true }
      );
      
      // Close dialog
      setIsPreviewOpen(false);
      setSelectedDeveloper(null);
      
      // Refresh data
      await fetchEarningsData(true);
    } catch (error) {
      console.error('Error creating batch:', error);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleApproveBatch = async (batch) => {
    try {
      await axios.post(
        `${API}/admin/payout/batches/${batch.batch_id}/approve`,
        {},
        { withCredentials: true }
      );
      
      // Refresh data
      await fetchEarningsData(true);
    } catch (error) {
      console.error('Error approving batch:', error);
    }
  };

  const handleMarkPaid = async (batch) => {
    try {
      await axios.post(
        `${API}/admin/payout/batches/${batch.batch_id}/mark-paid`,
        {},
        { withCredentials: true }
      );
      
      // Refresh data
      await fetchEarningsData(true);
    } catch (error) {
      console.error('Error marking batch as paid:', error);
    }
  };

  const handleBatchClick = async (batch) => {
    try {
      // Fetch full batch details with earnings snapshot
      const response = await axios.get(
        `${API}/admin/payout/batches/${batch.batch_id}`,
        { withCredentials: true }
      );
      
      setSelectedBatch(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      // Fallback to basic batch data
      setSelectedBatch(batch);
      setIsDetailOpen(true);
    }
  };

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  const handleOpenQA = (earning) => {
    // TODO: Navigate to QA history for this earning
    console.log('Open QA history for:', earning);
  };

  const handleReviewFlagged = (earning) => {
    // TODO: Open review modal for flagged earning
    console.log('Review flagged earning:', earning);
  };

  const approvedBatchesNotPaid = batches.filter(b => b.status === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Earnings Control
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage developer earnings, batches, and payouts
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:border-primary/30 transition-colors text-sm font-medium text-text-primary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* 1. Financial Control Header */}
          <FinancialControlHeader overview={overview} />

          {/* 2. Risk Signals Panel */}
          <RiskSignalsPanel
            overview={overview}
            heldCount={heldEarnings.length}
            flaggedCount={flaggedEarnings.length}
            approvedBatchesNotPaid={approvedBatchesNotPaid}
            onNavigate={handleNavigate}
          />

          {/* 3. Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-surface border border-border">
              <TabsTrigger value="ready">Ready for Batch</TabsTrigger>
              <TabsTrigger value="held">Held Queue</TabsTrigger>
              <TabsTrigger value="flagged">Flagged Queue</TabsTrigger>
              <TabsTrigger value="batches">Batch Manager</TabsTrigger>
            </TabsList>

            {/* Ready for Batch Queue */}
            <TabsContent value="ready" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text-primary mb-4">
                  Approved Earnings Queue
                </h3>
                <ReadyForBatchQueue 
                  developers={approvedQueue} 
                  onCreateBatch={handleCreateBatch}
                />
              </div>
            </TabsContent>

            {/* Held Queue */}
            <TabsContent value="held" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text-primary mb-4">
                  QA-Blocked Earnings
                </h3>
                <HeldQueue 
                  heldEarnings={heldEarnings}
                  onOpenQA={handleOpenQA}
                />
              </div>
            </TabsContent>

            {/* Flagged Queue */}
            <TabsContent value="flagged" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text-primary mb-4">
                  Trust-Blocked Earnings
                </h3>
                <FlaggedQueue 
                  flaggedEarnings={flaggedEarnings}
                  onReview={handleReviewFlagged}
                />
              </div>
            </TabsContent>

            {/* Batch Manager */}
            <TabsContent value="batches" className="space-y-4">
              <BatchManager 
                batches={batches}
                onApprove={handleApproveBatch}
                onMarkPaid={handleMarkPaid}
                onBatchClick={handleBatchClick}
              />
            </TabsContent>
          </Tabs>

          {/* 4. Project Dev Cost Panel */}
          <ProjectDevCostPanel projects={projects} />
        </div>

        {/* Dialogs */}
        <BatchPreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedDeveloper(null);
          }}
          developer={selectedDeveloper}
          onConfirm={handleConfirmCreateBatch}
          isCreating={isCreatingBatch}
        />

        <BatchDetailSheet
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBatch(null);
          }}
          batch={selectedBatch}
        />
      </div>
    </div>
  );
};

export default AdminEarningsControl;
