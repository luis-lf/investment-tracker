import { get, post, put, del } from './api';
import {
  Investment,
  CreateInvestmentDto,
  PortfolioSnapshot,
  DashboardSummary,
  ExchangeRate,
  TaxEvent,
  Country,
  InvestmentStatus,
  InvestmentType
} from '@shared/types';

// Additional interfaces for API responses
interface InvestmentSummary {
  total: number;
  byCountry: Record<string, number>;
  byType: Record<string, number>;
  byAccount: Record<string, number>;
}

interface EvolutionData {
  date: string;
  totalBrl: number;
  totalUsd: number;
}

interface AllocationData {
  type: InvestmentType;
  valueBrl: number;
  valueUsd: number;
  count: number;
  percentage: number;
}

interface TaxReport {
  year: number;
  country: Country;
  totalTaxPaid: number;
  totalEarnings: number;
  events: TaxEvent[];
}

interface ExportFilters {
  country?: Country;
  status?: InvestmentStatus;
  account?: string;
  type?: string;
}

export const investmentService = {
  // Get all investments with optional filters
  getAll: (filters?: {
    country?: Country;
    status?: InvestmentStatus;
    account?: string;
    type?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return get<{ success: boolean; data: Investment[]; count: number }>(
      `/investments${params.toString() ? `?${params}` : ''}`
    );
  },

  // Get investment by ID
  getById: (id: number) =>
    get<{ success: boolean; data: Investment }>(`/investments/${id}`),

  // Get investment by codigo
  getByCodigo: (codigo: string) =>
    get<{ success: boolean; data: Investment }>(`/investments/codigo/${codigo}`),

  // Create new investment
  create: (data: CreateInvestmentDto) =>
    post<{ success: boolean; data: Investment; message: string }>(
      '/investments',
      data
    ),

  // Update investment
  update: (id: number, data: Partial<Investment>) =>
    put<{ success: boolean; data: Investment; message: string }>(
      `/investments/${id}`,
      data
    ),

  // Mark investment as done
  markAsDone: (id: number, finalValue: number, saleDate?: Date) =>
    post<{ success: boolean; data: Investment; message: string }>(
      `/investments/${id}/mark-done`,
      { finalValue, saleDate }
    ),

  // Delete investment
  delete: (id: number) =>
    del<{ success: boolean; message: string }>(`/investments/${id}`),

  // Get investments summary
  getSummary: () =>
    get<{ success: boolean; data: InvestmentSummary }>('/investments/summary'),

  // Get upcoming maturities
  getUpcomingMaturities: (days: number = 30) =>
    get<{ success: boolean; data: Investment[]; count: number }>(
      `/investments/upcoming-maturities?days=${days}`
    ),

  // Search investments
  search: (query: string) =>
    get<{ success: boolean; data: Investment[]; count: number }>(
      `/investments/search?q=${encodeURIComponent(query)}`
    ),
};

export const snapshotService = {
  // Get snapshots for an investment
  getByInvestmentId: (investmentId: number) =>
    get<{ success: boolean; data: PortfolioSnapshot[] }>(
      `/snapshots/investment/${investmentId}`
    ),

  // Create snapshot
  create: (data: Omit<PortfolioSnapshot, 'id'>) =>
    post<{ success: boolean; data: PortfolioSnapshot }>(
      '/snapshots',
      data
    ),

  // Bulk update snapshots for a month
  bulkUpdate: (month: Date, updates: Array<{
    investmentId: number;
    value: number;
    status?: InvestmentStatus;
  }>) =>
    post<{ success: boolean; message: string }>(
      '/snapshots/bulk-update',
      { month, updates }
    ),

  // Get monthly snapshot
  getMonthlySnapshot: (month: string) =>
    get<{ success: boolean; data: PortfolioSnapshot[] }>(
      `/snapshots/monthly?month=${month}`
    ),
};

export const dashboardService = {
  // Get dashboard summary
  getSummary: () =>
    get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary'),

  // Get portfolio evolution
  getEvolution: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return get<{ success: boolean; data: EvolutionData[] }>(
      `/dashboard/evolution${params.toString() ? `?${params}` : ''}`
    );
  },

  // Get asset allocation
  getAllocation: () =>
    get<{ success: boolean; data: AllocationData[] }>('/dashboard/allocation'),
};

export const exchangeRateService = {
  // Get current exchange rate
  getCurrent: () =>
    get<{ success: boolean; data: ExchangeRate }>('/exchange-rates/current'),

  // Get historical rates
  getHistory: (startDate: string, endDate: string) =>
    get<{ success: boolean; data: ExchangeRate[] }>(
      `/exchange-rates/history?startDate=${startDate}&endDate=${endDate}`
    ),

  // Update exchange rate
  update: (date: Date, rate: number, type?: string) =>
    post<{ success: boolean; data: ExchangeRate }>(
      '/exchange-rates',
      { date, rate, type }
    ),
};

export const taxService = {
  // Generate tax report
  generateReport: (year: number, country?: Country) => {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    if (country) params.append('country', country);
    return get<{ success: boolean; data: TaxReport }>(
      `/tax/report?${params}`
    );
  },

  // Get tax events
  getTaxEvents: (year: number) =>
    get<{ success: boolean; data: TaxEvent[] }>(
      `/tax/events?year=${year}`
    ),

  // Calculate tax preview
  calculatePreview: (investmentId: number, saleValue: number) =>
    post<{ success: boolean; data: { tax: number; netEarnings: number; taxRate: number } }>(
      '/tax/calculate-preview',
      { investmentId, saleValue }
    ),
};

export const importExportService = {
  // Import Excel data
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return post<{ success: boolean; message: string; imported: number }>(
      '/import-export/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  // Export to Excel
  exportExcel: (filters?: ExportFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    return get<Blob>(
      `/import-export/export${params.toString() ? `?${params}` : ''}`,
      {
        responseType: 'blob',
      }
    );
  },

  // Export tax report
  exportTaxReport: (year: number, format: 'pdf' | 'excel' = 'pdf') =>
    get<Blob>(
      `/import-export/tax-report?year=${year}&format=${format}`,
      {
        responseType: 'blob',
      }
    ),
};
