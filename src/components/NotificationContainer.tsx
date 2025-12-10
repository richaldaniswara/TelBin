import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface Props {
  notifications: NotificationItem[];
  onRemove: (id: number) => void;
}

export default function NotificationContainer({ notifications, onRemove }: Props) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm space-y-3">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg border backdrop-blur-md
              ${
                n.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : n.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }
            `}
          >
            {/* ICON */}
            {n.type === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
            {n.type === "error" && <XCircle className="w-5 h-5 text-red-600" />}
            {n.type === "info" && <Info className="w-5 h-5 text-blue-600" />}

            {/* MESSAGE */}
            <p className="flex-1 text-sm font-medium">{n.message}</p>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => onRemove(n.id)}
              className="opacity-60 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
