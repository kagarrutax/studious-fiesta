import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ToastViewport from './ToastViewport'

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar />
      <main className="flex-1 w-full py-6">
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  )
}
