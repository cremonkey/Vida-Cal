/**
 * Vida Cal - ChatGPT AI Service
 * خدمة الذكاء الاصطناعي لتحليل الوجبات باستخدام OpenAI
 */

// مفتاح API - يمكنك تغييره هنا
const OPENAI_API_KEY = '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';

/**
 * تحويل الصورة إلى صيغة URL للـ OpenAI
 * @param {string} base64Data - البيانات بصيغة Base64
 * @returns {string}
 */
function getImageUrl(base64Data) {
    return `data:image/jpeg;base64,${base64Data}`;
}

/**
 * تحليل صورة الوجبة باستخدام ChatGPT Vision
 * @param {string} imageBase64 - الصورة بصيغة Base64
 * @param {Object} userProfile - الملف الشخصي للمستخدم
 * @returns {Promise<Object>} - نتيجة التحليل
 */
async function analyzeMeal(imageBase64, userProfile) {
    const systemPrompt = `أنت خبير تغذية علاجية محترف. ستقوم بتحليل صور الوجبات وتقديم معلومات غذائية دقيقة.

يجب أن تجيب دائماً بصيغة JSON فقط بدون أي نص إضافي، بالشكل التالي:
{
    "mealName": "اسم الوجبة بالعربية",
    "calories": رقم السعرات,
    "macronutrients": {
        "protein": رقم البروتين بالجرام,
        "carbs": رقم الكربوهيدرات بالجرام,
        "fats": رقم الدهون بالجرام,
        "fiber": رقم الألياف بالجرام
    },
    "ingredients": ["مكون 1", "مكون 2"],
    "healthScore": رقم من 0 إلى 100,
    "advice": "نصيحة طبية مخصصة",
    "medicalWarning": "تحذير طبي إن وجد أو null"
}`;

    const userPrompt = `قم بتحليل الوجبة في الصورة المرفقة بناءً على الملف الشخصي للمريض التالي:
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

أجب بصيغة JSON فقط.`;

    const requestBody = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: userPrompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: getImageUrl(imageBase64),
                            detail: "high"
                        }
                    }
                ]
            }
        ],
        max_tokens: 2048,
        temperature: 0.4
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'فشل في الاتصال بالخادم');
        }

        const data = await response.json();

        // استخراج النص من الاستجابة
        const responseText = data.choices?.[0]?.message?.content;

        if (!responseText) {
            throw new Error('لم يتم استلام رد من الذكاء الاصطناعي');
        }

        // تنظيف النص وتحويله إلى JSON
        let cleanedText = responseText.trim();

        // إزالة علامات الكود إن وجدت
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
        }
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }

        const result = JSON.parse(cleanedText.trim());

        return result;

    } catch (error) {
        console.error('خطأ في تحليل الوجبة:', error);
        throw error;
    }
}

/**
 * التحقق من صحة مفتاح API
 * @returns {boolean}
 */
function isApiKeyConfigured() {
    return OPENAI_API_KEY && OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY';
}

/**
 * تحديث مفتاح API
 * @param {string} newKey 
 */
function setApiKey(newKey) {
    localStorage.setItem('openai_api_key', newKey);
}

/**
 * الحصول على مفتاح API المحفوظ
 * @returns {string|null}
 */
function getStoredApiKey() {
    return localStorage.getItem('openai_api_key');
}

// تصدير الوظائف للاستخدام العالمي
window.GeminiService = {
    analyzeMeal,
    isApiKeyConfigured,
    setApiKey,
    getStoredApiKey
};
