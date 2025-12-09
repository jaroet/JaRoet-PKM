import React from 'react';
import { Note } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importData: Note[];
  onConfirm: (mode: 'overwrite' | 'merge') => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, importData, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md flex flex-col gap-4">
        
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold">Import Notes</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Ready to import <b>{importData.length}</b> notes.
                </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-foreground">✕</button>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">Merge into Current Vault</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Adds imported notes to your existing database. 
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc list-inside mb-3 space-y-1">
                <li>Existing notes are preserved.</li>
                <li>Imported notes get unique IDs.</li>
                <li>Duplicate titles are renamed (e.g. "Note (1)").</li>
                <li>Renamed notes are linked to a new <span className="font-mono">import_YYYY-MM...</span> parent.</li>
            </ul>
            <button 
                onClick={() => onConfirm('merge')}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
                Merge Notes
            </button>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
            <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">Overwrite Current Vault</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <b>Warning:</b> This will delete all existing notes and replace them with the imported data.
            </p>
            <button 
                onClick={() => onConfirm('overwrite')}
                className="w-full py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded font-medium transition-colors"
            >
                Overwrite (Clear & Import)
            </button>
        </div>

        <div className="text-center">
            <button 
                onClick={onClose} 
                className="text-sm text-gray-500 hover:text-foreground underline"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;