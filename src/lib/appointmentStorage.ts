export interface AppointmentData {
  service: Service;
  date: Date;
  time: TimeSlot;
  timeSlots: TimeSlot[];
  observation?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

export class AppointmentStorage {
  // ✅ FALLBACK EM MEMÓRIA (localStorage pode não estar disponível)
  private static memoryCache = {
    appointmentData: null as AppointmentData | null,
    selectedDate: null as Date | null,
    selectedService: null as Service | null,
  };

  private static readonly APPOINTMENT_DATA_KEY = 'appointmentData';
  private static readonly SELECTED_DATE_KEY = 'selectedDate';
  private static readonly SELECTED_SERVICE_KEY = 'selectedService';

  // ✅ Verificar se está no browser E localStorage disponível
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // ✅ Tentar localStorage, fallback para memória
  private static setStorage(key: string, value: string): void {
    try {
      if (this.isBrowser()) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage indisponível, usando memória:', key);
    }
  }

  private static getStorage(key: string): string | null {
    try {
      if (this.isBrowser()) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage indisponível, usando memória:', key);
    }
    return null;
  }

  private static removeStorage(key: string): void {
    try {
      if (this.isBrowser()) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage indisponível ao remover:', key);
    }
  }

  // Validação de dados
  private static validateAppointmentData(data: any): data is AppointmentData {
    return (
      data &&
      typeof data === 'object' &&
      data.service &&
      typeof data.service.id === 'string' &&
      typeof data.service.name === 'string' &&
      data.date &&
      (data.date instanceof Date || typeof data.date === 'string') &&
      data.time &&
      typeof data.time.id === 'string' &&
      typeof data.time.time === 'string' &&
      Array.isArray(data.timeSlots)
    );
  }

  private static validateService(data: any): data is Service {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.name === 'string'
    );
  }

  // Salvar dados com validação
  static saveAppointmentData(data: AppointmentData): boolean {
    try {
      if (!this.validateAppointmentData(data)) {
        console.error('Invalid appointment data:', data);
        return false;
      }

      // Salvar em memória sempre
      this.memoryCache.appointmentData = data;

      // Tentar localStorage se disponível
      const serializedData = JSON.stringify({
        ...data,
        date: data.date.toISOString(),
        savedAt: new Date().toISOString()
      });
      this.setStorage(this.APPOINTMENT_DATA_KEY, serializedData);

      return true;
    } catch (error) {
      console.error('Error saving appointment data:', error);
      return false;
    }
  }

  // Carregar dados com validação
  static loadAppointmentData(): AppointmentData | null {
    try {
      // 1. Tentar memória primeiro
      if (this.memoryCache.appointmentData) {
        return this.memoryCache.appointmentData;
      }

      // 2. Tentar localStorage
      const savedData = this.getStorage(this.APPOINTMENT_DATA_KEY);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      if (!this.validateAppointmentData(parsedData)) {
        console.error('Invalid appointment data in localStorage:', parsedData);
        this.clearAppointmentData();
        return null;
      }

      // Salvar em memória para próximas tentativas
      const appointmentData = {
        ...parsedData,
        date: new Date(parsedData.date)
      };
      this.memoryCache.appointmentData = appointmentData;

      return appointmentData;
    } catch (error) {
      console.error('Error loading appointment data:', error);
      this.clearAppointmentData();
      return null;
    }
  }

  // Salvar data selecionada
  static saveSelectedDate(date: Date): boolean {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date:', date);
        return false;
      }

      // Salvar em memória
      this.memoryCache.selectedDate = date;

      // Tentar localStorage
      this.setStorage(this.SELECTED_DATE_KEY, date.toISOString());
      return true;
    } catch (error) {
      console.error('Error saving selected date:', error);
      return false;
    }
  }

  // Carregar data selecionada
  static loadSelectedDate(): Date | null {
    try {
      // 1. Tentar memória primeiro
      if (this.memoryCache.selectedDate) {
        return this.memoryCache.selectedDate;
      }

      // 2. Tentar localStorage
      const savedDate = this.getStorage(this.SELECTED_DATE_KEY);
      if (!savedDate) return null;

      const date = new Date(savedDate);
      if (isNaN(date.getTime())) {
        console.error('Invalid date in localStorage:', savedDate);
        this.clearSelectedDate();
        return null;
      }

      // Salvar em memória
      this.memoryCache.selectedDate = date;
      return date;
    } catch (error) {
      console.error('Error loading selected date:', error);
      this.clearSelectedDate();
      return null;
    }
  }

  // Salvar serviço selecionado
  static saveSelectedService(service: Service): boolean {
    try {
      if (!this.validateService(service)) {
        console.error('Invalid service:', service);
        return false;
      }

      // Salvar em memória
      this.memoryCache.selectedService = service;

      // Tentar localStorage
      this.setStorage(this.SELECTED_SERVICE_KEY, JSON.stringify(service));
      return true;
    } catch (error) {
      console.error('Error saving selected service:', error);
      return false;
    }
  }

  // Carregar serviço selecionado
  static loadSelectedService(): Service | null {
    try {
      // 1. Tentar memória primeiro
      if (this.memoryCache.selectedService) {
        return this.memoryCache.selectedService;
      }

      // 2. Tentar localStorage
      const savedService = this.getStorage(this.SELECTED_SERVICE_KEY);
      if (!savedService) return null;

      const parsedService = JSON.parse(savedService);

      if (!this.validateService(parsedService)) {
        console.error('Invalid service in localStorage:', parsedService);
        this.clearSelectedService();
        return null;
      }

      // Salvar em memória
      this.memoryCache.selectedService = parsedService;
      return parsedService;
    } catch (error) {
      console.error('Error loading selected service:', error);
      this.clearSelectedService();
      return null;
    }
  }

  // Limpar métodos
  static clearAppointmentData(): void {
    try {
      this.memoryCache.appointmentData = null;
      this.removeStorage(this.APPOINTMENT_DATA_KEY);
    } catch (error) {
      console.error('Error clearing appointment data:', error);
    }
  }

  static clearSelectedDate(): void {
    try {
      this.memoryCache.selectedDate = null;
      this.removeStorage(this.SELECTED_DATE_KEY);
    } catch (error) {
      console.error('Error clearing selected date:', error);
    }
  }

  static clearSelectedService(): void {
    try {
      this.memoryCache.selectedService = null;
      this.removeStorage(this.SELECTED_SERVICE_KEY);
    } catch (error) {
      console.error('Error clearing selected service:', error);
    }
  }

  // Limpar todos os dados de agendamento
  static clearAll(): void {
    this.clearAppointmentData();
    this.clearSelectedDate();
    this.clearSelectedService();
  }

  // Verificar se há dados completos
  static hasCompleteData(): boolean {
    const appointmentData = this.loadAppointmentData();
    const selectedDate = this.loadSelectedDate();
    const selectedService = this.loadSelectedService();

    return !!(appointmentData && selectedDate && selectedService);
  }
}
