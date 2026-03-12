import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Client = {
  id: string;
  name: string;
  document?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
};

export type ChecklistItem = {
  id: string;
  task: string;
  category: string;
  clientId?: string; // Legacy: If undefined, it's a global checklist item
  clientIds?: string[]; // New: Array of client IDs. If empty or undefined, and clientId is also undefined, it's global.
};

export type TicketType = 'PREVENTIVA' | 'CORRETIVA';

export type TicketStatus = 'APROVADO' | 'AGUARDANDO_MATERIAL' | 'REALIZANDO' | 'CONCLUIDO';

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Quote = {
  id: string;
  clientId: string;
  date: string;
  items: QuoteItem[];
  totalValue: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
};

export type Receipt = {
  id: string;
  clientId: string;
  date: string;
  value: number;
  description: string;
};

export type Cost = {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
};

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'TICKET' | 'MEETING' | 'OTHER';
  ticketId?: string;
  notes?: string;
};

export type Ticket = {
  id: string;
  title?: string;
  type: TicketType;
  status?: TicketStatus;
  clientId: string;
  date: string;
  technician: string;
  observations: string;
  
  // Corretiva fields
  reportedProblem?: string;
  productsForQuote?: string;
  serviceReport?: string;
  
  // Preventiva fields
  checklistResults?: {
    taskId: string;
    status: 'OK' | 'NOK' | 'NA';
    notes: string;
  }[];
};

export type CompanyData = {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
};

export type Product = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
};

interface AppState {
  clients: Client[];
  checklistItems: ChecklistItem[];
  tickets: Ticket[];
  quotes: Quote[];
  receipts: Receipt[];
  costs: Cost[];
  appointments: Appointment[];
  products: Product[];
  companyLogo: string | null;
  companySignature: string | null;
  companyData: CompanyData | null;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  menuOrder: string[];
  
  setCompanyLogo: (logo: string | null) => void;
  setCompanySignature: (signature: string | null) => void;
  setCompanyData: (data: CompanyData) => void;
  setMenuOrder: (order: string[]) => void;
  toggleTheme: () => void;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Omit<Client, 'id'>) => void;
  deleteClient: (id: string) => void;
  
  addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => void;
  updateChecklistItem: (id: string, item: Omit<ChecklistItem, 'id'>) => void;
  deleteChecklistItem: (id: string) => void;
  
  addTicket: (ticket: Omit<Ticket, 'id'>) => void;
  updateTicket: (id: string, ticket: Omit<Ticket, 'id'>) => void;
  deleteTicket: (id: string) => void;

  addQuote: (quote: Omit<Quote, 'id'>) => void;
  updateQuote: (id: string, quote: Omit<Quote, 'id'>) => void;
  deleteQuote: (id: string) => void;

  addReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  deleteReceipt: (id: string) => void;

  addCost: (cost: Omit<Cost, 'id'>) => void;
  deleteCost: (id: string) => void;

  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, appointment: Omit<Appointment, 'id'>) => void;
  deleteAppointment: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (products: Omit<Product, 'id'>[]) => void;
  restoreData: (data: Partial<AppState>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      clients: [],
      checklistItems: [
        { id: uuidv4(), task: 'Verificar extintores', category: 'Segurança' },
        { id: uuidv4(), task: 'Limpeza da caixa d\'água', category: 'Hidráulica' },
        { id: uuidv4(), task: 'Revisão do quadro elétrico', category: 'Elétrica' },
        { id: uuidv4(), task: 'Lubrificação de portões', category: 'Mecânica' },
      ],
      tickets: [],
      quotes: [],
      receipts: [],
      costs: [],
      appointments: [],
      products: [],
      companyLogo: null,
      companySignature: null,
      companyData: null,
      theme: 'light',
      isAuthenticated: false,
      menuOrder: ['dashboard', 'clients', 'products', 'tickets', 'kanban', 'quotes', 'receipts', 'financial', 'calendar', 'settings'],
      
      setCompanyLogo: (logo) => set({ companyLogo: logo }),
      setCompanySignature: (signature) => set({ companySignature: signature }),
      setCompanyData: (data) => set({ companyData: data }),
      setMenuOrder: (order) => set({ menuOrder: order }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      login: (user, pass) => {
        if (user === 'admin' && pass === '123') {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
      
      addClient: (client) => set((state) => ({ clients: [...state.clients, { ...client, id: uuidv4() }] })),
      updateClient: (id, updatedClient) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...updatedClient, id } : c)
      })),
      deleteClient: (id) => set((state) => ({ clients: state.clients.filter(c => c.id !== id) })),
      
      addChecklistItem: (item) => set((state) => ({ checklistItems: [...state.checklistItems, { ...item, id: uuidv4() }] })),
      updateChecklistItem: (id, updatedItem) => set((state) => ({
        checklistItems: state.checklistItems.map(i => i.id === id ? { ...updatedItem, id } : i)
      })),
      deleteChecklistItem: (id) => set((state) => ({ checklistItems: state.checklistItems.filter(i => i.id !== id) })),
      
      addTicket: (ticket) => set((state) => ({ tickets: [...state.tickets, { ...ticket, id: uuidv4() }] })),
      updateTicket: (id, updatedTicket) => set((state) => ({
        tickets: state.tickets.map(t => t.id === id ? { ...updatedTicket, id } : t)
      })),
      deleteTicket: (id) => set((state) => ({ tickets: state.tickets.filter(t => t.id !== id) })),

      addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, { ...quote, id: uuidv4() }] })),
      updateQuote: (id, updatedQuote) => set((state) => ({
        quotes: state.quotes.map(q => q.id === id ? { ...updatedQuote, id } : q)
      })),
      deleteQuote: (id) => set((state) => ({ quotes: state.quotes.filter(q => q.id !== id) })),

      addReceipt: (receipt) => set((state) => ({ receipts: [...state.receipts, { ...receipt, id: uuidv4() }] })),
      deleteReceipt: (id) => set((state) => ({ receipts: state.receipts.filter(r => r.id !== id) })),

      addCost: (cost) => set((state) => ({ costs: [...state.costs, { ...cost, id: uuidv4() }] })),
      deleteCost: (id) => set((state) => ({ costs: state.costs.filter(c => c.id !== id) })),

      addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, { ...appointment, id: uuidv4() }] })),
      updateAppointment: (id, updatedAppointment) => set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...updatedAppointment, id } : a)
      })),
      deleteAppointment: (id) => set((state) => ({ appointments: state.appointments.filter(a => a.id !== id) })),

      addProduct: (product) => set((state) => ({ products: [...state.products, { ...product, id: uuidv4() }] })),
      updateProduct: (id, updatedProduct) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...updatedProduct, id } : p)
      })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),
      importProducts: (newProducts) => set((state) => ({ 
        products: [...state.products, ...newProducts.map(p => ({ ...p, id: uuidv4() }))]
      })),
      restoreData: (data) => set((state) => ({
        ...state,
        ...data,
        // Ensure we don't accidentally overwrite functions if they were included in JSON
        clients: data.clients || state.clients,
        checklistItems: data.checklistItems || state.checklistItems,
        tickets: data.tickets || state.tickets,
        quotes: data.quotes || state.quotes,
        receipts: data.receipts || state.receipts,
        costs: data.costs || state.costs,
        appointments: data.appointments || state.appointments,
        products: data.products || state.products,
        companyLogo: data.companyLogo !== undefined ? data.companyLogo : state.companyLogo,
        companySignature: data.companySignature !== undefined ? data.companySignature : state.companySignature,
        companyData: data.companyData !== undefined ? data.companyData : state.companyData,
        theme: data.theme || state.theme,
        menuOrder: data.menuOrder || state.menuOrder,
      })),
    }),
    {
      name: 'manutencao-storage',
    }
  )
);
