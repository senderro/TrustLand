import { NextRequest, NextResponse } from 'next/server';
import ContractHelper from '@/lib/sepolia-integration';
import { SEPOLIA_CONFIG } from '@/lib/sepolia-wallets';

function createApiResponse(data: any) {
  return { success: true, data };
}

function createApiError(message: string, code?: string) {
  return { success: false, error: message, code };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    // Get network status
    const networkStatus = {
      network: SEPOLIA_CONFIG.name,
      chainId: SEPOLIA_CONFIG.chainId,
      rpcUrl: SEPOLIA_CONFIG.rpcUrl.includes('dsk93iS_CPvx1KDsp3qYaRFwAnURxr5l') ? 'Connected' : 'Not Connected',
      blockExplorer: SEPOLIA_CONFIG.blockExplorer,
      contracts: {
        trustLendMVP: ContractHelper.getTrustLendAddress(),
        mockUSDC: ContractHelper.getUSDCAddress(),
      },
      isOnline: true, // Assume online for demo
    };

    // If address provided, get wallet info
    let walletInfo = null;
    if (address) {
      walletInfo = ContractHelper.getWalletInfo(address);
      if (walletInfo) {
        walletInfo = {
          ...walletInfo,
          address,
          isKnown: true,
          etherscanUrl: ContractHelper.getAddressUrl(address),
        };
      } else {
        walletInfo = {
          address,
          isKnown: false,
          etherscanUrl: ContractHelper.getAddressUrl(address),
        };
      }
    }

    return NextResponse.json(
      createApiResponse({
        network: networkStatus,
        wallet: walletInfo,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error checking Sepolia status:', error);
    return NextResponse.json(
      createApiError('Erro ao verificar status da rede Sepolia'),
      { status: 500 }
    );
  }
}
