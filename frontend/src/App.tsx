import { useState } from 'react';
import { TransactionForm } from './components/TransactionForm';
import { UserSummary } from './components/UserSummary';
import { Leaderboard } from './components/Leaderboard';
import { ActivityFeed } from './components/ActivityFeed';
import { SystemActivityFeed } from './components/SystemActivityFeed';
import { RiskPanel } from './components/RiskPanel';
import { SystemStats } from './components/SystemStats';
import { Sparkles } from 'lucide-react';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Sparkles color="var(--primary)" size={32} />
          <span style={{ background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gamified Transaction Hub
          </span>
        </h1>

      </header>

      <SystemStats refreshTrigger={refreshTrigger} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TransactionForm onSuccess={handleTransactionSuccess} />
          {/* We assume the user is 'user123' for demo purposes, or we could lift state up.
              For a better demo, let's just make it hardcoded to 'user123' or take input. 
              Wait, the TransactionForm has a userId input. We should lift that state up 
              or just let UserSummary fetch based on a hardcoded active user.
              Let's make UserSummary watch the last transacted userId by lifting state.
          */}
          <UserSummaryContainer refreshTrigger={refreshTrigger} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
          <div style={{ height: '450px' }}>
            <Leaderboard refreshTrigger={refreshTrigger} />
          </div>
          <div style={{ height: '400px' }}>
            <SystemActivityFeed refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to manage the user ID state for the summary
const UserSummaryContainer = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [searchId, setSearchId] = useState('user123');
  const [activeId, setActiveId] = useState('user123');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value)} 
            className="input-field" 
            placeholder="Search User ID..."
          />
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setActiveId(searchId)}>
            View
          </button>
        </div>
      </div>
      <UserSummary userId={activeId} refreshTrigger={refreshTrigger} />
      <RiskPanel userId={activeId} refreshTrigger={refreshTrigger} />
      <ActivityFeed userId={activeId} refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default App;
