// Shared types between frontend and backend

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
  SOLD = 'SOLD',
  TRANSFERRED = 'TRANSFERRED'
}

export enum Country {
  BR = 'BR',
  US = 'US'
}

export enum InvestmentType {
  RENDA_FIXA_IPCA = 'RENDA_FIXA_IPCA',
  RENDA_FIXA_POS = 'RENDA_FIXA_POS',
  RENDA_FIXA_PRE = 'RENDA_FIXA_PRE',
  STOCKS = 'STOCKS',
  FUNDS = 'FUNDS',
  MONEY_MARKET = 'MONEY_MARKET',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  BROKERAGE = 'BROKERAGE',
  CDB = 'CDB',
  LCI = 'LCI',
  LCA = 'LCA',
  TREASURY = 'TREASURY',
  OTHER = 'OTHER'
}

export interface Investment {
  id?: number;
  country: Country;
  account: string;
  description: string;
  type: InvestmentType;
  codigo?: string; // Brazilian investment code
  status: InvestmentStatus;
  
  // Purchase/Initial Investment Data
  purchaseDate?: Date;
  purchaseValueOriginal?: number;
  purchaseCurrency?: string;
  purchaseExchangeRate?: number;
  purchaseValueUsd?: number;
  
  // Maturity/Sale Data
  maturityDate?: Date;
  saleDate?: Date;
  finalValueOriginal?: number;
  finalExchangeRate?: number;
  finalValueUsd?: number;
  
  // Tax Information
  earningsOriginal?: number;
  earningsUsd?: number;
  taxPaidBrazil?: number;
  taxRateBrazil?: number;
  taxToBePaid?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface PortfolioSnapshot {
  id?: number;
  investmentId: number;
  snapshotDate: Date;
  valueOriginal: number;
  currency: string;
  status?: string;
  createdAt?: Date;
}

export interface ExchangeRate {
  id?: number;
  date: Date;
  rate: number;
  type: 'OFFICIAL' | 'PESSIMISTIC' | 'OPTIMISTIC';
  source?: string;
}

export interface Transaction {
  id?: number;
  investmentId: number;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'INTEREST';
  date: Date;
  amountOriginal: number;
  currency: string;
  exchangeRate?: number;
  amountUsd?: number;
  taxPaid?: number;
  notes?: string;
  createdAt?: Date;
}

export interface MonthlySummary {
  id?: number;
  month: Date;
  totalBrBrl: number;
  totalUsUsd: number;
  totalCombinedBrl: number;
  totalCombinedUsd: number;
  exchangeRateUsed: number;
  monthOverMonthChange: number;
  monthOverMonthChangePercent: number;
}

export interface TaxEvent {
  id?: number;
  year: number;
  investmentId: number;
  eventType: 'MATURED' | 'SOLD' | 'INTEREST_PAID' | 'DIVIDEND';
  eventDate: Date;
  description: string;
  valueBrl?: number;
  exchangeRate?: number;
  valueUsd?: number;
  gainLossUsd?: number;
  taxPaidBrazil?: number;
  foreignTaxCreditEligible?: number;
}

// DTOs for API requests/responses
export interface CreateInvestmentDto {
  country: Country;
  account: string;
  description: string;
  type: InvestmentType;
  codigo?: string;
  purchaseDate?: Date;
  purchaseValueOriginal?: number;
  purchaseCurrency?: string;
  maturityDate?: Date;
  notes?: string;
}

export interface UpdateSnapshotDto {
  investmentId: number;
  date: Date;
  value: number;
  status?: InvestmentStatus;
}

export interface MonthlyUpdateDto {
  month: Date;
  updates: Array<{
    investmentId: number;
    value: number;
    status?: InvestmentStatus;
  }>;
}

export interface TaxReportFilters {
  year: number;
  country?: Country;
  includeDetails?: boolean;
}

export interface DashboardSummary {
  totalValueBrl: number;
  totalValueUsd: number;
  monthOverMonthChange: number;
  monthOverMonthChangePercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
  byCountry: {
    BR: { valueBrl: number; valueUsd: number; count: number };
    US: { valueBrl: number; valueUsd: number; count: number };
  };
  byType: Array<{
    type: InvestmentType;
    valueBrl: number;
    valueUsd: number;
    count: number;
    percentage: number;
  }>;
  exchangeRates: {
    current: number;
    scenarios: Array<{
      rate: number;
      totalBrl: number;
      difference: number;
    }>;
  };
}
