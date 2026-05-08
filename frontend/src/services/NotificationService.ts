import { getAccessToken, notificationsApi } from './api'
import type { AppNotification } from '../types/models'

export type { AppNotification } from '../types/models'

export class NotificationService {
  private static instance: NotificationService
  private listeners: Array<(notification: AppNotification) => void> = []
  private intervalId: number | null = null
  private seenIds = new Set<string>()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  subscribe(callback: (notification: AppNotification) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  private emit(notification: AppNotification) {
    this.listeners.forEach((listener) => listener(notification))
  }

  async refresh() {
    if (!getAccessToken()) return []
    const notifications = await notificationsApi.list()
    for (const notification of notifications) {
      if (!this.seenIds.has(notification.id)) {
        this.seenIds.add(notification.id)
        if (!notification.read) {
          this.emit(notification)
        }
      }
    }
    return notifications
  }

  startMonitoring(_userRole: string, userId?: string) {
    if (!userId || this.intervalId) return

    void this.refresh()
    this.intervalId = window.setInterval(() => {
      void this.refresh()
    }, 5000)
  }

  stopMonitoring() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  sendRoleNotification() {}

  sendUserNotification() {}

  sendConsultationNotification() {}

  sendSystemNotification() {}

  requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission()
    }
    return Promise.resolve('denied')
  }

  showBrowserNotification(notification: AppNotification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'emergency'
      })

      browserNotification.onclick = () => {
        window.focus()
        browserNotification.close()
      }

      if (notification.type !== 'emergency') {
        setTimeout(() => browserNotification.close(), 5000)
      }
    }
  }

  playNotificationSound(type: string) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const frequencies = {
      emergency: [800, 1000, 800],
      new_report: [600, 800],
      consultation: [400, 600],
      system: [300, 500]
    }

    const freq = frequencies[type as keyof typeof frequencies] || frequencies.system

    freq.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }, index * 200)
    })
  }
}

export default NotificationService.getInstance()
