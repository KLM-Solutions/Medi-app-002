export type HealthCategory = 'Clearly Healthy' | 'Borderline' | 'Mixed' | 'Clearly Unhealthy' | 'Unknown';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  notes?: string;
}

export interface MedicationInteraction {
  medicationName: string;
  warning: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisResult {
  id: string;
  imageUri: string;
  items: string[];
  dishName?: string;
  description: string;
  category: HealthCategory;
  confidence: number;
  timestamp: number;
  medications?: string[];
  interactions?: MedicationInteraction[];
  medicationAlerts?: string[];
  processingLevel?: string;
  fullResponse?: string;
  caloricContent?: string;
  itemsIdentified?: string;
  macronutrients?: string;
  nutritionalProfile?: string;
  healthImplications?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  folate?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;
}

export interface ApiResponse {
  category: string;
  confidence: number;
  analysis: string;
  medicationAlerts?: string[];
  processingLevel?: string;
  caloricContent?: string;
  itemsIdentified?: string;
  macronutrients?: string;
  nutritionalProfile?: string;
  healthImplications?: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
  calories?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  folate?: number;
  calcium?: number;
  iron?: number;
  magnesium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;
}