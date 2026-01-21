'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'admin';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#575757]">Panel de Administración</h1>
              <p className="text-[#808080] mt-1">Gestión del sistema</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-[#7c858c] hover:bg-[#575757] text-white rounded-lg transition-all shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Usuarios */}
            <Link href="/admin/usuarios">
              <div className="bg-white rounded-2xl p-6 border border-[#DDDDDD] hover:shadow-lg hover:border-[#5CCEDF] transition-all cursor-pointer shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#5CCEDF]/20 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#5CCEDF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#575757]">Usuarios</h2>
                    <p className="text-[#808080] text-sm">
                      {isAdmin ? 'Gestionar usuarios del sistema' : 'Ver usuarios del sistema'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[#5CCEDF] text-sm">
                  <span>{isAdmin ? 'Crear, editar y eliminar' : 'Solo lectura'}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Bitácora - Solo Admin */}
            {isAdmin && (
              <Link href="/admin/bitacora">
                <div className="bg-white rounded-2xl p-6 border border-[#DDDDDD] hover:shadow-lg hover:border-[#F0C752] transition-all cursor-pointer shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#F0C752]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#F0C752]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[#575757]">Bitácora</h2>
                      <p className="text-[#808080] text-sm">Registro de actividades</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-[#F0C752] text-sm">
                    <span>Ver historial de acciones</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Info del usuario */}
          <div className="mt-8 bg-white rounded-xl p-4 border border-[#DDDDDD] shadow-sm">
            <p className="text-[#808080] text-sm">
              Conectado como: <span className="text-[#575757] font-medium">{session?.user?.name}</span>
              {' · '}
              Rol: <span className="text-[#5CCEDF] font-medium capitalize">{session?.user?.rol}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
