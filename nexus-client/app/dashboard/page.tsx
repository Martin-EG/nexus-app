'use client';

import { useUserStore } from "@/data/user";

const Dashboard = () => {
  const user = useUserStore((state) => state.user);

  const adminPanel = () => {};
  const logout = () => {};
  
  return (
    <>
      
      <div className="container">
        <h2>Bienvenido, {user.username}</h2>
        <p>Atajos rápidos a los módulos arriba.</p>
      </div>
    </>
  )
};

export default Dashboard;
