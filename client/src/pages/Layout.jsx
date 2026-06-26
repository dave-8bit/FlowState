import { Outlet } from 'react-router-dom'

import Navbar from '../components/Navbar.jsx'
import SocketProvider from '../features/socket/SocketProvider.jsx'

export default function Layout() {
  return (
    <SocketProvider>
      <div>
        <Navbar />
        <Outlet />
      </div>
    </SocketProvider>
  )
}


