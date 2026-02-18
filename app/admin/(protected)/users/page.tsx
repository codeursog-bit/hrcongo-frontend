'use client';
import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Mail, MoreVertical, 
  Search, Filter, CheckCircle, XCircle, Clock, Key
} from 'lucide-react';

const ADMINS = [
  { id: '1', name: 'Alexandre Mbemba', email: 'alex@hrcongo.com', role: 'Root Admin', status: 'Active', lastActive: '2 mins ago', level: '99' },
  { id: '2', name: 'Sarah Koné', email: 's.kone@hrcongo.com', role: 'Security Admin', status: 'Active', lastActive: '1 hour ago', lastIp: '197.234.12.1', level: '80' },
  { id: '3', name: 'Jean-Luc Batou', email: 'jl.batou@hrcongo.com', role: 'Billing Admin', status: 'Inactive', lastActive: '2 days ago', level: '70' },
];

export default function UsersPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-red" /> Platform Administrators
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage high-privilege accounts and platform permissions</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-white hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-xl transition-all hover:-translate-y-0.5"
        >
          <UserPlus className="w-5 h-5" />
          Invite Super Admin
        </button>
      </div>

      {/* Admin List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
           <div className="flex gap-4">
              <span className="text-sm font-bold text-white">All Admins ({ADMINS.length})</span>
              <span className="text-sm text-gray-500">Active Sessions: 2</span>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search admins..." className="bg-gray-800 border border-gray-700 text-xs rounded-lg pl-10 pr-4 py-2 text-white outline-none w-64" />
           </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4">Administrator</th>
              <th className="p-4">Role & Privilege</th>
              <th className="p-4">Security Status</th>
              <th className="p-4">Activity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {ADMINS.map(admin => (
              <tr key={admin.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-white font-bold">
                      {admin.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{admin.name}</div>
                      <div className="text-xs text-gray-500">{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                     <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border w-fit ${
                        admin.role.includes('Root') ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                        admin.role.includes('Security') ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                        'bg-brand-gold/20 text-brand-gold border-brand-gold/50'
                     }`}>
                        {admin.role}
                     </span>
                     <div className="flex items-center gap-1 mt-1">
                        <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red" style={{ width: `${admin.level}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">Lvl {admin.level}</span>
                     </div>
                  </div>
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${admin.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
                      <span className={`text-xs ${admin.status === 'Active' ? 'text-green-400' : 'text-gray-500'}`}>{admin.status}</span>
                      {admin.lastIp && <span className="text-[10px] text-gray-600 font-mono ml-2">{admin.lastIp}</span>}
                   </div>
                </td>
                <td className="p-4">
                   <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {admin.lastActive}
                   </div>
                </td>
                <td className="p-4 text-right">
                   <button className="text-gray-500 hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up">
              <div className="p-8 border-b border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950">
                 <div className="flex justify-between items-start">
                    <div>
                       <h2 className="text-2xl font-bold text-white tracking-tight">Invite Administrator</h2>
                       <p className="text-gray-500 text-sm mt-1">Grant high-level system access via secure email</p>
                    </div>
                    <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white"><XCircle className="w-6 h-6"/></button>
                 </div>
              </div>
              
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative group">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-red transition-colors" />
                       <input type="email" placeholder="new.admin@hrcongo.com" className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-700 focus:border-brand-red outline-none transition-all" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Administrative Role</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button className="p-3 bg-gray-950 border border-brand-red/50 text-white rounded-xl text-left hover:bg-gray-800 transition-colors">
                          <div className="font-bold text-sm">Security Admin</div>
                          <div className="text-[10px] text-gray-500 mt-1 leading-tight">Can manage audits, IPs & platform security policies.</div>
                       </button>
                       <button className="p-3 bg-gray-950 border border-gray-800 text-gray-400 rounded-xl text-left hover:border-gray-500 transition-colors">
                          <div className="font-bold text-sm">Billing Admin</div>
                          <div className="text-[10px] text-gray-500 mt-1 leading-tight">Manage payments, invoices and plan configurations.</div>
                       </button>
                    </div>
                 </div>

                 <div className="bg-brand-gold/5 border border-brand-gold/20 p-4 rounded-xl flex items-start gap-3">
                    <Key className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                       <h4 className="text-xs font-bold text-brand-gold uppercase">Security Protocol</h4>
                       <p className="text-[10px] text-brand-gold/70 mt-1 leading-relaxed">Invitations expire in 24 hours. Recipient must pass multi-factor authentication and provide the Organization Secret Key to activate their account.</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-950 flex justify-end gap-4">
                 <button onClick={() => setShowInviteModal(false)} className="text-gray-500 text-sm font-bold hover:text-white transition-colors">Discard</button>
                 <button className="bg-brand-red hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all">Send Invitation</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
