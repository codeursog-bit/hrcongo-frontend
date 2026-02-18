// ============================================================================
// Fichier: frontend/components/admin/monitoring/LogStream.tsx
// ============================================================================

import React from 'react';
import { Filter, Search, PauseCircle, Download, AlertTriangle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  user?: string;
  duration?: number;
}

interface LogStreamProps {
  logs?: LogEntry[];
}

export const LogStream: React.FC<LogStreamProps> = ({ logs = [] }) => {
  return (
    <div className="flex flex-col h-[600px] bg-[#0d1117] border border-gray-800 rounded-xl overflow-hidden font-mono text-sm shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded text-gray-300 border border-gray-700">
                <Search className="w-3.5 h-3.5" />
                <input type="text" placeholder="Search logs..." className="bg-transparent border-none outline-none text-xs w-48 text-white placeholder-gray-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs border border-gray-700 transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
            </button>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 animate-pulse mr-2">● Live Tail</span>
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Pause">
                <PauseCircle className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Download">
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#0d1117] custom-scrollbar">
        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 hover:bg-gray-800/30 p-1 rounded group cursor-pointer transition-colors">
                <span className="text-gray-500 shrink-0 w-24 text-xs select-none">{log.timestamp}</span>
                <span className={`text-xs font-bold w-12 shrink-0 ${
                    log.level === 'INFO' ? 'text-green-400' :
                    log.level === 'WARN' ? 'text-yellow-400' :
                    log.level === 'ERROR' ? 'text-red-500' :
                    log.level === 'DEBUG' ? 'text-blue-400' : 'text-purple-500 bg-purple-900/20 px-1 rounded'
                }`}>
                    {log.level}
                </span>
                <span className="text-gray-400 w-16 shrink-0 text-xs">[{log.service}]</span>
                <span className="text-gray-300 break-all">{log.message}</span>
                
                {/* Meta info shown on hover or if error */}
                {(log.level === 'ERROR' || log.level === 'FATAL') && (
                    <span className="ml-auto text-red-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Check Stack Trace
                    </span>
                )}
                {log.duration && log.duration > 200 && (
                    <span className="ml-auto text-orange-400 text-xs">{log.duration}ms</span>
                )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucun log disponible pour le moment
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-t border-gray-800 bg-[#161b22] text-[10px] text-gray-500 flex justify-between">
         <span>Showing {logs.length} events</span>
         <span>Connected to logs stream</span>
      </div>
    </div>
  );
};