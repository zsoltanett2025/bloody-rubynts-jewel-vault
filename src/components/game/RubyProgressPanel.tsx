import { assetUrl } from "../../utils/assetUrl";
import { getShardProgress } from "../../utils/shards";

export function RubyProgressPanel() {
  const { have, total } = getShardProgress();

  // tedd be ide a törött rubin képedet
  const shatteredRuby = assetUrl("assets/ui/shattered_ruby.png");

  return (
   <div className="hidden lg:block absolute left-4 top-32 z-20 w-[360px] xl:w-[420px] pointer-events-none">
      <div className="rounded-2xl border border-red-900/30 bg-black/35 backdrop-blur-sm p-4">
        <div className="text-red-200/70 tracking-[0.28em] uppercase text-xs">Quest</div>
        <div className="mt-2 text-3xl xl:text-4xl text-red-100 font-lore">
          Shattered Ruby
        </div>

        <div className="mt-4 flex items-center gap-4">
          <img
            src={shatteredRuby}
            alt="Shattered Ruby"
            className="w-20 h-20 object-contain opacity-95"
          />
          <div className="text-red-100/90 font-lore text-xl">
            Shards: <span className="font-bold">{have}</span> / {total}
            <div className="text-red-200/70 text-sm mt-1">
              Find shards in challenge levels.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
