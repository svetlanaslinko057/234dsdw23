import { Info } from 'lucide-react';

export const SilenceKillerBanner = ({ lastUpdate, updates }) => {
  if (!updates || updates.length === 0) {
    return null;
  }

  const latestUpdate = updates[0];

  return (
    <div
      className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-4 mb-6"
      data-testid="silence-killer-update-card"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="flex-1">
          <div className="text-white font-medium text-sm mb-1">{latestUpdate.message}</div>
          <div className="text-xs text-white/60">{latestUpdate.details}</div>
          <div className="text-xs text-white/40 mt-2">
            {new Date(latestUpdate.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
