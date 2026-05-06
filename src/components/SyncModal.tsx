import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, CloudDownload, X } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export function SyncModal() {
  const { syncLocalToCloud, loadCloudToLocal, showSyncModal, setShowSyncModal } = useGame();
  const { user } = useAuth();
  const [cloudPreview, setCloudPreview] = useState<{ name: string; level: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Show sync modal when user logs in and hasn't made a choice
  useEffect(() => {
    if (user && !localStorage.getItem('auth-choice-made')) {
      setShowSyncModal(true);
    }
  }, [user, setShowSyncModal]);

  // Fetch cloud preview when modal opens
  useEffect(() => {
    async function fetchPreview() {
      if (showSyncModal && user) {
        setLoadingPreview(true);
        try {
          const { data } = await supabase
            .from('player_data')
            .select('game_state')
            .eq('user_id', user.id)
            .single();
          
          if (data?.game_state) {
            const state = data.game_state as any;
            setCloudPreview({
              name: state.character?.name || 'Sem nome',
              level: state.character?.level || 1
            });
          }
        } catch (e) {
          console.error('Error fetching preview:', e);
        } finally {
          setLoadingPreview(false);
        }
      }
    }
    fetchPreview();
  }, [showSyncModal, user]);

  const handleSyncChoice = async (choice: 'sync' | 'load') => {
    if (choice === 'sync') {
      await syncLocalToCloud();
    } else {
      await loadCloudToLocal();
    }
    localStorage.setItem('auth-choice-made', 'true');
    setShowSyncModal(false);
  };

  return (
    <AnimatePresence>
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-cinzel">Sincronização de Conta</h2>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-8">
              Detectamos que você entrou em uma conta. Como deseja prosseguir com seu progresso?
            </p>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleSyncChoice('sync')}
                className="group flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all text-left"
              >
                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-400">Sincronizar Atual</h3>
                  <p className="text-xs text-blue-300/70">Salva seu progresso local (nome novo, etc) nesta conta da nuvem.</p>
                </div>
              </button>

              <button
                onClick={() => handleSyncChoice('load')}
                className="group flex items-center gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all text-left"
              >
                <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                  <CloudDownload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-400">Carregar da Conta</h3>
                  <p className="text-xs text-purple-300/70">Descarta o progresso atual e carrega o que já estava salvo nesta conta.</p>
                  {loadingPreview ? (
                    <p className="text-[10px] text-gray-500 mt-1 italic animate-pulse">Buscando dados...</p>
                  ) : cloudPreview ? (
                    <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-purple-500/20 rounded border border-purple-500/30">
                      <span className="text-[10px] font-bold text-purple-300 uppercase">Encontrado:</span>
                      <span className="text-[10px] text-white font-mono">{cloudPreview.name} (Lvl {cloudPreview.level})</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 mt-1 italic">Nenhum dado encontrado na nuvem.</p>
                  )}
                </div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2d2d44]">
              <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
                Atenção: A ação escolhida não poderá ser desfeita.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
