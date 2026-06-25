import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionForm } from './components/TransactionForm';
import { UserSummary } from './components/UserSummary';
import { Leaderboard } from './components/Leaderboard';
import { ActivityFeed } from './components/ActivityFeed';
import { SystemActivityFeed } from './components/SystemActivityFeed';
import { RiskPanel } from './components/RiskPanel';
import { SystemStats } from './components/SystemStats';
import { Sparkles } from 'lucide-react';
import { NavBar } from './components/NavBar';

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Dashboard Page Component
const DashboardPage = ({ refreshTrigger }: { refreshTrigger: number }) => (
  <motion.div 
    variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}
    style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
  >
    <SystemStats refreshTrigger={refreshTrigger} />
    <div style={{ height: '450px' }}>
      <Leaderboard refreshTrigger={refreshTrigger} />
    </div>
  </motion.div>
);

// Transactions Page Component
const TransactionsPage = ({ refreshTrigger, onTransactionSuccess }: { refreshTrigger: number, onTransactionSuccess: () => void }) => {
  const [searchId, setSearchId] = useState('user123');
  const [activeId, setActiveId] = useState('user123');

  return (
    <motion.div 
      variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <TransactionForm onSuccess={onTransactionSuccess} />
        <RiskPanel userId={activeId} refreshTrigger={refreshTrigger} />
      </div>
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
        <ActivityFeed userId={activeId} refreshTrigger={refreshTrigger} />
      </div>
    </motion.div>
  );
};

// Activity Page Component
const ActivityPage = ({ refreshTrigger }: { refreshTrigger: number }) => (
  <motion.div 
    variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}
    style={{ height: '600px' }}
  >
    <SystemActivityFeed refreshTrigger={refreshTrigger} />
  </motion.div>
);

const AnimatedRoutes = ({ refreshTrigger, handleTransactionSuccess }: any) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DashboardPage refreshTrigger={refreshTrigger} />} />
        <Route 
          path="/transactions" 
          element={
            <TransactionsPage 
              refreshTrigger={refreshTrigger} 
              onTransactionSuccess={handleTransactionSuccess} 
            />
          } 
        />
        <Route path="/activity" element={<ActivityPage refreshTrigger={refreshTrigger} />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Router>
      <div className="bg-blob primary" />
      <div className="bg-blob accent" />
      
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.h1 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            <Sparkles color="var(--primary)" size={32} />
            <span style={{ background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Gamified Transaction Hub
            </span>
          </motion.h1>
        </header>

        <NavBar />
        <AnimatedRoutes refreshTrigger={refreshTrigger} handleTransactionSuccess={handleTransactionSuccess} />
      </div>
    </Router>
  );
}

export default App;
