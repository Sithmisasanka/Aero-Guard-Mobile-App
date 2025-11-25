import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYMPTOMS, RECOMMENDATIONS, getRecommendationsForSymptoms, analyzeSymptomSeverity, Symptom, Recommendation } from '../data/symptomData';

export interface SymptomAnalysisRequest {
  symptoms: string[];
  currentAQI: number;
  location?: string;
  userAge?: number;
  preExistingConditions?: string[];
  additionalContext?: string;
}

export interface SymptomAnalysisResponse {
  analysis: {
    severity: 'mild' | 'moderate' | 'severe';
    likelyRelatedToAir: boolean;
    urgentCareNeeded: boolean;
    confidence: number;
    summary: string;
  };
  recommendations: {
    immediate: Recommendation[];
    prevention: Recommendation[];
    lifestyle: Recommendation[];
    medical: Recommendation[];
  };
  educationalInfo: {
    aboutSymptoms: string;
    airQualityConnection: string;
    pollutantsOfConcern: string[];
  };
  source: 'gemini' | 'local';
  timestamp: string;
}

class GeminiAISymptomService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. Service will use local fallback only.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  /**
   * Analyze symptoms using Gemini AI with local fallback
   */
  async analyzeSymptoms(request: SymptomAnalysisRequest): Promise<SymptomAnalysisResponse> {
    // Try Gemini AI first
    if (this.model) {
      try {
        const geminiResponse = await this.analyzeWithGemini(request);
        if (geminiResponse) {
          return geminiResponse;
        }
      } catch (error) {
        console.warn('Gemini AI analysis failed, falling back to local analysis:', error);
      }
    }

    // Fallback to local analysis
    return this.analyzeWithLocalData(request);
  }

  /**
   * Analyze symptoms using Gemini AI
   */
  private async analyzeWithGemini(request: SymptomAnalysisRequest): Promise<SymptomAnalysisResponse | null> {
    try {
      const prompt = this.buildGeminiPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse Gemini response and combine with local recommendations
      return this.parseGeminiResponse(text, request);
    } catch (error) {
      console.error('Gemini AI request failed:', error);
      return null;
    }
  }

  /**
   * Build prompt for Gemini AI
   */
  private buildGeminiPrompt(request: SymptomAnalysisRequest): string {
    const { symptoms, currentAQI, location, userAge, preExistingConditions, additionalContext } = request;
    
    const contextInfo = `
Current Air Quality Index: ${currentAQI}
Location: ${location || 'Not specified'}
User Age: ${userAge || 'Not specified'}
Pre-existing Conditions: ${preExistingConditions?.join(', ') || 'None specified'}
Additional Context: ${additionalContext || 'None'}
`;

    const symptomsText = symptoms.join(', ');

    return `You are an AI health assistant specializing in air quality-related health impacts. 
    
Please analyze the following symptoms in the context of air pollution exposure:

Reported Symptoms: ${symptomsText}
${contextInfo}

Provide a JSON response with the following structure:
{
  "analysis": {
    "severity": "mild|moderate|severe",
    "likelyRelatedToAir": boolean,
    "urgentCareNeeded": boolean,
    "confidence": number (0-100),
    "summary": "Brief explanation of the analysis"
  },
  "educationalInfo": {
    "aboutSymptoms": "Explanation of how these symptoms relate to air quality",
    "airQualityConnection": "How current AQI levels might be affecting health",
    "pollutantsOfConcern": ["list", "of", "specific", "pollutants"]
  }
}

Focus on:
1. Whether symptoms are likely related to current air quality
2. Severity assessment based on AQI and symptom combination
3. Educational information about air pollution health effects
4. Whether immediate medical attention is recommended

Be medically responsible - always err on the side of caution for serious symptoms.`;
  }

  /**
   * Parse Gemini AI response and combine with local recommendations
   */
  private parseGeminiResponse(geminiText: string, request: SymptomAnalysisRequest): SymptomAnalysisResponse {
    try {
      // Extract JSON from Gemini response
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const geminiData = JSON.parse(jsonMatch[0]);
      
      // Get symptom IDs from symptom names
      const symptomIds = this.mapSymptomsToIds(request.symptoms);
      
      // Get local recommendations
      const localRecommendations = getRecommendationsForLocalAnalysis(symptomIds, request.currentAQI);
      
      // Combine Gemini analysis with local recommendations
      return {
        analysis: {
          severity: geminiData.analysis.severity || 'moderate',
          likelyRelatedToAir: geminiData.analysis.likelyRelatedToAir || true,
          urgentCareNeeded: geminiData.analysis.urgentCareNeeded || false,
          confidence: geminiData.analysis.confidence || 85,
          summary: geminiData.analysis.summary || 'AI analysis completed'
        },
        recommendations: localRecommendations,
        educationalInfo: {
          aboutSymptoms: geminiData.educationalInfo.aboutSymptoms || 'Symptoms may be related to air quality.',
          airQualityConnection: geminiData.educationalInfo.airQualityConnection || 'Current air quality may be affecting your health.',
          pollutantsOfConcern: geminiData.educationalInfo.pollutantsOfConcern || ['PM2.5', 'Ozone']
        },
        source: 'gemini',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      // Fallback to local analysis if parsing fails
      return this.analyzeWithLocalData(request);
    }
  }

  /**
   * Analyze symptoms using local data only
   */
  private analyzeWithLocalData(request: SymptomAnalysisRequest): SymptomAnalysisResponse {
    const symptomIds = this.mapSymptomsToIds(request.symptoms);
    const severityAnalysis = analyzeSymptomSeverity(symptomIds);
    const recommendations = getRecommendationsForLocalAnalysis(symptomIds, request.currentAQI);

    // Determine if symptoms are likely air quality related
    const matchedSymptoms = SYMPTOMS.filter(s => symptomIds.includes(s.id));
    const airQualityRelated = matchedSymptoms.some(symptom => 
      Object.values(symptom.relatedAQI).some(range => 
        request.currentAQI >= Math.min(...range) && request.currentAQI <= Math.max(...range)
      )
    );

    // Generate educational info based on matched symptoms
    const educationalInfo = this.generateLocalEducationalInfo(matchedSymptoms, request.currentAQI);

    return {
      analysis: {
        severity: severityAnalysis.overallSeverity,
        likelyRelatedToAir: airQualityRelated,
        urgentCareNeeded: severityAnalysis.urgentCare,
        confidence: 75, // Local analysis confidence
        summary: this.generateLocalSummary(severityAnalysis, airQualityRelated, request.currentAQI)
      },
      recommendations,
      educationalInfo,
      source: 'local',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Map symptom strings to symptom IDs
   */
  private mapSymptomsToIds(symptoms: string[]): string[] {
    return symptoms.map(symptom => {
      const normalizedSymptom = symptom.toLowerCase().trim();
      
      // Direct matches
      const directMatch = SYMPTOMS.find(s => 
        s.name.toLowerCase() === normalizedSymptom ||
        s.id === normalizedSymptom
      );
      if (directMatch) return directMatch.id;

      // Fuzzy matching for common variations
      if (normalizedSymptom.includes('cough') && normalizedSymptom.includes('dry')) return 'cough_dry';
      if (normalizedSymptom.includes('cough') && (normalizedSymptom.includes('mucus') || normalizedSymptom.includes('phlegm'))) return 'cough_productive';
      if (normalizedSymptom.includes('breath') || normalizedSymptom.includes('breathing')) return 'shortness_breath';
      if (normalizedSymptom.includes('wheez')) return 'wheezing';
      if (normalizedSymptom.includes('chest') && normalizedSymptom.includes('tight')) return 'chest_tightness';
      if (normalizedSymptom.includes('eye') && normalizedSymptom.includes('irritat')) return 'eye_irritation';
      if (normalizedSymptom.includes('eye') && normalizedSymptom.includes('water')) return 'watery_eyes';
      if (normalizedSymptom.includes('skin') && normalizedSymptom.includes('irritat')) return 'skin_irritation';
      if (normalizedSymptom.includes('heart') && (normalizedSymptom.includes('palpitat') || normalizedSymptom.includes('racing'))) return 'heart_palpitations';
      if (normalizedSymptom.includes('headache') || normalizedSymptom.includes('head')) return 'headache';
      if (normalizedSymptom.includes('dizz') || normalizedSymptom.includes('lightheaded')) return 'dizziness';
      if (normalizedSymptom.includes('fatigue') || normalizedSymptom.includes('tired')) return 'fatigue';
      if (normalizedSymptom.includes('nausea') || normalizedSymptom.includes('sick')) return 'nausea';

      // Default fallback
      return 'cough_dry'; // Most common air quality symptom
    }).filter(Boolean);
  }

  /**
   * Generate local educational information
   */
  private generateLocalEducationalInfo(symptoms: Symptom[], currentAQI: number) {
    const categories = [...new Set(symptoms.map(s => s.category))];
    const pollutants = [...new Set(symptoms.flatMap(s => Object.keys(s.relatedAQI)))];

    let aqiLevel = 'Good';
    if (currentAQI > 300) aqiLevel = 'Hazardous';
    else if (currentAQI > 200) aqiLevel = 'Very Unhealthy';
    else if (currentAQI > 150) aqiLevel = 'Unhealthy';
    else if (currentAQI > 100) aqiLevel = 'Unhealthy for Sensitive Groups';
    else if (currentAQI > 50) aqiLevel = 'Moderate';

    return {
      aboutSymptoms: `Your ${categories.join(' and ')} symptoms may be related to current air quality conditions. These symptoms commonly occur when air pollution levels are elevated.`,
      airQualityConnection: `Current AQI of ${currentAQI} is in the "${aqiLevel}" range. This level of air pollution can trigger or worsen respiratory and other health symptoms, especially in sensitive individuals.`,
      pollutantsOfConcern: pollutants.map(p => {
        switch (p) {
          case 'pm25': return 'PM2.5 (Fine Particles)';
          case 'pm10': return 'PM10 (Coarse Particles)';
          case 'ozone': return 'Ground-level Ozone';
          case 'no2': return 'Nitrogen Dioxide';
          case 'so2': return 'Sulfur Dioxide';
          case 'co': return 'Carbon Monoxide';
          default: return p;
        }
      })
    };
  }

  /**
   * Generate local analysis summary
   */
  private generateLocalSummary(severityAnalysis: any, airQualityRelated: boolean, currentAQI: number): string {
    let summary = `Based on your symptoms, this appears to be a ${severityAnalysis.overallSeverity} condition. `;
    
    if (airQualityRelated) {
      summary += `Your symptoms are likely related to the current air quality (AQI: ${currentAQI}). `;
    }
    
    if (severityAnalysis.urgentCare) {
      summary += `Due to the severity of your symptoms, consider seeking medical attention. `;
    }
    
    summary += `Follow the recommended precautions to protect your health.`;
    
    return summary;
  }
}

/**
 * Get recommendations organized by type for local analysis
 */
function getRecommendationsForLocalAnalysis(symptomIds: string[], currentAQI: number) {
  const allRecommendations = getRecommendationsForSymptoms(symptomIds, currentAQI);
  
  return {
    immediate: allRecommendations.filter(r => r.type === 'immediate'),
    prevention: allRecommendations.filter(r => r.type === 'prevention'),
    lifestyle: allRecommendations.filter(r => r.type === 'lifestyle'),
    medical: allRecommendations.filter(r => r.type === 'medical')
  };
}

// Export singleton instance
export const geminiSymptomService = new GeminiAISymptomService();