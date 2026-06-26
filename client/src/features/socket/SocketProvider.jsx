import { useCallback, useEffect, useMemo, useState } from 'react'

import socketClient from './socketClient.js'
import { getToken } from '../auth/token.js'

import { SocketContext } from './SocketContext.js'

export default function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false)

  const handleConnect = useCallback(() => {
    const token = getToken()
    if (!token) return
    socketClient.connect()
  }, [])

  useEffect(() => {
    const token = getToken()
    if (token) socketClient.connect()

    const handleConnectEvt = () => setConnected(true)
    const handleDisconnectEvt = () => setConnected(false)

    // Attach lightweight listeners without business logic
    socketClient.subscribe('connect', handleConnectEvt)
    socketClient.subscribe('disconnect', handleDisconnectEvt)

    const onStorage = (e) => {
      if (e?.key !== 'token') return
      const nextToken = getToken()
      if (!nextToken) return
      handleConnect()
    }

    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
      socketClient.unsubscribe('connect', handleConnectEvt)
      socketClient.unsubscribe('disconnect', handleDisconnectEvt)
      // Important: do not disconnect globally if other parts remount in future.
      // Provider is expected to be mounted once for the app.
    }
  }, [handleConnect])

  const value = useMemo(() => {
    return {
      connect: handleConnect,
      disconnect: socketClient.disconnect,
      subscribe: socketClient.subscribe,
      unsubscribe: socketClient.unsubscribe,
      emit: socketClient.emit,
      isConnected: socketClient.isConnected,
      connected,
    }
  }, [connected, handleConnect])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

