import { useEffect, useState } from 'react';
import { getRiskAnalysis } from '../api';
import { ShieldAlert, Info, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface RiskAnalysis {
  risk_score: number;
  risk_level: string;
  confidence: number;
  recommendation: string;
  reasons: string[];
}

export const RiskPanel = ({ userId, refreshTrigger }: { userId: string, refreshTrigger: number }) => {
  const [data, setData] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRisk = async () => {
    try {
      const response = await getRiskAnalysis(userId);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch risk analysis", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [userId, refreshTrigger]);

  if (loading && !data) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading Risk Panel...</div>;
  if (!data) return null;

  // Determine colors based on risk level
  const isHigh = data.risk_level === 'High';
  const isMedium = data.risk_level === 'Medium';
  const color = isHigh ? 'var(--danger)' : isMedium ? 'var(--warning)' : 'var(--success)';
  const Icon = isHigh ? ShieldAlert : isMedium ? AlertTriangle : CheckCircle;

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0 }}>
          <Shield size={24} color={color} />
          Smart Risk Analysis
        </h2>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '4px 12px', 
          borderRadius: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          Confidence: <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>{data.confidence}%</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Risk Gauge Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: `conic-gradient(${color} ${data.risk_score}%, rgba(255, 255, 255, 0.05) ${data.risk_score}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{data.risk_score}</span>
            </div>
          </div>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', 
            padding: '4px 12px', borderRadius: '12px', 
            background: `${color}20`, color: color,
            fontWeight: '600', fontSize: '0.9rem'
          }}>
            <Icon size={16} />
            {data.risk_level} Risk
          </div>
        </div>

        {/* Explanations & Recommendation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            background: `${color}15`, 
            border: `1px solid ${color}30`
          }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 8px 0', color }}>Recommendation</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>{data.recommendation}</p>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} color="var(--text-muted)" />
              Detected Signals
            </h3>
            {data.reasons.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.reasons.map((reason, idx) => (
                  <li key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>No suspicious activity detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
