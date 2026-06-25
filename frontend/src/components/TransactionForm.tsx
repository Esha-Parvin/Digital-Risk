import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, DollarSign, User } from 'lucide-react';
import { submitTransaction } from '../api';
import clsx from 'clsx';

interface Props {
  onSuccess: () => void;
}

export const TransactionForm = ({ onSuccess }: Props) => {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitTransaction(userId, parseFloat(amount));
      setAmount('');
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Try again later.');
      } else {
        setError(err.response?.data?.detail || 'Transaction failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Send size={24} color="var(--primary)" /> Send Transaction
      </h2>
      
      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <User size={20} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="User ID (e.g., user123)"
            className="input-field"
            style={{ paddingLeft: '40px' }}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>

        <div style={{ position: 'relative' }}>
          <DollarSign size={20} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="number"
            placeholder="Amount"
            className="input-field"
            style={{ paddingLeft: '40px' }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <button 
          type="submit" 
          className={clsx("btn-primary", { loading })}
          disabled={loading || !userId || !amount}
        >
          {loading ? 'Processing...' : 'Submit Transaction'}
        </button>
      </form>
    </motion.div>
  );
};
