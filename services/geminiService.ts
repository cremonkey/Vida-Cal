
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, NutritionAnalysis } from "../types";

export const analyzeMeal = async (
  imageBuffer: string,
  userProfile: UserProfile
): Promise<NutritionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `
    أنت خبير تغذية علاجية محترف. قم بتحليل الوجبة في الصورة المرفقة بناءً على الملف الشخصي للمريض التالي:
    - العمر: ${userProfile.age}
    - الجنس: ${userProfile.gender === 'male' ? 'ذكر' : 'أنثى'}
    - الوزن: ${userProfile.weight} كجم
    - الطول: ${userProfile.height} سم
    - الأمراض المزمنة: ${userProfile.chronicDiseases || 'لا يوجد'}

    يجب أن يتضمن تحليلك:
    1. اسم الوجبة التقريبي.
    2. السعرات الحرارية التقريبية.
    3. المكونات الرئيسية.
    4. نسب البروتين، الكربوهيدرات، الدهون، والألياف (بالجرام).
    5. نصيحة طبية مخصصة بناءً على حالته الصحية.
    6. تحذير طبي إذا كانت الوجبة تشكل خطراً على حالته (مثلاً: عالية السكر لمرضى السكر).
    7. تقييم صحي للوجبة من 0 إلى 100.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBuffer
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealName: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          macronutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER }
            },
            required: ["protein", "carbs", "fats", "fiber"]
          },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          healthScore: { type: Type.NUMBER },
          advice: { type: Type.STRING },
          medicalWarning: { type: Type.STRING }
        },
        required: ["mealName", "calories", "macronutrients", "ingredients", "healthScore", "advice"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return result as NutritionAnalysis;
};
