import Decimal from 'decimal.js';
import { InvestmentType } from '../../../shared/types';

interface TaxCalculationResult {
  rate: number;
  amount: number;
  netEarnings: number;
}

/**
 * Calculate Brazilian income tax for investments
 * Based on Brazilian tax laws for fixed income investments
 */
export function calculateTaxBrazil(
  investmentType: InvestmentType | string,
  earnings: number,
  holdingDays: number
): TaxCalculationResult {
  const earningsDecimal = new Decimal(earnings);
  let taxRate = 0;

  // Fixed income tax rates based on holding period
  // These rates apply to CDB, RDB, LC, and similar investments
  if (
    investmentType === InvestmentType.CDB ||
    investmentType === InvestmentType.RENDA_FIXA_IPCA ||
    investmentType === InvestmentType.RENDA_FIXA_POS ||
    investmentType === InvestmentType.RENDA_FIXA_PRE ||
    investmentType.includes('CDB') ||
    investmentType.includes('Renda Fixa')
  ) {
    if (holdingDays <= 180) {
      taxRate = 22.5; // 22.5% for up to 180 days
    } else if (holdingDays <= 360) {
      taxRate = 20; // 20% for 181-360 days
    } else if (holdingDays <= 720) {
      taxRate = 17.5; // 17.5% for 361-720 days
    } else {
      taxRate = 15; // 15% for more than 720 days
    }
  }
  // LCI and LCA are tax-exempt for individuals
  else if (
    investmentType === InvestmentType.LCI ||
    investmentType === InvestmentType.LCA
  ) {
    taxRate = 0;
  }
  // Treasury bonds (Tesouro Direto) follow the same table
  else if (investmentType === InvestmentType.TREASURY) {
    if (holdingDays <= 180) {
      taxRate = 22.5;
    } else if (holdingDays <= 360) {
      taxRate = 20;
    } else if (holdingDays <= 720) {
      taxRate = 17.5;
    } else {
      taxRate = 15;
    }
  }
  // Stocks have different rules (15% for regular sales, 20% for day trade)
  else if (investmentType === InvestmentType.STOCKS) {
    // Simplified - assuming regular sales (not day trade)
    // Note: There's an exemption for sales up to R$ 20,000/month
    taxRate = 15;
  }
  // Investment funds have come-cotas and different rates
  else if (investmentType === InvestmentType.FUNDS) {
    // Simplified - using the lowest rate for long-term funds
    if (holdingDays <= 180) {
      taxRate = 22.5;
    } else {
      taxRate = 15;
    }
  }
  // Default rate for other investment types
  else {
    taxRate = 15;
  }

  const taxAmount = earningsDecimal.mul(taxRate).div(100).toNumber();
  const netEarnings = earningsDecimal.minus(taxAmount).toNumber();

  return {
    rate: taxRate,
    amount: parseFloat(taxAmount.toFixed(2)),
    netEarnings: parseFloat(netEarnings.toFixed(2))
  };
}

/**
 * Calculate IOF (Tax on Financial Operations) for very short-term redemptions
 * IOF applies to fixed income investments redeemed within 30 days
 */
export function calculateIOF(earnings: number, holdingDays: number): number {
  if (holdingDays >= 30) {
    return 0;
  }

  // IOF table for fixed income (regressive from 96% to 0% over 30 days)
  const iofTable: Record<number, number> = {
    1: 96, 2: 93, 3: 90, 4: 86, 5: 83,
    6: 80, 7: 76, 8: 73, 9: 70, 10: 66,
    11: 63, 12: 60, 13: 56, 14: 53, 15: 50,
    16: 46, 17: 43, 18: 40, 19: 36, 20: 33,
    21: 30, 22: 26, 23: 23, 24: 20, 25: 16,
    26: 13, 27: 10, 28: 6, 29: 3, 30: 0
  };

  const iofRate = iofTable[holdingDays] || 0;
  return new Decimal(earnings).mul(iofRate).div(100).toNumber();
}

/**
 * Calculate the effective tax rate considering both IR and IOF
 */
export function calculateEffectiveTax(
  investmentType: InvestmentType | string,
  earnings: number,
  holdingDays: number
): TaxCalculationResult {
  const irResult = calculateTaxBrazil(investmentType, earnings, holdingDays);
  const iofAmount = calculateIOF(earnings, holdingDays);
  
  const totalTax = irResult.amount + iofAmount;
  const netEarnings = earnings - totalTax;
  const effectiveRate = (totalTax / earnings) * 100;

  return {
    rate: parseFloat(effectiveRate.toFixed(2)),
    amount: parseFloat(totalTax.toFixed(2)),
    netEarnings: parseFloat(netEarnings.toFixed(2))
  };
}

/**
 * Estimate US tax liability for Brazilian investment income
 * This is a simplified calculation - actual tax depends on many factors
 */
export function estimateUSTax(
  earningsUsd: number,
  brazilianTaxPaid: number,
  marginalTaxRate: number = 24 // Default to 24% bracket
): {
  usTaxBeforeCredit: number;
  foreignTaxCredit: number;
  estimatedUsTaxOwed: number;
} {
  const usTaxBeforeCredit = new Decimal(earningsUsd).mul(marginalTaxRate).div(100);
  const foreignTaxCredit = Math.min(brazilianTaxPaid, usTaxBeforeCredit.toNumber());
  const estimatedUsTaxOwed = Math.max(0, usTaxBeforeCredit.minus(foreignTaxCredit).toNumber());

  return {
    usTaxBeforeCredit: parseFloat(usTaxBeforeCredit.toFixed(2)),
    foreignTaxCredit: parseFloat(foreignTaxCredit.toFixed(2)),
    estimatedUsTaxOwed: parseFloat(estimatedUsTaxOwed.toFixed(2))
  };
}
