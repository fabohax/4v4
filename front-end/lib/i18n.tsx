'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

export type Locale = 'en' | 'es' | 'pt';

const messages: Record<Locale, Record<string, string>> = {
  en: {},
  es: {
    'EXPLORE': 'EXPLORAR', 'UPLOAD': 'SUBIR', 'MANAGE': 'GESTIONAR',
    'Open search': 'Abrir búsqueda', 'Marketplace': 'Mercado', 'Resources': 'Recursos',
    'Legal': 'Legal', 'Create': 'Crear', 'Top Collections': 'Colecciones destacadas',
    'Listings': 'Publicaciones', 'Auctions': 'Subastas', 'Calendar': 'Calendario',
    'Newsletter': 'Boletín', 'Learn': 'Aprender', 'Terms of Use': 'Términos de uso',
    'Privacy Policy': 'Política de privacidad', 'Creator Terms of Use': 'Términos de uso para creadores',
    'Support': 'Ayuda', 'Explore, Upload & Sell 3D Assets': 'Explora, sube y vende modelos 3D',
    'Explore': 'Explorar', 'Upload an asset': 'Subir un modelo', 'Explore NFTs': 'Explorar NFT',
    'Search': 'Buscar', 'Search NFTs': 'Buscar NFT', 'Notifications': 'Notificaciones',
    'No notifications yet.': 'Todavía no tienes notificaciones.', 'Welcome!': '¡Te damos la bienvenida!',
    'Thanks for joining our platform.': 'Gracias por unirte a nuestra plataforma.',
    'Profile Updated': 'Perfil actualizado', 'Your profile information was successfully updated.': 'La información de tu perfil se actualizó correctamente.',
    'New Follower': 'Nuevo seguidor', 'You have a new follower: @sketchfan123.': 'Tienes un nuevo seguidor: @sketchfan123.',
    'Password Changed': 'Contraseña cambiada', 'Your password was changed successfully.': 'Tu contraseña se cambió correctamente.',
    'Export Complete': 'Exportación lista', 'Your 3D model export is ready for download.': 'La exportación de tu modelo 3D está lista para descargar.',
    'Contact Us': 'Contáctanos', 'FAQ': 'Preguntas frecuentes', 'How do I reset my password?': '¿Cómo restablezco mi contraseña?',
    'How do I contact support?': '¿Cómo contacto con soporte?', 'Change Password': 'Cambiar contraseña',
    'We usually respond within 24 hours.': 'Normalmente respondemos en un plazo de 24 horas.',
    'English': 'Inglés', 'Spanish': 'Español', 'Language': 'Idioma', 'Send us a message': 'Envíanos un mensaje',
    'Loading NFTs from all users...': 'Cargando NFT de todos los usuarios...',
    'No NFTs found yet.': 'Todavía no hay NFT.', 'Be the first community member to mint an NFT!': '¡Sé la primera persona de la comunidad en crear un NFT!',
    'Loading...': 'Cargando...', 'PEOPLE': 'PERSONAS', 'or': 'o', 'Secure Your Wallet': 'Protege tu wallet',
    'Connect Wallet': 'Conectar wallet', 'Need help? Visit Support': '¿Necesitas ayuda? Visita Ayuda',
    'By Signing In, you agree to our': 'Al iniciar sesión, aceptas nuestros',
    'Join the Waitlist': 'Únete a la lista de espera', 'You\'ve been added to the waitlist!': '¡Te añadimos a la lista de espera!',
    'Check your email for confirmation.': 'Revisa tu correo para confirmar.',
    'Connect Your Wallet': 'Conecta tu wallet', 'Please connect your wallet to access settings.': 'Conecta tu wallet para acceder a la configuración.',
    'Profile Settings': 'Configuración del perfil', 'Basic Information': 'Información básica', 'Profile Picture': 'Foto de perfil',
    'Username': 'Nombre de usuario', 'Email': 'Correo electrónico', 'Display Name': 'Nombre visible', 'Location': 'Ubicación',
    'Tagline': 'Lema', 'Biography': 'Biografía', 'Social Links': 'Redes sociales', 'Website': 'Sitio web',
    'Professional Information': 'Información profesional', 'Occupation': 'Ocupación', 'Company': 'Empresa',
    'Years of Experience': 'Años de experiencia', 'Skills & Software': 'Habilidades y software',
    'Privacy Settings': 'Privacidad', 'Public Profile': 'Perfil público', 'Make your profile visible to everyone': 'Hacer que tu perfil sea visible para todos',
    'Show Email': 'Mostrar correo', 'Display your email on your public profile': 'Mostrar tu correo en el perfil público',
    'Show Location': 'Mostrar ubicación', 'Display your location on your profile': 'Mostrar tu ubicación en el perfil',
    'Allow Direct Messages': 'Permitir mensajes directos', 'Let other users send you direct messages': 'Permitir que otros usuarios te envíen mensajes directos',
    'Notification Preferences': 'Preferencias de notificaciones', 'Email Notifications': 'Notificaciones por correo',
    'Receive notifications via email': 'Recibir notificaciones por correo', 'Push Notifications': 'Notificaciones push',
    'Receive push notifications in browser': 'Recibir notificaciones push en el navegador', 'Marketing Emails': 'Correos promocionales',
    'Receive updates about new features and promotions': 'Recibir novedades sobre funciones y promociones',
    'Wallet': 'Wallet', 'Receive': 'Recibir', 'Recent Transactions': 'Transacciones recientes',
    'No recent transactions found.': 'No se encontraron transacciones recientes.',
    'Validating recovery link...': 'Validando enlace de recuperación...', 'Recovery Failed': 'Falló la recuperación',
    'Create Your Wallet': 'Crea tu wallet', 'Ready to Create Wallet': 'Listo para crear la wallet',
    'Set Wallet Passphrase': 'Configura la frase de acceso de la wallet', 'Passphrase Requirements': 'Requisitos de la frase de acceso',
    'Where can I find documentation?': '¿Dónde encuentro la documentación?',
    'documentation page': 'página de documentación',
    'Close search': 'Cerrar búsqueda', 'Terms of Service': 'Términos del servicio', 'and': 'y',
    'Please connect your wallet to manage your funds.': 'Conecta tu wallet para administrar tus fondos.',
    'For help, questions, or feedback, email us at': 'Para pedir ayuda, hacer preguntas o enviar comentarios, escríbenos a',
    'Use the form below or email us directly.': 'Usa el formulario de abajo o escríbenos directamente.',
    'Go to': 'Ve a', 'Settings': 'Configuración', 'Visit our': 'Visita nuestra',
    'Send Message': 'Enviar mensaje', 'Message sent!': '¡Mensaje enviado!',
    'Your email': 'Tu correo electrónico', 'How can we help you?': '¿Cómo podemos ayudarte?',
    'Sign In with Email': 'Iniciar sesión con correo', 'Import with Mnemonic': 'Importar con frase de recuperación',
    'Enter your email address': 'Introduce tu correo electrónico', 'Sending...': 'Enviando...',
    'Send Connection Link': 'Enviar enlace de acceso', 'Install →': 'Instalar →',
    'Connect or create your account using your wallet or seed phrase.': 'Conecta o crea tu cuenta con tu wallet o frase de recuperación.',
    'Discover 3D assets, publish your work to IPFS, and sell directly to collectors.': 'Descubre modelos 3D, publica tu trabajo en IPFS y véndelo directamente a coleccionistas.',
    'Loading 3D Model...': 'Cargando modelo 3D...', 'Processing user': 'Procesando usuario',
    'Try Again': 'Intentar de nuevo', 'NFTs found': 'NFT encontrados', 'from': 'de', 'of': 'de', 'users': 'usuarios',
    'Mint your first NFT': 'Crea tu primer NFT',
  },
  pt: {
    'EXPLORE': 'EXPLORAR', 'UPLOAD': 'ENVIAR', 'MANAGE': 'GERENCIAR',
    'Open search': 'Abrir busca', 'Marketplace': 'Mercado', 'Resources': 'Recursos', 'Legal': 'Legal',
    'Create': 'Criar', 'Top Collections': 'Principais coleções', 'Listings': 'Anúncios', 'Auctions': 'Leilões',
    'Calendar': 'Calendário', 'Newsletter': 'Boletim informativo', 'Learn': 'Aprender', 'Terms of Use': 'Termos de uso',
    'Privacy Policy': 'Política de privacidade', 'Creator Terms of Use': 'Termos de uso para criadores',
    'Support': 'Suporte', 'Explore, Upload & Sell 3D Assets': 'Explore, envie e venda modelos 3D',
    'Explore': 'Explorar', 'Upload an asset': 'Enviar um modelo', 'Explore NFTs': 'Explorar NFTs', 'Search': 'Buscar',
    'Search NFTs': 'Buscar NFTs', 'Notifications': 'Notificações', 'No notifications yet.': 'Você ainda não tem notificações.',
    'Welcome!': 'Boas-vindas!', 'Thanks for joining our platform.': 'Agradecemos por entrar na nossa plataforma.',
    'Contact Us': 'Entre em contato', 'FAQ': 'Perguntas frequentes', 'How do I reset my password?': 'Como redefino minha senha?',
    'How do I contact support?': 'Como entro em contato com o suporte?', 'Change Password': 'Alterar senha',
    'We usually respond within 24 hours.': 'Normalmente respondemos em até 24 horas.', 'English': 'Inglês',
    'Spanish': 'Espanhol', 'Language': 'Idioma', 'Send us a message': 'Envie uma mensagem',
    'Loading...': 'Carregando...', 'PEOPLE': 'PESSOAS', 'or': 'ou', 'Connect Wallet': 'Conectar carteira',
    'Connect Your Wallet': 'Conecte sua carteira', 'Please connect your wallet to access settings.': 'Conecte sua carteira para acessar as configurações.',
    'Profile Settings': 'Configurações do perfil', 'Basic Information': 'Informações básicas', 'Profile Picture': 'Foto do perfil',
    'Username': 'Nome de usuário', 'Email': 'E-mail', 'Display Name': 'Nome de exibição', 'Location': 'Localização',
    'Tagline': 'Slogan', 'Biography': 'Biografia', 'Social Links': 'Redes sociais', 'Website': 'Site',
    'Professional Information': 'Informações profissionais', 'Occupation': 'Profissão', 'Company': 'Empresa',
    'Years of Experience': 'Anos de experiência', 'Skills & Software': 'Habilidades e softwares',
    'Privacy Settings': 'Configurações de privacidade', 'Public Profile': 'Perfil público',
    'Make your profile visible to everyone': 'Deixe seu perfil visível para todos', 'Show Email': 'Mostrar e-mail',
    'Display your email on your public profile': 'Exibir seu e-mail no perfil público', 'Show Location': 'Mostrar localização',
    'Display your location on your profile': 'Exibir sua localização no perfil', 'Allow Direct Messages': 'Permitir mensagens diretas',
    'Let other users send you direct messages': 'Permitir que outras pessoas enviem mensagens diretas',
    'Notification Preferences': 'Preferências de notificação', 'Email Notifications': 'Notificações por e-mail',
    'Receive notifications via email': 'Receber notificações por e-mail', 'Push Notifications': 'Notificações push',
    'Receive push notifications in browser': 'Receber notificações push no navegador', 'Marketing Emails': 'E-mails promocionais',
    'Receive updates about new features and promotions': 'Receber novidades sobre recursos e promoções',
    'Wallet': 'Carteira', 'Receive': 'Receber', 'Recent Transactions': 'Transações recentes',
    'No recent transactions found.': 'Nenhuma transação recente encontrada.', 'Where can I find documentation?': 'Onde encontro a documentação?',
    'Close search': 'Fechar busca', 'Terms of Service': 'Termos de serviço', 'and': 'e',
    'Please connect your wallet to manage your funds.': 'Conecte sua carteira para gerenciar seus fundos.',
    'Go to': 'Acesse', 'Settings': 'Configurações', 'Visit our': 'Acesse nossa', 'Send Message': 'Enviar mensagem',
    'Message sent!': 'Mensagem enviada!', 'Your email': 'Seu e-mail', 'How can we help you?': 'Como podemos ajudar?',
    'Discover 3D assets, publish your work to IPFS, and sell directly to collectors.': 'Descubra modelos 3D, publique seu trabalho no IPFS e venda diretamente para colecionadores.',
    'Loading 3D Model...': 'Carregando modelo 3D...', 'Processing user': 'Processando usuário',
    'Try Again': 'Tentar novamente', 'NFTs found': 'NFTs encontrados', 'from': 'de', 'of': 'de', 'users': 'usuários',
    'Mint your first NFT': 'Crie seu primeiro NFT', 'By Signing In, you agree to our': 'Ao entrar, você concorda com nossos',
    'Connect or create your account using your wallet or seed phrase.': 'Conecte ou crie sua conta usando sua carteira ou frase-semente.',
    'Enter your email address': 'Digite seu endereço de e-mail', 'Export Complete': 'Exportação concluída',
    'For help, questions, or feedback, email us at': 'Para obter ajuda, tirar dúvidas ou enviar comentários, escreva para',
    'Import with Mnemonic': 'Importar com frase mnemônica', 'Loading NFTs from all users...': 'Carregando NFTs de todos os usuários...',
    'Need help? Visit Support': 'Precisa de ajuda? Acesse o suporte', 'New Follower': 'Novo seguidor',
    'Password Changed': 'Senha alterada', 'Profile Updated': 'Perfil atualizado', 'Send Connection Link': 'Enviar link de acesso',
    'Sending...': 'Enviando...', 'Sign In with Email': 'Entrar com e-mail',
    'Use the form below or email us directly.': 'Use o formulário abaixo ou envie um e-mail diretamente.',
    'You have a new follower: @sketchfan123.': 'Você tem um novo seguidor: @sketchfan123.',
    'Your 3D model export is ready for download.': 'A exportação do seu modelo 3D está pronta para baixar.',
    'Your password was changed successfully.': 'Sua senha foi alterada com sucesso.',
    'Your profile information was successfully updated.': 'As informações do seu perfil foram atualizadas.',
    'documentation page': 'página de documentação',
  },
};

type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (text: string) => string };
const I18nContext = createContext<I18nContextValue>({ locale: 'en', setLocale: () => {}, t: (text) => text });
const LOCALE_STORAGE_KEY = '4v4-locale';
const LOCALE_CHANGE_EVENT = '4v4-locale-change';

function getClientLocale(): Locale {
  if (/^\/(es|pt)(?:\/|$)/.test(window.location.pathname)) {
    return window.location.pathname.split('/')[1] as Locale;
  }

  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'es' || saved === 'pt') return saved;
  } catch {
    // Fall back to the browser language when local storage is unavailable.
  }

  const preferredLanguage = navigator.languages?.[0] ?? navigator.language;
  const language = preferredLanguage.toLowerCase().split('-')[0];
  return language === 'es' || language === 'pt' ? language : 'en';
}

function subscribeToLocaleChanges(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useSyncExternalStore<Locale>(subscribeToLocaleChanges, getClientLocale, () => 'en');

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'es' ? '4V4 - Hazlo tú mismo' : locale === 'pt' ? '4V4 - Faça você mesmo' : '4V4 - Do It Yourself';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      'content',
      locale === 'es' ? 'Descubre y compra modelos 3D en Bitcoin' : locale === 'pt' ? 'Descubra e compre modelos 3D no Bitcoin' : 'Find & Buy 3D NFTs on Bitcoin',
    );
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // The current page still updates even when the preference cannot persist.
    }
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const currentPath = window.location.pathname;
    const currentLocalePrefix = currentPath.match(/^\/(es|pt)(?:\/|$)/)?.[1];
    const unprefixedPath = currentLocalePrefix
      ? currentPath === `/${currentLocalePrefix}` ? '/' : currentPath.slice(currentLocalePrefix.length + 1)
      : currentPath;
    const nextPath = next !== 'en'
      ? `/${next}${unprefixedPath === '/' ? '' : unprefixedPath}`
      : unprefixedPath;
    if (nextPath !== currentPath) router.replace(`${nextPath}${window.location.search}${window.location.hash}`);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, [router]);
  const value = useMemo(() => ({ locale, setLocale, t: (text: string) => messages[locale][text] ?? text }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
