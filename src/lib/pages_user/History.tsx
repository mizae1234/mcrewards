import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Transaction, TransactionType } from '../../types';
import { Card, Input, Badge, Button } from '../../components/common/ui';
import { Download, Loader2 } from 'lucide-react';
import { RewardsCatalogApi } from '../../services/rewardsCatalog';
import { useAuth } from '../../contexts/AuthContext';

interface ApiTransaction {
  id: string;
  type: 'SINGLE' | 'GROUP';
  totalPoints: number;
  message?: string;
  createdAt: string;
  giver: {
    id: string;
    employeeCode: string;
    fullname: string;
    department: string;
    avatar?: string;
  };
  allocations: Array<{
    id: string;
    points: number;
    recipient: {
      id: string;
      employeeCode: string;
      fullname: string;
      department: string;
      avatar?: string;
    };
    category?: {
      id: string;
      name: string;
      color: string;
      icon?: string;
    };
  }>;
}

const History: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'RECEIVED' | 'GIVEN' | 'REDEEMED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Fetch transactions where user is giver or recipient
      const [giverRes, recipientRes] = await Promise.all([
        fetch(`/api/rewards/transactions?giverId=${currentUser.id}`),
        fetch(`/api/rewards/transactions?recipientId=${currentUser.id}`)
      ]);

      const giverData = giverRes.ok ? await giverRes.json() : { transactions: [] };
      const recipientData = recipientRes.ok ? await recipientRes.json() : { transactions: [] };

      // Combine and deduplicate
      const allTxMap = new Map<string, ApiTransaction>();
      [...giverData.transactions, ...recipientData.transactions].forEach((tx: ApiTransaction) => {
        allTxMap.set(tx.id, tx);
      });

      // Convert API transactions to internal Transaction format
      const convertedTx: Transaction[] = [];
      allTxMap.forEach((tx) => {
        tx.allocations.forEach((alloc) => {
          convertedTx.push({
            id: `${tx.id}-${alloc.id}`,
            type: TransactionType.GIVE,
            fromUserId: tx.giver.id,
            toUserId: alloc.recipient.id,
            amount: alloc.points,
            date: tx.createdAt,
            message: tx.message,
            category: alloc.category?.name,
            source: tx.type === 'GROUP' ? 'group' : 'manual'
          });
        });
      });

      setTransactions(convertedTx);

      // Build users map
      const userMap = new Map<string, User>();
      allTxMap.forEach((tx) => {
        userMap.set(tx.giver.id, {
          id: tx.giver.id,
          employeeCode: tx.giver.employeeCode,
          name: tx.giver.fullname,
          department: tx.giver.department
        } as User);
        tx.allocations.forEach((alloc) => {
          userMap.set(alloc.recipient.id, {
            id: alloc.recipient.id,
            employeeCode: alloc.recipient.employeeCode,
            name: alloc.recipient.fullname,
            department: alloc.recipient.department
          } as User);
        });
      });
      setAllUsers(Array.from(userMap.values()));

    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refreshData = () => {
    fetchTransactions();
  };

  const getUserName = (id?: string) => allUsers.find(u => u.id === id)?.name || 'System';

  const filteredData = useMemo(() => {
    if (!currentUser) return [];

    let data = transactions.filter(t => {
      // Basic Role filtering logic based on user interaction
      const isInvolved = t.fromUserId === currentUser.id || t.toUserId === currentUser.id;
      return isInvolved;
    });

    if (filter === 'RECEIVED') data = data.filter(t => t.toUserId === currentUser.id && t.type === TransactionType.GIVE);
    if (filter === 'GIVEN') data = data.filter(t => t.fromUserId === currentUser.id && t.type === TransactionType.GIVE);
    if (filter === 'REDEEMED') data = data.filter(t => t.toUserId === currentUser.id && t.type === TransactionType.REDEEM);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(t =>
        t.message?.toLowerCase().includes(lower) ||
        getUserName(t.fromUserId).toLowerCase().includes(lower) ||
        getUserName(t.toUserId).toLowerCase().includes(lower)
      );
    }

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentUser, filter, searchTerm, allUsers]);

  const exportCSV = () => {
    const headers = "Date,Type,From,To,Amount,Message\n";
    const rows = filteredData.map(t =>
      `${new Date(t.date).toLocaleDateString()},${t.type},${getUserName(t.fromUserId)},${getUserName(t.toUserId)},${t.amount},"${t.message || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history_export.csv';
    a.click();
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex bg-gray-100 p-1 rounded-md">
            {['ALL', 'RECEIVED', 'GIVEN', 'REDEEMED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded ${filter === f ? 'bg-white shadow text-brand-red' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <Input
              placeholder="Search by name or message..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No records found.</td></tr>
              ) : (
                filteredData.map(t => {
                  const isCredit = t.toUserId === currentUser.id && t.type === TransactionType.GIVE;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()} <span className="text-xs block">{new Date(t.date).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={t.type === TransactionType.REDEEM ? 'blue' : (isCredit ? 'green' : 'yellow')}>
                          {t.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {t.type === TransactionType.REDEEM ? (
                            <span>Redeemed Item</span>
                          ) : (
                            <span>
                              {isCredit ? `From: ${getUserName(t.fromUserId)}` : `To: ${getUserName(t.toUserId)}`}
                            </span>
                          )}
                        </div>
                        {t.message && <div className="text-xs text-gray-500 italic truncate max-w-xs">"{t.message}"</div>}
                        {t.category && <div className="text-xs text-gray-400 mt-1">{t.category}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {t.type === TransactionType.REDEEM && t.shippingStatus ? (
                          <div className="flex flex-col gap-2 items-start">
                            <Badge color={
                              t.shippingStatus === 'delivered' ? 'green' :
                                t.shippingStatus === 'shipped' ? 'blue' :
                                  t.shippingStatus === 'approved' ? 'yellow' : 'gray'
                            }>
                              {t.shippingStatus.toUpperCase()}
                            </Badge>
                            {t.shippingStatus === 'shipped' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Confirm you have received this item?')) {
                                    RewardsCatalogApi.markDeliveredByTransactionId(t.id, currentUser.fullname)
                                      .then(() => {
                                        refreshData(); // Refresh history list
                                      })
                                      .catch((err: any) => {
                                        console.error(err);
                                        // Just refresh the data
                                        refreshData();
                                      });
                                  }
                                }}
                              >
                                Mark Received
                              </Button>
                            )}
                            {t.trackingNumber && <div className="text-xs font-mono text-gray-500">Track: {t.trackingNumber}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{t.amount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default History;