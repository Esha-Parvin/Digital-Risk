import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, ShieldBan, ShieldAlert, CalendarClock, Timer } from 'lucide-react';
import { getSystemStats } from '../api';

interface SystemStatsData {
  total_users: number;
  total_transactions: number;
  duplicates_blocked: number;
  high_risk_users: number;
  transactions_today: number;
  average_processing_time_ms: number;
}

const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const duration = 1000;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

const StatCard = ({ title, value, icon: Icon, color, suffix = '' }: StatCardProps) => (
  <motion.div
    className="glass-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    {/* Subtle gradient background accent */}
    <div style={{
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '100px',
      height: '100px',
      background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
      borderRadius: '50%'
    }} />

    <div style={{
      background: `${color}22`,
      padding: '12px',
      borderRadius: '12px',
      color: color
    }}>
      <Icon size={24} />
    </div>

    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
        <AnimatedCounter value={value} />{suffix}
      </div>
    </div>
  </motion.div>
);

export const SystemStats = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [stats, setStats] = useState<SystemStatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getSystemStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch system stats", err);
      }
    };
    fetchStats();
    
    // Also poll every 10 seconds for a live feel
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  if (!stats) return null;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '16px',
      marginBottom: '24px'
    }}>
      <StatCard title="Total Users" value={stats.total_users} icon={Users} color="#6366f1" />
      <StatCard title="Total Transactions" value={stats.total_transactions} icon={Activity} color="#10b981" />
      <StatCard title="Transactions Today" value={stats.transactions_today} icon={CalendarClock} color="#8b5cf6" />
      <StatCard title="High Risk Users" value={stats.high_risk_users} icon={ShieldAlert} color="#ef4444" />
      <StatCard title="Duplicates Blocked" value={stats.duplicates_blocked} icon={ShieldBan} color="#f59e0b" />
      <StatCard title="Avg Processing" value={stats.average_processing_time_ms} icon={Timer} color="#0ea5e9" suffix="ms" />
    </div>
  );
};
