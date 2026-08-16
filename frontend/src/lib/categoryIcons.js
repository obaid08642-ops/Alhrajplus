import * as Icons from "lucide-react";

// Semantic vector registry. Every key has a valid Lucide fallback, so a new
// server-side category can never render an empty or broken icon tile.
export const CATEGORY_ICON_NAMES = {
  cars: "CarFront", realestate: "Building2", electronics: "Cpu", jobs: "BriefcaseBusiness",
  services: "Wrench", furniture: "Sofa", livestock: "Rabbit", personal: "ShoppingBag",
  auctions: "Gavel", books: "BookOpen", games: "Gamepad2", garden: "Sprout",
  sports: "Dumbbell", kids: "Baby", phones: "Smartphone", pets: "Dog",
  beauty_health: "HeartPulse", food: "UtensilsCrossed", business: "Factory",
  equipment: "Tractor", books_courses: "GraduationCap", tickets_events: "Ticket", all: "Shapes",
};

export const SUBCATEGORY_ICON_NAMES = {
  cars_used: "CarFront", cars_new: "BadgeCheck", trucks: "Truck", spare_parts: "Cog", accessories: "Sparkles", car_services: "Wrench", plates: "Badge",
  apt_rent: "KeyRound", apt_sale: "House", villa_rent: "HousePlus", villa_sale: "HouseHeart", land: "LandPlot", commercial: "Store", farms: "Wheat",
  mobiles: "Smartphone", laptops: "Laptop", tablets: "Tablet", audio: "Headphones", tv: "Tv", appliances: "Refrigerator", gaming: "Gamepad2",
  job_offer: "BriefcaseBusiness", job_seeker: "UserRoundSearch",
  plumbing: "Pipe", electrical: "Zap", ac: "Wind", cleaning: "Sparkles", moving: "Truck", drivers: "CarTaxiFront", delivery: "PackageCheck", construction: "HardHat", painting: "Paintbrush", carpentry: "Hammer", tutoring: "GraduationCap", beauty: "Scissors", events: "PartyPopper", tech_support: "LaptopMinimalCheck", gardening: "Flower2",
  majlis: "Armchair", bedroom: "BedDouble", tables: "Table2", wardrobes: "DoorOpen", kitchen: "ChefHat", decor: "LampCeiling", office_furniture: "Briefcase",
  camels: "Rabbit", horses: "Horse", sheep: "Badge", cattle: "Beef", birds: "Bird", cats: "Cat", dogs: "Dog", fish: "Fish", rabbits: "Rabbit", supplies: "ShoppingBasket",
  men_clothes: "Shirt", women_clothes: "Shirt", kids_clothes: "Baby", perfumes: "SprayCan", watches: "Watch", jewelry: "Gem", bags: "Briefcase", shoes: "Footprints", glasses: "Glasses",
  car_auctions: "CarFront", real_estate_auctions: "House", antiques: "Crown", rare_items: "Gem",
  academic: "BookMarked", religious: "BookHeart", novels: "BookText", magazines: "Newspaper",
  consoles: "Gamepad2", video_games: "Joystick", toys: "Puzzle", board_games: "Dice5",
  plants: "Flower2", garden_tools: "Shovel", outdoor_furniture: "Armchair",
  fitness: "Dumbbell", bicycles: "Bike", outdoor: "TentTree", team_sports: "Goal",
  baby_gear: "Baby", maternity: "HeartHandshake", toys_kids: "Blocks", kids_clothes_and_shoes: "Shirt",
  android: "Smartphone", iphone: "Smartphone", tablets_phones: "Tablet", accessories_phones: "Cable",
  cats_pets: "Cat", dogs_pets: "Dog", birds_pets: "Bird", fish_pets: "Fish", pet_supplies: "Bone",
  skincare: "Droplets", haircare: "Scissors", makeup: "Brush", medical: "Stethoscope", fitness_health: "HeartPulse",
  restaurants: "Utensils", groceries: "ShoppingBasket", sweets: "CakeSlice", catering: "ChefHat",
  businesses_for_sale: "Store", franchises: "Network", industrial: "Factory",
  construction_equipment: "Construction", agricultural_equipment: "Tractor", generators: "BatteryCharging", tools_equipment: "Drill",
  courses: "GraduationCap", training: "Presentation", certifications: "Award", language_learning: "Languages",
  concerts: "Music2", sports_events: "TicketCheck", theater: "Drama", travel_tickets: "Plane",
};

const fallback = Icons.CircleDotDashed || Icons.CircleDot;

export function resolveCategoryIcon(key, isSubcategory = false) {
  const name = isSubcategory ? SUBCATEGORY_ICON_NAMES[key] : CATEGORY_ICON_NAMES[key];
  return (name && Icons[name]) || fallback;
}

export function PremiumCategoryIcon({ categoryKey, subcategoryKey, size = 22, className = "" }) {
  const Icon = resolveCategoryIcon(subcategoryKey || categoryKey, Boolean(subcategoryKey));
  return (
    <span className={`category-icon-premium ${className}`} aria-hidden="true">
      <Icon size={size} strokeWidth={2.15} />
    </span>
  );
}
