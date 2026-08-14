import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import OnlineUsersRail from './OnlineUsersRail'
import ToastViewport from './ToastViewport'

export default function Layout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <div className="flex-1 w-full py-6">
        {isAuthenticated ? (
          <div className="mx-auto flex w-full max-w-6xl gap-4 px-4 lg:items-stretch">
            <main className="min-w-0 flex-1">
              <Outlet />
            </main>
            {/* Solo web: mismo lado derecho, anclado abajo */}
            <aside className="hidden lg:flex lg:w-52 lg:shrink-0 lg:flex-col lg:justify-end lg:min-h-[calc(100vh-7rem)]">
              <div className="lg:sticky lg:bottom-6">
                <OnlineUsersRail variant="rail" />
              </div>
            </aside>
          </div>
        ) : (
          <main className="w-full">
            <Outlet />
          </main>
        )}
      </div>
      <ToastViewport />
    </div>
  )
}
