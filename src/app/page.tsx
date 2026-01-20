'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [anio, setAnio] = useState('2026');
  const [noPartida, setNoPartida] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generar-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anio, noPartida }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Presupuesto_${anio}_Partida_${noPartida}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a6b75] via-[#3d8a95] to-[#5ccedf]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.jpg"
                alt="Logo AMDC"
                width={80}
                height={80}
                className="rounded-full bg-white p-1"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Alcaldía Municipal del Distrito Central
            </h1>
            <h2 className="text-xl text-cyan-200">
              Sistema de Impresión de Partidas Presupuestarias
            </h2>
          </div>

          {/* Formulario */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Generar PDF de Partida
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    No. de Partida
                  </label>
                  <input
                    type="number"
                    value={noPartida}
                    onChange={(e) => setNoPartida(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    placeholder="1"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#5ccedf] to-[#3d8a95] text-white font-semibold rounded-lg shadow-lg hover:from-[#4dbdce] hover:to-[#2d7a85] focus:outline-none focus:ring-2 focus:ring-[#5ccedf] focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando PDF...
                  </span>
                ) : (
                  '📄 Generar e Imprimir PDF'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-cyan-200/60 text-sm">
            Sistema de Presupuesto AMDC © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
