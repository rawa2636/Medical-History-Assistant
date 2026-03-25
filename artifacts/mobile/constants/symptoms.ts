export interface SymptomSystem {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  symptoms: string[];
  symptomsAr: string[];
}

export const SYMPTOM_SYSTEMS: SymptomSystem[] = [
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    nameAr: "القلب والأوعية الدموية",
    icon: "heart",
    color: "#E53E3E",
    symptoms: ["Chest pain", "Palpitations", "Shortness of breath on exertion", "Ankle swelling", "Syncope/fainting", "Orthopnoea"],
    symptomsAr: ["ألم في الصدر", "خفقان القلب", "ضيق التنفس عند المجهود", "تورم الكاحل", "إغماء", "التنفس الانتصابي"],
  },
  {
    id: "respiratory",
    name: "Respiratory",
    nameAr: "الجهاز التنفسي",
    icon: "wind",
    color: "#3182CE",
    symptoms: ["Cough", "Shortness of breath", "Wheezing", "Haemoptysis", "Chest tightness", "Sputum production"],
    symptomsAr: ["سعال", "ضيق التنفس", "أزيز الصدر", "نفث الدم", "ضيق في الصدر", "إنتاج البلغم"],
  },
  {
    id: "gastrointestinal",
    name: "Gastrointestinal",
    nameAr: "الجهاز الهضمي",
    icon: "activity",
    color: "#D69E2E",
    symptoms: ["Nausea", "Vomiting", "Abdominal pain", "Diarrhoea", "Constipation", "Bloating", "Heartburn", "Difficulty swallowing", "Loss of appetite", "Blood in stool"],
    symptomsAr: ["غثيان", "قيء", "ألم في البطن", "إسهال", "إمساك", "انتفاخ", "حرقة المعدة", "صعوبة في البلع", "فقدان الشهية", "دم في البراز"],
  },
  {
    id: "neurological",
    name: "Neurological",
    nameAr: "الجهاز العصبي",
    icon: "zap",
    color: "#805AD5",
    symptoms: ["Headache", "Dizziness", "Numbness or tingling", "Weakness", "Memory problems", "Visual disturbance", "Seizures", "Difficulty speaking"],
    symptomsAr: ["صداع", "دوخة", "تنميل أو وخز", "ضعف", "مشاكل في الذاكرة", "اضطراب البصر", "نوبات صرع", "صعوبة في الكلام"],
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal",
    nameAr: "العضلات والعظام",
    icon: "layers",
    color: "#DD6B20",
    symptoms: ["Joint pain", "Muscle pain", "Back pain", "Stiffness", "Swelling of joints", "Limited range of motion"],
    symptomsAr: ["ألم في المفاصل", "ألم عضلي", "ألم في الظهر", "تيبس", "تورم المفاصل", "محدودية حركة المفاصل"],
  },
  {
    id: "urological",
    name: "Urological",
    nameAr: "الجهاز البولي",
    icon: "droplet",
    color: "#38A169",
    symptoms: ["Frequent urination", "Painful urination", "Blood in urine", "Difficulty urinating", "Urinary incontinence", "Decreased urine output"],
    symptomsAr: ["كثرة التبول", "ألم عند التبول", "دم في البول", "صعوبة في التبول", "سلس البول", "قلة البول"],
  },
  {
    id: "dermatological",
    name: "Dermatological",
    nameAr: "الجلد",
    icon: "layers",
    color: "#E53E3E",
    symptoms: ["Rash", "Itching", "Skin discolouration", "Hair loss", "Nail changes", "Wounds that won't heal"],
    symptomsAr: ["طفح جلدي", "حكة", "تغير لون الجلد", "تساقط الشعر", "تغيرات في الأظافر", "جروح لا تلتئم"],
  },
  {
    id: "constitutional",
    name: "General / Constitutional",
    nameAr: "الأعراض العامة",
    icon: "thermometer",
    color: "#718096",
    symptoms: ["Fever", "Fatigue", "Weight loss", "Weight gain", "Night sweats", "Loss of appetite", "Generalised weakness"],
    symptomsAr: ["حمى", "إرهاق", "نقص الوزن", "زيادة الوزن", "تعرق ليلي", "فقدان الشهية", "وهن عام"],
  },
  {
    id: "endocrine",
    name: "Endocrine",
    nameAr: "الجهاز الغدي",
    icon: "sun",
    color: "#F6AD55",
    symptoms: ["Excessive thirst", "Excessive urination", "Heat or cold intolerance", "Tremors", "Changes in menstrual cycle"],
    symptomsAr: ["عطش مفرط", "تبول مفرط", "عدم تحمل الحرارة أو البرد", "رعشة", "اضطرابات الدورة الشهرية"],
  },
  {
    id: "psychiatric",
    name: "Psychiatric",
    nameAr: "الصحة النفسية",
    icon: "smile",
    color: "#4299E1",
    symptoms: ["Anxiety", "Depression", "Sleep disturbance", "Mood changes", "Hallucinations", "Concentration difficulties"],
    symptomsAr: ["قلق", "اكتئاب", "اضطراب النوم", "تقلبات المزاج", "هلوسة", "صعوبة في التركيز"],
  },
];
