import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

interface Props {
  riskScore: number;
  riskLevel: string;
  reasons: string[];
}

const levelConfig: Record<string, { color: string; bgColor: string; borderColor: string; Icon: typeof ShieldCheck }> = {
  Low:    { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', Icon: ShieldCheck },
  Medium: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', Icon: ShieldQuestion },
  High:   { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)',  borderColor: 'rgba(239, 68, 68, 0.4)',  Icon: ShieldAlert },
};

export const RiskBadge = ({ riskScore, riskLevel, reasons }: Props) => {
  const config = levelConfig[riskLevel] || levelConfig['Low'];
  const { color, bgColor, borderColor, Icon } = config;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={20} color={color} />
          <span style={{ fontWeight: 600, color }}>Risk: {riskLevel}</span>
        </div>
        <motion.div
          key={riskScore}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color,
          }}
        >
          {riskScore.toFixed(0)}/100
        </motion.div>
      </div>

      {/* Progress bar */}
      <div style={{ 
        width: '100%', 
        height: '6px', 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: reasons.length > 0 ? '12px' : '0',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(riskScore, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: '3px',
          }}
        />
      </div>

      {/* Reasons list */}
      {reasons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {reasons.map((reason, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ color, flexShrink: 0 }}>•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
