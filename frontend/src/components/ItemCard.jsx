import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatusStamp from "./StatusStamp";
import CategoryIcon from "./CategoryIcon";
import { resolveImage } from "../lib/api";

export default function ItemCard({ item }) {
  return (
    <motion.div
      layout
      className="min-w-0"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      <Link to={`/items/${item.item_id}`} className="ticket flex group">
        {/* stub */}
        <div className="relative w-24 sm:w-28 shrink-0 bg-parchment border-r border-dashed border-line flex flex-col items-center justify-center gap-2 py-4 px-2 overflow-hidden">
          <CategoryIcon
            category={item.category}
            className="absolute -bottom-2 -right-2 w-14 h-14 text-ink/[0.05] rotate-[-8deg]"
          />
          <motion.div whileHover={{ rotate: [0, -8, 4, -3, 0] }} transition={{ duration: 0.5 }}>
            <StatusStamp status={item.status} />
          </motion.div>
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
            <h3 className="font-display font-semibold text-ink text-lg leading-snug group-hover:text-forest transition truncate min-w-0">
              {item.title}
            </h3>
            <span className="text-xs font-mono text-ink/40 whitespace-nowrap pt-1">{item.date}</span>
          </div>
          <p className="text-sm text-ink/60 mt-1 flex items-center gap-1.5 min-w-0">
            <CategoryIcon category={item.category} className="w-3.5 h-3.5 text-forest/70 shrink-0" />
            <span className="truncate">{item.category} &middot; {item.location}</span>
          </p>
          <p className="text-sm text-ink/70 mt-2 line-clamp-2">{item.description}</p>
        </div>

        {item.image && (
          <div className="hidden sm:block w-28 shrink-0 overflow-hidden">
            <motion.img
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.4 }}
              src={resolveImage(item.image)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
