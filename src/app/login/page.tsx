"use client";

import { useState } from "react";
import { toast } from "sonner";

type Step = "email" | "code" | "setup";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [useCode, setUseCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setIsFirstLogin(data.firstLogin ?? false);
      setStep("code");
      toast.success("Kod wysłany na " + email);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nieprawidłowy kod");
      if (data.needsSetup) {
        setStep("setup");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!useCode && password !== confirm) {
      toast.error("Hasła nie są zgodne");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, useCode, password: useCode ? undefined : password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nieprawidłowe dane logowania");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Telemedi Rozliczenia</h1>
          <p className="text-gray-500 mt-1">Aplikacja rozliczeniowa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === "email" && (
            <>
              <h2 className="text-lg font-semibold mb-6">Zaloguj się</h2>
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="twoj@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Wysyłanie..." : "Zaloguj się"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setStep("email"); }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Masz hasło? →
                </button>
              </div>
              {/* Password form inline */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-3 text-center">lub zaloguj się hasłem</p>
                <form onSubmit={handlePasswordLogin} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasło"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "..." : "Zaloguj hasłem"}
                  </button>
                </form>
              </div>
            </>
          )}

          {step === "code" && (
            <>
              <h2 className="text-lg font-semibold mb-2">Wpisz kod</h2>
              <p className="text-sm text-gray-500 mb-6">
                Wysłaliśmy 6-cyfrowy kod na <strong>{email}</strong>. Kod ważny 15 minut.
              </p>
              <form onSubmit={handleCode} className="space-y-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="------"
                />
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Weryfikacja..." : "Potwierdź"}
                </button>
              </form>
              <button
                onClick={() => setStep("email")}
                className="mt-4 text-sm text-gray-500 hover:underline w-full text-center"
              >
                ← Wróć
              </button>
            </>
          )}

          {step === "setup" && (
            <>
              <h2 className="text-lg font-semibold mb-2">Pierwsze logowanie</h2>
              <p className="text-sm text-gray-500 mb-6">Wybierz sposób logowania na przyszłość.</p>
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="loginMode"
                      checked={!useCode}
                      onChange={() => setUseCode(false)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">Ustanów hasło</p>
                      <p className="text-xs text-gray-500">Szybkie logowanie w przyszłości</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="loginMode"
                      checked={useCode}
                      onChange={() => setUseCode(true)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">Kod emailowy za każdym razem</p>
                      <p className="text-xs text-gray-500">Bez zapamiętywania hasła</p>
                    </div>
                  </label>
                </div>
                {!useCode && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!useCode}
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nowe hasło (min. 8 znaków)"
                    />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required={!useCode}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Powtórz hasło"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || (!useCode && (password.length < 8 || password !== confirm))}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "..." : "Przechodzę do serwisu"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
