import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Dumbbell, 
  History, 
  Scale, 
  Calculator, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  Play, 
  CheckCircle2,
  X,
  Pencil,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

// --- Types & Constants ---

type SetType = {
  id: string;
  weight: string;
  reps: string;
  rir?: string;
  completed: boolean;
};

type Exercise = {
  id: string;
  name: string;
  sets: SetType[];
  targetReps?: string;
  targetRir?: string;
  restSeconds?: number;
  note?: string;
  isCustom?: boolean;
};

type WorkoutProgram = {
  id: string;
  name: string;
  exercises: Exercise[];
};

type WorkoutLog = {
  id: string;
  date: string; // ISO string
  programId: string;
  programName: string;
  durationSeconds: number;
  exercises: Exercise[]; // Snapshot of what was done
  note?: string;
};

type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  weekId: string; // YYYY-Www
};

type ObjectiveType = 'bulk' | 'cut' | 'maintenance';

// Helper to create N sets
const createSets = (count: number): SetType[] => {
  return Array(count).fill(null).map((_, i) => ({
    id: `s_${Math.random().toString(36).substr(2, 9)}`,
    weight: '',
    reps: '',
    completed: false
  }));
};

// Initial Data derived from User PDFs
const INITIAL_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'p1',
    name: 'Allenamento 1 (Upper)',
    exercises: [
      { id: 'e1_1', name: 'Overhead Ext', sets: createSets(3), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Usa corda lunga, Vulken' },
      { id: 'e1_2', name: 'Preacher Curl su Panca 60', sets: createSets(3), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Recupera 45s tra un braccio e l\'altro' },
      { id: 'e1_3', name: 'Lento Avanti al Multi', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Panca 70°, avambracci perpendicolari' },
      { id: 'e1_4', name: 'Alzate Laterali Manubri', sets: createSets(1), targetReps: '8-12', targetRir: '0', restSeconds: 0, note: '' },
      { id: 'e1_5', name: 'Lat Machine Singola', sets: createSets(3), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Inizia dal lato più debole' },
      { id: 'e1_6', name: 'Chest Press Incline', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Non accentuare arco lombare' },
      { id: 'e1_7', name: 'T Bar', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Focus trapezi' },
      { id: 'e1_8', name: 'Pec Fly', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
    ]
  },
  {
    id: 'p2',
    name: 'Allenamento 2 (Legs A)',
    exercises: [
      { id: 'e2_1', name: 'Hack Squat', sets: createSets(2), targetReps: '5-9', targetRir: '1', restSeconds: 240, note: 'Almeno 2 set riscaldamento' },
      { id: 'e2_2', name: 'SLDL al Multi', sets: createSets(2), targetReps: '5-9', targetRir: '1', restSeconds: 240, note: 'Usa disco sotto i piedi' },
      { id: 'e2_3', name: 'Leg Extension', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e2_4', name: 'Leg Curl Sdraiato', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e2_5', name: 'Polpacci Pressa Orizz.', sets: createSets(2), targetReps: '6-12', targetRir: '0', restSeconds: 120, note: '' },
      { id: 'e2_6', name: 'Addome', sets: createSets(2), targetReps: '6-12', targetRir: '0', restSeconds: 120, note: "D'Annunzio Crunch o Cavo Alto" },
    ]
  },
  {
    id: 'p3',
    name: 'Allenamento 3 (Push)',
    exercises: [
      { id: 'e3_1', name: 'Panca 30 al Multi', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 240, note: 'Presa larghezza spalle' },
      { id: 'e3_2', name: 'Pec Fly', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e3_3', name: 'Lento Avanti al Multi', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Panca 70°' },
      { id: 'e3_4', name: 'Alzate Lat. al Cavo', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Cavo altezza bacino, cavigliera' },
      { id: 'e3_5', name: 'Pushdown Singolo', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Parti dal più debole' },
      { id: 'e3_6', name: 'Overhead Ext', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
    ]
  },
  {
    id: 'p4',
    name: 'Allenamento 4 (Pull)',
    exercises: [
      { id: 'e4_1', name: 'Lat Machine Sbarra', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Focus gran dorsale' },
      { id: 'e4_2', name: 'Row Machine', sets: createSets(3), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Presa prona' },
      { id: 'e4_3', name: 'Pulley Cifosi', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Leggera cifosi' },
      { id: 'e4_4', name: 'Rear Delt', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 120, note: '' },
      { id: 'e4_5', name: 'Preacher Curl Panca Scott', sets: createSets(2), targetReps: '5-9', targetRir: '0', restSeconds: 180, note: 'Con bilanciere EZ' },
      { id: 'e4_6', name: 'Curl Martello Manubri', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e4_7', name: 'Addome', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: 'Come giorno 2' },
    ]
  },
  {
    id: 'p5',
    name: 'Allenamento 5 (Legs B)',
    exercises: [
      { id: 'e5_1', name: 'SLDL al Multi', sets: createSets(2), targetReps: '5-9', targetRir: '1', restSeconds: 240, note: '' },
      { id: 'e5_2', name: 'Pressa 45', sets: createSets(2), targetReps: '5-9', targetRir: '1', restSeconds: 240, note: '' },
      { id: 'e5_3', name: 'Leg Curl Seduto', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e5_4', name: 'Leg Ext', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 180, note: '' },
      { id: 'e5_5', name: 'Adduttori', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 120, note: '' },
      { id: 'e5_6', name: 'Polpacci Pressa', sets: createSets(2), targetReps: '6-10', targetRir: '0', restSeconds: 120, note: '' },
    ]
  }
];

const INITIAL_WEIGHTS: WeightEntry[] = [
  { id: 'w1', date: '2025-08-31', weight: 72.1, weekId: '2025-W35' },
  { id: 'w2', date: '2025-09-30', weight: 73.85, weekId: '2025-W40' },
  { id: 'w3', date: '2025-08-30', weight: 71.7, weekId: '2025-W35' },
  { id: 'w4', date: '2025-09-29', weight: 74.0, weekId: '2025-W40' },
  { id: 'w5', date: '2025-10-29', weight: 73.65, weekId: '2025-W44' },
  { id: 'w6', date: '2025-08-29', weight: 72.2, weekId: '2025-W35' },
  { id: 'w7', date: '2025-09-28', weight: 73.9, weekId: '2025-W39' },
  { id: 'w8', date: '2025-10-28', weight: 73.75, weekId: '2025-W44' },
  { id: 'w9', date: '2025-09-15', weight: 72.7, weekId: '2025-W38' },
  { id: 'w10', date: '2025-10-15', weight: 73.55, weekId: '2025-W42' },
  { id: 'w11', date: '2025-11-15', weight: 74.6, weekId: '2025-W46' },
];

// --- Helpers ---

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Components ---

const TabBar = ({ active, onChange }: { active: string, onChange: (t: string) => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 glass-panel pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <button onClick={() => onChange('home')} className={`flex flex-col items-center justify-center w-16 h-full ${active === 'home' ? 'text-primary' : 'text-textMuted'}`}>
          <Dumbbell size={24} />
          <span className="text-[10px] mt-1 font-medium">Work</span>
        </button>
        <button onClick={() => onChange('weight')} className={`flex flex-col items-center justify-center w-16 h-full ${active === 'weight' ? 'text-primary' : 'text-textMuted'}`}>
          <Scale size={24} />
          <span className="text-[10px] mt-1 font-medium">Peso</span>
        </button>
        <button onClick={() => onChange('history')} className={`flex flex-col items-center justify-center w-16 h-full ${active === 'history' ? 'text-primary' : 'text-textMuted'}`}>
          <History size={24} />
          <span className="text-[10px] mt-1 font-medium">Storico</span>
        </button>
        <button onClick={() => onChange('calculator')} className={`flex flex-col items-center justify-center w-16 h-full ${active === 'calculator' ? 'text-primary' : 'text-textMuted'}`}>
          <Calculator size={24} />
          <span className="text-[10px] mt-1 font-medium">Dischi</span>
        </button>
      </div>
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, onExport, onImport }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if(!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) onImport(file);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Impostazioni</h2>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
                </div>

                <div className="space-y-3">
                    <button onClick={onExport} className="w-full p-4 bg-surfaceHighlight rounded-2xl flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all">
                        <div className="p-3 bg-primary/20 rounded-full text-primary"><Download size={20} /></div>
                        <div className="text-left">
                            <div className="font-bold">Esporta Dati</div>
                            <div className="text-xs text-textMuted">Scarica backup JSON</div>
                        </div>
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 bg-surfaceHighlight rounded-2xl flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all">
                         <div className="p-3 bg-secondary/20 rounded-full text-secondary"><Upload size={20} /></div>
                         <div className="text-left">
                            <div className="font-bold">Importa Dati</div>
                            <div className="text-xs text-textMuted">Carica backup JSON</div>
                        </div>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="application/json" 
                        onChange={handleFileChange}
                    />
                </div>
                
                <div className="mt-8 text-center text-xs text-textMuted">
                    Gym Logbook Pro v1.1
                </div>
            </div>
        </div>
    )
}

// --- DATA MANAGER (UI EDITOR) ---
const DataManager = ({ isOpen, onClose, type, data, onSave }: any) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [tempData, setTempData] = useState<any>(data);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
      if(isOpen) {
        setTempData(data);
        setView('list');
      }
  }, [isOpen, data]);

  // Grouping for Weights
  const groupedWeights = useMemo(() => {
      if (type !== 'Pesi' || !tempData) return null;
      const groups: Record<string, any[]> = {};
      [...tempData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(item => {
          if (!groups[item.weekId]) groups[item.weekId] = [];
          groups[item.weekId].push(item);
      });
      return groups;
  }, [tempData, type]);

  if (!isOpen) return null;

  const triggerDelete = (id: string) => {
      setItemToDelete(id);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          setTempData(tempData.filter((item: any) => item.id !== itemToDelete));
          setItemToDelete(null);
          // If we were in detail view and deleted that item, go back to list
          if (selectedItem && selectedItem.id === itemToDelete) {
              setView('list');
              setSelectedItem(null);
          }
      }
  };

  const handleSaveAndClose = () => {
      onSave(tempData);
      onClose();
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
      const updated = tempData.map((item: any) => {
          if (item.id === id) {
              const newItem = { ...item, [field]: value };
              if (type === 'Pesi' && field === 'date') {
                  newItem.weekId = getWeekNumber(new Date(value));
              }
              return newItem;
          }
          return item;
      });
      setTempData(updated);
      if(selectedItem) {
         const current = updated.find((u: any) => u.id === id);
         setSelectedItem(current);
      }
  };

  const getDisplayText = (item: any) => {
    if (type === 'Pesi') return `${item.weight} kg`;
    if (type === 'Storico') return new Date(item.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
    return item.name;
  };

  const getSubText = (item: any) => {
      if (type === 'Pesi') return item.date;
      if (type === 'Storico') return item.programName;
      return `${(item.exercises || []).length} Esercizi`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in h-[100dvh] overflow-hidden">
        
        {/* Custom Delete Modal */}
        {itemToDelete && (
            <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                <div className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4 text-danger">
                        <Trash2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Eliminare elemento?</h2>
                    <p className="text-textMuted mb-6 text-sm">Questa azione è irreversibile.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setItemToDelete(null)} className="p-3 rounded-xl font-bold bg-surfaceHighlight hover:bg-white/10 transition-colors">
                            Annulla
                        </button>
                        <button onClick={confirmDelete} className="p-3 rounded-xl font-bold bg-danger text-white hover:bg-red-600 transition-colors">
                            Elimina
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="pt-safe px-4 py-4 border-b border-white/10 bg-surface flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
                {view === 'detail' && (
                    <button onClick={() => setView('list')}><ChevronDown className="rotate-90" /></button>
                )}
                <h2 className="text-xl font-bold">{view === 'list' ? `Modifica ${type}` : 'Dettagli'}</h2>
            </div>
            <div className="flex gap-4">
                <button onClick={onClose} className="text-textMuted">Annulla</button>
                <button onClick={handleSaveAndClose} className="text-primary font-bold">Salva</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {view === 'list' && (
                <div className="space-y-2">
                    {type === 'Pesi' && groupedWeights ? (
                        Object.keys(groupedWeights).sort().reverse().map(weekId => (
                            <div key={weekId} className="mb-6">
                                <div className="text-xs text-primary font-bold uppercase tracking-wider mb-2 ml-1">
                                    Settimana {weekId.split('-W')[1]} ({weekId.split('-')[0]})
                                </div>
                                <div className="space-y-2">
                                    {groupedWeights[weekId].map((item: any) => (
                                        <div key={item.id} className="bg-surfaceHighlight p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white">{item.weight} kg</div>
                                                <div className="text-xs text-textMuted">{new Date(item.date).toLocaleDateString('it-IT', {weekday: 'short', day: 'numeric', month: 'short'})}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setSelectedItem(item); setView('detail'); }} className="p-2 bg-white/5 rounded-full"><Pencil size={16} /></button>
                                                <button onClick={() => triggerDelete(item.id)} className="p-2 bg-danger/20 text-danger rounded-full"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        tempData.map((item: any) => (
                            <div key={item.id} className="bg-surfaceHighlight p-4 rounded-xl flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="font-bold text-white">{getDisplayText(item)}</div>
                                    <div className="text-xs text-textMuted">{getSubText(item)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { setSelectedItem(item); setView('detail'); }} className="p-2 bg-white/5 rounded-full">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => triggerDelete(item.id)} className="p-2 bg-danger/20 text-danger rounded-full">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === 'detail' && selectedItem && (
                <div className="space-y-6 animate-slide-up pb-24">
                    {type === 'Pesi' && (
                        <>
                            <div>
                                <label className="text-xs text-textMuted mb-1 block">Data</label>
                                <input 
                                    type="date"
                                    className="w-full bg-surfaceHighlight p-3 rounded-xl text-white outline-none border border-white/10 focus:border-primary"
                                    value={selectedItem.date}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, 'date', e.target.value)}
                                />
                            </div>
                             <div>
                                <label className="text-xs text-textMuted mb-1 block">Peso (kg)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-surfaceHighlight p-3 rounded-xl text-white outline-none border border-white/10 focus:border-primary"
                                    value={selectedItem.weight}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, 'weight', parseFloat(e.target.value))}
                                />
                            </div>
                        </>
                    )}

                    {type === 'Storico' && (
                        <>
                             <div>
                                <label className="text-xs text-textMuted mb-1 block">Data Allenamento</label>
                                <input 
                                    type="datetime-local"
                                    className="w-full bg-surfaceHighlight p-3 rounded-xl text-white outline-none border border-white/10 focus:border-primary"
                                    value={(selectedItem.date || '').slice(0, 16)}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, 'date', new Date(e.target.value).toISOString())}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-textMuted mb-1 block">Nome Programma (Log)</label>
                                <input 
                                    className="w-full bg-surfaceHighlight p-3 rounded-xl text-white outline-none border border-white/10 focus:border-primary"
                                    value={selectedItem.programName}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, 'programName', e.target.value)}
                                />
                            </div>
                             <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Modifica Dati Esercizi</h4>
                                {(selectedItem.exercises || []).map((ex: Exercise, exIdx: number) => (
                                    <div key={ex.id} className="bg-surfaceHighlight/50 rounded-xl p-3 border border-white/5">
                                        <div className="font-bold mb-2">{ex.name}</div>
                                        <div className="space-y-2">
                                            {ex.sets.map((set, setIdx) => (
                                                <div key={set.id} className="flex items-center gap-2">
                                                    <div className="w-6 text-center text-xs text-textMuted">{setIdx + 1}</div>
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/30 rounded p-2 w-20 text-center text-sm text-white border border-transparent focus:border-primary outline-none"
                                                        value={set.weight}
                                                        placeholder="Kg"
                                                        onChange={(e) => {
                                                            const newLogs = [...tempData];
                                                            const logIdx = newLogs.findIndex(l => l.id === selectedItem.id);
                                                            newLogs[logIdx].exercises[exIdx].sets[setIdx].weight = e.target.value;
                                                            setTempData(newLogs);
                                                            setSelectedItem(newLogs[logIdx]);
                                                        }}
                                                    />
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/30 rounded p-2 w-16 text-center text-sm text-white border border-transparent focus:border-primary outline-none"
                                                        value={set.reps}
                                                        placeholder="Reps"
                                                        onChange={(e) => {
                                                            const newLogs = [...tempData];
                                                            const logIdx = newLogs.findIndex(l => l.id === selectedItem.id);
                                                            newLogs[logIdx].exercises[exIdx].sets[setIdx].reps = e.target.value;
                                                            setTempData(newLogs);
                                                            setSelectedItem(newLogs[logIdx]);
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const newLogs = [...tempData];
                                                            const logIdx = newLogs.findIndex(l => l.id === selectedItem.id);
                                                            newLogs[logIdx].exercises[exIdx].sets[setIdx].completed = !newLogs[logIdx].exercises[exIdx].sets[setIdx].completed;
                                                            setTempData(newLogs);
                                                            setSelectedItem(newLogs[logIdx]);
                                                        }}
                                                        className={`p-2 rounded-full ${set.completed ? 'text-green-500 bg-green-500/10' : 'text-textMuted bg-white/5'}`}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {type === 'Programmi' && (
                        <>
                            <div>
                                <label className="text-xs text-textMuted mb-1 block">Nome Programma</label>
                                <input 
                                    className="w-full bg-surfaceHighlight p-3 rounded-xl text-white outline-none border border-white/10 focus:border-primary"
                                    value={selectedItem.name}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, 'name', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <h3 className="font-bold mb-3 text-textMuted uppercase text-xs">Esercizi del programma</h3>
                                <div className="space-y-3">
                                    {(selectedItem.exercises || []).map((ex: Exercise, idx: number) => (
                                        <div key={ex.id} className="bg-surfaceHighlight p-3 rounded-xl border border-white/5">
                                            <input 
                                                className="w-full bg-transparent font-bold text-white mb-2 outline-none border-b border-transparent focus:border-white/20"
                                                value={ex.name}
                                                onChange={(e) => {
                                                    const newExercises = [...selectedItem.exercises];
                                                    newExercises[idx].name = e.target.value;
                                                    handleUpdateItem(selectedItem.id, 'exercises', newExercises);
                                                }}
                                            />
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="text-[10px] text-textMuted">Target Reps</label>
                                                    <input 
                                                        className="w-full bg-black/20 p-2 rounded text-sm text-white"
                                                        value={ex.targetReps || ''}
                                                        onChange={(e) => {
                                                            const newExercises = [...selectedItem.exercises];
                                                            newExercises[idx].targetReps = e.target.value;
                                                            handleUpdateItem(selectedItem.id, 'exercises', newExercises);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-textMuted">Serie (Default)</label>
                                                    <div className="flex items-center gap-2 h-9">
                                                        <button onClick={() => {
                                                             const newExercises = [...selectedItem.exercises];
                                                             if (newExercises[idx].sets.length > 1) newExercises[idx].sets.pop();
                                                             handleUpdateItem(selectedItem.id, 'exercises', newExercises);
                                                        }} className="bg-white/10 w-8 h-8 rounded flex items-center justify-center">-</button>
                                                        <span className="flex-1 text-center font-mono">{ex.sets.length}</span>
                                                        <button onClick={() => {
                                                             const newExercises = [...selectedItem.exercises];
                                                             newExercises[idx].sets.push({ id: generateId(), weight: '', reps: '', completed: false });
                                                             handleUpdateItem(selectedItem.id, 'exercises', newExercises);
                                                        }} className="bg-white/10 w-8 h-8 rounded flex items-center justify-center">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                <label className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 block">Recupero (secondi)</label>
                                                <div className="flex items-center gap-3">
                                                    <Clock size={14} className="text-textMuted"/>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent font-mono font-bold text-white outline-none"
                                                        value={ex.restSeconds || 0}
                                                        onChange={(e) => {
                                                            const newExercises = [...selectedItem.exercises];
                                                            newExercises[idx].restSeconds = parseInt(e.target.value) || 0;
                                                            handleUpdateItem(selectedItem.id, 'exercises', newExercises);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [programs, setPrograms] = useState<WorkoutProgram[]>(INITIAL_PROGRAMS);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(INITIAL_WEIGHTS);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [objective, setObjective] = useState<ObjectiveType>('maintenance');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutLog | null>(null);
  const [timer, setTimer] = useState<number | null>(null); 
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editMode, setEditMode] = useState<{type: string, isOpen: boolean}>({type: '', isOpen: false});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const savedProgs = localStorage.getItem('gym_progs');
    const savedWeights = localStorage.getItem('gym_weights');
    const savedLogs = localStorage.getItem('gym_logs');
    const savedObj = localStorage.getItem('gym_objective');

    if (savedProgs) setPrograms(JSON.parse(savedProgs));
    if (savedWeights) setWeightEntries(JSON.parse(savedWeights));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedObj) setObjective(savedObj as ObjectiveType);
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('gym_progs', JSON.stringify(programs));
    localStorage.setItem('gym_weights', JSON.stringify(weightEntries));
    localStorage.setItem('gym_logs', JSON.stringify(logs));
    localStorage.setItem('gym_objective', objective);
  }, [programs, weightEntries, logs, objective]);

  // Workout Timer
  useEffect(() => {
    let interval: any;
    if (activeWorkout) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Rest Timer Logic
  useEffect(() => {
    let interval: any;
    if (timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => (t && t > 0 ? t - 1 : 0));
      }, 1000);
    } 
    return () => clearInterval(interval);
  }, [timer]);

  const startWorkout = (program: WorkoutProgram) => {
    const exercisesCopy = program.exercises.map(e => ({
        ...e,
        sets: e.sets.map(s => ({
            ...s,
            id: generateId(),
            weight: '',
            reps: '',
            completed: false
        }))
    }));

    const newLog: WorkoutLog = {
      id: generateId(),
      date: new Date().toISOString(),
      programId: program.id,
      programName: program.name,
      durationSeconds: 0,
      exercises: exercisesCopy
    };
    setElapsedTime(0);
    setActiveWorkout(newLog);
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    const finishedLog = { ...activeWorkout, durationSeconds: elapsedTime };
    setLogs(prev => [finishedLog, ...prev]);
    setActiveWorkout(null);
    setTimer(null); // Kill timer
    setActiveTab('history');
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    setTimer(null);
  };

  const handleEditData = (data: any) => {
      if (editMode.type === 'Programmi') setPrograms(data);
      if (editMode.type === 'Pesi') setWeightEntries(data);
      if (editMode.type === 'Storico') setLogs(data);
  };

  const handleExport = () => {
      const data = {
          programs,
          weightEntries,
          logs,
          objective,
          exportDate: new Date().toISOString(),
          version: '1.2'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gym_logbook_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImport = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if(json.programs) setPrograms(json.programs);
              if(json.weightEntries) setWeightEntries(json.weightEntries);
              if(json.logs) setLogs(json.logs);
              if(json.objective) setObjective(json.objective);
              alert("Dati importati con successo!");
              setSettingsOpen(false);
          } catch(err) {
              alert("Errore nell'importazione del file.");
          }
      };
      reader.readAsText(file);
  };

  const renderView = () => {
    if (activeWorkout) {
      return (
        <ActiveWorkoutView 
          workout={activeWorkout} 
          setWorkout={setActiveWorkout} 
          onFinish={finishWorkout}
          onCancel={cancelWorkout}
          elapsedTime={elapsedTime}
          restTimer={timer}
          setRestTimer={setTimer}
          history={logs}
        />
      );
    }

    switch (activeTab) {
      case 'home': return <HomeView programs={programs} startWorkout={startWorkout} logs={logs} weights={weightEntries} onEdit={() => setEditMode({type: 'Programmi', isOpen: true})} onSettings={() => setSettingsOpen(true)} />;
      case 'weight': return <WeightView entries={weightEntries} setEntries={setWeightEntries} onEdit={() => setEditMode({type: 'Pesi', isOpen: true})} objective={objective} setObjective={setObjective} />;
      case 'history': return <HistoryView logs={logs} setLogs={setLogs} onEdit={() => setEditMode({type: 'Storico', isOpen: true})} />;
      case 'calculator': return <CalculatorView />;
      default: return <HomeView programs={programs} startWorkout={startWorkout} logs={logs} weights={weightEntries} onEdit={() => setEditMode({type: 'Programmi', isOpen: true})} onSettings={() => setSettingsOpen(true)} />;
    }
  };

  return (
    <div className="h-[100dvh] bg-background text-textMain font-sans selection:bg-primary/30 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar">
         {renderView()}
         {/* Extra padding for tab bar */}
         {!activeWorkout && <div className="h-24"></div>}
      </div>
      {!activeWorkout && <TabBar active={activeTab} onChange={setActiveTab} />}
      
      {/* Floating Rest Timer Overlay - Updated Layout */}
      {timer !== null && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl border pl-4 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 min-w-[180px] justify-between ${timer === 0 ? 'animate-urgent border-danger bg-danger text-white' : 'bg-surface/90 border-primary/30 text-white'}`}>
          <Clock size={20} className={timer > 0 ? "text-primary" : "text-white"} />
          <div className="flex flex-col items-center leading-none">
            <span className="text-xl font-mono font-bold tabular-nums">
               {timer === 0 ? "00:00" : formatTime(timer)}
            </span>
            {timer === 0 && <span className="text-[10px] font-bold uppercase tracking-widest">SCADUTO!</span>}
          </div>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <button onClick={() => setTimer(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-transform">
              <X size={16} />
          </button>
        </div>
      )}

      <DataManager 
        isOpen={editMode.isOpen} 
        onClose={() => setEditMode({...editMode, isOpen: false})} 
        type={editMode.type}
        data={editMode.type === 'Programmi' ? programs : editMode.type === 'Pesi' ? weightEntries : logs}
        onSave={handleEditData}
      />

      <SettingsModal 
         isOpen={settingsOpen}
         onClose={() => setSettingsOpen(false)}
         onExport={handleExport}
         onImport={handleImport}
      />
    </div>
  );
};

// --- Sub-Views ---

const HomeView = ({ programs, startWorkout, logs, weights, onEdit, onSettings }: any) => {
  const lastWeight = weights.length > 0 ? weights[weights.length - 1].weight : '--';

  return (
    <div className="p-4 pt-safe space-y-6 animate-slide-up pb-safe">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gym <span className="text-primary">Log</span>book</h1>
        <div className="flex gap-2">
            <button onClick={onSettings} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white transition-colors">
                <Settings size={20} />
            </button>
            <button onClick={onEdit} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white transition-colors">
                <Pencil size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface p-5 rounded-3xl border border-white/5">
          <div className="text-textMuted text-xs font-medium uppercase tracking-wider mb-1">Peso Attuale</div>
          <div className="text-3xl font-bold text-primary">{lastWeight} <span className="text-sm text-textMuted font-normal">kg</span></div>
        </div>
        <div className="bg-surface p-5 rounded-3xl border border-white/5">
          <div className="text-textMuted text-xs font-medium uppercase tracking-wider mb-1">Allenamenti</div>
          <div className="text-3xl font-bold text-secondary">{logs.length}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">I Tuoi Programmi</h2>
        <div className="space-y-3">
          {programs.map((prog: WorkoutProgram) => (
            <button 
              key={prog.id}
              onClick={() => startWorkout(prog)}
              className="w-full flex items-center justify-between p-5 bg-surfaceHighlight rounded-2xl active:scale-[0.98] transition-all hover:bg-white/10 group"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-lg group-hover:text-primary transition-colors">{prog.name}</span>
                <span className="text-xs text-textMuted font-medium">{prog.exercises.length} Esercizi</span>
              </div>
              <div className="bg-primary/20 p-3 rounded-full group-hover:bg-primary transition-colors">
                <Play size={18} className="text-primary fill-current group-hover:text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActiveWorkoutView = ({ workout, setWorkout, onFinish, onCancel, elapsedTime, restTimer, setRestTimer, history }: any) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  // Improved Last Performance Logic
  const getLastPerformance = (exerciseName: string) => {
      if (!history || history.length === 0) return null;

      const normalize = (s: string) => s.trim().toLowerCase();
      const targetName = normalize(exerciseName);

      // 1. Filter logs that have this exercise
      const relevantLogs = history.filter((log: WorkoutLog) => 
          (log.exercises || []).some((e: Exercise) => normalize(e.name) === targetName)
      );
      
      if (relevantLogs.length === 0) return null;
      
      // 2. Sort by date descending
      const sorted = relevantLogs.sort((a: WorkoutLog, b: WorkoutLog) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // 3. Iterate to find data. We check for completed OR just data entry.
      for (const log of sorted) {
          const exercise = (log.exercises || []).find((e: Exercise) => normalize(e.name) === targetName);
          if (exercise) {
             // Loosened check: considers it a previous performance if weight OR reps are entered in any set
             // This fixes the issue where "Prima Esecuzione" shows even if you have history
             const hasData = exercise.sets.some(s => s.completed || (s.weight && s.weight !== '') || (s.reps && s.reps !== ''));
             if (hasData) return exercise;
          }
      }
      
      return null;
  };

  const toggleSet = (exerciseId: string, setIndex: number) => {
    const newExercises = [...workout.exercises];
    const exIndex = newExercises.findIndex((e: Exercise) => e.id === exerciseId);
    if (exIndex === -1) return;

    newExercises[exIndex].sets[setIndex].completed = !newExercises[exIndex].sets[setIndex].completed;
    
    if (newExercises[exIndex].sets[setIndex].completed && setIndex < newExercises[exIndex].sets.length - 1) {
       const rest = newExercises[exIndex].restSeconds;
       if (rest) setRestTimer(rest);
    }

    setWorkout({ ...workout, exercises: newExercises });
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newExercises = [...workout.exercises];
    const exIndex = newExercises.findIndex((e: Exercise) => e.id === exerciseId);
    if (exIndex === -1) return;
    // @ts-ignore
    newExercises[exIndex].sets[setIndex][field] = value;
    setWorkout({ ...workout, exercises: newExercises });
  };

  const addSet = (exerciseId: string) => {
    const newExercises = [...workout.exercises];
    const exIndex = newExercises.findIndex((e: Exercise) => e.id === exerciseId);
    if (exIndex === -1) return;
    newExercises[exIndex].sets.push({ id: generateId(), weight: '', reps: '', completed: false });
    setWorkout({ ...workout, exercises: newExercises });
  };

  const confirmAddExercise = () => {
    if (!newExerciseName.trim()) return;
    
    const newEx: Exercise = {
        id: generateId(),
        name: newExerciseName,
        sets: [{ id: generateId(), weight: '', reps: '', completed: false }],
        isCustom: true,
        note: 'Extra'
    };
    setWorkout((prev: any) => ({
        ...prev,
        exercises: [...prev.exercises, newEx]
    }));
    
    setNewExerciseName('');
    setIsAddingExercise(false);

    setTimeout(() => {
        const container = document.getElementById('active-workout-container');
        if(container) container.scrollTop = container.scrollHeight;
    }, 100);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background animate-fade-in overflow-hidden relative">
      
      {/* Custom Add Exercise Modal */}
      {isAddingExercise && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
             <div className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl">
                 <h2 className="text-xl font-bold mb-4">Nuovo Esercizio</h2>
                 <input 
                    autoFocus
                    className="w-full bg-surfaceHighlight p-4 rounded-xl text-white outline-none border border-white/10 focus:border-primary mb-4"
                    placeholder="Nome esercizio..."
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                 />
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsAddingExercise(false)} className="p-3 rounded-xl font-bold bg-surfaceHighlight hover:bg-white/10 transition-colors">Annulla</button>
                    <button onClick={confirmAddExercise} className="p-3 rounded-xl font-bold bg-primary text-white hover:bg-violet-600 transition-colors">Aggiungi</button>
                 </div>
             </div>
          </div>
      )}

      {/* FIXED CONFIRMATION MODAL */}
      {showExitConfirm && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
            <div className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl text-center">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4 text-danger">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Annullare allenamento?</h2>
                <p className="text-textMuted mb-6 text-sm">Tutti i progressi di questa sessione andranno persi. Questa azione non può essere annullata.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowExitConfirm(false)} className="p-3 rounded-xl font-bold bg-surfaceHighlight hover:bg-white/10 transition-colors">
                        Continua
                    </button>
                    <button onClick={onCancel} className="p-3 rounded-xl font-bold bg-danger text-white hover:bg-red-600 transition-colors">
                        Termina
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* Header - Fixed Top */}
      <div className="pt-safe px-4 py-3 bg-surface/95 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5 grid grid-cols-[48px_1fr_64px] items-center shadow-lg shadow-black/50 shrink-0">
        <button 
            onClick={(e) => {
                e.stopPropagation(); 
                setShowExitConfirm(true);
            }} 
            className="relative z-50 flex items-center justify-center w-12 h-12 -ml-2 text-danger rounded-full active:bg-danger/10 transition-colors"
        >
             <X size={28} strokeWidth={3} />
        </button>
        
        <div className="flex flex-col items-center">
            <span className="font-bold text-[10px] text-textMuted uppercase tracking-widest truncate w-48 text-center mb-0.5">{workout.programName}</span>
            <span className="font-mono text-2xl text-white font-bold tracking-tight">{formatTime(elapsedTime)}</span>
        </div>
        
        <button onClick={onFinish} className="py-2 px-4 bg-primary hover:bg-violet-600 rounded-full text-sm font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all">
            Fine
        </button>
      </div>

      {/* List - Scrollable Area */}
      <div id="active-workout-container" className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        {workout.exercises.map((ex: Exercise, i: number) => {
          const prevEx = getLastPerformance(ex.name);
          
          return (
            <div key={ex.id} className={`bg-surface rounded-3xl overflow-hidden border ${ex.isCustom ? 'border-secondary/30' : 'border-white/5'} shadow-md`}>
              <div className="p-5 bg-surfaceHighlight/30 flex justify-between items-start">
                <div className="w-full">
                  <div className="flex justify-between items-start w-full">
                      <h3 className="font-bold text-lg leading-tight mb-1">{ex.name}</h3>
                      {ex.restSeconds && (
                         <button onClick={() => setRestTimer(ex.restSeconds)} className="text-[10px] px-3 py-1 bg-primary/20 text-primary font-bold rounded-full flex items-center gap-1 active:scale-95 transition-transform">
                             <Clock size={12} /> {ex.restSeconds}s
                         </button>
                     )}
                  </div>
                  {ex.note && <p className="text-xs text-textMuted mt-1 italic">{ex.note}</p>}
                  <div className="flex gap-2 mt-3">
                     {ex.targetReps && <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-textMuted font-medium">Target: {ex.targetReps} reps</span>}
                     {ex.targetRir && <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-textMuted font-medium">RIR: {ex.targetRir}</span>}
                  </div>
                </div>
              </div>

              {prevEx ? (
                  <div className="px-5 py-3 bg-amber-500/10 border-y border-amber-500/10 flex items-center gap-3 overflow-x-auto no-scrollbar">
                     <div className="text-amber-500 text-xs font-bold uppercase whitespace-nowrap flex items-center gap-1 shrink-0">
                        <History size={12}/> Scorsa volta:
                     </div>
                     <div className="flex gap-2">
                        {prevEx.sets.map((s: SetType, idx: number) => {
                            // Show previous set if it has data (even if not marked completed, to be helpful)
                            if (!s.completed && (!s.weight || !s.reps)) return null;
                            return (
                                <span key={idx} className="text-xs font-mono bg-surface px-2 py-1 rounded border border-amber-500/20 text-amber-100 whitespace-nowrap">
                                    {s.weight}<span className="text-amber-500/70">kg</span> × {s.reps}
                                </span>
                            );
                        })}
                     </div>
                  </div>
              ) : (
                  <div className="px-5 py-3 bg-white/5 border-y border-white/5 flex items-center justify-center">
                      <span className="text-[10px] text-textMuted uppercase tracking-wider">Prima esecuzione</span>
                  </div>
              )}

              <div className="p-3">
                <div className="grid grid-cols-[24px_1fr_1fr_40px] gap-3 mb-2 px-2 text-[10px] text-textMuted font-bold uppercase tracking-wider text-center">
                  <span>#</span>
                  <span>Kg</span>
                  <span>Reps</span>
                  <span>Log</span>
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-[24px_1fr_1fr_40px] gap-3 mb-3 items-center transition-all duration-300 ${set.completed ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    <div className="text-center text-sm text-textMuted font-mono">{setIdx + 1}</div>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      placeholder={prevEx?.sets[setIdx]?.weight || "-"}
                      value={set.weight}
                      onChange={(e) => updateSet(ex.id, setIdx, 'weight', e.target.value)}
                      className="bg-black/40 h-12 rounded-xl text-center font-bold text-xl border border-white/10 focus:border-primary focus:bg-black outline-none transition-all w-full min-w-0"
                    />
                    <input 
                      type="number"
                      inputMode="numeric"
                      placeholder={prevEx?.sets[setIdx]?.reps || "-"}
                      value={set.reps}
                      onChange={(e) => updateSet(ex.id, setIdx, 'reps', e.target.value)}
                      className="bg-black/40 h-12 rounded-xl text-center font-bold text-xl border border-white/10 focus:border-primary focus:bg-black outline-none transition-all w-full min-w-0"
                    />
                    <button 
                      onClick={() => toggleSet(ex.id, setIdx)}
                      className={`h-12 w-full rounded-xl flex items-center justify-center transition-all active:scale-90 ${set.completed ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-surfaceHighlight hover:bg-white/10'}`}
                    >
                      <CheckCircle2 size={24} />
                    </button>
                  </div>
                ))}

                <div className="mt-4 flex justify-center">
                    <button onClick={() => addSet(ex.id)} className="text-xs py-2 px-6 bg-surfaceHighlight rounded-full text-textMuted flex items-center hover:text-white hover:bg-surfaceHighlight/80 transition-colors">
                        <Plus size={14} className="mr-1"/> Aggiungi Serie
                    </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Extra Exercise Block - Ensured Visibility */}
        <div ref={endRef} className="pt-4 pb-12">
            <button onClick={() => setIsAddingExercise(true)} className="w-full py-6 border-2 border-dashed border-secondary/30 text-secondary rounded-3xl font-bold flex items-center justify-center hover:bg-secondary/5 hover:border-secondary transition-all active:scale-[0.99]">
                <Plus size={24} className="mr-2" /> Aggiungi Esercizio Extra
            </button>
        </div>
      </div>
    </div>
  );
};

const WeightView = ({ entries, setEntries, onEdit, objective, setObjective }: any) => {
  const [newWeight, setNewWeight] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // For local deletion in this view if implemented, or rely on DataManager

  const handleAdd = () => {
    if (!newWeight) return;
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    const newEntry = {
      id: generateId(),
      date: todayStr,
      weight: parseFloat(newWeight),
      weekId: getWeekNumber(d)
    };
    const existingIdx = entries.findIndex((e: WeightEntry) => e.date === todayStr);
    let updated;
    if (existingIdx >= 0) {
        if(!confirm("Esiste già un peso per oggi. Vuoi sovrascriverlo?")) return;
        updated = [...entries];
        updated[existingIdx] = newEntry;
    } else {
        updated = [...entries, newEntry];
    }
    setEntries(updated);
    setNewWeight('');
  };

  const grouped = useMemo(() => {
    const sorted = [...entries].sort((a: WeightEntry, b: WeightEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const weeks: Record<string, { avg: number, entries: WeightEntry[] }> = {};
    sorted.forEach((e) => {
      if (!weeks[e.weekId]) weeks[e.weekId] = { avg: 0, entries: [] };
      weeks[e.weekId].entries.push(e);
    });
    Object.keys(weeks).forEach(k => {
      const sum = weeks[k].entries.reduce((acc, curr) => acc + curr.weight, 0);
      weeks[k].avg = parseFloat((sum / weeks[k].entries.length).toFixed(2));
    });
    return weeks;
  }, [entries]);

  // Stats calculation for Red Box
  const stats = useMemo(() => {
      const sortedWeekKeys = Object.keys(grouped).sort(); // Ascending
      if (sortedWeekKeys.length === 0) return null;
      
      const lastWeekKey = sortedWeekKeys[sortedWeekKeys.length - 1];
      const prevWeekKey = sortedWeekKeys.length > 1 ? sortedWeekKeys[sortedWeekKeys.length - 2] : null;
      
      const lastWeekAvg = grouped[lastWeekKey].avg;
      const prevWeekAvg = prevWeekKey ? grouped[prevWeekKey].avg : null;
      
      let delta = 0;
      let trend = 'flat'; // up, down, flat
      let colorClass = 'bg-white/10 text-textMuted';

      if (prevWeekAvg) {
          delta = lastWeekAvg - prevWeekAvg;
          
          if (delta > 0.05) trend = 'up';
          else if (delta < -0.05) trend = 'down';

          // Determine Color based on Objective
          if (objective === 'bulk') {
              if (trend === 'up') colorClass = 'bg-green-500/20 text-green-500';
              else if (trend === 'down') colorClass = 'bg-danger/20 text-danger';
          } else if (objective === 'cut') {
              if (trend === 'down') colorClass = 'bg-green-500/20 text-green-500';
              else if (trend === 'up') colorClass = 'bg-danger/20 text-danger';
          } else {
              // Maintenance: deviation is bad? Or just neutral. Let's make significant change yellow/red
              if (Math.abs(delta) > 0.5) colorClass = 'bg-secondary/20 text-secondary';
          }
      }

      return { lastWeekAvg, prevWeekAvg, delta, trend, colorClass };
  }, [grouped, objective]);

  const chartData = useMemo(() => {
      return Object.keys(grouped).sort().map(k => ({
          name: k.split('-W')[1],
          fullWeek: k,
          value: grouped[k].avg
      }));
  }, [grouped]);

  return (
    <div className="p-4 pt-safe pb-24 space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Peso</h1>
        <button onClick={onEdit} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white transition-colors">
            <Pencil size={20} />
        </button>
      </div>
      
      {/* Objective Selector */}
      <div className="bg-surface p-1 rounded-xl flex text-xs font-bold mb-2">
          {['bulk', 'maintenance', 'cut'].map((obj) => (
              <button 
                key={obj}
                onClick={() => setObjective(obj as ObjectiveType)}
                className={`flex-1 py-2 rounded-lg capitalize transition-all ${objective === obj ? 'bg-primary text-white shadow-lg' : 'text-textMuted hover:bg-white/5'}`}
              >
                  {obj === 'maintenance' ? 'Mantenimento' : obj}
              </button>
          ))}
      </div>

      {/* Add Weight - Fixed Flex Alignment */}
      <div className="bg-surface p-5 rounded-3xl border border-white/5 shadow-lg">
        <label className="text-xs text-textMuted font-bold uppercase tracking-wider block mb-3">Peso di oggi</label>
        <div className="grid grid-cols-[1fr_80px] gap-3 h-16 w-full mb-4">
            <input 
                type="number" 
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full h-full bg-background text-3xl font-bold px-4 rounded-2xl border border-white/10 focus:border-primary outline-none text-center placeholder:text-white/10"
                placeholder="0.0"
            />
            <button 
                onClick={handleAdd}
                className="w-full h-full rounded-2xl bg-primary hover:bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
                <Plus size={32} />
            </button>
        </div>

        {/* NEW: Stats Recap Box */}
        {stats && stats.prevWeekAvg && (
            <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between border border-white/5">
                <div>
                    <div className="text-[10px] text-textMuted uppercase tracking-wider">Vs Settimana Scorsa</div>
                    <div className="flex items-center gap-2">
                         <div className="text-sm font-bold text-white">{stats.lastWeekAvg} kg</div>
                         <div className="text-xs text-textMuted">vs {stats.prevWeekAvg}</div>
                    </div>
                </div>
                <div className={`flex items-center gap-1 font-bold px-3 py-1 rounded-lg ${stats.colorClass}`}>
                    {stats.trend === 'up' && <TrendingUp size={16}/>}
                    {stats.trend === 'down' && <TrendingDown size={16}/>}
                    {stats.trend === 'flat' && <Minus size={16}/>}
                    <span>{Math.abs(stats.delta).toFixed(2)} kg</span>
                </div>
            </div>
        )}
      </div>

      <div className="bg-surface p-5 rounded-3xl border border-white/5 h-64 w-full flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '10px' }} itemStyle={{color: 'white'}} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorWeight)" />
            </AreaChart>
            </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([weekId, data]) => (
          <div key={weekId} className="bg-surface rounded-2xl overflow-hidden border border-white/5">
            <button 
              onClick={() => setSelectedWeek(selectedWeek === weekId ? null : weekId)}
              className="w-full flex justify-between items-center p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-base text-white">Settimana {weekId.split('-W')[1]}</span>
                <span className="text-xs text-textMuted">{data.entries[0].date.split('-')[0]}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="text-xl font-bold text-primary">{data.avg} kg</div>
                    <div className="text-[10px] text-textMuted uppercase">Media</div>
                </div>
                {selectedWeek === weekId ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
              </div>
            </button>
            
            {selectedWeek === weekId && (
              <div className="bg-black/30 p-2 space-y-1 border-t border-white/5 animate-fade-in">
                {data.entries.map(entry => (
                  <div key={entry.id} className="flex justify-between items-center p-3 text-sm rounded-xl hover:bg-white/5">
                    <span className="text-textMuted">{new Date(entry.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</span>
                    <span className="font-bold font-mono">{entry.weight} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryView = ({ logs, setLogs, onEdit }: any) => {
  return (
    <div className="p-4 pt-safe pb-24 space-y-4 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Storico</h1>
        <button onClick={onEdit} className="p-2 bg-surfaceHighlight rounded-full text-textMuted hover:text-white transition-colors">
            <Pencil size={20} />
        </button>
      </div>
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-textMuted opacity-50">
            <History size={48} className="mb-4"/>
            <p>Nessun allenamento registrato</p>
        </div>
      ) : (
        logs.map((log: WorkoutLog) => (
          <div key={log.id} className="bg-surface p-5 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Dumbbell size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-primary font-bold uppercase tracking-widest">{log.programName}</div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-white">{new Date(log.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <div className="text-sm text-textMuted mt-1 flex items-center gap-2 font-medium">
                       <Clock size={14} /> {formatTime(log.durationSeconds)}
                    </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{log.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}</div>
                  <div className="text-[10px] text-textMuted uppercase font-bold">Serie</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                  {(log.exercises || []).slice(0, 4).map((ex: Exercise) => (
                      <div key={ex.id} className="text-xs text-textMuted truncate">• {ex.name}</div>
                  ))}
                  {(log.exercises || []).length > 4 && <div className="text-xs text-textMuted italic">+ altri {log.exercises.length - 4}</div>}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const CalculatorView = () => {
  const [plateWeight, setPlateWeight] = useState(''); // Input for plates
  const [barWeight, setBarWeight] = useState('20');
  
  const calculatePlates = () => {
    const totalPlates = parseFloat(plateWeight);
    if (!totalPlates) return [];
    
    let weightPerSide = totalPlates / 2;
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const result = [];
    
    for (const p of plates) {
      while (weightPerSide >= p) {
        result.push(p);
        weightPerSide -= p;
        weightPerSide = Math.round(weightPerSide * 100) / 100;
      }
    }
    return result;
  };

  const plates = calculatePlates();
  
  // Updated Colors with Text Color logic
  const getPlateStyle = (w: number) => {
    switch(w) {
      case 25: return { bg: 'bg-[#ff0000]', h: 'h-32', text: 'text-white' };
      case 20: return { bg: 'bg-[#0000ff]', h: 'h-32', text: 'text-white' };
      case 15: return { bg: 'bg-[#ffc107]', h: 'h-28', text: 'text-black' };
      case 10: return { bg: 'bg-[#008000]', h: 'h-24', text: 'text-white' };
      case 5: return { bg: 'bg-white', h: 'h-20', text: 'text-black' };
      case 2.5: return { bg: 'bg-black', h: 'h-16', text: 'text-white border border-white/30' };
      case 1.25: return { bg: 'bg-gray-400', h: 'h-14', text: 'text-black' };
      default: return { bg: 'bg-gray-600', h: 'h-12', text: 'text-white' };
    }
  };

  return (
    <div className="p-4 pt-safe pb-24 space-y-8 animate-slide-up">
      <h1 className="text-3xl font-bold">Calcolatore</h1>
      
      <div className="bg-surface p-6 rounded-3xl border border-white/5 space-y-6 shadow-lg">
        <div>
          <label className="text-xs text-textMuted mb-2 block font-bold uppercase tracking-wider">Peso Totale DISCHI (kg)</label>
          <input 
            type="number" 
            value={plateWeight} 
            onChange={(e) => setPlateWeight(e.target.value)}
            placeholder="es. 80"
            className="w-full bg-background text-5xl font-bold text-center py-6 rounded-2xl border border-white/10 focus:border-primary outline-none placeholder:text-white/10"
          />
          <p className="text-center text-xs text-textMuted mt-3">Escluso il bilanciere</p>
        </div>
        
        <div>
          <label className="text-xs text-textMuted mb-2 block font-bold uppercase tracking-wider">Bilanciere</label>
          <div className="flex gap-2">
            {['20', '15', '10'].map(w => (
              <button 
                key={w} 
                onClick={() => setBarWeight(w)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${barWeight === w ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-surfaceHighlight hover:bg-white/5'}`}
              >
                {w} kg
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <div className="relative h-48 bg-surface rounded-3xl border border-white/5 overflow-hidden flex items-center pl-0 shadow-inner">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none"></div>
        {/* Barbell Shaft */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full bg-gradient-to-b from-zinc-300 to-zinc-500 h-5 z-0"></div>
        
        <div className="flex items-center gap-0.5 ml-10 relative z-10">
            {/* Collar */}
           <div className="w-6 h-12 bg-zinc-400 rounded-sm shadow-xl flex-shrink-0 border-r border-black/20"></div>
           
           {/* Plates stacking OUTWARDS */}
           {plates.map((p, i) => {
             const style = getPlateStyle(p);
             return (
               <div key={i} className={`${style.bg} ${style.h} ${style.text} w-8 rounded-sm shadow-2xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-l border-black/10 transition-all hover:scale-105 z-10`}>
                 <span className="-rotate-90">{p}</span>
               </div>
             );
           })}
        </div>
        {plates.length === 0 && <div className="text-textMuted text-sm absolute w-full text-center left-0 font-medium">Inserisci peso per visualizzare</div>}
      </div>
      
      {plates.length > 0 && (
          <div className="grid grid-cols-2 gap-4 text-center animate-fade-in">
             <div className="bg-surfaceHighlight p-4 rounded-2xl">
                <div className="text-textMuted text-[10px] uppercase tracking-wider mb-1">Carico per lato</div>
                <div className="text-2xl font-bold text-white">
                    {parseFloat(plateWeight) / 2} kg
                </div>
             </div>
             <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20">
                <div className="text-primary text-[10px] uppercase tracking-wider mb-1 font-bold">TOTALE REALE</div>
                <div className="text-2xl font-bold text-primary">
                    {parseFloat(plateWeight) + parseFloat(barWeight)} kg
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default App;