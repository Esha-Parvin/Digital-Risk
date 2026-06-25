import { useEffect, useState } from 'react';
import { getAuditLogs } from '../api';
import { Activity, ShieldAlert, Trophy, CreditCard, Ban } from 'lucide-react';

interface AuditLog {
  action_type: string;
  description: string;
  timestamp: string;
}

export const ActivityFeed = ({ userId, refreshTrigger }: { userId: string, refreshTrigger: number }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = await getAuditLogs(userId);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initially and on trigger, also set interval
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [userId, refreshTrigger]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Transaction Created':
        return <CreditCard size={18} color="var(--success)" />;
      case 'Duplicate Transaction Blocked':
        return <Ban size={18} color="var(--danger)" />;
      case 'Risk Score Updated':
        return <ShieldAlert size={18} color="var(--warning)" />;
      case 'Rank Changed':
        return <Trophy size={18} color="var(--accent)" />;
      case 'Rate Limit Exceeded':
        return <Ban size={18} color="var(--danger)" />;
      default:
        return <Activity size={18} color="var(--primary)" />;
    }
  };

  if (loading && logs.length === 0) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading feed...</div>;

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0 }}>
        <Activity size={24} color="var(--primary)" />
        Recent Activity
      </h2>
      
      {logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No recent activity found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ marginTop: '2px' }}>
                {getIcon(log.action_type)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{log.action_type}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>{log.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
