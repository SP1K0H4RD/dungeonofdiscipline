import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameProvider, useGame } from '@/context/GameContext';
import { DEFAULT_PLAYER_PROFILE } from '@/types/game';
import { Header } from '@/components/Header';
import { Dashboard } from '@/sections/Dashboard';
import { Quests } from '@/sections/Quests';
import { Dungeon } from '@/sections/Dungeon';
import { MapSystem } from '@/sections/MapSystem';
import { Inventory } from '@/sections/Inventory';
import { Shop } from '@/sections/Shop';
// ProfileSetup removed - onboarding simplified to just name input
import { MasterChat } from '@/sections/MasterChat';
import type { MapId } from '@/types/game';
import { Swords, User, Play, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ============================================
// ERROR BOUNDARY - Global Error Protection
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error:', error, errorInfo);
    // Log to localStorage for debugging
    const errorLog = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      info: errorInfo.componentStack,
    };
    localStorage.setItem('dungeon-error-log', JSON.stringify(errorLog));
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
          <div className="card-dungeon p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white font-cinzel mb-2">
              Erro Temporário
            </h2>
            <p className="text-gray-400 mb-6">
              Ocorreu um erro inesperado. Não se preocupe, seus dados estão salvos!
            </p>
            {this.state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button 
              onClick={this.handleReload}
              className="w-full btn-primary py-4"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Recarregar Jogo
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// LOADING FALLBACK
// ============================================

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <Swords className="w-16 h-16 text-purple-500" />
        </motion.div>
        <p className="text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}

// ============================================
// WELCOME SCREEN - Character Creation
// ============================================

function WelcomeScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-dark p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="card-dungeon p-8 max-w-md w-full text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center glow-purple">
            <Swords className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold text-white font-cinzel mb-2"
        >
          Dungeon of Discipline
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-400 mb-8"
        >
          Transforme sua produtividade em uma jornada épica
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="text-left">
            <label className="text-sm text-gray-400 mb-1 block">
              Como devemos chamar você, aventureiro?
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome..."
                className="pl-10 bg-[#16213e] border-[#2d2d44] text-white text-lg py-6"
                maxLength={20}
              />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="w-full btn-primary py-6 text-lg flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Começar Jornada
            </Button>
          </motion.div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 pt-6 border-t border-[#2d2d44]"
        >
          <p className="text-sm text-gray-500">Sua vida real = energia do personagem</p>
          <p className="text-sm text-gray-500">Sua disciplina = arma</p>
          <p className="text-sm text-gray-500">Sua consistência = armadura</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// DEATH SCREEN
// ============================================

function DeathScreen({ onNewGame }: { onNewGame: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-black p-4"
    >
      <div className="card-dungeon p-8 max-w-md w-full text-center">
        <div className="text-8xl mb-6">💀</div>
        <h1 className="text-4xl font-bold text-red-500 font-cinzel mb-4">VOCÊ MORREU</h1>
        <p className="text-gray-400 mb-8">Seu personagem foi perdido na dungeon...</p>
        
        <div className="bg-[#16213e] rounded-lg p-4 mb-8 text-left">
          <p className="text-sm text-gray-400 mb-3">O que foi perdido:</p>
          <ul className="text-sm text-red-400 space-y-1">
            <li>• Level e XP</li>
            <li>• Equipamentos</li>
            <li>• Ataques especiais</li>
            <li>• Quests ativas</li>
            <li>• Streak</li>
            <li>• Progresso da dungeon</li>
          </ul>
          <p className="text-sm text-gray-400 mt-3">Mantido:</p>
          <ul className="text-sm text-green-400 space-y-1">
            <li>• Skins compradas</li>
            <li>• Conquistas cosméticas</li>
          </ul>
        </div>

        <Button onClick={onNewGame} className="w-full btn-primary py-6 text-lg">
          <RotateCcw className="w-5 h-5 mr-2" />
          Criar Novo Personagem
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN APP CONTENT
// ============================================

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [inDungeon, setInDungeon] = useState(false);
  const [showMapSystem, setShowMapSystem] = useState(false);
  const [currentCombat, setCurrentCombat] = useState<{ mapId: MapId; nodeId: string } | null>(null);
  const [showMasterChat, setShowMasterChat] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const { gameState, setCharacterName, resetProgress, completeProfileSetup, selectMapNode } = useGame();
  const { character } = gameState;

  // Show welcome screen if name not set
  if (!character.name) {
    return <WelcomeScreen onStart={(name) => {
      setCharacterName(name);
      // Auto-complete profile setup with defaults - no more Mestre wizard
      completeProfileSetup(DEFAULT_PLAYER_PROFILE);
    }} />;
  }

  // Check for death
  if (character.hp <= 0 && !showDeath) {
    setShowDeath(true);
  }

  if (showDeath) {
    return (
      <DeathScreen 
        onNewGame={() => {
          resetProgress();
          setShowDeath(false);
          window.location.reload();
        }} 
      />
    );
  }

  // Handle entering dungeon - now opens map system first
  const handleEnterDungeon = () => {
    setShowMapSystem(true);
  };

  // Handle entering combat from map
  const handleEnterCombat = (mapId: MapId, nodeId: string) => {
    // First select the node in game state (required for combat to work)
    selectMapNode(mapId, nodeId);
    setCurrentCombat({ mapId, nodeId });
    setInDungeon(true);
  };

  // Handle exiting combat - return to map
  const handleExitCombat = () => {
    setInDungeon(false);
    setCurrentCombat(null);
    // Keep map system open so player can choose next stage
  };

  // Handle exiting map system completely
  const handleExitMapSystem = () => {
    setShowMapSystem(false);
    setCurrentCombat(null);
    setInDungeon(false);
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onEnterDungeon={handleEnterDungeon} />;
      case 'quests':
        return <Quests onOpenMasterChat={() => setShowMasterChat(true)} />;
      case 'inventory':
        return <Inventory />;
      case 'shop':
        return <Shop />;
      default:
        return <Dashboard onEnterDungeon={handleEnterDungeon} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-dark pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onOpenMasterChat={() => setShowMasterChat(true)}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Map System - Stage Selection */}
      <AnimatePresence>
        {showMapSystem && !inDungeon && (
          <MapSystem 
            onEnterCombat={handleEnterCombat}
            onExit={handleExitMapSystem}
          />
        )}
      </AnimatePresence>

      {/* Dungeon Combat Screen */}
      <AnimatePresence>
        {inDungeon && currentCombat && (
          <Dungeon 
            mapId={currentCombat.mapId}
            nodeId={currentCombat.nodeId}
            onExit={handleExitCombat}
          />
        )}
      </AnimatePresence>

      {/* Master Chat */}
      <MasterChat isOpen={showMasterChat} onClose={() => setShowMasterChat(false)} />

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2d2d44] py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>Dungeon of Discipline - Gamifique sua produtividade</p>
          <p className="mt-1">Sua disciplina é sua maior arma</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// ROOT APP
// ============================================

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial load
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  });

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
