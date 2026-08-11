import { create } from 'zustand'
import type {
  Appointment,
  AiAgent,
  Business,
  BusinessAvailability,
  BusinessSubscription,
  ClinicService,
  DashboardAnalytics,
  Notification,
  Patient,
} from '@/types'

interface BusinessStoreState {
  business: Business | null
  subscription: BusinessSubscription | null
  agent: AiAgent | null
  services: ClinicService[]
  availability: BusinessAvailability[]
  patients: Patient[]
  appointments: Appointment[]
  notifications: Notification[]
  analytics: DashboardAnalytics | null
  isLoading: boolean
  setBusiness: (business: Business | null) => void
  setSubscription: (subscription: BusinessSubscription | null) => void
  setAgent: (agent: AiAgent | null) => void
  setServices: (services: ClinicService[]) => void
  setAvailability: (availability: BusinessAvailability[]) => void
  setPatients: (patients: Patient[]) => void
  setAppointments: (appointments: Appointment[]) => void
  setNotifications: (notifications: Notification[]) => void
  setAnalytics: (analytics: DashboardAnalytics | null) => void
  setLoading: (isLoading: boolean) => void
  resetBusiness: () => void
}

export const useBusinessStore = create<BusinessStoreState>((set) => ({
  business: null,
  subscription: null,
  agent: null,
  services: [],
  availability: [],
  patients: [],
  appointments: [],
  notifications: [],
  analytics: null,
  isLoading: false,
  setBusiness: (business) => set({ business }),
  setSubscription: (subscription) => set({ subscription }),
  setAgent: (agent) => set({ agent }),
  setServices: (services) => set({ services }),
  setAvailability: (availability) => set({ availability }),
  setPatients: (patients) => set({ patients }),
  setAppointments: (appointments) => set({ appointments }),
  setNotifications: (notifications) => set({ notifications }),
  setAnalytics: (analytics) => set({ analytics }),
  setLoading: (isLoading) => set({ isLoading }),
  resetBusiness: () =>
    set({
      business: null,
      subscription: null,
      agent: null,
      services: [],
      availability: [],
      patients: [],
      appointments: [],
      notifications: [],
      analytics: null,
      isLoading: false,
    }),
}))

export default useBusinessStore
