"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  HandHeart,
  Wallet,
  Settings,
  UserPlus,
  Shield,
  Info,
  LogIn,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { SEPOLIA_WALLETS } from "@/lib/sepolia-wallets";
import ContractHelper from "@/lib/sepolia-integration";

const USER_TYPES = [
  {
    key: "TOMADOR",
    title: "Tomador",
    description: "Criar e gerenciar empréstimos",
    icon: User,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    iconColor: "text-blue-600",
  },
  {
    key: "APOIADOR",
    title: "Apoiador",
    description: "Apoiar empréstimos da comunidade",
    icon: HandHeart,
    color: "bg-green-50 border-green-200 text-green-800",
    iconColor: "text-green-600",
  },
  {
    key: "PROVEDOR",
    title: "Provedor de Liquidez",
    description: "Fornecer capital para o pool",
    icon: Wallet,
    color: "bg-purple-50 border-purple-200 text-purple-800",
    iconColor: "text-purple-600",
  },
  {
    key: "OPERADOR",
    title: "Operador",
    description: "Administrar e monitorar sistema",
    icon: Settings,
    color: "bg-orange-50 border-orange-200 text-orange-800",
    iconColor: "text-orange-600",
  },
];

export default function AuthPage() {
  const router = useRouter();
  const { login, createUser } = useUser();
  const [selectedType, setSelectedType] = useState<string>("TOMADOR");
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dados para cadastro
  const [registerData, setRegisterData] = useState({
    nome: "",
    cpf: "",
    endereco: "",
    carteira: "",
    tipo: "TOMADOR" as "TOMADOR" | "APOIADOR" | "OPERADOR" | "PROVEDOR",
  });

  const handleLogin = async () => {
    if (!wallet.trim()) {
      setError("Por favor, insira o endereço da carteira");
      return;
    }

    setError(null);
    setSuccess(null);

    const success = await login(wallet.trim(), selectedType);

    if (success) {
      setSuccess("Login realizado com sucesso!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setError(
        "Usuário não encontrado. Verifique a carteira ou cadastre-se primeiro."
      );
    }
  };

  const handleRegister = async () => {
    if (!registerData.nome.trim() || !registerData.carteira.trim()) {
      setError("Nome e carteira são obrigatórios");
      return;
    }

    setError(null);
    setSuccess(null);

    const success = await createUser(registerData);

    if (success) {
      setSuccess("Cadastro realizado com sucesso!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setError("Erro no cadastro. Verifique se a carteira já não está em uso.");
    }
  };

  const generateMockWallet = () => {
    const mockWallet = "0x" + Math.random().toString(16).substr(2, 40);
    setWallet(mockWallet);
    setRegisterData({ ...registerData, carteira: mockWallet });
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/LogoTrustLendWithoutBackground.png"
                alt="TrustLend Logo"
                width={200}
                height={80}
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Acesso ao TrustLend
            </h1>
            <p className="text-muted-foreground">
              Entre com sua carteira ou cadastre-se para começar
            </p>
          </div>

          {/* Demo Info */}
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-amber-800">
                  Modo Demonstração
                </span>
              </div>
              <p className="text-sm text-amber-700 mb-2">
                Este é um ambiente de demonstração. As carteiras são fictícias e
                funcionam apenas para simular o sistema.
              </p>
              <Button
                onClick={generateMockWallet}
                variant="outline"
                size="sm"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                Gerar Carteira Fictícia
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastro
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Entrar com Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Wallet Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Endereço da Carteira
                    </label>
                    <Input
                      placeholder="0x..."
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Insira o endereço da sua carteira fictícia
                    </p>
                  </div>

                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Tipo de Usuário
                    </label>
                    <div className="grid gap-3">
                      {USER_TYPES.map((type) => (
                        <div
                          key={type.key}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedType === type.key
                              ? type.color
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedType(type.key)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${type.iconColor
                                .replace("text-", "bg-")
                                .replace("-600", "-100")}`}
                            >
                              <type.icon
                                className={`h-6 w-6 ${type.iconColor}`}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">{type.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleLogin}
                    disabled={loading || !wallet.trim()}
                    className="w-full"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Cadastro de Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Nome Completo *
                      </label>
                      <Input
                        placeholder="João da Silva"
                        value={registerData.nome}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            nome: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">CPF</label>
                      <Input
                        placeholder="000.000.000-00"
                        value={registerData.cpf}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            cpf: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endereço</label>
                    <Input
                      placeholder="Rua das Flores, 123 - São Paulo, SP"
                      value={registerData.endereco}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          endereco: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Carteira *</label>
                    <Input
                      placeholder="0x..."
                      value={registerData.carteira}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          carteira: e.target.value,
                        })
                      }
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* User Type Selection for Register */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Tipo de Usuário
                    </label>
                    <div className="grid gap-2">
                      {USER_TYPES.map((type) => (
                        <Badge
                          key={type.key}
                          variant={
                            registerData.tipo === type.key
                              ? "default"
                              : "outline"
                          }
                          className={`p-2 cursor-pointer justify-start ${
                            registerData.tipo === type.key ? type.color : ""
                          }`}
                          onClick={() =>
                            setRegisterData({
                              ...registerData,
                              tipo: type.key as
                                | "TOMADOR"
                                | "APOIADOR"
                                | "OPERADOR"
                                | "PROVEDOR",
                            })
                          }
                        >
                          <type.icon
                            className={`h-4 w-4 mr-2 ${type.iconColor}`}
                          />
                          {type.title}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleRegister}
                    disabled={
                      loading ||
                      !registerData.nome.trim() ||
                      !registerData.carteira.trim()
                    }
                    className="w-full"
                  >
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error/Success Messages */}
          {error && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-sm">{success}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sepolia Test Wallets */}
          <Card className="mt-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Wallet className="h-5 w-5" />
                Carteiras Sepolia para Teste
              </CardTitle>
              <p className="text-sm text-purple-700">
                Use estas carteiras para testar com contratos reais na rede
                Sepolia
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        Provedor Alpha
                      </p>
                      <p className="text-xs font-mono text-purple-600">
                        {SEPOLIA_WALLETS.LENDER1}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800"
                    >
                      PROVEDOR
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        Provedor Beta
                      </p>
                      <p className="text-xs font-mono text-purple-600">
                        {SEPOLIA_WALLETS.LENDER2}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800"
                    >
                      PROVEDOR
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        Tomador Principal
                      </p>
                      <p className="text-xs font-mono text-purple-600">
                        {SEPOLIA_WALLETS.TOMADOR1}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800"
                    >
                      TOMADOR
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        Apoiador Gamma
                      </p>
                      <p className="text-xs font-mono text-purple-600">
                        {SEPOLIA_WALLETS.BACKER1}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      APOIADOR
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">
                        Apoiador Delta
                      </p>
                      <p className="text-xs font-mono text-purple-600">
                        {SEPOLIA_WALLETS.BACKER2}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      APOIADOR
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium">Contratos Sepolia:</p>
                    <p className="text-xs font-mono mt-1">
                      TrustLend MVP: {ContractHelper.getTrustLendAddress()}
                    </p>
                    <p className="text-xs font-mono">
                      Mock USDC: {ContractHelper.getUSDCAddress()}
                    </p>
                    <p className="text-xs mt-2">
                      <a
                        href={ContractHelper.getAddressUrl(
                          ContractHelper.getTrustLendAddress()
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 underline"
                      >
                        Ver no Etherscan →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  );
}
