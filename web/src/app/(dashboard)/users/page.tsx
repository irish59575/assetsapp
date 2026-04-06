"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useClients } from "@/hooks/useClients";
import type { User } from "@/types";

interface UserWithAccess extends User {
  client_ids: number[];
}

function useAdminUsers() {
  return useQuery<UserWithAccess[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => (await api.get("/admin/users")).data,
  });
}

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: clients = [] } = useClients();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithAccess | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const handleDelete = (u: UserWithAccess) => {
    if (!confirm(`Delete user ${u.full_name}? This cannot be undone.`)) return;
    deleteMutation.mutate(u.id);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage user accounts and client access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {users.map((u) => {
            const assignedClients = clients.filter(c => u.client_ids.includes(c.id));
            return (
              <div key={u.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{u.full_name}</p>
                      {u.is_superuser && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Admin</span>
                      )}
                      {!u.is_active && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    {!u.is_superuser && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {assignedClients.length === 0
                          ? "No client access"
                          : assignedClients.map(c => c.name).join(", ")}
                      </p>
                    )}
                    {u.is_superuser && (
                      <p className="text-xs text-gray-400 mt-0.5">Access to all clients</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["adminUsers"] }); setShowCreateModal(false); }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          clients={clients}
          onClose={() => setEditingUser(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["adminUsers"] }); setEditingUser(null); }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ clients, onClose, onCreated }: {
  clients: { id: number; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/admin/users", data),
  });
  const accessMutation = useMutation({
    mutationFn: ({ id, client_ids }: { id: number; client_ids: number[] }) =>
      api.put(`/admin/users/${id}/client-access`, { client_ids }),
  });

  const handleSubmit = async () => {
    if (!email.trim() || !fullName.trim() || !password.trim()) { setError("All fields are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    try {
      const res = await createMutation.mutateAsync({ email, full_name: fullName, password, is_superuser: isAdmin });
      if (!isAdmin && selectedClients.length > 0) {
        await accessMutation.mutateAsync({ id: res.data.id, client_ids: selectedClients });
      }
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    }
  };

  const toggleClient = (id: number) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add User</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Admin (access to all clients)</span>
          </label>
          {!isAdmin && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Client Access</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {clients.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="rounded" />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{selectedClients.length} client{selectedClients.length !== 1 ? "s" : ""} selected</p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {createMutation.isPending ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, clients, onClose, onSaved }: {
  user: UserWithAccess;
  clients: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(user.full_name);
  const [isAdmin, setIsAdmin] = useState(user.is_superuser);
  const [isActive, setIsActive] = useState(user.is_active);
  const [newPassword, setNewPassword] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>(user.client_ids);
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/users/${user.id}`, data),
  });
  const accessMutation = useMutation({
    mutationFn: (client_ids: number[]) => api.put(`/admin/users/${user.id}/client-access`, { client_ids }),
  });

  const handleSave = async () => {
    setError("");
    try {
      const body: any = { full_name: fullName, is_superuser: isAdmin, is_active: isActive };
      if (newPassword) {
        if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
        body.password = newPassword;
      }
      await updateMutation.mutateAsync(body);
      await accessMutation.mutateAsync(isAdmin ? [] : selectedClients);
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    }
  };

  const toggleClient = (id: number) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Edit User</h2>
        <p className="text-sm text-gray-500 mb-4">{user.email}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Admin (access to all clients)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          {!isAdmin && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Client Access</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {clients.map(c => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="rounded" />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{selectedClients.length} client{selectedClients.length !== 1 ? "s" : ""} selected</p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
