/**
 * Vida Cal - Main Application
 * التطبيق الرئيسي لتحليل الوجبات
 */

// حالات التطبيق
const AppState = {
    WELCOME: 'WELCOME',
    PROFILE_SETUP: 'PROFILE_SETUP',
    DASHBOARD: 'DASHBOARD',
    ANALYZING: 'ANALYZING',
    RESULT: 'RESULT'
};

// الحالة الحالية
let currentState = AppState.WELCOME;
let userProfile = null;
let currentAnalysis = null;
let capturedImage = null;
let pieChart = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // تحميل الملف الشخصي المحفوظ
    const savedProfile = localStorage.getItem('vida_cal_profile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
        setState(AppState.DASHBOARD);
    } else {
        setState(AppState.WELCOME);
    }

    // إعداد المستمعين للأحداث
    setupEventListeners();
}

function setupEventListeners() {
    // زر البدء
    document.getElementById('startBtn').addEventListener('click', () => {
        setState(AppState.PROFILE_SETUP);
    });

    // نموذج الملف الشخصي
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);

    // منطقة رفع الصور
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);

    // زر الرجوع
    document.getElementById('backBtn').addEventListener('click', handleBack);

    // زر تعديل الملف
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        setState(AppState.PROFILE_SETUP);
    });

    // زر مسح البيانات
    document.getElementById('clearDataBtn').addEventListener('click', clearProfile);

    // زر تصوير وجبة جديدة
    document.getElementById('newMealBtn').addEventListener('click', resetAnalysis);
}

function setState(newState) {
    currentState = newState;
    updateUI();
}

function updateUI() {
    // إخفاء جميع الشاشات
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // إخفاء زر الرجوع
    document.getElementById('backBtn').classList.remove('visible');

    // إخفاء الشريط السفلي
    document.getElementById('bottomBar').classList.remove('visible');

    switch (currentState) {
        case AppState.WELCOME:
            document.getElementById('welcomeScreen').classList.add('active');
            break;

        case AppState.PROFILE_SETUP:
            document.getElementById('profileScreen').classList.add('active');
            if (userProfile) {
                document.getElementById('backBtn').classList.add('visible');
                fillProfileForm();
            }
            break;

        case AppState.DASHBOARD:
            document.getElementById('dashboardScreen').classList.add('active');
            updateDashboard();
            break;

        case AppState.ANALYZING:
            document.getElementById('analyzingScreen').classList.add('active');
            break;

        case AppState.RESULT:
            document.getElementById('resultScreen').classList.add('active');
            document.getElementById('backBtn').classList.add('visible');
            document.getElementById('bottomBar').classList.add('visible');
            displayResult();
            break;
    }
}

function handleProfileSubmit(e) {
    e.preventDefault();

    userProfile = {
        name: document.getElementById('nameInput').value,
        age: parseInt(document.getElementById('ageInput').value),
        gender: document.getElementById('genderSelect').value,
        weight: parseInt(document.getElementById('weightInput').value),
        height: parseInt(document.getElementById('heightInput').value),
        chronicDiseases: document.getElementById('diseasesInput').value
    };

    localStorage.setItem('vida_cal_profile', JSON.stringify(userProfile));
    setState(AppState.DASHBOARD);
}

function fillProfileForm() {
    if (userProfile) {
        document.getElementById('nameInput').value = userProfile.name || '';
        document.getElementById('ageInput').value = userProfile.age || 30;
        document.getElementById('genderSelect').value = userProfile.gender || 'male';
        document.getElementById('weightInput').value = userProfile.weight || 70;
        document.getElementById('heightInput').value = userProfile.height || 170;
        document.getElementById('diseasesInput').value = userProfile.chronicDiseases || '';
    }
}

function updateDashboard() {
    if (userProfile) {
        document.getElementById('greetingName').textContent = userProfile.name;
        document.getElementById('profileAge').textContent = `${userProfile.age} عام`;
        document.getElementById('profileWeight').textContent = `${userProfile.weight} كجم`;
    }
}

async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    const reader = new FileReader();
    reader.onload = async () => {
        const base64Full = reader.result;
        const base64Data = base64Full.split(',')[1];
        capturedImage = base64Full;

        setState(AppState.ANALYZING);

        try {
            // التحقق من مفتاح API
            const storedKey = window.GeminiService.getStoredApiKey();
            if (storedKey) {
                // استخدام المفتاح المحفوظ (تحديث في الخدمة)
            }

            currentAnalysis = await window.GeminiService.analyzeMeal(base64Data, userProfile);
            setState(AppState.RESULT);
        } catch (error) {
            console.error('خطأ في التحليل:', error);
            alert('حدث خطأ أثناء التحليل، يرجى المحاولة مرة أخرى.\n' + error.message);
            setState(AppState.DASHBOARD);
        }
    };
    reader.readAsDataURL(file);

    // إعادة تعيين حقل الملف للسماح بإعادة اختيار نفس الملف
    e.target.value = '';
}

function displayResult() {
    if (!currentAnalysis || !capturedImage) return;

    // عرض الصورة
    document.getElementById('mealImage').src = capturedImage;
    document.getElementById('mealName').textContent = currentAnalysis.mealName;

    // عرض السعرات والتقييم
    document.getElementById('caloriesValue').textContent = currentAnalysis.calories;
    document.getElementById('healthScoreValue').textContent = `${currentAnalysis.healthScore}/100`;
    document.getElementById('healthProgressBar').style.width = `${currentAnalysis.healthScore}%`;

    // عرض التحذير الطبي إن وجد
    const warningSection = document.getElementById('medicalWarning');
    if (currentAnalysis.medicalWarning) {
        document.getElementById('warningText').textContent = currentAnalysis.medicalWarning;
        warningSection.style.display = 'flex';
    } else {
        warningSection.style.display = 'none';
    }

    // عرض النصيحة
    document.getElementById('adviceText').textContent = currentAnalysis.advice;

    // عرض المكونات
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';
    currentAnalysis.ingredients.forEach(ing => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';
        li.innerHTML = `<span class="ingredient-dot"></span>${ing}`;
        ingredientsList.appendChild(li);
    });

    // رسم الرسم البياني
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('nutritionChart').getContext('2d');

    // تدمير الرسم البياني السابق إن وجد
    if (pieChart) {
        pieChart.destroy();
    }

    const data = {
        labels: ['بروتين', 'كربوهيدرات', 'دهون', 'ألياف'],
        datasets: [{
            data: [
                currentAnalysis.macronutrients.protein,
                currentAnalysis.macronutrients.carbs,
                currentAnalysis.macronutrients.fats,
                currentAnalysis.macronutrients.fiber
            ],
            backgroundColor: ['#FFD700', '#3b82f6', '#ef4444', '#10b981'],
            borderWidth: 0
        }]
    };

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: {
                            family: 'Segoe UI, Cairo, Tajawal, sans-serif'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: '#001f3f',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    titleColor: '#d4af37',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw} جرام`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function handleBack() {
    if (currentState === AppState.RESULT) {
        resetAnalysis();
    } else if (currentState === AppState.PROFILE_SETUP && userProfile) {
        setState(AppState.DASHBOARD);
    }
}

function resetAnalysis() {
    currentAnalysis = null;
    capturedImage = null;
    setState(AppState.DASHBOARD);
}

function clearProfile() {
    localStorage.removeItem('vida_cal_profile');
    userProfile = null;
    setState(AppState.PROFILE_SETUP);
}
