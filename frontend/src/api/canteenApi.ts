import { apiRequest } from './client';

export interface School {
  id: number;
  name: string;
  slug?: string;
  address: string;
  currency: string;
  timezone: string;
  totalStudents: number;
  isMenuPublished?: boolean;
  allergensVisible?: boolean;
}

export interface Allergen {
  id: number;
  code: string;
  name: string;
  icon: string;
  description: string;
}

export interface PublicSchoolInfo {
  name: string;
  slug: string;
  address: string;
  totalStudents: number;
  isMenuPublished: boolean;
  allergensVisible: boolean;
}

export interface PublicDish {
  id: number;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbs?: number;
  allergens: Allergen[];
  ingredientsSummary?: string[];
  votesCount?: number;
  studentVotesCount?: number;
  userVoted?: boolean;
}

export interface PublicMenuPlan {
  date: string;
  dayOfWeek?: string;
  status?: string;
  isPublished?: boolean;
  dishes?: PublicDish[];
  items?: PublicDish[];
}

export interface RecipeIngredient {
  id?: number;
  ingredientId: number;
  ingredientName?: string;
  quantity: number;
  unit: string;
}

export interface Dish {
  id: number;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbs?: number;
  allergens?: Allergen[];
  active: boolean;
  isDemo: boolean;
  yieldPortions: number;
  instructions: string;
  ingredients: RecipeIngredient[];
}

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  baseUnit: string;
  minBalance: number;
  currentStock: number;
  isLowStock: boolean;
  isDemo: boolean;
}

export interface InventoryBatch {
  id: number;
  ingredientId: number;
  batchNumber: string;
  receivedQty: number;
  remainingQty: number;
  unit: string;
  unitCost: number;
  receivedAt: string;
  expiresAt: string;
  supplier: string;
  isDemo: boolean;
}

export interface MenuPlanItem {
  id?: number;
  dishId: number;
  dishName: string;
  category: string;
  plannedPortions: number;
  forecastPortions?: number;
}

export interface MenuPlanView {
  id: number | null;
  date: string;
  status: string;
  items: MenuPlanItem[];
}

export interface ForecastLine {
  id: number;
  dishId: number;
  dishName: string;
  category: string;
  predictedPortions: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number;
  explanation: string;
}

export interface ForecastView {
  id: number;
  date: string;
  totalPredictedPortions: number;
  modelVersion: string;
  explanation: string;
  lines: ForecastLine[];
}

export interface ProcurementLine {
  id: number;
  ingredientId: number;
  ingredientName: string;
  requiredQty: number;
  stockQty: number;
  safetyStock: number;
  purchaseQty: number;
  unit: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
}

export interface ProcurementPlanView {
  id: number | null;
  date: string;
  status: string;
  totalEstimatedCost: number;
  lines: ProcurementLine[];
}

export interface ProductionFact {
  id: number;
  date: string;
  dishId: number;
  dishName: string;
  preparedPortions: number;
  servedPortions: number;
  usableLeftovers: number;
  wastePortions: number;
  varianceNote?: string;
}

export interface WasteRecordItem {
  id: number;
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  unitCost: number;
  totalLoss: number;
}

export interface WasteSummary {
  productionFacts: ProductionFact[];
  wasteRecords: WasteRecordItem[];
}

export interface BatchAlert {
  batchId: number;
  ingredientName?: string;
  batchNumber: string;
  remainingQty: number;
  unit: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface DailyMetric {
  date: string;
  prepared: number;
  served: number;
  waste: number;
  wasteCost: number;
}

export interface AnalyticsSummary {
  schoolName: string;
  currency: string;
  totalPreparedPortions: number;
  totalServedPortions: number;
  totalWastePortions: number;
  wasteRatePortions: number;
  servedRatePortions: number;
  totalProcurementCost: number;
  totalWasteCost: number;
  expiringBatchesCount: number;
  expiringBatches: BatchAlert[];
  dailyMetrics: DailyMetric[];
}

export interface AdminDashboardSummary {
  schoolName: string;
  schoolSlug: string;
  address: string;
  currency: string;
  totalStudents: number;
  isMenuPublished: boolean;
  allergensVisible: boolean;
  menuStatus: string;
  todayDishesCount: number;
  plannedPortions: number;
  forecastPortions: number;
  totalPreparedPortions: number;
  totalServedPortions: number;
  totalWastePortions: number;
  wasteRatePortions: number;
  expiringBatchesCount: number;
  lowStockCount: number;
  totalBooked: number;
  totalServed: number;
  pendingPickup: number;
  totalRevenueKgs: number;
}

export const canteenApi = {
  getDashboard: () => apiRequest<AdminDashboardSummary>('/canteen/dashboard'),
  getSchool: () => apiRequest<School>('/canteen/school'),
  updateSchool: (data: Partial<School>) =>
    apiRequest<School>('/canteen/school', { method: 'PUT', body: JSON.stringify(data) }),

  getDishes: () => apiRequest<Dish[]>('/canteen/dishes'),
  createDish: (data: {
    name: string;
    category: string;
    description: string;
    yieldPortions: number;
    instructions: string;
    imageUrl?: string;
    calories?: number;
    proteins?: number;
    fats?: number;
    carbs?: number;
    ingredients: { ingredientId: number; quantity: number; unit: string }[];
  }) => apiRequest<Dish>('/canteen/dishes', { method: 'POST', body: JSON.stringify(data) }),

  getIngredients: () => apiRequest<Ingredient[]>('/canteen/ingredients'),
  createIngredient: (data: Partial<Ingredient>) =>
    apiRequest<Ingredient>('/canteen/ingredients', { method: 'POST', body: JSON.stringify(data) }),

  getBatches: (ingredientId?: number) =>
    apiRequest<InventoryBatch[]>(`/canteen/inventory/batches${ingredientId ? `?ingredientId=${ingredientId}` : ''}`),
  receiveBatch: (data: {
    ingredientId: number;
    batchNumber: string;
    quantity: number;
    unit: string;
    unitCost: number;
    expiresAt: string;
    supplier: string;
  }) => apiRequest<InventoryBatch>('/canteen/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  writeOffBatch: (data: { batchId: number; quantity: number; reason: string; note: string }) =>
    apiRequest<any>('/canteen/inventory/write-off', { method: 'POST', body: JSON.stringify(data) }),

  getMenu: (date?: string) =>
    apiRequest<MenuPlanView>(`/canteen/menu${date ? `?date=${date}` : ''}`),
  saveMenu: (data: { date: string; items: { dishId: number; plannedPortions: number; forecastPortions?: number }[] }) =>
    apiRequest<MenuPlanView>('/canteen/menu', { method: 'POST', body: JSON.stringify(data) }),

  getForecast: (date?: string) =>
    apiRequest<ForecastView>(`/canteen/forecast${date ? `?date=${date}` : ''}`),
  calculateForecast: (data: { date: string; expectedStudents?: number; participationRate?: number }) =>
    apiRequest<ForecastView>('/canteen/forecast/calculate', { method: 'POST', body: JSON.stringify(data) }),

  getProcurement: (date?: string) =>
    apiRequest<ProcurementPlanView>(`/canteen/procurement${date ? `?date=${date}` : ''}`),
  calculateProcurement: (data: { date: string; forecastRunId?: number }) =>
    apiRequest<ProcurementPlanView>('/canteen/procurement/calculate', { method: 'POST', body: JSON.stringify(data) }),

  getWaste: () => apiRequest<WasteSummary>('/canteen/waste'),
  recordProductionFact: (data: {
    date: string;
    dishId: number;
    preparedPortions: number;
    servedPortions: number;
    usableLeftovers: number;
    wastePortions: number;
    varianceNote?: string;
  }) => apiRequest<ProductionFact>('/canteen/waste/production', { method: 'POST', body: JSON.stringify(data) }),
  recordWasteLoss: (data: {
    date: string;
    ingredientId?: number;
    dishId?: number;
    quantity: number;
    unit: string;
    reason: string;
  }) => apiRequest<WasteRecordItem>('/canteen/waste/record', { method: 'POST', body: JSON.stringify(data) }),

  getAnalytics: () => apiRequest<AnalyticsSummary>('/canteen/analytics'),

  // Meal Bookings for Students (Предзаказ питания)
  getBookings: (date?: string, grade?: string, status?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (grade) params.append('grade', grade);
    if (status) params.append('status', status);
    const qs = params.toString();
    return apiRequest<MealBooking[]>(`/canteen/bookings${qs ? `?${qs}` : ''}`);
  },
  createBooking: (data: CreateBookingInput) =>
    apiRequest<MealBooking>('/canteen/bookings', { method: 'POST', body: JSON.stringify(data) }),
  verifyBookingCode: (code: string) =>
    apiRequest<MealBooking>(`/canteen/bookings/verify/${encodeURIComponent(code)}`),
  serveBookingByCode: (code: string) =>
    apiRequest<MealBooking>(`/canteen/bookings/serve/${encodeURIComponent(code)}`, { method: 'POST' }),
  serveBookingById: (id: number) =>
    apiRequest<MealBooking>(`/canteen/bookings/${id}/serve`, { method: 'POST' }),
  cancelBooking: (id: number) =>
    apiRequest<MealBooking>(`/canteen/bookings/${id}/cancel`, { method: 'POST' }),
  getBookingSummary: (date?: string) =>
    apiRequest<BookingSummary>(`/canteen/bookings/summary${date ? `?date=${date}` : ''}`),

  // School publication controls
  toggleMenuPublication: (published: boolean) =>
    apiRequest<School>(`/canteen/school/publish-menu?published=${published}`, { method: 'PUT' }),
  getAllergens: () =>
    apiRequest<Allergen[]>('/canteen/allergens'),

  // Public Student Portal API (Unauthenticated, Safe, 0-PII)
  getPublicSchoolInfo: (slug: string) =>
    apiRequest<PublicSchoolInfo>(`/api/public/${slug}/info`),
  getPublicTodayMenu: (slug: string, sessionId?: string) =>
    apiRequest<PublicMenuPlan>(`/api/public/${slug}/menu/today${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`),
  getPublicWeekMenu: (slug: string, sessionId?: string) =>
    apiRequest<PublicMenuPlan[]>(`/api/public/${slug}/menu/week${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`),
  getPublicDishDetails: (slug: string, dishId: number, sessionId?: string) =>
    apiRequest<PublicDish>(`/api/public/${slug}/dishes/${dishId}${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`),
  votePreference: (slug: string, data: { dishId: number; date?: string; mealType?: string; sessionId?: string }) =>
    apiRequest<{ dishId: number; voted: boolean; votesCount: number; sessionId: string }>(`/api/public/${slug}/preferences`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface MealBooking {
  id: number;
  schoolId: number;
  studentName: string;
  grade: string;
  bookingDate: string;
  mealType: string;
  dishId?: number;
  dishName: string;
  dietaryNotes?: string;
  code: string;
  price: number;
  status: 'CONFIRMED' | 'SERVED' | 'CANCELLED';
  servedAt?: string;
  createdAt: string;
}

export interface CreateBookingInput {
  schoolId?: number;
  studentName: string;
  grade: string;
  bookingDate: string;
  mealType?: string;
  dishId?: number;
  dietaryNotes?: string;
  price?: number;
}

export interface BookingSummary {
  date: string;
  totalBooked: number;
  totalServed: number;
  pendingPickup: number;
  totalRevenueKgs: number;
}

