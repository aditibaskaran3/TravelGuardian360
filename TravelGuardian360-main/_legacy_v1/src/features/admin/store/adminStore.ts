import { create } from '../../../store/createStore';

export type AdminTouristStatus = 'active' | 'monitoring' | 'flagged' | 'resolved';

export type AdminTourist = {
  id: string;
  fullName: string;
  country: string;
  phone: string;
  status: AdminTouristStatus;
  notes: string;
  lastSeen: string;
};

type AdminState = {
  tourists: AdminTourist[];
  selectedTouristId: string | null;
  updateTouristStatus: (id: string, status: AdminTouristStatus) => void;
  updateTouristNotes: (id: string, notes: string) => void;
  selectTourist: (id: string | null) => void;
};

const initialTourists: AdminTourist[] = [
  {
    id: 't-1001',
    fullName: 'Amina Rahman',
    country: 'Bangladesh',
    phone: '+8801712345678',
    status: 'active',
    notes: 'Checked in at hotel.',
    lastSeen: '12 mins ago',
  },
  {
    id: 't-1002',
    fullName: 'Daniel Ortiz',
    country: 'Spain',
    phone: '+34600111222',
    status: 'monitoring',
    notes: 'Near restricted zone.',
    lastSeen: '27 mins ago',
  },
  {
    id: 't-1003',
    fullName: 'Linh Tran',
    country: 'Vietnam',
    phone: '+84901234567',
    status: 'resolved',
    notes: 'Issue cleared.',
    lastSeen: '1 hour ago',
  },
];

export const useAdminStore = create<AdminState>((set, get) => ({
  tourists: initialTourists,
  selectedTouristId: initialTourists[0]?.id ?? null,
  updateTouristStatus(id, status) {
    set({
      tourists: get().tourists.map((tourist) =>
        tourist.id === id ? { ...tourist, status } : tourist,
      ),
    });
  },
  updateTouristNotes(id, notes) {
    set({
      tourists: get().tourists.map((tourist) =>
        tourist.id === id ? { ...tourist, notes } : tourist,
      ),
    });
  },
  selectTourist(id) {
    set({ selectedTouristId: id });
  },
}));
