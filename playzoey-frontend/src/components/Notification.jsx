import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Notification = ({ type, message, onClose }) => (
  <div
    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm ${
      type === "success"
        ? "bg-green-500/90 text-white"
        : "bg-red-500/90 text-white"
    }`}
  >
    {type === "success" ? (
      <CheckCircle size={20} />
    ) : (
      <AlertCircle size={20} />
    )}
    <span className="flex-1">{message}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      ×
    </button>
  </div>
);

export default Notification;