import { Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
