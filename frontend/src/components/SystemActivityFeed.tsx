import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Trophy, CreditCard, Ban, Rss } from 'lucide-react';
import { getSystemActivityFeed } from '../api';

interface SystemActivityLog {
  type: string;
  message: string;
  timestamp: string;
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) return 'just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const SystemActivityFeed = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [logs, setLogs] = useState<SystemActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await getSystemActivityFeed();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch system activity feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <CreditCard size={18} color="var(--success)" />;
      case 'duplicate_blocked':
        return <Ban size={18} color="var(--danger)" />;
      case 'risk_alert':
        return <ShieldAlert size={18} color="var(--warning)" />;
      case 'rank_change':
        return <Trophy size={18} color="var(--accent)" />;
      default:
        return <Activity size={18} color="var(--primary)" />;
    }
  };

  if (loading && logs.length === 0) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading feed...</div>;

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', maxHeight: '400px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0 }}>
        <Rss size={24} color="var(--primary)" />
        Live System Activity
      </h2>
      
      {logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No recent activity found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
          <AnimatePresence>
            {logs.map((log, i) => (
              <motion.div 
                key={`${log.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)' 
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {getIcon(log.type)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {log.message}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {getRelativeTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
