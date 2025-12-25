
import { Language } from '../types';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const dictionary: Translations = {
  en: {
    'landing.title': 'Code with Intelligence.',
    'landing.subtitle': 'The most advanced AI-native code editor. Build software faster with an autonomous team of agents.',
    'landing.getStarted': 'Get Started Free',
    'landing.login': 'Sign In',
    'landing.features': 'Features',
    'landing.pricing': 'Pricing',
    'feature.ai': 'AI Native',
    'feature.ai.desc': 'Built from the ground up with Gemini 1.5 Pro.',
    'feature.speed': 'Lightning Fast',
    'feature.speed.desc': 'Optimized for web assembly performance.',
    'feature.collab': 'Team Sync',
    'feature.collab.desc': 'Real-time collaboration with AI agents.',
    'dashboard.welcome': 'Welcome back,',
    'dashboard.newProject': 'New Project',
    'dashboard.projects': 'Your Projects',
    'dashboard.noProjects': 'No projects found.',
    'auth.loginTitle': 'Sign In',
    'auth.registerTitle': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.submit': 'Continue',
    'auth.switchRegister': 'No account? Sign up',
    'auth.switchLogin': 'Have an account? Sign in',
    'settings.title': 'Preferences',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
  },
  tr: {
    'landing.title': 'Zeka ile Kodla.',
    'landing.subtitle': 'En gelişmiş yapay zeka tabanlı kod editörü. Otonom ajanlardan oluşan bir takımla yazılımı daha hızlı inşa et.',
    'landing.getStarted': 'Ücretsiz Başla',
    'landing.login': 'Giriş Yap',
    'landing.features': 'Özellikler',
    'landing.pricing': 'Fiyatlandırma',
    'feature.ai': 'Yapay Zeka Yerel',
    'feature.ai.desc': 'Gemini 1.5 Pro ile sıfırdan inşa edildi.',
    'feature.speed': 'Şimşek Hızı',
    'feature.speed.desc': 'Web Assembly performansı için optimize edildi.',
    'feature.collab': 'Takım Senkronu',
    'feature.collab.desc': 'Yapay zeka ajanlarıyla gerçek zamanlı işbirliği.',
    'dashboard.welcome': 'Tekrar hoşgeldin,',
    'dashboard.newProject': 'Yeni Proje',
    'dashboard.projects': 'Projelerin',
    'dashboard.noProjects': 'Henüz bir proje yok.',
    'auth.loginTitle': 'Giriş Yap',
    'auth.registerTitle': 'Hesap Oluştur',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.name': 'Ad Soyad',
    'auth.submit': 'Devam Et',
    'auth.switchRegister': 'Hesabın yok mu? Kayıt ol',
    'auth.switchLogin': 'Hesabın var mı? Giriş yap',
    'settings.title': 'Tercihler',
    'settings.appearance': 'Görünüm',
    'settings.language': 'Dil',
    'settings.light': 'Aydınlık',
    'settings.dark': 'Karanlık',
  }
};

export const t = (lang: Language, key: string): string => {
  return dictionary[lang][key] || key;
};
