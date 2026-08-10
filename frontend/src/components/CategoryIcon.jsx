import {
  Smartphone,
  FileText,
  Watch,
  Backpack,
  BookOpen,
  KeyRound,
  Shirt,
  Package,
} from "lucide-react";

const ICONS = {
  Electronics: Smartphone,
  Documents: FileText,
  Accessories: Watch,
  Bags: Backpack,
  Books: BookOpen,
  Keys: KeyRound,
  Clothing: Shirt,
  Other: Package,
};

export default function CategoryIcon({ category, className }) {
  const Icon = ICONS[category] || Package;
  return <Icon className={className} strokeWidth={1.75} />;
}
