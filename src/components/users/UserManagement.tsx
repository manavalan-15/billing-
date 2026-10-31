import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  ShieldAlert,
  History,
  Lock,
  UserCheck,
  X,
  Check,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role, User } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const UserManagement: React.FC = () => {
  const { users, currentUser, switchUser, addUser, auditLogs } = useApp();

  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT_LOGS'>('USERS');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // New User Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [pin, setPin] = useState('1111');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleOpenSwitch = (u: User) => {
    setTargetUser(u);
    setPinInput('');
    setPinError('');
    setIsSwitchUserOpen(true);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    const success = switchUser(targetUser, pinInput);
    if (success) {
      setIsSwitchUserOpen(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect 4-digit authorization PIN.');
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || pin.length !== 4) {
      alert('Please fill all required fields and ensure PIN is exactly 4 digits.');
      return;
    }

    addUser({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      pin,
      email: email.trim(),
      phone: phone.trim(),
      active: true,
    });

    setIsAddUserOpen(false);
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Staff Roles & System Audit Trails</h2>
          <p className="text-xs text-zinc-400">
            Active User: <span className="font-bold text-amber-400">{currentUser.name}</span> ({currentUser.role.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === 'USERS' ? 'bg-amber-400 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Staff Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === 'AUDIT_LOGS' ? 'bg-amber-400 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tamper-Proof Audit Log ({auditLogs.length})
            </button>
          </div>

          {activeTab === 'USERS' && (
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'USERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.map((u) => {
            const isActive = currentUser.id === u.id;
            return (
              <div
                key={u.id}
                className={`bg-zinc-900 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-amber-400/80 shadow-md shadow-amber-400/5'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        u.role === 'admin'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                          : u.role === 'manager'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {u.role}
                    </span>

                    {isActive && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active Session
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-base mt-3">{u.name}</h3>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">@{u.username}</div>

                  <div className="mt-4 space-y-1.5 text-xs text-zinc-400 border-t border-zinc-800 pt-3">
                    <div>Email: <span className="text-zinc-200">{u.email}</span></div>
                    <div>Phone: <span className="text-zinc-200">{u.phone}</span></div>
                    <div>4-Digit PIN: <span className="font-mono text-zinc-400">•••• ({u.pin})</span></div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800">
                  {isActive ? (
                    <div className="w-full py-2 bg-zinc-800/60 text-zinc-400 text-xs text-center rounded-lg font-medium">
                      Current User
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenSwitch(u)}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Switch to this Cashier/User</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* AUDIT LOGS TABLE */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by event action, entity or staff name..."
                className="w-full px-3 py-2 pl-9 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3">User / Cashier</th>
                  <th className="py-2.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono font-bold text-amber-300 border border-zinc-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{log.entity}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">{log.entityId}</td>
                    <td className="py-2.5 px-3 text-zinc-200 font-semibold">{log.userName}</td>
                    <td className="py-2.5 px-4 text-zinc-300 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PIN VERIFICATION MODAL FOR USER SWITCHING */}
      {isSwitchUserOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-xs w-full overflow-hidden text-zinc-100 p-5">
            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-2 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Authorize User Switch</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Enter 4-digit PIN for <span className="text-white font-semibold">{targetUser.name}</span>
              </p>
            </div>

            <form onSubmit={handleConfirmSwitch} className="space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  required
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full py-2 px-3 text-center text-xl font-mono tracking-[0.5em] bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:outline-hidden focus:border-amber-400"
                />
                {pinError && (
                  <p className="text-[11px] text-red-400 text-center mt-1">{pinError}</p>
                )}
                <p className="text-[10px] text-zinc-500 text-center mt-1">
                  Demo PIN for this user is: <strong className="text-zinc-300 font-mono">{targetUser.pin}</strong>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSwitchUserOpen(false)}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create Staff User Profile</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohit Bansal"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="mohit"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white uppercase"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">4-Digit Login PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-center tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mohit@auramenswear.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
