import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

const Home = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  redirect('/dashboard');
};

export default Home;
