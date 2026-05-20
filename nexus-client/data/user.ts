import { create } from 'zustand';

type User = {
  id: string;
  db_id: number;
  username: string;
  is_admin: boolean;

};

type UserStore = {
  user: User;
  setUser: (user: User) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: {
    id: '',
    db_id: 0,
    username: '',
    is_admin: false,
  },
  setUser: (user: User) => set({ user }),
}));
