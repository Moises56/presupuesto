'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Usuario {
  Id: number;
  Username: string;
  Email: string;
  Nombre: string;
  Apellido: string;
  NumEmpleado: string;
  Gerencia: string;
  Rol: string;
  Activo: boolean;
  FechaCreacion: string;
  UltimoAcceso: string | null;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'admin';
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    numEmpleado: '',
    gerencia: '',
    rol: 'user',
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      numEmpleado: '',
      gerencia: '',
      rol: 'user',
      activo: true,
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      username: user.Username,
      email: user.Email,
      password: '',
      nombre: user.Nombre,
      apellido: user.Apellido,
      numEmpleado: user.NumEmpleado,
      gerencia: user.Gerencia,
      rol: user.Rol,
      activo: user.Activo,
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? { id: editingUser.Id, ...formData }
        : formData;

      const res = await fetch('/api/admin/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowModal(false);
      fetchUsuarios();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (!confirm(`¿Está seguro de eliminar al usuario ${user.Username}?`)) return;

    try {
      const res = await fetch(`/api/admin/usuarios?id=${user.Id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchUsuarios();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-[#DB473C]/20 text-[#DB473C]';
      case 'supervisor': return 'bg-[#F0C752]/20 text-[#F0C752]';
      default: return 'bg-[#5CCEDF]/20 text-[#5CCEDF]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#575757]">Gestión de Usuarios</h1>
              <p className="text-[#808080] mt-1">
                {isAdmin ? 'Administrar usuarios del sistema' : 'Lista de usuarios'}
              </p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5CCEDF] hover:bg-[#4ab8c9] text-white rounded-lg transition-all shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Usuario
                </button>
              )}
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
          </div>

          {error && (
            <div className="mb-4 bg-[#DB473C]/10 border border-[#DB473C] text-[#DB473C] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-2xl border border-[#DDDDDD] overflow-hidden shadow-lg">
            {loading ? (
              <div className="p-8 text-center text-[#808080]">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#5CCEDF]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Gerencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDDDDD]">
                    {usuarios.map((user) => (
                      <tr key={user.Id} className="hover:bg-[#F5F5F5]">
                        <td className="px-4 py-3 text-[#575757] font-medium">{user.Username}</td>
                        <td className="px-4 py-3 text-[#575757]">{user.Nombre} {user.Apellido}</td>
                        <td className="px-4 py-3 text-[#7c858c]">{user.Email}</td>
                        <td className="px-4 py-3 text-[#7c858c]">{user.Gerencia}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolBadgeColor(user.Rol)}`}>
                            {user.Rol}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.Activo ? 'bg-green-100 text-green-600' : 'bg-[#DDDDDD] text-[#808080]'}`}>
                            {user.Activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-[#5CCEDF] hover:text-[#4ab8c9] mr-3"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="text-[#DB473C] hover:text-[#c13d33]"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold text-[#575757] mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7c858c] mb-1">
                  Contraseña {editingUser && '(dejar vacío para no cambiar)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#575757] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1"># Empleado</label>
                  <input
                    type="text"
                    value={formData.numEmpleado}
                    onChange={(e) => setFormData({ ...formData, numEmpleado: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Gerencia</label>
                  <input
                    type="text"
                    value={formData.gerencia}
                    onChange={(e) => setFormData({ ...formData, gerencia: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#7c858c] mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                  >
                    <option value="user">Usuario</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-[#7c858c] mb-1">Estado</label>
                    <select
                      value={formData.activo ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-white border border-[#DDDDDD] rounded-lg text-[#575757] focus:outline-none focus:ring-2 focus:ring-[#5CCEDF] focus:border-transparent"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-[#DB473C]/10 border border-[#DB473C] text-[#DB473C] px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#DDDDDD] hover:bg-[#c4c4c4] text-[#575757] rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#5CCEDF] hover:bg-[#4ab8c9] text-white rounded-lg disabled:opacity-50 transition-all"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
