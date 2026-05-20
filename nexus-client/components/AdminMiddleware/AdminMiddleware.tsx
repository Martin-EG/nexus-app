import { useUserStore } from "@/data/user";
import { FC, PropsWithChildren } from 'react';


const AdminMiddleware: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { is_admin } = useUserStore((state) => state.user);

  if (!is_admin) return null;

  return <>{children}</>;
};

export default AdminMiddleware;