import { ApiResponse, AnalysisResult, Medication } from '@/types/analysis';
import { useAnalysisStore } from '@/stores/analysis-store';

const API_URL = 'https://feature1-food.vercel.app/api/calculator';


// https://feature1-food.vercel.app/api/calculator

// https://glp-1-typescript.vercel.app/api/calculator
// Generate a random ID for messages
const generateId = () => Math.random().toString(36).substring(2, 15);

export async function analyzeImage(
  imageBase64: string,
  medications?: Medication[]
): Promise<AnalysisResult> {
  console.log('Starting image analysis...');
  
  try {
    const result = await analyzeImageWithRealApi(imageBase64, medications);
    console.log('API call successful!');

    // Store the full original response
    const fullResponseText = result.analysis;
    console.log('Full response text length:', fullResponseText.length);
    
    // Extract dish name from the analysis text
    const dishNameMatch = result.analysis.match(/Dish Name:\s*(.+)/);
    const dishName = dishNameMatch ? dishNameMatch[1].trim() : undefined;

    // Extract processing level from the analysis text
    const processingLevelMatch = result.analysis.match(/Processing Level:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/);
    const processingLevel = processingLevelMatch ? processingLevelMatch[1].trim() : undefined;

    // Extract caloric content as formatted string
    const caloricContentMatch = result.analysis.match(/Caloric Content:\s*(.+?)(\n|$)/);
    const caloricContent = caloricContentMatch ? caloricContentMatch[1].trim() : 
                          (result.calories ? `${result.calories} calories` : undefined);

    // Extract items identified
    const itemsIdentifiedMatch = result.analysis.match(/Items Identified:\s*(.+?)(\n\n|\n[A-Z]|$)/s);
    const itemsIdentified = itemsIdentifiedMatch ? itemsIdentifiedMatch[1].trim() : undefined;

    // Extract macronutrients information with a more lenient pattern
    const macronutrientsMatch = result.analysis.match(/Macronutrients:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/);
    const macronutrients = macronutrientsMatch ? macronutrientsMatch[1].trim() : undefined;
    
    // Extract nutritional profile information with a lenient pattern
    const nutritionalProfileMatch = result.analysis.match(/Nutritional Profile:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/);
    const nutritionalProfile = nutritionalProfileMatch ? nutritionalProfileMatch[1].trim() : undefined;
    
    // Extract health implications information with a lenient pattern
    const healthImplicationsMatch = result.analysis.match(/Health Implications:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/);
    const healthImplications = healthImplicationsMatch ? healthImplicationsMatch[1].trim() : undefined;
    
    // Log full result to help with debugging
    console.log('Full analysis text contains Macronutrients?', result.analysis.includes('Macronutrients:'));
    console.log('Extracted raw macronutrients:', macronutrients);

    // Log extraction results for debugging
    console.log('Extracted itemsIdentified:', itemsIdentified);
    console.log('Extracted macronutrients:', macronutrients);
    console.log('Extracted processingLevel:', processingLevel);
    console.log('Extracted nutritionalProfile:', nutritionalProfile);
    console.log('Extracted healthImplications:', healthImplications);
    
    // If macronutrients not found directly, try to build it from the individual values
    let constructedMacronutrients = undefined;
    if (!macronutrients && (result.protein || result.carbs || result.fats || result.fiber)) {
      constructedMacronutrients = [
        result.protein ? `Protein: ${result.protein}g` : '',
        result.carbs ? `Carbohydrates: ${result.carbs}g` : '',
        result.fats ? `Fats: ${result.fats}g` : '',
        result.fiber ? `Fiber: ${result.fiber}g` : ''
      ].filter(item => item).join('\n');
      
      if (constructedMacronutrients) {
        console.log('Constructed macronutrients from individual values:', constructedMacronutrients);
      }
    }

    // Remove the dish name line from the analysis text
    const analysisWithoutDishName = result.analysis.replace(/Dish Name:\s*.+\n?/, '');

    return {
      id: Date.now().toString(),
      imageUri: `data:image/jpeg;base64,${imageBase64}`,
      items: result.analysis.split('\n').filter(line => line.trim().startsWith('•')).map(item => item.replace('•', '').trim()),
      dishName,
      description: analysisWithoutDishName,
      category: mapCategory(result.category),
      confidence: result.confidence,
      timestamp: Date.now(),
      medicationAlerts: result.medicationAlerts,
      processingLevel,
      caloricContent,
      fullResponse: fullResponseText, 
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      fiber: result.fiber,
      calories: result.calories,
      itemsIdentified,
      macronutrients: macronutrients || constructedMacronutrients || result.macronutrients,
      nutritionalProfile: nutritionalProfile || result.nutritionalProfile,
      healthImplications: healthImplications || result.healthImplications,
      vitaminA: result.vitaminA,
      vitaminC: result.vitaminC,
      vitaminD: result.vitaminD,
      vitaminE: result.vitaminE,
      vitaminK: result.vitaminK,
      vitaminB1: result.vitaminB1,
      vitaminB2: result.vitaminB2,
      vitaminB3: result.vitaminB3,
      vitaminB6: result.vitaminB6,
      vitaminB12: result.vitaminB12,
      folate: result.folate,
      calcium: result.calcium,
      iron: result.iron,
      magnesium: result.magnesium,
      phosphorus: result.phosphorus,
      potassium: result.potassium,
      sodium: result.sodium,
      zinc: result.zinc,
      copper: result.copper,
      manganese: result.manganese,
      selenium: result.selenium,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

function mapCategory(category: string): AnalysisResult['category'] {
  const normalizedCategory = category.toLowerCase().trim();
  
  if (normalizedCategory.includes('healthy')) return 'Clearly Healthy';
  if (normalizedCategory.includes('borderline')) return 'Borderline';
  if (normalizedCategory.includes('mixed')) return 'Mixed';
  if (normalizedCategory.includes('unhealthy')) return 'Clearly Unhealthy';
  
  return 'Unknown';
}

async function analyzeImageWithRealApi(imageBase64: string, medications?: Medication[]): Promise<ApiResponse> {
  console.log('Using API endpoint:', API_URL);
  
  // Ensure image is properly formatted as base64
  let imageData = imageBase64;
  if (imageData.includes('base64,')) {
    imageData = imageData.split('base64,')[1];
  }
  
  // Format medications to ensure notes is always a string
  const formattedMedications = medications?.map(med => ({
    ...med,
    notes: med.notes || '' // Ensure notes is never null
  })) || [];
  
  // Prepare the request body
  const requestBody = {
    messages: [{
      role: 'user',
      content: JSON.stringify({
        type: 'analysis_request',
        image: imageData,
        medications: formattedMedications
      }),
      id: generateId()
    }]
  };

  console.log('Sending request to API with medications:', formattedMedications);
  
  // Make the API request
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error text available');
    console.error(`API request failed with status ${response.status}:`, errorText);
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  // Get the response text
  const responseText = await response.text();
  console.log('Raw API response:', responseText);
  
  let analysisText = '';
  let medicationAlerts: string[] = [];
  let isInMedicationAlertSection = false;

  // Parse the response text line by line
  const lines = responseText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(5).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          console.log('Parsed chunk:', parsed);
          
          if (parsed.content) {
            if (parsed.type === 'separator') {
              if (parsed.content.includes('MEDICATION_ALERT_START')) {
                isInMedicationAlertSection = true;
                console.log('Entered medication alert section');
              } else if (parsed.content.includes('MEDICATION_ALERT_END')) {
                isInMedicationAlertSection = false;
                console.log('Exited medication alert section');
              }
            } else if (parsed.type === 'medication_alert') {
              console.log('Found medication alert:', parsed.content);
              medicationAlerts.push(parsed.content);
            } else if (!isInMedicationAlertSection) {
              analysisText += parsed.content;
            }
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    }
  }

  console.log('Final analysis text length:', analysisText.length);
  console.log('Final analysis text (first 100 chars):', analysisText.substring(0, 100));
  console.log('Final medication alerts:', medicationAlerts);
  
  const parsedAnalysis = parseAnalysisFromText(analysisText);
  return {
    ...parsedAnalysis,
    medicationAlerts: medicationAlerts.length > 0 ? medicationAlerts : undefined
  };
}

function parseAnalysisFromText(content: string): Omit<ApiResponse, 'medicationAlerts'> {
  try {
    if (!content) {
      console.error('Empty content received from API');
      return {
        category: 'Unknown',
        confidence: 0,
        analysis: 'No analysis available'
      };
    }

    const lines = content.split('\n');
    let category = 'Unknown';
    let confidence = 0;
    let analysis = content; // Store the full original content
    let protein: number | undefined;
    let carbs: number | undefined;
    let fats: number | undefined;
    let fiber: number | undefined;
    let calories: number | undefined;
    let caloricContent: string | undefined;
    let itemsIdentified: string | undefined;
    let macronutrients: string | undefined;
    let nutritionalProfile: string | undefined;
    let healthImplications: string | undefined;
    let vitaminA: number | undefined;
    let vitaminC: number | undefined;
    let vitaminD: number | undefined;
    let vitaminE: number | undefined;
    let vitaminK: number | undefined;
    let vitaminB1: number | undefined;
    let vitaminB2: number | undefined;
    let vitaminB3: number | undefined;
    let vitaminB6: number | undefined;
    let vitaminB12: number | undefined;
    let folate: number | undefined;
    let calcium: number | undefined;
    let iron: number | undefined;
    let magnesium: number | undefined;
    let phosphorus: number | undefined;
    let potassium: number | undefined;
    let sodium: number | undefined;
    let zinc: number | undefined;
    let copper: number | undefined;
    let manganese: number | undefined;
    let selenium: number | undefined;
    let processingLevel: string | undefined;

    console.log('Parsing content length:', content.length);
    
    // First try to find specific sections directly with regex
    const macronutrientsRegex = /Macronutrients:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/;
    const macroMatch = content.match(macronutrientsRegex);
    if (macroMatch && macroMatch[1]) {
      macronutrients = macroMatch[1].trim();
    }
    
    const itemsRegex = /Items Identified:\s*(.+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/s;
    const itemsMatch = content.match(itemsRegex);
    if (itemsMatch && itemsMatch[1]) {
      itemsIdentified = itemsMatch[1].trim();
    }
    
    const processingLevelRegex = /Processing Level:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/;
    const processingLevelMatch = content.match(processingLevelRegex);
    if (processingLevelMatch && processingLevelMatch[1]) {
      processingLevel = processingLevelMatch[1].trim();
    }
    
    const nutritionalProfileRegex = /Nutritional Profile:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/;
    const nutritionalProfileMatch = content.match(nutritionalProfileRegex);
    if (nutritionalProfileMatch && nutritionalProfileMatch[1]) {
      nutritionalProfile = nutritionalProfileMatch[1].trim();
    }

    const healthImplicationsRegex = /Health Implications:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|\n\s*$|$)/;
    const healthImplicationsMatch = content.match(healthImplicationsRegex);
    if (healthImplicationsMatch && healthImplicationsMatch[1]) {
      healthImplications = healthImplicationsMatch[1].trim();
    }

    // Process line by line for other values
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // Skip empty lines
      
      console.log('Processing line:', trimmedLine);
      
      if (trimmedLine.toLowerCase().includes('category:')) {
        category = trimmedLine.replace(/Category:/i, '').trim();
      } else if (trimmedLine.toLowerCase().includes('confidence:')) {
        const match = trimmedLine.match(/(\d+(\.\d+)?)/);
        if (match) confidence = parseFloat(match[1]);
      } else if (trimmedLine.toLowerCase().includes('caloric content:')) {
        caloricContent = trimmedLine.replace(/Caloric Content:/i, '').trim();
        // Try to extract number of calories if available
        const caloriesMatch = caloricContent.match(/(\d+)/);
        if (caloriesMatch) calories = parseInt(caloriesMatch[1]);
      } else if (trimmedLine.toLowerCase().includes('items identified:')) {
        // Extract the items identified section which may span multiple lines
        const itemsStartIndex = lines.indexOf(line);
        let itemsEndIndex = itemsStartIndex;
        
        // Find where the items section ends (empty line or new section)
        for (let i = itemsStartIndex + 1; i < lines.length; i++) {
          if (lines[i].trim() === '' || lines[i].match(/^[A-Z]/)) {
            itemsEndIndex = i - 1;
            break;
          }
          itemsEndIndex = i;
        }
        
        // Join all lines from the items section
        if (itemsEndIndex > itemsStartIndex) {
          const itemsLines = lines.slice(itemsStartIndex, itemsEndIndex + 1);
          itemsIdentified = itemsLines.join('\n').replace('Items Identified:', '').trim();
        }
      } else if (trimmedLine.toLowerCase().includes('macronutrients:')) {
        // Mark the start of macronutrients section
        const macroStartIndex = lines.indexOf(line);
        let macroEndIndex = macroStartIndex;
        let macroText = trimmedLine.substring(trimmedLine.toLowerCase().indexOf('macronutrients:') + 'macronutrients:'.length).trim();
        
        // Find where the macronutrients section ends
        for (let i = macroStartIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i].trim();
          // Stop if we hit a new section header
          if (nextLine.match(/^[A-Z][a-z]+:/) || nextLine === '') {
            macroEndIndex = i - 1;
            break;
          }
          // Otherwise add this line to our macronutrients text
          macroText += ' ' + nextLine;
          macroEndIndex = i;
        }
        
        // Use the collected text
        if (macroText) {
          macronutrients = macroText;
        }
      } else if (trimmedLine.toLowerCase().includes('processing level:')) {
        // Mark the start of processing level section
        const levelStartIndex = lines.indexOf(line);
        let levelEndIndex = levelStartIndex;
        let levelText = trimmedLine.substring(trimmedLine.toLowerCase().indexOf('processing level:') + 'processing level:'.length).trim();
        
        // Find where the processing level section ends
        for (let i = levelStartIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i].trim();
          // Stop if we hit a new section header
          if (nextLine.match(/^[A-Z][a-z]+:/) || nextLine === '') {
            levelEndIndex = i - 1;
            break;
          }
          // Otherwise add this line to our processing level text
          levelText += ' ' + nextLine;
          levelEndIndex = i;
        }
        
        // Use the collected text
        if (levelText) {
          processingLevel = levelText;
        }
      } else if (trimmedLine.toLowerCase().includes('calories:')) {
        const caloriesValue = trimmedLine.split(':')[1].trim();
        calories = parseInt(caloriesValue);
      } else if (trimmedLine.toLowerCase().includes('protein')) {
        protein = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('carbohydrate') || trimmedLine.toLowerCase().includes('carbs')) {
        carbs = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('fat')) {
        fats = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('fiber')) {
        fiber = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin a')) {
        vitaminA = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin c')) {
        vitaminC = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin d')) {
        vitaminD = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin e')) {
        vitaminE = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin k')) {
        vitaminK = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin b1') || trimmedLine.toLowerCase().includes('thiamine')) {
        vitaminB1 = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin b2') || trimmedLine.toLowerCase().includes('riboflavin')) {
        vitaminB2 = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin b3') || trimmedLine.toLowerCase().includes('niacin')) {
        vitaminB3 = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin b6') || trimmedLine.toLowerCase().includes('pyridoxine')) {
        vitaminB6 = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('vitamin b12') || trimmedLine.toLowerCase().includes('cobalamin')) {
        vitaminB12 = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('folate') || trimmedLine.toLowerCase().includes('folic acid')) {
        folate = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('calcium')) {
        calcium = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('iron')) {
        iron = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('magnesium')) {
        magnesium = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('phosphorus')) {
        phosphorus = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('potassium')) {
        potassium = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('sodium')) {
        sodium = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('zinc')) {
        zinc = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('copper')) {
        copper = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('manganese')) {
        manganese = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('selenium')) {
        selenium = parseFloat(trimmedLine.split(':')[1].trim());
      } else if (trimmedLine.toLowerCase().includes('nutritional profile:')) {
        // Mark the start of nutritional profile section
        const profileStartIndex = lines.indexOf(line);
        let profileEndIndex = profileStartIndex;
        let profileText = trimmedLine.substring(trimmedLine.toLowerCase().indexOf('nutritional profile:') + 'nutritional profile:'.length).trim();
        
        // Find where the nutritional profile section ends
        for (let i = profileStartIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i].trim();
          // Stop if we hit a new section header
          if (nextLine.match(/^[A-Z][a-z]+:/) || nextLine === '') {
            profileEndIndex = i - 1;
            break;
          }
          // Otherwise add this line to our nutritional profile text
          profileText += ' ' + nextLine;
          profileEndIndex = i;
        }
        
        // Use the collected text
        if (profileText) {
          nutritionalProfile = profileText;
        }
      } else if (trimmedLine.toLowerCase().includes('health implications:')) {
        // Mark the start of health implications section
        const implStartIndex = lines.indexOf(line);
        let implEndIndex = implStartIndex;
        let implText = trimmedLine.substring(trimmedLine.toLowerCase().indexOf('health implications:') + 'health implications:'.length).trim();
        
        // Find where the health implications section ends
        for (let i = implStartIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i].trim();
          // Stop if we hit a new section header
          if (nextLine.match(/^[A-Z][a-z]+:/) || nextLine === '') {
            implEndIndex = i - 1;
            break;
          }
          // Otherwise add this line to our health implications text
          implText += ' ' + nextLine;
          implEndIndex = i;
        }
        
        // Use the collected text
        if (implText) {
          healthImplications = implText;
        }
      }
    }

    // If macronutrients not found but we have individual values, construct it
    if (!macronutrients && (protein || carbs || fats || fiber)) {
      macronutrients = [
        protein !== undefined ? `Protein: ${protein}g` : '',
        carbs !== undefined ? `Carbohydrates: ${carbs}g` : '',
        fats !== undefined ? `Fats: ${fats}g` : '',
        fiber !== undefined ? `Fiber: ${fiber}g` : ''
      ].filter(item => item).join('\n');
    }

    return {
      category,
      confidence,
      analysis: analysis.trim() || 'No analysis available',
      processingLevel,
      caloricContent,
      itemsIdentified,
      macronutrients,
      nutritionalProfile,
      healthImplications,
      protein,
      carbs,
      fats,
      fiber,
      calories,
      vitaminA,
      vitaminC,
      vitaminD,
      vitaminE,
      vitaminK,
      vitaminB1,
      vitaminB2,
      vitaminB3,
      vitaminB6,
      vitaminB12,
      folate,
      calcium,
      iron,
      magnesium,
      phosphorus,
      potassium,
      sodium,
      zinc,
      copper,
      manganese,
      selenium,
    };
  } catch (error) {
    console.error('Error parsing analysis:', error);
    return {
      category: 'Unknown',
      confidence: 0,
      analysis: 'Failed to parse analysis. Please try again.'
    };
  }
}