import { defineStore } from 'pinia'
import HttpRequest from '~/services/request';
import { useSocketStore } from './socket'


const http = new HttpRequest()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null as { username: string; name: string, company_id: string, id: string, user_type?: string | null } | null,
  }),

  actions: {
    // Initialize auth state from localStorage on app start
    async initializeAuth() {
      if (process.client) {
        const savedAuth = localStorage.getItem('restaurant_auth')
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            if (authData.isAuthenticated && authData.user) {
              this.isAuthenticated = authData.isAuthenticated
              this.user = authData.user
            }
          } catch (error) {
            console.error('Error parsing saved auth data:', error)
            localStorage.removeItem('restaurant_auth')
          }
        }
      }
    },

    async login(username: string, password: string): Promise<boolean> {
      try {
        const res = await http.request('POST', 'auth/login', { username, password })

        if (res.status !== 200) {
          console.error('Login failed:', res.data)
          return false
        }

        const responseData = res.data as { success: boolean, name_user: string, company_id: string, id: string, user_type?: string | null };
        if (!responseData.success) {
          return false
        }

        this.isAuthenticated = true
        this.user = {
          username,
          name: responseData.name_user,
          company_id: responseData.company_id,
          id: responseData.id,
          user_type: (responseData.user_type ? String(responseData.user_type).trim().toUpperCase() : null)
        }

        const authData = {
          isAuthenticated: this.isAuthenticated,
          user: this.user,
          loginTime: new Date().toISOString()
        }

        localStorage.setItem('restaurant_auth', JSON.stringify(authData))
        
        // Autenticar no socket após login bem-sucedido
        const socketStore = useSocketStore()
        if (socketStore.isConnected) {
          socketStore.authenticateUser()
        }
        
        return true
      } catch (error) {
        console.error('Login request failed:', error)
        return false
      }
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
      
      // Desconectar socket ao fazer logout
      const socketStore = useSocketStore()
      socketStore.disconnect()

      // Clear localStorage
      if (process.client) {
        localStorage.removeItem('restaurant_auth')
      }
    },

    // Check if session is still valid (optional - for future use)
    validateSession() {
      if (process.client) {
        const savedAuth = localStorage.getItem('restaurant_auth')
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth)
            const loginTime = new Date(authData.loginTime)
            const now = new Date()
            const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)

            // Optional: Auto-logout after 24 hours
            if (hoursSinceLogin > 24) {
              this.logout()
              return false
            }

            return true
          } catch (error) {
            console.error('Error validating session:', error)
            this.logout()
            return false
          }
        }
      }
      return false
    }
  }
})
