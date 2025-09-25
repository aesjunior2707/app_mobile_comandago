import { defineStore } from 'pinia'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from './auth'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  isAuthenticated: boolean
  connectionError: string | null
  reconnectAttempts: number
  maxReconnectAttempts: number
}

export const useSocketStore = defineStore('socket', {
  state: (): SocketState => ({
    socket: null,
    isConnected: false,
    isAuthenticated: false,
    connectionError: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
  }),

  actions: {
    // Inicializar conexão Socket.IO
    initializeConnection() {
      if (this.socket) {
        console.log('Socket already initialized')
        return
      }

      try {
        console.log('Initializing Socket.IO connection...')
        
        this.socket = io('wss://messages.comandago.com', {
          transports: ['websocket'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 10000,
          forceNew: false,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: this.maxReconnectAttempts
        })

        this.setupSocketListeners()
      } catch (error) {
        console.error('Error initializing socket connection:', error)
        this.connectionError = 'Failed to initialize socket connection'
      }
    },

    // Configurar listeners do socket
    setupSocketListeners() {
      if (!this.socket) return

      // Conexão estabelecida
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
        this.isConnected = true
        this.connectionError = null
        this.reconnectAttempts = 0

        // Se o usuário já está logado, autenticar automaticamente
        const authStore = useAuthStore()
        if (authStore.isAuthenticated && authStore.user) {
          this.authenticateUser()
        }
      })

      // Desconexão
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        this.isConnected = false
        this.isAuthenticated = false
        
        if (reason === 'io server disconnect') {
          // Reconectar se o servidor desconectou
          this.socket?.connect()
        }
      })

      // Erro de conexão
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        this.connectionError = `Connection error: ${error.message}`
        this.reconnectAttempts++
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          this.connectionError = 'Unable to connect after multiple attempts'
        }
      })

      // Resposta de autenticação
      this.socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data)
        this.isAuthenticated = true
      })

      // Erro de autenticação
      this.socket.on('authentication_error', (error) => {
        console.error('Socket authentication error:', error)
        this.isAuthenticated = false
      })

      // Reconexão bem-sucedida
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        this.reconnectAttempts = 0
        this.connectionError = null
      })

      // Tentativa de reconexão
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt:', attemptNumber)
        this.reconnectAttempts = attemptNumber
      })

      // Falha na reconexão
      this.socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed')
        this.connectionError = 'Reconnection failed'
      })
    },

    // Autenticar usuário no socket
    authenticateUser() {
      const authStore = useAuthStore()
      
      if (!this.socket || !this.isConnected) {
        console.warn('Socket not connected, cannot authenticate')
        return
      }

      if (!authStore.isAuthenticated || !authStore.user) {
        console.warn('User not authenticated, cannot authenticate socket')
        return
      }

      console.log('Authenticating socket user...')
      
      this.socket.emit('authenticate', {
        user_id: authStore.user.id,
        username: authStore.user.name,
        room: 'app-comandago'
      })
    },

    // Desconectar socket
    disconnect() {
      if (this.socket) {
        console.log('Disconnecting socket...')
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
        this.isAuthenticated = false
        this.connectionError = null
        this.reconnectAttempts = 0
      }
    },

    // Emitir evento personalizado
    emit(event: string, data?: any) {
      if (!this.socket || !this.isConnected) {
        console.warn('Socket not connected, cannot emit event:', event)
        return false
      }

      this.socket.emit(event, data)
      return true
    },

    // Escutar evento personalizado
    on(event: string, callback: (...args: any[]) => void) {
      if (!this.socket) {
        console.warn('Socket not initialized, cannot listen to event:', event)
        return
      }

      this.socket.on(event, callback)
    },

    // Remover listener de evento
    off(event: string, callback?: (...args: any[]) => void) {
      if (!this.socket) {
        console.warn('Socket not initialized, cannot remove listener for event:', event)
        return
      }

      if (callback) {
        this.socket.off(event, callback)
      } else {
        this.socket.off(event)
      }
    },

    // Forçar reconexão
    forceReconnect() {
      if (this.socket) {
        console.log('Forcing socket reconnection...')
        this.socket.disconnect()
        this.socket.connect()
      } else {
        this.initializeConnection()
      }
    },

    // Verificar status da conexão
    getConnectionStatus() {
      return {
        isConnected: this.isConnected,
        isAuthenticated: this.isAuthenticated,
        connectionError: this.connectionError,
        reconnectAttempts: this.reconnectAttempts,
        socketId: this.socket?.id || null
      }
    }
  }
})