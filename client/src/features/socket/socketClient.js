import { io } from 'socket.io-client'

import { getToken } from '../auth/token.js'

let socket = null

function getAuth() {
  const token = getToken()
  return {
    token: token || undefined,
  }
}

function ensureSocket() {
  if (socket) return socket

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  socket = io(baseURL, {
    autoConnect: false,
    auth: getAuth(),
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  })

  return socket
}

function connect() {
  const s = ensureSocket()

  // refresh auth on each connect attempt (token may have changed)
  s.auth = getAuth()

  if (!s.connected) {
    s.connect()
  }
}

function disconnect() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}

function isConnected() {
  return !!socket?.connected
}

function subscribe(event, handler) {
  const s = ensureSocket()
  // prevent duplicate handlers for same function reference
  s.off(event, handler)
  s.on(event, handler)
}

function unsubscribe(event, handler) {
  if (!socket) return
  socket.off(event, handler)
}

function emit(event, payload) {
  const s = ensureSocket()
  if (!s.connected) return
  s.emit(event, payload)
}

export default {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  emit,
  isConnected,
}

