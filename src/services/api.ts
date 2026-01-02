import { User, Reward, Transaction, QuotaSetting, UserRole, TransactionType, KPIReport, NewsItem } from '@/types';
import seedData from '@/lib/seedAdmin.json';

const STORAGE_KEYS = {
  USERS: 'mcrewards_users',
  REWARDS: 'mcrewards_rewards',
  TRANSACTIONS: 'mcrewards_transactions',
  QUOTAS: 'mcrewards_quotas',
  QR_TOKENS: 'mcrewards_qr_tokens',
  NEWS: 'mcrewards_news',
  CURRENT_USER: 'mcrewards_currentUser',
};

// Seed Data Initialization
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedData.users));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REWARDS)) {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(seedData.rewards));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seedData.transactions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTAS)) {
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(seedData.quotas));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NEWS)) {
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(seedData.news));
  }
};

initStorage();

// Generic Generic Helper
const getList = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const setList = <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));

export const Api = {
  // Users
  getUsers: () => getList<User>(STORAGE_KEYS.USERS),
  getUser: (id: string) => getList<User>(STORAGE_KEYS.USERS).find(u => u.id === id),
  saveUser: (user: User) => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    setList(STORAGE_KEYS.USERS, users);
  },
  deleteUser: (id: string) => {
    const users = getList<User>(STORAGE_KEYS.USERS).filter(u => u.id !== id);
    setList(STORAGE_KEYS.USERS, users);
  },

  // Rewards
  getRewards: () => getList<Reward>(STORAGE_KEYS.REWARDS),
  saveReward: (reward: Reward) => {
    const rewards = getList<Reward>(STORAGE_KEYS.REWARDS);
    const idx = rewards.findIndex(r => r.id === reward.id);
    if (idx >= 0) rewards[idx] = reward;
    else rewards.push(reward);
    setList(STORAGE_KEYS.REWARDS, rewards);
  },
  deleteReward: (id: string) => {
    const rewards = getList<Reward>(STORAGE_KEYS.REWARDS).filter(r => r.id !== id);
    setList(STORAGE_KEYS.REWARDS, rewards);
  },

  // Quotas
  getQuotas: () => getList<QuotaSetting>(STORAGE_KEYS.QUOTAS),
  saveQuota: (quota: QuotaSetting) => {
    const quotas = getList<QuotaSetting>(STORAGE_KEYS.QUOTAS);
    const idx = quotas.findIndex(q => q.role === quota.role);
    if (idx >= 0) quotas[idx] = quota;
    else quotas.push(quota);
    setList(STORAGE_KEYS.QUOTAS, quotas);
  },

  // Transactions
  getTransactions: () => getList<Transaction>(STORAGE_KEYS.TRANSACTIONS),
  createTransaction: (t: Transaction) => {
    const txs = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const users = getList<User>(STORAGE_KEYS.USERS);
    const rewards = getList<Reward>(STORAGE_KEYS.REWARDS);

    // Logic for Give
    if (t.type === TransactionType.GIVE) {
      const senderIdx = users.findIndex(u => u.id === t.fromUserId);
      const receiverIdx = users.findIndex(u => u.id === t.toUserId);

      if (senderIdx === -1 || receiverIdx === -1) throw new Error("User not found");
      if (users[senderIdx].quotaRemaining < t.amount) throw new Error("Insufficient quota");

      users[senderIdx].quotaRemaining -= t.amount;
      users[receiverIdx].pointsBalance += t.amount;
    }
    // Logic for Redeem
    else if (t.type === TransactionType.REDEEM) {
      const userIdx = users.findIndex(u => u.id === t.toUserId);
      const rewardIdx = rewards.findIndex(r => r.id === t.rewardId);

      // Logic for Redeem
      // Note: If using new Catalog, rewards might not be in the 'mcrewards_rewards' key if they are only in 'mcrewards_catalog_items'.
      // We will only deduct stock here if the reward is found in the old system. 
      // Otherwise we assume external validation (which RedeemReward.tsx does via RewardsCatalogApi)
      if (rewardIdx !== -1) {
        if (users[userIdx].pointsBalance < t.amount) throw new Error("Insufficient points");
        if (rewards[rewardIdx].stock <= 0) throw new Error("Out of stock");
        rewards[rewardIdx].stock -= 1;
      } else {
        // Lenient mode: Just check points
        if (users[userIdx].pointsBalance < t.amount) throw new Error("Insufficient points");
      }

      users[userIdx].pointsBalance -= t.amount;
    }

    // Save changes
    setList(STORAGE_KEYS.USERS, users);
    setList(STORAGE_KEYS.REWARDS, rewards);

    // Init status for REDEEM
    if (t.type === TransactionType.REDEEM && !t.shippingStatus) {
      t.shippingStatus = 'pending';
    }

    txs.unshift(t); // Add to top
    setList(STORAGE_KEYS.TRANSACTIONS, txs);
    return t;
  },

  updateShippingStatus: (transactionId: string, newStatus: string) => {
    const txs = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const idx = txs.findIndex(t => t.id === transactionId);
    if (idx === -1) throw new Error("Transaction not found");

    txs[idx].shippingStatus = newStatus as any; // Cast as any to satisfy literal type if string passed
    setList(STORAGE_KEYS.TRANSACTIONS, txs);
    return txs[idx];
  },

  getReports: (): KPIReport => {
    const users = getList<User>(STORAGE_KEYS.USERS);
    const txs = getList<Transaction>(STORAGE_KEYS.TRANSACTIONS);

    const totalPoints = txs
      .filter(t => t.type === TransactionType.GIVE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalRedemptions = txs.filter(t => t.type === TransactionType.REDEEM).length;

    // Simple Top Giver logic
    const giveMap = new Map<string, number>();
    txs.filter(t => t.type === TransactionType.GIVE).forEach(t => {
      if (t.fromUserId) giveMap.set(t.fromUserId, (giveMap.get(t.fromUserId) || 0) + t.amount);
    });
    let topGiverId = '';
    let maxGive = 0;
    giveMap.forEach((val, key) => { if (val > maxGive) { maxGive = val; topGiverId = key; } });

    // Simple Top Receiver logic
    const receiveMap = new Map<string, number>();
    txs.filter(t => t.type === TransactionType.GIVE).forEach(t => {
      receiveMap.set(t.toUserId, (receiveMap.get(t.toUserId) || 0) + t.amount);
    });
    let topReceiverId = '';
    let maxRec = 0;
    receiveMap.forEach((val, key) => { if (val > maxRec) { maxRec = val; topReceiverId = key; } });

    return {
      totalPointsDistributed: totalPoints,
      totalRedemptions,
      activeUsers: users.length,
      topGiver: users.find(u => u.id === topGiverId) || null,
      topReceiver: users.find(u => u.id === topReceiverId) || null
    }
  },

  // Reset for demo
  resetData: () => {
    localStorage.clear();
    initStorage();
    window.location.reload();
  },

  // QR Logic
  generateQR: (userId: string) => {
    const tokens = getList<import('../types').QRToken>(STORAGE_KEYS.QR_TOKENS);
    // Invalidate old tokens for this user (optional, but good for security)
    // const activeTokens = tokens.filter(t => t.userId !== userId || t.expiresAt > Date.now());

    const nonce = Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    // Simple signature simulation: userId + nonce + secret (not real crypto)
    const signature = btoa(`${userId}-${nonce}-secret`);
    const tokenString = `${userId}.${nonce}.${expiresAt}.${signature}`;

    const newToken: import('../types').QRToken = {
      token: tokenString,
      userId,
      nonce,
      createdAt: now,
      expiresAt,
      used: false
    };

    tokens.push(newToken);
    setList(STORAGE_KEYS.QR_TOKENS, tokens);
    return newToken;
  },

  verifyQR: (tokenString: string, giverId: string, amount: number, message: string) => {
    const tokens = getList<import('../types').QRToken>(STORAGE_KEYS.QR_TOKENS);
    const tokenFn = tokens.find(t => t.token === tokenString);

    if (!tokenFn) throw new Error("Invalid QR Token");
    if (tokenFn.used) throw new Error("QR Token already used");
    if (Date.now() > tokenFn.expiresAt) throw new Error("QR Token expired");
    if (tokenFn.userId === giverId) throw new Error("Cannot give points to yourself");

    // Verify signature (mock)
    const [uid, nonce, exp, sig] = tokenString.split('.');
    const validSig = btoa(`${uid}-${nonce}-secret`);
    if (sig !== validSig) throw new Error("Invalid Token Signature");

    // Process Transaction
    const transaction: Transaction = {
      id: 't' + Date.now(),
      type: TransactionType.GIVE,
      fromUserId: giverId,
      toUserId: tokenFn.userId, // The recipient is the token owner
      amount: amount,
      date: new Date().toISOString(),
      message: message || "QR Reward",
      category: 'QR Scan',
      categoryId: 'cat1', // simplified
      source: 'manual'
    };

    // Reuse createTransaction logic
    Api.createTransaction(transaction);

    // Mark token used
    tokenFn.used = true;
    const idx = tokens.findIndex(t => t.token === tokenString);
    tokens[idx] = tokenFn;
    setList(STORAGE_KEYS.QR_TOKENS, tokens);

    return transaction;
  },

  // Mock Authentication
  login: (employeeCode: string): { user: User; token: string } => {
    const users = Api.getUsers();
    // Lookup by employeeCode
    const user = users.find(u => u.employeeCode === employeeCode || u.email === employeeCode); // Allow fallback to email for legacy checks if needed

    if (!user) {
      throw new Error('User not found'); // In real app: Invalid credentials
    }

    // Create a mock token (In real app: JWT from server)
    const token = `mock-token-${user.id}-${Date.now()}`;

    // Store session
    localStorage.setItem('mcrewards_token', token);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    return { user, token };
  },

  logout: () => {
    localStorage.removeItem('mcrewards_token');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getSession: (): User | null => {
    const token = localStorage.getItem('mcrewards_token');
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (token && userStr) {
      try {
        const cachedUser = JSON.parse(userStr);
        // Return fresh user from storage if available
        const freshUser = Api.getUser(cachedUser.id);
        return freshUser || cachedUser;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};