import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Check, 
  Trash2, 
  Zap, 
  Coins, 
  Gift, 
  Calendar, 
  Target,
  Flame,
  Sparkles,
  MessageSquare,
  Bot
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import type { Quest, Difficulty, QuestType, DayOfWeek } from '@/types/game';
import { getBrazilDateStringFromDate } from '@/types/game';
import {
    Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const difficultyConfig: Record<Difficulty, { color: string; bg: string; label: string; border: string; emoji: string }> = {
  veryEasy: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Muito Fácil', border: 'border-green-500', emoji: '🟩' },
  easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Fácil', border: 'border-emerald-500', emoji: '🟢' },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Normal', border: 'border-blue-500', emoji: '🔵' },
  hard: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Difícil', border: 'border-purple-500', emoji: '🟣' },
  veryHard: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Muito Difícil', border: 'border-red-500', emoji: '🔴' },
  meta: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Meta', border: 'border-yellow-500', emoji: '🟡' },
};

interface QuestCardProps {
  quest: Quest;
  onComplete: () => void;
  onDelete: () => void;
}

function QuestCard({ quest, onComplete, onDelete }: QuestCardProps) {
  const diff = difficultyConfig[quest.difficulty];
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      className={cn(
        'card-dungeon p-4 relative overflow-hidden',
        quest.completed && 'opacity-50'
      )}
    >
      {/* Difficulty Indicator */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1',
        diff.border
      )} />

      <div className="flex items-start gap-4 pl-3">
        {/* Complete Button */}
        <motion.button
          onClick={onComplete}
          disabled={quest.completed}
          className={cn(
            'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
            quest.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-500 hover:border-green-500 hover:bg-green-500/20'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {quest.completed && <Check className="w-5 h-5 text-white" />}
        </motion.button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={cn(
              'font-semibold',
              quest.completed ? 'text-gray-500 line-through' : 'text-white'
            )}>
              {quest.title}
            </h4>
            <span className={cn('text-xs px-2 py-0.5 rounded', diff.bg, diff.color)}>
              {diff.label}
            </span>
            {quest.type === 'diaria' && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Diária
              </span>
            )}
            {quest.type === 'habito' && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Hábito
              </span>
            )}
            {quest.type === 'meta' && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Meta
              </span>
            )}
            {quest.suggestedByMaster && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Mestre
              </span>
            )}
            {quest.focusTag && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                🎯 {quest.focusTag}
              </span>
            )}
          </div>
          
          <p className={cn(
            'text-sm mb-3',
            quest.completed ? 'text-gray-600' : 'text-gray-400'
          )}>
            {quest.description}
          </p>

          {/* Rewards */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1 text-purple-400">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-mono">+{quest.xpReward} XP</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-mono">+{quest.coinReward}</span>
            </div>
            {quest.lootboxChance > 0 && (
              <div className="flex items-center gap-1 text-cyan-400">
                <Gift className="w-4 h-4" />
                <span className="text-sm">{Math.round(quest.lootboxChance * 100)}% Loot</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <motion.button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

interface QuestsProps {
  onOpenMasterChat?: () => void;
}

export function Quests({ onOpenMasterChat }: QuestsProps) {
  const { gameState, createQuest, addQuest, completeQuest, deleteQuest, sendChatMessage } = useGame();
  const { playerProfile } = gameState;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    type: 'diaria' as QuestType,
    difficulty: 'normal' as Difficulty,
    scheduledDate: '',
    habitDays: [] as DayOfWeek[],
    metaTarget: 100,
  });

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowQuestModal(true);
  };

  const handleCompleteFromModal = () => {
    if (selectedQuest) {
      completeQuest(selectedQuest.id, selectedQuest.type);
      setShowQuestModal(false);
      setSelectedQuest(null);
    }
  };

  const handleDeleteFromModal = () => {
    if (selectedQuest) {
      deleteQuest(selectedQuest.id, selectedQuest.type);
      setShowQuestModal(false);
      setSelectedQuest(null);
    }
  };

  const handleCreateQuest = () => {
    if (!newQuest.title.trim()) return;
    
    // Validate habit quest requirements
    if (newQuest.type === 'habito' && newQuest.habitDays.length === 0) {
      alert('Por favor, selecione pelo menos um dia da semana para o hábito.');
      return;
    }
    
    const quest = createQuest(
      newQuest.title,
      newQuest.description,
      newQuest.type,
      newQuest.difficulty,
      false,
      false,
      newQuest.scheduledDate || undefined,
      playerProfile.activeFocusTag,
      newQuest.type === 'habito' ? newQuest.habitDays : undefined,
      newQuest.type === 'meta' ? newQuest.metaTarget : undefined
    );
    
    addQuest(quest);
    setNewQuest({ 
      title: '', 
      description: '', 
      type: 'diaria', 
      difficulty: 'normal',
      scheduledDate: '',
      habitDays: [],
      metaTarget: 100,
    });
    setIsDialogOpen(false);
    setShowIntervention(false);
  };

  const handleMasterIntervention = () => {
    if (!newQuest.title.trim()) return;
    
    setShowIntervention(false);
    setIsDialogOpen(false);
    
    // Open master chat and send context
    if (onOpenMasterChat) {
      onOpenMasterChat();
    }
    
    // Send message to master with context
    sendChatMessage(`Quero criar uma missão: "${newQuest.title}". ${newQuest.description}. Dificuldade: ${difficultyConfig[newQuest.difficulty].label}.`);
  };

  const activeHabitos = gameState.quests.habito.filter(q => !q.completed);
  const completedHabitos = gameState.quests.habito.filter(q => q.completed);
  const activeDiarias = gameState.quests.diaria.filter(q => !q.completed);
  const completedDiarias = gameState.quests.diaria.filter(q => q.completed);
  const activeMetas = gameState.quests.meta.filter(q => !q.completed);
  const completedMetas = gameState.quests.meta.filter(q => q.completed);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pt-4 pb-24"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-cinzel mb-3">Missões</h2>
        
        <div className="flex gap-2">
          <motion.button
            onClick={() => setShowCalendar(true)}
            className="px-3 py-1.5 text-xs bg-[#1a1a2e] border border-[#2d2d44] rounded-md text-gray-300 hover:bg-[#252542] flex items-center gap-1.5 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </motion.button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.button
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 rounded-md text-white flex items-center gap-1.5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Missão
            </motion.button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-xl">
                {showIntervention ? '🧙 Intervenção do Mestre' : 'Criar Nova Missão'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {!showIntervention ? (
                <>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Título</label>
                    <Input
                      value={newQuest.title}
                      onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                      placeholder="Ex: Ler 30 minutos"
                      className="bg-[#16213e] border-[#2d2d44] text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Descrição</label>
                    <Textarea
                      value={newQuest.description}
                      onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                      placeholder="Detalhes da missão..."
                      className="bg-[#16213e] border-[#2d2d44] text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Tipo</label>
                      <Select
                        value={newQuest.type}
                        onValueChange={(v) => setNewQuest({ ...newQuest, type: v as QuestType })}
                      >
                        <SelectTrigger className="bg-[#16213e] border-[#2d2d44] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-[#2d2d44]">
                          <SelectItem value="habito" className="text-white">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-400" />
                              Hábito
                            </div>
                          </SelectItem>
                          <SelectItem value="diaria" className="text-white">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-cyan-400" />
                              Diária
                            </div>
                          </SelectItem>
                          <SelectItem value="meta" className="text-white">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-400" />
                              Meta
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Dificuldade</label>
                      <Select
                        value={newQuest.difficulty}
                        onValueChange={(v) => setNewQuest({ ...newQuest, difficulty: v as Difficulty })}
                      >
                        <SelectTrigger className="bg-[#16213e] border-[#2d2d44] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a2e] border-[#2d2d44]">
                          <SelectItem value="veryEasy" className="text-white">
                            <span className="text-green-400">🟢 Muito Fácil</span>
                          </SelectItem>
                          <SelectItem value="easy" className="text-white">
                            <span className="text-emerald-400">🟩 Fácil</span>
                          </SelectItem>
                          <SelectItem value="normal" className="text-white">
                            <span className="text-blue-400">🔵 Normal</span>
                          </SelectItem>
                          <SelectItem value="hard" className="text-white">
                            <span className="text-purple-400">🟣 Difícil</span>
                          </SelectItem>
                          <SelectItem value="veryHard" className="text-white">
                            <span className="text-red-400">🔴 Muito Difícil</span>
                          </SelectItem>
                          <SelectItem value="meta" className="text-white">
                            <span className="text-yellow-400">🟡 Meta</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Habit Days Selector - Only shows when type is 'habito' */}
                  {newQuest.type === 'habito' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
                    >
                      <label className="text-sm text-orange-400 mb-3 block flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Dias da Semana
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[
                          { day: 1 as DayOfWeek, label: 'Seg' },
                          { day: 2 as DayOfWeek, label: 'Ter' },
                          { day: 3 as DayOfWeek, label: 'Qua' },
                          { day: 4 as DayOfWeek, label: 'Qui' },
                          { day: 5 as DayOfWeek, label: 'Sex' },
                          { day: 6 as DayOfWeek, label: 'Sáb' },
                          { day: 0 as DayOfWeek, label: 'Dom' },
                        ].map(({ day, label }) => (
                          <button
                            key={day}
                            onClick={() => {
                              const currentDays = newQuest.habitDays;
                              const newDays = currentDays.includes(day)
                                ? currentDays.filter(d => d !== day)
                                : [...currentDays, day];
                              setNewQuest({ ...newQuest, habitDays: newDays });
                            }}
                            className={cn(
                              'w-10 h-10 rounded-full text-xs font-medium transition-all',
                              newQuest.habitDays.includes(day)
                                ? 'bg-orange-500 text-white'
                                : 'bg-[#16213e] text-gray-400 border border-[#2d2d44] hover:border-orange-500/50'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        O hábito aparecerá automaticamente nos dias selecionados
                      </p>
                    </motion.div>
                  )}

                  {/* Meta Target - Only shows when type is 'meta' */}
                  {newQuest.type === 'meta' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
                    >
                      <label className="text-sm text-purple-400 mb-2 block flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Meta (quantidade)
                      </label>
                      <Input
                        type="number"
                        value={newQuest.metaTarget}
                        onChange={(e) => setNewQuest({ ...newQuest, metaTarget: parseInt(e.target.value) || 100 })}
                        className="bg-[#16213e] border-purple-500/50 text-white"
                        min={1}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Defina um valor para acompanhar o progresso da meta
                      </p>
                    </motion.div>
                  )}

                  {/* Scheduled Date Picker - Only shows when type is 'meta' */}
                  {newQuest.type === 'meta' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4"
                    >
                      <label className="text-sm text-cyan-400 mb-2 block flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Data de Conclusão (Opcional)
                      </label>
                      <Input
                        type="date"
                        value={newQuest.scheduledDate}
                        onChange={(e) => setNewQuest({ ...newQuest, scheduledDate: e.target.value })}
                        className="bg-[#16213e] border-cyan-500/50 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Defina uma data para concluir a meta
                      </p>
                    </motion.div>
                  )}

                  {/* Difficulty Info */}
                  <div className="bg-[#16213e] rounded-lg p-3 text-sm">
                    <p className="text-gray-400 mb-2">Recompensas para {difficultyConfig[newQuest.difficulty].label}:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-purple-400">
                        <Zap className="w-4 h-4 inline mr-1" />
                        XP ×{newQuest.difficulty === 'veryEasy' ? '0.5' : newQuest.difficulty === 'easy' ? '0.75' : newQuest.difficulty === 'normal' ? '1' : newQuest.difficulty === 'hard' ? '1.5' : newQuest.difficulty === 'veryHard' ? '2.5' : '5'}
                      </div>
                      <div className="text-yellow-400">
                        <Coins className="w-4 h-4 inline mr-1" />
                        Moedas ×{newQuest.difficulty === 'veryEasy' ? '0.5' : newQuest.difficulty === 'easy' ? '0.75' : newQuest.difficulty === 'normal' ? '1' : newQuest.difficulty === 'hard' ? '1.5' : newQuest.difficulty === 'veryHard' ? '2' : '3'}
                      </div>
                      <div className="text-green-400">
                        <Gift className="w-4 h-4 inline mr-1" />
                        HP ×{newQuest.difficulty === 'veryEasy' ? '0.5' : newQuest.difficulty === 'easy' ? '0.75' : newQuest.difficulty === 'normal' ? '1' : newQuest.difficulty === 'hard' ? '1.5' : newQuest.difficulty === 'veryHard' ? '2' : '3'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateQuest}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Missão
                    </Button>
                  </div>

                  {/* Master Intervention Button */}
                  <div className="border-t border-[#2d2d44] pt-4">
                    <p className="text-sm text-gray-400 mb-3">Precisa de ajuda do Mestre?</p>
                    <Button
                      onClick={() => setShowIntervention(true)}
                      variant="outline"
                      className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      🧙 Pedir Intervenção do Mestre
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-purple-400 font-semibold mb-2">🧙 O Mestre vai ajudar!</p>
                    <p className="text-sm text-gray-400">
                      Ao continuar, o chat com o Mestre será aberto e ele receberá o contexto da sua missão:
                    </p>
                    <div className="mt-3 bg-black/30 rounded p-3">
                      <p className="text-white font-semibold">{newQuest.title || '(Sem título)'}</p>
                      <p className="text-gray-400 text-sm">{newQuest.description || '(Sem descrição)'}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Dificuldade: {difficultyConfig[newQuest.difficulty].label}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    O Mestre poderá:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Sugerir quests relacionadas ao tema</li>
                    <li>• Ajustar a dificuldade</li>
                    <li>• Criar missões auxiliares</li>
                    <li>• Dar dicas estratégicas</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowIntervention(false)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-400"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleMasterIntervention}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Conversar com Mestre
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Active Focus Tag */}
      {playerProfile.activeFocusTag && (
        <motion.div 
          className="card-dungeon p-4 flex items-center gap-4 bg-gradient-to-r from-purple-900/30 to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Foco Ativo</p>
            <p className="text-xl font-bold text-purple-400">
              🎯 {playerProfile.activeFocusTag}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Quests relacionadas</p>
            <p className="text-sm text-purple-400">+XP bônus</p>
          </div>
        </motion.div>
      )}

      {/* Streak Indicator */}
      <motion.div 
        className="card-dungeon p-4 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Streak Atual</p>
          <p className="text-2xl font-bold text-white">
            {gameState.character.stats.streak} dias
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-gray-400">Recorde</p>
          <p className="text-xl font-bold text-orange-400">
            {gameState.character.stats.maxStreak} dias
          </p>
        </div>
      </motion.div>

      {/* Quest Tabs */}
      <Tabs defaultValue="diaria" className="w-full">
        <TabsList className="bg-[#1a1a2e] border border-[#2d2d44]">
          <TabsTrigger value="habito" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Flame className="w-4 h-4 mr-2" />
            Hábitos ({activeHabitos.length})
          </TabsTrigger>
          <TabsTrigger value="diaria" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Calendar className="w-4 h-4 mr-2" />
            Diárias ({activeDiarias.length})
          </TabsTrigger>
          <TabsTrigger value="meta" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Target className="w-4 h-4 mr-2" />
            Metas ({activeMetas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habito" className="mt-4">
          <AnimatePresence mode="popLayout">
            {activeHabitos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <Flame className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum hábito configurado</p>
                <p className="text-sm">Crie hábitos que se repetem nos dias escolhidos!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {activeHabitos.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => completeQuest(quest.id, 'habito')}
                    onDelete={() => deleteQuest(quest.id, 'habito')}
                  />
                ))}
              </div>
            )}
            
            {completedHabitos.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-gray-500 mb-3">Concluídos</h4>
                <div className="space-y-3">
                  {completedHabitos.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={() => {}}
                      onDelete={() => deleteQuest(quest.id, 'habito')}
                    />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="diaria" className="mt-4">
          <AnimatePresence mode="popLayout">
            {activeDiarias.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma missão diária ativa</p>
                <p className="text-sm">Crie uma nova missão para começar!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {activeDiarias.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => completeQuest(quest.id, 'diaria')}
                    onDelete={() => deleteQuest(quest.id, 'diaria')}
                  />
                ))}
              </div>
            )}
            
            {completedDiarias.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-gray-500 mb-3">Concluídas</h4>
                <div className="space-y-3">
                  {completedDiarias.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={() => {}}
                      onDelete={() => deleteQuest(quest.id, 'diaria')}
                    />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <AnimatePresence mode="popLayout">
            {activeMetas.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-gray-500"
              >
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma meta configurada</p>
                <p className="text-sm">Crie metas maiores para focar!</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {activeMetas.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => completeQuest(quest.id, 'meta')}
                    onDelete={() => deleteQuest(quest.id, 'meta')}
                  />
                ))}
              </div>
            )}
            
            {completedMetas.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm text-gray-500 mb-3">Concluídas</h4>
                <div className="space-y-3">
                  {completedMetas.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={() => {}}
                      onDelete={() => deleteQuest(quest.id, 'meta')}
                    />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-2xl max-h-[100vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b border-[#2d2d44]">
            <DialogTitle className="font-cinzel text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Calendário de Missões
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(100vh-120px)] p-6 pt-4">
            <CalendarView 
              quests={gameState.quests}
              onSelectDate={(date) => setSelectedDate(date)}
              selectedDate={selectedDate}
              onQuestClick={handleQuestClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Quest Management Modal */}
      <Dialog open={showQuestModal} onOpenChange={setShowQuestModal}>
        <DialogContent className="bg-[#1a1a2e] border-[#2d2d44] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-xl">
              📜 {selectedQuest?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuest && (
            <div className="space-y-4 mt-4">
              <div className="bg-[#16213e] rounded-lg p-4 space-y-2">
                <p className="text-gray-400 text-sm">{selectedQuest.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-purple-400">⭐ {selectedQuest.xpReward} XP</span>
                  <span className="text-yellow-400">💰 {selectedQuest.coinReward} moedas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{difficultyConfig[selectedQuest.difficulty].emoji}</span>
                  <span className="text-gray-400 text-sm">{difficultyConfig[selectedQuest.difficulty].label}</span>
                </div>
                {selectedQuest.scheduledDate && (
                  <p className="text-orange-400 text-sm">📅 {selectedQuest.scheduledDate.split('-').reverse().join('/')}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!selectedQuest.completed && (
                  <Button
                    onClick={handleCompleteFromModal}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Concluir
                  </Button>
                )}
                <Button
                  onClick={handleDeleteFromModal}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
                <Button
                  onClick={() => setShowQuestModal(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-400 col-span-full"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Calendar View Component
interface CalendarViewProps {
  quests: { habito: Quest[]; diaria: Quest[]; meta: Quest[] };
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
  onQuestClick: (quest: Quest) => void;
}

function CalendarView({ quests, onSelectDate, selectedDate, onQuestClick }: CalendarViewProps) {
  // Use Brazil timezone for calendar
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    // Format to Brazil date
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    return new Date(year, month, day);
  });
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  // Helper to get Brazil date string from year, month, day
  const getBrazilDateStr = (year: number, month: number, day: number): string => {
    const date = new Date(year, month, day);
    return getBrazilDateStringFromDate(date);
  };
  
  const getQuestsForDate = (dateStr: string) => {
    const allQuests = [...quests.habito, ...quests.diaria, ...quests.meta];
    return allQuests.filter(q => {
      if (q.scheduledDate === dateStr) return true;
      if (q.type === 'diaria' && !q.completed) {
        // Use Brazil timezone for quest date comparison
        const questDate = getBrazilDateStringFromDate(new Date(q.createdAt));
        return questDate === dateStr;
      }
      return false;
    });
  };
  
  const getDifficultyColor = (difficulty: Difficulty) => {
    return difficultyConfig[difficulty].bg.replace('/20', '/40');
  };
  
  const renderDay = (day: number) => {
    // CRITICAL: Use Brazil timezone for date string
    const dateStr = getBrazilDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayQuests = getQuestsForDate(dateStr);
    const isSelected = selectedDate === dateStr;
    
    return (
      <motion.button
        key={day}
        onClick={() => onSelectDate(dateStr)}
        className={cn(
          'aspect-square p-2 rounded-lg border transition-all text-left relative',
          isSelected ? 'border-purple-500 bg-purple-500/20' : 'border-[#2d2d44] hover:border-purple-500/50',
          dayQuests.length > 0 && !isSelected && 'bg-[#16213e]'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-sm font-medium">{day}</span>
        
        {dayQuests.length > 0 && (
          <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
            {dayQuests.slice(0, 3).map((q, i) => (
              <div 
                key={i} 
                className={cn(
                  'w-2 h-2 rounded-full',
                  q.completed ? 'bg-green-500' : getDifficultyColor(q.difficulty)
                )}
              />
            ))}
            {dayQuests.length > 3 && (
              <span className="text-[8px] text-gray-500">+{dayQuests.length - 3}</span>
            )}
          </div>
        )}
      </motion.button>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-[#16213e] rounded-lg transition-colors"
        >
          ←
        </button>
        <span className="font-semibold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-[#16213e] rounded-lg transition-colors"
        >
          →
        </button>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-[#2d2d44]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-400">Concluída</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400/40" />
          <span className="text-gray-400">🟩 Muito Fácil</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
          <span className="text-gray-400">🟢 Fácil</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-400/40" />
          <span className="text-gray-400">🔵 Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-400/40" />
          <span className="text-gray-400">🟣 Difícil</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400/40" />
          <span className="text-gray-400">🔴 Muito Difícil</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
          <span className="text-gray-400">🟡 Meta</span>
        </div>
      </div>
      
      {/* Selected Date Quests */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-[#16213e] rounded-lg">
          <h4 className="font-semibold mb-3">
            Missões de {selectedDate.split('-').reverse().join('/')}
          </h4>
          <p className="text-xs text-gray-500 mb-2">Clique em uma missão para gerenciar</p>
          {getQuestsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma missão para este dia</p>
          ) : (
            <div className="space-y-2">
              {getQuestsForDate(selectedDate).map(q => (
                <button
                  key={q.id}
                  onClick={() => onQuestClick(q)}
                  className="w-full flex items-center gap-2 p-3 bg-[#1a1a2e] rounded hover:bg-[#252542] transition-colors text-left"
                >
                  <span className="text-lg">{difficultyConfig[q.difficulty].emoji}</span>
                  <span className={cn('flex-1', q.completed && 'line-through text-gray-500')}>
                    {q.title}
                  </span>
                  {q.completed ? (
                    <span className="text-green-400 text-xs">✓ Concluída (+{q.xpReward} XP)</span>
                  ) : (
                    <span className="text-gray-500 text-xs">{q.xpReward} XP</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
