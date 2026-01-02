import React, { useState, useEffect } from 'react';
import { User, TransactionType } from '../../types';
import { RewardItem, ShippingType } from '../../types/rewards';
import { RewardsCatalogApi } from '../../services/rewardsCatalog';
import { Card, Button, Modal, Badge, Input } from '../../components/common/ui';
import { PointsCard } from '../../components/user/dashboard/PointsCard';
import { Package, Zap, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Api } from '../../services/api';

const RedeemReward: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);

  // Redemption Form State
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    const data = await RewardsCatalogApi.getRewards();
    // Filter out inactive rewards
    setRewards(data.filter(r => r.status === 'active'));
    setLoading(false);
  };

  const refreshData = () => {
    // Refresh user data by reloading the page or re-fetching
    window.location.reload();
  };

  const handleRedeem = async () => {
    if (!selectedReward || !currentUser) return;

    // Validation for physical items
    if (selectedReward.isPhysical && (!shippingAddress || !contactPhone)) {
      alert('Please provide shipping address and contact phone for physical rewards.');
      return;
    }

    try {
      setIsRedeeming(true);
      const transactionId = crypto.randomUUID();

      await RewardsCatalogApi.createRedemptionRequest({
        rewardId: selectedReward.id,
        rewardName: selectedReward.name,
        employeeCode: currentUser.employeeCode || 'UNKNOWN',
        employeeName: currentUser.name,
        businessUnit: currentUser.businessUnit || 'N/A',
        department: currentUser.department || 'N/A',
        branch: currentUser.branch || 'N/A',
        pointsUsed: selectedReward.pointsCost,
        shippingType: selectedReward.isPhysical ? ShippingType.DELIVERY : ShippingType.DIGITAL,
        shippingAddress: selectedReward.isPhysical ? shippingAddress : undefined,
        contactPhone: selectedReward.isPhysical ? contactPhone : undefined,
        transactionId: transactionId // Link to history
      });

      Api.createTransaction({
        id: transactionId, // Use same ID for syncing
        type: TransactionType.REDEEM,
        toUserId: currentUser.id,
        amount: selectedReward.pointsCost,
        rewardId: selectedReward.id,
        date: new Date().toISOString(),
        source: 'manual'
      });

      alert(`Redemption successful! Your request for ${selectedReward.name} has been submitted.`);
      refreshData(); // Refresh user points
      loadRewards(); // Refresh stock
      setSelectedReward(null);
      setShippingAddress('');
      setContactPhone('');
    } catch (e: any) {
      alert('Redemption failed: ' + e.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div>
      {/* 1. Points Card & Level Progress */}
      <PointsCard user={currentUser} />

      <div className="mt-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rewards Catalog</h2>
        <p className="text-gray-500">Redeem your hard-earned points for amazing rewards.</p>
      </div>

      {loading ? <div>Loading Catalog...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map(reward => {
            const canAfford = currentUser.pointsBalance >= reward.pointsCost;
            const outOfStock = reward.stock <= 0;

            return (
              <Card key={reward.id} className="flex flex-col h-full group hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                  <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {reward.isPhysical ? (
                      <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 backdrop-blur-sm">
                        <Package size={10} /> PHYSICAL
                      </span>
                    ) : (
                      <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 backdrop-blur-sm">
                        <Zap size={10} /> DIGITAL
                      </span>
                    )}
                  </div>
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 font-bold transform -rotate-12">OUT OF STOCK</span>
                    </div>
                  )}
                  {!outOfStock && reward.stock < 5 && (
                    <div className="absolute top-2 right-2">
                      <Badge color="red">Only {reward.stock} left!</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 text-gray-900">{reward.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{reward.description}</p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-brand-yellow drop-shadow-sm" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}>
                      {reward.pointsCost.toLocaleString()} <span className="text-xs text-gray-400 font-normal">PTS</span>
                    </span>
                    <Button
                      size="sm"
                      disabled={!canAfford || outOfStock}
                      onClick={() => setSelectedReward(reward)}
                      variant={canAfford ? 'primary' : 'danger'}
                      className={!canAfford ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {outOfStock ? 'No Stock' : canAfford ? 'Redeem' : 'Need Points'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        title="Confirm Redemption"
      >
        {selectedReward && (
          <div className="text-center">
            <img src={selectedReward.imageUrl} alt="" className="w-32 h-32 object-cover rounded-lg mx-auto mb-4 shadow-sm" />
            <h4 className="text-xl font-bold text-gray-900">{selectedReward.name}</h4>
            <p className="text-gray-500 mb-6">{selectedReward.description}</p>

            <div className="flex justify-center items-center gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-right">
                <div className="text-xs text-gray-400 font-bold uppercase">Cost</div>
                <div className="font-bold text-red-600 text-lg">-{selectedReward.pointsCost.toLocaleString()}</div>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div className="text-left">
                <div className="text-xs text-gray-400 font-bold uppercase">Balance After</div>
                <div className="font-bold text-green-600 text-lg">{(currentUser.pointsBalance - selectedReward.pointsCost).toLocaleString()}</div>
              </div>
            </div>

            {selectedReward.isPhysical && (
              <div className="text-left mb-6 space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h5 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <MapPin size={16} /> Shipping Details Required
                </h5>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <Input
                    placeholder="Full address for delivery"
                    value={shippingAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <Input
                    placeholder="08x-xxx-xxxx"
                    value={contactPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="secondary" onClick={() => setSelectedReward(null)} disabled={isRedeeming}>Cancel</Button>
              <Button onClick={handleRedeem} disabled={isRedeeming}>
                {isRedeeming ? 'Processing...' : 'Confirm Redemption'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div >
  );
};

export default RedeemReward;