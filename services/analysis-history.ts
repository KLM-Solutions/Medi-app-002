import { AnalysisResult } from '@/types/analysis';

// Use localhost for development
const API_BASE_URL = 'https://food-app-backend-psi-eosin.vercel.app';

// place to deploy the api
// const API_BASE_URL = 'https://neon-storage-app.vercel.app';

export const saveAnalysisHistory = async (analysis: AnalysisResult, userEmail: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: analysis.id || Date.now().toString(),
        user_id: userEmail,
        image_uri: analysis.imageUri,
        dish_name: analysis.dishName,
        category: analysis.category,
        confidence: analysis.confidence,
        description: analysis.description,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
        fiber: analysis.fiber,
        vitamin_a: analysis.vitaminA,
        vitamin_c: analysis.vitaminC,
        vitamin_d: analysis.vitaminD,
        vitamin_e: analysis.vitaminE,
        vitamin_k: analysis.vitaminK,
        vitamin_b1: analysis.vitaminB1,
        vitamin_b2: analysis.vitaminB2,
        vitamin_b3: analysis.vitaminB3,
        vitamin_b6: analysis.vitaminB6,
        vitamin_b12: analysis.vitaminB12,
        folate: analysis.folate,
        calcium: analysis.calcium,
        iron: analysis.iron,
        magnesium: analysis.magnesium,
        phosphorus: analysis.phosphorus,
        potassium: analysis.potassium,
        sodium: analysis.sodium,
        zinc: analysis.zinc,
        copper: analysis.copper,
        manganese: analysis.manganese,
        selenium: analysis.selenium,
        items_identified: analysis.itemsIdentified,
        nutritional_profile: analysis.nutritionalProfile,
        caloric_content: analysis.caloricContent,
        macronutrients: analysis.macronutrients,
        processing_level: analysis.processingLevel,
        health_implications: analysis.healthImplications,
        medication_alerts: analysis.medicationAlerts,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save analysis history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving analysis history:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (userEmail: string, limit: number = 10, offset: number = 0) => {
  try {
    console.log('Fetching history from:', `${API_BASE_URL}/api/analysis-history`);
    const response = await fetch(
      `${API_BASE_URL}/api/analysis-history?user_id=${userEmail}&limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch history:', response.status, errorText);
      throw new Error(`Failed to fetch analysis history: ${response.status}`);
    }

    const data = await response.json();
    
    // Map database field names to frontend field names
    return data.map((item: any) => ({
      id: item.id.toString(),
      imageUri: item.image_uri,
      dishName: item.dish_name,
      category: item.category,
      confidence: item.confidence,
      description: item.description,
      calories: Math.round(item.calories || 0),
      protein: Math.round(item.protein || 0),
      carbs: Math.round(item.carbs || 0),
      fats: Math.round(item.fats || 0),
      fiber: Math.round(item.fiber || 0),
      vitaminA: item.vitamin_a,
      vitaminC: item.vitamin_c,
      vitaminD: item.vitamin_d,
      vitaminE: item.vitamin_e,
      vitaminK: item.vitamin_k,
      vitaminB1: item.vitamin_b1,
      vitaminB2: item.vitamin_b2,
      vitaminB3: item.vitamin_b3,
      vitaminB6: item.vitamin_b6,
      vitaminB12: item.vitamin_b12,
      folate: item.folate,
      calcium: item.calcium,
      iron: item.iron,
      magnesium: item.magnesium,
      phosphorus: item.phosphorus,
      potassium: item.potassium,
      sodium: item.sodium,
      zinc: item.zinc,
      copper: item.copper,
      manganese: item.manganese,
      selenium: item.selenium,
      itemsIdentified: item.items_identified,
      nutritionalProfile: item.nutritional_profile,
      caloricContent: item.caloric_content,
      macronutrients: item.macronutrients,
      processingLevel: item.processing_level,
      healthImplications: item.health_implications,
      medicationAlerts: item.medication_alerts,
      timestamp: new Date(item.created_at).getTime()
    }));
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

export const deleteAnalysisHistory = async (id: string, userEmail: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis-history?id=${id}&user_id=${userEmail}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete analysis history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting analysis history:', error);
    throw error;
  }
}; 