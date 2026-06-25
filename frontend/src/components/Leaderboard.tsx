import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, ShieldCheck, ShieldQuestion, ShieldAlert } from 'lucide-react';
import { getRanking, getRiskAnalysis } from '../api';

interface Props {
  refreshTrigger: number;
}

interface RankData {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  movement: 'up' | 'down' | 'same';
  change: number;
}

interface RiskInfo {
  risk_score: number;
  risk_level: string;
}

const riskIcons: Record<string, { Icon: typeof ShieldCheck; color: string }> = {
  Low:    { Icon: ShieldCheck,    color: '#10b981' },
  Medium: { Icon: ShieldQuestion, color: '#f59e0b' },
  High:   { Icon: ShieldAlert,    color: '#ef4444' },
};

/** Renders ↑2  ↓1  or  = based on movement data */
const MovementBadge = ({ movement, change }: { movement: string; change: number }) => {
  if (movement === 'up') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          color: '#10b981',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px',
          background: 'rgba(16, 185, 129, 0.15)',
          padding: '2px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        ↑{change}
      </motion.span>
    );
  }
  if (movement === 'down') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          color: '#ef4444',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '1px',
          background: 'rgba(239, 68, 68, 0.15)',
          padding: '2px 8px',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        ↓{change}
      </motion.span>
    );
  }
  return (
    <span
      style={{
        color: '#94a3b8',
        fontWeight: 600,
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(148, 163, 184, 0.1)',
        padding: '2px 8px',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
      }}
    >
      =
    </span>
  );
};

export const Leaderboard = ({ refreshTrigger }: Props) => {
  const [ranking, setRanking] = useState<RankData[]>([]);
  const [riskMap, setRiskMap] = useState<Record<string, RiskInfo>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rankRes = await getRanking();
        setRanking(rankRes);

        // Fetch risk analysis for each user in the leaderboard (in parallel)
        const riskEntries = await Promise.all(
          rankRes.map(async (user: RankData) => {
            try {
              const risk = await getRiskAnalysis(user.user_id);
              return [user.user_id, { risk_score: risk.risk_score, risk_level: risk.risk_level }] as const;
            } catch {
              return [user.user_id, { risk_score: 0, risk_level: 'Low' }] as const;
            }
          })
        );
        setRiskMap(Object.fromEntries(riskEntries));
      } catch (err) {
        console.error("Failed to fetch ranking", err);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy size={24} color="#fbbf24" /> Leaderboard
      </h2>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <AnimatePresence>
          {ranking.map((user, index) => {
            const risk = riskMap[user.user_id];
            const riskCfg = risk ? riskIcons[risk.risk_level] || riskIcons['Low'] : null;

            return (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: user.rank <= 3 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0,0,0,0.2)',
                  border: user.rank <= 3 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  gap: '12px'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: user.rank === 1 ? '#fbbf24' : user.rank === 2 ? '#94a3b8' : user.rank === 3 ? '#b45309' : 'var(--bg-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: user.rank <= 3 ? '#000' : 'var(--text-muted)'
                }}>
                  {user.rank <= 3 ? <Medal size={16} /> : user.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{user.username}</div>
                </div>
                {/* Movement indicator */}
                <MovementBadge movement={user.movement} change={user.change} />
                {/* Risk indicator */}
                {riskCfg && (
                  <div title={`Risk: ${risk!.risk_level} (${risk!.risk_score.toFixed(0)})`}>
                    <riskCfg.Icon size={16} color={riskCfg.color} />
                  </div>
                )}
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {user.score.toFixed(2)} pts
                </div>
              </motion.div>
            );
          })}
          {ranking.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
              No rankings available yet.
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

