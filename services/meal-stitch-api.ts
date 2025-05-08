import { showAlert } from '@/utils/alert';

// Types
export interface AnalysisResponse {
  status: string;
  analysis: string;
  timestamp: string;
}

export interface AnalysisRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
  }>;
}

export interface ParsedAnalysis {
  category: string;
  confidence: string;
  itemsIdentified: string;
  caloricContent: string;
  macronutrients: string;
  processingLevel: string;
  nutritionalProfile: string;
  healthImplications: string;
  portionConsiderations: string;
  imageIndex: number;
}

interface SummaryResponse {
  status: string;
  synthesis: string;
  timestamp: string;
}

const BASE_URL = 'https://image-stitch.vercel.app/api';

const parseAnalysis = (analysis: string): ParsedAnalysis => {
  const lines = analysis.split('\n');
  const parsed: Partial<ParsedAnalysis> = {};
  
  lines.forEach(line => {
    if (line.startsWith('Category:')) parsed.category = line.replace('Category:', '').trim();
    if (line.startsWith('Confidence:')) parsed.confidence = line.replace('Confidence:', '').trim();
    if (line.startsWith('Items Identified:')) parsed.itemsIdentified = line.replace('Items Identified:', '').trim();
    if (line.startsWith('Caloric Content:')) parsed.caloricContent = line.replace('Caloric Content:', '').trim();
    if (line.startsWith('Macronutrients:')) parsed.macronutrients = line.replace('Macronutrients:', '').trim();
    if (line.startsWith('Processing Level:')) parsed.processingLevel = line.replace('Processing Level:', '').trim();
    if (line.startsWith('Nutritional Profile:')) parsed.nutritionalProfile = line.replace('Nutritional Profile:', '').trim();
    if (line.startsWith('Health Implications:')) parsed.healthImplications = line.replace('Health Implications:', '').trim();
    if (line.startsWith('Portion Considerations:')) parsed.portionConsiderations = line.replace('Portion Considerations:', '').trim();
    if (line.startsWith('ImageIndex:')) parsed.imageIndex = parseInt(line.replace('ImageIndex:', '').trim());
  });

  return parsed as ParsedAnalysis;
};

export const analyzeMealStitchItem = async (base64Image: string, itemNumber: number): Promise<AnalysisResponse & { parsed: ParsedAnalysis }> => {
  try {
    // Ensure the image has the correct data URL prefix
    const formattedImage = base64Image.startsWith('data:image/') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const requestBody: AnalysisRequest = {
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            type: 'analysis_request',
            image: formattedImage
          })
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/llm-${itemNumber}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze item ${itemNumber}`);
    }

    const data = await response.json();
    return {
      ...data,
      parsed: parseAnalysis(data.analysis)
    };
  } catch (error) {
    showAlert({
      title: 'Analysis Error',
      message: `Failed to analyze item ${itemNumber}. Please try again.`,
    });
    throw error;
  }
};

export const analyzeMealStitch = async (images: (string | null)[], itemCount: number): Promise<(AnalysisResponse & { parsed: ParsedAnalysis })[]> => {
  try {
    const promises: Promise<AnalysisResponse & { parsed: ParsedAnalysis }>[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const image = images[i];
      if (image) {
        promises.push(analyzeMealStitchItem(image, i + 1));
      }
    }

    const responses = await Promise.all(promises);
    return responses;
  } catch (error) {
    showAlert({
      title: 'Analysis Error',
      message: 'Failed to analyze the complete meal. Please try again.',
    });
    throw error;
  }
};

export const summarizeMealAnalysis = async (analyses: (AnalysisResponse & { parsed: ParsedAnalysis })[]): Promise<SummaryResponse> => {
  try {
    const requestBody = {
      responses: {
        items: JSON.stringify(analyses.map(analysis => ({
          category: analysis.parsed.category,
          itemsIdentified: analysis.parsed.itemsIdentified,
          caloricContent: analysis.parsed.caloricContent,
          macronutrients: analysis.parsed.macronutrients,
          processingLevel: analysis.parsed.processingLevel,
          nutritionalProfile: analysis.parsed.nutritionalProfile,
          healthImplications: analysis.parsed.healthImplications,
          portionConsiderations: analysis.parsed.portionConsiderations
        })))
      }
    };

    const response = await fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to summarize meal analysis');
    }

    return await response.json();
  } catch (error) {
    showAlert({
      title: 'Summary Error',
      message: 'Failed to summarize the meal analysis. Please try again.',
    });
    throw error;
  }
}; 