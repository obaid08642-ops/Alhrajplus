import * as Icons from "lucide-react-native";

export const CATEGORY_ICON_NAMES = {
  cars: "CarFront", realestate: "Building2", electronics: "Cpu", jobs: "BriefcaseBusiness",
  services: "Wrench", furniture: "Sofa", livestock: "Rabbit", personal: "ShoppingBag",
  auctions: "Gavel", books: "BookOpen", games: "Gamepad2", garden: "Sprout",
  sports: "Dumbbell", kids: "Baby", phones: "Smartphone", pets: "Dog",
  beauty_health: "HeartPulse", food: "UtensilsCrossed", business: "Factory",
  equipment: "Tractor", books_courses: "GraduationCap", tickets_events: "Ticket", all: "Shapes",
};

const FALLBACK = Icons.CircleDotDashed || Icons.CircleDot || Icons.Circle;

export function resolveCategoryIcon(key) {
  return Icons[CATEGORY_ICON_NAMES[key]] || FALLBACK;
}
