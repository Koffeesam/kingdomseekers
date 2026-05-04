import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'en' | 'sw' | 'fr' | 'es';

const dict: Record<Lang, Record<string, string>> = {
  en: {
    settings: 'Settings',
    dark_mode: 'Dark Mode',
    dark_mode_sub: 'Easier on the eyes',
    notifications: 'Notifications',
    notifications_sub: 'Prayers, messages, live alerts',
    language: 'Language',
    language_sub: 'App display language',
    logout: 'Log out',
    holy_bible: 'Holy Bible',
    old_testament: 'Old Testament',
    new_testament: 'New Testament',
    search_book: 'Search a book…',
    loading: 'Loading…',
    prev: '← Prev',
    next: 'Next →',
    chapters_short: 'ch',
    delete: 'Delete',
    forward: 'Forward',
    copy: 'Copy',
    copied: 'Copied to clipboard',
    deleted: 'Deleted',
    forward_to: 'Forward to',
    send: 'Send',
    cancel: 'Cancel',
    confirm_delete: 'Delete this post?',
    write_comment: 'Write a comment...',
    share: 'Share',
    share_with_believer: 'Share with a believer',
    shared: 'Shared',
    bible_version_unavailable: 'This translation is not available right now.',
  },
  sw: {
    settings: 'Mipangilio',
    dark_mode: 'Hali ya Giza',
    dark_mode_sub: 'Rahisi kwa macho',
    notifications: 'Arifa',
    notifications_sub: 'Maombi, ujumbe, matangazo ya moja kwa moja',
    language: 'Lugha',
    language_sub: 'Lugha ya programu',
    logout: 'Toka',
    holy_bible: 'Biblia Takatifu',
    old_testament: 'Agano la Kale',
    new_testament: 'Agano Jipya',
    search_book: 'Tafuta kitabu…',
    loading: 'Inapakia…',
    prev: '← Iliyopita',
    next: 'Inayofuata →',
    chapters_short: 'sura',
    delete: 'Futa',
    forward: 'Tuma mbele',
    copy: 'Nakili',
    copied: 'Imenakiliwa',
    deleted: 'Imefutwa',
    forward_to: 'Tuma kwa',
    send: 'Tuma',
    cancel: 'Ghairi',
    confirm_delete: 'Futa chapisho hili?',
    write_comment: 'Andika maoni...',
    share: 'Shiriki',
    share_with_believer: 'Shiriki na muumini',
    shared: 'Imeshirikiwa',
    bible_version_unavailable: 'Tafsiri hii haipatikani sasa.',
  },
  fr: {
    settings: 'Paramètres',
    dark_mode: 'Mode Sombre',
    dark_mode_sub: 'Plus doux pour les yeux',
    notifications: 'Notifications',
    notifications_sub: 'Prières, messages, alertes en direct',
    language: 'Langue',
    language_sub: "Langue d'affichage",
    logout: 'Déconnexion',
    holy_bible: 'Sainte Bible',
    old_testament: 'Ancien Testament',
    new_testament: 'Nouveau Testament',
    search_book: 'Rechercher un livre…',
    loading: 'Chargement…',
    prev: '← Précédent',
    next: 'Suivant →',
    chapters_short: 'ch',
    delete: 'Supprimer',
    forward: 'Transférer',
    copy: 'Copier',
    copied: 'Copié',
    deleted: 'Supprimé',
    forward_to: 'Transférer à',
    send: 'Envoyer',
    cancel: 'Annuler',
    confirm_delete: 'Supprimer cette publication ?',
    write_comment: 'Écrire un commentaire...',
    share: 'Partager',
    share_with_believer: 'Partager avec un croyant',
    shared: 'Partagé',
    bible_version_unavailable: 'Cette traduction n’est pas disponible pour le moment.',
  },
  es: {
    settings: 'Ajustes',
    dark_mode: 'Modo Oscuro',
    dark_mode_sub: 'Más suave para los ojos',
    notifications: 'Notificaciones',
    notifications_sub: 'Oraciones, mensajes, alertas en vivo',
    language: 'Idioma',
    language_sub: 'Idioma de la aplicación',
    logout: 'Cerrar sesión',
    holy_bible: 'Santa Biblia',
    old_testament: 'Antiguo Testamento',
    new_testament: 'Nuevo Testamento',
    search_book: 'Buscar un libro…',
    loading: 'Cargando…',
    prev: '← Anterior',
    next: 'Siguiente →',
    chapters_short: 'cap',
    delete: 'Eliminar',
    forward: 'Reenviar',
    copy: 'Copiar',
    copied: 'Copiado',
    deleted: 'Eliminado',
    forward_to: 'Reenviar a',
    send: 'Enviar',
    cancel: 'Cancelar',
    confirm_delete: '¿Eliminar esta publicación?',
    write_comment: 'Escribe un comentario...',
    share: 'Compartir',
    share_with_believer: 'Compartir con un creyente',
    shared: 'Compartido',
    bible_version_unavailable: 'Esta traducción no está disponible ahora.',
  },
};

// Bible translation IDs that work with bible-api.com per language
const bibleByLang: Record<Lang, string> = {
  en: 'kjv',
  sw: 'kjv', // bible-api lacks Swahili; keep KJV but UI is translated
  fr: 'kjv',
  es: 'rvr1909',
};

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  bibleTranslation: string;
}

const Ctx = createContext<LanguageCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('ks_lang') : null;
    return (stored as Lang) || 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('ks_lang', lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => dict[lang][key] ?? dict.en[key] ?? key;

  return (
    <Ctx.Provider value={{ lang, setLang, t, bibleTranslation: bibleByLang[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang must be used within LanguageProvider');
  return c;
}