// Formatting utilities

export function formatCurrency(microUSDC: number): string {
  const usdc = microUSDC / 1_000_000;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(usdc);
}

export function formatPercentage(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatBasisPoints(bps: number): string {
  return formatPercentage(bps / 100, 2);
}

export function formatAddress(address: string, chars = 4): string {
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('pt-BR', options).format(value);
}

export function formatScore(score: number): string {
  return `${score}/100`;
}

export function formatMicroUSDC(microUSDC: number): string {
  if (microUSDC >= 1_000_000) {
    return formatCurrency(microUSDC);
  } else if (microUSDC >= 1_000) {
    return `${(microUSDC / 1_000).toFixed(1)}K µUSDC`;
  } else {
    return `${microUSDC} µUSDC`;
  }
}

export function parseMicroUSDC(usdcString: string): number {
  const cleaned = usdcString.replace(/[$,\s]/g, '');
  const usdc = parseFloat(cleaned);
  return Math.round(usdc * 1_000_000);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'agora';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else if (diffDays < 7) {
    return `${diffDays}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}
