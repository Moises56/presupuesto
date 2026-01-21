'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BitacoraEntry {
  Id: number;
  UsuarioId: number;
  Username: string;
  Accion: string;
  Detalle: string | null;
  IpAddress: string | null;
  FechaHora: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BitacoraPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.rol !== 'admin') {
      router.push('/admin');
      return;
    }
    fetchBitacora(1);
  }, [session, status, router]);

  const fetchBitacora = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bitacora?page=${page}&limit=50`);
      if (!res.ok) throw new Error('Error al cargar bitácora');
      const data = await res.json();
      setEntries(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'LOGIN': return 'bg-green-100 text-green-600';
      case 'LOGOUT': return 'bg-[#DDDDDD] text-[#808080]';
      case 'BUSCAR_PARTIDA': return 'bg-[#5CCEDF]/20 text-[#5CCEDF]';
      case 'GENERAR_PDF': return 'bg-[#5CCEDF]/30 text-[#4ab8c9]';
      case 'CREAR_USUARIO': return 'bg-purple-100 text-purple-600';
      case 'EDITAR_USUARIO': return 'bg-[#F0C752]/20 text-[#d4a83d]';
      case 'ELIMINAR_USUARIO': return 'bg-[#DB473C]/20 text-[#DB473C]';
      default: return 'bg-[#DDDDDD] text-[#575757]';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (session?.user?.rol !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#575757]">Bitácora del Sistema</h1>
              <p className="text-[#808080] mt-1">Registro de todas las actividades</p>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-[#7c858c] hover:bg-[#575757] text-white rounded-lg transition-all shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>

          {error && (
            <div className="mb-4 bg-[#DB473C]/10 border border-[#DB473C] text-[#DB473C] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden shadow-lg">
            {loading ? (
              <div className="p-8 text-center text-[#808080]">Cargando...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#5CCEDF]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Fecha/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Acción</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Detalle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDDDDD]">
                      {entries.map((entry) => (
                        <tr key={entry.Id} className="hover:bg-[#F5F5F5]">
                          <td className="px-4 py-3 text-[#575757] text-sm whitespace-nowrap">
                            {formatDate(entry.FechaHora)}
                          </td>
                          <td className="px-4 py-3 text-[#5CCEDF] font-medium">{entry.Username}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccionColor(entry.Accion)}`}>
                              {entry.Accion}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#575757] text-sm max-w-xs truncate">
                            {entry.Detalle || '-'}
                          </td>
                          <td className="px-4 py-3 text-[#7c858c] text-sm">{entry.IpAddress || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="px-4 py-3 bg-[#F5F5F5] flex items-center justify-between border-t border-[#DDDDDD]">
                  <p className="text-[#808080] text-sm">
                    Mostrando {entries.length} de {pagination.total} registros
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchBitacora(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 bg-[#DDDDDD] hover:bg-[#c4c4c4] text-[#575757] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-[#575757]">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchBitacora(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 bg-[#DDDDDD] hover:bg-[#c4c4c4] text-[#575757] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
