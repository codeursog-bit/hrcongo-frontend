// ============================================================================
// Fichier: frontend/components/admin/monitoring/MonitoringTables.tsx
// ============================================================================

import React from 'react';
import { Search, AlertCircle, Play, RefreshCw, Eye } from 'lucide-react';

// --- API Requests Table ---
interface ApiRequest {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  user: string;
  status: number;
  duration: number;
}

interface ApiRequestTableProps {
  requests?: ApiRequest[];
}

export const ApiRequestTable: React.FC<ApiRequestTableProps> = ({ requests = [] }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Duration</th>
                    <th className="p-3 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {requests.length > 0 ? (
                  requests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-800/30 font-mono text-xs">
                        <td className="p-3 text-gray-400">{req.timestamp}</td>
                        <td className="p-3 font-bold text-white">{req.method}</td>
                        <td className="p-3 text-sky-400">{req.endpoint}</td>
                        <td className="p-3 text-gray-400">{req.user}</td>
                        <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded ${
                                req.status >= 500 ? 'bg-red-900/50 text-red-400' :
                                req.status >= 400 ? 'bg-orange-900/50 text-orange-400' :
                                'bg-green-900/50 text-green-400'
                            }`}>{req.status}</span>
                        </td>
                        <td className={`p-3 text-right ${req.duration > 300 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{req.duration}ms</td>
                        <td className="p-3 text-center">
                            <button className="text-gray-500 hover:text-white"><Search className="w-3 h-3"/></button>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Aucune requête API pour le moment
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- DB Queries Table ---
interface DbQuery {
  id: string;
  timestamp: string;
  query: string;
  table: string;
  rows: number;
  duration: number;
}

interface DbQueryTableProps {
  queries?: DbQuery[];
}

export const DbQueryTable: React.FC<DbQueryTableProps> = ({ queries = [] }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Query</th>
                    <th className="p-3">Table</th>
                    <th className="p-3">Rows</th>
                    <th className="p-3 text-right">Duration</th>
                    <th className="p-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {queries.length > 0 ? (
                  queries.map(q => (
                    <tr key={q.id} className="hover:bg-gray-800/30 font-mono text-xs">
                        <td className="p-3 text-gray-400">{q.timestamp}</td>
                        <td className="p-3 text-white truncate max-w-md" title={q.query}>{q.query}</td>
                        <td className="p-3 text-purple-400">{q.table}</td>
                        <td className="p-3 text-gray-400">{q.rows}</td>
                        <td className={`p-3 text-right ${q.duration > 100 ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>{q.duration}ms</td>
                        <td className="p-3 text-center">
                            <button className="text-xs bg-gray-800 border border-gray-700 px-2 py-1 rounded hover:text-white text-gray-400">EXPLAIN</button>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucune requête DB pour le moment
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- Errors Table ---
interface ErrorGroup {
  id: string;
  message: string;
  count: number;
  trend: number;
  affectedUsers: number;
  lastSeen: string;
  status: string;
}

interface ErrorsTableProps {
  errors?: ErrorGroup[];
}

export const ErrorsTable: React.FC<ErrorsTableProps> = ({ errors = [] }) => (
    <div className="grid grid-cols-1 gap-4">
        {errors.length > 0 ? (
          errors.map(err => (
            <div key={err.id} className="bg-gray-900 border border-red-900/30 rounded-xl p-4 hover:border-red-500/50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-red-400 font-bold font-mono text-sm">{err.message}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        err.status === 'Open' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>{err.status}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-gray-400">
                    <div><span className="text-white font-bold">{err.count}</span> occurrences</div>
                    <div className={`${err.trend > 0 ? 'text-red-400' : 'text-green-400'}`}>{err.trend > 0 ? '↑' : '↓'} {Math.abs(err.trend)}% trend</div>
                    <div><span className="text-white font-bold">{err.affectedUsers}</span> users affected</div>
                    <div>Last seen: {err.lastSeen}</div>
                </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            Aucune erreur détectée
          </div>
        )}
    </div>
);

// --- Security Table ---
interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  ip: string;
  location: string;
  risk: string;
}

interface SecurityTableProps {
  events?: SecurityEvent[];
}

export const SecurityTable: React.FC<SecurityTableProps> = ({ events = [] }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">User</th>
                    <th className="p-3">IP / Location</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {events.length > 0 ? (
                  events.map(evt => (
                    <tr key={evt.id} className="hover:bg-gray-800/30 text-xs">
                        <td className="p-3 text-gray-400 font-mono">{evt.timestamp}</td>
                        <td className="p-3 text-white font-bold">{evt.type}</td>
                        <td className="p-3 text-gray-300">{evt.user}</td>
                        <td className="p-3 text-gray-400 font-mono">{evt.ip} <span className="text-gray-500 text-[10px]">({evt.location})</span></td>
                        <td className="p-3">
                             <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                                evt.risk === 'High' ? 'bg-red-900/50 text-red-400' :
                                evt.risk === 'Medium' ? 'bg-orange-900/50 text-orange-400' :
                                'bg-green-900/50 text-green-400'
                            }`}>{evt.risk}</span>
                        </td>
                        <td className="p-3 text-right">
                             {evt.risk === 'High' && <button className="text-xs text-red-400 hover:text-white border border-red-900 bg-red-900/20 px-2 py-1 rounded">Block IP</button>}
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucun événement de sécurité
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- Webhooks Table ---
interface Webhook {
  id: string;
  timestamp: string;
  endpoint: string;
  event: string;
  status: number;
  attempts: number;
}

interface WebhooksTableProps {
  webhooks?: Webhook[];
}

export const WebhooksTable: React.FC<WebhooksTableProps> = ({ webhooks = [] }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Attempts</th>
                    <th className="p-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {webhooks.length > 0 ? (
                  webhooks.map(wh => (
                    <tr key={wh.id} className="hover:bg-gray-800/30 text-xs">
                         <td className="p-3 text-gray-400 font-mono">{wh.timestamp}</td>
                         <td className="p-3 text-white truncate max-w-xs">{wh.endpoint}</td>
                         <td className="p-3 text-purple-400 font-mono">{wh.event}</td>
                         <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${wh.status === 200 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                                {wh.status}
                            </span>
                         </td>
                         <td className="p-3 text-gray-400">{wh.attempts}</td>
                         <td className="p-3 text-right">
                             {wh.status !== 200 && <button className="flex items-center gap-1 ml-auto text-xs text-gray-400 hover:text-white"><RefreshCw className="w-3 h-3"/> Retry</button>}
                         </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucun webhook configuré
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- Cron Jobs Table ---
interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: string;
}

interface CronJobsTableProps {
  jobs?: CronJob[];
}

export const CronJobsTable: React.FC<CronJobsTableProps> = ({ jobs = [] }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="p-3">Job Name</th>
                    <th className="p-3">Schedule</th>
                    <th className="p-3">Last Run</th>
                    <th className="p-3">Next Run</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {jobs.length > 0 ? (
                  jobs.map(job => (
                     <tr key={job.id} className="hover:bg-gray-800/30 text-xs">
                        <td className="p-3 text-white font-bold">{job.name}</td>
                        <td className="p-3 text-gray-400 font-mono">{job.schedule}</td>
                        <td className="p-3 text-gray-300">{job.lastRun}</td>
                        <td className="p-3 text-gray-400">{job.nextRun}</td>
                        <td className="p-3">
                             <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                                job.status === 'Success' ? 'bg-green-900/20 text-green-400' :
                                job.status === 'Failed' ? 'bg-red-900/20 text-red-400' :
                                'bg-gray-800 text-gray-400'
                             }`}>{job.status}</span>
                        </td>
                        <td className="p-3 text-right">
                            <button className="flex items-center gap-1 ml-auto text-xs text-brand-red border border-brand-red/50 px-2 py-1 rounded hover:bg-brand-red hover:text-white transition-colors">
                                <Play className="w-3 h-3" /> Run Now
                            </button>
                        </td>
                     </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Aucun cron job configuré
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
    </div>
);