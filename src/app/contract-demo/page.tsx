"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  RefreshCw,
  DollarSign,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const MVP_ADDRESS = process.env.NEXT_PUBLIC_MVP_ADDRESS;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;

export default function ContractDemoPage() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [mintAmount, setMintAmount] = useState("100");
  const [mintResult, setMintResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!address) {
      setError("Por favor, insira um endereço");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/usdc/balance?address=${address}`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.data);
      } else {
        setError(data.error || "Erro ao buscar saldo");
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const mintTokens = async () => {
    if (!address || !mintAmount) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/usdc/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: address,
          amount: mintAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMintResult(data.data);
        setTimeout(checkBalance, 2000);
      } else {
        setError(data.error || "Erro ao mintar tokens");
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const openEtherscan = (hash: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Demonstração de Contratos</h1>
          <p className="text-muted-foreground">
            Interaja com os contratos TrustLend na Sepolia
          </p>
        </div>

        {/* Contract Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informações dos Contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">USDC Mock</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {USDC_ADDRESS}
                </code>
                <a
                  href={`https://sepolia.etherscan.io/address/${USDC_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 text-blue-500 hover:text-blue-600" />
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">TrustLend MVP</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {MVP_ADDRESS}
                </code>
                <a
                  href={`https://sepolia.etherscan.io/address/${MVP_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 text-blue-500 hover:text-blue-600" />
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Chain ID</p>
              <Badge variant="outline">Sepolia ({CHAIN_ID})</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Balance Check */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Verificar Saldo USDC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Endereço da Carteira
              </label>
              <Input
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={checkBalance}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Verificar Saldo
            </Button>

            {balance && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">
                    Saldo Encontrado
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-800">
                  {balance.formatted}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {balance.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mint Tokens */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mintar USDC (Demo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quantidade (USDC)</label>
              <Input
                type="number"
                placeholder="100"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={mintTokens}
              disabled={loading || !address}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Mintar Tokens"
              )}
            </Button>

            {mintResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-700">
                    {mintResult.mock ? "Mock Transaction" : "Transação Enviada"}
                  </span>
                </div>
                <p className="text-sm text-blue-600">
                  {mintResult.amount} USDC mintados para{" "}
                  {mintResult.to.substring(0, 10)}...
                </p>
                {mintResult.hash && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-500 mb-1">
                      Hash da Transação:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white px-2 py-1 rounded flex-1 overflow-hidden">
                        {mintResult.hash}
                      </code>
                      {!mintResult.mock && (
                        <button
                          onClick={() => openEtherscan(mintResult.hash)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Conecte sua carteira MetaMask na rede Sepolia</p>
            <p>2. Copie seu endereço e cole no campo acima</p>
            <p>3. Verifique seu saldo de USDC</p>
            <p>4. Minte tokens de teste se necessário</p>
            <p>5. Use os tokens para testar o sistema de empréstimos</p>
            <p className="text-amber-600 font-medium pt-2">
              ⚠️ Estes são tokens de teste sem valor real
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
