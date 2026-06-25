import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Coins } from 'lucide-react';
import { getUserSummary, getRiskAnalysis } from '../api';
import { RiskBadge } from './RiskBadge';

interface Props {
  userId: string;
  refreshTrigger: number;
}

interface UserData {
  username: string;
  total_amount: number;
  transaction_count: number;
  score: number;
  risk_score: number;
}

interface RiskData {
  risk_score: number;
  risk_level: string;
  reasons: string[];
}

export const UserSummary = ({ userId, refreshTrigger }: Props) => {
  const [data, setData] = useState<UserData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [summaryRes, riskRes] = await Promise.all([
          getUserSummary(userId),
          getRiskAnalysis(userId).catch(() => null), // gracefully handle 404
        ]);
        setData(summaryRes);
        setRiskData(riskRes);
      } catch (err) {
        console.error("User not found or error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [userId, refreshTrigger]);

  if (!userId) return null;

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={24} color="var(--accent)" /> Your Stats
      </h2>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading stats...</div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Amount</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                ${data.total_amount.toFixed(2)}
              </div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Transactions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                {data.transaction_count}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-glow)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="#fbbf24" />
                <span style={{ fontWeight: 600 }}>Total Score</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
                {data.score.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Risk Analysis Badge */}
          {riskData && (
            <RiskBadge
              riskScore={riskData.risk_score}
              riskLevel={riskData.risk_level}
              reasons={riskData.reasons}
            />
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)' }}>No stats found. Make a transaction!</div>
      )}
    </motion.div>
  );
};
