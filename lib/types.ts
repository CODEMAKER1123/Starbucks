export interface Job {
  id: string;
  workizJobId?: string;
  storeNumber: string;
  woNumber?: string;
  invoiceNumber?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  storePhone?: string;
  price: number;
  serviceDate: string;
  nightNumber?: number;
  assignedTech?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime?: string;
  stopTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedScheduleRow {
  night: number;
  date: string;
  store: string;
  storeNumber: string;
  address: string;
  city: string;
  state: string;
}
