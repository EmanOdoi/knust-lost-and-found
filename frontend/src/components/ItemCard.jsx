import { Link } from "react-router-dom";
import StatusStamp from "./StatusStamp";
import { resolveImage } from "../lib/api";

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.item_id}`} className="ticket flex group">
      {/* stub */}
      <div className="w-24 sm:w-28 shrink-0 bg-parchment border-r border-dashed border-line flex flex-col items-center justify-center gap-2 py-4 px-2">
        <StatusStamp status={item.status} />
        <span className="font-mono text-[11px] text-ink/40">#{String(item.item_id).padStart(4, "0")}</span>
      </div>

      {/* perforation notch */}
      <div className="relative w-0">
        <span className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-parchment"></span>
        <span className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-parchment"></span>
      </div>

      {/* content */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-semibold text-ink text-lg leading-snug group-hover:text-forest transition truncate">
            {item.title}
          </h3>
          <span className="text-xs font-mono text-ink/40 whitespace-nowrap pt-1">{item.date}</span>
        </div>
        <p className="text-sm text-ink/60 mt-1">
          {item.category} &middot; {item.location}
        </p>
        <p className="text-sm text-ink/70 mt-2 line-clamp-2">{item.description}</p>
      </div>

      {item.image && (
        <div className="hidden sm:block w-28 shrink-0">
          <img src={resolveImage(item.image)} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </Link>
  );
}
