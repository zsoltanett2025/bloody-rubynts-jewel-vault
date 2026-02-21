export function ShopModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Shop</h3>
          <button onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg">
            Close
          </button>
        </div>
        <p className="text-white/70 text-sm">
          (Stub) Shop modal. Később ide jönnek boosterek, vásárlás, BR reward.
        </p>
      </div>
    </div>
  );
}
