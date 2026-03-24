import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

export default function Layout() {
  return (
    <div className="min-h-screen flex justify-center">
      <div className="flex w-full max-w-[1200px] relative">
        <Sidebar />
        <main className="flex-1 min-h-screen border-x border-white/[0.06] max-w-[620px]">
          <Outlet />
        </main>
        <RightPanel />
      </div>
    </div>
  );
}
